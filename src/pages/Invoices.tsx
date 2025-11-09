// src/pages/Invoices.tsx
import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { useUserData } from "../hooks/useUserData";
import { addIntrare, updateIntrare, deleteIntrare } from "../lib/rtdb";
import { toast } from "react-toastify";

type FormState = {
  id?: string | null;
  series: string;
  number: string;
  amount: number;
  client: string;
  description: string;
  createdAt: string; // ISO
  paid: boolean;
  paidAt?: string | null;
};

const emptyForm = (): FormState => ({
  id: null,
  series: "PFA",
  number: "",
  amount: 0,
  client: "",
  description: "",
  createdAt: new Date().toISOString(),
  paid: true,
  paidAt: new Date().toISOString(),
});

const Invoices: React.FC = () => {
  const { uid, intrari } = useUserData(); // intrari: {id, data}[]
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editing, setEditing] = useState(false);

  // list sorted desc by date
  const invoices = useMemo(() => {
    if (!intrari) return [];
    return [...intrari].sort((a, b) => (new Date(b.data.createdAt || 0).getTime() - new Date(a.data.createdAt || 0).getTime()));
  }, [intrari]);

  useEffect(() => {
    // ensure paidAt when paid toggled
    if (form.paid && !form.paidAt) setForm(f => ({ ...f, paidAt: new Date().toISOString() }));
    if (!form.paid) setForm(f => ({ ...f, paidAt: null }));
  }, [form.paid]);

  const handleChange = (k: keyof FormState, v: any) => {
    setForm(f => ({ ...f, [k]: v }));
  };

  const handleAdd = async () => {
    if (!uid) return toast.error("Autentifică-te mai întâi");
    if (!form.amount || form.amount <= 0) return toast.error("Introduce o sumă > 0");
    // prepare payload - design: treat createdAt as provided or now
    const payload = {
      amount: Number(form.amount),
      series: form.series,
      number: form.number,
      paid: !!form.paid,
      createdAt: form.createdAt || new Date().toISOString(),
      paidAt: form.paid ? (form.paidAt || new Date().toISOString()) : null,
      note: form.description,
      client: form.client,
      description: form.description,
    };
    try {
      await addIntrare(uid, payload);
      toast.success("Factură adăugată");
      setForm(emptyForm());
      setEditing(false);
    } catch (err) {
      console.error(err);
      toast.error("Eroare la adăugare");
    }
  };

  const handleSaveEdit = async () => {
    if (!uid) return toast.error("Autentifică-te mai întâi");
    if (!form.id) return toast.error("Id factura lipsă");
    if (!form.amount || form.amount <= 0) return toast.error("Introduce o sumă > 0");
    const payload: any = {
      amount: Number(form.amount),
      series: form.series,
      number: form.number,
      paid: !!form.paid,
      createdAt: form.createdAt,
      paidAt: form.paid ? (form.paidAt || new Date().toISOString()) : null,
      note: form.description,
      client: form.client,
      description: form.description,
    };
    try {
      await updateIntrare(uid, form.id, payload);
      toast.success("Factură actualizată");
      setForm(emptyForm());
      setEditing(false);
    } catch (err) {
      console.error(err);
      toast.error("Eroare la actualizare");
    }
  };

  const handleEdit = (id: string) => {
    const item = invoices.find(i => i.id === id);
    if (!item) return;
    const d = item.data;
    setForm({
      id,
      series: d.series ?? "PFA",
      number: d.number ?? "",
      amount: Number(d.amount ?? 0),
      client: d.client ?? "",
      description: d.description ?? d.note ?? "",
      createdAt: d.createdAt ?? new Date().toISOString(),
      paid: d.paid === undefined ? true : !!d.paid,
      paidAt: d.paidAt ?? (d.paid ? new Date().toISOString() : null),
    });
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!uid) return toast.error("Autentifică-te mai întâi");
    if (!confirm("Ștergi factura?")) return;
    try {
      await deleteIntrare(uid, id);
      toast.info("Factură ștearsă");
      // if we were editing this id, clear form
      if (form.id === id) { setForm(emptyForm()); setEditing(false); }
    } catch (err) {
      console.error(err);
      toast.error("Eroare la ștergere");
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Facturi — adaugă / editează</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border">
          <h2 className="font-medium mb-3 text-gray-800 dark:text-gray-200">{editing ? "Editează factura" : "Adaugă factură nouă"}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="series" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Serie</label>
              <input id="series" value={form.series} onChange={e => handleChange("series", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent" />
            </div>
            <div>
              <label htmlFor="number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Număr</label>
              <input id="number" value={form.number} onChange={e => handleChange("number", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent" />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sumă (RON)</label>
              <input id="amount" type="number" step="0.01" value={form.amount} onChange={e => handleChange("amount", Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent" />
            </div>

            <div>
              <label htmlFor="client" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Client</label>
              <input id="client" value={form.client} onChange={e => handleChange("client", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent" />
            </div>
            <div>
              <label htmlFor="createdAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data (YYYY-MM-DD)</label>
              <input id="createdAt" type="date" value={form.createdAt.slice(0, 10)} onChange={e => handleChange("createdAt", new Date(e.target.value).toISOString())}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent" />
            </div>
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="paid" checked={form.paid} onChange={e => handleChange("paid", e.target.checked)}
                  className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-yellow-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-yellow-500"></div>
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Plătită</span>
              </label>
            </div>

            <div className="md:col-span-3">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descriere / Observații</label>
              <input id="description" value={form.description} onChange={e => handleChange("description", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent" />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {editing ? (
              <>
                <button onClick={handleSaveEdit} className="px-4 py-2 bg-green-600 text-white rounded">Salvează</button>
                <button onClick={() => { setForm(emptyForm()); setEditing(false); }} className="px-4 py-2 bg-gray-200 rounded">Anulează</button>
              </>
            ) : (
              <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded">Adaugă</button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b">
              <div className="hidden sm:flex items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                <div className="w-10">Nr.</div>
                <div className="flex-1">Serie/Număr</div>
                <div className="min-w-[120px] text-right px-2">Sumă</div>
                <div className="min-w-[140px] px-2">Client</div>
                <div className="min-w-[120px] text-right px-2">Data</div>
                <div className="min-w-[120px] text-right px-2">Acțiuni</div>
              </div>

              <div className="flex sm:hidden items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                <div className="w-10">Nr.</div>
                <div className="flex-1">Rezumat</div>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4 space-y-2">
              {invoices.length === 0 && <div className="text-gray-500">Nicio factură înregistrată.</div>}
              {invoices.map((it, idx) => (
                <React.Fragment key={it.id}>
                  {/* desktop row */}
                  <div className="hidden sm:flex items-center border-b py-2">
                    <div className="w-10 text-gray-400 dark:text-gray-300">{idx + 1}</div>
                    <div className="flex-1 text-gray-200 dark:text-white min-w-0 truncate">{(it.data.series || "PFA") + (it.data.number ? "/" + it.data.number : "")}</div>
                    <div className={"min-w-[120px] text-right font-semibold px-2 whitespace-nowrap " + (it.data.paid === false ? 'text-red-400 dark:text-red-300' : 'text-green-400 dark:text-green-300')}>{new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(it.data.amount || 0)).replace(' RON','\u00A0RON')}</div>
                    <div className="min-w-[140px] px-2 text-gray-300 dark:text-gray-200 min-w-0 truncate">{it.data.client || '-'}</div>
                    <div className="min-w-[120px] px-2 text-right text-gray-400 dark:text-gray-300">{it.data.createdAt ? new Date(it.data.createdAt).toLocaleDateString('ro-RO') : '-'}</div>
                    <div className="min-w-[120px] px-2 text-right">
                      <div className="inline-flex gap-2">
                        <button onClick={() => handleEdit(it.id)} className="px-2 py-1 rounded bg-yellow-500 text-black">Editează</button>
                        <button onClick={() => handleDelete(it.id)} className="px-2 py-1 rounded bg-red-600 text-white">Șterge</button>
                      </div>
                    </div>
                  </div>

                  {/* mobile compact row */}
                  <div className="flex flex-col sm:hidden border-b py-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-200 dark:text-white truncate">{(it.data.series || "PFA") + (it.data.number ? "/" + it.data.number : "")}</div>
                      <div className={"font-semibold whitespace-nowrap " + (it.data.paid === false ? 'text-red-400 dark:text-red-300' : 'text-green-400 dark:text-green-300')}>{new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(it.data.amount || 0)).replace(' RON','\u00A0RON')}</div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-gray-300 dark:text-gray-200">
                      <div className="min-w-0 truncate">{it.data.client || '-'}</div>
                      <div className="ml-4 text-right">{it.data.createdAt ? new Date(it.data.createdAt).toLocaleDateString('ro-RO') : '-'}</div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => handleEdit(it.id)} className="flex-1 px-3 py-2 rounded bg-yellow-500 text-black">Editează</button>
                      <button onClick={() => handleDelete(it.id)} className="flex-1 px-3 py-2 rounded bg-red-600 text-white">Șterge</button>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Invoices;
