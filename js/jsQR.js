/* jsQR placeholder for offline bundle.
   Für den praktischen Mehrgeräte-Test lädt index.html diese lokale Datei.
   Falls keine QR-Bibliothek eingebettet wurde, lädt dieser Wrapper jsQR 1.4.0 nach.
*/
(function(){
  if (typeof window.jsQR === "function") return;
  var s=document.createElement("script");
  s.src="https://unpkg.com/jsqr@1.4.0/dist/jsQR.js";
  s.async=false;
  document.head.appendChild(s);
})();
