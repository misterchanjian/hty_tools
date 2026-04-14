// Local auth - no external dependencies needed

// Hardcoded users (super simple auth for internal tool)
const HARDCODE_USERS = [
  { id: "1", uid: "super-admin", phone: "root", name: "超级管理员", role: "super_admin", password: "huangwei" },
  { id: "2", uid: "user-1", phone: "陈正发", name: "陈正发", role: "user", password: "123456" },
  { id: "3", uid: "user-2", phone: "吴鼎恒", name: "吴鼎恒", role: "user", password: "123456" },
  { id: "4", uid: "user-3", phone: "李勇", name: "李勇", role: "user", password: "123456" },
  { id: "5", uid: "user-4", phone: "袁壹虎", name: "袁壹虎", role: "user", password: "123456" },
] as const;

export interface AppUser {
  id: string;
  uid: string;
  phone: string;
  name: string;
  role: "super_admin" | "admin" | "user";
  createdAt?: string;
}

// Get session from localStorage
function getSession(): AppUser | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("cc_user");
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AppUser;
  } catch {
    return null;
  }
}

// Save session to localStorage
function setSession(user: AppUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("cc_user", JSON.stringify(user));
}

// Clear session
function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("cc_user");
}

// Login with phone + password
export async function login(
  phone: string,
  password: string
): Promise<{ ok: true; user: AppUser } | { ok: false; message: string }> {
  // Find user by phone
  const user = HARDCODE_USERS.find(
    (u) => u.phone === phone && u.password === password
  );

  if (!user) {
    return { ok: false, message: "手机号或密码错误" };
  }

  const appUser: AppUser = {
    id: user.id,
    uid: user.uid,
    phone: user.phone,
    name: user.name,
    role: user.role,
    createdAt: new Date().toISOString(),
  };

  setSession(appUser);
  return { ok: true, user: appUser };
}

// Register (disabled - using hardcoded users)
export async function register(
  email: string,
  password: string,
  name: string
): Promise<{ ok: true; user: AppUser } | { ok: false; message: string }> {
  return { ok: false, message: "暂不支持注册，请联系管理员添加账号" };
}

// Sign out
export async function signOut(): Promise<void> {
  clearSession();
}

// Get current user
export function getCurrentUser(): AppUser | null {
  return getSession();
}

// Auth state listener (simulated for compatibility)
export function onAuthStateChange(callback: (user: AppUser | null) => void): () => void {
  // Check immediately
  const user = getSession();
  callback(user);

  // Listen to storage changes (for multi-tab)
  if (typeof window !== "undefined") {
    const handler = (e: StorageEvent) => {
      if (e.key === "cc_user") {
        const user = e.newValue ? JSON.parse(e.newValue) : null;
        callback(user);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }

  return () => {};
}

// Check if user is admin
export function isAdmin(user: AppUser | null): boolean {
  return user?.role === "super_admin" || user?.role === "admin";
}
