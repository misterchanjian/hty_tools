// Hardcoded super admin — 19976679595 / huangwei
export const SUPER_ADMIN = {
  id: "super_admin",
  phone: "19976679595",
  name: "超级管理员",
  role: "super_admin" as UserRole,
  password: "huangwei",
  createdAt: "2024-01-01T00:00:00.000Z",
};

export type UserRole = "super_admin" | "user";

export interface AppUser {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  password: string;
  createdAt: string;
}

// localStorage keys
// unified storage key
export const USERS_KEY = "cc_users";
export const SESSION_KEY = "cc_session";

export interface Session {
  userId: string;
  phone: string;
  name: string;
  role: UserRole;
  loginAt: string;
}

// Get all users from localStorage
export function getUsers(): AppUser[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    // First time — seed super admin
    const users: AppUser[] = [{ ...SUPER_ADMIN, role: "super_admin" as UserRole }];
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return users;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [{ ...SUPER_ADMIN, role: "super_admin" as UserRole }];
  }
}

// Save all users
export function saveUsers(users: AppUser[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Get current session
export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Set session
export function setSession(user: Omit<AppUser, "password">): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      userId: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      loginAt: new Date().toISOString(),
    })
  );
}

// Clear session
export function clearSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

// Login logic
export function login(phone: string, password: string): { ok: true; user: Omit<AppUser, "password"> } | { ok: false; message: string } {
  const users = getUsers();

  // Super admin check first
  if (phone === SUPER_ADMIN.phone && password === SUPER_ADMIN.password) {
    const { password: _, ...safeUser } = SUPER_ADMIN;
    setSession(safeUser);
    return { ok: true, user: safeUser };
  }

  // Regular user check
  const user = users.find(
    (u) => u.phone === phone && u.password === password && u.role !== "super_admin"
  );
  if (user) {
    const { password: _, ...safeUser } = user;
    setSession(safeUser);
    return { ok: true, user: safeUser };
  }

  return { ok: false, message: "手机号或密码错误" };
}

// Create user
export function createUser(data: { phone: string; name: string; password: string }): {
  ok: boolean;
  message: string;
  user?: Omit<AppUser, "password">;
} {
  const users = getUsers();
  if (users.find((u) => u.phone === data.phone)) {
    return { ok: false, message: "该手机号已存在" };
  }
  const newUser: AppUser = {
    id: `user_${Date.now()}`,
    phone: data.phone,
    name: data.name,
    role: "user" as UserRole,
    password: data.password,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  const { password: _, ...safeUser } = newUser;
  return { ok: true, message: "创建成功", user: safeUser };
}

// Delete user
export function deleteUser(id: string): boolean {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  users.splice(idx, 1);
  saveUsers(users);
  return true;
}

// Simple ID generation
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
