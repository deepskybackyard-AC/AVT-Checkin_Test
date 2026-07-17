"use strict";
window.AVT_STORE = (function(){
  const C = window.AVT_CONFIG;
  function blank() {
    return { checkins:{}, manual:[], donations:[], sequence:1 };
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(C.storageKeys.data)) || blank(); }
    catch { return blank(); }
  }
  function save(data){ localStorage.setItem(C.storageKeys.data, JSON.stringify(data)); }
  function reset(){ const d=blank(); save(d); return d; }
  function setLogin(mode){
    const payload = {valid:true, mode, createdAt:Date.now()};
    const raw=JSON.stringify(payload);
    sessionStorage.removeItem(C.storageKeys.login);
    localStorage.removeItem(C.storageKeys.login);
    if(mode==="session") sessionStorage.setItem(C.storageKeys.login,raw);
    else localStorage.setItem(C.storageKeys.login,raw);
  }
  function getLogin(){
    let x=null;
    try { x=JSON.parse(sessionStorage.getItem(C.storageKeys.login)||localStorage.getItem(C.storageKeys.login)); } catch {}
    if(!x?.valid) return null;
    if(x.mode==="day"){
      const d=new Date(x.createdAt), n=new Date();
      if(d.toDateString()!==n.toDateString()) { clearLogin(); return null; }
    }
    return x;
  }
  function clearLogin(){ sessionStorage.removeItem(C.storageKeys.login); localStorage.removeItem(C.storageKeys.login); }
  return {load,save,reset,setLogin,getLogin,clearLogin};
})();
