// Local auth - single super admin account
// Supports multiple devices simultaneously (all devices use same credentials)

const SUPER_ADMIN = {
  id: "1",
  uid: "super-admin",
  phone: "hty",
  name: "管理员",
  role: "super_admin" as const,
  password: "hty168",
};

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
  if (phone === SUPER_ADMIN.phone && password === SUPER_ADMIN.password) {
    const appUser: AppUser = {
      id: SUPER_ADMIN.id,
      uid: SUPER_ADMIN.uid,
      phone: SUPER_ADMIN.phone,
      name: SUPER_ADMIN.name,
      role: SUPER_ADMIN.role,
      createdAt: new Date().toISOString(),
    };
    setSession(appUser);
    return { ok: true, user: appUser };
  }

  return { ok: false, message: "账号或密码错误" };
}

// Register (disabled)
export async function register(
  email: string,
  password: string,
  name: string
): Promise<{ ok: true; user: AppUser } | { ok: false; message: string }> {
  return { ok: false, message: "暂不支持注册" };
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
  const user = getSession();
  callback(user);

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
