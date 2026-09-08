<template>
  <section class="mb-4 space-y-3">
    <div class="grid grid-cols-3 gap-2">
      <button v-for="tab in tabs" :key="tab.key" @click="open(tab.key)" class="rounded-xl bg-brand-card border border-slate-700 p-3 text-xs sm:text-sm font-semibold text-sky-200">{{ tab.label }}</button>
    </div>
    <button v-if="alerts.length" @click="open('budgets')" class="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-left text-sm text-amber-200">
      ⚠️ {{ alerts.map(b => `${b.category} ใช้ ${b.percent}%`).join(' · ') }}
    </button>
    <button v-if="due.length" @click="$emit('go-bills')" class="w-full rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-left text-sm text-red-200">🔔 มีบิลถึงกำหนดหรือค้างชำระ {{ due.length }} รายการ · ดูและชำระ</button>
    <div v-if="budgets.length" class="rounded-xl bg-brand-card p-3 text-sm text-slate-300">งบ {{ monthLabel }} · เหลือรวม <strong :class="remaining < 0 ? 'text-red-400' : 'text-green-400'">{{ money(remaining) }} ฿</strong></div>
  </section>

  <Teleport to="body">
    <div v-if="opened" class="finance-screen z-[70] bg-brand-bg text-white flex flex-col" :style="viewportStyle" role="dialog" aria-modal="true" aria-label="จัดการการเงิน">
      <header class="finance-header bg-brand-yellow text-slate-900 flex items-center justify-between gap-3">
        <button :disabled="saving" @click="close" class="font-bold">‹ กลับ</button>
        <h2 class="font-bold">จัดการการเงิน</h2><span class="w-10"></span>
      </header>
      <nav class="finance-tabs border-b border-slate-700" aria-label="ส่วนจัดการเงิน">
        <button v-for="tab in tabs" :key="tab.key" :disabled="saving" @click="switchTab(tab.key)" :aria-current="active === tab.key ? 'page' : undefined" class="text-sm" :class="active === tab.key ? 'text-yellow-300 border-b-2 border-yellow-300' : 'text-slate-400'">{{ tab.label }}</button>
      </nav>
      <main class="finance-content">
        <div class="finance-content-inner space-y-4">
          <p v-if="error" role="alert" class="p-3 rounded-xl bg-red-500/10 text-red-300">{{ error }} <button :disabled="loading || saving" @click="reload" class="underline ml-2">ลองใหม่</button></p>
          <p v-if="success" role="status" class="text-green-300">{{ success }}</p>
          <p v-if="loading" class="text-sky-300">กำลังโหลดข้อมูล…</p>

          <template v-if="active === 'history' || active === 'due'">
            <h3 class="font-bold">{{ active === 'due' ? 'บิลถึงกำหนดและค้างชำระ' : 'ค้นหารายการทุกเดือน' }}</h3>
            <div v-if="active === 'history'" class="finance-form-grid">
              <label class="col-span-2 text-xs text-slate-400">ชื่อร้าน หมวด บัญชี หรือโน้ต<input v-model="filters.query" class="field" placeholder="ค้นหารายการ…"></label>
              <label class="text-xs text-slate-400">ประเภท<select v-model="filters.type" class="field"><option value="">ทุกประเภท</option><option v-for="type in recordTypes" :key="type">{{ type }}</option></select></label>
              <label class="text-xs text-slate-400">บัญชี<select v-model="filters.account" class="field"><option value="">ทุกบัญชี</option><option v-for="account in allAccounts" :key="account">{{ account }}</option></select></label>
              <label class="text-xs text-slate-400">ตั้งแต่วันที่<input v-model="filters.from" type="date" class="field"></label>
              <label class="text-xs text-slate-400">ถึงวันที่<input v-model="filters.to" type="date" class="field"></label>
            </div>
            <p class="text-xs text-slate-400">พบ {{ results.length }} รายการ · เรียงรายการล่าสุดก่อน</p>
            <div v-for="row in results.slice(0, limit)" :key="row.id" class="finance-record rounded-2xl bg-brand-card border border-slate-700/50 p-4">
              <div class="min-w-0"><p class="font-semibold break-words">{{ row.category }}</p><p class="text-xs text-slate-400 mt-1">{{ row.date }} · {{ row.type }}</p><p class="text-xs text-slate-400 mt-1">{{ row.account }}<span v-if="row.type === 'ย้ายเงิน'"> → {{ row.category }}</span></p><p v-if="row.note && row.note !== '-'" class="text-xs text-slate-300 mt-1 break-words">{{ row.note }}</p><p v-if="row.status === 'ยังไม่จ่าย'" class="text-xs text-amber-300 mt-1">ยังไม่จ่าย</p></div>
              <div class="shrink-0 text-right"><strong>{{ money(row.amount) }} ฿</strong><button @click="edit(row)" class="block ml-auto mt-2 text-sm text-sky-300">{{ row.status === 'ยังไม่จ่าย' ? 'แก้ไข / ชำระ' : '✏️ แก้ไข' }}</button></div>
            </div>
            <p v-if="!loading && !results.length" class="text-center text-slate-400 py-8">ไม่พบรายการ</p>
            <button v-if="results.length > limit" @click="limit += 50" class="action w-full">แสดงเพิ่ม</button>
          </template>

          <template v-if="active === 'budgets'">
            <div class="finance-month"><h3 class="font-bold">งบรายเดือน</h3><input v-model="budgetMonth" @change="loadPlan" type="month" class="field" aria-label="เดือนของงบ"></div>
            <p class="text-xs text-slate-400">นับรายจ่ายและบิลที่จ่ายแล้ว · ไม่รวมย้ายเงินและให้ยืม · เตือนเมื่อใช้ถึง 80%</p>
            <form @submit.prevent="saveBudget" class="bg-brand-card rounded-2xl p-4 space-y-3">
              <label class="block text-sm">หมวดหมู่<input v-model.trim="budgetDraft.category" required maxlength="120" list="finance-categories" class="field" placeholder="เช่น อาหาร"></label>
              <label class="block text-sm">งบทั้งเดือน (บาท)<input v-model="budgetDraft.amount" required type="number" min="0.01" step="0.01" class="field" placeholder="3,000"></label>
              <button :disabled="saving || loading" class="action w-full">บันทึกงบ</button><p class="text-xs text-slate-400">หมวดเดิมในเดือนเดียวกันจะปรับเป็นงบใหม่</p>
            </form>
            <div v-for="item in budgets" :key="item.id" class="rounded-2xl bg-brand-card p-4 space-y-2">
              <div class="flex justify-between gap-2"><strong>{{ item.category }}</strong><span :class="item.percent >= 80 ? 'text-amber-300' : 'text-slate-300'">{{ item.percent }}%</span></div>
              <div class="h-2 bg-slate-800 rounded-full overflow-hidden"><div class="h-full" :class="item.percent >= 100 ? 'bg-red-400' : item.percent >= 80 ? 'bg-amber-400' : 'bg-green-400'" :style="{ width: Math.min(100, item.percent) + '%' }"></div></div>
              <p class="text-sm text-slate-300">ใช้ {{ money(item.spent) }} / {{ money(item.amount) }} ฿</p>
              <p class="text-sm" :class="item.remaining < 0 ? 'text-red-300' : 'text-green-300'">{{ item.remaining < 0 ? 'เกินงบ' : 'เหลือ' }} {{ money(Math.abs(item.remaining)) }} ฿</p>
              <div class="flex gap-4 text-sm"><button @click="budgetDraft = {category:item.category, amount:item.amount}" class="text-sky-300">แก้ไขงบ</button><button :disabled="saving" @click="removeBudget(item)" class="text-slate-400">ลบงบ</button></div>
            </div>
          </template>

          <template v-if="active === 'recurring'">
            <h3 class="font-bold">รายการประจำทุกเดือน</h3>
            <p class="text-xs text-slate-400">รายรับบันทึกอัตโนมัติ · บิลสร้างเป็นค้างชำระและเตือนในเว็บ · วันที่ 29–31 ใช้วันสุดท้ายหากเดือนนั้นไม่มีวันดังกล่าว</p>
            <form @submit.prevent="saveRecurring" class="finance-form-grid rounded-2xl bg-brand-card p-4">
              <label class="col-span-2 text-sm">ประเภท<select v-model="ruleDraft.type" class="field"><option>รายจ่ายต้องชำระต่อเดือน</option><option>รายรับ</option></select></label>
              <label class="col-span-2 text-sm">ชื่อบิลหรือหมวดรายรับ<input v-model.trim="ruleDraft.category" required maxlength="120" class="field" placeholder="เช่น Internet หรือเงินเดือน"></label>
              <label class="text-sm">จำนวนเงิน<input v-model="ruleDraft.amount" required type="number" min="0.01" step="0.01" class="field"></label>
              <label class="text-sm">บัญชี<select v-model="ruleDraft.account" class="field" required><option value="" disabled>เลือกบัญชี</option><option v-for="account in accounts" :key="account">{{ account }}</option></select></label>
              <label class="text-sm">ทุกวันที่<input v-model.number="ruleDraft.day_of_month" required type="number" min="1" max="31" step="1" class="field"></label>
              <label class="text-sm">เริ่มตั้งแต่<input v-model="ruleDraft.start_date" required :min="today" type="date" class="field"></label>
              <label class="col-span-2 text-sm">โน้ต<input v-model="ruleDraft.note" maxlength="1000" class="field"></label>
              <button :disabled="saving || loading" class="action col-span-2">เพิ่มรายการประจำ</button>
            </form>
            <div v-for="rule in rules" :key="rule.id" class="rounded-2xl bg-brand-card p-4 flex justify-between gap-3"><div><strong>{{ rule.category }}</strong><p class="text-sm text-slate-300 mt-1">{{ money(rule.amount) }} ฿ · {{ rule.account }}</p><p class="text-xs text-slate-400 mt-1">ทุกวันที่ {{ rule.day_of_month }} · {{ rule.type }}</p><p class="text-xs mt-1" :class="rule.active ? 'text-green-300' : 'text-slate-400'">{{ rule.active ? 'เปิดใช้งาน' : 'พักไว้' }}</p></div><button :disabled="saving" @click="toggleRule(rule)" class="text-sm text-sky-300">{{ rule.active ? 'พักรายการ' : 'เปิดอีกครั้ง' }}</button></div>
          </template>
          <datalist id="finance-categories"><option v-for="category in categories" :key="category" :value="category"></option></datalist>
        </div>
      </main>
    </div>

    <div v-if="editing" class="finance-edit-backdrop z-[80] bg-black/70" :style="viewportStyle" role="dialog" aria-modal="true" aria-label="แก้ไขรายการ">
      <form @submit.prevent="saveEdit" class="finance-edit-form bg-brand-bg text-white rounded-2xl border border-slate-700 space-y-3">
        <h3 class="font-bold text-lg">แก้ไขรายการ</h3>
        <p v-if="editError" role="alert" class="text-red-300 text-sm">{{ editError }}</p>
        <label class="block text-sm">ประเภท<select v-model="editing.type" class="field"><option v-for="type in recordTypes" :key="type">{{ type }}</option></select></label>
        <div class="finance-form-grid"><label class="text-sm">วันที่<input v-model="editing.date" required type="date" class="field"></label><label class="text-sm">จำนวนเงิน<input v-model="editing.amount" required type="number" min="0.01" step="0.01" class="field"></label></div>
        <label class="block text-sm">{{ editing.type === 'ย้ายเงิน' ? 'บัญชีต้นทาง' : 'บัญชี' }}<select v-model="editing.account" class="field"><option v-if="!allAccounts.includes(editing.account)" :value="editing.account">{{ editing.account }}</option><option v-for="account in allAccounts" :key="account">{{ account }}</option></select></label>
        <label class="block text-sm">{{ editing.type === 'ย้ายเงิน' ? 'บัญชีปลายทาง' : 'หมวดหมู่ / ชื่อคนยืม' }}<select v-if="editing.type === 'ย้ายเงิน'" v-model="editing.category" class="field"><option v-for="account in allAccounts" :key="account">{{ account }}</option></select><input v-else v-model.trim="editing.category" required maxlength="120" class="field"></label>
        <label v-if="editing.type === 'รายจ่ายต้องชำระต่อเดือน'" class="block text-sm">สถานะ<select v-model="editing.status" class="field"><option>ยังไม่จ่าย</option><option>จ่ายแล้ว</option></select></label>
        <label class="block text-sm">โน้ต<input v-model="editing.note" maxlength="1000" class="field"></label>
        <div class="flex gap-3"><button :disabled="saving" type="button" @click="editing = null" class="flex-1 p-3 rounded-xl bg-slate-800">ยกเลิก</button><button :disabled="saving" class="action flex-1">{{ saving ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข' }}</button></div>
      </form>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { accounts, recordTypes, money, toISO, bangkokToday, filterRecords } from '../finance-tools.js'
const props = defineProps({ userId: String, month: String, apiBase: String, authHeaders: Function, revision: Number })
const emit = defineEmits(['changed', 'busy', 'go-bills'])
const tabs = [{key:'history',label:'🔎 ค้นหา / แก้ไข'}, {key:'budgets',label:'🎯 งบรายเดือน'}, {key:'recurring',label:'🔁 รายการประจำ'}]
const opened = ref(false), active = ref('history'), loading = ref(false), saving = ref(false)
const viewportStyle = ref({})
function syncViewport() {
  const viewport = window.visualViewport
  // Preserve browser pinch-zoom; adjust only for the keyboard and browser chrome.
  viewportStyle.value = viewport && viewport.scale === 1
    ? { '--finance-height': `${viewport.height}px`, '--finance-top': `${viewport.offsetTop}px` }
    : {}
}
const error = ref(''), success = ref(''), editError = ref(''), editing = ref(null)
const history = ref([]), budgets = ref([]), rules = ref([]), due = ref([]), limit = ref(50)
const today = bangkokToday(), budgetMonth = ref(props.month)
const budgetDraft = ref({category:'',amount:''})
const emptyRule = () => ({id:crypto.randomUUID(),type:'รายจ่ายต้องชำระต่อเดือน',category:'',account:'',amount:'',day_of_month:1,start_date:today,note:''})
const ruleDraft = ref(emptyRule())
const filters = ref({query:'',type:'',account:'',from:'',to:''})
const allAccounts = computed(() => [...new Set([...accounts, ...history.value.map(r => r.account).filter(a => a && a !== '-')])])
const categories = computed(() => [...new Set(['อาหาร','เดินทาง','BTS','ช้อปปิ้ง','ทั่วไป',...history.value.map(r => r.category)])])
const results = computed(() => active.value === 'due' ? due.value : filterRecords(history.value, filters.value))
const alerts = computed(() => budgets.value.filter(item => item.percent >= 80))
const remaining = computed(() => budgets.value.reduce((sum, item) => sum + item.remaining, 0))
const monthLabel = computed(() => budgetMonth.value)
let alive = true, planSequence = 0
watch([opened, editing, saving], () => emit('busy', opened.value || !!editing.value || saving.value), {flush:'sync'})
watch(filters, () => { limit.value = 50 }, {deep:true})
watch(() => props.month, month => { budgetMonth.value = month; void loadPlan() })
watch(() => props.revision, () => { if (!saving.value) void loadPlan() })
async function api(path, data) {
  const headers = { ...props.authHeaders(), 'Content-Type':'application/json' }
  const url = props.apiBase + '/api/finance' + path + (data ? '' : `${path.includes('?') ? '&' : '?'}user_id=${encodeURIComponent(props.userId)}`)
  const response = await fetch(url, { method:data ? 'POST' : 'GET', headers, ...(data ? {body:JSON.stringify({...data,user_id:props.userId})} : {}) })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || 'เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่')
  return body
}
async function loadPlan() {
  if (!budgetMonth.value) return
  const sequence = ++planSequence
  try {
    const data = await api(`/plan?month=${encodeURIComponent(budgetMonth.value)}`)
    if (!alive || sequence !== planSequence) return
    budgets.value = data.budgets; rules.value = data.recurring; due.value = data.due
    if (data.generated > 0) emit('changed')
  } catch (e) { if (alive && opened.value && active.value !== 'history') error.value = e.message }
}
async function loadHistory() { const data = await api('/records'); if (alive) history.value = data.records }
async function reload() {
  loading.value = true; error.value = ''
  try { if (active.value === 'history') await loadHistory(); else await loadPlan() }
  catch (e) { if (alive) error.value = e.message }
  finally { if (alive) loading.value = false }
}
function open(tab) { opened.value = true; active.value = tab; void reload() }
function switchTab(tab) { active.value = tab; success.value = ''; error.value = ''; void reload() }
function close() {
  const hasDraft = budgetDraft.value.category || budgetDraft.value.amount || ruleDraft.value.category || ruleDraft.value.amount || ruleDraft.value.note
  if (hasDraft && !confirm('ยังมีข้อมูลที่ไม่ได้บันทึก ต้องการปิดหน้านี้หรือไม่?')) return
  budgetDraft.value = {category:'',amount:''}; ruleDraft.value = emptyRule()
  opened.value = false; error.value = ''; success.value = ''
  if (budgetMonth.value !== props.month) { budgetMonth.value = props.month; void loadPlan() }
}
function edit(row) { editError.value = ''; editing.value = {...row, date:toISO(row.date)} }
async function write(path, data, after) {
  if (saving.value) return
  saving.value = true; error.value = ''; success.value = ''
  try { await api(path,data); if (!alive) return; after?.(); await loadPlan(); emit('changed'); success.value = 'บันทึกเรียบร้อย' }
  catch (e) { if (alive) error.value = e.message }
  finally { if (alive) saving.value = false }
}
function saveBudget() { return write('/budget',{...budgetDraft.value,month:budgetMonth.value}, () => {budgetDraft.value={category:'',amount:''}}) }
function removeBudget(item) { if (confirm(`ลบงบ ${item.category} เดือน ${budgetMonth.value}? รายจ่ายเดิมยังอยู่`)) return write('/budget/delete',{id:item.id}) }
function saveRecurring() { return write('/recurring',ruleDraft.value, () => {ruleDraft.value=emptyRule()}) }
function toggleRule(rule) { return write('/recurring/toggle',{id:rule.id,active:!rule.active}) }
async function saveEdit() {
  if (saving.value) return
  saving.value = true; editError.value = ''
  try { await api('/record',editing.value); if (!alive) return; editing.value = null; emit('changed'); await Promise.all([loadHistory(),loadPlan()]); success.value = 'แก้ไขรายการแล้ว' }
  catch (e) { if (alive) { if(editing.value) editError.value=e.message; else error.value=e.message } }
  finally { if (alive) saving.value = false }
}
onMounted(() => {
  syncViewport()
  window.visualViewport?.addEventListener('resize', syncViewport)
  window.visualViewport?.addEventListener('scroll', syncViewport)
  void loadPlan()
})
onUnmounted(() => {
  window.visualViewport?.removeEventListener('resize', syncViewport)
  window.visualViewport?.removeEventListener('scroll', syncViewport)
  alive=false; emit('busy',false)
})
defineExpose({ edit })
</script>

<style scoped>
.finance-screen, .finance-edit-backdrop { position:fixed; top:var(--finance-top, 0px); height:100vh; height:var(--finance-height, 100dvh); box-sizing:border-box; overflow:hidden; }
.finance-screen { left:50%; transform:translateX(-50%); width:100%; max-width:480px; box-shadow:0 0 0 100vmax rgb(0 0 0 / .45); }
.finance-header { padding:12px 16px; padding-top:max(12px, env(safe-area-inset-top)); flex-shrink:0; }
.finance-header button { min-height:44px; padding:0 8px; }
.finance-tabs { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); flex-shrink:0; background:#0b192b; }
.finance-tabs button { min-width:0; min-height:52px; padding:10px 4px; font-size:12px; line-height:1.5; overflow-wrap:anywhere; }
.finance-content { flex:1; min-height:0; min-width:0; overflow-y:auto; overflow-x:hidden; overscroll-behavior-y:contain; -webkit-overflow-scrolling:touch; padding:16px; padding-bottom:max(24px, env(safe-area-inset-bottom)); scroll-padding-block:20px; }
.finance-content-inner { min-width:0; width:100%; overflow-wrap:anywhere; }
.finance-form-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px; }
.finance-form-grid > *, label { min-width:0; }
.finance-month { display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 180px); gap:12px; align-items:center; }
.finance-record { display:grid; grid-template-columns:minmax(0, 1fr); gap:12px; }
.finance-record > :last-child { min-width:0; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
.finance-record button { min-height:44px; margin-top:0; }
.finance-edit-backdrop { left:0; width:100%; display:flex; justify-content:center; align-items:center; padding:12px; padding-top:max(12px, env(safe-area-inset-top)); padding-bottom:max(12px, env(safe-area-inset-bottom)); }
.finance-edit-form { width:100%; max-width:456px; min-height:0; max-height:100%; overflow-y:auto; overflow-x:hidden; overscroll-behavior-y:contain; -webkit-overflow-scrolling:touch; padding:16px; overflow-wrap:anywhere; scroll-padding-block:20px; }
.field { display:block; box-sizing:border-box; width:100%; max-width:100%; min-height:46px; font-size:16px; line-height:1.5; margin-top:.4rem; padding:.7rem; border-radius:.65rem; background:#1e293b; color:#fff; border:1px solid #334155; min-width:0; color-scheme:dark; }
input[type="date"], input[type="month"] { appearance:none; -webkit-appearance:none; }
input::-webkit-date-and-time-value { min-height:1.5em; text-align:left; }
@media (max-width:400px) {
  .finance-form-grid, .finance-month { grid-template-columns:minmax(0, 1fr); }
  .finance-form-grid > .col-span-2 { grid-column:1 / -1; }
  .finance-content { padding-left:12px; padding-right:12px; }
}
.field:focus { outline:2px solid #38bdf8; outline-offset:1px; }
.action { padding:.8rem 1rem; border-radius:.75rem; background:#2563eb; color:white; font-weight:600; }
button:disabled { opacity:.5; cursor:wait; }
</style>
