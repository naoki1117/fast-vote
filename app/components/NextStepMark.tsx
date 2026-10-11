/** 次に押すボタンの横に出す印 */
export default function NextStepMark() {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold leading-none text-amber-950 shadow-sm"
      title="次にすること"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-700 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-800" />
      </span>
      次
    </span>
  );
}
