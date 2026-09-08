<template>
  <div class="flex flex-col h-full relative font-sans bg-brand-bg text-white overflow-hidden">
    
    <div v-if="updateState" role="status" aria-live="polite" class="fixed bottom-24 left-4 right-4 mx-auto max-w-md z-[10000] rounded-2xl bg-sky-950 border border-sky-400/50 px-4 py-3 text-sm text-white shadow-xl">
      <strong class="block">✨ มีเวอร์ชันใหม่</strong>
      <span class="block mt-1 text-sky-100">{{ updateState === 'updating' ? 'กำลังรีเฟรชเพื่ออัปเดตใน 3 วินาที…' : 'จะอัปเดตอัตโนมัติเมื่อคุณทำรายการเสร็จ' }}</span>
    </div>
    <!-- แจ้งเตือน Toast -->
    <Transition name="toast">
      <div v-if="toastMsg" class="fixed top-safe mt-5 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full font-semibold shadow-xl z-[9999] whitespace-nowrap flex items-center gap-2"
           :class="isError ? 'bg-red-500 text-white' : 'bg-green-500 text-white'">
        {{ toastMsg }}
      </div>
    </Transition>

    <!-- 🌟 ส่วนเนื้อหาหลัก 🌟 -->
    <main class="flex-1 overflow-y-auto pb-24 scroll-smooth">
      
      <Transition name="fade" mode="out-in">
        
        <!-- 🏠 แท็บหน้าแรก -->
        <section v-if="currentTab === 'home'" key="home" class="p-4">
          <div class="bg-brand-yellow text-slate-800 p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative mb-4 transition-transform hover:scale-[1.02]">
            <div class="flex items-center gap-4 text-sky-700 font-bold mb-4 text-lg">
              <button @click="changeMonth(-1)" class="hover:opacity-70 px-2 select-none active:scale-75 transition-transform">&lt;</button>
              <span>📅 {{ monthDisplay }}</span>
              <button @click="changeMonth(1)" class="hover:opacity-70 px-2 select-none active:scale-75 transition-transform">&gt;</button>
            </div>
            <div class="flex justify-between items-start">
              <div class="flex flex-col gap-2">
                <div>
                  <p class="text-sm font-medium text-slate-600">ยอดเงินคงเหลือรวม</p>
                  <p class="text-3xl font-extrabold leading-tight tracking-tight">{{ totalBalance.toLocaleString('th-TH') }} ฿</p>
                </div>
                <div>
                  <p class="text-sm font-medium text-slate-600">ยอดใช้จ่ายเดือนนี้</p>
                  <p class="text-xl font-bold text-red-500">{{ totalExpense.toLocaleString('th-TH') }} ฿</p>
                </div>
              </div>
              <button @click="isSummaryOpen = true" class="bg-blue-700 text-white px-4 py-2.5 rounded-full text-sm font-bold flex items-center gap-1.5 hover:bg-blue-800 transition-all active:scale-90 shadow-lg">
                <svg class="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z"/></svg>
                สรุป
              </button>
            </div>
          </div>

          <div v-if="isLoading" class="flex flex-col items-center justify-center py-16 text-sky-400 gap-3">
            <svg class="animate-spin h-10 w-10 text-brand-yellow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span class="animate-pulse font-medium">กำลังซิงค์ข้อมูล...</span>
          </div>
          
          <div v-else-if="groupedRecords.length === 0" class="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <span class="text-4xl">🍃</span>
            <span>ยังไม่มีรายการในเดือนนี้</span>
          </div>
          
          <div v-else v-for="group in groupedRecords" :key="group.date" class="flex mt-3 border-t border-slate-800/50 pt-3">
            <div class="w-16 text-center pt-3 border-l-4 border-brand-yellow text-brand-yellow">
              <div class="text-[10px] uppercase tracking-wider font-bold opacity-80">วันที่</div>
              <div class="text-2xl font-black">{{ group.day }}</div>
            </div>
            <div class="flex-1 bg-brand-card p-4 rounded-2xl shadow-sm border border-slate-700/30">
              <div class="flex justify-end gap-3 border-b border-slate-700/50 pb-2 mb-3 text-xs font-semibold tracking-wide">
                <span v-if="group.expense > 0" class="text-red-400 bg-red-400/10 px-2 py-0.5 rounded">↓ {{ group.expense.toLocaleString('th-TH') }}</span>
                <span v-if="group.income > 0" class="text-green-400 bg-green-400/10 px-2 py-0.5 rounded">↑ {{ group.income.toLocaleString('th-TH') }}</span>
              </div>
              
              <div v-for="item in group.items" :key="item.id" class="flex justify-between items-center mb-4 last:mb-0 group">
                <div>
                  <p class="text-white font-medium text-sm">
                    <span v-if="item.type === 'ย้ายเงิน'">🔄 ย้ายเงิน</span>
                    <span v-else-if="item.type === 'ให้ยืมเงิน'">📤 ให้ยืม: {{ item.category }}</span>
                    <span v-else-if="item.type === 'ได้คืนจากลูกหนี้'">📥 ได้คืนจาก: {{ item.category }}</span>
                    <span v-else>{{ item.category }}</span>
                    <span class="text-[10px] text-slate-400 ml-2 font-normal bg-slate-800 px-1.5 py-0.5 rounded" v-if="item.time && item.time !== '-'">{{ item.time.substring(0,5) }} น.</span>
                  </p>
                  <p class="text-slate-400 text-xs mt-1">
                    <template v-if="item.type === 'ย้ายเงิน'">{{ item.account }} ➡️ {{ item.category }}</template>
                    <template v-else>{{ item.account }}</template>
                    <span v-if="item.note && item.note !== '-'" class="italic text-slate-300"> ({{ item.note }})</span>
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <span class="font-bold text-sm tracking-wide" :class="isExpense(item.type) ? 'text-red-400' : (isIncome(item.type) ? 'text-green-400' : 'text-yellow-400')">
                    {{ isExpense(item.type) ? '-' : (isIncome(item.type) ? '+' : '') }}{{ item.amount.toLocaleString('th-TH') }}
                  </span>
                  <button @click="deleteRecord(item)" class="text-slate-600 hover:text-red-500 active:scale-75 transition-all p-1 bg-slate-800/50 hover:bg-red-500/10 rounded-lg">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 📅 แท็บปฏิทินออมเงิน -->
        <section v-else-if="currentTab === 'calendar'" key="calendar" class="p-4">
          <div class="text-center font-bold text-lg text-slate-800 bg-brand-yellow rounded-t-2xl py-3 -mt-4 -mx-4 mb-4 shadow-md">
            📅 ปฏิทินออมเงิน
          </div>
          
          <div class="bg-brand-card border border-blue-500/50 border-dashed rounded-xl p-4 mb-5 shadow-sm">
            <div class="text-sm font-semibold mb-2 text-blue-400">🔮 โหมดจำลองรายรับล่วงหน้า</div>
            <div class="flex gap-2">
              <input type="number" v-model.number="simulatedIncomeInput" placeholder="จำลองรายรับ..." class="flex-1 p-2 rounded-lg bg-slate-800/50 focus:bg-slate-800 text-white outline-none transition-colors border border-transparent focus:border-blue-500/50">
              <button @click="applySimulation" class="bg-blue-600 text-white px-4 rounded-lg font-bold active:scale-90 transition-transform">จำลอง</button>
              <button v-if="simulatedIncome > 0" @click="clearSimulation" class="bg-red-500 text-white px-4 rounded-lg font-bold active:scale-90 transition-transform">ล้าง</button>
            </div>
            <div v-if="simulatedIncome > 0" class="text-[11px] text-yellow-400 mt-2">* หักลบเงินจำลอง {{ simulatedIncome.toLocaleString('th-TH') }} ฿ แล้ว</div>
          </div>

          <div class="bg-gradient-to-br from-sky-600 to-blue-700 rounded-2xl p-5 shadow-lg mb-5 text-white">
            <div class="text-sm font-semibold mb-1 text-sky-100 opacity-90">🎯 สถานะเป้าหมายปัจจุบัน</div>
            <div class="flex justify-between items-end mb-4">
              <div>
                <div class="text-xs text-sky-200">ยอดเงินที่ยังขาด{{ simulatedIncome > 0 ? ' (หลังจำลอง)' : '' }}</div>
                <div class="text-3xl font-black tracking-tight">{{ calData.displayGap > 0 ? calData.displayGap.toLocaleString('th-TH', {minimumFractionDigits: 2}) : '0' }} ฿</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-sky-200">ต้องเก็บ{{ calData.isCurrentMonth ? 'พรุ่งนี้' : 'ต่อวัน' }}</div>
                <div class="text-lg font-bold text-yellow-300">{{ calData.displayGap > 0 ? calData.nextTargetTommorow.toLocaleString('th-TH', {minimumFractionDigits: 2}) : '0' }} ฿/วัน</div>
              </div>
            </div>
          </div>

          <!-- ตารางปฏิทิน (Grid) -->
          <div class="bg-brand-card p-4 rounded-2xl shadow-lg border border-slate-700/50 mb-5">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-sm font-bold text-slate-300">{{ monthDisplay }}</h3>
              <div class="text-[10px] text-slate-500 flex gap-2">
                <span class="flex items-center gap-1"><div class="w-2 h-2 rounded-full bg-green-500"></div> ทะลุเป้า</span>
                <span class="flex items-center gap-1"><div class="w-2 h-2 rounded-full bg-red-500"></div> พลาดเป้า</span>
              </div>
            </div>
            
            <div class="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
              <div class="text-red-400">อา</div><div>จ</div><div>อ</div><div>พ</div><div>พฤ</div><div>ศ</div><div class="text-blue-400">ส</div>
            </div>
            
            <div class="grid grid-cols-7 gap-1.5">
              <div v-for="(day, index) in calendarGrid" :key="index"
                   @click="openDayInfo(day)"
                   class="aspect-square flex flex-col items-center justify-center rounded-xl relative cursor-pointer transition-all duration-200 select-none"
                   :class="[
                     day.empty ? 'invisible' : 'bg-slate-800/40 hover:bg-slate-700 active:scale-90',
                     day.isToday ? 'border-2 border-brand-yellow text-brand-yellow font-black shadow-[0_0_10px_rgba(252,211,77,0.3)]' : 'text-slate-300 font-medium',
                     selectedDayInfo?.day === day.day ? 'ring-2 ring-blue-500 bg-blue-900/50' : ''
                   ]">
                <span v-if="!day.empty">{{ day.day }}</span>
                <!-- จุดสีบอกสถานะ -->
                <div v-if="!day.empty && day.data" class="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                     :class="day.data.diff >= 0 || (day.data.target===0 && day.data.actual===0) ? 'bg-green-500' : 'bg-red-500'">
                </div>
              </div>
            </div>
          </div>

          <!-- รายละเอียดของวันที่เลือก -->
          <Transition name="fade" mode="out-in">
            <div v-if="selectedDayInfo && !selectedDayInfo.empty" :key="selectedDayInfo.day" class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 shadow-lg border-2 transition-all duration-300 relative overflow-hidden"
                 :class="selectedDayInfo.data ? (selectedDayInfo.data.diff >= 0 || (selectedDayInfo.data.target===0 && selectedDayInfo.data.actual===0) ? 'border-green-500/50' : 'border-red-500/50') : 'border-slate-700/50'">
              
              <div class="flex justify-between items-center border-b border-slate-700/50 pb-3 mb-4">
                <div class="font-bold text-lg flex items-center gap-2" :class="selectedDayInfo.isToday ? 'text-yellow-400' : 'text-white'">
                  {{ selectedDayInfo.isToday ? '📌 วันนี้' : `📅 วันที่ ${selectedDayInfo.day} ${monthDisplay.split(' ')[0]}` }}
                </div>
                <div v-if="selectedDayInfo.data" class="text-xs font-bold text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
                  เป้าหมาย: {{ selectedDayInfo.data.target.toLocaleString('th-TH', {minimumFractionDigits: 2}) }} ฿
                </div>
              </div>

              <div v-if="selectedDayInfo.data">
                <div class="flex justify-between items-center mb-2">
                  <div class="text-sm text-slate-400">เก็บได้จริง:</div>
                  <div class="text-2xl font-black" :class="selectedDayInfo.data.actual >= 0 ? 'text-green-400' : 'text-red-400'">
                    {{ selectedDayInfo.data.actual > 0 ? '+' : '' }}{{ selectedDayInfo.data.actual.toLocaleString('th-TH') }} ฿
                  </div>
                </div>
                
                <div class="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl mt-4 border border-slate-700/30">
                  <div class="text-xs font-bold" :class="selectedDayInfo.data.diff >= 0 ? 'text-green-500' : 'text-red-500'" v-if="!(selectedDayInfo.data.target===0 && selectedDayInfo.data.actual===0)">
                    {{ selectedDayInfo.data.diff >= 0 ? '🎉 ทะลุเป้า' : '📉 พลาดเป้า' }} ({{ selectedDayInfo.data.diff >= 0 ? '+' : '-' }}{{ Math.abs(selectedDayInfo.data.diff).toLocaleString('th-TH', {minimumFractionDigits: 2}) }})
                  </div>
                  <div class="text-slate-500 text-xs font-bold" v-else>✅ ตามเป้าหมาย</div>
                  
                  <div v-if="selectedDayInfo.data.isPast && calData.currentGapReal > 0" class="text-[10px] text-slate-400 font-medium">เป้าถัดไป {{ selectedDayInfo.data.nextTarget.toLocaleString('th-TH', {maximumFractionDigits: 0}) }} ฿</div>
                  <div v-if="selectedDayInfo.isToday && calData.isCurrentMonth && calData.displayGap > 0" class="text-[10px] text-yellow-400 font-bold bg-yellow-400/10 px-2 py-1 rounded">เป้าพรุ่งนี้ {{ selectedDayInfo.data.nextTarget.toLocaleString('th-TH', {maximumFractionDigits: 0}) }} ฿</div>
                </div>
              </div>
              <div v-else class="flex flex-col items-center justify-center py-6 text-slate-500 gap-2">
                <span class="text-3xl">⏳</span>
                <span class="text-sm font-medium">รอการบันทึกผล (ยังไม่ถึงกำหนด)</span>
              </div>
            </div>
          </Transition>
        </section>

        <!-- 🤝 แท็บคนยืมเงิน -->
        <section v-else-if="currentTab === 'debtors'" key="debtors" class="p-4">
          <div class="text-center font-bold text-lg text-slate-800 bg-brand-yellow rounded-t-2xl py-3 -mt-4 -mx-4 mb-4 shadow-md">
            🤝 คนยืมเงิน (ลูกหนี้)
          </div>
          <div class="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl p-6 shadow-lg mb-5 text-white text-center">
            <div class="text-sm font-medium mb-1 opacity-90">ยอดเงินที่ยังค้างรวม</div>
            <div class="text-4xl font-black tracking-tight">{{ totalDebtors.toLocaleString('th-TH') }} ฿</div>
          </div>

          <button @click="openForm('debtor')" class="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-lg mb-6 active:scale-95 transition-all shadow-[0_4px_20px_rgba(124,58,237,0.4)] flex justify-center items-center gap-2 hover:brightness-110">
            <svg class="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            จดให้ยืม / ได้คืน
          </button>
          
          <div v-if="debtorsList.length === 0" class="text-center text-slate-400 py-12 flex flex-col items-center gap-2">
            <span class="text-4xl">😇</span>
            <span>ไม่มีใครยืมเงินคุณเลย ยอดเยี่ยม!</span>
          </div>
          <div v-else v-for="d in debtorsList" :key="d.name" class="bg-brand-card rounded-2xl p-4 mb-3 border-l-4 border-violet-500 shadow-sm hover:translate-x-1 transition-transform">
            <div class="flex items-center gap-4">
              <div class="bg-violet-500/20 text-violet-400 p-2.5 rounded-xl text-xl">👤</div>
              <div class="min-w-0">
                <div class="font-bold text-base text-white truncate">{{ d.name }}</div>
                <div class="text-xs text-slate-400 mt-0.5">สถานะการคืนเงิน</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 mt-3">
              <div class="bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
                <div class="text-[10px] text-green-400 font-bold">💰 คืนแล้ว</div>
                <div class="text-sm text-green-300 font-black mt-0.5">
                  {{ d.repaid.toLocaleString('th-TH') }} ฿
                </div>
              </div>
              <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2">
                <div class="text-[10px] text-yellow-400 font-bold">⏳ เหลือ</div>
                <div class="text-sm font-black mt-0.5" :class="d.amount > 0 ? 'text-yellow-300' : 'text-green-300'">
                  {{ d.amount.toLocaleString('th-TH') }} ฿
                </div>
              </div>
            </div>

            <div v-if="d.amount <= 0" class="mt-2 text-center text-[11px] font-bold text-green-400 bg-green-500/10 rounded-lg py-1.5">
              ✅ คืนเงินครบแล้ว
            </div>
          </div>
        </section>

        <!-- 📋 แท็บบิลรายเดือน -->
        <section v-else-if="currentTab === 'bills'" key="bills" class="p-4">
          <div class="text-center font-bold text-lg text-slate-800 bg-brand-yellow rounded-t-2xl py-3 -mt-4 -mx-4 mb-4 shadow-md">
            📋 บิลรายเดือน
          </div>
          <div class="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-lg mb-4 text-white text-center">
            <div class="text-sm font-medium mb-1 opacity-90">ยอดบิลชำระแล้วเดือนนี้</div>
            <div class="text-4xl font-black tracking-tight">{{ billsData.totalPaid.toLocaleString('th-TH') }} ฿</div>
          </div>

          <button @click="openForm('bill')" class="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-2xl font-bold text-lg mb-6 active:scale-95 transition-all shadow-[0_4px_20px_rgba(245,158,11,0.4)] flex justify-center items-center gap-2 hover:brightness-110">
            <svg class="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            จดบิลเพิ่ม
          </button>

          <div v-if="billsData.totalUnpaid > 0">
            <div v-if="billsData.remainingToSave <= 0" class="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-5 backdrop-blur-sm">
              <div class="text-xs text-green-400 mb-1 font-bold">🎯 เป้าหมายเตรียมเงินจ่ายบิล</div>
              <div class="text-sm font-medium text-green-300">🎉 ตอนนี้ยอดเงินคงเหลือพอจ่ายบิลทั้งหมดแล้วครับ!</div>
            </div>
            <div v-else class="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-5 backdrop-blur-sm">
              <div class="text-xs text-red-400 mb-1 font-bold">🎯 ขาดเงินอีก {{ billsData.remainingToSave.toLocaleString('th-TH') }} ฿ (เหลือ {{ calData.daysLeft }} วัน)</div>
              <div class="text-sm font-medium text-red-300">ต้องเก็บเงินเพิ่มวันละ: <span class="font-bold text-white bg-red-500/20 px-1.5 py-0.5 rounded">{{ billsData.dailySave.toLocaleString('th-TH', {minimumFractionDigits: 2}) }} ฿</span></div>
            </div>

            <h3 class="text-sm font-bold mb-3 text-red-400 flex items-center gap-2"><span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> ยอดค้างชำระ ({{ billsData.totalUnpaid.toLocaleString('th-TH') }} ฿)</h3>
            <div v-for="b in billsData.unpaid" :key="b.id" class="bg-brand-card rounded-xl p-3 mb-3 flex justify-between items-center border-l-4 border-red-500 shadow-sm active:scale-[0.98] transition-transform">
              <div class="flex items-center gap-3 flex-1 cursor-pointer" @click="payUnpaidBill(b)">
                <div class="bg-red-500/20 text-red-400 p-2.5 rounded-xl text-lg">⏳</div>
                <div>
                  <div class="font-bold text-sm text-red-400">{{ b.category }} <span class="text-[10px] bg-slate-800 text-slate-300 px-1 rounded ml-1" v-if="b.time!=='-'">{{ b.time.substring(0,5) }}</span></div>
                  <div class="text-[11px] text-slate-400 mt-1">{{ b.date }} <span v-if="b.note!=='-'" class="text-yellow-400 font-medium">• {{ b.note }}</span> <span class="text-blue-400 ml-1">(คลิกเพื่อจ่าย 👆)</span></div>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-red-400 font-bold text-base">{{ b.amount.toLocaleString('th-TH') }} ฿</div>
                <button @click="deleteRecord(b)" class="text-slate-600 hover:text-red-500 p-1.5 bg-slate-800/50 hover:bg-red-500/10 rounded-lg active:scale-75 transition-all">🗑️</button>
              </div>
            </div>
          </div>

          <h3 class="text-sm font-bold mb-3 mt-6 text-green-400 flex items-center gap-2"><span class="w-2 h-2 bg-green-500 rounded-full"></span> ชำระไปแล้ว</h3>
          <div v-if="billsData.paid.length === 0" class="text-center text-slate-500 py-6 text-sm">ยังไม่มีการจ่ายบิลในเดือนนี้</div>
          <div v-else v-for="b in billsData.paid" :key="b.id" class="bg-brand-card rounded-xl p-3 mb-2 flex justify-between items-center border-l-4 border-green-500 opacity-70 hover:opacity-100 transition-opacity">
            <div class="flex items-center gap-3 flex-1">
              <div class="bg-green-500/20 text-green-400 p-2.5 rounded-xl text-lg">✅</div>
              <div>
                <div class="font-bold text-sm text-white">{{ b.category }} <span class="text-[10px] bg-slate-800 text-slate-400 px-1 rounded ml-1" v-if="b.time!=='-'">{{ b.time.substring(0,5) }}</span></div>
                <div class="text-[11px] text-slate-400 mt-1">{{ b.date }} • หักจาก {{ b.account }}</div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-white font-bold">{{ b.amount.toLocaleString('th-TH') }} ฿</div>
              <button @click="deleteRecord(b)" class="text-slate-600 hover:text-red-500 p-1 bg-slate-800/50 rounded-lg active:scale-75 transition-all">🗑️</button>
            </div>
          </div>
        </section>
      </Transition>
    </main>

    <!-- 🌟 หน้าต่างสรุป (Modal) แบบ Slide-up -->
    <Transition name="slide-up">
      <div v-if="isSummaryOpen" class="fixed inset-0 bg-brand-bg z-50 flex flex-col">
        <div class="bg-brand-yellow p-4 pt-safe flex items-end justify-between shadow-md relative z-10">
          <button @click="isSummaryOpen = false" class="text-slate-800 font-bold px-2 py-1 active:scale-90 transition-transform flex items-center gap-1">
            <svg class="w-5 h-5 stroke-current" viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg> กลับ
          </button>
          <div class="font-bold text-lg text-slate-800">📊 สรุปการเงิน</div>
          <div class="w-16"></div>
        </div>
        <div class="overflow-y-auto flex-1 bg-brand-bg">
          <div class="max-w-6xl mx-auto p-4 sm:p-6 pb-24 space-y-6">
            <div class="flex items-center justify-between gap-3">
              <div><h2 class="text-xl font-bold">ภาพรวมการเงิน</h2><p class="text-sm text-slate-400 mt-1">{{ monthDisplay }}</p></div>
              <span class="text-xs text-slate-400">หน่วย: บาท</span>
            </div>

            <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div class="col-span-2 lg:col-span-1 bg-brand-yellow text-slate-900 rounded-2xl p-5">
                <p class="text-sm font-semibold">💰 เงินคงเหลือรวม</p>
                <p class="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3 break-words">{{ summaryMoney(totalBalance) }} <span class="text-base">฿</span></p>
                <p class="text-xs mt-3 text-slate-700">ยอดสะสมทุกบัญชี</p>
              </div>
              <div class="bg-brand-card border border-slate-700/50 rounded-2xl p-4 sm:p-5">
                <p class="text-sm text-slate-300">💸 รายจ่ายเดือนนี้</p>
                <p class="text-xl sm:text-3xl font-bold text-red-400 mt-3 break-words">{{ summaryMoney(totalExpense) }} <span class="text-sm">฿</span></p>
                <p class="text-xs text-slate-400 mt-3">รวมบิลที่จ่ายแล้วและเงินให้ยืม</p>
              </div>
              <div class="bg-brand-card border border-slate-700/50 rounded-2xl p-4 sm:p-5">
                <p class="text-sm text-slate-300">📅 ใช้เฉลี่ยต่อวัน</p>
                <p class="text-xl sm:text-3xl font-bold text-sky-400 mt-3 break-words">{{ summaryMoney(avgDailyTotal) }} <span class="text-sm">฿</span></p>
                <p class="text-xs text-slate-400 mt-3">รายจ่ายเดือนนี้ ÷ {{ daysDivisor }} วัน</p>
              </div>
            </div>

            <section class="bg-brand-card border border-slate-700/50 rounded-2xl p-5">
              <h3 class="font-bold mb-4">รายรับและรายจ่าย</h3>
              <div class="grid sm:grid-cols-3 gap-5">
                <div><div class="flex justify-between gap-2 text-sm"><span class="text-slate-300">รับเข้า</span><strong class="text-green-400">{{ summaryMoney(totalIncome) }} ฿</strong></div><div class="h-2 bg-slate-800 rounded-full mt-3 overflow-hidden"><div class="h-full bg-green-400 rounded-full" :style="{width: incWidth + '%'}"></div></div></div>
                <div><div class="flex justify-between gap-2 text-sm"><span class="text-slate-300">จ่ายออก</span><strong class="text-red-400">{{ summaryMoney(totalExpense) }} ฿</strong></div><div class="h-2 bg-slate-800 rounded-full mt-3 overflow-hidden"><div class="h-full bg-red-400 rounded-full" :style="{width: expWidth + '%'}"></div></div></div>
                <div class="rounded-xl bg-slate-800/60 p-3 sm:-mt-2"><p class="text-xs text-slate-300">{{ totalIncome >= totalExpense ? 'รับมากกว่าจ่าย' : 'จ่ายมากกว่ารับ' }}</p><p class="text-xl font-bold mt-1" :class="totalIncome >= totalExpense ? 'text-green-400' : 'text-red-400'">{{ summaryMoney(Math.abs(totalIncome - totalExpense)) }} ฿</p></div>
              </div>
              <p class="text-xs text-slate-400 mt-4">เฉพาะรายจ่ายทั่วไป เฉลี่ย {{ summaryMoney(avgDailyGeneral) }} ฿/วัน · ไม่รวมบิลและเงินให้ยืม</p>
            </section>

            <div class="grid lg:grid-cols-2 gap-6 items-start">
              <section>
                <h3 class="font-bold mb-3">เงินอยู่ที่ไหน</h3>
                <div v-if="Object.keys(accountBalances).length" class="grid grid-cols-2 gap-3">
                  <div v-for="(bal, acc) in accountBalances" :key="acc" class="bg-brand-card border border-slate-700/50 rounded-2xl p-4 min-w-0">
                    <p class="text-sm text-slate-300 break-words">{{ summaryAccountIcon(acc) }} {{ acc }}</p>
                    <p class="text-xl font-bold mt-2 break-words" :class="bal < 0 ? 'text-red-400' : 'text-white'">{{ summaryMoney(bal) }} <span class="text-xs text-slate-400">฿</span></p>
                  </div>
                </div>
                <p v-else class="bg-brand-card rounded-2xl p-6 text-sm text-slate-400">ยังไม่มีรายการบัญชี</p>
              </section>

              <section class="bg-brand-card border border-slate-700/50 rounded-2xl p-5">
                <h3 class="font-bold">ใช้เงินไปกับอะไร</h3>
                <p class="text-xs text-slate-400 mt-1 mb-5">เรียงจากมากไปน้อย · สัดส่วนของรายจ่ายเดือนนี้</p>
                <p v-if="!sortedCategories.length" class="py-6 text-center text-sm text-slate-400">ยังไม่มีรายจ่ายในเดือนนี้</p>
                <div v-for="(cat, index) in (showAllSummaryCategories ? sortedCategories : sortedCategories.slice(0, 5))" :key="cat.name" class="mb-5 last:mb-0">
                  <div class="flex justify-between gap-3 text-sm items-start"><span class="min-w-0 break-words"><span class="text-slate-500 mr-2">{{ index + 1 }}</span>{{ cat.name }}</span><span class="font-semibold text-right shrink-0">{{ summaryMoney(cat.amount) }} ฿<span class="block text-xs font-normal text-slate-400 mt-1">{{ cat.percent }}%</span></span></div>
                  <div class="h-2 rounded-full bg-slate-800 mt-2 overflow-hidden"><div class="h-full rounded-full bg-brand-yellow" :style="{width: Math.min(100, Math.max(0, cat.percent)) + '%'}"></div></div>
                </div>
                <button v-if="sortedCategories.length > 5" @click="showAllSummaryCategories = !showAllSummaryCategories" class="w-full text-sm text-sky-400 py-2 mt-2 rounded-lg hover:bg-slate-800">{{ showAllSummaryCategories ? 'แสดง 5 อันดับแรก' : 'ดูทั้งหมด (' + sortedCategories.length + ' หมวด)' }}</button>
              </section>
            </div>
            <div v-if="sortedCategories.length" class="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-slate-300 leading-relaxed">
              💡 ใช้จ่ายกับ <strong class="text-white">{{ sortedCategories[0].name }}</strong> มากที่สุด รวม <strong class="text-white">{{ summaryMoney(sortedCategories[0].amount) }} ฿</strong> คิดเป็น {{ sortedCategories[0].percent }}% ของรายจ่ายเดือนนี้
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 🌟 หน้าต่างจดบันทึก (Form Modal) แบบ Slide-up 🌟 -->
    <Transition name="slide-up">
      <div v-if="isFormOpen" class="fixed inset-0 bg-brand-bg z-50 flex flex-col">
        <div class="bg-brand-yellow pt-safe shadow-md relative z-10">
          <div class="px-4 py-3 flex justify-between items-center">
            <button @click="isFormOpen = false" class="text-slate-800 font-bold active:scale-90 transition-transform">✕ ยกเลิก</button>
            <div class="font-bold text-slate-800">จดบันทึกใหม่</div>
            <div class="w-16"></div>
          </div>
          <!-- แท็บชนิดของฟอร์ม -->
          <div class="flex overflow-x-auto whitespace-nowrap hide-scrollbar px-2 pb-0">
            <button @click="formType = 'expense'" :class="formType==='expense' ? 'bg-brand-bg text-white' : 'text-slate-700 hover:text-slate-900'" class="px-3 py-3 rounded-t-2xl font-bold text-xs sm:text-sm transition-all duration-300 flex-1 text-center">รายจ่าย</button>
            <button @click="formType = 'income'" :class="formType==='income' ? 'bg-brand-bg text-white' : 'text-slate-700 hover:text-slate-900'" class="px-3 py-3 rounded-t-2xl font-bold text-xs sm:text-sm transition-all duration-300 flex-1 text-center">รายรับ</button>
            <button @click="formType = 'transfer'" :class="formType==='transfer' ? 'bg-brand-bg text-white' : 'text-slate-700 hover:text-slate-900'" class="px-3 py-3 rounded-t-2xl font-bold text-xs sm:text-sm transition-all duration-300 flex-1 text-center">ย้ายเงิน</button>
            <button @click="formType = 'bill'" :class="formType==='bill' ? 'bg-brand-bg text-white' : 'text-slate-700 hover:text-slate-900'" class="px-3 py-3 rounded-t-2xl font-bold text-xs sm:text-sm transition-all duration-300 flex-1 text-center">บิล</button>
            <button @click="formType = 'debtor'" :class="formType==='debtor' ? 'bg-brand-bg text-white' : 'text-slate-700 hover:text-slate-900'" class="px-3 py-3 rounded-t-2xl font-bold text-xs sm:text-sm transition-all duration-300 flex-1 text-center">คนยืม</button>
          </div>
        </div>

        <div class="p-5 flex-1 flex flex-col gap-4 overflow-y-auto bg-brand-bg">
          <div class="text-sky-400 font-medium text-sm text-center mb-2 bg-sky-500/10 py-1.5 rounded-full">{{ formDateDisplay }}</div>
          
          <div class="bg-brand-card p-6 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-700/50 transition-colors focus-within:border-brand-yellow/50 focus-within:bg-slate-800/80">
            <div class="text-4xl font-bold" :class="formIconColor">{{ formIcon }}</div>
            <input type="number" v-model="formAmount" placeholder="0" class="bg-transparent border-none outline-none text-white text-5xl w-full font-bold placeholder:text-slate-600 tracking-tight" autofocus>
            <div class="text-slate-500 text-3xl font-light">฿</div>
          </div>

          <template v-if="formType === 'transfer'">
            <div class="bg-brand-card p-4 rounded-2xl flex items-center gap-3 border border-slate-700/50">
              <select v-model="formSourceAcc" class="bg-transparent text-sky-400 w-full outline-none appearance-none font-medium text-base">
                <option value="" disabled selected>โอนจากบัญชี (ต้นทาง)</option>
                <option value="กสิกร">🟢 กสิกร</option><option value="กรุงไทย">🔵 กรุงไทย</option><option value="TrueMoney">🟠 TrueMoney</option><option value="ShopeeWallet">🛍️ ShopeeWallet</option><option value="เงินสด">💵 เงินสด</option>
              </select>
            </div>
            <div class="text-center text-slate-500 font-bold text-xl my-[-5px]">↓</div>
            <div class="bg-brand-card p-4 rounded-2xl flex items-center gap-3 border border-slate-700/50">
              <select v-model="formDestAcc" class="bg-transparent text-sky-400 w-full outline-none appearance-none font-medium text-base">
                <option value="" disabled selected>ย้ายเข้าบัญชี (ปลายทาง)</option>
                <option value="กสิกร">🟢 กสิกร</option><option value="กรุงไทย">🔵 กรุงไทย</option><option value="TrueMoney">🟠 TrueMoney</option><option value="ShopeeWallet">🛍️ ShopeeWallet</option><option value="เงินสด">💵 เงินสด</option>
              </select>
            </div>
          </template>
          
          <template v-else>
            <div v-if="formType === 'debtor'" class="bg-brand-card p-4 rounded-2xl flex items-center gap-3 border border-slate-700/50">
              <select v-model="formDebtorAction" class="bg-transparent text-violet-400 font-bold w-full outline-none appearance-none text-base">
                <option value="lend">📤 ให้เพื่อนยืมเงิน</option>
                <option value="repay">📥 เพื่อนคืนเงินให้แล้ว</option>
              </select>
            </div>
            <div v-if="formType === 'bill'" class="bg-brand-card p-4 rounded-2xl flex items-center gap-3 border border-slate-700/50">
              <select v-model="formBillStatus" class="bg-transparent text-yellow-400 font-bold w-full outline-none appearance-none text-base">
                <option value="ยังไม่จ่าย">⏳ ค้างชำระ (ยังไม่จ่าย)</option>
                <option value="จ่ายแล้ว">✅ จ่ายแล้ว</option>
              </select>
            </div>
            <div v-show="formType !== 'bill' || formBillStatus === 'จ่ายแล้ว'" class="bg-brand-card p-4 rounded-2xl flex items-center gap-3 border border-slate-700/50">
              <select v-model="formAccount" class="bg-transparent text-sky-400 w-full outline-none appearance-none font-medium text-base">
                <option value="" disabled selected>💳 เลือกบัญชีที่ใช้เงิน</option>
                <option value="กสิกร">🟢 กสิกร</option><option value="กรุงไทย">🔵 กรุงไทย</option><option value="TrueMoney">🟠 TrueMoney</option><option value="ShopeeWallet">🛍️ ShopeeWallet</option><option value="เงินสด">💵 เงินสด</option>
              </select>
            </div>
            <div v-if="formType === 'debtor'" class="bg-brand-card p-4 rounded-2xl flex items-center gap-3 border border-slate-700/50">
              <select v-if="formDebtorAction === 'repay'" v-model="formDebtorName" class="bg-transparent text-sky-400 w-full outline-none appearance-none font-medium text-base">
                <option value="" disabled selected>👤 เลือกคนที่คืนเงิน</option>
                <option v-for="d in debtorsForRepay" :key="d.name" :value="d.name">
                  {{ d.name }} (ยอดค้าง {{ d.amount.toLocaleString('th-TH') }} ฿)
                </option>
              </select>
              <input v-else type="text" v-model="formDebtorName" placeholder="พิมพ์ชื่อคนยืม (เช่น นัท)" class="bg-transparent w-full outline-none text-white font-medium text-base placeholder:text-slate-500">
            </div>
            <div v-else class="bg-brand-card p-4 rounded-2xl flex items-center gap-3 border border-slate-700/50">
              <select v-model="formCategory" class="bg-transparent text-sky-400 w-full outline-none appearance-none font-medium text-base">
                <option value="" disabled selected>🏷️ {{ formType === 'bill' ? 'เลือกบิล' : 'เลือกหมวดหมู่ / แท็ก' }}</option>
                <template v-if="formType === 'expense'">
                  <option value="อาหาร">🍔 อาหาร</option><option value="เดินทาง">🚗 เดินทาง</option><option value="BTS">🚆 BTS</option><option value="ช้อปปิ้ง">🛍️ ช้อปปิ้ง</option><option value="ทั่วไป">ทั่วไป</option>
                </template>
                <template v-if="formType === 'income'">
                  <option value="เงินเดือน">💰 เงินเดือน</option><option value="จากพ่อ">👨 จากพ่อ</option><option value="จากแม่">👩 จากแม่</option><option value="อื่นๆ">อื่นๆ</option>
                </template>
                <template v-if="formType === 'bill'">
                  <option value="ShopeePay">🧡 ShopeePay</option><option value="SEasyCash">💸 SEasyCash</option><option value="SPayExtra">💳 SPayExtra</option><option value="Internet">🌐 Internet</option><option value="ค่าทำฟัน">ฟังทำฟัน</option><option value="ประกันสังคม">🏥 ประกันสังคม</option><option value="บิลอื่นๆ">บิลอื่นๆ</option>
                </template>
              </select>
            </div>
          </template>
          
          <div class="bg-brand-card p-4 rounded-2xl flex items-center gap-3 border border-slate-700/50 focus-within:border-slate-500 transition-colors">
            <input type="text" v-model="formNote" placeholder="📝 เพิ่มโน้ต (ทางเลือก)" class="bg-transparent w-full outline-none text-white font-medium text-base placeholder:text-slate-500">
          </div>

          <button :disabled="pendingWrites > 0" @click="saveRecord" class="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-lg mt-auto active:scale-95 transition-all shadow-lg flex justify-center items-center gap-2">
            บันทึกข้อมูล
          </button>
        </div>
      </div>
    </Transition>

    <!-- 🌟 ปุ่มลอย (FAB) ซ่อนออโต้เมื่ออยู่หน้าคนยืมและบิล 🌟 -->
    <Transition name="fade">
      <div v-if="!isFormOpen && !isSummaryOpen && (currentTab === 'home' || currentTab === 'calendar')" class="fixed bottom-[85px] w-full max-w-[480px] flex justify-center z-30 pointer-events-none">
        <button @click="openForm('expense')" class="pointer-events-auto bg-brand-blue text-white px-7 py-3.5 rounded-full font-bold shadow-[0_8px_30px_rgba(0,102,255,0.4)] flex items-center gap-2 hover:bg-blue-500 active:scale-90 transition-all hover:-translate-y-1">
          <svg class="w-5 h-5 stroke-white fill-none stroke-[2.5]" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          จดเพิ่ม
        </button>
      </div>
    </Transition>

    <!-- 🌟 Bottom Nav แบบ Smooth -->
    <Transition name="fade">
      <nav v-if="!isFormOpen && !isSummaryOpen" class="bg-white text-slate-400 h-[65px] pb-safe flex fixed bottom-0 w-full max-w-[480px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-40 rounded-t-3xl">
        <div @click="currentTab = 'home'" :class="{'text-brand-blue': currentTab === 'home'}" class="flex-1 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-75 hover:bg-slate-50 rounded-tl-3xl relative">
          <div v-if="currentTab === 'home'" class="absolute top-0 w-8 h-1 bg-brand-blue rounded-b-full"></div>
          <svg class="w-6 h-6 mb-1 stroke-current fill-none stroke-[2.5] transition-transform" :class="{'scale-110': currentTab === 'home'}" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span class="text-[10px] font-bold transition-all" :class="{'scale-110': currentTab === 'home'}">หน้าแรก</span>
        </div>
        <div @click="currentTab = 'calendar'" :class="{'text-brand-blue': currentTab === 'calendar'}" class="flex-1 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-75 hover:bg-slate-50 relative">
          <div v-if="currentTab === 'calendar'" class="absolute top-0 w-8 h-1 bg-brand-blue rounded-b-full"></div>
          <svg class="w-6 h-6 mb-1 stroke-current fill-none stroke-[2.5] transition-transform" :class="{'scale-110': currentTab === 'calendar'}" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span class="text-[10px] font-bold transition-all" :class="{'scale-110': currentTab === 'calendar'}">ปฏิทิน</span>
        </div>
        <div @click="currentTab = 'debtors'" :class="{'text-brand-blue': currentTab === 'debtors'}" class="flex-1 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-75 hover:bg-slate-50 relative">
          <div v-if="currentTab === 'debtors'" class="absolute top-0 w-8 h-1 bg-brand-blue rounded-b-full"></div>
          <svg class="w-6 h-6 mb-1 stroke-current fill-none stroke-[2.5] transition-transform" :class="{'scale-110': currentTab === 'debtors'}" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
          <span class="text-[10px] font-bold transition-all" :class="{'scale-110': currentTab === 'debtors'}">คนยืม</span>
        </div>
        <div @click="currentTab = 'bills'" :class="{'text-brand-blue': currentTab === 'bills'}" class="flex-1 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-75 hover:bg-slate-50 rounded-tr-3xl relative">
          <div v-if="currentTab === 'bills'" class="absolute top-0 w-8 h-1 bg-brand-blue rounded-b-full"></div>
          <svg class="w-6 h-6 mb-1 stroke-current fill-none stroke-[2.5] transition-transform" :class="{'scale-110': currentTab === 'bills'}" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <span class="text-[10px] font-bold transition-all" :class="{'scale-110': currentTab === 'bills'}">บิล</span>
        </div>
      </nav>
    </Transition>
  </div>

  <!-- แสดงชื่อเจ้าของบัญชี LINE ที่กำลังใช้งาน -->
  <div v-if="lineDisplayName && !isAdminMode" :title="lineDisplayName" class="fixed top-3 right-3 z-40 max-w-[calc(100vw-1.5rem)] bg-gray-800/80 text-yellow-400 border border-yellow-500/30 px-3 py-1.5 rounded-xl text-xs font-medium shadow-lg backdrop-blur-md flex items-center gap-1.5">
    <span aria-hidden="true">👤</span>
    <span class="truncate">{{ lineDisplayName }}</span>
  </div>

  <!-- ปุ่มเปิดหน้าใส่ PIN สำหรับเข้าโหมด Admin บนเว็บ -->
  <button v-else @click="openAdminMode" class="fixed top-3 right-3 z-40 bg-gray-800/80 hover:bg-gray-700 text-yellow-400 border border-yellow-500/30 px-3 py-1.5 rounded-xl text-xs font-medium shadow-lg backdrop-blur-md transition flex items-center gap-1.5">
    <span>🔐</span> โหมดแอดมิน
  </button>

  <!-- 🔐 Modal ใส่ PIN แอดมิน 4 ตัว -->
  <div v-if="showPinModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl animate-fade-in">
      <div class="w-12 h-12 bg-yellow-500/10 text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
        🔐
      </div>
      <h3 class="text-white text-lg font-bold mb-1">ใส่รหัส PIN แอดมิน</h3>
      <p class="text-gray-400 text-xs mb-6">กรุณากรอกรหัส PIN 4 หลักเพื่อเข้าจัดการระบบ</p>

      <div class="flex justify-center gap-3 mb-6">
        <input 
          v-for="(digit, index) in enteredPin" 
          :key="index"
          type="password" 
          maxlength="1" 
          v-model="enteredPin[index]"
          @input="(e) => { if(e.target.value && index < 3) e.target.nextElementSibling?.focus() }"
          class="w-12 h-12 text-center text-xl font-bold bg-gray-800 text-white border border-gray-700 rounded-xl focus:border-yellow-500 focus:outline-none"
        />
      </div>

      <div class="flex gap-2">
        <button @click="showPinModal = false" class="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition">
          ยกเลิก
        </button>
        <button @click="verifyPin" class="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-gray-950 rounded-xl text-sm font-bold transition">
          ยืนยัน
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import liff from '@line/liff'
import { createUpdateMonitor } from './update-monitor.js'

