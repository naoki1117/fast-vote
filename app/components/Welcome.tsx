/** トップ左のキャッチコピー。ルール（1人1件・全員提出後に投票）を先に伝える */
const Welcome = () => {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
        Fast Vote
      </p>
      <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
        提案を見て、
        <br />
        すばやく投票する。
      </h1>
      <p className="max-w-md text-base leading-7 text-slate-600">
        提案は1人1件。同じ会社の全員が提出してから投票が始まります。
        投票は他の人の提案から2件選べます。
      </p>
    </div>
  );
};

export default Welcome;
