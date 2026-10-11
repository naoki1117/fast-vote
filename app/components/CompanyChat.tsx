"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useCompanyStatus } from "@/app/lib/company-status-context";

type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null };
};

/** 同じ会社のメンバーが、投票作業中に話せるチャット */
export default function CompanyChat() {
  const { status, signalSeq } = useCompanyStatus();
  const { data: session } = useSession();
  const myEmail = session?.user?.email;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const sync = () => setOpen(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const load = async () => {
    const res = await fetch("/api/messages", { cache: "no-store" });
    if (!res.ok) {
      return;
    }
    setMessages(await res.json());
  };

  useEffect(() => {
    void load();
  }, [status?.companyId, signalSeq]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    setError("");
    const content = text.trim();
    if (!content || busy) {
      return;
    }
    setBusy(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "送信できませんでした。");
      return;
    }
    setText("");
    setMessages((prev) => [...prev, data]);
  };

  if (!status?.companyId) {
    return (
      <div className="card p-5 text-sm text-slate-500">
        会社に所属すると、メンバーとチャットできます。
      </div>
    );
  }

  return (
    <div className="card flex flex-col overflow-hidden xl:sticky xl:top-24 xl:h-[min(32rem,calc(100vh-8rem))]">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left xl:cursor-default"
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          <span className="block text-xs font-semibold uppercase tracking-wider text-indigo-600">
            チャット
          </span>
          <span className="mt-0.5 block text-sm font-semibold text-slate-900">
            {status.companyName}
          </span>
        </span>
        <span className="text-xs font-medium text-indigo-600 xl:hidden">
          {open ? "閉じる" : "開く"}
        </span>
      </button>
      <div className={`${open ? "flex" : "hidden"} min-h-0 flex-1 flex-col xl:flex`}>
      <div className="h-56 min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 xl:h-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400">まだメッセージはありません。お題の確認などに使えます。</p>
        ) : (
          messages.map((msg) => {
            const mine = Boolean(myEmail && msg.user.email === myEmail);
            return (
              <div key={msg.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <p className="mb-0.5 text-xs text-slate-400">
                  {mine ? "自分" : msg.user.name ?? "未設定"}
                </p>
                <p
                  className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-5 ${
                    mine ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {msg.content}
                </p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="border-t border-slate-100 p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          maxLength={500}
          className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-500 focus:border-indigo-400 focus:ring-2"
          placeholder="メッセージ"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        <button type="submit" className="btn-primary mt-2 w-full" disabled={busy}>
          {busy ? "送信中..." : "送信"}
        </button>
      </form>
      </div>
    </div>
  );
}
