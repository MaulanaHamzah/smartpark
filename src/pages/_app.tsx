import type { AppProps } from "next/app";
import { useEffect } from "react";
import "@/styles/globals.css";
import { syncSlotsAndNotify } from "@/lib/historyService";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const unsub = syncSlotsAndNotify();
    return () => unsub();
  }, []);

  return <Component {...pageProps} />;
}