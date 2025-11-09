// schimbă linia asta:
// import { User } from "firebase/auth";

// în asta:
import type { User } from "firebase/auth";

import { db } from "../../firebase";
import { ref, child, get, set } from "firebase/database";

export async function ensureUserProfile(u: User) {
  const root = ref(db);
  const path = `users/${u.uid}/profile`;
  const snap = await get(child(root, path));
  if (snap.exists()) return;

  const [firstName, ...rest] = (u.displayName || "").trim().split(" ");
  const lastName = rest.join(" ");
  await set(ref(db, path), {
    firstName: firstName || "",
    lastName: lastName || "",
    email: u.email || "",
    createdAt: new Date().toISOString(),
  });
}
