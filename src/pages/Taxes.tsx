import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import Layout from '../components/Layout';
import MonthRow from '../components/MonthRow';
import { useUserData } from '../hooks/useUserData';
import { computeByRules } from '../lib/taxCompute';

const Taxes: React.FC = () => {
  // const [year] = useState(new Date().getFullYear());
  const { intrari, iesiri, taxConfig } = useUserData();
  const years = useMemo(() => {
  const ys = new Set<number>();

  for (const { data } of intrari) {
    if (data?.createdAt) ys.add(new Date(data.createdAt).getFullYear());
  }
  for (const { data } of iesiri) {
    if (data?.createdAt) ys.add(new Date(data.createdAt).getFullYear());
  }

  // fallback: dacă n-ai date deloc
  if (ys.size === 0) ys.add(new Date().getFullYear());

  return Array.from(ys).sort((a, b) => b - a); // desc
}, [intrari, iesiri]);

const [year, setYear] = useState<number>(() => new Date().getFullYear());

// dacă anul curent nu există în date, sari automat la primul an cu date
React.useEffect(() => {
  if (!years.includes(year)) setYear(years[0]);
}, [years]); // eslint-disable-line react-hooks/exhaustive-deps


  const { months, totals, differences } = useMemo(() => computeByRules(intrari, iesiri, year, {
    minGrossSalary: taxConfig?.minGrossSalary ?? 4050,
    rates: taxConfig?.rates ?? { CAS_rate: 0.25, CASS_rate: 0.1, incomeTax_rate: 0.1 },
  }), [intrari, iesiri, taxConfig, year]);

  // --- helpers for cash sums (yearly) ---
  const sumCashExpensesForYear = (list: Array<{ id: string; data: any }>, y: number) =>
    list.reduce((acc, item) => {
      const d = item?.data?.createdAt ? new Date(item.data.createdAt) : null;
      if (!d || d.getFullYear() !== y) return acc;
      const amount = Number(item?.data?.amount ?? item?.data?.total ?? 0);
      return acc + (isFinite(amount) ? amount : 0);
    }, 0);

  const sumCashIncomeForYear = (list: Array<{ id: string; data: any }>, y: number) =>
    list.reduce((acc, item) => {
      const d = item?.data?.createdAt ? new Date(item.data.createdAt) : null;
      if (!d || d.getFullYear() !== y) return acc;
      const amount = Number(item?.data?.amount ?? item?.data?.total ?? 0);
      return acc + (isFinite(amount) ? amount : 0);
    }, 0);

  const totalIncome = useMemo(() => sumCashIncomeForYear(intrari, year), [intrari, year]);
  const totalCashExpenses = useMemo(() => sumCashExpensesForYear(iesiri, year), [iesiri, year]);
  const totalTaxes = useMemo(() => months.reduce((acc, r) => acc + r.cas + r.cass + r.incomeTax, 0), [months]);
  const fiscalNetAfterTaxes = useMemo(() => totals.netIncome, [totals]);
  const cashNetAfterAll = useMemo(() => totalIncome - totalCashExpenses - totalTaxes, [totalIncome, totalCashExpenses, totalTaxes]);
  const difference = useMemo(() => fiscalNetAfterTaxes - cashNetAfterAll, [fiscalNetAfterTaxes, cashNetAfterAll]);

  const [showDetails, setShowDetails] = useState<number | null>(null);
  const [showDiffDetails, setShowDiffDetails] = useState(false);
  const [showTotalDetails, setShowTotalDetails] = useState(false);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

  const getMonthName = (month: number) => {
    const months = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];
    return months[month - 1];
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* small spacer so the taxes header sits a bit lower on the page */}
        <div className="h-6" />
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Calcule taxe</h1>
              <p className="text-gray-600 dark:text-gray-400">Anul {year}</p>
            </div>
            <div className="flex items-center gap-2">
  <Calendar className="w-5 h-5 text-gray-500" />
  <select
    value={year}
    onChange={(e) => setYear(Number(e.target.value))}
    className="bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm text-gray-700 dark:text-gray-200"
  >
    {years.map((y) => (
      <option key={y} value={y}>{y}</option>
    ))}
  </select>
