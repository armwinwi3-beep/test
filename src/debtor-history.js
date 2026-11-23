// Lend/repay history for one debtor. Repayments pay off the oldest loans first,
// so each loan shows how much of it is still owed.

const LEND = 'ให้ยืมเงิน'
const REPAY = 'ได้คืนจากลูกหนี้'

const toNumber = value => Math.abs(parseFloat(String(value ?? 0).replace(/,/g, '')) || 0)

// "DD/MM/YYYY" + "HH:MM:SS" -> sortable key
const sortKey = row => {
  const [d = '', m = '', y = ''] = String(row.date || '').split('/')
  return `${y.padStart(4, '0')}${m.padStart(2, '0')}${d.padStart(2, '0')} ${row.time || ''} ${String(row.id).padStart(12, '0')}`
}

const round = value => Math.round(value * 100) / 100

export function debtorHistory(records, name) {
  const target = String(name || '').trim()
  const rows = (records || [])
    .filter(r => (r.type === LEND || r.type === REPAY) && String(r.category || '').trim() === target)
    .map(r => ({ ...r, amount: toNumber(r.amount) }))
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))

  const loans = []
  let totalLent = 0
  let totalRepaid = 0
  for (const row of rows) {
    if (row.type === LEND) {
      totalLent += row.amount
      loans.push({ ...row, remaining: row.amount })
    } else {
      totalRepaid += row.amount
      let left = row.amount
      // A repayment recorded against a specific loan pays that loan first.
      const linked = row.repays_id != null ? loans.find(l => String(l.id) === String(row.repays_id)) : null
      if (linked) {
        row.repaysLoan = linked
        const paid = Math.min(left, linked.remaining)
        linked.remaining = round(linked.remaining - paid)
        left -= paid
      }
      for (const loan of loans) {
        if (left <= 0) break
        const paid = Math.min(left, loan.remaining)
        loan.remaining = round(loan.remaining - paid)
        left -= paid
      }
      // Ignore overpayment, matching the backend which never lets a debt go negative.
    }
  }

  const newestFirst = list => [...list].reverse()
  return {
    entries: newestFirst(rows.map(r => r.type === LEND ? loans.find(l => l.id === r.id) : r)),
    loans: newestFirst(loans),
    outstanding: newestFirst(loans.filter(l => l.remaining > 0)),
    totalLent: round(totalLent),
    totalRepaid: round(totalRepaid),
    remaining: round(loans.reduce((sum, l) => sum + l.remaining, 0)),
  }
}

// Split one repayment over the loans the user picked, paying the oldest picked loan first.
// Returns [{ id, amount }] for loans that get money; never more than each loan still owes.
export function allocateRepayment(outstanding, ids, amount) {
  const chosen = new Set((ids || []).map(String))
  let left = Math.round((Number(amount) || 0) * 100)
  const result = []
  const oldestFirst = [...(outstanding || [])]
    .filter(loan => chosen.has(String(loan.id)))
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
  for (const loan of oldestFirst) {
    if (left <= 0) break
    const cents = Math.min(left, Math.round(loan.remaining * 100))
    if (cents > 0) result.push({ id: loan.id, amount: cents / 100 })
    left -= cents
  }
  return result
}
