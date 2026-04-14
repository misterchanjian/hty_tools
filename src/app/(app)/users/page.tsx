"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChange, isAdmin, type AppUser } from "@/lib/auth";
import { User, Shield } from "lucide-react";

// Hardcoded users list (same as auth.ts)
const USERS = [
  { uid: "super-admin", phone: "root", name: "超级管理员", role: "super_admin" },
  { uid: "user-1", phone: "陈正发", name: "陈正发", role: "user" },
  { uid: "user-2", phone: "吴鼎恒", name: "吴鼎恒", role: "user" },
  { uid: "user-3", phone: "李勇", name: "李勇", role: "user" },
  { uid: "user-4", phone: "袁壹虎", name: "袁壹虎", role: "user" },
] as const;

function roleBadge(role: string): { text: string; color: string } {
  if (role === "super_admin") return { text: "超级管理员", color: "bg-purple-500/10 text-purple-400 border-purple-500/30" };
  if (role === "admin") return { text: "管理员", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" };
  return { text: "普通用户", color: "bg-slate-500/10 text-slate-400 border-slate-500/30" };
}

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
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-semibold text-base">用户列表</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              共 {USERS.length} 个账号
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto space-y-4">
        {/* Notice */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 text-sm font-medium">账号说明</p>
              <p className="text-amber-200/70 text-xs mt-1">
                所有账号已硬编码在代码中。如需添加或修改账号，请联系管理员更新代码。
              </p>
            </div>
          </div>
        </div>

        {/* Users list */}
        <div className="space-y-2">
          {USERS.map((u) => {
            const { text, color } = roleBadge(u.role);
            return (
              <div key={u.uid} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-slate-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{u.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${color}`}>
                      {text}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-slate-500 text-xs font-mono">{u.phone}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
