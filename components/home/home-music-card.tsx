"use client";

import { useEffect, useRef, useState } from "react";
import PlayerCard from "@/components/music/player-card";
import type { Song } from "@/lib/music";

interface SongDetail {
  url: string;
  blocked: boolean;
}

function songDetailUrl(song: Pick<Song, "songmid" | "mediaMid">): string {
  const params = new URLSearchParams({ mid: song.songmid });
  if (song.mediaMid) params.set("mediaMid", song.mediaMid);
  return `/api/music/song?${params.toString()}`;
}

type PlaylistState =
  | "loading"
  | "ready"
  | "error"
  | "empty"
  | "not-configured";

export default function HomeMusicCard() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const songsRef = useRef<Song[]>([]);
  const detailCacheRef = useRef(new Map<string, SongDetail>());
  const currentMidRef = useRef("");
  const requestIdRef = useRef(0);

  const [playlistState, setPlaylistState] = useState<PlaylistState>("loading");
  const [playlistTitle, setPlaylistTitle] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingSong, setLoadingSong] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [message, setMessage] = useState("");
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setPlaylistState("loading");
    setMessage("");

    fetch("/api/music/playlist", { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as {
          error?: string;
          playlist?: { title?: string; songs?: Song[] };
        };
        if (cancelled) return;
        if (data.error === "NOT_CONFIGURED") {
          setPlaylistState("not-configured");
          return;
        }
        if (!res.ok || !data.playlist) {
          throw new Error(data.error || "歌单加载失败");
        }
        const nextSongs = Array.isArray(data.playlist.songs)
          ? data.playlist.songs
          : [];
        songsRef.current = nextSongs;
        setSongs(nextSongs);
        setPlaylistTitle(data.playlist.title || "我的歌单");
        setPlaylistState(nextSongs.length > 0 ? "ready" : "empty");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setPlaylistState("error");
        setMessage(error instanceof Error ? error.message : "歌单加载失败");
      });

    return () => {
      cancelled = true;
    };
  }, [retryNonce]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);

  async function getSongDetail(song: Song): Promise<SongDetail | null> {
    const cached = detailCacheRef.current.get(song.songmid);
    if (cached) return cached;

    try {
      const res = await fetch(songDetailUrl(song), { cache: "no-store" });
      const data = (await res.json()) as {
        url?: unknown;
        blocked?: unknown;
      };
      if (!res.ok) throw new Error("歌曲信息加载失败");
      const detail = {
        url: typeof data.url === "string" ? data.url : "",
        blocked: Boolean(data.blocked || !data.url),
      };
      detailCacheRef.current.set(song.songmid, detail);
      return detail;
    } catch {
      setMessage("歌曲信息加载失败");
      return null;
    }
  }

  async function playSongAt(index: number) {
    const song = songsRef.current[index];
    const audio = audioRef.current;
    if (!song || !audio) return;

    const requestId = ++requestIdRef.current;
    currentMidRef.current = song.songmid;
    audio.pause();
    setIsPlaying(false);
    setCurrentIndex(index);
    setCurrentTime(0);
    setDuration(0);
    setMessage("");
    setLoadingSong(true);

    const detail = await getSongDetail(song);
    if (requestId !== requestIdRef.current) return;
    setLoadingSong(false);

    if (!detail) {
      setIsPlaying(false);
      return;
    }
    if (!detail.url || detail.blocked) {
      setIsPlaying(false);
      setMessage("这首歌暂时无法播放");
      return;
    }

    audio.src = detail.url;
    audio.load();
    try {
      await audio.play();
    } catch {
      setIsPlaying(false);
      setMessage("浏览器阻止了播放，请再点一次播放");
    }
  }

  function togglePlay() {
    const audio = audioRef.current;
    const song = songs[currentIndex];
    if (!audio || !song || loadingSong) return;

    if (audio.src && currentMidRef.current === song.songmid && !audio.paused) {
      audio.pause();
      return;
    }
    if (audio.src && currentMidRef.current === song.songmid) {
      audio.play().catch(() => setMessage("浏览器阻止了播放，请再点一次播放"));
      return;
    }
    void playSongAt(currentIndex);
  }

  function selectRelative(offset: number) {
    if (songs.length === 0) return;
    const next = (currentIndex + offset + songs.length) % songs.length;
    void playSongAt(next);
  }

  function seekTo(time: number) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = time;
    setCurrentTime(audio.currentTime);
  }

  const song = songs[currentIndex];

  return (
    <section className="glass flex min-h-[280px] flex-col rounded-2xl p-6 sm:p-7">
      <audio
        ref={audioRef}
        preload="metadata"
        className="hidden"
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => selectRelative(1)}
        onError={() => {
          setIsPlaying(false);
          setMessage("音频加载失败");
        }}
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="mt-1 text-xl font-bold text-white">
            {playlistTitle || "音乐"}
          </h2>
        </div>

      </div>

      {playlistState === "ready" && song ? (
        <PlayerCard
          variant="compact"
          song={song}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          playMode="list"
          switching={loadingSong}
          onTogglePlay={togglePlay}
          onPrev={() => selectRelative(-1)}
          onNext={() => selectRelative(1)}
          onSeek={seekTo}
          onCycleMode={() => {}}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <p className="text-gray-400">
              {playlistState === "loading" && "正在加载歌单…"}
              {playlistState === "error" && (message || "歌单加载失败")}
              {playlistState === "empty" && "歌单里还没有歌曲"}
              {playlistState === "not-configured" && "还没有配置歌单"}
            </p>
            {playlistState === "error" && (
              <button
                type="button"
                onClick={() => setRetryNonce((value) => value + 1)}
                className="mt-3 text-sm text-gray-300 hover:text-white"
              >
                重试 →
              </button>
            )}
          </div>
        </div>
      )}

      {message && playlistState === "ready" && (
        <p role="status" className="mt-3 truncate text-center text-xs text-gray-500">
          {message}
        </p>
      )}
    </section>
  );
}
