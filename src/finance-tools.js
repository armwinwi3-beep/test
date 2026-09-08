export const accounts = ['กสิกร', 'กรุงไทย', 'TrueMoney', 'ShopeeWallet', 'เงินสด']
export const recordTypes = ['รายรับ', 'รายจ่าย', 'รายจ่ายต้องชำระต่อเดือน', 'ย้ายเงิน', 'ให้ยืมเงิน', 'ได้คืนจากลูกหนี้']
export const money = value => Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export function toISO(value) {
  const [day, month, year] = (value || '').split('/')
  return year ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : ''
}
export function bangkokToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}
export function filterRecords(rows, filters) {
  const query = filters.query.trim().toLocaleLowerCase('th-TH')
  return rows.filter(row => {
    const date = toISO(row.date)
    return (!filters.type || row.type === filters.type)
      && (!filters.account || row.account === filters.account || (row.type === 'ย้ายเงิน' && row.category === filters.account))
      && (!filters.from || date >= filters.from) && (!filters.to || date <= filters.to)
      && (!query || [row.category, row.note, row.account, row.type, row.amount, row.date].join(' ').toLocaleLowerCase('th-TH').includes(query))
  })
}