// Configuration
const LIFF_ID = '2010880429-sx53ElMd'
const API_BASE_URL = 'https://my-line-bot-l9l5.onrender.com'
const correctPin = 'aaaa' // ⚠️ รหัส PIN สำหรับ Admin Mode สามารถเปลี่ยนได้ที่นี่

// State
const isAdminMode = ref(false)
const showPinModal = ref(false)
const enteredPin = ref(['', '', '', ''])
const currentTab = ref('home')
const isFormOpen = ref(false)
const isSummaryOpen = ref(false)
const isLoading = ref(true)
const userId = ref('admin')
const pendingWrites = ref(0)
const updateState = ref('')
const lineDisplayName = ref('')
const records = ref([])
const totalBalance = ref(0)
const totalExpense = ref(0)
const totalIncome = ref(0)
const accountBalances = ref({})
const debtorsData = ref({})
const simulatedIncome = ref(0)
const simulatedIncomeInput = ref('')
const selectedDayInfo = ref(null)
const isLocked = ref(false)
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

const openAdminMode = () => {
  enteredPin.value = ['', '', '', '']
  showPinModal.value = true
}

const verifyPin = () => {
  const pinStr = enteredPin.value.join('')
  if (pinStr === correctPin) {
    showPinModal.value = false
    isLocked.value = false
    isAdminMode.value = true

    userId.value = 'admin'
    fetchMonthData()
    showToast('🔓 เข้าสู่โหมดแอดมินสำเร็จ')
  } else {
    showToast('❌ รหัส PIN ไม่ถูกต้อง', true)
    enteredPin.value = ['', '', '', '']
  }
}

