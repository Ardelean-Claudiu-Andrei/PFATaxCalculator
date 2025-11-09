import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Check, X, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface Invoice {
  id: string;
  series: string;
  number: string;
  amount: number;
  paid: boolean;
  createdAt: Date;
  paidAt?: Date | null;
}

interface InvoiceItemProps {
  invoice: Invoice;
  onTogglePaid: (id: string) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
}

const InvoiceItem: React.FC<InvoiceItemProps> = ({ invoice, onTogglePaid, onEdit, onDelete }) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {invoice.series}-{invoice.number}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${invoice.paid
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                }`}>
                {invoice.paid ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Plătită
                  </>
                ) : (
                  <>
                    <X className="w-3 h-3 mr-1" />
                    Neplătită
                  </>
                )}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {format(invoice.createdAt, 'dd MMM yyyy', { locale: ro })}
              {invoice.paidAt && (
                <span className="ml-2">
                  • Plătită: {format(invoice.paidAt, 'dd MMM yyyy', { locale: ro })}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-lg font-semibold text-gray-900 dark:text-white whitespace-nowrap">
            {formatAmount(invoice.amount)}
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onTogglePaid(invoice.id)}
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {invoice.paid ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onEdit(invoice)}
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(invoice.id)}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InvoiceItem;