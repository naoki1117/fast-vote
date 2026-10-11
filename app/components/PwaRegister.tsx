"use client";

import { useEffect } from "react";

/** ホーム画面追加用に Service Worker を登録する */
export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }
    void navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }, []);

  return null;
}
