/** ログイン前トップ。見出しと説明は上揃え */
const Welcome = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <p className="text-sm font-medium text-indigo-600">Fast Vote</p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          書いて、揃えて、
          <br />
          票で決める。
        </h1>
      </div>
      <p className="max-w-md text-base leading-8 text-slate-600">
        毎回ホストを決め、ホストがお題を出します。提案は1人1件。
        全員の提出後に投票します。投票は1件または2件。送信後は変更できません。
      </p>
    </div>
  );
};

export default Welcome;
