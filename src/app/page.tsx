"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChange } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChange((user) => {
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    });
    return unsub;
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-950">
      <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
}