// Helpers
const showToast = (msg, error = false) => {
  toastMsg.value = msg; isError.value = error
  setTimeout(() => toastMsg.value = '', 2500)
}
const isExpense = (t) => t.includes('รายจ่าย') || t === 'ให้ยืมเงิน'
const isIncome = (t) => t === 'รายรับ' || t === 'ได้คืนจากลูกหนี้'

// Computed Properties
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

// หน้ารายวัน (กรองบิลค้างชำระออก)
const groupedRecords = computed(() => {
  const groups = {}
  
  records.value.forEach(item => {
    if (!item.date) return
    if (item.type === 'รายจ่ายต้องชำระต่อเดือน' && item.status === 'ยังไม่จ่าย') return
    
    const parts = item.date.split('/')
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    const year = parts[2]
    const standardDateKey = `${day}/${month}/${year}`

    if (!groups[standardDateKey]) {
      groups[standardDateKey] = {
        date: standardDateKey,
        day: day,
        expense: 0,
        income: 0,
        items: []
      }
    }

    groups[standardDateKey].items.push(item)

    const amt = parseFloat(item.amount) || 0
    if (item.type === 'รายจ่าย' || item.type === 'รายจ่ายต้องชำระต่อเดือน' || item.type === 'ให้ยืมเงิน') {
      groups[standardDateKey].expense += amt
    } else if (item.type === 'รายรับ' || item.type === 'ได้คืนจากลูกหนี้') {
      groups[standardDateKey].income += amt
    }
  })

  Object.values(groups).forEach(group => {
    group.items.sort((a, b) => (b.time || '').localeCompare(a.time || ''))
  })

  return Object.values(groups).sort((a, b) => b.day - a.day)
})