</div>

          </div>
        </div>

        {/* Summary KPIs: revenues, fiscal net, cash net */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <div className="text-sm opacity-70 text-gray-700 dark:text-gray-300">Venituri total</div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">{formatAmount(totalIncome)}</div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <div className="text-sm opacity-70 text-gray-700 dark:text-gray-300">Net fiscal (după taxe)</div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">{formatAmount(fiscalNetAfterTaxes)}</div>
            <div className="text-xs opacity-60 mt-1 text-gray-600 dark:text-gray-400">Bazat pe cheltuieli deductibile (incl. amortizare)</div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <div className="text-sm opacity-70 text-gray-700 dark:text-gray-300">Net cash (după taxe + toate cheltuielile)</div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">{formatAmount(cashNetAfterAll)}</div>
            <div className="text-xs opacity-60 mt-1 text-gray-600 dark:text-gray-400">Bani rămași efectiv (cashflow)</div>
          </div>
        </div>

        <div className="mt-2 text-sm opacity-70 text-gray-700 dark:text-gray-300">
          Diferență (amortizare / timing): <span className="font-medium text-gray-900 dark:text-white">{formatAmount(difference)}</span>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              {/* full header for sm+ screens */}
              <div className="hidden sm:grid items-center text-sm font-medium text-gray-600 dark:text-gray-400"
                style={{ gridTemplateColumns: '1fr 140px 140px 120px 120px 120px 160px', columnGap: '8px' }}>
                <div className="pl-2">Luna</div>
                <div className="text-right">Venituri</div>
                <div className="text-right">Cheltuieli</div>
                <div className="text-right">CAS</div>
                <div className="text-right">CASS</div>
                <div className="text-right">Impozit</div>
                <div className="text-right pr-2">Venit net</div>
              </div>

              {/* compact header area for mobile: show labels above compact rows (optional) */}
              <div className="flex sm:hidden text-sm font-medium text-gray-600 dark:text-gray-400">
                <div className="flex-1">Luna</div>
                <div className="ml-4">Rezumat</div>
              </div>
            </div>

            <div className="space-y-2 px-4 sm:px-6 py-4">
              {months.map((data) => (
                <MonthRow key={data.month} data={data} onClick={() => setShowDetails(data.month)} />
              ))}

              {/* special differences row when some months had expenses > revenues */}
              {differences && (
                <button type="button" onClick={() => setShowDiffDetails(true)} className="w-full text-left bg-white dark:bg-gray-800 rounded-lg px-4 py-3 sm:px-0 sm:py-4 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="hidden sm:grid items-center text-sm font-medium text-gray-600 dark:text-gray-400"
                    style={{ gridTemplateColumns: '1fr 140px 140px 120px 120px 120px 160px', columnGap: '8px' }}>
                    <div className="pl-2">Diferență (luni cu cheltuieli &gt; venituri)</div>
                    <div className="text-right">{formatAmount(0)}</div>
                    <div className="text-right">{formatAmount(differences.totalDifference)}</div>
                    <div className="text-right">{formatAmount(-differences.casReduction)}</div>
                    <div className="text-right">{formatAmount(-differences.cassReduction)}</div>
                    <div className="text-right">{formatAmount(-(differences.incomeTaxReduction ?? 0))}</div>
                    <div className="text-right pr-2">{formatAmount(differences.casReduction + differences.cassReduction + (differences.incomeTaxReduction ?? 0))}</div>
                  </div>

                  <div className="flex sm:hidden items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex-1">Diferență</div>
                    <div className="text-right">{formatAmount(differences.totalDifference ?? 0)}</div>
                  </div>
                </button>
              )}
              {showDiffDetails && differences && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-xl border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Detalii — Diferență (cheltuieli &gt; venituri)</h2>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                      <li className="flex justify-between"><span>Total diferență</span><strong>{formatAmount(differences.totalDifference)}</strong></li>
                      <li className="flex justify-between"><span>Reducere CAS</span><strong>{formatAmount(differences.casReduction)}</strong></li>
                      <li className="flex justify-between"><span>Reducere CASS</span><strong>{formatAmount(differences.cassReduction)}</strong></li>
                      <li className="flex justify-between"><span>Impozit pe diferență</span><strong>{formatAmount(-(differences.incomeTaxReduction ?? 0))}</strong></li>
                      <li className="flex justify-between"><span>Suma CASS (pe luni)</span><strong>{formatAmount(differences.cassMonthSum ?? 0)}</strong></li>
                      <li className="flex justify-between"><span>Rest CASS (reconciliere)</span><strong>{formatAmount(differences.cassRest ?? 0)}</strong></li>
                    </ul>
                    <button onClick={() => setShowDiffDetails(false)} className="mt-6 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Închide</button>
                  </motion.div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowTotalDetails(true)}
              className="w-full px-4 sm:px-6 py-6 mt-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              {/* full totals for sm+ */}
              <div className="hidden sm:grid items-center text-sm font-semibold text-gray-900 dark:text-white"
                style={{ gridTemplateColumns: '1fr 140px 140px 120px 120px 120px 160px', columnGap: '8px' }}>
                <div className="pl-2">Total</div>
                <div className="text-right">{formatAmount(totals.revenues)}</div>
                <div className="text-right">{formatAmount(totals.expenses)}</div>
                <div className="text-right">{formatAmount(totals.cas)}</div>
                <div className="text-right">{formatAmount(totals.cass)}</div>
                <div className="text-right">{formatAmount(totals.incomeTax)}</div>
                <div className="text-right pr-2">{formatAmount(totals.netIncome)}</div>
              </div>

              {/* compact totals for mobile */}
              <div className="flex sm:hidden items-center justify-between text-sm font-semibold text-gray-900 dark:text-white">
                <div className="text-left">Total</div>
                <div className="text-right">
                  <div className="text-sm">{formatAmount(totals.revenues)}</div>
                  <div className="text-sm">{formatAmount(totals.expenses)}</div>
                </div>
                <div className="text-right font-semibold">{formatAmount(totals.netIncome)}</div>
              </div>
            </button>
          </div>
        </div>

        {showDetails !== null && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-xl border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Detalii — {getMonthName(showDetails)}
              </h2>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex justify-between"><span>Venituri</span><strong>{formatAmount(months[showDetails - 1].revenues)}</strong></li>
                <li className="flex justify-between"><span>Cheltuieli</span><strong>{formatAmount(months[showDetails - 1].expenses)}</strong></li>
                <li className="flex justify-between"><span>CAS</span><strong>{formatAmount(months[showDetails - 1].cas)}</strong></li>
                <li className="flex justify-between"><span>CASS</span><strong>{formatAmount(months[showDetails - 1].cass)}</strong></li>
                <li className="flex justify-between"><span>Impozit</span><strong>{formatAmount(months[showDetails - 1].incomeTax)}</strong></li>
                <li className="flex justify-between"><span>Venit net</span><strong>{formatAmount(months[showDetails - 1].netIncome)}</strong></li>
              </ul>
              <button onClick={() => setShowDetails(null)} className="mt-6 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                Închide
              </button>
            </motion.div>
          </div>
        )}

        {showTotalDetails && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-xl border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Detalii — Total Anual {year}
              </h2>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex justify-between"><span>Total venituri</span><strong>{formatAmount(totals.revenues)}</strong></li>
                <li className="flex justify-between"><span>Total cheltuieli</span><strong>{formatAmount(totals.expenses)}</strong></li>
                <li className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2"><span>Venit brut</span><strong>{formatAmount(totals.revenues - totals.expenses)}</strong></li>
                <li className="flex justify-between"><span>Total CAS</span><strong>{formatAmount(totals.cas)}</strong></li>
                <li className="flex justify-between"><span>Total CASS</span><strong>{formatAmount(totals.cass)}</strong></li>
                <li className="flex justify-between"><span>Total impozit pe venit</span><strong>{formatAmount(totals.incomeTax)}</strong></li>
                <li className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2 font-semibold"><span>Total venit net</span><strong>{formatAmount(totals.netIncome)}</strong></li>
              </ul>
              <button onClick={() => setShowTotalDetails(false)} className="mt-6 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                Închide
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Taxes;
