import type { Intrare, Iesire, TaxConfig } from "../hooks/useUserData";

export type MonthlyCalc = {
  month: number; // 1-12
  revenues: number;
  expenses: number;
  cas: number;
  cass: number;
  incomeTax: number;
  netIncome: number; // after taxes
};

export type YearSummary = {
  months: MonthlyCalc[];
  totals: {
    revenues: number;
    expenses: number;
    cas: number;
    cass: number;
    incomeTax: number;
    netIncome: number;
  }
  differences?: {
    totalDifference: number; // sum of (expenses - revenues) for months where expenses > revenues
    casReduction: number; // amount subtracted from CAS totals
    cassReduction: number; // amount subtracted from CASS totals
    cassMonthSum?: number;
    cassRest?: number;
    incomeTaxReduction?: number;
  }
};

const MONTHS = Array.from({length: 12}, (_,i)=>i+1);

function round2(n: number){ return Math.round((n + Number.EPSILON) * 100) / 100; }

export function computeByRules(
  intrari: { id: string; data: Intrare }[],
  iesiri: { id: string; data: Iesire }[],
  year: number,
  config?: Partial<TaxConfig>
): YearSummary {
  const minGrossSalary = config?.minGrossSalary ?? 4050;
  const rates = {
    CAS_rate: config?.rates?.CAS_rate ?? 0.25,
    CASS_rate: config?.rates?.CASS_rate ?? 0.1,
    incomeTax_rate: config?.rates?.incomeTax_rate ?? 0.1,
  };

  // group per month
  const monthRevenues: Record<number, number> = {};
  const monthExpenses: Record<number, number> = {};
  for (const m of MONTHS) {
    monthRevenues[m] = 0;
    monthExpenses[m] = 0;
  }

  for (const {data} of intrari) {
    if (!data?.createdAt) continue;
    const d = new Date(data.createdAt);
    if (d.getFullYear() !== year) continue;
    const m = d.getMonth()+1;
    const paid = data.paid ?? true;
    if (!paid) continue;
    monthRevenues[m] += Number(data.amount||0);
  }

  for (const {data} of iesiri) {
    if (!data?.createdAt) continue;
    const d = new Date(data.createdAt);
    if (d.getFullYear() !== year) continue;
    const m = d.getMonth()+1;
    monthExpenses[m] += Number(data.amount||0);
  };

  const monthlyNetPreTax: Record<number, number> = {};
  for (const m of MONTHS) {
    const rev = monthRevenues[m] || 0;
    const exp = monthExpenses[m] || 0;
    // taxable pre-tax net: if expenses exceed revenues, taxable net is 0 for that month
    monthlyNetPreTax[m] = rev > 0 ? Math.max(0, rev - exp) : 0;
  }

  const annualNet = MONTHS.reduce((s,m)=> s + monthlyNetPreTax[m], 0);

  const cassThreshold = 6 * minGrossSalary;
  const casThreshold = 12 * minGrossSalary;

  const cassApplicable = annualNet > cassThreshold;
  const casApplicable = annualNet > casThreshold;
  // trackers for months where expenses > revenues
  let totalDifference = 0;

  const months: MonthlyCalc[] = MONTHS.map(m => {
    const rev = monthRevenues[m] || 0;
    const exp = monthExpenses[m] || 0;
    const netPre = monthlyNetPreTax[m];

    // CAS applied on taxable net (revenues - expenses) when applicable
    const CAS = casApplicable ? round2(netPre * rates.CAS_rate) : 0;
    // CASS applied on taxable net as well (per your rule: CASS = 10% of (rev - exp) per month)
    const CASS = cassApplicable ? round2(netPre * rates.CASS_rate) : 0;
    const incomeTax = round2(Math.max(0, (netPre - CAS - CASS) * rates.incomeTax_rate));
    const netAfter = round2(netPre - CAS - CASS - incomeTax);

    // accumulate deficits (expenses > revenues)
    if (exp > rev) {
      const diff = round2(exp - rev);
      totalDifference += diff;
    }

    return {
      month: m,
      revenues: round2(rev),
      expenses: rev === 0 ? 0 : round2(exp),
      cas: CAS,
      cass: CASS,
      incomeTax: incomeTax,
      netIncome: netAfter,
    };
  });

  const totals = months.reduce((acc, m)=>{
    acc.revenues += m.revenues;
    acc.expenses += m.expenses;
    acc.cas += m.cas;
    acc.cass += m.cass;
    acc.incomeTax += m.incomeTax;
    acc.netIncome += m.netIncome;
    return acc;
  }, { revenues:0, expenses:0, cas:0, cass:0, incomeTax:0, netIncome:0 });

  for (const k of Object.keys(totals) as (keyof typeof totals)[]) {
    totals[k] = round2(totals[k]);
  }

  // compute reductions from the accumulated deficits (difference row)
  const casReduction = casApplicable ? round2(totalDifference * rates.CAS_rate) : 0;
  const cassReduction = cassApplicable ? round2(totalDifference * rates.CASS_rate) : 0;

  // compute income tax reduction for the difference row: 10% of (difference - CAS - CASS)
  const incomeTaxReduction = round2(Math.max(0, (totalDifference - casReduction - cassReduction) * rates.incomeTax_rate));

  // apply reductions to totals (never below zero)
  totals.cas = round2(Math.max(0, totals.cas - casReduction));
  totals.cass = round2(Math.max(0, totals.cass - cassReduction));
  // income tax reduced by the computed amount; netIncome increases accordingly
  totals.incomeTax = round2(Math.max(0, totals.incomeTax - incomeTaxReduction));
  totals.netIncome = round2(totals.netIncome + casReduction + cassReduction + incomeTaxReduction);

  // differences summary: total deficit and reductions
  const differences = (totalDifference > 0) ? {
    totalDifference: round2(totalDifference),
    casReduction: round2(casReduction),
    cassReduction: round2(cassReduction),
    incomeTaxReduction: round2(incomeTaxReduction),
    cassMonthSum: round2(months.reduce((s,mm)=> s + mm.cass, 0)),
    cassRest: round2(months.reduce((s,mm)=> s + mm.cass, 0) - totals.cass),
  } : undefined;

  return { months, totals, differences };
}
