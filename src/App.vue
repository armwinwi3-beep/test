<template>
  <div class="flex flex-col h-full relative font-sans bg-brand-bg text-white">
    
    <!-- แจ้งเตือน Toast -->
    <div v-if="toastMsg" class="fixed top-safe mt-5 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full font-semibold shadow-lg z-[9999] transition-all whitespace-nowrap"
         :class="isError ? 'bg-red-500' : 'bg-green-500'">
      {{ toastMsg }}
    </div>

    <!-- 🌟 ส่วนเนื้อหาหลัก 🌟 -->
    <main class="flex-1 overflow-y-auto pb-24">
      
      <!-- 🏠 แท็บหน้าแรก -->
      <section v-if="currentTab === 'home'" class="p-4">
        <div class="bg-brand-yellow text-slate-800 p-5 rounded-2xl shadow-lg relative mb-4">
          <div class="flex items-center gap-4 text-sky-700 font-semibold mb-4 text-lg">
            <button @click="changeMonth(-1)" class="hover:opacity-70 px-2 select-none">&lt;</button>
            <span>📅 {{ monthDisplay }}</span>
            <button @click="changeMonth(1)" class="hover:opacity-70 px-2 select-none">&gt;</button>
          </div>
          <div class="flex justify-between items-start">
            <div class="flex flex-col gap-2">
              <div>
                <p class="text-sm font-medium text-slate-600">ยอดเงินคงเหลือรวม (All)</p>
                <p class="text-3xl font-bold leading-tight">{{ totalBalance.toLocaleString('th-TH') }} ฿</p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-600">ยอดใช้จ่ายเดือนนี้</p>
                <p class="text-xl font-bold text-red-500">{{ totalExpense.toLocaleString('th-TH') }} ฿</p>
              </div>
            </div>
            <button @click="isSummaryOpen = true" class="bg-blue-700 text-white px-3 py-2 rounded-full text-sm font-semibold flex items-center gap-1 hover:bg-blue-800 transition active:scale-95 shadow-md">
              <svg class="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z"/></svg>
              ดูสรุป
            </button>
          </div>
        </div>

        <div v-if="isLoading" class="text-center text-slate-400 py-10">กำลังโหลดข้อมูล... ⏳</div>
        <div v-else-if="groupedRecords.length === 0" class="text-center text-slate-400 py-10">ไม่มีรายการในเดือนนี้</div>
        
        <div v-else v-for="group in groupedRecords" :key="group.date" class="flex mt-2 border-t border-slate-800 pt-2">
          <div class="w-16 text-center pt-4 border-l-4 border-brand-yellow text-brand-yellow">
            <div class="text-xs">วันที่</div>
            <div class="text-xl font-bold">{{ group.day }}</div>
          </div>
          <div class="flex-1 bg-brand-card p-4 rounded-r-xl">
            <div class="flex justify-end gap-2 border-b border-slate-700 pb-2 mb-3 text-sm">
              <span v-if="group.expense > 0" class="text-red-400">↓ จ่าย {{ group.expense.toLocaleString('th-TH') }}</span>
              <span v-if="group.income > 0" class="text-green-400">↑ รับ {{ group.income.toLocaleString('th-TH') }}</span>
            </div>
            
            <div v-for="item in group.items" :key="item.id" class="flex justify-between items-center mb-4">
              <div>
                <p class="text-white font-medium text-sm">
                  <span v-if="item.type === 'ย้ายเงิน'">🔄 ย้ายเงิน</span>
                  <span v-else-if="item.type === 'ให้ยืมเงิน'">📤 ให้ยืม: {{ item.category }}</span>
                  <span v-else-if="item.type === 'ได้คืนจากลูกหนี้'">📥 ได้คืนจาก: {{ item.category }}</span>
                  <span v-else>{{ item.category }}</span>
                  <span class="text-xs text-slate-400 ml-1 font-normal" v-if="item.time && item.time !== '-'">({{ item.time.substring(0,5) }} น.)</span>
                </p>
                <p class="text-slate-400 text-xs mt-1">
                  <template v-if="item.type === 'ย้ายเงิน'">{{ item.account }} ➡️ {{ item.category }}</template>
                  <template v-else>{{ item.account }}</template>
                  <span v-if="item.note && item.note !== '-'"> ({{ item.note }})</span>
                </p>
              </div>
              <div class="flex items-center gap-3">
                <span class="font-semibold text-sm" :class="isExpense(item.type) ? 'text-red-400' : (isIncome(item.type) ? 'text-green-400' : 'text-yellow-400')">
                  {{ isExpense(item.type) ? '-' : (isIncome(item.type) ? '+' : '') }}{{ item.amount.toLocaleString('th-TH') }}
                </span>
                <button @click="deleteRecord(item)" class="text-slate-500 hover:text-red-500 transition px-1">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 📅 แท็บปฏิทินออมเงิน -->
      <section v-else-if="currentTab === 'calendar'" class="p-4">
        <div class="text-center font-bold text-lg text-slate-800 bg-brand-yellow rounded-t-2xl py-3 -mt-4 -mx-4 mb-4 shadow-md">
          📅 ปฏิทินออมเงิน
        </div>
        
        <div class="bg-brand-card border border-blue-500 border-dashed rounded-xl p-4 mb-5">
          <div class="text-sm font-semibold mb-2 text-blue-400">🔮 โหมดจำลองรายรับล่วงหน้า</div>
          <div class="flex gap-2">
            <input type="number" v-model.number="simulatedIncomeInput" placeholder="จำลองรายรับ..." class="flex-1 p-2 rounded-lg bg-brand-bg text-white outline-none">
            <button @click="applySimulation" class="bg-blue-500 text-white px-4 rounded-lg font-bold active:scale-95 transition">จำลอง</button>
            <button v-if="simulatedIncome > 0" @click="clearSimulation" class="bg-red-500 text-white px-4 rounded-lg font-bold active:scale-95 transition">ล้าง</button>
          </div>
          <div v-if="simulatedIncome > 0" class="text-[11px] text-yellow-400 mt-2">* หักลบเงินจำลอง {{ simulatedIncome.toLocaleString('th-TH') }} ฿ แล้ว</div>
        </div>

        <div class="bg-gradient-to-br from-sky-600 to-blue-700 rounded-xl p-4 shadow-lg mb-5 text-white">
          <div class="text-sm font-semibold mb-1 text-sky-100">🎯 สถานะเป้าหมายปัจจุบัน</div>
          <div class="flex justify-between items-end mb-3">
            <div>
              <div class="text-xs text-sky-200">ยอดเงินที่ยังขาด{{ simulatedIncome > 0 ? ' (หลังจำลอง)' : '' }}</div>
              <div class="text-2xl font-bold">{{ calData.displayGap > 0 ? calData.displayGap.toLocaleString('th-TH', {minimumFractionDigits: 2}) : '0' }} ฿</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-sky-200">ต้องเก็บ{{ calData.isCurrentMonth ? 'พรุ่งนี้' : 'ต่อวัน' }}</div>
              <div class="text-lg font-bold text-yellow-300">{{ calData.displayGap > 0 ? calData.nextTargetTommorow.toLocaleString('th-TH', {minimumFractionDigits: 2}) : '0' }} ฿/วัน</div>
            </div>
          </div>
          <div class="bg-white/20 p-2 rounded-lg text-sm text-center">
            <span v-if="calData.displayGap <= 0">🎉 ยินดีด้วย! มีเงินพอจ่ายบิลทั้งหมดแล้ว</span>
            <span v-else>เหลือเวลาอีก {{ calData.daysLeft }} วัน ในเดือนนี้</span>
          </div>
        </div>

        <h3 class="text-base font-bold mb-3 text-slate-300">ประวัติการเก็บเงินรายวัน</h3>
        <div v-for="d in calData.calendarData" :key="d.day" class="bg-brand-card rounded-xl p-4 mb-3 border-l-4" :class="d.diff >= 0 || (d.target===0 && d.actual===0) ? 'border-green-500' : 'border-red-500'">
          <div class="flex justify-between mb-2 border-b border-slate-700 pb-2">
            <div class="font-bold" :class="d.isToday && calData.isCurrentMonth ? 'text-yellow-400' : 'text-white'">{{ d.isToday && calData.isCurrentMonth ? 'วันนี้' : `วันที่ ${d.day}` }}</div>
            <div class="text-xs text-slate-400">เป้า: {{ d.target.toLocaleString('th-TH', {minimumFractionDigits: 2}) }} ฿</div>
          </div>
          <div class="flex justify-between items-center mb-1">
            <div class="text-sm text-slate-300">เก็บได้จริง:</div>
            <div class="text-lg font-bold" :class="d.actual >= 0 ? 'text-green-500' : 'text-red-500'">{{ d.actual > 0 ? '+' : '' }}{{ d.actual.toLocaleString('th-TH') }} ฿</div>
          </div>
          <div class="flex justify-between items-center text-xs">
            <div :class="d.diff >= 0 ? 'text-green-500' : 'text-red-500'" v-if="!(d.target===0 && d.actual===0)">
              {{ d.diff >= 0 ? '🟢 ทะลุเป้า' : '🔴 พลาดเป้า' }} ({{ d.diff >= 0 ? '+' : '-' }}{{ Math.abs(d.diff).toLocaleString('th-TH', {minimumFractionDigits: 2}) }})
            </div>
            <div class="text-slate-500" v-else>-</div>
            
            <div v-if="d.isPast && calData.currentGapReal > 0" class="text-slate-400">เป้าถัดไป {{ d.nextTarget.toLocaleString('th-TH', {maximumFractionDigits: 0}) }} ฿</div>
            <div v-if="d.isToday && calData.isCurrentMonth && calData.displayGap > 0" class="text-yellow-400">เป้าพรุ่งนี้ {{ d.nextTarget.toLocaleString('th-TH', {maximumFractionDigits: 0}) }} ฿</div>
          </div>
        </div>
      </section>

      <!-- 🤝 แท็บคนยืมเงิน -->
      <section v-else-if="currentTab === 'debtors'" class="p-4">
        <div class="text-center font-bold text-lg text-slate-800 bg-brand-yellow rounded-t-2xl py-3 -mt-4 -mx-4 mb-4 shadow-md">
          🤝 คนยืมเงิน (ลูกหนี้)
        </div>
        <div class="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl p-5 shadow-lg mb-5 text-white">
          <div class="text-sm font-semibold mb-2">ยอดเงินที่คนอื่นยืมไปรวม</div>
          <div class="text-4xl font-bold">{{ totalDebtors.toLocaleString('th-TH') }} ฿</div>
        </div>
        <button @click="openForm('debtor')" class="w-full bg-blue-600 text-white py-3 rounded-full font-bold mb-4 active:scale-95 transition shadow-md">+ จดให้ยืม/ได้คืน</button>
        
        <div v-if="debtorsList.length === 0" class="text-center text-slate-400 py-10">ไม่มีใครยืมเงินคุณเลย 🎉</div>
        <div v-else v-for="d in debtorsList" :key="d.name" class="bg-brand-card rounded-xl p-4 mb-3 flex justify-between items-center border-l-4 border-violet-500">
          <div class="flex items-center gap-3">
            <div class="bg-violet-500 p-2 rounded-lg text-xl">👤</div>
            <div>
              <div class="font-medium text-sm text-white">{{ d.name }}</div>
              <div class="text-xs text-slate-400">ยอดค้างชำระทั้งหมด</div>
            </div>
          </div>
          <div class="text-yellow-400 font-bold text-lg">{{ d.amount.toLocaleString('th-TH') }} ฿</div>
        </div>
      </section>

      <!-- 📋 แท็บบิลรายเดือน -->
      <section v-else-if="currentTab === 'bills'" class="p-4">
        <div class="text-center font-bold text-lg text-slate-800 bg-brand-yellow rounded-t-2xl py-3 -mt-4 -mx-4 mb-4 shadow-md">
          📋 บิลรายเดือน
        </div>
        <div class="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 shadow-lg mb-4 text-white">
          <div class="text-sm font-semibold mb-2">ยอดบิลชำระแล้วเดือนนี้</div>
          <div class="text-4xl font-bold">{{ billsData.totalPaid.toLocaleString('th-TH') }} ฿</div>
        </div>
        <button @click="openForm('bill')" class="w-full bg-blue-600 text-white py-3 rounded-full font-bold mb-5 active:scale-95 transition shadow-md">+ จดบิลเพิ่ม</button>

        <div class="bg-brand-card border border-blue-500 border-dashed rounded-xl p-4 mb-5">
          <div class="text-sm font-semibold mb-2 text-blue-400">🔮 โหมดจำลอง (Demo)</div>
          <div class="text-xs text-slate-400 mb-3">กรอกรายรับล่วงหน้าเพื่อเช็คว่าเงินจะพอจ่ายบิลไหม</div>
          <div class="flex gap-2">
            <input type="number" v-model.number="simulatedIncomeInput" placeholder="รายรับล่วงหน้า..." class="flex-1 p-2 rounded-lg bg-brand-bg text-white outline-none">
            <button @click="applySimulation" class="bg-blue-500 text-white px-4 rounded-lg font-bold active:scale-95 transition">จำลอง</button>
            <button v-if="simulatedIncome > 0" @click="clearSimulation" class="bg-red-500 text-white px-4 rounded-lg font-bold active:scale-95 transition">ล้าง</button>
          </div>
        </div>

        <div v-if="billsData.totalUnpaid > 0">
          <div v-if="billsData.remainingToSave <= 0" class="bg-green-500/10 border border-green-500 border-dashed rounded-xl p-3 mb-4">
            <div class="text-xs text-green-300 mb-1">🎯 เป้าหมายเตรียมเงินจ่ายบิล</div>
            <div class="text-sm font-bold text-green-500">🎉 ตอนนี้ยอดเงินคงเหลือพอจ่ายบิลทั้งหมดแล้วครับ!</div>
          </div>
          <div v-else class="bg-red-500/10 border border-red-500 border-dashed rounded-xl p-3 mb-4">
            <div class="text-xs text-red-300 mb-1">🎯 ขาดเงินอีก {{ billsData.remainingToSave.toLocaleString('th-TH') }} ฿ (เหลือ {{ calData.daysLeft }} วัน)</div>
            <div class="text-sm font-bold text-red-500">ต้องเก็บเงินเพิ่มวันละ: {{ billsData.dailySave.toLocaleString('th-TH', {minimumFractionDigits: 2}) }} ฿</div>
            <div v-if="simulatedIncome > 0" class="text-[10px] text-yellow-400 mt-1">* รวมเงินจำลองแล้ว</div>
          </div>

          <h3 class="text-sm font-bold mb-2 text-red-400">⏳ ยอดค้างชำระ ({{ billsData.totalUnpaid.toLocaleString('th-TH') }} ฿)</h3>
          <div v-for="b in billsData.unpaid" :key="b.id" class="bg-brand-card rounded-xl p-3 mb-2 flex justify-between items-center border-l-4 border-red-500">
            <div class="flex items-center gap-3 flex-1 cursor-pointer" @click="payUnpaidBill(b)">
              <div class="bg-red-500 p-2 rounded-lg text-lg">⏳</div>
              <div>
                <div class="font-medium text-sm text-red-400">{{ b.category }} <span class="text-xs ml-1" v-if="b.time!=='-'">({{ b.time.substring(0,5) }} น.)</span> 👆</div>
                <div class="text-xs text-slate-400 mt-1">{{ b.date }} <span v-if="b.note!=='-'" class="text-yellow-400">• {{ b.note }}</span></div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-red-400 font-bold">{{ b.amount.toLocaleString('th-TH') }} ฿</div>
              <button @click="deleteRecord(b)" class="text-slate-500 hover:text-red-500 px-1">🗑️</button>
            </div>
          </div>
        </div>

        <h3 class="text-sm font-bold mb-2 mt-4 text-slate-400">✅ ชำระไปแล้ว</h3>
        <div v-if="billsData.paid.length === 0" class="text-center text-slate-500 py-4 text-sm">ยังไม่มีการจ่ายบิลในเดือนนี้</div>
        <div v-else v-for="b in billsData.paid" :key="b.id" class="bg-brand-card rounded-xl p-3 mb-2 flex justify-between items-center border-l-4 border-green-500">
          <div class="flex items-center gap-3 flex-1">
            <div class="bg-green-500 p-2 rounded-lg text-lg">✅</div>
            <div>
              <div class="font-medium text-sm text-white">{{ b.category }} <span class="text-xs text-slate-400 ml-1" v-if="b.time!=='-'">({{ b.time.substring(0,5) }} น.)</span></div>
              <div class="text-xs text-slate-400 mt-1">{{ b.date }} • {{ b.account }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-white font-bold">{{ b.amount.toLocaleString('th-TH') }} ฿</div>
            <button @click="deleteRecord(b)" class="text-slate-500 hover:text-red-500 px-1">🗑️</button>
          </div>
        </div>
      </section>

    </main>

    <!-- 🌟 หน้าต่างสรุป (Modal) -->
    <div v-if="isSummaryOpen" class="absolute inset-0 bg-brand-bg z-50 flex flex-col">
      <div class="bg-brand-yellow p-4 pt-safe flex items-end justify-between rounded-b-2xl shadow-md">
        <button @click="isSummaryOpen = false" class="text-slate-800 font-bold px-2 py-1">&lt; กลับ</button>
        <div class="font-bold text-lg text-slate-800">📊 สรุปพฤติกรรม</div>
        <div class="w-10"></div>
      </div>
      <div class="p-4 overflow-y-auto flex-1 pb-24">
        
        <div class="bg-brand-card border border-slate-700 rounded-xl p-4 mb-4">
          <h3 class="text-white font-bold mb-3">💰 ยอดเงินคงเหลือแต่ละบัญชี</h3>
          <div v-for="(bal, acc) in accountBalances" :key="acc" class="flex justify-between text-sm py-2 border-b border-slate-700 border-dashed last:border-0">
            <span class="text-slate-300">{{ acc }}</span>
            <span class="font-bold" :class="bal >= 0 ? 'text-green-500' : 'text-red-500'">{{ bal.toLocaleString('th-TH') }} ฿</span>
          </div>
        </div>

        <div class="bg-brand-card border border-slate-700 rounded-xl p-4 mb-4">
          <h3 class="text-white font-bold mb-4">⚖️ ภาพรวมเดือนนี้</h3>
          <div class="mb-4">
            <div class="flex justify-between text-sm mb-1"><span class="text-green-500">รายรับ</span><span class="text-green-500 font-bold">+{{ totalIncome.toLocaleString('th-TH') }} ฿</span></div>
            <div class="bg-slate-800 h-2.5 rounded-full overflow-hidden"><div class="bg-green-500 h-full" :style="{ width: incWidth + '%' }"></div></div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1"><span class="text-red-500">รายจ่าย (รวมบิล+ให้ยืม)</span><span class="text-red-500 font-bold">-{{ totalExpense.toLocaleString('th-TH') }} ฿</span></div>
            <div class="bg-slate-800 h-2.5 rounded-full overflow-hidden"><div class="bg-red-500 h-full" :style="{ width: expWidth + '%' }"></div></div>
          </div>
          <div class="bg-slate-800 p-3 rounded-lg mt-5 flex justify-between text-center items-center">
            <div class="flex-1">
              <div class="text-[11px] text-slate-400 mb-1">เฉลี่ยรวม (หาร {{ daysDivisor }} วัน)</div>
              <div class="text-lg font-bold text-yellow-400">{{ avgDailyTotal.toLocaleString('th-TH', {minimumFractionDigits: 2}) }} ฿</div>
            </div>
            <div class="w-px h-8 bg-slate-600 mx-2"></div>
            <div class="flex-1">
              <div class="text-[11px] text-slate-400 mb-1">ใช้จ่ายรายวัน <span class="text-sky-400">(ไม่รวมบิล)</span></div>
              <div class="text-lg font-bold text-sky-400">{{ avgDailyGeneral.toLocaleString('th-TH', {minimumFractionDigits: 2}) }} ฿</div>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-blue-800 to-blue-500 rounded-xl p-4 shadow-lg mb-4 text-white">
          <h3 class="font-bold mb-2">💡 วิเคราะห์พฤติกรรม</h3>
          <p class="text-sm font-light leading-relaxed" v-html="insightText"></p>
        </div>

        <h3 class="text-slate-400 font-bold mb-3">หมวดหมู่ยอดฮิต</h3>
        <div v-for="cat in sortedCategories" :key="cat.name" class="mb-3">
          <div class="flex justify-between text-sm mb-1">
            <span class="font-medium text-white">{{ cat.name }} <span class="text-[11px] text-slate-400 font-normal ml-1">(เฉลี่ย {{ cat.avg.toLocaleString('th-TH',{minimumFractionDigits: 2}) }} ฿/วัน)</span></span>
            <span class="text-white">{{ cat.amount.toLocaleString('th-TH') }} ฿</span>
          </div>
          <div class="bg-slate-800 h-2 rounded-full overflow-hidden"><div class="bg-brand-yellow h-full" :style="{ width: cat.percent + '%' }"></div></div>
        </div>
      </div>
    </div>

    <!-- 🌟 หน้าต่างจดบันทึก (Form Modal) -->
    <div v-if="isFormOpen" class="absolute inset-0 bg-brand-bg z-50 flex flex-col">
      <div class="bg-brand-yellow pt-safe">
        <div class="px-4 py-3 flex justify-between items-center">
          <button @click="isFormOpen = false" class="text-slate-800 font-bold">ยกเลิก</button>
        </div>
        <!-- เมนู Tab ในฟอร์ม -->
        <div class="flex overflow-x-auto whitespace-nowrap hide-scrollbar px-2 pb-0">
          <button @click="formType = 'expense'" :class="formType==='expense' ? 'bg-brand-bg text-white' : 'text-slate-800'" class="px-4 py-2.5 rounded-t-xl font-semibold text-sm transition">รายจ่าย</button>
          <button @click="formType = 'income'" :class="formType==='income' ? 'bg-brand-bg text-white' : 'text-slate-800'" class="px-4 py-2.5 rounded-t-xl font-semibold text-sm transition">รายรับ</button>
          <button @click="formType = 'transfer'" :class="formType==='transfer' ? 'bg-brand-bg text-white' : 'text-slate-800'" class="px-4 py-2.5 rounded-t-xl font-semibold text-sm transition">ย้ายเงิน</button>
          <button @click="formType = 'bill'" :class="formType==='bill' ? 'bg-brand-bg text-white' : 'text-slate-800'" class="px-4 py-2.5 rounded-t-xl font-semibold text-sm transition">บิล</button>
          <button @click="formType = 'debtor'" :class="formType==='debtor' ? 'bg-brand-bg text-white' : 'text-slate-800'" class="px-4 py-2.5 rounded-t-xl font-semibold text-sm transition">ลูกหนี้</button>
        </div>
      </div>

      <div class="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
        <div class="text-sky-400 font-medium text-sm">{{ formDateDisplay }}</div>
        
        <div class="bg-brand-card p-5 rounded-2xl flex items-center gap-4">
          <div class="text-3xl font-bold" :class="formIconColor">{{ formIcon }}</div>
          <input type="number" v-model="formAmount" placeholder="0" class="bg-transparent border-none outline-none text-white text-4xl w-full font-light placeholder:text-slate-500">
          <div class="text-slate-500 text-3xl font-light">฿</div>
        </div>

        <template v-if="formType === 'transfer'">
          <div class="bg-brand-card p-4 rounded-xl flex items-center gap-3">
            <select v-model="formSourceAcc" class="bg-transparent text-sky-400 w-full outline-none appearance-none">
              <option value="" disabled selected>โอนจากบัญชี (ต้นทาง)</option>
              <option value="กสิกร">🟢 กสิกร</option><option value="กรุงไทย">🔵 กรุงไทย</option><option value="TrueMoney">🟠 TrueMoney</option><option value="เงินสด">💵 เงินสด</option>
            </select>
          </div>
          <div class="text-center text-sky-400 font-bold text-sm">⬇️ ย้ายเข้าบัญชี ⬇️</div>
          <div class="bg-brand-card p-4 rounded-xl flex items-center gap-3">
            <select v-model="formDestAcc" class="bg-transparent text-sky-400 w-full outline-none appearance-none">
              <option value="" disabled selected>ย้ายเข้าบัญชี (ปลายทาง)</option>
              <option value="กสิกร">🟢 กสิกร</option><option value="กรุงไทย">🔵 กรุงไทย</option><option value="TrueMoney">🟠 TrueMoney</option><option value="เงินสด">💵 เงินสด</option>
            </select>
          </div>
        </template>
        
        <template v-else>
          <div v-if="formType === 'debtor'" class="bg-brand-card p-4 rounded-xl flex items-center gap-3">
            <select v-model="formDebtorAction" class="bg-transparent text-violet-400 font-bold w-full outline-none appearance-none">
              <option value="lend">📤 ให้เพื่อนยืมเงิน</option>
              <option value="repay">📥 เพื่อนคืนเงินให้แล้ว</option>
            </select>
          </div>
          <div v-if="formType === 'bill'" class="bg-brand-card p-4 rounded-xl flex items-center gap-3">
            <select v-model="formBillStatus" class="bg-transparent text-yellow-400 font-bold w-full outline-none appearance-none">
              <option value="ยังไม่จ่าย">⏳ ค้างชำระ (ยังไม่จ่าย)</option>
              <option value="จ่ายแล้ว">✅ จ่ายแล้ว</option>
            </select>
          </div>
          <div v-show="formType !== 'bill' || formBillStatus === 'จ่ายแล้ว'" class="bg-brand-card p-4 rounded-xl flex items-center gap-3">
            <select v-model="formAccount" class="bg-transparent text-sky-400 w-full outline-none appearance-none">
              <option value="" disabled selected>เลือกบัญชีที่ใช้เงิน</option>
              <option value="กสิกร">🟢 กสิกร</option><option value="กรุงไทย">🔵 กรุงไทย</option><option value="TrueMoney">🟠 TrueMoney</option><option value="เงินสด">💵 เงินสด</option>
            </select>
          </div>
          <div v-if="formType === 'debtor'" class="bg-brand-card p-4 rounded-xl flex items-center gap-3">
            <input type="text" v-model="formDebtorName" placeholder="พิมพ์ชื่อคนยืม (เช่น นัท)" class="bg-transparent w-full outline-none text-white">
          </div>
          <div v-else class="bg-brand-card p-4 rounded-xl flex items-center gap-3">
            <select v-model="formCategory" class="bg-transparent text-sky-400 w-full outline-none appearance-none">
              <option value="" disabled selected>{{ formType === 'bill' ? 'เลือกบิล' : 'เลือกหมวดหมู่ / แท็ก' }}</option>
              <template v-if="formType === 'expense'">
                <option value="อาหาร">🍔 อาหาร</option><option value="เดินทาง">🚗 เดินทาง</option><option value="BTS">🚆 BTS</option><option value="ช้อปปิ้ง">🛍️ ช้อปปิ้ง</option><option value="ทั่วไป">ทั่วไป</option>
              </template>
              <template v-if="formType === 'income'">
                <option value="เงินเดือน">💰 เงินเดือน</option><option value="จากพ่อ">👨 จากพ่อ</option><option value="จากแม่">👩 จากแม่</option><option value="อื่นๆ">อื่นๆ</option>
              </template>
              <template v-if="formType === 'bill'">
                <option value="ShopeePay">🧡 ShopeePay</option><option value="SEasyCash">💸 SEasyCash</option><option value="SPayExtra">💳 SPayExtra</option><option value="Internet">🌐 Internet</option><option value="ค่าทำฟัน">🦷 ค่าทำฟัน</option><option value="ประกันสังคม">🏥 ประกันสังคม</option><option value="บิลอื่นๆ">บิลอื่นๆ</option>
              </template>
            </select>
          </div>
        </template>
        
        <div class="bg-brand-card p-4 rounded-xl flex items-center gap-3">
          <input type="text" v-model="formNote" placeholder="เพิ่มโน้ต (ทางเลือก)" class="bg-transparent w-full outline-none text-white placeholder:text-slate-500">
        </div>

        <button @click="saveRecord" class="w-full bg-blue-500 text-white py-4 rounded-full font-bold text-lg mt-auto active:scale-95 transition shadow-lg">บันทึก</button>
      </div>
    </div>

    <!-- 🌟 ปุ่มลอย (FAB) -->
    <div v-if="!isFormOpen && !isSummaryOpen" class="absolute bottom-[80px] w-full flex justify-center z-30">
      <button @click="openForm('expense')" class="bg-brand-blue text-white px-6 py-3 rounded-full font-semibold shadow-[0_4px_15px_rgba(0,102,255,0.4)] flex items-center gap-2 hover:bg-blue-600 active:scale-95 transition">
        <svg class="w-5 h-5 stroke-white fill-none stroke-2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        จดเพิ่ม | ∧
      </button>
    </div>

    <!-- 🌟 Bottom Nav -->
    <nav v-if="!isFormOpen && !isSummaryOpen" class="bg-white text-slate-500 h-[60px] pb-safe flex absolute bottom-0 w-full shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-40 rounded-t-2xl">
      <div @click="currentTab = 'home'" :class="{'text-brand-blue font-bold': currentTab === 'home'}" class="flex-1 flex flex-col items-center justify-center cursor-pointer transition active:scale-90">
        <svg class="w-6 h-6 mb-0.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span class="text-[10px]">หน้าแรก</span>
      </div>
      <div @click="currentTab = 'calendar'" :class="{'text-brand-blue font-bold': currentTab === 'calendar'}" class="flex-1 flex flex-col items-center justify-center cursor-pointer transition active:scale-90">
        <svg class="w-6 h-6 mb-0.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        <span class="text-[10px]">ปฏิทิน</span>
      </div>
      <div @click="currentTab = 'debtors'" :class="{'text-brand-blue font-bold': currentTab === 'debtors'}" class="flex-1 flex flex-col items-center justify-center cursor-pointer transition active:scale-90">
        <svg class="w-6 h-6 mb-0.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
        <span class="text-[10px]">คนยืม</span>
      </div>
      <div @click="currentTab = 'bills'" :class="{'text-brand-blue font-bold': currentTab === 'bills'}" class="flex-1 flex flex-col items-center justify-center cursor-pointer transition active:scale-90">
        <svg class="w-6 h-6 mb-0.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        <span class="text-[10px]">บิล</span>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// เปลี่ยนจาก 'http://127.0.0.1:8080' เป็น:
const API_BASE_URL = 'https://my-line-bot.onrender.com'

// State
const currentTab = ref('home')
const isFormOpen = ref(false)
const isSummaryOpen = ref(false)
const isLoading = ref(true)

const records = ref([])
const totalBalance = ref(0)
const totalExpense = ref(0)
const totalIncome = ref(0)
const accountBalances = ref({})
const debtorsData = ref({})
const simulatedIncome = ref(0)
const simulatedIncomeInput = ref('')

const viewDate = ref(new Date())
const currentDate = new Date()
const thMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const thDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์']

const toastMsg = ref('')
const isError = ref(false)

// Form State
const formType = ref('expense')
const formAmount = ref('')
const formAccount = ref('')
const formCategory = ref('')
const formNote = ref('')
const formBillStatus = ref('ยังไม่จ่าย')
const formSourceAcc = ref('')
const formDestAcc = ref('')
const formDebtorAction = ref('lend')
const formDebtorName = ref('')

// Helpers
const showToast = (msg, error = false) => {
  toastMsg.value = msg; isError.value = error
  setTimeout(() => toastMsg.value = '', 2500)
}
const isExpense = (t) => t.includes('รายจ่าย') || t === 'ให้ยืมเงิน'
const isIncome = (t) => t === 'รายรับ' || t === 'ได้คืนจากลูกหนี้'

// Computed
const monthDisplay = computed(() => `${thMonths[viewDate.value.getMonth()]} ${(viewDate.value.getFullYear() + 543).toString().slice(-2)}`)
const formDateDisplay = computed(() => `📅 วัน${thDays[currentDate.getDay()]}ที่ ${currentDate.getDate()} ${thMonths[currentDate.getMonth()]} ${(currentDate.getFullYear() + 543).toString().slice(-2)}`)

const formIcon = computed(() => {
  if (formType.value === 'expense') return '↑'
  if (formType.value === 'income') return '↓'
  if (formType.value === 'transfer') return '⇄'
  if (formType.value === 'debtor') return '🤝'
  return '🧾'
})
const formIconColor = computed(() => {
  if (formType.value === 'expense') return 'text-red-500'
  if (formType.value === 'income') return 'text-green-500'
  if (formType.value === 'transfer') return 'text-yellow-500'
  if (formType.value === 'debtor') return 'text-violet-500'
  return 'text-orange-500'
})

// Home: Grouped Records
const groupedRecords = computed(() => {
  const valid = records.value.filter(r => r.status !== 'ยังไม่จ่าย')
  const grouped = {}
  valid.forEach(r => {
    if (!grouped[r.date]) grouped[r.date] = { date: r.date, day: r.date.split('/')[0], expense: 0, income: 0, items: [] }
    if (isExpense(r.type)) grouped[r.date].expense += r.amount
    if (isIncome(r.type)) grouped[r.date].income += r.amount
    r.id = r.date + r.time + r.amount + r.category
    grouped[r.date].items.push(r)
  })
  return Object.values(grouped).sort((a, b) => {
    const [d1, m1, y1] = a.date.split('/'); const [d2, m2, y2] = b.date.split('/')
    return new Date(y2, m2-1, d2) - new Date(y1, m1-1, d1)
  }).map(g => { g.items.reverse(); return g })
})

// Debtors
const totalDebtors = computed(() => Object.values(debtorsData.value).reduce((a,b) => a+b, 0))
const debtorsList = computed(() => Object.entries(debtorsData.value).filter(d => d[1] > 0).sort((a,b) => b[1]-a[1]).map(d => ({name: d[0], amount: d[1]})))

// Bills
const billsData = computed(() => {
  const bills = records.value.filter(r => r.type === 'รายจ่ายต้องชำระต่อเดือน').reverse()
  const unpaid = bills.filter(b => b.status === 'ยังไม่จ่าย')
  const paid = bills.filter(b => b.status !== 'ยังไม่จ่าย')
  const totalUnpaid = unpaid.reduce((sum, b) => sum + b.amount, 0)
  const totalPaid = paid.reduce((sum, b) => sum + b.amount, 0)
  
  const effectiveBalance = totalBalance.value + simulatedIncome.value
  const remainingToSave = totalUnpaid - effectiveBalance
  
  const daysInMonth = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 0).getDate()
  const isCurrentMonth = (viewDate.value.getMonth() === currentDate.getMonth() && viewDate.value.getFullYear() === currentDate.getFullYear())
  const remainingDays = isCurrentMonth ? (daysInMonth - currentDate.getDate() + 1) : daysInMonth
  const dailySave = remainingToSave / Math.max(1, remainingDays)

  return { unpaid, paid, totalUnpaid, totalPaid, remainingToSave, dailySave }
})

