(()=>{const $=id=>document.getElementById(id);const t=window.CHAG_TRANSLATIONS;let mode='login';const authLayout=$('authLayout');
const isEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
function apply(){window.chagApplySettings();const x=t[window.chagLang];$('formTitle').textContent=mode==='login'?x.loginTitle:x.signupTitle;$('formSubtitle').textContent=mode==='login'?x.loginSubtitle:x.signupSubtitle;$('submitText').textContent=mode==='login'?x.loginAction:x.signupAction;$('passwordToggle').setAttribute('aria-label',x.pwShow)}
function msg(k){$('formMessage').textContent=t[window.chagLang][k]||k}
function setMode(next){mode=next;authLayout.classList.toggle('signup',mode==='signup');$('loginTab').classList.toggle('active',mode==='login');$('signupTab').classList.toggle('active',mode==='signup');$('loginTab').setAttribute('aria-selected',String(mode==='login'));$('signupTab').setAttribute('aria-selected',String(mode==='signup'));apply();$('formMessage').textContent='';$('password').autocomplete=mode==='login'?'current-password':'new-password'}
$('loginTab').addEventListener('click',()=>setMode('login'));$('signupTab').addEventListener('click',()=>setMode('signup'));
$('passwordToggle').addEventListener('click',()=>{const p=$('password'),show=p.type==='password';p.type=show?'text':'password';$('passwordToggle').classList.toggle('on',show);$('passwordToggle').setAttribute('aria-label',t[window.chagLang][show?'pwHide':'pwShow'])});
$('teacherButton').addEventListener('click',()=>location.href='teacher-login.html');
$('authForm').addEventListener('submit',e=>{e.preventDefault();
  const email=$('email').value.trim(),pw=$('password').value,name=$('fullName').value.trim();
  if(mode==='signup'&&!name){msg('fillName');$('fullName').focus();return}
  if(!isEmail(email)){msg('errEmail');$('email').focus();return}
  if(!pw){msg('errPassword');$('password').focus();return}
  if(mode==='signup'&&pw.length<8){msg('errPasswordShort');$('password').focus();return}
  if(mode==='signup'&&pw!==$('confirmPassword').value){msg('passwordMismatch');$('confirmPassword').focus();return}
  localStorage.setItem('chag-student-name',name||localStorage.getItem('chag-student-name')||email.split('@')[0]);
  localStorage.setItem('chag-student-email',email);
  location.href='student.html'});
$('googleButton').addEventListener('click',()=>$('formMessage').textContent=t[window.chagLang].googleSetup);
$('forgotLink').addEventListener('click',e=>{e.preventDefault();$('formMessage').textContent=t[window.chagLang].forgotSetup});
window.addEventListener('chag:language',apply);apply();})();
