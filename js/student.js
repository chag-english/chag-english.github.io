(()=>{
const $=id=>document.getElementById(id);
const t=window.CHAG_TRANSLATIONS,L=()=>t[window.chagLang],fa=()=>window.chagLang==='fa';
const tutors={
 am:{ini:'AM',name:'Alex Morgan',rate:'4.9',spec:'tutorOne'},
 sk:{ini:'SK',name:'Sara Kim',rate:'4.8',spec:'tutorTwo'},
 jm:{ini:'JM',name:'James Miller',rate:'5.0',spec:'tutorThree'},
 ol:{ini:'OL',name:'Olivia Lee',rate:'4.9',spec:'tutorFour'},
 dw:{ini:'DW',name:'Daniel Wright',rate:'4.8',spec:'tutorFive'},
 np:{ini:'NP',name:'Nina Patel',rate:'5.0',spec:'tutorSix'}};
let tutorId=localStorage.getItem('chag-selected-tutor');if(!tutors[tutorId])tutorId='am';
let date=new Date();date.setDate(1);
let chosenDay=null,chosenTime=null,entries=window.chagLoadEntries();
const studentName=()=>localStorage.getItem('chag-student-name')||'Student';
const num=n=>fa()?new Intl.NumberFormat('fa-IR').format(n):String(n);
const pageTitleKey=p=>p==='home'?'homeTitle':p==='booking'?'bookingTitle':'sessionsTitle';
const isFree=e=>!e.student&&new Date(`${e.date}T${e.time}:00`)>new Date();
const reload=()=>{entries=window.chagLoadEntries()};

/* ---------- page language / title ---------- */
function tr(){
  window.chagApplySettings();const x=L();
  document.querySelectorAll('[data-profile]').forEach(el=>{const map={eyebrow:'profileEyebrow',title:'profileTitle',subtitle:'profileSubtitle',name:'profileName',email:'profileEmail',level:'profileLevel',save:'profileSave'};const k=map[el.dataset.profile];if(x[k])el.textContent=x[k]});
  const visible=document.querySelector('.app-page:not([hidden])');
  if(visible)$('appPageTitle').textContent=x[pageTitleKey(visible.id.replace('Page',''))];
  $('tzNote').textContent=x.tzNote+(Intl.DateTimeFormat().resolvedOptions().timeZone||'');
  renderTutor();renderCalendar();renderSessions();
}
function go(page){
  reload();
  ['home','booking','sessions'].forEach(n=>$(n+'Page').hidden=n!==page);
  document.querySelectorAll('.side-link[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  $('appPageTitle').textContent=L()[pageTitleKey(page)];
  if(page==='booking')renderCalendar();
  if(page==='sessions')renderSessions();
  window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('.side-link[data-page]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
$('toastGo').addEventListener('click',()=>go('sessions'));
$('appLogout').addEventListener('click',()=>location.href='index.html');

/* ---------- tutors ---------- */
function renderTutor(){
  const tu=tutors[tutorId];
  $('bookingAvatar').textContent=tu.ini;$('bookingTutorName').textContent=tu.name;
  $('bookingTutorSpec').textContent=L()[tu.spec]||'';$('bookingRating').textContent=`${num(tu.rate)} / ${num('5.0')}`;
}
function pickTutor(id){
  if(!tutors[id])return;tutorId=id;localStorage.setItem('chag-selected-tutor',id);
  chosenDay=null;chosenTime=null;hideToast();go('booking');renderTutor();
}
document.querySelectorAll('.tutor-card').forEach(c=>c.addEventListener('click',()=>pickTutor(c.dataset.tutor)));
document.querySelectorAll('.chip-filter').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.chip-filter').forEach(x=>x.classList.toggle('active',x===b));
  const f=b.dataset.filter;let shown=0;
  document.querySelectorAll('.tutor-card').forEach(c=>{const ok=f==='all'||c.dataset.tags.split(' ').includes(f);c.hidden=!ok;if(ok)shown++});
  $('emptyFilter').hidden=shown>0;
}));

/* ---------- profile ---------- */
const profileOverlay=$('profileOverlay');
function openProfile(){const name=localStorage.getItem('chag-student-name')||'Student';$('profileName').value=name;$('profileEmail').value=localStorage.getItem('chag-student-email')||'';$('profileLevel').value=localStorage.getItem('chag-student-level')||'B1';$('profileLargeAvatar').textContent=(name.trim()[0]||'S').toUpperCase();profileOverlay.hidden=false;requestAnimationFrame(()=>profileOverlay.classList.add('is-open'));setTimeout(()=>$('profileName').focus(),60)}
function closeProfile(){profileOverlay.classList.remove('is-open');setTimeout(()=>profileOverlay.hidden=true,220)}
$('openProfile').addEventListener('click',openProfile);$('topProfileButton').addEventListener('click',openProfile);$('closeProfile').addEventListener('click',closeProfile);$('closeProfileScrim').addEventListener('click',closeProfile);
$('profileForm').addEventListener('submit',e=>{e.preventDefault();const name=$('profileName').value.trim();if(!name)return;
  localStorage.setItem('chag-student-name',name);localStorage.setItem('chag-student-email',$('profileEmail').value.trim());localStorage.setItem('chag-student-level',$('profileLevel').value);const roster=(()=>{try{return JSON.parse(localStorage.getItem('chag-students')||'[]')}catch{return[]}})();const record={id:localStorage.getItem('chag-student-email')||name,name,email:$('profileEmail').value.trim(),level:$('profileLevel').value};const at=roster.findIndex(x=>x.id===record.id);if(at>=0)roster[at]=record;else roster.push(record);localStorage.setItem('chag-students',JSON.stringify(roster));
  $('topProfileName').textContent=name;$('topProfileAvatar').textContent=(name[0]||'S').toUpperCase();$('profileLargeAvatar').textContent=(name[0]||'S').toUpperCase();
  const b=$('profileForm').querySelector('button[type=submit]');b.textContent=L().profileSaved;setTimeout(()=>{b.textContent=L().profileSave},1800)});
$('topProfileName').textContent=localStorage.getItem('chag-student-name')||L().student;
$('topProfileAvatar').textContent=(localStorage.getItem('chag-student-name')||'S')[0].toUpperCase();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!profileOverlay.hidden)closeProfile()});

