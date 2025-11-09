import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "../../firebase";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Register: React.FC = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);

            await updateProfile(cred.user, {
                displayName: `${firstName} ${lastName}`,
            });

            await set(ref(db, `users/${cred.user.uid}/profile`), {
                firstName,
                lastName,
                email,
                createdAt: new Date().toISOString(),
            });

            toast.success("Cont creat cu succes!");
            navigate("/dashboard");
        } catch (err: any) {
            toast.error("Eroare la înregistrare");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Înregistrare</h1>
            <form onSubmit={handleRegister} className="space-y-3">
                <input
                    type="text"
                    placeholder="Prenume"
                    className="border rounded w-full px-3 py-2"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Nume"
                    className="border rounded w-full px-3 py-2"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                />
                <input
                    type="email"
                    placeholder="Email"
                    className="border rounded w-full px-3 py-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Parolă"
                    className="border rounded w-full px-3 py-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-2 rounded"
                >
                    {loading ? "..." : "Creează cont"}
                </button>
            </form>
            <p className="text-sm mt-4">
                Ai deja cont?{" "}
                <Link to="/login" className="text-blue-600">
                    Autentifică-te
                </Link>
            </p>
        </div>
    );
};

export default Register;
