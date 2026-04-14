"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChange, isAdmin, type AppUser } from "@/lib/auth";
import { Shield } from "lucide-react";

export default function UsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChange((u) => {
      if (!u) {
        router.replace("/login");
        return;
      }
      if (!isAdmin(u)) {
        router.replace("/dashboard");
        return;
      }
      setCurrentUser(u);
      setLoading(false);
    });
    return unsub;
  }, [router]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-4 py-3">
        <h1 className="text-white font-semibold text-base">账号信息</h1>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Shield className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">{currentUser.name}</h2>
              <p className="text-slate-500 text-sm">超级管理员</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">账号</span>
              <span className="text-white font-mono">{currentUser.phone}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">UID</span>
              <span className="text-white font-mono">{currentUser.uid}</span>
            </div>
          </div>
        </div>

        <p className="text-slate-600 text-xs text-center mt-6">
          多设备同时登录，数据本地存储
        </p>
      </div>
    </div>
  );
}
