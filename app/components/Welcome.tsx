/** ログイン前トップ。見出しと説明は上揃え */
const Welcome = () => {
  return (
    <div className="space-y-8 pt-8 lg:pt-16">
      <div className="space-y-4">
        <p className="text-sm font-medium text-indigo-600">Fast Vote</p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          全員の提案を見て、
          <br />
          すばやく投票。
          <br />
          グループの意思決定を最短で。
        </h1>
      </div>
      <div className="max-w-md space-y-1 text-base leading-8 text-slate-600">
        <p>毎回ホストを決め、ホストがお題を出します。</p>
        <p>提案は1人1件。</p>
        <p>全員の提出後に投票します。投票は1件または2件。</p>
        <p>送信後は変更できません。</p>
      </div>
    </div>
  );
};

export default Welcome;