/* ---------- calendar ---------- */
function renderCalendar(){
  const grid=$('calendarGrid'),y=date.getFullYear(),m=date.getMonth();
  const months=fa()?['ژانویه','فوریه','مارس','آوریل','مه','ژوئن','ژوئیه','اوت','سپتامبر','اکتبر','نوامبر','دسامبر']:['January','February','March','April','May','June','July','August','September','October','November','December'];
  $('monthLabel').textContent=months[m]+' '+num(y).replace(/٬/g,'');
  const now=new Date();$('prevMonth').disabled=y*12+m<=now.getFullYear()*12+now.getMonth();
  grid.innerHTML='';
  (fa()?['د','س','چ','پ','ج','ش','ی']:['MON','TUE','WED','THU','FRI','SAT','SUN']).forEach(d=>{const el=document.createElement('div');el.className='calendar-cell weekday';el.textContent=d;grid.append(el)});
  const first=(new Date(y,m,1).getDay()+6)%7,count=new Date(y,m+1,0).getDate(),todayKey=window.chagDateKey(now);
  for(let i=0;i<first;i++)grid.append(document.createElement('div'));
  for(let d=1;d<=count;d++){
    const el=document.createElement('button');el.type='button';el.className='calendar-cell';el.textContent=num(d);
    const key=window.chagDateKey(new Date(y,m,d)),free=entries.some(e=>e.date===key&&isFree(e));
    if(free)el.classList.add('available');if(key===todayKey)el.classList.add('today');el.disabled=!free;
    if(chosenDay===d)el.classList.add('selected');
    el.addEventListener('click',()=>{chosenDay=d;chosenTime=null;hideToast();renderCalendar()});grid.append(el);
  }
  if(chosenDay===null){$('selectedDateLabel').textContent=L().selectTime;$('timeSlots').innerHTML='';$('selectedTimeLabel').textContent='—';$('confirmBooking').disabled=true}
  else renderSlots();
}
function renderSlots(){
  const d=new Date(date.getFullYear(),date.getMonth(),chosenDay),key=window.chagDateKey(d),locale=fa()?'fa-IR':'en-US';
  $('selectedDateLabel').textContent=new Intl.DateTimeFormat(locale,{weekday:'long',month:'short',day:'numeric'}).format(d);
  const wrap=$('timeSlots');wrap.innerHTML='';
  const free=entries.filter(e=>e.date===key&&isFree(e)).map(e=>e.time).sort();
  free.forEach(time=>{const b=document.createElement('button');b.type='button';b.className='time-slot'+(chosenTime===time?' selected':'');b.textContent=fa()?new Intl.NumberFormat('fa-IR',{useGrouping:false,minimumIntegerDigits:2}).format(+time.slice(0,2))+':'+new Intl.NumberFormat('fa-IR',{useGrouping:false,minimumIntegerDigits:2}).format(+time.slice(3)):time;b.onclick=()=>{chosenTime=time;renderSlots()};wrap.append(b)});
  $('selectedTimeLabel').textContent=chosenTime||'—';$('confirmBooking').disabled=!chosenTime||!free.includes(chosenTime);
}
$('prevMonth').onclick=()=>{date=new Date(date.getFullYear(),date.getMonth()-1,1);chosenDay=null;chosenTime=null;renderCalendar()};
$('nextMonth').onclick=()=>{date=new Date(date.getFullYear(),date.getMonth()+1,1);chosenDay=null;chosenTime=null;renderCalendar()};
function hideToast(){$('bookingToast').hidden=true}
$('confirmBooking').onclick=()=>{
  if(!chosenDay||!chosenTime)return;reload();
  const key=window.chagDateKey(new Date(date.getFullYear(),date.getMonth(),chosenDay)),slot=entries.find(e=>e.date===key&&e.time===chosenTime&&isFree(e));
  if(!slot){chosenTime=null;renderCalendar();return}
  Object.assign(slot,{student:studentName(),notes:'',status:'pending',bookedBy:'student',tutor:tutors[tutorId].name,requestedAt:Date.now()});
  window.chagSaveEntries(entries);chosenDay=null;chosenTime=null;
  $('bookingToastText').textContent=L().bookedToast;$('bookingToast').hidden=false;
  renderCalendar();renderSessions();
};

