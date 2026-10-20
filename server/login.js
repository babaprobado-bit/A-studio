const form=document.getElementById('loginForm');
const password=document.getElementById('sitePassword');
const button=document.getElementById('loginButton');
const error=document.getElementById('loginError');
form.addEventListener('submit',async event=>{
  event.preventDefault();
  error.textContent='';
  button.disabled=true;
  button.textContent='Kontrol ediliyor…';
  try{
    const response=await fetch('/api/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({password:password.value})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'Giriş başarısız.');
    password.value='';
    window.location.replace('/');
  }catch(err){
    error.textContent=err.message||'Sunucuya ulaşılamadı.';
    button.disabled=false;
    button.textContent='Güvenli giriş ↗';
  }
});