// Debtors
// รายการคนยืม: ไม่ลบชื่อออกแม้ยอดจะเหลือ 0
// เพื่อให้เห็นว่าใครคืนเงินแล้ว และเหลือเท่าไร
const debtorRepayments = computed(() => {
  const result = {}

  records.value.forEach(r => {
    if (r.type !== 'ได้คืนจากลูกหนี้' || !r.category) return

    const amount = parseFloat(r.amount) || 0
    result[r.category] = (result[r.category] || 0) + amount
  })

  return result
})

const totalDebtors = computed(() =>
  Object.values(debtorsData.value).reduce((a, b) => a + (parseFloat(b) || 0), 0)
)

const debtorsList = computed(() => {
  const names = new Set([
    ...Object.keys(debtorsData.value || {}),
    ...records.value
      .filter(r => r.type === 'ให้ยืมเงิน' || r.type === 'ได้คืนจากลูกหนี้')
      .map(r => r.category)
      .filter(Boolean)
  ])

  return [...names]
    .map(name => {
      const remaining = Math.max(0, parseFloat(debtorsData.value?.[name]) || 0)
      const repaid = debtorRepayments.value[name] || 0

      return {
        name,
        amount: remaining,
        repaid
      }
    })
    .sort((a, b) => {
      // คนที่ยังค้างให้ขึ้นก่อน คนที่คืนครบแล้วอยู่ด้านล่าง
      if ((a.amount > 0) !== (b.amount > 0)) return a.amount > 0 ? -1 : 1
      return a.name.localeCompare(b.name, 'th')
    })
})

