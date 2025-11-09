import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import Layout from '../components/Layout';
import ExpenseItem from '../components/ExpenseItem';
import { auth } from '../../firebase';
import { addIesire, deleteIesire, subscribeIesiri, updateIesire } from '../lib/rtdb';
import { toast } from 'react-toastify';
import { useUserData } from "../hooks/useUserData";
import { onAuthStateChanged } from "firebase/auth";

type Category = 'Salary' | 'Consumables' | 'Other';

interface Expense {
  id: string;
  category: Category;
  name?: string;
  amount: number;
  createdAt: Date;
}

const Expenses: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [form, setForm] = useState<{ category: Category; name: string; amount: number; createdAt?: string }>({
    category: 'Other', name: '', amount: 0, createdAt: new Date().toISOString()
  });

  const [editingExpense, setEditingExpense] = useState<{ id: string; category: Category; name: string; amount: number; createdAt: string } | null>(null);

  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    let unsubDB: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (unsubDB) {
        unsubDB();
        unsubDB = undefined;
      }
      if (!u) { setExpenses([]); return; }

      unsubDB = subscribeIesiri(u.uid, (list) => {
        const mapped: Expense[] = list.map(({ id, data }) => ({
          id,
          category: (data.category as Category) || "Other",
          name: data.name || "",
          amount: data.amount || 0,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        }));
        mapped.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setExpenses(mapped);
      });
    });

    return () => {
      unsubAuth();
      if (unsubDB) unsubDB();
    };
  }, []);

  const handleEdit = (expense: Expense) => {
    // open modal with expense data for editing
    setEditingExpense({ id: expense.id, category: expense.category, name: expense.name || '', amount: expense.amount, createdAt: expense.createdAt.toISOString() });
    setForm({ category: expense.category, name: expense.name || '', amount: expense.amount, createdAt: expense.createdAt.toISOString() });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    const u = auth.currentUser;
    if (!u) return;
    await deleteIesire(u.uid, id);
    toast.info("Cheltuială ștearsă");
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense =>
      (expense.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [expenses, searchTerm]);

  // addExpense handled inline in modal save button (supports add and edit)

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cheltuieli</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-yellow-500 text-white dark:text-gray-900 rounded-lg hover:bg-blue-700 dark:hover:bg-yellow-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adaugă cheltuială
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Caută cheltuieli..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Expenses List */}
        <div className="space-y-4">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Nu s-au găsit cheltuieli.' : 'Nu aveți cheltuieli înregistrate încă.'}
              </p>
            </div>
          ) : (
            filteredExpenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Add Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Adaugă cheltuială nouă
              </h2>
              <div className="space-y-3">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="Salary">Salary</option>
                  <option value="Consumables">Consumables</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  id="expenseName"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Denumire (opțional)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                />
                <input
                  id="expenseAmount"
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  placeholder="Sumă (RON)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                />
                <label htmlFor="expenseDate" className="block text-sm text-gray-600 dark:text-gray-300">Data</label>
                <input
                  id="expenseDate"
                  type="date"
                  value={form.createdAt ? form.createdAt.slice(0, 10) : ''}
                  onChange={(e) => setForm({ ...form, createdAt: new Date(e.target.value).toISOString() })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <button
                  onClick={() => { setShowAddForm(false); setEditingExpense(null); setForm({ category: 'Other', name: '', amount: 0, createdAt: new Date().toISOString() }); }}
                  className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
                >
                  Anulează
                </button>
                <button
                  onClick={async () => {
                    const u = auth.currentUser;
                    if (!u) { toast.error("Nu ești autentificat"); return; }
                    if (!form.amount || form.amount <= 0) { toast.error("Sumă invalidă"); return; }
                    if (editingExpense) {
                      // save edit
                      await updateIesire(u.uid, editingExpense.id, {
                        name: form.name,
                        category: form.category,
                        amount: Number(form.amount),
                        createdAt: form.createdAt,
                      });
                      toast.success("Cheltuială actualizată");
                    } else {
                      await addIesire(u.uid, {
                        amount: Number(form.amount),
                        name: form.name,
                        category: form.category,
                        createdAt: form.createdAt,
                      });
                      toast.success("Cheltuială adăugată");
                    }
                    setShowAddForm(false);
                    setEditingExpense(null);
                    setForm({ category: 'Other', name: '', amount: 0, createdAt: new Date().toISOString() });
                  }}
                  className="w-full px-4 py-2 bg-blue-600 dark:bg-yellow-500 text-white dark:text-gray-900 rounded-lg"
                >
                  Salvează
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Expenses;
