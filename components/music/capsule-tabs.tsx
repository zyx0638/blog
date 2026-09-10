/** 歌词 / 歌单胶囊切换开关：选中项白底黑字高亮 */

export type PanelTab = "lyrics" | "playlist";

export default function CapsuleTabs({
  value,
  onChange,
}: {
  value: PanelTab;
  onChange: (tab: PanelTab) => void;
}) {
  const tabs: { key: PanelTab; label: string }[] = [
    { key: "lyrics", label: "歌词" },
    { key: "playlist", label: "歌单" },
  ];

  return (
    <div className="mx-auto flex w-44 gap-1 rounded-full border border-white/10 bg-white/5 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`flex-1 rounded-full px-4 py-1.5 text-sm transition-colors ${
            value === tab.key
              ? "bg-white font-medium text-black"
              : "text-gray-400 hover:bg-white/10 hover:text-white"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
