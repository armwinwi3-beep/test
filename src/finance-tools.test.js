import test from 'node:test'
import assert from 'node:assert/strict'
import { filterRecords, toISO } from './finance-tools.js'
const rows = [
  {id:1,date:'8/9/2026',type:'รายจ่าย',account:'เงินสด',category:'อาหาร',note:'ร้านข้าว',amount:50},
  {id:2,date:'31/8/2026',type:'รายรับ',account:'กสิกร',category:'เงินเดือน',amount:30000},
  {id:3,date:'8/9/2026',type:'ย้ายเงิน',account:'กสิกร',category:'ShopeeWallet',amount:100},
]
const empty = {query:'',type:'',account:'',from:'',to:''}
test('searches notes across months and combines filters', () => {
  assert.deepEqual(filterRecords(rows,{...empty,query:'ร้าน',account:'เงินสด'}).map(r=>r.id),[1])
  assert.deepEqual(filterRecords(rows,{...empty,type:'รายรับ'}).map(r=>r.id),[2])
  assert.equal(filterRecords(rows,{...empty,query:'ไม่พบ'}).length,0)
})
test('date range is inclusive and normalizes legacy dates', () => {
  assert.equal(toISO('8/9/2026'),'2026-09-08')
  assert.deepEqual(filterRecords(rows,{...empty,from:'2026-09-08',to:'2026-09-08'}).map(r=>r.id),[1,3])
})
test('account filter includes transfer destinations', () => {
  assert.deepEqual(filterRecords(rows,{...empty,account:'ShopeeWallet'}).map(r=>r.id),[3])
})
