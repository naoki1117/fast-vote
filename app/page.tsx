import AuthPanel from "./components/AuthPanel";
import Welcome from "./components/Welcome";

// 未ログイン向けトップ。ログイン済みは middleware が /dashboard へ送る
export default function Home() {
  return (
    <div className="page-shell py-10 sm:py-16">
      <div className="grid items-start gap-10 lg:grid-cols-2">
        <Welcome />
        <AuthPanel />
      </div>
    </div>
  );
}
