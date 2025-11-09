import React from 'react';
import { motion } from 'framer-motion';
import { Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface Expense {
  id: string;
  category: 'Salary' | 'Consumables' | 'Other';
  name?: string;
  amount: number;
  createdAt: Date;
}

interface ExpenseItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

const ExpenseItem: React.FC<ExpenseItemProps> = ({ expense, onEdit, onDelete }) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };



  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'Salary':
        return 'Salariu';
      case 'Consumables':
        return 'Consumabile';
      case 'Other':
        return 'Altele';
      default:
        return category;
    }
  };

  return (
    <>
      {/* Desktop / list row view (match Invoices) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden sm:flex items-center border-b py-2"
      >
        <div className="w-10 text-gray-400 dark:text-gray-300 flex items-center justify-center">
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg inline-flex items-center justify-center">
            <Receipt className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="flex-1 text-gray-200 dark:text-white min-w-0 truncate">
          {expense.name || getCategoryLabel(expense.category)}
        </div>

        <div className="min-w-[120px] text-right font-semibold px-2 text-red-600 dark:text-red-400 whitespace-nowrap">
          -{formatAmount(expense.amount)}
        </div>

        <div className="min-w-[140px] px-2 text-gray-300 dark:text-gray-200 text-sm">
          {format(expense.createdAt, 'dd MMM yyyy', { locale: ro })}
        </div>

        <div className="min-w-[120px] px-2 text-right">
          <div className="inline-flex gap-2">
            <button onClick={() => onEdit(expense)} className="px-2 py-1 rounded bg-yellow-500 text-black">Editează</button>
            <button onClick={() => onDelete(expense.id)} className="px-2 py-1 rounded bg-red-600 text-white">Șterge</button>
          </div>
        </div>
      </motion.div>

      {/* Mobile compact view (like Invoices) */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="sm:hidden bg-white dark:bg-gray-800 rounded-lg px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {expense.name || getCategoryLabel(expense.category)}
            </div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{format(expense.createdAt, 'dd MMM yyyy', { locale: ro })}</div>
          </div>
          <div className="ml-3 text-right">
            <div className="font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">-{formatAmount(expense.amount)}</div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={() => onEdit(expense)} className="flex-1 px-3 py-2 rounded bg-yellow-500 text-black">Editează</button>
          <button onClick={() => onDelete(expense.id)} className="flex-1 px-3 py-2 rounded bg-red-600 text-white">Șterge</button>
        </div>
      </motion.div>
    </>
  );
};

export default ExpenseItem;