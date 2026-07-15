"use strict";

(function () {
  const C = window.AVT_CONFIG;
  const U = window.AVT_UTIL;
  const STORE = window.AVT_STORAGE;
  const BACKEND = window.AVT_BACKEND;
  const SCANNER = window.AVT_SCANNER;

  const categoryMeta = {
    adult: { label: "Erwachsene", short: "Erw." },
    student: { label: "Studierende", short: "Stud." },
    child: { label: "Kinder", short: "Kinder" },
    family: { label: "Familie (Personen)", short: "Familie" }
  };

  let state = null;
  let login = null;
  let currentRegistration = null;
  let currentCounts = null;
  let currentExpectedRevision = null;
  let modalResolver = null;
  let cameraStarting = false;
  let refreshTimer = null;
  let refreshInFlight = false;
  let lastResultWasSuccess = false;

  const $ = id => document.getElementById(id);
  const panels = ["homePanel", "scanPanel", "searchPanel", "resultPanel", "overviewPanel"];

  async function init() {
    $("versionLabel").textContent = `Version ${C.version}`;
    $("backendUrlInput").value = STORE.getBackendUrl();
    bindEvents();
    setConnectionStatus("Noch nicht mit dem gemeinsamen Test-Backend verbunden.", "idle");

    const storedLogin = STORE.getLogin();
    if (!storedLogin) {
      showLogin();
      return;
    }

    login = storedLogin;
    $("backendUrlInput").value = login.backendUrl;
    setLoginBusy(true, "Gespeicherte Anmeldung wird geprüft …");
    try {
      await BACKEND.connect(login.backendUrl);
      const response = await BACKEND.request("state", {}, login.token);
      if (!response.ok) throw apiError(response);
      applyState(response.state);
      showMain();
    } catch (error) {
      STORE.clearLogin();
      login = null;
      showLogin();
      setConnectionStatus(error.message || "Gespeicherte Anmeldung konnte nicht verwendet werden.", "error");
    } finally {
      setLoginBusy(false);
    }
  }

  function bindEvents() {
    $("loginForm").addEventListener("submit", handleLogin);
    $("testBackendButton").addEventListener("click", testBackendConnection);
    $("togglePassword").addEventListener("click", () => {
      const input = $("passwordInput");
      input.type = input.type === "password" ? "text" : "password";
      $("togglePassword").textContent = input.type === "password" ? "Anzeigen" : "Verbergen";
    });
    $("refreshButton").addEventListener("click", () => refreshStatistics({ silent: false }));
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
    window.addEventListener("online", () => {
      setSyncStatus("Internetverbindung wiederhergestellt · aktualisiere …", "pending");
      void refreshStatistics({ silent: true });
    });
    window.addEventListener("offline", () => setSyncStatus("Offline · Check-in derzeit nicht möglich", "error"));
  }

  function showLogin() {
    stopAutoRefresh();
    SCANNER.stop();
    $("loginView").classList.remove("hidden");
    $("mainView").classList.add("hidden");
    $("refreshButton").classList.add("hidden");
    setTimeout(() => $("passwordInput").focus(), 50);
  }

  function showMain() {
    $("loginView").classList.add("hidden");
    $("mainView").classList.remove("hidden");
    $("refreshButton").classList.remove("hidden");
    renderEvent();
    navigate("home");
    startAutoRefresh();
  }

  async function handleLogin(event) {
    event.preventDefault();
    const password = $("passwordInput").value;
    const mode = new FormData(event.currentTarget).get("loginStorage") || "day";
    let backendUrl;
    try {
      backendUrl = BACKEND.normalizeUrl($("backendUrlInput").value);
    } catch (error) {
      setConnectionStatus(error.message, "error");
      return;
    }

    setLoginBusy(true, "Verbindung und Passwort werden geprüft …");
    try {
      STORE.saveBackendUrl(backendUrl);
      await BACKEND.connect(backendUrl);
      const response = await BACKEND.request("login", {
        password,
        mode,
        deviceId: STORE.getDeviceId()
      });
      if (!response.ok) throw apiError(response);

      STORE.saveLogin(response, mode, backendUrl);
      login = STORE.getLogin();
      applyState(response.state);
      $("loginError").textContent = "";
      $("passwordInput").value = "";
      setConnectionStatus(`Verbunden mit Backend ${state.backendVersion}.`, "success");
      showMain();
    } catch (error) {
      $("loginError").textContent = error.message || "Anmeldung fehlgeschlagen.";
      setConnectionStatus(error.message || "Backend-Verbindung fehlgeschlagen.", "error");
    } finally {
      setLoginBusy(false);
    }
  }

  async function testBackendConnection() {
    let backendUrl;
    try {
      backendUrl = BACKEND.normalizeUrl($("backendUrlInput").value);
    } catch (error) {
      setConnectionStatus(error.message, "error");
      return;
    }

    $("testBackendButton").disabled = true;
    setConnectionStatus("Test-Backend wird kontaktiert …", "pending");
    try {
      const response = await BACKEND.health(backendUrl);
      if (!response.ok) throw apiError(response);
      STORE.saveBackendUrl(backendUrl);
      setConnectionStatus(`Verbindung erfolgreich · Backend ${response.backendVersion}`, "success");
    } catch (error) {
      setConnectionStatus(error.message || "Verbindung fehlgeschlagen.", "error");
    } finally {
      $("testBackendButton").disabled = false;
    }
  }

  async function logout() {
    SCANNER.stop();
    stopAutoRefresh();
    try {
      if (login?.token) await BACKEND.request("logout", {}, login.token);
    } catch {
      // Lokale Abmeldung muss auch bei fehlender Verbindung möglich bleiben.
    }
    STORE.clearLogin();
    login = null;
    state = null;
    BACKEND.disconnect();
    showLogin();
    setConnectionStatus("Abgemeldet. Backend-URL bleibt auf diesem Gerät gespeichert.", "idle");
  }

  async function refreshStatistics({ silent = false } = {}) {
    if (!login || refreshInFlight) return false;
    refreshInFlight = true;
    const button = $("refreshButton");
    button.disabled = true;
    button.classList.add("is-refreshing");
    if (!silent) setSyncStatus("Gemeinsamer Stand wird aktualisiert …", "pending");

    try {
      const response = await BACKEND.request("state", {}, login.token);
      if (!response.ok) throw apiError(response);
      applyState(response.state);
      updateVisibleStatistics();

      if (!$("homePanel").classList.contains("hidden")) renderDashboard();
      else if (!$("overviewPanel").classList.contains("hidden")) renderOverview();
      else if (!$("searchPanel").classList.contains("hidden")) renderSearchResults();

      if (!silent) showToast("Gemeinsame Statistik wurde aktualisiert.");
      return true;
    } catch (error) {
      if (error.code === "SESSION_INVALID") {
        await forceRelogin(error.message);
      } else {
        setSyncStatus(error.message || "Aktualisierung fehlgeschlagen.", "error");
        if (!silent) showToast("Aktualisierung fehlgeschlagen.");
      }
      return false;
    } finally {
      refreshInFlight = false;
      button.disabled = false;
      button.classList.remove("is-refreshing");
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    refreshTimer = window.setInterval(() => {
      if (document.hidden || !login || cameraStarting || !$("scanPanel").classList.contains("hidden")) return;
      void refreshStatistics({ silent: true });
    }, C.autoRefreshMs);
  }

  function stopAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = null;
  }

  function applyState(nextState) {
    if (!nextState?.activeEvent || !Array.isArray(nextState.registrations) || !nextState.checkins || !nextState.stats) {
      throw new Error("Das Test-Backend hat unvollständige Daten geliefert.");
    }
    state = nextState;
    if (currentRegistration) currentRegistration = registrationByToken(currentRegistration.token) || currentRegistration;
    renderEvent();
    updateVisibleStatistics();
    setSyncStatus(`Gemeinsamer Stand · ${U.displayTime(state.serverTime)} Uhr · Revision ${state.revision}`, "success");
  }

  function updateVisibleStatistics() {
    if (!state) return;
    const s = state.stats;
    $("headerPresent").textContent = s.present;
    const values = {
      regularCheckedPersons: s.regularCheckedPersons,
      waitCheckedPersons: s.waitCheckedPersons,
      exceptionCheckedPersons: s.exceptionCheckedPersons,
      present: `${s.present} / ${state.activeEvent.maxPersons}`,
      initiallyUnallocated: s.initiallyUnallocated,
      safeFree: s.safeFree
    };
    document.querySelectorAll("[data-stat]").forEach(node => {
      const key = node.dataset.stat;
      if (Object.prototype.hasOwnProperty.call(values, key)) node.textContent = values[key];
    });
  }

  function renderEvent() {
    if (!state) return;
    $("eventTitle").textContent = state.activeEvent.title;
    $("eventDateTime").textContent = `${U.displayDate(state.activeEvent.date)} · ${state.activeEvent.time} Uhr`;
    $("headerCapacity").textContent = state.activeEvent.maxPersons;
  }

  function navigate(target) {
    SCANNER.stop();
    cameraStarting = false;
    lastResultWasSuccess = false;
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

  function renderDashboard() {
    if (!state) return;
    const s = state.stats;
    $("summaryCards").innerHTML = [
      summaryCard("Aktuell anwesend", `${s.present}`, "success", `von ${state.activeEvent.maxPersons}`),
      summaryCard("Regulär eingecheckt", `${s.regularCheckedPersons}`, "info", `${s.regularCheckedBookings} Buchungen`),
      summaryCard("Warteliste eingecheckt", `${s.waitCheckedPersons}`, "warning", `${s.waitCheckedBookings} Buchungen`),
      summaryCard("Stornierte Ausnahmen", `${s.exceptionCheckedPersons}`, s.exceptionCheckedPersons ? "warning" : "info", `${s.exceptionCheckedBookings} Buchungen`),
      summaryCard("Von Anfang an frei", `${s.initiallyUnallocated}`, "info", `${s.confirmedBookedPersons} regulär angemeldet`),
      summaryCard("Sicher freie Plätze", `${s.safeFree}`, s.safeFree ? "success" : "warning", `noch ${s.regularNotCheckedPersons} regulär erwartet`)
    ].join("");

    const scenarioTokens = [
      "T3-A01-VALID", "T3-A02-FAMILY", "T3-A04-ALREADY", "T3-A05-CANCELLED",
      "T3-A06-GROUP", "T3-W01-FIRST", "T3-W06-BLOCKED", "T3-X-WRONG-EVENT"
    ];
    $("scenarioButtons").innerHTML = scenarioTokens.map(token => {
      const reg = registrationByToken(token);
      if (!reg) return "";
      return `<button type="button" class="scenario-button" data-token="${U.escapeHtml(token)}"><strong>${U.escapeHtml(reg.number)}</strong> · ${U.escapeHtml(reg.scenario || reg.name)}</button>`;
    }).join("") + `<button type="button" class="scenario-button" id="resetDemoButton"><strong>↺</strong> Gemeinsame Test-Check-ins zurücksetzen</button>`;

    $("scenarioButtons").querySelectorAll("[data-token]").forEach(button => button.addEventListener("click", () => void processToken(button.dataset.token)));
    $("resetDemoButton").addEventListener("click", resetSharedDemo);
  }

  async function resetSharedDemo() {
    const yes = await confirmModal(
      "Gemeinsame Testdaten zurücksetzen",
      "Alle Check-ins auf allen verbundenen Geräten werden zurückgesetzt. A-04 bleibt als vorbereiteter Doppel-Check-in-Test bestehen.",
      "Für alle Geräte zurücksetzen"
    );
    if (!yes) return;
    try {
      const response = await BACKEND.request("reset", {}, login.token);
      if (!response.ok) throw apiError(response);
      applyState(response.state);
      renderDashboard();
      showToast("Gemeinsame Test-Check-ins wurden zurückgesetzt.");
    } catch (error) {
      handleOperationalError(error);
    }
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
      await SCANNER.start(payload => void handleQrPayload(payload));
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
      await handleQrPayload(payload);
    } catch (error) {
      SCANNER.setStatus(error.message);
    }
  }

  async function handleQrPayload(payload) {
    const text = String(payload || "").trim();
    if (!text.startsWith(C.qrPrefix)) {
      showInvalidCode("Dieser QR-Code gehört nicht zu dieser AVT-Check-in-Testversion.");
      return;
    }
    await processToken(text.slice(C.qrPrefix.length));
  }

  async function processToken(token) {
    const refreshed = await refreshStatistics({ silent: true });
    if (!refreshed && !state) {
      showConnectionError("Die Anmeldung konnte wegen einer fehlenden Serververbindung nicht geprüft werden.");
      return;
    }
    const registration = registrationByToken(token);
    if (!registration) {
      showInvalidCode("Der QR-Code ist unbekannt oder nicht mehr gültig.");
      return;
    }
    currentRegistration = registration;
    currentCounts = U.clone(registration.booked);
    currentExpectedRevision = null;
    renderRegistrationResult();
    panels.forEach(id => $(id).classList.add("hidden"));
    $("resultPanel").classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showInvalidCode(message) {
    currentRegistration = null;
    currentExpectedRevision = null;
    $("resultContent").innerHTML = `<div class="alert alert-danger"><h3>QR-Code nicht gültig</h3><p>${U.escapeHtml(message)}</p></div><button class="primary full-width" data-next-scan type="button">Nächsten QR-Code scannen</button>`;
    $("resultContent").querySelector("[data-next-scan]").addEventListener("click", () => navigate("scan"));
    panels.forEach(id => $(id).classList.add("hidden"));
    $("resultPanel").classList.remove("hidden");
  }

  function showConnectionError(message) {
    $("resultContent").innerHTML = `<div class="alert alert-danger"><h3>Keine Serververbindung</h3><p>${U.escapeHtml(message)}</p><p>Aus Sicherheitsgründen wird ohne gemeinsamen Serverstand kein Check-in gespeichert.</p></div><button class="secondary full-width" data-nav-home type="button">Zur Startseite</button>`;
    $("resultContent").querySelector("[data-nav-home]").addEventListener("click", () => navigate("home"));
    panels.forEach(id => $(id).classList.add("hidden"));
    $("resultPanel").classList.remove("hidden");
  }

  function renderRegistrationResult(editMode = false) {
    const reg = registrationByToken(currentRegistration.token) || currentRegistration;
    currentRegistration = reg;
    const existing = state.checkins[reg.token];
    const eventMismatch = !isCurrentEvent(reg);
    const lowerWait = lowerOpenWaitlist(reg);
    let html = "";

    if (eventMismatch) {
      html += `<div class="alert alert-danger"><h3>Falsche Veranstaltung</h3><p>Dieser QR-Code gehört zur Veranstaltung am <strong>${U.escapeHtml(U.displayDate(reg.eventDate))}</strong>. Aktiv ist ${U.escapeHtml(U.displayDate(state.activeEvent.date))} um ${U.escapeHtml(state.activeEvent.time)} Uhr.</p></div>`;
      html += registrationIdentity(reg);
      html += `<button class="primary full-width" data-next-scan type="button">Nächsten QR-Code scannen</button>`;
      setResultHtml(html);
      return;
    }

    if (existing && !editMode) {
      const actual = U.sumCounts(existing.counts);
      const isCancelledException = reg.status === "cancelled";
      html += `<div class="alert ${isCancelledException ? "alert-warning" : "alert-success"}"><h3>${isCancelledException ? "Bereits als Ausnahme eingecheckt" : "Bereits eingecheckt"}</h3><p>${U.escapeHtml(reg.number)} wurde um <strong>${U.escapeHtml(U.displayTime(existing.checkedAt))} Uhr</strong> mit <strong>${actual} Personen</strong> eingecheckt.</p><p class="muted small">Der gemeinsame Server verhindert einen zweiten Check-in.</p></div>`;
      html += registrationIdentity(reg);
      html += countsReadout(existing.counts);
      html += `<div class="checkin-actions"><button class="secondary full-width" data-edit type="button">Check-in korrigieren</button><button class="primary full-width" data-next-scan type="button">Nächsten QR-Code scannen</button></div>`;
      setResultHtml(html);
      $("resultContent").querySelector("[data-edit]").addEventListener("click", () => {
        currentCounts = U.clone(existing.counts);
        currentExpectedRevision = existing.revision;
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
    if (editMode) buttonLabel = "Korrektur speichern";
    else if (reg.status === "cancelled") {
      buttonLabel = "Stornierte Anmeldung ausnahmsweise einchecken";
      buttonClass = "danger";
    } else if (reg.kind === "waitlist" && lowerWait.length) {
      buttonLabel = "Trotz Reihenfolge einchecken";
      buttonClass = "danger";
    }

    html += `<div class="checkin-actions"><button id="completeCheckin" class="${buttonClass} full-width" type="button">${U.escapeHtml(buttonLabel)}</button><button class="secondary full-width" data-next-scan type="button">Abbrechen und weiter scannen</button></div>`;
    setResultHtml(html);
    $("resultContent").querySelectorAll("[data-counter]").forEach(button => button.addEventListener("click", () => changeCounter(button.dataset.counter, Number(button.dataset.delta))));
    $("completeCheckin").addEventListener("click", () => void completeCheckin(editMode));
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
    const familyHint = Number(currentRegistration?.booked?.family || 0) > 0
      ? `<p class="muted small family-hint">Bei einer Familienanmeldung startet der Check-in mit dem Standardwert ${state.activeEvent.familyDefaultPersons} Personen.</p>`
      : "";
    return `<div class="card"><h3>Personenzahl anpassen</h3><div class="counter-list">${Object.entries(counts).filter(([, value]) => value > 0).map(([key, value]) => `<div class="counter-row"><div class="counter-label">${U.escapeHtml(categoryMeta[key].label)}</div><button type="button" class="counter-button" data-counter="${key}" data-delta="-1" aria-label="${U.escapeHtml(categoryMeta[key].label)} verringern">−</button><div id="counter-${key}" class="counter-value">${value}</div><button type="button" class="counter-button" data-counter="${key}" data-delta="1" aria-label="${U.escapeHtml(categoryMeta[key].label)} erhöhen">+</button></div>`).join("")}</div>${familyHint}</div>`;
  }

  function changeCounter(key, delta) {
    currentCounts[key] = Math.max(0, Math.min(30, Number(currentCounts[key] || 0) + delta));
    const value = $(`counter-${key}`);
    if (value) value.textContent = currentCounts[key];
    $("totalPersons").textContent = U.sumCounts(currentCounts);
    $("completeCheckin").disabled = U.sumCounts(currentCounts) < 1;
  }

  async function completeCheckin(editMode, confirmationKey = "") {
    const reg = currentRegistration;
    const total = U.sumCounts(currentCounts);
    if (total < 1) {
      showToast("Mindestens eine Person muss eingecheckt werden.");
      return;
    }

    const button = $("completeCheckin");
    if (button) {
      button.disabled = true;
      button.textContent = "Wird gespeichert …";
    }

    try {
      const existing = state.checkins[reg.token] || null;
      const response = await BACKEND.request("checkin", {
        registrationToken: reg.token,
        counts: U.clone(currentCounts),
        expectedRevision: editMode ? currentExpectedRevision : null,
        confirmationKey
      }, login.token);

      if (!response.ok) throw apiError(response);
      if (response.state) applyState(response.state);

      if (response.confirmationRequired) {
        const title = reg.status === "cancelled" ? "Stornierte Anmeldung bestätigen" : "Ausnahme bestätigen";
        const confirmed = await confirmModal(
          title,
          `<p>${response.warnings.map(text => U.escapeHtml(text)).join("</p><p>")}</p><p>Die Personen werden auf die Kapazität angerechnet und gesondert ausgewiesen.</p>`,
          reg.status === "cancelled" ? "Als Ausnahme einchecken" : "Trotzdem einchecken",
          true
        );
        if (confirmed) return completeCheckin(editMode, response.confirmationKey);
        renderRegistrationResult(editMode);
        return;
      }

      currentRegistration = registrationByToken(reg.token) || reg;
      currentExpectedRevision = null;
      renderSuccess(currentRegistration, Boolean(response.saved?.corrected));
    } catch (error) {
      if (["ALREADY_CHECKED", "CONFLICT"].includes(error.code) && error.data?.state) {
        applyState(error.data.state);
        currentRegistration = registrationByToken(reg.token) || reg;
        currentCounts = U.clone(currentRegistration.booked);
        currentExpectedRevision = null;
        showToast(error.message);
        renderRegistrationResult(false);
      } else {
        handleOperationalError(error);
        renderRegistrationResult(editMode);
      }
    }
  }

  function renderSuccess(reg, corrected) {
    const actual = state.checkins[reg.token];
    const total = U.sumCounts(actual.counts);
    const s = state.stats;
    const isCancelledException = reg.status === "cancelled";
    const heading = corrected ? "Korrektur gespeichert" : (isCancelledException ? "Ausnahme-Check-in erfolgreich" : "Check-in erfolgreich");
    let html = `<div class="alert ${isCancelledException ? "alert-warning" : "alert-success"}"><h3>${heading}</h3><p><strong>${U.escapeHtml(reg.name)}</strong> · ${U.escapeHtml(reg.number)}</p><p><strong>${total} Personen</strong> wurden auf dem gemeinsamen Server übernommen.</p>${isCancelledException ? "<p>Diese Personen werden als stornierte Ausnahme gezählt.</p>" : ""}</div>`;
    html += countsReadout(actual.counts);
    html += `<div class="card"><h3>Aktueller gemeinsamer Gesamtstand</h3><dl class="detail-grid"><dt>Regulär eingecheckt</dt><dd data-stat="regularCheckedPersons">${s.regularCheckedPersons}</dd><dt>Warteliste eingecheckt</dt><dd data-stat="waitCheckedPersons">${s.waitCheckedPersons}</dd><dt>Stornierte Ausnahmen</dt><dd data-stat="exceptionCheckedPersons">${s.exceptionCheckedPersons}</dd><dt>Gesamt anwesend</dt><dd data-stat="present">${s.present} / ${state.activeEvent.maxPersons}</dd><dt>Von Anfang an nicht vergeben</dt><dd data-stat="initiallyUnallocated">${s.initiallyUnallocated}</dd><dt>Sicher freie Plätze</dt><dd data-stat="safeFree">${s.safeFree}</dd></dl></div>`;
    html += `<div class="checkin-actions"><button class="primary full-width" data-next-scan type="button">Nächsten QR-Code scannen</button><button class="secondary full-width" data-overview type="button">Gesamtübersicht öffnen</button></div>`;
    setResultHtml(html);
    lastResultWasSuccess = true;
    $("resultContent").querySelector("[data-overview]").addEventListener("click", () => navigate("overview"));
  }

  function renderSearchResults() {
    if (!state) return;
    const query = $("searchInput").value.trim().toLocaleLowerCase("de-DE");
    const candidates = state.registrations.filter(reg => isCurrentEvent(reg));
    const results = (query ? candidates.filter(reg => `${reg.number} ${reg.name}`.toLocaleLowerCase("de-DE").includes(query)) : candidates.slice(0, 8)).slice(0, 15);
    if (!results.length) {
      $("searchResults").innerHTML = `<div class="empty-state">Keine passende Anmeldung gefunden.</div>`;
      return;
    }
    $("searchResults").innerHTML = results.map(reg => {
      const existing = state.checkins[reg.token];
      let status;
      if (reg.status === "cancelled" && existing) status = ["Ausnahme", "tag-exception"];
      else if (reg.status === "cancelled") status = ["Storniert", "tag-cancelled"];
      else if (existing) status = ["Eingecheckt", "tag-checked"];
      else if (reg.kind === "waitlist") status = ["Warteliste", "tag-wait"];
      else status = ["Regulär", "tag-regular"];
      return `<button class="search-result" type="button" data-token="${U.escapeHtml(reg.token)}"><span class="search-number">${U.escapeHtml(reg.number)}</span><span class="search-name">${U.escapeHtml(reg.name)}</span><span class="status-tag ${status[1]}">${status[0]}</span></button>`;
    }).join("");
    $("searchResults").querySelectorAll("[data-token]").forEach(button => button.addEventListener("click", () => void processToken(button.dataset.token)));
  }

  function renderOverview() {
    if (!state) return;
    const s = state.stats;
    const checkedRows = state.registrations
      .filter(reg => state.checkins[reg.token] && isCurrentEvent(reg))
      .sort((a, b) => new Date(state.checkins[b.token].checkedAt) - new Date(state.checkins[a.token].checkedAt));
    const openRegular = state.registrations.filter(reg => reg.kind === "regular" && reg.status === "active" && isCurrentEvent(reg) && !state.checkins[reg.token]);

    $("overviewContent").innerHTML = `
      <div class="summary-grid">
        ${summaryCard("Gesamt anwesend", s.present, "success", `von ${state.activeEvent.maxPersons}`)}
        ${summaryCard("Regulär", s.regularCheckedPersons, "info", `${s.regularCheckedBookings} Buchungen`)}
        ${summaryCard("Warteliste", s.waitCheckedPersons, "warning", `${s.waitCheckedBookings} Buchungen`)}
        ${summaryCard("Stornierte Ausnahmen", s.exceptionCheckedPersons, s.exceptionCheckedPersons ? "warning" : "info", `${s.exceptionCheckedBookings} Buchungen`)}
        ${summaryCard("Von Anfang an frei", s.initiallyUnallocated, "info", `${s.confirmedBookedPersons} regulär angemeldet`)}
        ${summaryCard("Sicher frei", s.safeFree, s.safeFree ? "success" : "warning", "Plätze")}
      </div>
      <div class="card overview-section">
        <h3>Kapazitätsbetrachtung</h3>
        <dl class="detail-grid">
          <dt>Maximale Kapazität</dt><dd>${state.activeEvent.maxPersons}</dd>
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
        <h3>Bereits eingecheckt – alle Geräte</h3>
        <div class="overview-list">${checkedRows.length ? checkedRows.map(overviewRow).join("") : `<div class="empty-state">Noch keine Check-ins.</div>`}</div>
      </div>
      <div class="card overview-section">
        <h3>Regulär noch offen</h3>
        <p class="muted small">${openRegular.length} Buchungen · ${s.regularNotCheckedPersons} Personen</p>
        <div class="overview-list">${openRegular.slice(0, 12).map(openRow).join("")}${openRegular.length > 12 ? `<div class="empty-state">… und ${openRegular.length - 12} weitere</div>` : ""}</div>
      </div>
      <div class="card overview-section">
        <h3>Offene Warteliste in Reihenfolge</h3>
        <div class="waiting-order">${s.openWait.length ? s.openWait.map(reg => `<span class="wait-chip">${U.escapeHtml(reg.number)} · ${reg.bookedPersons}</span>`).join("") : `<span class="muted">Keine offenen Wartelisteneinträge.</span>`}</div>
      </div>`;

    $("overviewContent").querySelectorAll("[data-token]").forEach(button => button.addEventListener("click", () => void processToken(button.dataset.token)));
  }

  function overviewRow(reg) {
    const record = state.checkins[reg.token];
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
    return state?.registrations?.find(reg => reg.token === token) || null;
  }

  function isCurrentEvent(reg) {
    return reg.eventId === state.activeEvent.id && reg.eventDate === state.activeEvent.date;
  }

  function waitNumber(reg) {
    const match = /^W-(\d+)$/i.exec(reg.number);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  }

  function lowerOpenWaitlist(reg) {
    if (reg.kind !== "waitlist") return [];
    const current = waitNumber(reg);
    return state.registrations.filter(item =>
      item.kind === "waitlist" &&
      item.status === "active" &&
      isCurrentEvent(item) &&
      waitNumber(item) < current &&
      !state.checkins[item.token]
    ).sort((a, b) => waitNumber(a) - waitNumber(b));
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

  function setConnectionStatus(message, tone) {
    const element = $("backendStatus");
    element.textContent = message || "";
    element.dataset.tone = tone || "idle";
  }

  function setSyncStatus(message, tone) {
    const element = $("syncStatus");
    if (!element) return;
    element.textContent = message || "";
    element.dataset.tone = tone || "idle";
  }

  function setLoginBusy(busy, statusText = "") {
    $("loginSubmitButton").disabled = busy;
    $("testBackendButton").disabled = busy;
    $("backendUrlInput").disabled = busy;
    $("passwordInput").disabled = busy;
    if (statusText) setConnectionStatus(statusText, "pending");
  }

  function apiError(response) {
    const error = new Error(response?.message || "Backend-Aufruf fehlgeschlagen.");
    error.code = response?.code || "BACKEND_ERROR";
    error.data = response?.data || null;
    return error;
  }

  function handleOperationalError(error) {
    if (error?.code === "SESSION_INVALID") {
      void forceRelogin(error.message);
      return;
    }
    setSyncStatus(error?.message || "Serverfehler.", "error");
    showToast(error?.message || "Vorgang fehlgeschlagen.");
  }

  async function forceRelogin(message) {
    STORE.clearLogin();
    login = null;
    showLogin();
    $("loginError").textContent = message || "Bitte erneut anmelden.";
    setConnectionStatus(message || "Anmeldung abgelaufen.", "error");
  }

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.add("hidden"), 3000);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) SCANNER.stop();
    else if (login) void refreshStatistics({ silent: true });
  });
  window.addEventListener("pagehide", () => SCANNER.stop());
  document.addEventListener("DOMContentLoaded", () => {
    void init();
    if ("serviceWorker" in navigator && ["http:", "https:"].includes(location.protocol)) {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    }
  });
})();