// รายชื่อที่ยังมียอดค้าง สำหรับ dropdown ตอนเลือก "เพื่อนคืนเงินให้แล้ว"
const debtorsForRepay = computed(() =>
  debtorsList.value.filter(d => d.amount > 0)
)

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

// Calendar Calculations
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

  return { calendarData, displayGap, nextTargetTommorow, daysLeft: daysInMonth - upToDay, currentGapReal, isCurrentMonth }
})

// Grid ปฏิทิน
const calendarGrid = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const grid = []
  for (let i = 0; i < firstDay; i++) {
    grid.push({ empty: true })
  }

  const dataMap = {}
  calData.value.calendarData.forEach(d => { dataMap[d.day] = d })

  for (let i = 1; i <= daysInMonth; i++) {
    grid.push({
      empty: false,
      day: i,
      data: dataMap[i] || null,
      isToday: i === currentDate.getDate() && month === currentDate.getMonth() && year === currentDate.getFullYear()
    })
  }
  return grid
})

const openDayInfo = (dayObj) => {
  if (!dayObj.empty) selectedDayInfo.value = dayObj
}

watch(viewDate, () => {
  selectedDayInfo.value = null
})

watch(calendarGrid, (newGrid) => {
  if (!selectedDayInfo.value) {
    const todayNode = newGrid.find(d => d.isToday)
    if (todayNode) {
      selectedDayInfo.value = todayNode
    } else {
      const availableDays = newGrid.filter(d => !d.empty && d.data)
      if (availableDays.length > 0) {
        selectedDayInfo.value = availableDays[availableDays.length - 1]
      }
    }
  }
}, { immediate: true })

