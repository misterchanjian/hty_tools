import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export type UserRole = "super_admin" | "user";

export interface AppUser {
  id: string;
  uid: string;           // Firebase UID
  phone: string;         // stored as email in Firebase Auth
  name: string;
  role: UserRole;
  createdAt: string;
}

// Map Firebase user to AppUser
function mapFirebaseUser(fbUser: FirebaseUser, displayName?: string): AppUser {
  return {
    id: fbUser.uid,
    uid: fbUser.uid,
    phone: fbUser.email || "",
    name: displayName || fbUser.displayName || fbUser.email || "用户",
    role: "user", // default; will be overwritten by Firestore lookup
    createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
  };
}

// Login with Firebase Auth
export async function login(
  email: string,
  password: string
): Promise<{ ok: true; user: AppUser } | { ok: false; message: string }> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    // Fetch role from Firestore
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    let role: UserRole = "user";
    let name = cred.user.displayName || email;
    if (snap.exists()) {
      const data = snap.data();
      role = (data.role as UserRole) || "user";
      name = data.displayName || name;
    }
    return {
      ok: true,
      user: { id: cred.user.uid, uid: cred.user.uid, phone: cred.user.email || "", name, role, createdAt: cred.user.metadata.creationTime || "" },
    };
  } catch (err: any) {
    const msg = err.code === "auth/invalid-credential"
      ? "邮箱或密码错误"
      : err.code === "auth/user-not-found"
      ? "用户不存在"
      : err.code === "auth/wrong-password"
      ? "密码错误"
      : "登录失败，请重试";
    return { ok: false, message: msg };
  }
}

// Register new user (Firebase Auth + Firestore)
export async function register(
  email: string,
  password: string,
  name: string
): Promise<{ ok: true; user: AppUser } | { ok: false; message: string }> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await setDoc(doc(db, "users", cred.user.uid), {
      displayName: name,
      email: cred.user.email,
      role: "user",
      createdAt: serverTimestamp(),
    });
    return {
      ok: true,
      user: { id: cred.user.uid, uid: cred.user.uid, phone: cred.user.email || "", name, role: "user", createdAt: cred.user.metadata.creationTime || "" },
    };
  } catch (err: any) {
    const msg = err.code === "auth/email-already-in-use"
      ? "该邮箱已被注册"
      : err.code === "auth/weak-password"
      ? "密码至少6位"
      : err.code === "auth/invalid-email"
      ? "邮箱格式无效"
      : "注册失败，请重试";
    return { ok: false, message: msg };
  }
}

// Sign out
export async function signOut(): Promise<void> {
  if (auth) await firebaseSignOut(auth);
}

// Subscribe to auth state
export function onAuthStateChange(callback: (user: AppUser | null) => void) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      callback(null);
      return;
    }
    const snap = await getDoc(doc(db, "users", fbUser.uid));
    let role: UserRole = "user";
    let name = fbUser.displayName || fbUser.email || "用户";
    if (snap.exists()) {
      const data = snap.data();
      role = (data.role as UserRole) || "user";
      name = data.displayName || name;
    }
    callback({ id: fbUser.uid, uid: fbUser.uid, phone: fbUser.email || "", name, role, createdAt: fbUser.metadata.creationTime || "" });
  });
}
