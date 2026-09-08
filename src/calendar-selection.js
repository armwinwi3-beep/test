import { computed, ref, watch } from 'vue'

export function useCalendarSelection(calendarGrid, viewDate) {
  const selectedDay = ref(null)
  const selectedDayInfo = computed(() => {
    const days = calendarGrid.value.filter(day => !day.empty)
    return days.find(day => day.day === selectedDay.value)
      || days.find(day => day.isToday)
      || days.filter(day => day.data).at(-1)
      || null
  })
  const openDayInfo = (day) => {
    if (!day.empty) selectedDay.value = day.day
  }
  watch(viewDate, () => { selectedDay.value = null }, { flush: 'sync' })
  return { selectedDayInfo, openDayInfo }
}
