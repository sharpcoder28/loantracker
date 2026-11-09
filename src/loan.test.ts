import test from 'node:test';
import assert from 'node:assert/strict';
import { computeLedger } from './loan.ts';

const loan = { amount: 10000, rate: 365, startDate: '2025-01-01' };

test('posts interest and applies payment to interest first', () => {
  const l = computeLedger(loan, [
    { id: 'a', type: 'interest', date: '2025-01-11' },
    { id: 'b', type: 'payment', date: '2025-01-11', amount: 1500 },
  ]);
  assert.equal(l.rows[0].amount, 1000);
  assert.equal(l.rows[1].toInterest, 1000);
  assert.equal(l.rows[1].toPrincipal, 500);
  assert.equal(l.principal, 9500);
  assert.equal(l.interestOwed, 0);
});
