import React, { useMemo, useState } from 'react';

import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import KpiCard from '../components/KpiCard';
import { useUserData } from '../hooks/useUserData';
import { computeByRules } from '../lib/taxCompute';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month');
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { intrari, iesiri, taxConfig, profile } = useUserData();
  const calc = useMemo(() => computeByRules(intrari, iesiri, currentYear, taxConfig), [intrari, iesiri, taxConfig]);
  const month = calc.months.find(m => m.month === currentMonth)!;
  const data = selectedPeriod === 'month'
    ? { netIncome: month.netIncome, revenues: month.revenues, expenses: month.expenses }
    : { netIncome: calc.totals.netIncome, revenues: calc.totals.revenues, expenses: calc.totals.expenses };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* small spacer so the header sits a bit lower on the page */}
        <div className="h-6" />
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Hi, {profile?.firstName || 'there'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Rezumat financiar</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {selectedPeriod === 'month' ? `Luna ${currentMonth}/${currentYear}` : `Anul ${currentYear}`}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 w-fit">
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedPeriod === 'month'
                ? 'bg-blue-600 text-white dark:bg-yellow-500 dark:text-gray-900'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
            >
              Luna curentă
            </button>
            <button
              onClick={() => setSelectedPeriod('year')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedPeriod === 'year'
                ? 'bg-blue-600 text-white dark:bg-yellow-500 dark:text-gray-900'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
            >
              Anul curent
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KpiCard
            title={`Venit net după taxe - ${selectedPeriod === 'month' ? 'luna aceasta' : 'anul acesta'}`}
            value={formatAmount(data.netIncome)}
            sublabel={selectedPeriod === 'month' ? `Luna ${currentMonth}/${currentYear}` : `Anul ${currentYear}`}
            icon={<DollarSign className="w-5 h-5" />}
          />
          <KpiCard
            title={`Venituri - ${selectedPeriod === 'month' ? 'luna aceasta' : 'anul acesta'}`}
            value={formatAmount(data.revenues)}
            sublabel="Din facturi plătite"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <KpiCard
            title={`Cheltuieli - ${selectedPeriod === 'month' ? 'luna aceasta' : 'anul acesta'}`}
            value={formatAmount(data.expenses)}
            sublabel="Total cheltuieli"
            icon={<TrendingDown className="w-5 h-5" />}
          />
          <KpiCard
            title="Luna/An activ"
            value={selectedPeriod === 'month' ? `${currentMonth}/${currentYear}` : `${currentYear}`}
            sublabel="Perioada selectată"
            icon={<Calendar className="w-5 h-5" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button onClick={() => navigate('/invoices')} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-left hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <h3 className="font-medium text-blue-900 dark:text-blue-400 mb-1">Adaugă factură</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">Înregistrează o factură nouă</p>
          </button>
          <button onClick={() => navigate('/expenses')} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
            <h3 className="font-medium text-red-900 dark:text-red-400 mb-1">Adaugă cheltuială</h3>
            <p className="text-sm text-red-700 dark:text-red-300">Înregistrează o cheltuială nouă</p>
          </button>
          <button onClick={() => navigate('/taxes')} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-left hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
            <h3 className="font-medium text-green-900 dark:text-green-400 mb-1">Vezi taxele</h3>
            <p className="text-sm text-green-700 dark:text-green-300">Calculele pentru anul curent</p>
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
