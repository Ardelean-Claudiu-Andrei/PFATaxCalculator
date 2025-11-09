import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Settings, LogOut, Save } from 'lucide-react';
import Layout from '../components/Layout';
import { auth } from '../../firebase'; // ajustează calea
import { getProfile, saveProfile, saveTaxConfig, type TaxConfig } from '../lib/rtdb';
import { signOut } from 'firebase/auth';
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'tax-settings'>('profile');

  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  const [taxConfig, setTaxConfig] = useState<TaxConfig>({
    minGrossSalary: 4050,
    threshold: 12 as 12 | 24,
    rates: { CAS_rate: 0.25, CASS_rate: 0.10, incomeTax_rate: 0.10 }
  });

  // Load profile (RTDB) for current user
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    (async () => {
      const p = await getProfile(u.uid);
      setProfile({
        firstName: p?.firstName || u.displayName?.split(' ')?.[0] || '',
        lastName: p?.lastName || u.displayName?.split(' ')?.slice(1).join(' ') || '',
        email: p?.email || u.email || ''
      });
    })();
  }, []);

  const handleProfileSave = async () => {
    const u = auth.currentUser;
    if (!u) { toast.error("Nu ești autentificat"); return; }
    await saveProfile(u.uid, {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      createdAt: new Date().toISOString()
    });
    toast.success("Profil salvat!");
  };

  const handleTaxConfigSave = async () => {
    const u = auth.currentUser;
    if (!u) { toast.error("Nu ești autentificat"); return; }
    await saveTaxConfig(u.uid, taxConfig);
    toast.success("Configurare salvată!");
  };

  async function handleLogout() {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (e) {
      console.error(e);
    }
  }
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Profil</h1>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile'
              ? 'bg-blue-600 text-white dark:bg-yellow-500 dark:text-gray-900'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Profil personal
          </button>
          <button
            onClick={() => setActiveTab('tax-settings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'tax-settings'
              ? 'bg-blue-600 text-white dark:bg-yellow-500 dark:text-gray-900'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Configurare taxe
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Informații personale
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prenume
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nume
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-8">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Deconectare
              </button>

              <button
                onClick={handleProfileSave}
                className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-yellow-500 text-white dark:text-gray-900 rounded-lg hover:bg-blue-700 dark:hover:bg-yellow-600 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvează
              </button>
            </div>
          </motion.div>
        )}

        {/* Tax Settings Tab (opțional în RTDB) */}
        {activeTab === 'tax-settings' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Configurare taxe
            </h2>

            <div className="space-y-6">
              <div>
                <label htmlFor="minGrossSalary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Salariu minim brut (RON)
                </label>
                <input
                  id="minGrossSalary"
                  type="number"
                  value={taxConfig.minGrossSalary}
                  onChange={(e) => setTaxConfig({ ...taxConfig, minGrossSalary: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prag (salarii)
                </label>
                <select
                  id="threshold"
                  value={taxConfig.threshold}
                  onChange={(e) => setTaxConfig({ ...taxConfig, threshold: Number(e.target.value) as 12 | 24 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value={12}>12 salarii</option>
                  <option value={24}>24 salarii</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="casRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rata CAS (%)
                  </label>
                  <input
                    id="casRate"
                    type="number" step="0.01" min="0" max="1"
                    value={taxConfig.rates.CAS_rate}
                    onChange={(e) => setTaxConfig({ ...taxConfig, rates: { ...taxConfig.rates, CAS_rate: Number(e.target.value) } })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="cassRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rata CASS (%)
                  </label>
                  <input
                    id="cassRate"
                    type="number" step="0.01" min="0" max="1"
                    value={taxConfig.rates.CASS_rate}
                    onChange={(e) => setTaxConfig({ ...taxConfig, rates: { ...taxConfig.rates, CASS_rate: Number(e.target.value) } })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="incomeTaxRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rata impozit venit (%)
                  </label>
                  <input
                    id="incomeTaxRate"
                    type="number" step="0.01" min="0" max="1"
                    value={taxConfig.rates.incomeTax_rate}
                    onChange={(e) => setTaxConfig({ ...taxConfig, rates: { ...taxConfig.rates, incomeTax_rate: Number(e.target.value) } })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={handleTaxConfigSave}
                className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-yellow-500 text-white dark:text-gray-900 rounded-lg hover:bg-blue-700 dark:hover:bg-yellow-600 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvează configurarea
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Profile;