// Calendar
const calData = computed(() => {
  const daysInMonth = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 0).getDate()
  const isCurrentMonth = (viewDate.value.getMonth() === currentDate.getMonth() && viewDate.value.getFullYear() === currentDate.getFullYear())
  const upToDay = isCurrentMonth ? currentDate.getDate() : daysInMonth

  let currentGapReal = billsData.value.totalUnpaid - totalBalance.value
  let dailyS = new Array(upToDay + 1).fill(0)
  
  records.value.forEach(r => {
    if (r.status === 'ยังไม่จ่าย') return
    let day = parseInt(r.date.split('/')[0])
    if (day >= 1 && day <= upToDay) {
      if (isIncome(r.type)) dailyS[day] += r.amount
      else if (isExpense(r.type)) dailyS[day] -= r.amount
    }
  })

  let sumS = dailyS.reduce((a,b) => a+b, 0)
  let currentRunningGap = Math.max(0, currentGapReal + sumS)
  let calendarData = []

  for (let i = 1; i <= upToDay; i++) {
    let targetForDay = currentRunningGap > 0 ? currentRunningGap / (daysInMonth - i + 1) : 0
    let actualS = dailyS[i]
    let newGap = Math.max(0, currentRunningGap - actualS)
    let effectiveNewGap = i === upToDay ? Math.max(0, newGap - simulatedIncome.value) : newGap
    let nextTarget = (effectiveNewGap > 0 && daysInMonth - i > 0) ? effectiveNewGap / (daysInMonth - i) : 0

    calendarData.push({
      day: i, target: targetForDay, actual: actualS, diff: actualS - targetForDay,
      nextTarget, isPast: i < upToDay, isToday: i === upToDay
    })
    currentRunningGap = newGap
  }

  let displayGap = Math.max(0, currentGapReal - simulatedIncome.value)
  let nextTargetTommorow = displayGap > 0 ? displayGap / Math.max(1, daysInMonth - upToDay) : 0

  return { calendarData: calendarData.reverse(), displayGap, nextTargetTommorow, daysLeft: daysInMonth - upToDay, currentGapReal, isCurrentMonth }
})