/* ---------- my sessions ---------- */
function mySessions(){const n=studentName();return entries.filter(e=>e.bookedBy==='student'&&e.student===n).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))}
function renderSessions(){
  const list=$('sessionsList'),mine=mySessions();list.innerHTML='';
  $('emptySessionsBox').hidden=mine.length>0;list.hidden=mine.length===0;
  const locale=fa()?'fa-IR':'en-US',now=new Date();
  mine.forEach(e=>{
    const when=new Date(`${e.date}T${e.time}:00`),past=when<now,status=e.status==='confirmed'?'confirmed':'pending';
    const card=document.createElement('article');card.className='session-card'+(past?' past':'');
    const dt=document.createElement('div');dt.className='session-date';
    const b=document.createElement('b');b.textContent=new Intl.DateTimeFormat(locale,{day:'numeric'}).format(when);
    const s=document.createElement('span');s.textContent=new Intl.DateTimeFormat(locale,{month:'short'}).format(when);dt.append(b,s);
    const info=document.createElement('div');info.className='session-info';
    const h=document.createElement('h4');h.textContent=new Intl.DateTimeFormat(locale,{weekday:'long'}).format(when)+' · '+(fa()?new Intl.NumberFormat('fa-IR').format(+e.time.slice(0,2))+':'+new Intl.NumberFormat('fa-IR',{minimumIntegerDigits:2}).format(+e.time.slice(3)):e.time);
    const p=document.createElement('p');p.textContent=`${L().withTutor} ${e.tutor||tutors.am.name} · ${L().duration}`;info.append(h,p);
    const badge=document.createElement('span');badge.className='status-badge '+status;badge.innerHTML=window.chagIcon(status==='confirmed'?'check':'hourglass')+'<span></span>';badge.lastChild.textContent=status==='confirmed'?L().statusConfirmed:L().statusPending;
    card.append(dt,info,badge);
    if(!past){const c=document.createElement('button');c.type='button';c.className='cancel-btn';c.innerHTML=window.chagIcon('x')+'<span></span>';c.lastChild.textContent=L().cancelSession;
      c.onclick=()=>{if(!confirm(L().cancelConfirm))return;reload();const slot=entries.find(x=>x.id===e.id);if(slot){slot.student='';slot.notes='';delete slot.status;delete slot.bookedBy;delete slot.tutor;delete slot.requestedAt;window.chagSaveEntries(entries)}renderSessions();renderCalendar()};card.append(c)}
    list.append(card);
  });
}
window.addEventListener('storage',e=>{if(e.key==='chag-teacher-timetable-v1'){reload();renderCalendar();renderSessions()}});
window.addEventListener('chag:language',tr);tr();
})();
