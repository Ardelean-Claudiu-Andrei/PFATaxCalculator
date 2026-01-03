import type { Iesire } from "./rtdb";

export type DeductibleAllocation = {
  month: number; // 1-12
  deductibleRon: number;
  source: "expense" | "asset_amortization";
  expenseId: string;
};

const DEFAULT_THRESHOLD_RON = 2500;

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function getMonth(d: Date) {
  return d.getMonth() + 1;
}

/**
 * Calculează alocări lunare deductibile pentru o cheltuială.
 *
 * IMPORTANT: asta modelează strict "cum vrei tu să calculezi în platformă".
 * În realitate, deductibilitatea poate depinde de documente justificative și de obiectul activității.
 */
export function allocateDeductible(
  expenseId: string,
  e: Iesire,
  year: number,
  limitedRemainingByGroup: Record<string, number>
): DeductibleAllocation[] {
  const createdAt = e.createdAt ? new Date(e.createdAt) : new Date();
  if (createdAt.getFullYear() !== year) {
    // pentru mijloace fixe, amortizarea poate continua în anii următori,
    // dar aici cheltuiala trebuie să aibă o data/asset.startDate.
    // vom gestiona asta mai jos în cazul asset.
  }

  const d = e.deductibility;
  const type = d?.type ?? "full";
  const businessUsePct = Math.max(0, Math.min(100, d?.businessUsePct ?? 100));
  const bu = businessUsePct / 100;

  // NONE
  if (type === "none") return [];

  // ASSET (mijloc fix) => amortizare
  if (type === "asset" && d?.asset) {
    const asset = d.asset;
    const threshold = asset.thresholdRon ?? DEFAULT_THRESHOLD_RON;
    const start = asset.startDate ? new Date(asset.startDate) : createdAt;
    const cost = Number(asset.acquisitionCostRon ?? e.amount ?? 0);
    const lifeMonths = Math.max(1, Math.floor(asset.usefulLifeMonths ?? 36));

    // dacă e sub prag => obiect de inventar, deductibil integral (în luna achiziției)
    if (cost > 0 && cost < threshold) {
      if (start.getFullYear() !== year) return [];
      return [
        {
          month: getMonth(start),
          deductibleRon: round2(cost * bu),
          source: "expense",
          expenseId,
        },
      ];
    }

    // amortizare liniară lunară
    const monthly = round2((cost / lifeMonths) * bu);
    if (!Number.isFinite(monthly) || monthly <= 0) return [];

    const allocations: DeductibleAllocation[] = [];
    // amortizează de la start, timp de lifeMonths.
    for (let i = 0; i < lifeMonths; i++) {
      const dt = new Date(start);
      dt.setMonth(start.getMonth() + i);
      if (dt.getFullYear() !== year) continue;
      allocations.push({
        month: getMonth(dt),
        deductibleRon: monthly,
        source: "asset_amortization",
        expenseId,
      });
    }
    return allocations;
  }

  // dacă nu e în anul curent, ignorăm (cheltuială normală)
  if (createdAt.getFullYear() !== year) return [];

  const month = getMonth(createdAt);
  const amount = Number(e.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return [];

  // FULL
  if (type === "full") {
    return [{ month, deductibleRon: round2(amount * bu), source: "expense", expenseId }];
  }

  // PARTIAL
  if (type === "partial") {
    const pct = Math.max(0, Math.min(100, d?.partialPct ?? 50)) / 100;
    return [{ month, deductibleRon: round2(amount * bu * pct), source: "expense", expenseId }];
  }

  // LIMITED
  if (type === "limited") {
    const group = (d?.limitGroup ?? "default").trim() || "default";
    const cap = Math.max(0, Number(d?.limitAnnualRon ?? 0));
    if (cap <= 0) {
      // fără plafon setat => considerăm nedeductibil ca să nu dăm rezultate eronate
      return [];
    }
    const remaining = limitedRemainingByGroup[group] ?? cap;
    const wanted = round2(amount * bu);
    const used = Math.max(0, Math.min(remaining, wanted));
    limitedRemainingByGroup[group] = round2(remaining - used);
    if (used <= 0) return [];
    return [{ month, deductibleRon: used, source: "expense", expenseId }];
  }

  return [];
}

export function sumAllocationsByMonth(allocs: DeductibleAllocation[]) {
  const byMonth: Record<number, number> = {};
  for (let m = 1; m <= 12; m++) byMonth[m] = 0;
  for (const a of allocs) {
    byMonth[a.month] = round2((byMonth[a.month] ?? 0) + a.deductibleRon);
  }
  return byMonth;
}