// Summary
const daysDivisor = computed(() => {
  const daysInMonth = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 0).getDate()
  return (viewDate.value.getMonth() === currentDate.getMonth() && viewDate.value.getFullYear() === currentDate.getFullYear()) ? currentDate.getDate() : daysInMonth
})
const totalGeneralExp = computed(() => records.value.filter(r => r.type === 'รายจ่าย').reduce((s,r) => s+r.amount, 0))
const avgDailyTotal = computed(() => totalExpense.value / Math.max(1, daysDivisor.value))
const avgDailyGeneral = computed(() => totalGeneralExp.value / Math.max(1, daysDivisor.value))
const maxVal = computed(() => Math.max(totalIncome.value, totalExpense.value))
const incWidth = computed(() => maxVal.value > 0 ? (totalIncome.value / maxVal.value) * 100 : 0)
const expWidth = computed(() => maxVal.value > 0 ? (totalExpense.value / maxVal.value) * 100 : 0)

const sortedCategories = computed(() => {
  let catMap = {}
  records.value.forEach(r => {
    if (r.status !== 'ยังไม่จ่าย' && isExpense(r.type)) {
      let c = r.category || 'ไม่ระบุ'
      catMap[c] = (catMap[c] || 0) + r.amount
    }
  })
  return Object.entries(catMap).sort((a,b) => b[1]-a[1]).map(c => {
    let div = ['ShopeePay', 'SEasyCash', 'SPayExtra', 'Internet', 'ค่าทำฟัน', 'ประกันสังคม', 'บิลอื่นๆ'].includes(c[0]) ? new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 0).getDate() : daysDivisor.value
    return { name: c[0], amount: c[1], percent: Math.round((c[1]/totalExpense.value)*100), avg: c[1]/Math.max(1, div) }
  })
})
const insightText = computed(() => {
  if (totalGeneralExp.value === 0) return `เดือนนี้คุณยังไม่มีการใช้จ่ายเลยครับ ดีเยี่ยมมากๆ! 🎉`
  const top = sortedCategories.value[0]
  let txt = `คุณหมดเงินไปกับ <b>${top.name}</b> เยอะที่สุด คิดเป็น <b>${top.percent}%</b> ของรายจ่ายทั้งหมด`
  if (totalIncome.value > 0 && totalExpense.value > totalIncome.value) txt += `<br><span class="text-red-400 mt-1 inline-block">⚠️ ระวัง: เดือนนี้ใช้จ่ายเกินรายรับไปแล้วนะ!</span>`
  else if (totalIncome.value > 0 && totalExpense.value <= totalIncome.value * 0.5) txt += `<br><span class="text-green-400 mt-1 inline-block">✨ ยอดเยี่ยม: ใช้เงินไม่ถึงครึ่งของรายรับ มีเงินเก็บแน่นอน!</span>`
  return txt
})

