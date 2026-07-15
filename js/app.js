"use strict";

(function () {
  const C = window.AVT_CONFIG;
  const U = window.AVT_UTIL;
  const DATA = window.AVT_DEMO_DATA;
  const STORE = window.AVT_STORAGE;
  const SCANNER = window.AVT_SCANNER;

  const categoryMeta = {
    adult: { label: "Erwachsene", short: "Erw." },
    student: { label: "Studierende", short: "Stud." },
    child: { label: "Kinder", short: "Kinder" },
    family: { label: "Familie (Personen)", short: "Familie" }
  };

  let checkins = STORE.getCheckins();
  let currentRegistration = null;
  let currentCounts = null;
  let modalResolver = null;
  let cameraStarting = false;

  const $ = id => document.getElementById(id);
  const panels = ["homePanel", "scanPanel", "searchPanel", "resultPanel", "overviewPanel"];

  function init() {
    $("versionLabel").textContent = `Version ${C.version}`;
    bindEvents();
    renderEvent();
    if (STORE.getLogin()) showMain(); else showLogin();
  }

  function bindEvents() {
    $("loginForm").addEventListener("submit", handleLogin);
    $("togglePassword").addEventListener("click", () => {
      const input = $("passwordInput");
      input.type = input.type === "password" ? "text" : "password";
      $("togglePassword").textContent = input.type === "password" ? "Anzeigen" : "Verbergen";
    });
    $("logoutButton").addEventListener("click", logout);
    document.querySelectorAll("[data-nav]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.nav)));
    $("startCameraButton").addEventListener("click", startCamera);
    $("cameraPlaceholder").addEventListener("click", startCamera);
    $("stopCameraButton").addEventListener("click", stopCameraUi);
    $("imageInput").addEventListener("change", handleImageFile);
    $("searchInput").addEventListener("input", renderSearchResults);
    $("modalCancel").addEventListener("click", () => closeModal(false));
    $("modalConfirm").addEventListener("click", () => closeModal(true));
    $("modalBackdrop").addEventListener("click", event => {
      if (event.target === $("modalBackdrop")) closeModal(false);
    });
  }

  function showLogin() {
    $("loginView").classList.remove("hidden");
    $("mainView").classList.add("hidden");
    $("logoutButton").classList.add("hidden");
    setTimeout(() => $("passwordInput").focus(), 50);
  }

  function showMain() {
    $("loginView").classList.add("hidden");
    $("mainView").classList.remove("hidden");
    $("logoutButton").classList.remove("hidden");
    navigate("home");
  }

  function handleLogin(event) {
    event.preventDefault();
    const password = $("passwordInput").value;
    if (password !== C.demoPassword) {
      $("loginError").textContent = "Das eingegebene Demo-Passwort ist nicht korrekt.";
      return;
    }
    const mode = new FormData(event.currentTarget).get("loginStorage") || "day";
    STORE.saveLogin(mode);
    $("loginError").textContent = "";
    $("passwordInput").value = "";
    showMain();
  }

  function logout() {
    SCANNER.stop();
    STORE.clearLogin();
    showLogin();
  }

  function renderEvent() {
    $("eventTitle").textContent = DATA.activeEvent.title;
    $("eventDateTime").textContent = `${U.displayDate(DATA.activeEvent.date)} · ${DATA.activeEvent.time} Uhr`;
    $("headerCapacity").textContent = DATA.activeEvent.maxPersons;
  }

  function navigate(target) {
    SCANNER.stop();
    cameraStarting = false;
    panels.forEach(id => $(id).classList.add("hidden"));
    const id = `${target}Panel`;
    if ($(id)) $(id).classList.remove("hidden"); else $("homePanel").classList.remove("hidden");
    if (target === "home") {
      renderDashboard();
    } else if (target === "overview") {
      renderOverview();
    } else if (target === "search") {
      $("searchInput").value = "";
      renderSearchResults();
      setTimeout(() => $("searchInput").focus(), 50);
    } else if (target === "scan") {
      resetScannerUi();
      void startCamera();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function stats() {
    const activeRegular = DATA.registrations.filter(r => r.kind === "regular" && r.status === "active" && isCurrentEvent(r));
    const activeWait = DATA.registrations.filter(r => r.kind === "waitlist" && r.status === "active" && isCurrentEvent(r));
    const cancelled = DATA.registrations.filter(r => r.status === "cancelled" && isCurrentEvent(r));

    const confirmedBookedPersons = activeRegular.reduce((sum, reg) => sum + U.sumCounts(reg.booked), 0);
    const initiallyUnallocated = Math.max(0, DATA.activeEvent.maxPersons - confirmedBookedPersons);
    const confirmedOverCapacity = Math.max(0, confirmedBookedPersons - DATA.activeEvent.maxPersons);

    let regularCheckedPersons = 0;
    let waitCheckedPersons = 0;
    let exceptionCheckedPersons = 0;
    let regularCheckedBookings = 0;
    let waitCheckedBookings = 0;
    let exceptionCheckedBookings = 0;
    let missingVsBooked = 0;
    let extraVsBooked = 0;
    let regularNotCheckedPersons = 0;
    let regularNotCheckedBookings = 0;

    activeRegular.forEach(reg => {
      const record = checkins[reg.token];
      const booked = U.sumCounts(reg.booked);
      if (record) {
        const actual = U.sumCounts(record.counts);
        regularCheckedPersons += actual;
        regularCheckedBookings += 1;
        missingVsBooked += Math.max(0, booked - actual);
        extraVsBooked += Math.max(0, actual - booked);
      } else {
        regularNotCheckedPersons += booked;
        regularNotCheckedBookings += 1;
      }
    });

    activeWait.forEach(reg => {
      const record = checkins[reg.token];
      if (record) {
        waitCheckedPersons += U.sumCounts(record.counts);
        waitCheckedBookings += 1;
      }
    });

    cancelled.forEach(reg => {
      const record = checkins[reg.token];
      if (record) {
        exceptionCheckedPersons += U.sumCounts(record.counts);
        exceptionCheckedBookings += 1;
      }
    });

    const present = regularCheckedPersons + waitCheckedPersons + exceptionCheckedPersons;
    const worstCaseOccupancy = regularCheckedPersons + regularNotCheckedPersons + waitCheckedPersons + exceptionCheckedPersons;
    const safeFree = Math.max(0, DATA.activeEvent.maxPersons - worstCaseOccupancy);
    const overCapacityRisk = Math.max(0, worstCaseOccupancy - DATA.activeEvent.maxPersons);
    const openWait = activeWait.filter(reg => !checkins[reg.token]).sort(waitSort);

    return {
      confirmedBookedPersons, initiallyUnallocated, confirmedOverCapacity,
      regularCheckedPersons, waitCheckedPersons, exceptionCheckedPersons, present,
      regularCheckedBookings, waitCheckedBookings, exceptionCheckedBookings,
      missingVsBooked, extraVsBooked, regularNotCheckedPersons, regularNotCheckedBookings,
      safeFree, overCapacityRisk, openWait
    };
  }

  function renderDashboard() {
    const s = stats();
    $("headerPresent").textContent = s.present;
    $("summaryCards").innerHTML = [
      summaryCard("Aktuell anwesend", `${s.present}`, "success", `von ${DATA.activeEvent.maxPersons}`),
      summaryCard("Regulär eingecheckt", `${s.regularCheckedPersons}`, "info", `${s.regularCheckedBookings} Buchungen`),
      summaryCard("Warteliste eingecheckt", `${s.waitCheckedPersons}`, "warning", `${s.waitCheckedBookings} Buchungen`),
      summaryCard("Stornierte Ausnahmen", `${s.exceptionCheckedPersons}`, s.exceptionCheckedPersons ? "warning" : "info", `${s.exceptionCheckedBookings} Buchungen`),
      summaryCard("Von Anfang an frei", `${s.initiallyUnallocated}`, "info", `${s.confirmedBookedPersons} regulär angemeldet`),
      summaryCard("Sicher freie Plätze", `${s.safeFree}`, s.safeFree ? "success" : "warning", `noch ${s.regularNotCheckedPersons} regulär erwartet`)
    ].join("");

    const scenarioTokens = [
      "T2-A01-VALID", "T2-A02-FAMILY", "T2-A04-ALREADY", "T2-A05-CANCELLED",
      "T2-A06-GROUP", "T2-W01-FIRST", "T2-W06-BLOCKED", "T2-X-WRONG-EVENT"
    ];
    $("scenarioButtons").innerHTML = scenarioTokens.map(token => {
      const reg = registrationByToken(token);
      return `<button type="button" class="scenario-button" data-token="${U.escapeHtml(token)}"><strong>${U.escapeHtml(reg.number)}</strong> · ${U.escapeHtml(reg.scenario)}</button>`;
    }).join("") + `<button type="button" class="scenario-button" id="resetDemoButton"><strong>↺</strong> Demo-Check-ins zurücksetzen</button>`;

    $("scenarioButtons").querySelectorAll("[data-token]").forEach(button => button.addEventListener("click", () => processToken(button.dataset.token)));
    $("resetDemoButton").addEventListener("click", async () => {
      const yes = await confirmModal("Demo zurücksetzen", "Alle in dieser Demo vorgenommenen Check-ins auf diesem Gerät werden verworfen. Die vorbereiteten Ausgangsdaten bleiben erhalten.", "Zurücksetzen");
      if (!yes) return;
      checkins = STORE.resetCheckins();
      renderDashboard();
      showToast("Demo wurde zurückgesetzt.");
    });
  }

  function summaryCard(label, value, tone, footer) {
    return `<div class="summary-card ${tone}"><div class="summary-label">${U.escapeHtml(label)}</div><strong>${U.escapeHtml(value)}</strong><div class="summary-label">${U.escapeHtml(footer)}</div></div>`;
  }

  function resetScannerUi() {
    cameraStarting = false;
    $("startCameraButton").disabled = false;
    $("cameraVideo").classList.add("hidden");
    $("cameraPlaceholder").classList.remove("hidden");
    $("scanLine").classList.add("hidden");
    $("startCameraButton").classList.remove("hidden");
    $("stopCameraButton").classList.add("hidden");
    $("cameraStatus").textContent = "Kamera wird automatisch gestartet …";
    $("imageInput").value = "";
  }

  async function startCamera() {
    if (cameraStarting) return;
    cameraStarting = true;
    try {
      $("startCameraButton").disabled = true;
      SCANNER.setStatus("Kamera wird geöffnet …");
      await SCANNER.start(handleQrPayload);
      $("cameraPlaceholder").classList.add("hidden");
      $("cameraVideo").classList.remove("hidden");
      $("scanLine").classList.remove("hidden");
      $("startCameraButton").classList.add("hidden");
      $("stopCameraButton").classList.remove("hidden");
    } catch (error) {
      SCANNER.setStatus(cameraErrorText(error));
      $("cameraPlaceholder").classList.remove("hidden");
      $("startCameraButton").classList.remove("hidden");
      $("startCameraButton").disabled = false;
    } finally {
      cameraStarting = false;
    }
  }

  function stopCameraUi() {
    SCANNER.stop();
    resetScannerUi();
  }

  function cameraErrorText(error) {
    if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
      return "Kamerazugriff benötigt HTTPS. Bitte die Demo über GitHub Pages oder einen HTTPS-Webserver öffnen.";
    }
    if (error?.name === "NotAllowedError") return "Kamerazugriff wurde nicht erlaubt. Bitte in den Browser-Einstellungen freigeben.";
    if (error?.name === "NotFoundError") return "Keine geeignete Kamera gefunden.";
    return error?.message || "Kamera konnte nicht gestartet werden.";
  }

  async function handleImageFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      SCANNER.setStatus("Bild wird ausgewertet …");
      const payload = await SCANNER.decodeImageFile(file);
      handleQrPayload(payload);
    } catch (error) {
      SCANNER.setStatus(error.message);
    }
  }

  function handleQrPayload(payload) {
    const text = String(payload || "").trim();
    if (!text.startsWith(C.qrPrefix)) {
      showInvalidCode("Dieser QR-Code gehört nicht zur AVT-Check-in-Demo.");
      return;
    }
    processToken(text.slice(C.qrPrefix.length));
  }

  function processToken(token) {
    const registration = registrationByToken(token);
    if (!registration) {
      showInvalidCode("Der QR-Code ist unbekannt oder nicht mehr gültig.");
      return;
    }
    currentRegistration = registration;
    currentCounts = U.clone(registration.booked);
    renderRegistrationResult();
    panels.forEach(id => $(id).classList.add("hidden"));
    $("resultPanel").classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showInvalidCode(message) {
    currentRegistration = null;
    $("resultContent").innerHTML = `<div class="alert alert-danger"><h3>QR-Code nicht gültig</h3><p>${U.escapeHtml(message)}</p></div><button class="primary full-width" data-next-scan type="button">Nächsten QR-Code scannen</button>`;
    $("resultContent").querySelector("[data-next-scan]").addEventListener("click", () => navigate("scan"));
    panels.forEach(id => $(id).classList.add("hidden"));
    $("resultPanel").classList.remove("hidden");
  }

  function renderRegistrationResult(editMode = false) {
    const reg = currentRegistration;
    const existing = checkins[reg.token];
    const eventMismatch = !isCurrentEvent(reg);
    const lowerWait = lowerOpenWaitlist(reg);
    let html = "";

    if (eventMismatch) {
      html += `<div class="alert alert-danger"><h3>Falsche Veranstaltung</h3><p>Dieser QR-Code gehört zur Veranstaltung am <strong>${U.escapeHtml(U.displayDate(reg.eventDate))}</strong>. Aktiv ist ${U.escapeHtml(U.displayDate(DATA.activeEvent.date))} um ${U.escapeHtml(DATA.activeEvent.time)} Uhr.</p></div>`;
      html += registrationIdentity(reg);
      html += `<button class="primary full-width" data-next-scan type="button">Nächsten QR-Code scannen</button>`;
      setResultHtml(html);
      return;
    }

    if (existing && !editMode) {
      const actual = U.sumCounts(existing.counts);
      const isCancelledException = reg.status === "cancelled";
      html += `<div class="alert ${isCancelledException ? "alert-warning" : "alert-success"}"><h3>${isCancelledException ? "Bereits als Ausnahme eingecheckt" : "Bereits eingecheckt"}</h3><p>${U.escapeHtml(reg.number)} wurde um <strong>${U.escapeHtml(U.displayTime(existing.checkedAt))} Uhr</strong> mit <strong>${actual} Personen</strong> eingecheckt.</p></div>`;
      html += registrationIdentity(reg);
      html += countsReadout(existing.counts);
      html += `<div class="checkin-actions"><button class="secondary full-width" data-edit type="button">Check-in korrigieren</button><button class="primary full-width" data-next-scan type="button">Nächsten QR-Code scannen</button></div>`;
      setResultHtml(html);
      $("resultContent").querySelector("[data-edit]").addEventListener("click", () => {
        currentCounts = U.clone(existing.counts);
        renderRegistrationResult(true);
      });
      return;
    }

    if (reg.status === "cancelled") {
      html += `<div class="alert alert-danger"><h3>Anmeldung storniert</h3><p>${U.escapeHtml(reg.number)} besitzt keinen regulär reservierten Platz. Ein Check-in ist nur als bewusste Ausnahme nach zusätzlicher Bestätigung möglich.</p></div>`;
    }

    if (reg.kind === "waitlist" && reg.status === "active") {
      if (lowerWait.length) {
        const people = lowerWait.reduce((sum, item) => sum + U.sumCounts(item.booked), 0);
        html += `<div class="alert alert-warning"><h3>${U.escapeHtml(reg.number)} ist noch nicht an der Reihe</h3><p>Vorher sind noch <strong>${lowerWait.length} Wartelistenbuchungen mit ${people} Personen</strong> offen:</p><div class="waiting-order">${lowerWait.map(item => `<span class="wait-chip">${U.escapeHtml(item.number)}</span>`).join("")}</div></div>`;
      } else {
        html += `<div class="alert alert-info"><h3>Warteliste</h3><p>${U.escapeHtml(reg.number)} ist die kleinste derzeit offene Wartelistennummer.</p></div>`;
      }
    }

    html += registrationIdentity(reg);
    html += counterEditor(currentCounts);
    html += `<div class="total-box"><span>Tatsächlich einzuchecken</span><strong id="totalPersons">${U.sumCounts(currentCounts)}</strong></div>`;

    let buttonLabel = "Check-in abschließen";
    let buttonClass = "success-button";
    if (editMode) {
      buttonLabel = "Korrektur speichern";
    } else if (reg.status === "cancelled") {
      buttonLabel = "Stornierte Anmeldung ausnahmsweise einchecken";
      buttonClass = "danger";
    } else if (reg.kind === "waitlist" && lowerWait.length) {
      buttonLabel = "Trotz Reihenfolge einchecken";
      buttonClass = "danger";
    }

    html += `<div class="checkin-actions"><button id="completeCheckin" class="${buttonClass} full-width" type="button">${U.escapeHtml(buttonLabel)}</button><button class="secondary full-width" data-next-scan type="button">Abbrechen und weiter scannen</button></div>`;
    setResultHtml(html);

    $("resultContent").querySelectorAll("[data-counter]").forEach(button => button.addEventListener("click", () => changeCounter(button.dataset.counter, Number(button.dataset.delta))));
    $("completeCheckin").addEventListener("click", () => completeCheckin(editMode));
  }

  function setResultHtml(html) {
    $("resultContent").innerHTML = html;
    $("resultContent").querySelectorAll("[data-next-scan]").forEach(button => button.addEventListener("click", () => navigate("scan")));
  }

  function registrationIdentity(reg) {
    let kindLabel = reg.kind === "waitlist" ? "Warteliste" : "Reguläre Anmeldung";
    let kindClass = reg.kind === "waitlist" ? "tag-wait" : "tag-regular";
    if (reg.status === "cancelled") {
      kindLabel = "Storniert";
      kindClass = "tag-cancelled";
    }
    return `<div class="card"><div class="registration-head"><div><div class="registration-number">${U.escapeHtml(reg.number)}</div><div class="registration-name">${U.escapeHtml(reg.name)}</div></div><span class="status-tag ${kindClass}">${kindLabel}</span></div><dl class="detail-grid"><dt>Ursprünglich angemeldet</dt><dd>${U.sumCounts(reg.booked)} Personen</dd><dt>Veranstaltung</dt><dd>${U.escapeHtml(U.displayDate(reg.eventDate))}</dd></dl></div>`;
  }

  function countsReadout(counts) {
    const rows = Object.entries(counts).filter(([, value]) => value > 0).map(([key, value]) => `<dt>${U.escapeHtml(categoryMeta[key].label)}</dt><dd>${value}</dd>`).join("");
    return `<div class="card"><h3>Tatsächliche Personenzahl</h3><dl class="detail-grid">${rows}<dt><strong>Gesamt</strong></dt><dd><strong>${U.sumCounts(counts)}</strong></dd></dl></div>`;
  }

  function counterEditor(counts) {
    return `<div class="card"><h3>Personenzahl anpassen</h3><div class="counter-list">${Object.entries(counts).filter(([, value]) => value > 0).map(([key, value]) => `<div class="counter-row"><div class="counter-label">${U.escapeHtml(categoryMeta[key].label)}</div><button type="button" class="counter-button" data-counter="${key}" data-delta="-1" aria-label="${U.escapeHtml(categoryMeta[key].label)} verringern">−</button><div id="counter-${key}" class="counter-value">${value}</div><button type="button" class="counter-button" data-counter="${key}" data-delta="1" aria-label="${U.escapeHtml(categoryMeta[key].label)} erhöhen">+</button></div>`).join("")}</div><p class="muted small">Bei einer Familienanmeldung startet der Check-in mit dem Standardwert 3 Personen.</p></div>`;
  }

  function changeCounter(key, delta) {
    currentCounts[key] = Math.max(0, Math.min(30, Number(currentCounts[key] || 0) + delta));
    const value = $(`counter-${key}`);
    if (value) value.textContent = currentCounts[key];
    $("totalPersons").textContent = U.sumCounts(currentCounts);
    $("completeCheckin").disabled = U.sumCounts(currentCounts) < 1;
  }

  async function completeCheckin(editMode) {
    const reg = currentRegistration;
    const total = U.sumCounts(currentCounts);
    if (total < 1) {
      showToast("Mindestens eine Person muss eingecheckt werden.");
      return;
    }

    const warnings = [];
    const lowerWait = lowerOpenWaitlist(reg);

    if (reg.status === "cancelled") {
      warnings.push(`${reg.number} wurde storniert und besitzt keinen regulär reservierten Platz.`);
    }

    if (reg.kind === "waitlist" && reg.status === "active" && lowerWait.length) {
      warnings.push(`Vor ${reg.number} sind noch ${lowerWait.map(item => item.number).join(", ")} offen.`);
    }

    if (reg.kind === "waitlist" || reg.status === "cancelled") {
      const s = stats();
      const previousTotal = editMode && checkins[reg.token] ? U.sumCounts(checkins[reg.token].counts) : 0;
      const availableForThisBooking = s.safeFree + previousTotal;
      if (total > availableForThisBooking) {
        warnings.push(`Für diese Buchung sind aktuell höchstens ${availableForThisBooking} Plätze sicher verfügbar. Der Check-in umfasst ${total} Personen.`);
      }
    }

    if (warnings.length) {
      const title = reg.status === "cancelled" ? "Stornierte Anmeldung bestätigen" : "Ausnahme bestätigen";
      const confirmed = await confirmModal(title, `<p>${warnings.map(text => U.escapeHtml(text)).join("</p><p>")}</p><p>Die Personen werden auf die Kapazität angerechnet und in der Übersicht gesondert ausgewiesen.</p>`, reg.status === "cancelled" ? "Als Ausnahme einchecken" : "Trotzdem einchecken", true);
      if (!confirmed) return;
    }

    checkins[reg.token] = {
      counts: U.clone(currentCounts),
      checkedAt: new Date().toISOString(),
      override: warnings.length > 0,
      corrected: Boolean(editMode),
      entryType: reg.status === "cancelled" ? "cancelled-exception" : reg.kind
    };
    STORE.saveCheckins(checkins);
    renderSuccess(reg, editMode);
  }

  function renderSuccess(reg, corrected) {
    const actual = checkins[reg.token];
    const total = U.sumCounts(actual.counts);
    const s = stats();
    $("headerPresent").textContent = s.present;
    const isCancelledException = reg.status === "cancelled";
    const heading = corrected ? "Korrektur gespeichert" : (isCancelledException ? "Ausnahme-Check-in erfolgreich" : "Check-in erfolgreich");
    let html = `<div class="alert ${isCancelledException ? "alert-warning" : "alert-success"}"><h3>${heading}</h3><p><strong>${U.escapeHtml(reg.name)}</strong> · ${U.escapeHtml(reg.number)}</p><p><strong>${total} Personen</strong> wurden übernommen.</p>${isCancelledException ? "<p>Diese Personen werden als stornierte Ausnahme gezählt.</p>" : ""}</div>`;
    html += countsReadout(actual.counts);
    html += `<div class="card"><h3>Aktueller Gesamtstand</h3><dl class="detail-grid"><dt>Regulär eingecheckt</dt><dd>${s.regularCheckedPersons}</dd><dt>Warteliste eingecheckt</dt><dd>${s.waitCheckedPersons}</dd><dt>Stornierte Ausnahmen</dt><dd>${s.exceptionCheckedPersons}</dd><dt>Gesamt anwesend</dt><dd>${s.present} / ${DATA.activeEvent.maxPersons}</dd><dt>Von Anfang an nicht vergeben</dt><dd>${s.initiallyUnallocated}</dd><dt>Sicher freie Plätze</dt><dd>${s.safeFree}</dd></dl></div>`;
    html += `<div class="checkin-actions"><button class="primary full-width" data-next-scan type="button">Nächsten QR-Code scannen</button><button class="secondary full-width" data-overview type="button">Gesamtübersicht öffnen</button></div>`;
    setResultHtml(html);
    $("resultContent").querySelector("[data-overview]").addEventListener("click", () => navigate("overview"));
  }

  function renderSearchResults() {
    const query = $("searchInput").value.trim().toLocaleLowerCase("de-DE");
    const candidates = DATA.registrations.filter(reg => isCurrentEvent(reg));
    const results = (query ? candidates.filter(reg => `${reg.number} ${reg.name}`.toLocaleLowerCase("de-DE").includes(query)) : candidates.slice(0, 8)).slice(0, 15);
    if (!results.length) {
      $("searchResults").innerHTML = `<div class="empty-state">Keine passende Anmeldung gefunden.</div>`;
      return;
    }
    $("searchResults").innerHTML = results.map(reg => {
      const existing = checkins[reg.token];
      let status;
      if (reg.status === "cancelled" && existing) status = ["Ausnahme", "tag-exception"];
      else if (reg.status === "cancelled") status = ["Storniert", "tag-cancelled"];
      else if (existing) status = ["Eingecheckt", "tag-checked"];
      else if (reg.kind === "waitlist") status = ["Warteliste", "tag-wait"];
      else status = ["Regulär", "tag-regular"];
      return `<button class="search-result" type="button" data-token="${U.escapeHtml(reg.token)}"><span class="search-number">${U.escapeHtml(reg.number)}</span><span class="search-name">${U.escapeHtml(reg.name)}</span><span class="status-tag ${status[1]}">${status[0]}</span></button>`;
    }).join("");
    $("searchResults").querySelectorAll("[data-token]").forEach(button => button.addEventListener("click", () => processToken(button.dataset.token)));
  }

  function renderOverview() {
    const s = stats();
    $("headerPresent").textContent = s.present;
    const checkedRows = DATA.registrations
      .filter(reg => checkins[reg.token] && isCurrentEvent(reg))
      .sort((a, b) => new Date(checkins[b.token].checkedAt) - new Date(checkins[a.token].checkedAt));

    const openRegular = DATA.registrations.filter(reg => reg.kind === "regular" && reg.status === "active" && isCurrentEvent(reg) && !checkins[reg.token]);

    $("overviewContent").innerHTML = `
      <div class="summary-grid">
        ${summaryCard("Gesamt anwesend", s.present, "success", `von ${DATA.activeEvent.maxPersons}`)}
        ${summaryCard("Regulär", s.regularCheckedPersons, "info", `${s.regularCheckedBookings} Buchungen`)}
        ${summaryCard("Warteliste", s.waitCheckedPersons, "warning", `${s.waitCheckedBookings} Buchungen`)}
        ${summaryCard("Stornierte Ausnahmen", s.exceptionCheckedPersons, s.exceptionCheckedPersons ? "warning" : "info", `${s.exceptionCheckedBookings} Buchungen`)}
        ${summaryCard("Von Anfang an frei", s.initiallyUnallocated, "info", `${s.confirmedBookedPersons} regulär angemeldet`)}
        ${summaryCard("Sicher frei", s.safeFree, s.safeFree ? "success" : "warning", "Plätze")}
      </div>
      <div class="card overview-section">
        <h3>Kapazitätsbetrachtung</h3>
        <dl class="detail-grid">
          <dt>Maximale Kapazität</dt><dd>${DATA.activeEvent.maxPersons}</dd>
          <dt>Regulär bestätigte Personen</dt><dd>${s.confirmedBookedPersons}</dd>
          <dt>Von Anfang an nicht vergeben</dt><dd>${s.initiallyUnallocated}</dd>
          <dt>Reguläre Personen noch nicht eingecheckt</dt><dd>${s.regularNotCheckedPersons}</dd>
          <dt>Noch offene reguläre Buchungen</dt><dd>${s.regularNotCheckedBookings}</dd>
          <dt>Durch Minderteilnahme zusätzlich frei</dt><dd>${s.missingVsBooked}</dd>
          <dt>Mehr erschienen als angemeldet</dt><dd>${s.extraVsBooked}</dd>
          <dt>Wartelistenpersonen aufgenommen</dt><dd>${s.waitCheckedPersons}</dd>
          <dt>Stornierte Ausnahmen aufgenommen</dt><dd>${s.exceptionCheckedPersons}</dd>
          <dt><strong>Sicher freie Plätze</strong></dt><dd><strong>${s.safeFree}</strong></dd>
        </dl>
        ${s.overCapacityRisk ? `<div class="alert alert-danger"><strong>Achtung:</strong> Bei Erscheinen aller noch erwarteten regulären Personen würden ${s.overCapacityRisk} Plätze fehlen.</div>` : ""}
      </div>
      <div class="card overview-section">
        <h3>Bereits eingecheckt</h3>
        <div class="overview-list">${checkedRows.length ? checkedRows.map(overviewRow).join("") : `<div class="empty-state">Noch keine Check-ins.</div>`}</div>
      </div>
      <div class="card overview-section">
        <h3>Regulär noch offen</h3>
        <p class="muted small">${openRegular.length} Buchungen · ${s.regularNotCheckedPersons} Personen</p>
        <div class="overview-list">${openRegular.slice(0, 12).map(openRow).join("")}${openRegular.length > 12 ? `<div class="empty-state">… und ${openRegular.length - 12} weitere</div>` : ""}</div>
      </div>
      <div class="card overview-section">
        <h3>Offene Warteliste in Reihenfolge</h3>
        <div class="waiting-order">${s.openWait.length ? s.openWait.map(reg => `<span class="wait-chip">${U.escapeHtml(reg.number)} · ${U.sumCounts(reg.booked)}</span>`).join("") : `<span class="muted">Keine offenen Wartelisteneinträge.</span>`}</div>
      </div>`;

    $("overviewContent").querySelectorAll("[data-token]").forEach(button => button.addEventListener("click", () => processToken(button.dataset.token)));
  }

  function overviewRow(reg) {
    const record = checkins[reg.token];
    const actual = U.sumCounts(record.counts);
    const booked = U.sumCounts(reg.booked);
    let tag;
    if (reg.status === "cancelled") tag = `<span class="status-tag tag-exception">Stornierte Ausnahme</span>`;
    else if (reg.kind === "waitlist") tag = `<span class="status-tag tag-wait">Warteliste</span>`;
    else tag = `<span class="status-tag tag-regular">Regulär</span>`;
    return `<button class="overview-row" type="button" data-token="${U.escapeHtml(reg.token)}"><span>${tag}</span><span class="name"><strong>${U.escapeHtml(reg.number)}</strong> · ${U.escapeHtml(reg.name)}<br><small>${U.escapeHtml(U.displayTime(record.checkedAt))} Uhr</small></span><span class="numbers">${actual}<br><small>von ${booked}</small></span></button>`;
  }

  function openRow(reg) {
    return `<button class="overview-row" type="button" data-token="${U.escapeHtml(reg.token)}"><span class="status-tag tag-regular">${U.escapeHtml(reg.number)}</span><span class="name">${U.escapeHtml(reg.name)}</span><span class="numbers">${U.sumCounts(reg.booked)}</span></button>`;
  }

  function registrationByToken(token) {
    return DATA.registrations.find(reg => reg.token === token) || null;
  }

  function isCurrentEvent(reg) {
    return reg.eventId === DATA.activeEvent.id && reg.eventDate === DATA.activeEvent.date;
  }

  function waitNumber(reg) {
    const match = /^W-(\d+)$/i.exec(reg.number);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  }

  function waitSort(a, b) {
    return waitNumber(a) - waitNumber(b);
  }

  function lowerOpenWaitlist(reg) {
    if (reg.kind !== "waitlist") return [];
    const current = waitNumber(reg);
    return DATA.registrations.filter(item =>
      item.kind === "waitlist" &&
      item.status === "active" &&
      isCurrentEvent(item) &&
      waitNumber(item) < current &&
      !checkins[item.token]
    ).sort(waitSort);
  }

  function confirmModal(title, body, confirmText = "Bestätigen", bodyIsHtml = false) {
    $("modalTitle").textContent = title;
    $("modalBody").innerHTML = bodyIsHtml ? body : `<p>${U.escapeHtml(body)}</p>`;
    $("modalConfirm").textContent = confirmText;
    $("modalBackdrop").classList.remove("hidden");
    return new Promise(resolve => { modalResolver = resolve; });
  }

  function closeModal(result) {
    $("modalBackdrop").classList.add("hidden");
    if (modalResolver) modalResolver(result);
    modalResolver = null;
  }

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.add("hidden"), 2600);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) SCANNER.stop();
  });
  window.addEventListener("pagehide", () => SCANNER.stop());
  document.addEventListener("DOMContentLoaded", () => {
    init();
    if ("serviceWorker" in navigator && ["http:", "https:"].includes(location.protocol)) {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    }
  });
})();
