import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import { useUserData } from '../hooks/useUserData';
import { saveTaxConfig, updateActivity } from '../lib/rtdb';

const Settings: React.FC = () => {
    const { uid, taxConfig, profile } = useUserData();
    const [minSalary, setMinSalary] = useState(taxConfig?.minGrossSalary ?? 4050);
    const [domain, setDomain] = useState<'IT'|'MEDICAL'|'OTHER'>(profile?.activity?.domain ?? 'OTHER');
    const [caen, setCaen] = useState<string>(profile?.activity?.caenOrSpecialization ?? '');
    const [entityType, setEntityType] = useState<'PFA'|'PFI'>(profile?.activity?.entityType ?? 'PFA');
    const [taxRegime, setTaxRegime] = useState<'REAL'|'NORMA'>(profile?.activity?.taxRegime ?? 'REAL');

    const handleSave = async () => {
        if (!uid) return toast.error('Autentifică-te mai întâi');
        if (!minSalary || minSalary < 0) return toast.error('Introduce un salariu valid');

        try {
            await saveTaxConfig(uid, {
                ...taxConfig,
                minGrossSalary: Number(minSalary),
            });
            await updateActivity(uid, {
              domain: domain as any,
              caenOrSpecialization: caen || undefined,
              entityType: entityType as any,
              taxRegime: taxRegime as any,
            });
            toast.success('Setări actualizate');
        } catch (err) {
            console.error(err);
            toast.error('Eroare la salvare');
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto p-4">
                <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Setări</h1>

                                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <h2 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">Profil activitate</h2>
                                        <div className="space-y-4 mb-6">
                                            <div>
                                                <label className="block text-sm mb-1">Domeniu activitate</label>
                                                <select value={domain} onChange={(e)=>setDomain(e.target.value as 'IT'|'MEDICAL'|'OTHER')} className="border rounded px-3 py-2 w-full max-w-xs">
                                                    <option value="IT">IT / Software</option>
                                                    <option value="MEDICAL">Medical / Kineto</option>
                                                    <option value="OTHER">Altele</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm mb-1">CAEN / specializare (opțional)</label>
                                                <input value={caen} onChange={(e)=>setCaen(e.target.value)} placeholder="ex: kinetoterapie" className="border rounded px-3 py-2 w-full"/>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm mb-1">Tip</label>
                                                      <select value={entityType} onChange={(e)=>setEntityType(e.target.value as 'PFA'|'PFI')} className="border rounded px-3 py-2 w-full">
                                                        <option value="PFA">PFA</option>
                                                        <option value="PFI">PFI</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm mb-1">Regim</label>
                                                      <select value={taxRegime} onChange={(e)=>setTaxRegime(e.target.value as 'REAL'|'NORMA')} className="border rounded px-3 py-2 w-full">
                                                        <option value="REAL">Real</option>
                                                        <option value="NORMA">Normă</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <h2 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">Setări pentru calculul taxelor</h2>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="minSalary" className="block text-sm mb-1 text-gray-900 dark:text-white">
                                Salariu minim brut (RON)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    id="minSalary"
                                    type="number"
                                    value={minSalary}
                                    onChange={(e) => setMinSalary(Number(e.target.value))}
                                    className="border rounded px-3 py-2 w-full max-w-xs"
                                    min="0"
                                    step="1"
                                />
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                    Salvează
                                </button>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Salariul minim brut pe economie. Folosit pentru calculul pragurilor CAS și CASS.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;