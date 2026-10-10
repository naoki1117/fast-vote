/** セッション確認中や画面切り替え中のプレースホルダー */
export default function PageLoading({ label = "読み込み中..." }: { label?: string }) {
  return (
    <div className="page-shell py-10">
      <div className="card p-8 text-center text-slate-500">{label}</div>
    </div>
  );
}
