import test from 'node:test'
import assert from 'node:assert/strict'
import { debtorHistory, allocateRepayment } from './debtor-history.js'

const outstanding = [
  { id: 23, date: '20/11/2026', time: '11:18:00', remaining: 200 },
  { id: 22, date: '12/11/2026', time: '14:32:00', remaining: 250 },
  { id: 21, date: '11/11/2026', time: '11:34:00', remaining: 12 },
]

test('splits a repayment across chosen loans, oldest chosen loan first', () => {
  assert.deepEqual(allocateRepayment(outstanding, ['23', '21'], 212), [{ id: 21, amount: 12 }, { id: 23, amount: 200 }])
  assert.deepEqual(allocateRepayment(outstanding, ['23', '22', '21'], 100), [{ id: 21, amount: 12 }, { id: 22, amount: 88 }])
})

test('allocation ignores unknown ids and never exceeds what is owed', () => {
  assert.deepEqual(allocateRepayment(outstanding, ['22', '999'], 1000), [{ id: 22, amount: 250 }])
  assert.deepEqual(allocateRepayment(outstanding, [], 50), [])
  assert.deepEqual(allocateRepayment(outstanding, ['22'], 0), [])
})

test('allocation keeps cents exact', () => {
  const loans = [{ id: 1, date: '01/11/2026', time: '', remaining: 0.1 }, { id: 2, date: '02/11/2026', time: '', remaining: 0.2 }]
  assert.deepEqual(allocateRepayment(loans, ['1', '2'], 0.3), [{ id: 1, amount: 0.1 }, { id: 2, amount: 0.2 }])
})

const lend = (id, date, time, amount, category = 'นัท') => ({ id, date, time, amount, category, type: 'ให้ยืมเงิน', account: 'กสิกร', note: '-' })
const repay = (id, date, time, amount, category = 'นัท') => ({ id, date, time, amount, category, type: 'ได้คืนจากลูกหนี้', account: 'เงินสด', note: '-' })

test('repayments pay off the oldest loans first', () => {
  const h = debtorHistory([
    repay(4, '20/11/2026', '09:00:00', 700),
    lend(1, '01/10/2026', '10:00:00', 500),
    lend(2, '15/10/2026', '12:30:00', 300),
    lend(3, '05/11/2026', '18:00:00', 200),
  ], 'นัท')
  assert.deepEqual(h.loans.map(l => [l.id, l.remaining]), [[3, 200], [2, 100], [1, 0]])
  assert.equal(h.totalLent, 1000)
  assert.equal(h.totalRepaid, 700)
  assert.equal(h.remaining, 300)
  assert.deepEqual(h.outstanding.map(l => l.id), [3, 2])
})

test('only this person, newest entries first, same-day ordered by time', () => {
  const h = debtorHistory([
    lend(1, '01/11/2026', '08:00:00', 100),
    lend(2, '01/11/2026', '20:00:00', 50),
    lend(3, '02/11/2026', '09:00:00', 999, 'ต้น'),
    { id: 9, date: '01/11/2026', type: 'รายจ่าย', amount: 10, category: 'นัท' },
  ], 'นัท')
  assert.deepEqual(h.entries.map(e => e.id), [2, 1])
})

test('names match after trimming, amounts may be strings with commas', () => {
  const h = debtorHistory([lend(1, '01/11/2026', '08:00:00', '1,200.50', ' นัท ')], 'นัท')
  assert.equal(h.totalLent, 1200.5)
  assert.equal(h.loans[0].remaining, 1200.5)
})

test('overpayment never makes a loan negative', () => {
  const h = debtorHistory([lend(1, '01/11/2026', '08:00:00', 100), repay(2, '02/11/2026', '08:00:00', 150)], 'นัท')
  assert.equal(h.loans[0].remaining, 0)
  assert.equal(h.remaining, 0)
})

test('a repayment linked to a loan pays that loan, not the oldest', () => {
  const h = debtorHistory([
    lend(1, '11/11/2026', '11:34:00', 100),
    lend(2, '20/11/2026', '11:18:00', 200),
    { ...repay(3, '22/11/2026', '12:25:00', 200), repays_id: 2 },
  ], 'นัท')
  assert.deepEqual(h.loans.map(l => [l.id, l.remaining]), [[2, 0], [1, 100]])
  assert.equal(h.entries.find(e => e.id === 3).repaysLoan.id, 2)
})

test('linked and unlinked repayments mix: unlinked still go oldest first', () => {
  const h = debtorHistory([
    lend(1, '01/11/2026', '08:00:00', 100),
    lend(2, '02/11/2026', '08:00:00', 100),
    { ...repay(3, '03/11/2026', '08:00:00', 60), repays_id: 2 },
    repay(4, '04/11/2026', '08:00:00', 120),
  ], 'นัท')
  assert.deepEqual(h.loans.map(l => [l.id, l.remaining]), [[2, 20], [1, 0]])
  assert.equal(h.remaining, 20)
})

test('a repayment linked to a deleted loan falls back to oldest first', () => {
  const h = debtorHistory([lend(1, '01/11/2026', '08:00:00', 100), { ...repay(2, '02/11/2026', '08:00:00', 30), repays_id: 99 }], 'นัท')
  assert.equal(h.loans[0].remaining, 70)
})

test('later loans after a full repayment stay outstanding', () => {
  const h = debtorHistory([
    lend(1, '01/09/2026', '08:00:00', 100),
    repay(2, '02/09/2026', '08:00:00', 100),
    lend(3, '01/11/2026', '08:00:00', 40),
  ], 'นัท')
  assert.deepEqual(h.outstanding.map(l => [l.id, l.remaining]), [[3, 40]])
})
