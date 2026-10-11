"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CompanyStatusPayload } from "@/app/types/company-status";
import { createBrowserSupabase, hasSupabaseRealtime } from "@/app/lib/supabase-browser";

type CompanyStatusContextValue = {
  status: CompanyStatusPayload | null;
  loaded: boolean;
  failed: boolean;
  /** Realtime の合図回数。チャットの取り直しに使う */
  signalSeq: number;
  refresh: () => Promise<void>;
};

const CompanyStatusContext = createContext<CompanyStatusContextValue | null>(null);

/** ダッシュボード全体で提出・投票の進捗を共有する */
export function CompanyStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<CompanyStatusPayload | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [signalSeq, setSignalSeq] = useState(0);
  const companyId = status?.companyId ?? null;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/company-status", { cache: "no-store" });
      if (!res.ok) {
        setFailed(true);
        setLoaded(true);
        return;
      }
      setStatus(await res.json());
      setFailed(false);
      setLoaded(true);
    } catch {
      setFailed(true);
      setLoaded(true);
    }
  }, []);

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!cancelled) {
        await refresh();
      }
    };
    load();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  useEffect(() => {
    if (!companyId || !hasSupabaseRealtime) {
      return;
    }
    const supabase = createBrowserSupabase();
    if (!supabase) {
      return;
    }
    const channel = supabase
      .channel(`round-signal:${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "round_signals",
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          setSignalSeq((n) => n + 1);
          void refreshRef.current();
        }
      )
      .subscribe((liveStatus, err) => {
        if (liveStatus === "CHANNEL_ERROR" || liveStatus === "TIMED_OUT") {
          console.warn("Supabase Realtime:", liveStatus, err?.message ?? "");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [companyId]);

  return (
    <CompanyStatusContext.Provider value={{ status, loaded, failed, signalSeq, refresh }}>
      {children}
    </CompanyStatusContext.Provider>
  );
}

export function useCompanyStatus() {
  const value = useContext(CompanyStatusContext);
  if (!value) {
    throw new Error("useCompanyStatus は CompanyStatusProvider の中で使ってください。");
  }
  return value;
}
