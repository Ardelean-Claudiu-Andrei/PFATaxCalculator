import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Save } from 'lucide-react';
import { auth } from '../../firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { saveProfile } from '../lib/rtdb';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const CreateProfile: React.FC = () => {
    const navigate = useNavigate();

    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleProfileSave = async () => {
        if (!profile.firstName.trim() || !profile.lastName.trim() || !profile.email.trim() || !profile.password.trim() || !profile.confirmPassword.trim()) {
            toast.error("Toate câmpurile sunt obligatorii");
            return;
        }

        if (profile.password.length < 6) {
            toast.error("Parola trebuie să aibă cel puțin 6 caractere");
            return;
        }

        if (profile.password !== profile.confirmPassword) {
            toast.error("Parolele nu se potrivesc");
            return;
        }

        try {
            // Create user account
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                profile.email.trim(),
                profile.password
            );

            // Save profile to database
            await saveProfile(userCredential.user.uid, {
                firstName: profile.firstName.trim(),
                lastName: profile.lastName.trim(),
                email: profile.email.trim(),
                createdAt: new Date().toISOString()
            });

            // Sign out the user so they need to login
            await signOut(auth);

            toast.success("Cont creat cu succes! Te poți autentifica acum.");
            navigate("/login", { replace: true });
        } catch (error: any) {
            console.error("Error creating account:", error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error("Acest email este deja folosit");
            } else if (error.code === 'auth/invalid-email') {
                toast.error("Email invalid");
            } else if (error.code === 'auth/weak-password') {
                toast.error("Parola este prea slabă");
            } else {
                toast.error("Eroare la crearea contului");
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-2xl border border-gray-100 dark:border-gray-700"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 dark:bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-white dark:text-gray-900" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Creează cont nou
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Completează informațiile pentru a-ți crea contul
                    </p>
                </div>

                {/* Personal Information */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                >
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Informații cont
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Prenume *
                            </label>
                            <input
                                id="firstName"
                                type="text"
                                value={profile.firstName}
                                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                                placeholder="Introduceți prenumele"
                            />
                        </div>

                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nume *
                            </label>
                            <input
                                id="lastName"
                                type="text"
                                value={profile.lastName}
                                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                                placeholder="Introduceți numele"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email *
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                                placeholder="email@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Parolă *
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={profile.password}
                                onChange={(e) => setProfile({ ...profile, password: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                                placeholder="Introduceți parola"
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Confirmă parola *
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={profile.confirmPassword}
                                onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                                placeholder="Confirmați parola"
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end mt-8">
                        <button
                            onClick={handleProfileSave}
                            className="inline-flex items-center px-6 py-3 bg-blue-600 dark:bg-yellow-500 text-white dark:text-gray-900 rounded-lg hover:bg-blue-700 dark:hover:bg-yellow-600 transition-colors"
                        >
                            <Save className="w-5 h-5 mr-2" />
                            Creează contul
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default CreateProfile;