// Methods
const applySimulation = () => { simulatedIncome.value = simulatedIncomeInput.value || 0 }
const clearSimulation = () => { simulatedIncome.value = 0; simulatedIncomeInput.value = '' }

const changeMonth = (dir) => {
  const d = new Date(viewDate.value)
  d.setMonth(d.getMonth() + dir)
  viewDate.value = d
  fetchMonthData()
}

const fetchMonthData = async () => {
  isLoading.value = true
  const m = String(viewDate.value.getMonth() + 1).padStart(2, '0')
  const y = String(viewDate.value.getFullYear()).slice(-2)
  try {
    const res = await fetch(`${API_BASE_URL}/api/data?month=${m}/${y}`)
    if (!res.ok) throw new Error()
    const data = await res.json()
    records.value = data.records || []
    totalBalance.value = data.total_balance || 0
    totalExpense.value = data.total_expense || 0
    totalIncome.value = data.total_income || 0
    accountBalances.value = data.account_balances || {}
    debtorsData.value = data.debtors || {}
  } catch (e) {
    showToast('❌ ขาดการเชื่อมต่อกับเซิร์ฟเวอร์', true)
  } finally {
    isLoading.value = false
  }
}

const deleteRecord = async (item) => {
  if (!confirm(`⚠️ ต้องการลบรายการ "${item.category}" ใช่ไหมครับ?`)) return
  showToast("🗑️ กำลังลบข้อมูลหลังบ้าน...")
  try {
    const res = await fetch(`${API_BASE_URL}/api/delete`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: item.date, amount: item.amount, category: item.category, month: item.sheet })
    })
    const data = await res.json()
    if (data.status === 'success') { showToast("✅ ลบสำเร็จ"); fetchMonthData() }
    else showToast('❌ ' + data.message, true)
  } catch (e) { showToast('❌ ขาดการเชื่อมต่อ', true) }
}

