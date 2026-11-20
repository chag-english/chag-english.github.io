(()=>{
const $=id=>document.getElementById(id);
const form=$('teacherApplyForm');
const STORE='chag-teacher-applications',DRAFT='chag-teacher-apply-draft';
const TOTAL=4;
let step=1,reached=1,photoData='',docNames=[];
const tr=()=>window.CHAG_TRANSLATIONS[window.chagLang];
const fmtNum=n=>new Intl.NumberFormat(window.chagLang==='fa'?'fa-IR':'en-US').format(n);

/* ---------- helpers ---------- */
const group=el=>el.closest('.field-group');
function setError(g,key){
  const p=g.querySelector('.field-error');if(!p)return;
  g.classList.toggle('invalid',!!key);
  if(key){p.dataset.key=key;p.textContent=tr()[key]||key;p.hidden=false}else{delete p.dataset.key;p.textContent='';p.hidden=true}
  g.querySelectorAll('input,select,textarea').forEach(i=>key?i.setAttribute('aria-invalid','true'):i.removeAttribute('aria-invalid'));
}
function refreshErrors(){form.querySelectorAll('.field-error[data-key]').forEach(p=>p.textContent=tr()[p.dataset.key]||p.dataset.key)}
const isUrl=v=>{try{const u=new URL(v);return u.protocol==='https:'||u.protocol==='http:'}catch{return false}};
const isEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const isPhone=v=>/^\+?[0-9\s\-()]{8,18}$/.test(v)&&(v.match(/\d/g)||[]).length>=8;
function ageOf(v){const d=new Date(v);if(isNaN(d))return -1;const n=new Date();let a=n.getFullYear()-d.getFullYear();const m=n.getMonth()-d.getMonth();if(m<0||(m===0&&n.getDate()<d.getDate()))a--;return a}

function validateGroup(g){
  if(g.dataset.group){
    if(g.dataset.required==='1'&&!g.querySelector('input:checked'))return 'ap_err_group';
    return '';
  }
  if(g.dataset.check){const c=g.querySelector('input');return c.checked?'':'ap_err_check'}
  const f=g.dataset.field;
  if(f==='photo')return photoData?'':(g.dataset.fileErr||'ap_err_required');
  if(f==='docs'){if(g.dataset.fileErr)return g.dataset.fileErr;return docNames.length?'':'ap_err_required'}
  const el=g.querySelector('input,select,textarea');if(!el)return '';
  const v=el.value.trim();
  if(!v)return el.required?'ap_err_required':'';
  if(el.type==='email'&&!isEmail(v))return 'ap_err_email';
  if(f==='phone'&&!isPhone(v))return 'ap_err_phone';
  if(el.type==='url'&&!isUrl(v))return 'ap_err_url';
  if(f==='birthDate'){const a=ageOf(v);if(a<18||a>90)return 'ap_err_age'}
  if(f==='bio'&&v.length<80)return 'ap_err_bio';
  if(f==='rate'){const n=Number(v);if(!(n>=5&&n<=300))return 'ap_err_rate'}
  if(f==='gradYear'){const n=Number(v);if(!(n>=1970&&n<=2035))return 'ap_err_year'}
  return '';
}
function validateStep(n,focus=true){
  const fs=form.querySelector(`.apply-step[data-step="${n}"]`);let first=null,bad=0;
  fs.querySelectorAll('.field-group').forEach(g=>{const k=validateGroup(g);setError(g,k);if(k){bad++;if(!first)first=g}});
  if(bad){$('applyMessage').textContent=tr().ap_err_step;if(focus&&first){first.scrollIntoView({behavior:'smooth',block:'center'});const i=first.querySelector('input:not(.sr-input),select,textarea,.file-btn,.file-drop');if(i&&i.focus)setTimeout(()=>i.focus({preventScroll:true}),250)}}
  else $('applyMessage').textContent='';
  return !bad;
}

/* ---------- wizard ---------- */
function show(n,quiet){
  step=n;reached=Math.max(reached,n);
  form.querySelectorAll('.apply-step').forEach(s=>s.classList.toggle('active',+s.dataset.step===n));
  document.querySelectorAll('.step-btn').forEach(b=>{const k=+b.dataset.step;b.classList.toggle('active',k===n);b.classList.toggle('done',k<n);b.disabled=k>reached;b.setAttribute('aria-current',k===n?'step':'false')});
  $('progressBar').style.width=(n/TOTAL*100)+'%';
  $('prevStep').style.visibility=n===1?'hidden':'visible';
  $('nextStep').hidden=n===TOTAL;$('submitApply').hidden=n!==TOTAL;
  updateCount();$('applyMessage').textContent='';
  if(!quiet)document.querySelector('.apply-main').scrollIntoView({behavior:'smooth',block:'start'});
  saveDraft();
}
function updateCount(){const x=tr();$('stepCount').textContent=`${x.ap_stepWord} ${fmtNum(step)} ${x.ap_ofWord} ${fmtNum(TOTAL)}`}
$('nextStep').addEventListener('click',()=>{if(validateStep(step))show(step+1)});
$('prevStep').addEventListener('click',()=>show(step-1));
document.querySelectorAll('.step-btn').forEach(b=>b.addEventListener('click',()=>{const k=+b.dataset.step;if(k<step||k<=reached){if(k>step&&!validateStep(step))return;show(k)}}));

/* ---------- live validation ---------- */
form.addEventListener('input',e=>{const g=group(e.target);if(g&&g.classList.contains('invalid'))setError(g,validateGroup(g));if(e.target.id==='f_bio')$('bioCount').textContent=fmtNum(e.target.value.length);scheduleSave()});
form.addEventListener('change',e=>{const g=group(e.target);if(g&&g.classList.contains('invalid'))setError(g,validateGroup(g));scheduleSave()});
form.addEventListener('focusout',e=>{const g=group(e.target);if(g&&g.dataset.field&&!['photo','docs'].includes(g.dataset.field)&&e.target.value&&e.target.value.trim())setError(g,validateGroup(g))});

/* ---------- files ---------- */
const OK_IMG=['image/jpeg','image/png','image/webp'],OK_DOC=['application/pdf','image/jpeg','image/png'],MAX=5*1024*1024;
$('f_photo').addEventListener('change',e=>{
  const g=group(e.target),f=e.target.files[0];photoData='';delete g.dataset.fileErr;
  $('photoPreview').style.backgroundImage='';$('photoPreview').classList.remove('has-img');
  if(!f){setError(g,'ap_err_required');return}
  if(!OK_IMG.includes(f.type)||f.size>MAX){g.dataset.fileErr='ap_err_file';setError(g,'ap_err_file');e.target.value='';return}
  const r=new FileReader();
  r.onload=()=>{const img=new Image();img.onload=()=>{const S=240,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');const m=Math.min(img.width,img.height),sx=(img.width-m)/2,sy=(img.height-m)/2;x.drawImage(img,sx,sy,m,m,0,0,S,S);photoData=c.toDataURL('image/jpeg',.82);$('photoPreview').style.backgroundImage=`url(${photoData})`;$('photoPreview').classList.add('has-img');setError(g,'')};img.onerror=()=>{g.dataset.fileErr='ap_err_file';setError(g,'ap_err_file')};img.src=r.result};
  r.readAsDataURL(f);
});
$('f_docs').addEventListener('change',e=>{
  const g=group(e.target),files=[...e.target.files];delete g.dataset.fileErr;docNames=[];
  const list=$('docList');list.innerHTML='';
  if(!files.length){setError(g,'ap_err_required');return}
  if(files.length>5){g.dataset.fileErr='ap_err_files';setError(g,'ap_err_files');e.target.value='';return}
  if(files.some(f=>!OK_DOC.includes(f.type)||f.size>MAX)){g.dataset.fileErr='ap_err_file';setError(g,'ap_err_file');e.target.value='';return}
  docNames=files.map(f=>f.name);
  docNames.forEach(n=>{const li=document.createElement('li');li.textContent=n;list.append(li)});
  setError(g,'');
});

/* ---------- draft ---------- */
let saveT;function scheduleSave(){clearTimeout(saveT);saveT=setTimeout(saveDraft,350)}
function collect(){
  const d={};
  form.querySelectorAll('input:not([type=file]):not([type=checkbox]):not([type=radio]),select,textarea').forEach(el=>{d[el.name]=el.value});
  const g={};
  form.querySelectorAll('input[type=checkbox],input[type=radio]').forEach(el=>{if(el.checked)(g[el.name]=g[el.name]||[]).push(el.value)});
  return {fields:d,groups:g};
}
function saveDraft(){try{const c=collect();c.step=step;c.reached=reached;localStorage.setItem(DRAFT,JSON.stringify(c))}catch{}}
function loadDraft(){
  let c=null;try{c=JSON.parse(localStorage.getItem(DRAFT)||'null')}catch{}
  if(!c)return;
  Object.entries(c.fields||{}).forEach(([k,v])=>{const el=form.elements[k];if(el&&el.type!=='file'&&v)el.value=v});
  Object.entries(c.groups||{}).forEach(([k,arr])=>{form.querySelectorAll(`input[name="${k}"]`).forEach(i=>{i.checked=arr.includes(i.value)})});
  reached=Math.min(Math.max(c.reached||1,1),TOTAL);step=Math.min(Math.max(c.step||1,1),reached);
  $('bioCount').textContent=fmtNum(($('f_bio').value||'').length);
}

/* ---------- submit ---------- */
function getList(){let l=[];try{l=JSON.parse(localStorage.getItem(STORE)||'[]');if(!Array.isArray(l))l=[]}catch{}return l}
form.addEventListener('submit',e=>{
  e.preventDefault();
  for(let n=1;n<=TOTAL;n++){if(!validateStep(n,false)){show(n);validateStep(n,true);return}}
  const c=collect(),f=c.fields,g=c.groups;
  const list=getList();
  if(list.some(a=>a.email&&a.email.toLowerCase()===f.email.trim().toLowerCase()&&a.status==='pending')){const gr=form.querySelector('[data-field="email"]');show(1);setError(gr,'ap_err_dup');gr.scrollIntoView({behavior:'smooth',block:'center'});return}
  const code='CHAG-T-'+Date.now().toString(36).toUpperCase().slice(-6);
  const rec={id:code,status:'pending',createdAt:new Date().toISOString(),lang:window.chagLang,
    firstName:f.firstName.trim(),lastName:f.lastName.trim(),email:f.email.trim(),phone:f.phone.trim(),birthDate:f.birthDate,
    country:f.country.trim(),city:f.city.trim(),nativeLang:f.nativeLang.trim(),timezone:f.timezone.trim(),
    degree:f.degree,field:f.field.trim(),university:f.university.trim(),gradYear:f.gradYear||'',engLevel:f.engLevel,examType:f.examType||'',examScore:f.examScore.trim(),
    certs:g.certs||[],docs:docNames,resumeUrl:f.resumeUrl.trim(),
    experience:f.experience,prevWork:f.prevWork.trim(),specialties:g.specialties||[],levels:g.levels||[],ages:g.ages||[],instrLang:(g.instrLang||[])[0]||'',
    bio:f.bio.trim(),videoUrl:f.videoUrl.trim(),
    days:g.days||[],times:g.times||[],weeklyHours:f.weeklyHours,rate:Number(f.rate),platforms:g.platforms||[],referral:f.referral||'',message:f.message.trim(),
    photo:photoData,agreements:{equipment:true,accurate:true,verification:true,terms:true}};
  list.push(rec);
  try{localStorage.setItem(STORE,JSON.stringify(list))}
  catch{ // retry without the photo thumbnail
    try{list[list.length-1].photo='';localStorage.setItem(STORE,JSON.stringify(list))}
    catch{$('applyMessage').textContent=tr().ap_err_storage;return}
  }
  try{localStorage.removeItem(DRAFT)}catch{}
  $('doneCode').textContent=code;
  $('applyFormView').hidden=true;$('applyDone').hidden=false;
  document.querySelector('.apply-main').scrollIntoView({behavior:'smooth',block:'start'});
});
$('copyCode').addEventListener('click',async()=>{
  const code=$('doneCode').textContent,b=$('copyCode').querySelector('span');
  try{await navigator.clipboard.writeText(code)}catch{const r=document.createRange();r.selectNodeContents($('doneCode'));const s=getSelection();s.removeAllRanges();s.addRange(r)}
  b.textContent=tr().ap_copied;setTimeout(()=>b.textContent=tr().ap_copy,1600);
});

/* ---------- init ---------- */
try{const tz=Intl.DateTimeFormat().resolvedOptions().timeZone;if(tz&&!$('f_timezone').value)$('f_timezone').value=tz}catch{}
loadDraft();
const tzv=$('f_timezone');if(!tzv.value){try{tzv.value=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch{}}
$('f_birthDate').max=new Date(Date.now()-18*365.25*864e5).toISOString().slice(0,10);
$('f_birthDate').min='1930-01-01';
show(step,true);
window.addEventListener('chag:language',()=>{updateCount();refreshErrors()});
})();
