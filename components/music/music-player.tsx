"use client";

import { useEffect, useRef, useState } from "react";
import { pickNextIndex } from "@/lib/music";
import type { PlayMode, Song } from "@/lib/music";
import CapsuleTabs from "@/components/music/capsule-tabs";
import type { PanelTab } from "@/components/music/capsule-tabs";
import LyricsPanel from "@/components/music/lyrics-panel";
import PlayerCard from "@/components/music/player-card";
import PlaylistPanel from "@/components/music/playlist-panel";
import PlaylistStatus from "@/components/music/playlist-status";

/** 单曲播放详情（/api/music/song 响应，客户端跨曲缓存） */
interface SongDetail {
  url: string;
  lyric: string;
  blocked: boolean;
}

function songDetailUrl(song: Pick<Song, "songmid" | "mediaMid">): string {
  const params = new URLSearchParams({ mid: song.songmid });
  if (song.mediaMid) params.set("mediaMid", song.mediaMid);
  return `/api/music/song?${params.toString()}`;
}

type PlaylistState = "loading" | "ready" | "error" | "not-configured" | "empty";

/**
 * 播放器状态中枢：持有唯一的 <audio> 元素与全部播放状态，
 * 左右两卡均为无状态子组件。页面卸载（离开 /music）即停止播放。
 *
 * 数据流：挂载拉歌单（/api/music/playlist）→ 就绪后按需取当前曲详情
 * （/api/music/song，vkey+歌词）→ VIP/版权受限（blocked）提示并自动跳下一首。
 */
