import { useEffect, useState, type FormEvent } from 'react';
import { computeLedger, type EntryType, type Loan, type LoanEvent } from './loan.ts';

const KEY = 'amort.loan.v1';
const today = () => new Date().toLocaleDateString('en-CA');
interface State {
  loan: Loan | null;
  events: LoanEvent[];
}

const money = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

function load(): State {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null') || { loan: null, events: [] };
  } catch {
    return { loan: null, events: [] };
  }
}

function SetupForm({ onSave }: { onSave: (loan: Loan) => void }) {
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [startDate, setStartDate] = useState(today());
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave({ amount: Number(amount), rate: Number(rate), startDate });
  };
  return (
    <form onSubmit={submit} className="card">
      <h2>New loan</h2>
      <label>Initial amount
        <input type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      <label>Annual interest rate (%)
        <input type="number" min="0" step="0.001" required value={rate} onChange={(e) => setRate(e.target.value)} />
      </label>
      <label>Loan start date
        <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </label>
      <button>Create loan</button>
    </form>
  );
}

interface EntryFormProps {
  title: string;
  button: string;
  withAmount?: boolean;
  onAdd: (v: { date: string; amount?: number }) => void;
}

function EntryForm({ title, button, withAmount, onAdd }: EntryFormProps) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onAdd({ date, amount: withAmount ? Number(amount) : undefined });
    setAmount('');
  };
  return (
    <form onSubmit={submit} className="card">
      <h2>{title}</h2>
      {withAmount && (
        <label>Amount
          <input type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
      )}
      <label>{withAmount ? 'Payment date' : 'Effective date'}
        <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <button>{button}</button>
    </form>
  );
}

export default function App() {
  const [state, setState] = useState<State>(load);
  const { loan, events } = state;

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  if (!loan) return <main><h1>Loan Tracker</h1><SetupForm onSave={(l: Loan) => setState({ loan: l, events: [] })} /></main>;

  const ledger = computeLedger(loan, events);
  const add = (type: EntryType) => ({ date, amount }: { date: string; amount?: number }) =>
    setState((s) => ({ ...s, events: [...s.events, { id: uid(), type, date, amount }] }));
  const remove = (id: string) => setState((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }));
  const reset = () => {
    if (confirm('Delete this loan and all history?')) setState({ loan: null, events: [] });
  };

  return (
    <main>
      <h1>Loan Tracker</h1>
      <section className="summary">
        <div><span>Original</span><b>{money(loan.amount)}</b></div>
        <div><span>Rate</span><b>{loan.rate}%</b></div>
        <div><span>Principal</span><b>{money(ledger.principal)}</b></div>
        <div><span>Interest owed</span><b>{money(ledger.interestOwed)}</b></div>
        <div><span>Total balance</span><b>{money(ledger.balance)}</b></div>
        <div><span>Accrued, not yet applied</span><b>{money(ledger.accruedUnposted)}</b></div>
      </section>
      <div className="forms">
        <EntryForm title="Add payment" button="Add payment" withAmount onAdd={add('payment')} />
        <EntryForm title="Apply interest" button="Calculate & apply interest" onAdd={add('interest')} />
      </div>
      <h2>History</h2>
      <table>
        <thead>
          <tr><th>Date</th><th>Type</th><th>Amount</th><th>Details</th><th>Balance</th><th /></tr>
        </thead>
        <tbody>
          {ledger.rows.length === 0 && <tr><td colSpan={6}>No activity yet.</td></tr>}
          {ledger.rows.map((r) => (
            <tr key={r.id}>
              <td>{r.date}</td>
              <td>{r.type === 'payment' ? 'Payment' : 'Interest'}</td>
              <td>{money(r.amount)}</td>
              <td>{r.type === 'payment' ? `${money(r.toInterest ?? 0)} interest / ${money(r.toPrincipal ?? 0)} principal` : ''}</td>
              <td>{money(r.balance)}</td>
              <td><button className="link" onClick={() => remove(r.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">Simple daily interest (rate ÷ 365) on principal since the previous entry. Payments go to applied interest first, then principal. Interest is computed from the loan start date, so entries can be added or deleted in any order.</p>
      <button className="danger" onClick={reset}>Delete loan</button>
    </main>
  );
}
