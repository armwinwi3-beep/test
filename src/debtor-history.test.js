import test from 'node:test'
import assert from 'node:assert/strict'
import { debtorHistory } from './debtor-history.js'

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

test('later loans after a full repayment stay outstanding', () => {
  const h = debtorHistory([
    lend(1, '01/09/2026', '08:00:00', 100),
    repay(2, '02/09/2026', '08:00:00', 100),
    lend(3, '01/11/2026', '08:00:00', 40),
  ], 'นัท')
  assert.deepEqual(h.outstanding.map(l => [l.id, l.remaining]), [[3, 40]])
})
