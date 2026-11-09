// Pure loan logic. Interest is simple daily interest: principal * (rate/100) / 365 per day.
// Interest accrues silently on the principal; it is "posted" (becomes owed) when an
// interest entry is applied with an effective date. Payments go to posted interest first,
// then principal.

export interface Loan {
  amount: number;
  rate: number;
  startDate: string;
}

export type EntryType = 'payment' | 'interest';

export interface LoanEvent {
  id: string;
  type: EntryType;
  date: string;
  amount?: number;
}

export interface LedgerRow {
  id: string;
  type: EntryType;
  date: string;
  amount: number;
  toInterest?: number;
  toPrincipal?: number;
  balance: number;
}

export interface Ledger {
  rows: LedgerRow[];
  principal: number;
  interestOwed: number;
  balance: number;
  accruedUnposted: number;
}

const DAY_MS = 86400000;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / DAY_MS);

// Interest entries on the same date are applied before payments on that date.
const order: Record<EntryType, number> = { interest: 0, payment: 1 };

export function computeLedger(loan: Loan, events: LoanEvent[]): Ledger {
  const sorted = [...events].sort(
    (a, b) => a.date.localeCompare(b.date) || order[a.type] - order[b.type] || a.id.localeCompare(b.id),
  );
  let principal = loan.amount;
  let interestOwed = 0;
  let accrued = 0;
  let last = loan.startDate;

  const rows = sorted.map((e): LedgerRow => {
    const days = Math.max(0, daysBetween(last, e.date));
    accrued += (principal * (loan.rate / 100) * days) / 365;
    last = e.date > last ? e.date : last;

    if (e.type === 'interest') {
      const amount = round2(accrued);
      accrued -= amount;
      interestOwed = round2(interestOwed + amount);
      return { id: e.id, type: e.type, date: e.date, amount, balance: round2(principal + interestOwed) };
    }
    const paid = e.amount ?? 0;
    const toInterest = Math.min(paid, interestOwed);
    const toPrincipal = Math.min(round2(paid - toInterest), principal);
    interestOwed = round2(interestOwed - toInterest);
    principal = round2(principal - toPrincipal);
    return {
      id: e.id,
      type: e.type,
      date: e.date,
      amount: paid,
      toInterest,
      toPrincipal,
      balance: round2(principal + interestOwed),
    };
  });

  return {
    rows,
    principal,
    interestOwed,
    balance: round2(principal + interestOwed),
    accruedUnposted: round2(accrued),
  };
}