const openForm = (type) => {
  formType.value = type
  formAmount.value = ''; formNote.value = ''; formDebtorName.value = ''; formAccount.value = ''
  formCategory.value = ''; formSourceAcc.value = ''; formDestAcc.value = ''
  isFormOpen.value = true
}

const payUnpaidBill = (b) => {
  openForm('bill')
  formAmount.value = b.amount
  formCategory.value = b.category
  formBillStatus.value = 'จ่ายแล้ว'
}

const saveRecord = async () => {
  if (!formAmount.value) return alert("⚠️ กรุณาใส่จำนวนเงินด้วยครับ!")
  let payload = { type: formType.value, amount: formAmount.value, note: formNote.value || '-' }

  if (formType.value === 'transfer') {
    if(!formSourceAcc.value || !formDestAcc.value) return alert("⚠️ กรุณาเลือกบัญชีต้นทางและปลายทางให้ครบ!")
    if(formSourceAcc.value === formDestAcc.value) return alert("⚠️ บัญชีต้นทางและปลายทางต้องไม่เหมือนกัน!")
    payload.sourceAccount = formSourceAcc.value; payload.destinationAccount = formDestAcc.value
  } else if (formType.value === 'debtor') {
    if(!formDebtorName.value.trim()) return alert("⚠️ กรุณาพิมพ์ชื่อคนยืมด้วยครับ!")
    if(!formAccount.value) return alert("⚠️ กรุณาเลือกบัญชีด้วยครับ!")
    payload.type = formDebtorAction.value
    payload.category = formDebtorName.value.trim()
    payload.account = formAccount.value; payload.status = "-"
  } else {
    if(!formCategory.value) return alert("⚠️ กรุณาเลือกหมวดหมู่ด้วยครับ!")
    if((formType.value !== 'bill' || formBillStatus.value === 'จ่ายแล้ว') && !formAccount.value) return alert("⚠️ กรุณาเลือกบัญชีด้วยครับ!")
    payload.category = formCategory.value
    payload.account = formAccount.value || '-'
    payload.status = formType.value === 'bill' ? formBillStatus.value : '-'
  }

  showToast("⏳ กำลังบันทึก...")
  isFormOpen.value = false
  try {
    const res = await fetch(`${API_BASE_URL}/api/add`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (data.status === 'success') { showToast("✅ บันทึกสำเร็จ"); fetchMonthData() }
    else showToast('❌ ' + data.message, true)
  } catch (e) { showToast('❌ ขาดการเชื่อมต่อ', true) }
}
onMounted(() => {
  fetchMonthData()
})
</script>

<style>
/* ซ่อน Scrollbar ของเมนูในหน้า Form */
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>