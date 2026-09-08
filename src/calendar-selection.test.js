import test from 'node:test'
import assert from 'node:assert/strict'
import { effectScope, ref } from 'vue'
import { useCalendarSelection } from './calendar-selection.js'

function fixture() {
  const scope = effectScope()
  const grid = ref([{ empty: true }, {day:7, data:{actual:0}}, {day:8, isToday:true, data:{actual:0}}])
  const month = ref(new Date(2026,8,8))
  const selection = scope.run(() => useCalendarSelection(grid,month))
  return { scope, grid, month, ...selection }
}
test('today is selected before load and reflects loaded amounts without a click', () => {
  const f = fixture()
  assert.equal(f.selectedDayInfo.value.day,8)
  f.grid.value = [{day:8,isToday:true,data:{actual:450,target:500}}]
  assert.equal(f.selectedDayInfo.value.data.actual,450)
  assert.equal(f.selectedDayInfo.value.data.target,500)
  f.scope.stop()
})
test('manually selected date remains selected and follows refreshed data', () => {
  const f = fixture(); f.openDayInfo(f.grid.value[1])
  f.grid.value = [{day:7,data:{actual:100}}, {day:8,isToday:true,data:{actual:450}}]
  assert.equal(f.selectedDayInfo.value.day,7)
  assert.equal(f.selectedDayInfo.value.data.actual,100)
  f.openDayInfo({empty:true}); assert.equal(f.selectedDayInfo.value.day,7)
  f.scope.stop()
})
test('changing months resets selection; returning to current month selects today', () => {
  const f = fixture(); f.openDayInfo(f.grid.value[1])
  f.month.value = new Date(2026,7,8)
  f.grid.value = [{day:7,data:{actual:100}}, {day:31,data:{actual:200}}]
  assert.equal(f.selectedDayInfo.value.day,31)
  f.month.value = new Date(2026,8,8)
  f.grid.value = [{day:7,data:{actual:100}}, {day:8,isToday:true,data:{actual:450}}]
  assert.equal(f.selectedDayInfo.value.day,8)
  f.scope.stop()
})
