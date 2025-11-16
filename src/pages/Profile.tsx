import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Save } from 'lucide-react';
import Layout from '../components/Layout';
import { auth } from '../../firebase';
import { getProfile, saveProfile } from '../lib/rtdb';
import { signOut } from 'firebase/auth';
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";

const Profile: React.FC = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: ''
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

        {/* Profile */}
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
      </div>
    </Layout>
  );
};

export default Profile;
