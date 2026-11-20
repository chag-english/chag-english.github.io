(()=>{const $=id=>document.getElementById(id);
$('backToStudent').addEventListener('click',()=>location.href='index.html');
$('teacherPasswordToggle').addEventListener('click',()=>{const p=$('teacherPassword'),show=p.type==='password';p.type=show?'text':'password';$('teacherPasswordToggle').classList.toggle('on',show)});
$('teacherForm').addEventListener('submit',e=>{e.preventDefault();const x=window.CHAG_TRANSLATIONS[window.chagLang];
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('teacherEmail').value.trim())){$('teacherMessage').textContent=x.errEmail;return}
  if(!$('teacherPassword').value){$('teacherMessage').textContent=x.errPassword;return}
  location.href='teacher.html'});
window.addEventListener('chag:language',()=>window.chagApplySettings());})();
