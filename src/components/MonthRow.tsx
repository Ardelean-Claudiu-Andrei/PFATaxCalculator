import React from 'react';
import { ChevronRight } from 'lucide-react';

interface MonthData {
  month: number;
  revenues: number;
  expenses: number;
  cas: number;
  cass: number;
  incomeTax: number;
  netIncome: number;
}

interface MonthRowProps {
  data: MonthData;
  onClick: () => void;
}

const MonthRow: React.FC<MonthRowProps> = ({ data, onClick }) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    const months = [
      'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
      'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
    ];
    return months[month - 1];
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-gray-800 rounded-lg px-4 sm:px-0 py-3 sm:py-4 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Mobile compact view: show month and a compact summary */}
      <div className="flex flex-col sm:hidden">
        <div className="font-medium text-gray-900 dark:text-white truncate">{getMonthName(data.month)}</div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="text-green-600 dark:text-green-400">{formatAmount(data.revenues)}</div>
          <div className="text-red-600 dark:text-red-400">{formatAmount(data.expenses)}</div>
          <div className="font-semibold text-gray-900 dark:text-white">{formatAmount(data.netIncome)}</div>
        </div>
      </div>

      {/* Desktop / tablet view: full columns using fixed grid so columns align */}
      <div className="hidden sm:grid items-center" style={{ gridTemplateColumns: '1fr 140px 140px 120px 120px 120px 160px', columnGap: '8px' }}>
        <div className="pl-2 font-medium text-gray-900 dark:text-white min-w-0 truncate">{getMonthName(data.month)}</div>

        <div className="text-right text-green-600 dark:text-green-400">{formatAmount(data.revenues)}</div>
        <div className="text-right text-red-600 dark:text-red-400">{formatAmount(data.expenses)}</div>
        <div className="text-right text-gray-600 dark:text-gray-400">{formatAmount(data.cas)}</div>
        <div className="text-right text-gray-600 dark:text-gray-400">{formatAmount(data.cass)}</div>
        <div className="text-right text-gray-600 dark:text-gray-400">{formatAmount(data.incomeTax)}</div>
        <div className="text-right pr-2 flex items-center justify-end gap-2">
          <span className="font-semibold text-gray-900 dark:text-white">{formatAmount(data.netIncome)}</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </button>
  );
};

export default MonthRow;