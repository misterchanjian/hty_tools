"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSession, getUsers, createUser, deleteUser } from "@/lib/auth";
import type { Session } from "@/lib/auth";

function roleBadge(role: string): { text: string; color: string } {
  if (role === "super_admin") return { text: "超级管理员", color: "bg-purple-500/10 text-purple-400 border-purple-500/30" };
  if (role === "admin") return { text: "管理员", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" };
  return { text: "普通用户", color: "bg-slate-500/10 text-slate-400 border-slate-500/30" };
}

interface StoredUser {
  id: string;
  phone: string;
  password?: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [error, setError] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s || (s.role !== "super_admin" && s.role !== "admin")) {
      router.replace("/(app)/dashboard");
      return;
    }
    setSession(s);
    setUsers(getUsers() as StoredUser[]);
  }, [router]);

  const handleAdd = () => {
    setError("");
    if (!newPhone.trim()) { setError("请输入手机号"); return; }
    if (!newPassword.trim()) { setError("请输入密码"); return; }
    if (!newName.trim()) { setError("请输入姓名"); return; }

    const result = createUser({ phone: newPhone.trim(), name: newName.trim(), password: newPassword.trim() });
    if (!result.ok) { setError(result.message); return; }

    setUsers(getUsers() as StoredUser[]);
    setShowAdd(false);
    setNewPhone("");
    setNewName("");
    setNewPassword("");
    setNewRole("user");
  };

  const handleDelete = (id: string) => {
    if (!confirm("确定删除该用户？")) return;
    deleteUser(id);
    setUsers(getUsers() as StoredUser[]);
  };

  if (!session) {
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
            <h1 className="text-white font-semibold text-base">用户管理</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              共 {users.length} 个用户
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAdd(!showAdd)}
            className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-xs font-medium rounded-lg"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            添加用户
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto space-y-4">
        {/* Add form */}
        {showAdd && (
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-5 space-y-3">
            <h3 className="text-white font-semibold text-sm">添加新用户</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-xs">手机号</Label>
                <Input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="手机号"
                  className="bg-slate-800/60 border-slate-700 text-white h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-xs">姓名</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="姓名"
                  className="bg-slate-800/60 border-slate-700 text-white h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-xs">密码</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="密码"
                  className="bg-slate-800/60 border-slate-700 text-white h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-xs">角色</Label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-800/60 border border-slate-700 text-white rounded-lg text-sm appearance-none"
                >
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleAdd}
                className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
              >
                确认添加
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setShowAdd(false); setError(""); }}
                className="h-9 text-slate-400 hover:text-white text-sm rounded-lg"
              >
                取消
              </Button>
            </div>
          </div>
        )}

        {/* Users list */}
        <div className="space-y-2">
          {users.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              暂无用户记录
            </div>
          ) : (
            users.map((u) => {
              const { text, color } = roleBadge(u.role);
              return (
                <div key={u.phone} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{u.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${color}`}>{text}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-slate-500 text-xs font-mono">{u.phone}</span>
                      <span className="text-slate-600 text-xs">
                        {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