// Summary Calculations
const showAllSummaryCategories = ref(false)
const summaryMoney = (value) => Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const summaryAccountIcon = (account) => ({ 'กสิกร': '🟢', 'กรุงไทย': '🔵', TrueMoney: '🟠', ShopeeWallet: '🛍️', 'เงินสด': '💵' }[account] || '💳')
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
    return { name: c[0], amount: c[1], percent: (totalExpense.value > 0 ? Math.round((c[1]/totalExpense.value)*100) : 0), avg: c[1]/Math.max(1, div) }
  })
})

// Action Methods
const applySimulation = () => { simulatedIncome.value = simulatedIncomeInput.value || 0 }
const clearSimulation = () => { simulatedIncome.value = 0; simulatedIncomeInput.value = '' }

const changeMonth = (dir) => {
  const d = new Date(viewDate.value)
  d.setMonth(d.getMonth() + dir)
  viewDate.value = d
  fetchMonthData()
}

const fetchMonthData = async () => {
  const currentUserId = userId.value ? userId.value : 'admin'

  isLoading.value = true
  const m = String(viewDate.value.getMonth() + 1).padStart(2, '0')
  const y = String(viewDate.value.getFullYear()).slice(-2)
  
  try {
    const res = await fetch(`${API_BASE_URL}/api/data?month=${m}/${y}&user_id=${currentUserId}`)
    if (!res.ok) throw new Error()
    const data = await res.json()

    records.value = (data.records || []).map(row => ({
      id: row.id,
      date: row.date,
      time: row.time,
      type: row.type,
      amount: row.amount,
      category: row.category,
      account: row.account,
      note: row.note,
      status: row.status
    }))

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
  pendingWrites.value++
  showToast("🗑️ กำลังลบข้อมูล...")
  try {
    const res = await fetch(`${API_BASE_URL}/api/delete`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, user_id: userId.value }) 
    })
    const data = await res.json()
    if (data.status === 'success') { 
      showToast("✅ ลบรายการเรียบร้อย") 
      fetchMonthData() 
    } else {
      showToast('❌ ' + data.message, true)
    }
  } catch (e) { 
    showToast('❌ ขาดการเชื่อมต่อ', true) 
  } finally { pendingWrites.value-- }
}

