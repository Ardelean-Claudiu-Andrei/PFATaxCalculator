import React, { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Loader2, Chrome } from "lucide-react";
import { ensureUserProfile } from "../lib/ensureProfile";

const Login: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleEmailLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            await ensureUserProfile(cred.user); // <--- ca să ai profil și la email login
            toast.success("Autentificat cu succes!");
            navigate("/"); // sau "/dashboard"
        } catch (err: any) {
            console.error(err);
            toast.error("Email sau parolă incorectă!");
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogle() {
        setLoading(true);
        try {
            const cred = await signInWithPopup(auth, googleProvider);
            await ensureUserProfile(cred.user); // 🔥 CREARE PROFIL în RTDB
            toast.success("Autentificat cu Google!");
            navigate("/"); // sau "/dashboard"
        } catch (err: any) {
            console.error("Eroare Google Auth:", err);
            toast.error("Eroare la autentificare cu Google");
        } finally {
            setLoading(false);
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4"
        >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-full max-w-md p-8">
                <div className="flex items-center justify-center mb-6">
                    <LogIn className="w-6 h-6 text-blue-600 dark:text-yellow-500 mr-2" />
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Autentificare
                    </h1>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500"
                                placeholder="exemplu@email.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                            Parolă
                        </label>
                        <div className="relative">
                            <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center px-4 py-2 bg-blue-600 dark:bg-yellow-500 text-white dark:text-gray-900 font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-yellow-600 transition-colors"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Intră în cont
                    </button>
                </form>

                <div className="mt-6">
                    <button
                        onClick={handleGoogle}
                        disabled={loading}
                        className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Chrome className="w-5 h-5 mr-2 text-blue-500" />
                        Continuă cu Google
                    </button>
                </div>

                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                    Nu ai cont?{" "}
                    <Link
                        to="/register"
                        className="text-blue-600 dark:text-yellow-500 font-medium hover:underline"
                    >
                        Creează unul
                    </Link>
                </p>
            </div>
        </motion.div>
    );
};

export default Login;