export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const isPlayingRef = useRef(false); // 镜像 isPlaying，供切歌 effect 判断播放意图
  const failCountRef = useRef(0); // 连续失败计数（音频 onError / VIP / 详情失败共用），防自动连播死循环
  const detailMapRef = useRef(new Map<string, SongDetail>()); // 跨曲缓存，切回不用重取
  const currentMidRef = useRef(""); // 竞态保护：只认最新一次点播

  // 供 effect 内异步回调使用的“最新状态”动作：直接引用组件函数会引入
  // lint 依赖与闭包过期问题，经 ref 转发始终取最新渲染的版本
  const applyDetailRef = useRef<(mid: string, detail: SongDetail) => void>(() => {});
  const guardRef = useRef<(reason: string) => void>(() => {});

  const [playlistStatus, setPlaylistStatus] = useState<PlaylistState>("loading");
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlistTitle, setPlaylistTitle] = useState("");
  const [playlistError, setPlaylistError] = useState("");
  const [songDetail, setSongDetail] = useState<{ lyric: string } | null>(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [playlistNonce, setPlaylistNonce] = useState(0); // 歌单重试触发器
  const [songNonce, setSongNonce] = useState(0); // 单曲详情重试触发器
  const [toast, setToast] = useState<string | null>(null); // 轻提示

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playMode, setPlayMode] = useState<PlayMode>("list");
  const [activeTab, setActiveTab] = useState<PanelTab>("lyrics");

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  /** 应用单曲详情：blocked 跳过，否则挂 src 并按播放意图播放 */
  applyDetailRef.current = (mid, detail) => {
    if (currentMidRef.current !== mid) return;
    setFetchingDetail(false);
    if (detail.blocked) {
      guardRef.current("该歌曲受版权保护，无法播放");
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    setSongDetail({ lyric: detail.lyric });
    audio.src = detail.url;
    audio.load();
    if (isPlayingRef.current) {
      audio.play().catch(() => setIsPlaying(false));
    }
  };

  /** 失败处理：连续 2 次自动跳下一首，第 3 次停止连播并明示（防整单 VIP 死循环） */
  guardRef.current = (reason) => {
    setToast(reason);
    if (failCountRef.current < 2) {
      failCountRef.current += 1;
      setCurrentIndex((i) => pickNextIndex(i, songs.length, playMode));
    } else {
      failCountRef.current = 0;
      setIsPlaying(false);
      isPlayingRef.current = false;
      setToast("连续失败，已停止自动连播");
    }
  };

  // 挂载拉歌单（playlistNonce 供重试）
  useEffect(() => {
    let cancelled = false;
    setPlaylistStatus("loading");
    (async () => {
      try {
        const res = await fetch("/api/music/playlist", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (data.error === "NOT_CONFIGURED") {
          setPlaylistStatus("not-configured");
          return;
        }
        if (data.playlist) {
          setSongs(data.playlist.songs);
          setPlaylistTitle(data.playlist.title);
          setPlaylistStatus(data.playlist.songs.length ? "ready" : "empty");
        } else {
          setPlaylistStatus("error");
          setPlaylistError(data.error ?? "歌单加载失败");
        }
      } catch {
        if (!cancelled) {
          setPlaylistStatus("error");
          setPlaylistError("歌单加载失败");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [playlistNonce]);

  // 切歌：按需取当前曲详情（vkey + 歌词），命中客户端缓存直接应用
  useEffect(() => {
    if (playlistStatus !== "ready" || songs.length === 0) return;
    const meta = songs[currentIndex];
    if (!meta) return;

    const mid = meta.songmid;
    currentMidRef.current = mid;
    setSongDetail(null); // 歌词清空，面板显示加载中（不保留上一首）
    setCurrentTime(0);
    setDuration(0);

    const cached = detailMapRef.current.get(mid);
    if (cached) {
      applyDetailRef.current(mid, cached);
      return;
    }

    setFetchingDetail(true);
    (async () => {
      try {
        const res = await fetch(songDetailUrl(meta), { cache: "no-store" });
        const data = await res.json();
        if (currentMidRef.current !== mid) return; // 期间已切到别的歌，丢弃
        const detail: SongDetail = {
          url: typeof data.url === "string" ? data.url : "",
          lyric: typeof data.lyric === "string" ? data.lyric : "",
          blocked: Boolean(data.blocked || !data.url),
        };
        detailMapRef.current.set(mid, detail);
        applyDetailRef.current(mid, detail);
      } catch {
        if (currentMidRef.current !== mid) return;
        guardRef.current("歌曲信息加载失败");
      } finally {
        if (currentMidRef.current === mid) setFetchingDetail(false);
      }
    })();
  }, [currentIndex, playlistStatus, songs, songNonce]);

  // 离开页面时停止播放
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);

  // toast 3 秒自动消失
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  function handleTogglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    // 详情未就绪（首次取流中/上次失败）：只记录播放意图，取流完成后 applyDetail 自动播放
    if (songDetail === null) {
      if (!fetchingDetail) setSongNonce((n) => n + 1); // 失败后的手动重试入口
      setIsPlaying((p) => !p);
      return;
    }
    if (audio.paused) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }

  function handleNext() {
    setCurrentIndex(pickNextIndex(currentIndex, songs.length, playMode));
  }

  function handlePrev() {
    const audio = audioRef.current;
    if (!audio) return;
    // 3 秒内回开头，否则上一首
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
    } else {
      setCurrentIndex((currentIndex - 1 + songs.length) % songs.length);
    }
  }

  function handleEnded() {
    if (playMode === "one") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    } else {
      setCurrentIndex(pickNextIndex(currentIndex, songs.length, playMode));
    }
  }

  function handleSeek(time: number) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = time;
    // 乐观更新：拖动时进度条/歌词即时响应
    setCurrentTime(time);
  }

  function handleCycleMode() {
    setPlayMode((mode) =>
      mode === "list" ? "one" : mode === "one" ? "shuffle" : "list"
    );
  }

  function handleSelectSong(index: number) {
    if (index === currentIndex) {
      handleTogglePlay();
      return;
    }
    isPlayingRef.current = true;
    setCurrentIndex(index);
  }

  /** 预取下一首详情入缓存（成功开播后 fire-and-forget，失败静默） */
  function prefetchNext() {
    const next = pickNextIndex(currentIndex, songs.length, playMode);
    const mid = songs[next]?.songmid;
    if (!mid || detailMapRef.current.has(mid)) return;
    fetch(songDetailUrl(songs[next]), { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.url !== undefined) {
          detailMapRef.current.set(mid, {
            url: typeof d.url === "string" ? d.url : "",
            lyric: typeof d.lyric === "string" ? d.lyric : "",
            blocked: !d.url,
          });
        }
      })
      .catch(() => {});
  }

  const song = songs[currentIndex];

  return (
    <>
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration || 0);
          failCountRef.current = 0; // 成功开播，连续失败计数归零
          prefetchNext();
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
        onError={() => guardRef.current("音频加载失败")}
        className="hidden"
      />

      {playlistStatus !== "ready" ? (
        <PlaylistStatus
          state={
            playlistStatus === "not-configured" || playlistStatus === "empty"
              ? playlistStatus
              : playlistStatus === "error"
                ? "error"
                : "loading"
          }
          errorMessage={playlistError}
          onRetry={
            playlistStatus === "error"
              ? () => setPlaylistNonce((n) => n + 1)
              : undefined
          }
        />
      ) : (
        <>
          <PlayerCard
            song={song}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            playMode={playMode}
            switching={fetchingDetail}
            onTogglePlay={handleTogglePlay}
            onPrev={handlePrev}
            onNext={handleNext}
            onSeek={handleSeek}
            onCycleMode={handleCycleMode}
          />

          {/* 右卡：歌词 / 歌单切换 + 滚动内容区 */}
          <section className="glass flex h-[420px] flex-col overflow-hidden rounded-2xl lg:h-auto">
            <div className="border-b border-white/10 p-4">
              <CapsuleTabs value={activeTab} onChange={setActiveTab} />
            </div>
            {activeTab === "lyrics" ? (
              // key 切歌重挂载：歌词滚动位置随新歌归零
              <LyricsPanel
                key={song.songmid}
                lrc={songDetail?.lyric ?? ""}
                currentTime={currentTime}
                loading={fetchingDetail && songDetail === null}
              />
            ) : (
              <PlaylistPanel
                title={playlistTitle}
                songs={songs}
                currentIndex={currentIndex}
                onSelect={handleSelectSong}
              />
            )}
          </section>
        </>
      )}

      {toast && (
        <div className="animate-toast-in glass fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm text-gray-200">
          {toast}
        </div>
      )}
    </>
  );
}