const openForm = (type) => {
  if (pendingWrites.value > 0) return
  formType.value = type
  formAmount.value = ''; formNote.value = ''; formDebtorName.value = ''; formAccount.value = ''
  formCategory.value = ''; formSourceAcc.value = ''; formDestAcc.value = ''
  formBillStatus.value = 'ยังไม่จ่าย'
  isFormOpen.value = true
}

const payUnpaidBill = (b) => {
  openForm('bill')
  formAmount.value = b.amount
  formCategory.value = b.category
  formBillStatus.value = 'จ่ายแล้ว'
}

const saveRecord = async () => {
  if (pendingWrites.value > 0) return
  if (!formAmount.value) return alert("⚠️ กรุณาใส่จำนวนเงินด้วยครับ!")
  
  let payload = { 
    type: formType.value === 'bill' ? 'รายจ่ายต้องชำระต่อเดือน' : formType.value, 
    amount: formAmount.value, 
    note: formNote.value || '-',
    user_id: userId.value 
  }

  if (formType.value === 'transfer') {
    if(!formSourceAcc.value || !formDestAcc.value) return alert("⚠️ กรุณาเลือกบัญชีต้นทางและปลายทางให้ครบ!")
    if(formSourceAcc.value === formDestAcc.value) return alert("⚠️ บัญชีต้นทางและปลายทางต้องไม่เหมือนกัน!")
    payload.sourceAccount = formSourceAcc.value; payload.destinationAccount = formDestAcc.value
  } else if (formType.value === 'debtor') {
    if(!formDebtorName.value.trim()) {
      return alert(formDebtorAction.value === 'repay' ? "⚠️ กรุณาเลือกคนที่คืนเงินด้วยครับ!" : "⚠️ กรุณาพิมพ์ชื่อคนยืมด้วยครับ!")
    }
    if(!formAccount.value) return alert("⚠️ กรุณาเลือกบัญชีด้วยครับ!")
    payload.type = formDebtorAction.value === 'lend' ? 'ให้ยืมเงิน' : 'ได้คืนจากลูกหนี้'
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
  pendingWrites.value++
  try {
    const res = await fetch(`${API_BASE_URL}/api/add`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (data.status === 'success') { isFormOpen.value = false; showToast("✅ บันทึกสำเร็จ"); fetchMonthData() }
    else showToast('❌ ' + data.message, true)
  } catch (e) { showToast('❌ ขาดการเชื่อมต่อ', true) }
  finally { pendingWrites.value-- }
}

// Automatic updates: keep drafts and requests intact until the app is idle.
let updateMonitor
let updateInterval
const isEditingInput = () => ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
const checkForUpdate = () => { if (document.visibilityState === 'visible') void updateMonitor?.check() }
const reconsiderUpdate = () => updateMonitor?.reconsider()
watch([isFormOpen, showPinModal, pendingWrites, isLoading, simulatedIncomeInput, simulatedIncome], reconsiderUpdate, { flush: 'sync' })
onMounted(() => {
  if (!import.meta.env.PROD) return
  const origin = __UPDATE_ORIGIN__ || window.location.origin
  updateMonitor = createUpdateMonitor({
    currentVersion: __APP_VERSION__,
    versionUrl: new URL('/version.json', origin).href,
    canReload: () => document.visibilityState === 'visible' && !isFormOpen.value && !showPinModal.value && !isLoading.value && pendingWrites.value === 0 && !isEditingInput() && !simulatedIncomeInput.value && !simulatedIncome.value,
    onState: (state) => { updateState.value = state },
    fetchVersion: async (url) => {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 10000)
      try {
        const response = await fetch(url, { cache: 'no-store', signal: controller.signal })
        if (!response.ok) throw new Error('Version unavailable')
        return await response.json()
      } finally { window.clearTimeout(timeout) }
    },
    readAttempt: () => sessionStorage.getItem('app-update-attempt'),
    writeAttempt: (version) => sessionStorage.setItem('app-update-attempt', version),
    reload: () => {
      const destination = new URL(window.location.pathname + window.location.search + window.location.hash, origin)
      if (destination.href === window.location.href) window.location.reload()
      else window.location.replace(destination.href)
    },
  })
  updateInterval = window.setInterval(checkForUpdate, 60000)
  document.addEventListener('visibilitychange', handleUpdateVisibility)
  window.addEventListener('focus', checkForUpdate)
  window.addEventListener('online', checkForUpdate)
  document.addEventListener('focusin', reconsiderUpdate)
  checkForUpdate()
})
function handleUpdateVisibility() { reconsiderUpdate(); checkForUpdate() }
onUnmounted(() => {
  updateMonitor?.dispose()
  window.clearInterval(updateInterval)
  document.removeEventListener('visibilitychange', handleUpdateVisibility)
  window.removeEventListener('focus', checkForUpdate)
  window.removeEventListener('online', checkForUpdate)
  document.removeEventListener('focusin', reconsiderUpdate)
})

// Lifecycle Hooks
onMounted(async () => {
  try {
    await liff.init({ liffId: LIFF_ID })
    if (liff.isInClient()) {
      if (!liff.isLoggedIn()) {
        liff.login()
        return
      }
      const profile = await liff.getProfile()
      userId.value = profile.userId
      lineDisplayName.value = profile.displayName || 'บัญชี LINE'
      fetchMonthData()
    } else {
      isLocked.value = true
      showPinModal.value = true
      isLoading.value = false
    }
  } catch (error) {
    console.error('LIFF Init Error:', error)
    isLocked.value = true
    showPinModal.value = true
    isLoading.value = false
  }
})
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from { opacity: 0; transform: translateY(10px) scale(0.98); }
.fade-leave-to { opacity: 0; transform: translateY(-10px) scale(0.98); }

.slide-up-enter-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
}
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.5, 0, 0.9, 0.5), opacity 0.3s ease;
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(100%); opacity: 0.5;
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-enter-from, .toast-leave-to {
  opacity: 0; transform: translate(-50%, -20px) scale(0.8);
}

.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
