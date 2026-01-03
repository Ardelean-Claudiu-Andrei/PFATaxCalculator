import { db } from "../../firebase"; // ajusteză calea dacă ai alt folder
import {
  ref, push, set, update, remove, onValue, off, get, child, DataSnapshot
} from "firebase/database";

export type Intrare = {
  amount: number;
  series?: string;
  number?: string;
  paid?: boolean;
  createdAt?: string; // ISO
  paidAt?: string | null; // ISO
  note?: string;
};

export type Iesire = {
  amount: number;
  category?: string; // Salary | Consumables | Other...
  name?: string;
  createdAt?: string; // ISO
  note?: string;

  /**
   * Deductibilitate (PFA regim real).
   *
   * NOTE: În practică deductibilitatea depinde de obiectul activității și de documente justificative.
   * În platformă o modelăm explicit per-cheltuială, ca să putem calcula corect baza impozabilă.
   */
  deductibility?: {
    type: 'full' | 'partial' | 'limited' | 'asset' | 'none';

    /** procent utilizare profesională (0..100). ex: telefon 50% */
    businessUsePct?: number;

    /** pentru partial: procent deductibil (0..100). ex: auto 50% */
    partialPct?: number;

    /** pentru limited: chei de grupare + plafon anual (RON) */
    limitGroup?: string; // ex: "health" / "pilon3" etc.
    limitAnnualRon?: number;

    /** pentru asset (mijloc fix): amortizare */
    asset?: {
      acquisitionCostRon: number;
      startDate?: string; // ISO (default: createdAt)
      usefulLifeMonths: number; // ex: 36
      method?: 'linear';
      /** prag inventar vs mijloc fix (RON). default 2500 */
      thresholdRon?: number;
    };
  };
};

export type ActivityDomain = 'IT' | 'MEDICAL' | 'OTHER';
export type UserActivityProfile = {
  domain: ActivityDomain;
  caenOrSpecialization?: string;
  entityType?: 'PFA' | 'PFI';
  taxRegime?: 'REAL' | 'NORMA';
};

export type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  createdAt?: string;
  activity?: UserActivityProfile;
};

export type TaxConfig = {
  minGrossSalary: number;
  threshold: 12 | 24;
  rates: { CAS_rate: number; CASS_rate: number; incomeTax_rate: number };
  applyCAS?: boolean;
  cassOnRevenue?: boolean;
};

// ---------- PROFILE ----------
export async function getProfile(uid: string): Promise<ProfileData | null> {
  const snap = await get(child(ref(db), `users/${uid}/profile`));
  return snap.exists() ? (snap.val() as ProfileData) : null;
}

export async function saveProfile(uid: string, data: Partial<ProfileData>) {
  await update(ref(db, `users/${uid}/profile`), {
    ...data,
  });
}

export async function updateActivity(uid: string, patch: Partial<UserActivityProfile>) {
  await update(ref(db, `users/${uid}/profile/activity`), { ...patch });
}

// ---------- INTRĂRI ----------
// Adaugă o intrare (factură) — folosește push pentru id automat
// NOTE: store invoices under `data/intrari` to match the app subscription path
export async function addIntrare(uid: string, intrare: Intrare) {
  const r = ref(db, `users/${uid}/data/intrari`);
  const p = push(r);
  const toSave = { ...intrare, createdAt: intrare.createdAt ?? new Date().toISOString() };
  await set(p, toSave);
  return p.key; // returnează id-ul generat
}

export async function updateIntrare(uid: string, id: string, intrare: Partial<Intrare>) {
  const r = ref(db, `users/${uid}/data/intrari/${id}`);
  await update(r, intrare);
}


export async function deleteIntrare(uid: string, id: string) {
  const r = ref(db, `users/${uid}/data/intrari/${id}`);
  await remove(r);
}

// ---------- IEȘIRI ----------
export async function addIesire(uid: string, data: Iesire) {
  const r = ref(db, `users/${uid}/data/iesiri`);
  const newRef = push(r);
  await set(newRef, {
    ...data,
    createdAt: data.createdAt || new Date().toISOString(),
  });
}

export async function updateIesire(uid: string, id: string, data: Partial<Iesire>) {
  await update(ref(db, `users/${uid}/data/iesiri/${id}`), data);
}

export async function deleteIesire(uid: string, id: string) {
  await remove(ref(db, `users/${uid}/data/iesiri/${id}`));
}

// ---------- SUBSCRIBE HELPERS ----------
export function subscribeIntrari(uid: string, cb: (arr: { id: string; data: Intrare }[]) => void) {
  const r = ref(db, `users/${uid}/intrari`);
  const handler = (snap: DataSnapshot) => {
    if (!snap.exists()) { cb([]); return; }
    const v = snap.val();
    const arr = Object.entries(v).map(([id, d]) => ({ id, data: d as Intrare }));
    // opțional sortează după createdAt desc
    arr.sort((a,b) => new Date(b.data.createdAt||0).getTime() - new Date(a.data.createdAt||0).getTime());
    cb(arr);
  };
  onValue(r, handler);
  return () => off(r, "value", handler);
}

export function subscribeIesiri(
  uid: string,
  cb: (list: Array<{ id: string; data: Iesire }>) => void
) {
  const r = ref(db, `users/${uid}/data/iesiri`);
  const handler = (snap: DataSnapshot) => {
    const val = snap.val() || {};
    const arr = Object.entries(val).map(([id, v]) => ({ id, data: v as Iesire }));
    cb(arr);
  };
  onValue(r, handler);
  return () => off(r, "value", handler);
}

// -- helpers pentru taxConfig --

export async function getTaxConfig(uid: string): Promise<TaxConfig | null> {
  const snap = await get(child(ref(db), `users/${uid}/settings/taxConfig`));
  return snap.exists() ? (snap.val() as TaxConfig) : null;
}

export async function saveTaxConfig(uid: string, cfg: TaxConfig) {
  await set(ref(db, `users/${uid}/settings/taxConfig`), cfg);
}

export function subscribeTaxConfig(
  uid: string,
  cb: (cfg: TaxConfig | null) => void
) {
  const r = ref(db, `users/${uid}/settings/taxConfig`);
  const handler = (snap: DataSnapshot) => {
    cb(snap.exists() ? (snap.val() as TaxConfig) : null);
  };
  onValue(r, handler);
  return () => off(r, "value", handler);
}