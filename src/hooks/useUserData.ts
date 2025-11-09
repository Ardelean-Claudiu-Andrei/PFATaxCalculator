import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";
import { ref, onValue, off, DataSnapshot } from "firebase/database";

export type Intrare = { amount: number; series?: string; number?: string; paid?: boolean; createdAt?: string; paidAt?: string | null; note?: string; };
export type Iesire  = { amount: number; category?: string; name?: string; createdAt?: string; note?: string; };
export type ProfileData = { firstName: string; lastName: string; email: string; createdAt?: string; };
export type TaxConfig = { minGrossSalary: number; threshold: 12 | 24; rates: { CAS_rate: number; CASS_rate: number; incomeTax_rate: number }; applyCAS?: boolean; cassOnRevenue?: boolean; };

const DEFAULT_TAX: TaxConfig = {
  minGrossSalary: 4050,
  threshold: 12,
  rates: { CAS_rate: 0.25, CASS_rate: 0.10, incomeTax_rate: 0.10 },
  applyCAS: false,
  cassOnRevenue: true,
};

export function useUserData() {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [intrari, setIntrari] = useState<Array<{ id: string; data: Intrare }>>([]);
  const [iesiri,  setIesiri ] = useState<Array<{ id: string; data: Iesire  }>>([]);
  const [taxConfig, setTaxConfig] = useState<TaxConfig>(DEFAULT_TAX);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, u => setUid(u?.uid ?? null)), []);

  useEffect(() => {
    if (!uid) { setProfile(null); setIntrari([]); setIesiri([]); setTaxConfig(DEFAULT_TAX); setLoading(false); return; }
    setLoading(true);

    const profRef = ref(db, `users/${uid}/profile`);
    const inRef   = ref(db, `users/${uid}/data/intrari`);
    const outRef  = ref(db, `users/${uid}/data/iesiri`);
    const taxRef  = ref(db, `users/${uid}/settings/taxConfig`);

    const h1 = onValue(profRef, (s: DataSnapshot) => setProfile((s.val() ?? null) as ProfileData | null));
    const h2 = onValue(inRef, (s: DataSnapshot) => {
      const v = s.val() || {};
      const arr = Object.entries(v).map(([id, d]) => ({ id, data: d as Intrare }));
      arr.sort((a,b)=> new Date(b.data.createdAt||0).getTime()-new Date(a.data.createdAt||0).getTime());
      setIntrari(arr);
    });
    const h3 = onValue(outRef, (s: DataSnapshot) => {
      const v = s.val() || {};
      const arr = Object.entries(v).map(([id, d]) => ({ id, data: d as Iesire }));
      arr.sort((a,b)=> new Date(b.data.createdAt||0).getTime()-new Date(a.data.createdAt||0).getTime());
      setIesiri(arr);
    });
    const h4 = onValue(taxRef, (s: DataSnapshot) => {
      setTaxConfig(s.exists() ? (s.val() as TaxConfig) : DEFAULT_TAX);
      setLoading(false);
    });

    return () => { off(profRef, "value", h1 as any); off(inRef,"value",h2 as any); off(outRef,"value",h3 as any); off(taxRef,"value",h4 as any); };
  }, [uid]);

  return { uid, profile, intrari, iesiri, taxConfig, loading };
}
