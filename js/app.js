"use strict";
(function(){
const C=window.AVT_CONFIG,U=window.AVT_UTIL,S=window.AVT_STORE,SC=window.AVT_SCANNER;
const $=id=>document.getElementById(id);
const panels=["homePanel","scanPanel","searchPanel","manualPanel","resultPanel","overviewPanel"];
const cats={
 adult:{label:"Erwachsene",price:C.prices.adult},
 child:{label:"Kinder unter 6",price:C.prices.child},
 youth:{label:"Jugendliche / Schüler:innen",price:C.prices.youth},
 student:{label:"Studierende",price:C.prices.student}
};
let data=S.load(), current=null, counts=null, priceMode="auto", manualPrice=null, modalResolve=null;

function init(){
 $("eventTitle").textContent=C.event.title;
 $("eventTime").textContent=`${U.date(C.event.date)} · ${C.event.time} Uhr`;
 document.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",()=>nav(b.dataset.nav)));
 $("loginForm").addEventListener("submit",login);
 $("refreshBtn").addEventListener("click",()=>{data=S.load();renderAll();toast("Statistik aktualisiert.");});
 $("logoutBtn").addEventListener("click",()=>{S.clearLogin();showLogin();});
 $("resetBtn").addEventListener("click",reset);
 $("donationBtn").addEventListener("click",donation);
 $("searchInput").addEventListener("input",renderSearch);
 $("cameraPlaceholder").addEventListener("click",startCamera);
 $("startCameraButton").addEventListener("click",startCamera);
 $("stopCameraButton").addEventListener("click",()=>SC.stop());
 $("imageInput").addEventListener("change",async e=>{try{const r=await SC.decodeFile(e.target.files?.[0]);handlePayload(r.data);}catch(err){toast(err.message||"QR-Code nicht erkannt.");}});
 $("modalCancel").addEventListener("click",()=>closeModal(false));
 $("modalConfirm").addEventListener("click",()=>closeModal(true));
 if(S.getLogin()) showMain(); else showLogin();
}
function login(e){
 e.preventDefault();
 if($("password").value!==C.password){$("loginError").textContent="Passwort ist falsch.";return;}
 S.setLogin(new FormData(e.currentTarget).get("mode")||"day");$("password").value="";showMain();
}
function showLogin(){$("loginView").classList.remove("hidden");$("mainView").classList.add("hidden");$("refreshBtn").classList.add("hidden");}
function showMain(){$("loginView").classList.add("hidden");$("mainView").classList.remove("hidden");$("refreshBtn").classList.remove("hidden");nav("home");}
function nav(name){
 SC.stop(); panels.forEach(p=>$(p).classList.add("hidden")); const p=$(name+"Panel")||$("homePanel");p.classList.remove("hidden");
 if(name==="home") renderHome(); if(name==="overview") renderOverview(); if(name==="search"){ $("searchInput").value="";renderSearch();setTimeout(()=>$("searchInput").focus(),30);}
 if(name==="manual") renderManual(); if(name==="scan"){resetCamera();startCamera();}
 scrollTo({top:0,behavior:"smooth"});
}
function bookedConfirmed(){
 return window.AVT_REGISTRATIONS.filter(r=>r.status==="confirmed"&&r.eventId===C.event.id).reduce((s,r)=>s+U.sumCounts(r.booked),0);
}
function stats(){
 let regular=0,wait=0,exceptions=0,manual=0,entry=0;
 Object.values(data.checkins).forEach(x=>{
  const n=U.sumCounts(x.counts); entry+=Number(x.paid)||0;
  if(x.kind==="regular")regular+=n; else if(x.kind==="waitlist")wait+=n; else exceptions+=n;
 });
 data.manual.forEach(x=>{manual+=U.sumCounts(x.counts);entry+=Number(x.paid)||0;});
 const donations=data.donations.reduce((s,x)=>s+Number(x.amount||0),0);
 const present=regular+wait+exceptions+manual;
 const confirmed=bookedConfirmed();
 const initially=Math.max(0,C.event.maxPersons-confirmed);
 let expected=0;
 window.AVT_REGISTRATIONS.filter(r=>r.status==="confirmed"&&r.eventId===C.event.id).forEach(r=>{
   const x=data.checkins[r.token]; if(!x) expected+=U.sumCounts(r.booked);
 });
 const safe=Math.max(0,C.event.maxPersons-present-expected);
 return {regular,wait,exceptions,manual,present,confirmed,initially,expected,safe,entry,donations,total:entry+donations};
}
function renderAll(){renderHome();renderOverview();$("presentTop").textContent=stats().present;}
function renderHome(){
 const s=stats();$("presentTop").textContent=s.present;
 $("summary").innerHTML=[
  card("Anwesend",s.present,`von ${C.event.maxPersons}`),
  card("Sicher frei",s.safe,`${s.expected} regulär erwartet`),
  card("Eintritt",U.euro(s.entry),"erfasst"),
  card("Spenden",U.euro(s.donations),"separat")
 ].join("");
 $("scenarios").innerHTML=window.AVT_REGISTRATIONS.map(r=>`<button data-token="${r.token}"><strong>${r.number}</strong> · ${U.esc(r.scenario)}</button>`).join("");
 $("scenarios").querySelectorAll("[data-token]").forEach(b=>b.onclick=()=>processToken(b.dataset.token));
}
function card(a,b,c){return `<div class="summary-card"><small>${U.esc(a)}</small><strong>${U.esc(b)}</strong><small>${U.esc(c)}</small></div>`}
function resetCamera(){
 $("cameraVideo").classList.add("hidden");$("cameraPlaceholder").classList.remove("hidden");$("startCameraButton").classList.remove("hidden");$("stopCameraButton").classList.add("hidden");$("scanLine").classList.add("hidden");$("cameraStatus").textContent="Kamera wird automatisch gestartet …";
}
async function startCamera(){
 try{
  await SC.start(x=>handlePayload(x));$("cameraVideo").classList.remove("hidden");$("cameraPlaceholder").classList.add("hidden");$("startCameraButton").classList.add("hidden");$("stopCameraButton").classList.remove("hidden");$("scanLine").classList.remove("hidden");
 }catch(e){$("cameraStatus").textContent=e.message||"Kamera konnte nicht gestartet werden.";}
}
function handlePayload(raw){
 SC.stop(); let token=String(raw||"").trim(); if(token.startsWith(C.qrPrefix))token=token.slice(C.qrPrefix.length);
 processToken(token);
}
function processToken(token){
 const r=window.AVT_REGISTRATIONS.find(x=>x.token===token);
 if(!r){showMessage("Unbekannter QR-Code","Dieser QR-Code gehört nicht zu den Testanmeldungen.","dangerbox");return;}
 current=r; counts=U.clone(r.booked);priceMode="auto";manualPrice=null;renderResult();
}
function renderSearch(){
 const q=$("searchInput").value.trim().toLowerCase();
 const list=q?window.AVT_REGISTRATIONS.filter(r=>r.number.toLowerCase().includes(q)||r.name.toLowerCase().includes(q)):[];
 $("searchResults").innerHTML=list.map(r=>`<button class="full" data-token="${r.token}"><strong>${r.number}</strong> · ${U.esc(r.name)}</button>`).join("") || (q?'<p class="muted">Keine Anmeldung gefunden.</p>':'');
 $("searchResults").querySelectorAll("button").forEach(b=>b.onclick=()=>processToken(b.dataset.token));
}
function renderResult(){
 panels.forEach(p=>$(p).classList.add("hidden"));$("resultPanel").classList.remove("hidden");
 if(current.eventId!==C.event.id){showMessage("Falsche Veranstaltung",`${current.number} gehört nicht zur aktiven Veranstaltung.`,"dangerbox");return;}
 const existing=data.checkins[current.token];
 if(existing){showMessage("Bereits eingecheckt",`${current.number} wurde bereits mit ${U.sumCounts(existing.counts)} Personen eingecheckt.`,"warning",true);return;}
 const waitBlock=current.status==="waitlist"?earlierWait():[];
 let tone=current.status==="cancelled"?"dangerbox":current.status==="waitlist"?"warning":"";
 let warning="";
 if(current.status==="cancelled")warning='<div class="card dangerbox"><strong>Stornierte Anmeldung</strong><p>Ein Check-in ist nur als ausdrückliche Ausnahme möglich.</p></div>';
 if(waitBlock.length)warning=`<div class="card warning"><strong>${current.number} ist noch nicht an der Reihe</strong><p>Vorher offen: ${waitBlock.map(x=>x.number).join(", ")}</p></div>`;
 $("resultContent").innerHTML=`
 <div class="card ${tone}"><div class="result-head"><div><h2>${current.number}</h2><h3>${U.esc(current.name)}</h3></div><span class="badge">${labelStatus(current.status)}</span></div></div>
 ${warning}${counterHtml()}${priceHtml()}
 <button id="completeBtn" class="primary full">${current.status==="cancelled"?"Stornierte Anmeldung ausnahmsweise einchecken":current.status==="waitlist"?"Warteliste einchecken":"Check-in abschließen"}</button>`;
 bindCounters();
 bindPrice();
 $("completeBtn").onclick=completeExisting;
}
function labelStatus(s){return s==="confirmed"?"Reguläre Anmeldung":s==="waitlist"?"Warteliste":"Storniert"}
function earlierWait(){
 return window.AVT_REGISTRATIONS.filter(r=>r.status==="waitlist"&&r.waitNo<current.waitNo&&!data.checkins[r.token]);
}
function counterHtml(){
 return `<div class="card"><h3>Personenzahl anpassen</h3>${Object.keys(cats).map(k=>`<div class="counter-row"><span>${cats[k].label}</span><button data-k="${k}" data-d="-1">−</button><div id="n-${k}" class="counter-value">${counts[k]||0}</div><button data-k="${k}" data-d="1">+</button></div>`).join("")}<p><strong>Gesamt: <span id="personTotal">${U.sumCounts(counts)}</span> Personen</strong></p></div>`;
}
function regularPrice(){return Object.keys(cats).reduce((s,k)=>s+(counts[k]||0)*cats[k].price,0)}
function familyEligible(){return (counts.adult||0)>=C.familyRule.minAdults && ((counts.child||0)+(counts.youth||0)+(counts.student||0))>=C.familyRule.minReducedPersons}
function chosenPrice(){if(priceMode==="family")return C.prices.family;if(priceMode==="manual")return Number(manualPrice)||0;return regularPrice();}
function priceHtml(){
 const fam=familyEligible();
 return `<div class="price-box"><div>Zu zahlender Eintritt</div><div id="priceTotal" class="price-total">${U.euro(chosenPrice())}</div><div id="priceHint">${priceMode==="family"?"Familientarif":priceMode==="manual"?"Manuell festgelegt":"Regulärer Tarif"}</div></div>
 <div class="card"><div class="tariff-row"><button id="regularTariff" class="${priceMode==="auto"?"active-tariff":""}">Regulär ${U.euro(regularPrice())}</button><button id="familyTariff" class="${priceMode==="family"?"active-tariff":""}" ${fam?"":"disabled"}>Familientarif ${U.euro(C.prices.family)}</button></div>
 <label>Eintritt manuell korrigieren<input id="manualPrice" type="number" min="0" step="0.50" inputmode="decimal" value="${priceMode==="manual"?manualPrice:""}" placeholder="Betrag in Euro"></label></div>`;
}
function bindCounters(){
 document.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{const k=b.dataset.k;counts[k]=Math.max(0,(counts[k]||0)+Number(b.dataset.d));renderResult();});
}
function bindPrice(){
 $("regularTariff").onclick=()=>{priceMode="auto";manualPrice=null;renderResult();};
 $("familyTariff").onclick=()=>{priceMode="family";manualPrice=null;renderResult();};
 $("manualPrice").oninput=e=>{if(e.target.value!==""){priceMode="manual";manualPrice=e.target.value;$("priceTotal").textContent=U.euro(chosenPrice());$("priceHint").textContent="Manuell festgelegt";}};
}
async function completeExisting(){
 if(U.sumCounts(counts)<1){toast("Mindestens eine Person erforderlich.");return;}
 let msg=`${current.number} mit ${U.sumCounts(counts)} Personen und ${U.euro(chosenPrice())} Eintritt einchecken?`;
 if(current.status==="cancelled")msg="Stornierte Anmeldung als Ausnahme: "+msg;
 if(current.status==="waitlist"&&earlierWait().length)msg=`Frühere Wartelistennummern sind noch offen. ${msg}`;
 if(!(await confirmBox("Check-in bestätigen",msg,"Einchecken")))return;
 data.checkins[current.token]={token:current.token,number:current.number,name:current.name,counts:U.clone(counts),paid:chosenPrice(),tariff:priceMode,kind:current.status==="confirmed"?"regular":current.status==="waitlist"?"waitlist":"exception",time:U.now()};
 S.save(data);renderSuccess(data.checkins[current.token]);
}
function renderManual(){
 counts={adult:0,child:0,youth:0,student:0};priceMode="auto";manualPrice=null;
 $("manualContent").innerHTML=`<div class="card"><p class="muted">Für spontan erschienene Personen ohne Voranmeldung.</p></div>${counterHtml()}${priceHtml()}<button id="manualComplete" class="primary full">Spontanen Check-in abschließen</button>`;
 bindCountersManual();bindPriceManual();$("manualComplete").onclick=completeManual;
}
function bindCountersManual(){document.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{const k=b.dataset.k;counts[k]=Math.max(0,(counts[k]||0)+Number(b.dataset.d));renderManual();});}
function bindPriceManual(){
 $("regularTariff").onclick=()=>{priceMode="auto";manualPrice=null;renderManual();};
 $("familyTariff").onclick=()=>{priceMode="family";manualPrice=null;renderManual();};
 $("manualPrice").oninput=e=>{if(e.target.value!==""){priceMode="manual";manualPrice=e.target.value;$("priceTotal").textContent=U.euro(chosenPrice());$("priceHint").textContent="Manuell festgelegt";}};
}
async function completeManual(){
 if(U.sumCounts(counts)<1){toast("Mindestens eine Person erforderlich.");return;}
 if(!(await confirmBox("Spontanen Check-in bestätigen",`${U.sumCounts(counts)} Personen mit ${U.euro(chosenPrice())} Eintritt erfassen?`,"Erfassen")))return;
 const id=`M-${String(data.sequence++).padStart(3,"0")}`;
 const x={id,name:"Spontaner Check-in",counts:U.clone(counts),paid:chosenPrice(),tariff:priceMode,time:U.now()};
 data.manual.push(x);S.save(data);renderSuccess({...x,number:id,kind:"manual"});
}
function renderSuccess(x){
 $("resultContent").innerHTML=`<div class="card success"><h2>Check-in erfolgreich</h2><p><strong>${U.esc(x.name)} · ${x.number}</strong></p><p>${U.sumCounts(x.counts)} Personen · Eintritt ${U.euro(x.paid)}</p></div>${actualHtml(x.counts)}${standHtml()}<button class="primary full" data-nav="scan">Nächsten QR-Code scannen</button><button class="secondary full" data-nav="overview">Gesamtübersicht öffnen</button>`;
 $("resultContent").querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>nav(b.dataset.nav));
 renderAll();
}
function actualHtml(c){return `<div class="card"><h3>Tatsächliche Personenzahl</h3><dl class="detail-grid">${Object.keys(cats).filter(k=>c[k]).map(k=>`<dt>${cats[k].label}</dt><dd>${c[k]}</dd>`).join("")}<dt>Gesamt</dt><dd>${U.sumCounts(c)}</dd></dl></div>`}
function standHtml(){const s=stats();return `<div class="card"><h3>Aktueller Gesamtstand</h3><dl class="detail-grid"><dt>Regulär</dt><dd>${s.regular}</dd><dt>Warteliste</dt><dd>${s.wait}</dd><dt>Stornierte Ausnahmen</dt><dd>${s.exceptions}</dd><dt>Spontan</dt><dd>${s.manual}</dd><dt>Gesamt anwesend</dt><dd>${s.present} / ${C.event.maxPersons}</dd><dt>Sicher freie Plätze</dt><dd>${s.safe}</dd><dt>Eintritt</dt><dd>${U.euro(s.entry)}</dd><dt>Spenden</dt><dd>${U.euro(s.donations)}</dd></dl></div>`}
function renderOverview(){
 const s=stats();$("presentTop").textContent=s.present;
 const checkRows=[...Object.values(data.checkins),...data.manual.map(x=>({...x,number:x.id,kind:"manual"}))];
 $("overviewContent").innerHTML=`${standHtml()}<div class="card"><h3>Einnahmen</h3><dl class="detail-grid"><dt>Eintritt</dt><dd>${U.euro(s.entry)}</dd><dt>Spenden</dt><dd>${U.euro(s.donations)}</dd><dt>Gesamteinnahmen</dt><dd>${U.euro(s.total)}</dd></dl></div><div class="card"><h3>Erfasste Check-ins</h3>${checkRows.length?checkRows.map(x=>`<p><strong>${U.esc(x.number)}</strong> · ${U.sumCounts(x.counts)} Personen · ${U.euro(x.paid)}</p>`).join(""):'<p class="muted">Noch keine Check-ins.</p>'}</div>`;
}
async function donation(){
 const amount=prompt("Spendenbetrag in Euro:", "5");
 if(amount===null)return; const value=Number(String(amount).replace(",","."));
 if(!Number.isFinite(value)||value<=0){toast("Bitte einen gültigen Betrag eingeben.");return;}
 if(!(await confirmBox("Spende bestätigen",`Spende von ${U.euro(value)} erfassen?`,"Spende erfassen")))return;
 data.donations.push({amount:value,time:U.now()});S.save(data);renderOverview();toast("Spende wurde erfasst.");
}
async function reset(){if(await confirmBox("Testdaten zurücksetzen","Alle lokalen Check-ins, Einnahmen und Spenden löschen?","Zurücksetzen")){data=S.reset();renderAll();toast("Testdaten zurückgesetzt.");}}
function showMessage(title,text,tone,withOverview=false){
 $("resultContent").innerHTML=`<div class="card ${tone||""}"><h2>${U.esc(title)}</h2><p>${U.esc(text)}</p></div>${withOverview?'<button class="secondary full" data-nav="overview">Übersicht öffnen</button>':''}`;
 document.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>nav(b.dataset.nav));
}
function confirmBox(title,body,confirmText){
 $("modalTitle").textContent=title;$("modalBody").textContent=body;$("modalConfirm").textContent=confirmText;$("modal").classList.remove("hidden");
 return new Promise(r=>modalResolve=r);
}
function closeModal(value){$("modal").classList.add("hidden");modalResolve?.(value);modalResolve=null;}
function toast(t){$("toast").textContent=t;$("toast").classList.remove("hidden");setTimeout(()=>$("toast").classList.add("hidden"),2200);}
document.addEventListener("DOMContentLoaded",init);
})();

if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));}
