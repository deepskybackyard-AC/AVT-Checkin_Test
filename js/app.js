"use strict";
(function () {
  const C = window.AVT_CONFIG;
  const U = window.AVT_UTIL;
  const S = window.AVT_STORE;
  const SC = window.AVT_SCANNER;
  const $ = id => document.getElementById(id);

  const panels = ["homePanel", "scanPanel", "searchPanel", "manualPanel", "donationPanel", "resultPanel", "overviewPanel"];
  const navigablePanels = new Set(["scan", "search", "manual", "donation", "overview"]);
  const categories = {
    adult: { label: "Erwachsene", price: C.prices.adult },
    child: { label: "Kinder unter 6", price: C.prices.child },
    youth: { label: "Jugendliche / Schüler:innen", price: C.prices.youth },
    student: { label: "Studierende", price: C.prices.student }
  };
  const correctionReasons = (C.correctionReasons || [])
    .filter(reason => reason.active !== false)
    .sort((left, right) => Number(left.order || 0) - Number(right.order || 0));

  let data = S.load();
  let current = null;
  let counts = null;
  let tariffMode = "regular";
  let correctedEntry = "";
  let correctionReason = "";
  let showAllCategories = false;
  let searchFilter = "open";
  let activeNav = "";
  let modalResolve = null;
  let backendReady = false;
  let onlineState = "local";
  let pollTimer = null;

  function init() {
    // Die Veranstaltungsdetails werden seit test.9 nur noch im Info-Dialog
    // angezeigt. Optionale Elemente werden nur befüllt, wenn sie existieren.
    const eventTitleElement = $("eventTitle");
    const eventTimeElement = $("eventTime");
    if (eventTitleElement) eventTitleElement.textContent = C.event.title;
    if (eventTimeElement) eventTimeElement.textContent = `${U.date(C.event.date)} · ${C.event.time} Uhr`;

    document.querySelectorAll("[data-nav]").forEach(button => {
      button.addEventListener("click", () => nav(button.dataset.nav));
    });
    document.querySelectorAll("[data-search-filter]").forEach(button => {
      button.addEventListener("click", () => {
        searchFilter = button.dataset.searchFilter;
        renderSearch();
      });
    });

    $("loginForm").addEventListener("submit", login);
    $("passwordToggle").addEventListener("click", togglePasswordVisibility);
    $("eventInfoTopBtn").addEventListener("click", showEventDetails);
    $("refreshBtn").addEventListener("click", refreshLocalData);
    $("logoutTopBtn").addEventListener("click", () => { S.clearLogin(); showLogin(); });
    $("resetBtn").addEventListener("click", reset);
    $("saveDonationBtn").addEventListener("click", saveDonation);
    $("searchInput").addEventListener("input", renderSearch);
    $("cameraPlaceholder").addEventListener("click", startCamera);
    $("startCameraButton").addEventListener("click", startCamera);
    $("stopCameraButton").addEventListener("click", () => SC.stop());
    $("imageInput").addEventListener("change", async event => {
      try {
        const result = await SC.decodeImageFile(event.target.files?.[0]);
        handlePayload(result.data);
      } catch (error) {
        toast(error.message || "QR-Code nicht erkannt.");
      }
    });
    $("modalCancel").addEventListener("click", () => closeModal(false));
    $("modalConfirm").addEventListener("click", () => closeModal(true));

    if (S.getLogin()) showMain();
    else showLogin();
  }


  function setBackendStatus(kind, text) {
    const target = $("backendStatus");
    if (!target) return;
    target.className = `backend-status ${kind || "local"}`;
    target.textContent = text;
  }

  function applySnapshot(snapshot) {
    if (!snapshot) return;
    if (snapshot.event) {
      C.event.id = snapshot.event.id;
      C.event.title = snapshot.event.title;
      C.event.date = snapshot.event.date;
      C.event.time = snapshot.event.time;
      C.event.maxPersons = snapshot.event.maxPersons;
    }
    if (snapshot.prices) Object.assign(C.prices, snapshot.prices);
    if (snapshot.familyRule) Object.assign(C.familyRule, snapshot.familyRule);
    if (Array.isArray(snapshot.correctionReasons)) {
      correctionReasons.splice(0, correctionReasons.length, ...snapshot.correctionReasons
        .filter(reason => reason.active !== false)
        .sort((left, right) => Number(left.order || 0) - Number(right.order || 0)));
    }
    if (Array.isArray(snapshot.registrations)) {
      window.AVT_REGISTRATIONS = Object.freeze(snapshot.registrations);
    }
    if (snapshot.data) {
      data = {
        checkins: snapshot.data.checkins || {},
        manual: snapshot.data.manual || [],
        donations: snapshot.data.donations || [],
        sequence: Number(snapshot.data.sequence || 1)
      };
      S.save(data);
    }
  }

  async function initializeBackend() {
    if (!window.AVT_BACKEND?.isConfigured()) {
      backendReady = false;
      setBackendStatus("local", "Lokaler Modus · Backend noch nicht konfiguriert");
      applySnapshot(window.AVT_BACKEND?.loadCached?.());
      renderAll();
      return;
    }

    try {
      const snapshot = await AVT_BACKEND.bootstrap();
      applySnapshot(snapshot);
      backendReady = true;
      onlineState = "online";
      setBackendStatus("online", `Online · gemeinsamer Test · ${AVT_BACKEND.queueCount()} ausstehend`);
      startPolling();
      if (AVT_BACKEND.queueCount()) await syncOfflineQueue();
      renderAll();
    } catch (error) {
      backendReady = false;
      onlineState = "offline";
      const cached = AVT_BACKEND.loadCached();
      if (cached) applySnapshot(cached);
      setBackendStatus("offline", `Offline · lokaler Stand · ${AVT_BACKEND.queueCount()} ausstehend`);
      renderAll();
    }
  }

  function startPolling() {
    if (pollTimer) window.clearInterval(pollTimer);
    const seconds = Math.max(5, Number(C.backend?.pollSeconds || 15));
    pollTimer = window.setInterval(async () => {
      if (!$("mainView")?.classList.contains("hidden")) {
        await refreshSharedState({ quiet: true });
      }
    }, seconds * 1000);
  }

  async function refreshSharedState({ quiet = false } = {}) {
    if (!window.AVT_BACKEND?.isConfigured()) {
      data = S.load();
      renderAll();
      if (!quiet) toast("Lokale Statistik aktualisiert.");
      return;
    }

    try {
      if (AVT_BACKEND.queueCount()) await syncOfflineQueue({ quiet: true });
      const snapshot = await AVT_BACKEND.state();
      applySnapshot(snapshot);
      backendReady = true;
      onlineState = "online";
      setBackendStatus("online", `Online · gemeinsamer Test · ${AVT_BACKEND.queueCount()} ausstehend`);
      renderAll();
      if (!$("searchPanel").classList.contains("hidden")) renderSearch();
      if (!$("donationPanel").classList.contains("hidden")) renderDonationPanel();
      if (!quiet) toast("Gemeinsamer Stand aktualisiert.");
    } catch (error) {
      onlineState = "offline";
      setBackendStatus("offline", `Offline · lokaler Stand · ${AVT_BACKEND.queueCount()} ausstehend`);
      data = S.load();
      renderAll();
      if (!quiet) toast("Offline: lokaler Stand angezeigt.");
    }
  }

  async function syncOfflineQueue({ quiet = false } = {}) {
    if (!window.AVT_BACKEND?.isConfigured() || !AVT_BACKEND.queueCount()) return;
    try {
      const result = await AVT_BACKEND.syncQueue();
      if (result.data) applySnapshot(result.data);
      if (result.failed) {
        setBackendStatus("offline", `Synchronisierung offen · ${result.failed} ausstehend`);
        if (!quiet) toast(`${result.failed} Offline-Vorgänge noch offen.`);
      } else {
        setBackendStatus("online", "Online · Offline-Vorgänge synchronisiert");
        if (!quiet && result.synced) toast(`${result.synced} Offline-Vorgänge synchronisiert.`);
      }
    } catch (error) {
      setBackendStatus("offline", `Offline · ${AVT_BACKEND.queueCount()} ausstehend`);
      if (!quiet) toast("Synchronisierung derzeit nicht möglich.");
    }
  }

  function togglePasswordVisibility() {
    const input = $("password");
    const toggle = $("passwordToggle");
    const showPassword = input.type === "password";

    input.type = showPassword ? "text" : "password";
    toggle.setAttribute("aria-pressed", showPassword ? "true" : "false");
    toggle.setAttribute("aria-label", showPassword ? "Passwort ausblenden" : "Passwort anzeigen");
    toggle.setAttribute("title", showPassword ? "Passwort ausblenden" : "Passwort anzeigen");

    toggle.querySelector(".password-eye-open").classList.toggle("hidden", showPassword);
    toggle.querySelector(".password-eye-closed").classList.toggle("hidden", !showPassword);

    input.focus({ preventScroll: true });
    const valueLength = input.value.length;
    try {
      input.setSelectionRange(valueLength, valueLength);
    } catch {}
  }

  function scrollContainer() {
    return document.querySelector("main");
  }

  function setScrollTopZero() {
    const container = scrollContainer();
    if (container) container.scrollTop = 0;
  }

  function forcePageTop() {
    document.activeElement?.blur();
    const container = scrollContainer();
    if (!container) return;

    container.scrollTop = 0;
    requestAnimationFrame(() => {
      container.scrollTop = 0;
      requestAnimationFrame(() => {
        container.scrollTop = 0;
      });
    });

    [50, 150, 350, 700].forEach(delay => {
      window.setTimeout(() => {
        container.scrollTop = 0;
      }, delay);
    });
  }

  function login(event) {
    event.preventDefault();
    if ($("password").value !== C.password) {
      $("loginError").textContent = "Passwort ist falsch.";
      return;
    }
    S.setLogin(new FormData(event.currentTarget).get("mode") || "day");
    $("password").value = "";
    $("password").type = "password";
    $("passwordToggle").setAttribute("aria-pressed", "false");
    $("passwordToggle").setAttribute("aria-label", "Passwort anzeigen");
    $("passwordToggle").setAttribute("title", "Passwort anzeigen");
    $("passwordToggle").querySelector(".password-eye-open").classList.remove("hidden");
    $("passwordToggle").querySelector(".password-eye-closed").classList.add("hidden");
    $("loginError").textContent = "";
    document.activeElement?.blur();
    showMain();
    forcePageTop();
  }

  function showLogin() {
    $("loginView").classList.remove("hidden");
    $("mainView").classList.add("hidden");
    $("headActions").classList.add("hidden");
    forcePageTop();
  }

  function showMain() {
    $("loginView").classList.add("hidden");
    $("mainView").classList.remove("hidden");
    $("headActions").classList.remove("hidden");
    nav("home", { forceTop: true });
    updateHeaderStats();
    initializeBackend();
    forcePageTop();
  }

  function nav(name, options = {}) {
    SC.stop();
    panels.forEach(panel => $(panel).classList.add("hidden"));
    const panel = $(name + "Panel") || $("homePanel");
    panel.classList.remove("hidden");

    if (navigablePanels.has(name)) activeNav = name;
    else if (name === "home") activeNav = "";
    updateActiveNavigation();

    if (name === "home") renderHome();
    if (name === "overview") renderOverview();
    if (name === "donation") renderDonationPanel();
    if (name === "search") {
      if (!options.keepSearch) {
        $("searchInput").value = "";
        searchFilter = "open";
      }
      renderSearch();
      if (!options.noFocus) setTimeout(() => $("searchInput").focus(), 30);
    }
    if (name === "manual") {
      current = null;
      counts = { adult: 0, child: 0, youth: 0, student: 0 };
      resetPriceState();
      renderManual();
    }
    if (name === "scan") { resetCamera(); startCamera(); }

    if (name === "home" || name === "donation" || options.forceTop) {
      forcePageTop();
    } else if (name !== "result") {
      scrollContainer()?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function updateActiveNavigation() {
    document.querySelectorAll(".nav-icon[data-nav]").forEach(button => {
      const isActive = button.dataset.nav === activeNav;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-current", isActive ? "page" : "false");
    });
  }

  async function refreshLocalData() {
    await refreshSharedState({ quiet: false });
  }

  function bookedConfirmed() {
    return window.AVT_REGISTRATIONS
      .filter(registration => registration.status === "confirmed" && registration.eventId === C.event.id)
      .reduce((sum, registration) => sum + U.sumCounts(registration.booked), 0);
  }

  function stats() {
    let regular = 0;
    let wait = 0;
    let exceptions = 0;
    let manual = 0;
    let entry = 0;

    Object.values(data.checkins).forEach(checkin => {
      const persons = U.sumCounts(checkin.counts);
      entry += Number(checkin.paid) || 0;
      if (checkin.kind === "regular") regular += persons;
      else if (checkin.kind === "waitlist") wait += persons;
      else exceptions += persons;
    });

    data.manual.forEach(checkin => {
      manual += U.sumCounts(checkin.counts);
      entry += Number(checkin.paid) || 0;
    });

    const donations = data.donations.reduce((sum, donation) => sum + (Number(donation.amount) || 0), 0);
    const present = regular + wait + exceptions + manual;
    const confirmed = bookedConfirmed();
    const initially = Math.max(0, C.event.maxPersons - confirmed);

    let expected = 0;
    window.AVT_REGISTRATIONS
      .filter(registration => registration.status === "confirmed" && registration.eventId === C.event.id)
      .forEach(registration => {
        if (!data.checkins[registration.token]) expected += U.sumCounts(registration.booked);
      });

    const regularOpen = expected;
    const waitOpen = window.AVT_REGISTRATIONS
      .filter(registration =>
        registration.eventId === C.event.id &&
        registration.status === "waitlist" &&
        !data.checkins[registration.token]
      )
      .reduce((sum, registration) => sum + U.sumCounts(registration.booked), 0);

    const safe = Math.max(0, C.event.maxPersons - present - regularOpen);

    return {
      regular,
      wait,
      exceptions,
      manual,
      present,
      confirmed,
      initially,
      expected: regularOpen,
      regularOpen,
      waitOpen,
      safe,
      entry,
      donations,
      total: entry + donations
    };
  }

  function updateHeaderStats() {
    const currentStats = stats();
    $("presentTop").textContent = currentStats.present;
    $("safeFreeTop").textContent = currentStats.safe;
  }

  function showEventDetails() {
    const currentStats = stats();
    $("modalTitle").textContent = "Veranstaltungsdetails";
    $("modalBody").innerHTML = `
      <div class="card" style="margin:0;padding:12px;">
        <p><strong>${U.esc(C.event.title)}</strong></p>
        <p>${U.date(C.event.date)} · ${U.esc(C.event.time)} Uhr</p>
        <p>Lokale Ein-Gerät-Testversion</p>
      </div>
      <div class="card" style="margin:12px 0 0 0;padding:12px;">
        <dl class="detail-grid">
          <dt>Eingecheckt</dt><dd>${currentStats.present} / ${C.event.maxPersons}</dd>
          <dt>Sicher freie Plätze</dt><dd>${currentStats.safe}</dd>
        </dl>
      </div>`;
    $("modalConfirm").textContent = "Schließen";
    $("modalCancel").classList.add("hidden");
    $("modal").classList.remove("hidden");
    modalResolve = () => {
      $("modalCancel").classList.remove("hidden");
    };
  }

  function renderAll() {
    renderHome();
    renderOverview();
    updateHeaderStats();
  }

  function renderHome() {
    const currentStats = stats();
    $("presentTop").textContent = currentStats.present;
    $("summary").innerHTML = [
      summaryCard("Anwesend", currentStats.present, `von ${C.event.maxPersons}`),
      summaryCard("Sicher frei", currentStats.safe, `${currentStats.expected} regulär erwartet`),
      summaryCard("Eintritt", U.euro(currentStats.entry), "erfasst"),
      summaryCard("Spenden", U.euro(currentStats.donations), "separat")
    ].join("");

    $("scenarios").innerHTML = window.AVT_REGISTRATIONS
      .map(registration => `<button data-token="${registration.token}"><strong>${registration.number}</strong> · ${U.esc(registration.scenario)}</button>`)
      .join("");

    $("scenarios").querySelectorAll("[data-token]").forEach(button => {
      button.onclick = () => processToken(button.dataset.token);
    });
  }

  function summaryCard(label, value, note) {
    return `<div class="summary-card"><small>${U.esc(label)}</small><strong>${U.esc(value)}</strong><small>${U.esc(note)}</small></div>`;
  }

  function resetCamera() {
    $("cameraVideo").classList.add("hidden");
    $("cameraPlaceholder").classList.remove("hidden");
    $("startCameraButton").classList.remove("hidden");
    $("stopCameraButton").classList.add("hidden");
    $("scanLine").classList.add("hidden");
    $("cameraStatus").textContent = "Kamera wird automatisch gestartet …";
  }

  async function startCamera() {
    try {
      await SC.start(value => handlePayload(value));
      $("cameraVideo").classList.remove("hidden");
      $("cameraPlaceholder").classList.add("hidden");
      $("startCameraButton").classList.add("hidden");
      $("stopCameraButton").classList.remove("hidden");
      $("scanLine").classList.remove("hidden");
    } catch (error) {
      $("cameraStatus").textContent = error.message || "Kamera konnte nicht gestartet werden.";
    }
  }

  function handlePayload(rawValue) {
    SC.stop();
    let token = String(rawValue || "").trim();
    if (token.startsWith(C.qrPrefix)) token = token.slice(C.qrPrefix.length);
    processToken(token);
  }

  function resetPriceState() {
    tariffMode = "regular";
    correctedEntry = "";
    correctionReason = "";
  }

  function processToken(token) {
    const registration = window.AVT_REGISTRATIONS.find(item => item.token === token);
    if (!registration) {
      showMessage("Unbekannter QR-Code", "Dieser QR-Code gehört nicht zu den Testanmeldungen.", "dangerbox");
      return;
    }

    current = registration;
    counts = U.clone(registration.booked);
    showAllCategories = false;
    resetPriceState();
    renderResult();
  }

  function activeEventRegistrations() {
    return window.AVT_REGISTRATIONS.filter(registration => registration.eventId === C.event.id);
  }

  function renderSearch() {
    document.querySelectorAll("[data-search-filter]").forEach(button => {
      button.classList.toggle("active", button.dataset.searchFilter === searchFilter);
    });

    const query = $("searchInput").value.trim().toLowerCase();
    const list = activeEventRegistrations().filter(registration => {
      const checked = Boolean(data.checkins[registration.token]);
      if (searchFilter === "open" && checked) return false;
      if (searchFilter === "checked" && !checked) return false;
      const searchableIds = (registration.ids || [registration.number]).join(" ").toLowerCase();
      if (query &&
          !registration.number.toLowerCase().includes(query) &&
          !registration.name.toLowerCase().includes(query) &&
          !searchableIds.includes(query)) return false;
      return true;
    });

    $("searchResults").innerHTML = list.length
      ? list.map(searchResultHtml).join("")
      : `<p class="muted">Für diesen Filter wurde keine Anmeldung gefunden.</p>`;

    $("searchResults").querySelectorAll("[data-token]").forEach(button => {
      button.onclick = () => processToken(button.dataset.token);
    });
  }

  function searchResultHtml(registration) {
    const checkin = data.checkins[registration.token];
    let stateClass = "";
    let stateText = labelStatus(registration.status);

    if (checkin) {
      stateClass = "checked";
      stateText = `Eingecheckt · ${U.sumCounts(checkin.counts)}`;
    } else if (registration.status === "waitlist") {
      stateClass = "wait";
    } else if (registration.status === "cancelled") {
      stateClass = "cancelled";
    }

    const idCount = (registration.ids || [registration.number]).length;
    return `<button class="registration-entry" data-token="${registration.token}">
      <span class="registration-entry-main"><strong>${U.esc(registration.name)}</strong><small>${U.sumCounts(registration.booked)} Personen · ${idCount} IDs</small></span>
      <span class="registration-state ${stateClass}">${U.esc(stateText)}</span>
    </button>`;
  }

  function renderResult() {
    panels.forEach(panel => $(panel).classList.add("hidden"));
    $("resultPanel").classList.remove("hidden");
    updateActiveNavigation();

    if (current.eventId !== C.event.id) {
      showMessage("Falsche Veranstaltung", `${current.number} gehört nicht zur aktiven Veranstaltung.`, "dangerbox");
      return;
    }

    const existing = data.checkins[current.token];
    if (existing) {
      showMessage("Bereits eingecheckt", `${current.number} wurde bereits mit ${U.sumCounts(existing.counts)} Personen eingecheckt.`, "warning", true);
      return;
    }

    const waitBlock = current.status === "waitlist" ? earlierWaitIds() : [];
    const tone = current.status === "cancelled" ? "dangerbox" : current.status === "waitlist" ? "warning" : "";
    let warning = "";

    if (current.status === "cancelled") {
      warning = '<div class="card dangerbox"><strong>Stornierte Anmeldung</strong><p>Ein Check-in ist nur als ausdrückliche Ausnahme möglich.</p></div>';
    }
    if (waitBlock.length) {
      warning = `<div class="card warning"><strong>Diese Wartelistenanmeldung ist noch nicht an der Reihe.</strong><p>Vorher sind noch folgende Wartelisten-IDs offen:</p><ul class="wait-warning-list">${waitBlock.map(id => `<li>${U.esc(id)}</li>`).join("")}</ul><p>Ein Check-in ist nach zusätzlicher Bestätigung trotzdem möglich.</p></div>`;
    }

    $("resultContent").innerHTML = `
      <div class="card ${tone}">
        <div class="result-head result-head-compact">
          <div><h2>${U.esc(current.name)}</h2></div>
          <div class="result-actions">
            <span class="badge">${labelStatus(current.status)}</span>
            <button id="showIdsButton" class="ids-button secondary" type="button">IDs (${(current.ids || [current.number]).length})</button>
          </div>
        </div>
      </div>
      ${warning}
      ${counterHtml(false)}
      ${priceHtml(`<button id="completeBtn" class="primary checkin-side-button" type="button">${
        current.status === "cancelled"
          ? "Ausnahme einchecken"
          : current.status === "waitlist"
            ? "Warteliste einchecken"
            : "Check-in abschließen"
      }</button>`)}`;

    bindCounters(false);
    bindPrice();
    $("showIdsButton").onclick = showCurrentIds;
    $("completeBtn").onclick = completeExisting;
  }

  function showCurrentIds() {
    const ids = current?.ids || [current?.number].filter(Boolean);
    $("modalTitle").textContent = `Check-in-IDs (${ids.length})`;
    $("modalBody").innerHTML = `<div class="ids-list">${ids.map(id => `<span>${U.esc(id)}</span>`).join("")}</div>`;
    $("modalConfirm").textContent = "Schließen";
    $("modalCancel").classList.add("hidden");
    $("modal").classList.remove("hidden");

    modalResolve = () => {
      $("modalCancel").classList.remove("hidden");
    };
  }

  function labelStatus(status) {
    if (status === "confirmed") return "Reguläre Anmeldung";
    if (status === "waitlist") return "Warteliste";
    return "Storniert";
  }

  function waitIdNumber(id) {
    const match = String(id || "").match(/^W-(\d+)$/i);
    return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
  }

  function earlierWaitIds() {
    const currentIds = current?.ids || [current?.number].filter(Boolean);
    const currentMinimum = Math.min(...currentIds.map(waitIdNumber));

    return window.AVT_REGISTRATIONS
      .filter(registration =>
        registration.eventId === C.event.id &&
        registration.status === "waitlist" &&
        registration.token !== current?.token &&
        !data.checkins[registration.token]
      )
      .flatMap(registration => registration.ids || [registration.number])
      .filter(id => waitIdNumber(id) < currentMinimum)
      .sort((left, right) => waitIdNumber(left) - waitIdNumber(right));
  }

  function counterHtml(isManual) {
    const visibleKeys = Object.keys(categories).filter(key => isManual || showAllCategories || Number(counts[key] || 0) > 0);
    const toggle = isManual ? "" : `<button id="categoryToggle" class="category-toggle secondary" type="button">${showAllCategories ? "- weniger" : "+ alle"}</button>`;

    return `<div class="card">
      <div class="counter-heading"><h3>Personenzahl anpassen</h3>${toggle}</div>
      ${visibleKeys.map(key => `
        <div class="counter-row">
          <span>${categories[key].label}</span>
          <button data-category="${key}" data-delta="-1" type="button">−</button>
          <div class="counter-value">${counts[key] || 0}</div>
          <button data-category="${key}" data-delta="1" type="button">+</button>
        </div>`).join("")}
      <p><strong>Gesamt: ${U.sumCounts(counts)} Personen</strong></p>
    </div>`;
  }

  function bindCounters(isManual) {
    document.querySelectorAll("[data-category]").forEach(button => {
      button.onclick = () => {
        const key = button.dataset.category;
        counts[key] = Math.max(0, Number(counts[key] || 0) + Number(button.dataset.delta));
        if (tariffMode === "family" && !familyEligible()) tariffMode = "regular";
        if (isManual) renderManual();
        else renderResult();
      };
    });

    if (!isManual && $("categoryToggle")) {
      $("categoryToggle").onclick = () => {
        showAllCategories = !showAllCategories;
        renderResult();
      };
    }
  }

  function regularPrice() {
    return Object.keys(categories).reduce((sum, key) => sum + Number(counts[key] || 0) * categories[key].price, 0);
  }

  function familyEligible() {
    const reducedPersons =
      Number(counts.child || 0) +
      Number(counts.youth || 0) +
      Number(counts.student || 0);

    const personRuleIsMet =
      Number(counts.adult || 0) >= Number(C.familyRule.minAdults || 1) &&
      reducedPersons >= Number(C.familyRule.minReducedPersons || 1);

    const priceRuleIsMet =
      C.familyRule.requireRegularPriceAboveFamilyPrice === false ||
      regularPrice() > Number(C.prices.family || 0);

    return personRuleIsMet && priceRuleIsMet;
  }

  function basePrice() {
    return tariffMode === "family" && familyEligible() ? C.prices.family : regularPrice();
  }

  function hasCorrectedEntry() {
    return String(correctedEntry).trim() !== "" && Number.isFinite(Number(correctedEntry));
  }

  function chosenPrice() {
    return hasCorrectedEntry() ? Math.max(0, Number(correctedEntry)) : basePrice();
  }

  function selectedCorrectionReason() {
    return correctionReasons.find(reason => reason.id === correctionReason) || null;
  }

  function reasonLabel() {
    return selectedCorrectionReason()?.label || "";
  }

  function correctionReasonOptionsHtml() {
    const options = [
      `<option value="" ${correctionReason === "" ? "selected" : ""}>Kein Grund</option>`
    ];

    correctionReasons.forEach(reason => {
      options.push(
        `<option value="${U.esc(reason.id)}" ${correctionReason === reason.id ? "selected" : ""}>${U.esc(reason.label)}</option>`
      );
    });

    return options.join("");
  }

  function priceHintText() {
    if (hasCorrectedEntry()) {
      return `Korrigierter Eintritt${reasonLabel() ? ` · ${reasonLabel()}` : ""}`;
    }
    return tariffMode === "family" ? "Familientarif" : "Regulärer Tarif";
  }

  function priceHtml(actionButtonHtml = "") {
    const familyPossible = familyEligible();
    const priceSummary = `<div class="price-box">
      <div>Zu zahlen</div>
      <div class="price-total" data-price-total>${U.euro(chosenPrice())}</div>
      <div data-price-hint>${U.esc(priceHintText())}</div>
    </div>`;

    return `<div class="price-editor">
      ${actionButtonHtml
        ? `<div class="price-action-row">${priceSummary}${actionButtonHtml}</div>`
        : priceSummary}
      <div class="card">
        <div class="tariff-row">
          <button data-tariff="regular" class="${tariffMode === "regular" ? "active-tariff" : ""}" type="button">Regulär ${U.euro(regularPrice())}</button>
          <button data-tariff="family" class="${tariffMode === "family" ? "active-tariff" : ""}" type="button" ${familyPossible ? "" : "disabled"}>Familientarif ${U.euro(C.prices.family)}</button>
        </div>
        <div class="correction-grid">
          <label>Korrigierter Eintritt
            <input data-corrected-entry type="number" min="0" step="0.50" inputmode="decimal" value="${U.esc(correctedEntry)}" placeholder="Euro">
          </label>
          <label>Grund
            <select data-correction-reason>
              ${correctionReasonOptionsHtml()}
            </select>
          </label>
        </div>
      </div>
    </div>`;
  }

  function visiblePriceEditor() {
    return document.querySelector(".panel:not(.hidden) .price-editor");
  }

  function bindPrice() {
    const editor = visiblePriceEditor();
    if (!editor) return;

    editor.querySelector('[data-tariff="regular"]').onclick = () => {
      tariffMode = "regular";
      renderCurrentEditor();
    };

    const familyButton = editor.querySelector('[data-tariff="family"]');
    familyButton.onclick = () => {
      if (!familyEligible()) return;
      tariffMode = "family";
      renderCurrentEditor();
    };

    const correctedInput = editor.querySelector("[data-corrected-entry]");
    correctedInput.addEventListener("input", event => {
      correctedEntry = event.target.value;
      updateVisiblePriceEditor();
    });

    const reasonSelect = editor.querySelector("[data-correction-reason]");
    reasonSelect.addEventListener("change", event => {
      correctionReason = event.target.value;
      const reason = selectedCorrectionReason();

      if (!reason) {
        correctedEntry = "";
      } else if (
        String(correctedEntry).trim() === "" &&
        reason.defaultAmount !== null &&
        reason.defaultAmount !== undefined
      ) {
        correctedEntry = String(reason.defaultAmount);
      } else if (reason.amountRequired && String(correctedEntry).trim() === "") {
        correctedEntry = "";
      }

      renderCurrentEditor();

      if (reason?.amountRequired && !hasCorrectedEntry()) {
        setTimeout(() => visiblePriceEditor()?.querySelector("[data-corrected-entry]")?.focus(), 20);
      }
    });
  }

  function updateVisiblePriceEditor() {
    const editor = visiblePriceEditor();
    if (!editor) return;

    const total = editor.querySelector("[data-price-total]");
    if (total) total.textContent = U.euro(chosenPrice());

    const hint = editor.querySelector("[data-price-hint]");
    if (hint) hint.textContent = priceHintText();
  }

  function renderCurrentEditor() {
    if (!$("manualPanel").classList.contains("hidden")) renderManual();
    else renderResult();
  }

  function validateCorrection() {
    const reason = selectedCorrectionReason();

    if (hasCorrectedEntry() && !reason) {
      toast("Bitte einen Grund für den korrigierten Eintritt auswählen.");
      return false;
    }

    if (reason?.amountRequired && !hasCorrectedEntry()) {
      toast(`Bei „${reason.label}“ muss ein korrigierter Eintritt eingetragen werden.`);
      return false;
    }

    return true;
  }


  async function confirmOfflineCheckin() {
    if (navigator.onLine) return true;
    return await confirmBox(
      "Offline-Check-in",
      "Check-in trotz fehlender Verbindung durchführen? Es muss sichergestellt sein, dass während des Offlinebetriebs nur mit diesem einen Device die Check-ins durchgeführt werden.",
      "Offline einchecken"
    );
  }

  function successScrollPosition() {
    const actionRow = $("mainActionRow");
    const container = scrollContainer();
    if (!actionRow || !container) return 0;

    const containerRect = container.getBoundingClientRect();
    const actionRect = actionRow.getBoundingClientRect();

    return Math.max(
      0,
      container.scrollTop + actionRect.top - containerRect.top - 4
    );
  }

  async function completeExisting() {
    if (U.sumCounts(counts) < 1) {
      toast("Mindestens eine Person erforderlich.");
      return;
    }
    if (!validateCorrection()) return;

    let message = `${current.number} mit ${U.sumCounts(counts)} Personen und ${U.euro(chosenPrice())} Eintritt einchecken?`;
    if (current.status === "cancelled") message = "Stornierte Anmeldung als Ausnahme: " + message;
    if (current.status === "waitlist" && earlierWaitIds().length) {
      message = `Frühere Wartelistenanmeldungen sind noch offen. Trotzdem fortfahren? ${message}`;
    }

    if (!(await confirmBox("Check-in bestätigen", message, "Einchecken"))) return;
    if (!(await confirmOfflineCheckin())) return;

    const checkin = {
      token: current.token,
      number: current.number,
      name: current.name,
      counts: U.clone(counts),
      paid: chosenPrice(),
      basePrice: basePrice(),
      tariff: tariffMode,
      correctionReason,
      kind: current.status === "confirmed" ? "regular" : current.status === "waitlist" ? "waitlist" : "exception",
      offline: !navigator.onLine || onlineState === "offline",
      time: U.now()
    };

    if (window.AVT_BACKEND?.isConfigured()) {
      const result = await AVT_BACKEND.write("checkin", { checkin }, { allowQueue: true });
      checkin.offline = Boolean(result.queued);
      if (result.data) applySnapshot(result.data);
      if (result.queued) {
        data.checkins[current.token] = checkin;
        S.save(data);
      }
    } else {
      data.checkins[current.token] = checkin;
      S.save(data);
    }

    renderSuccess(checkin);
  }

  function renderManual() {
    $("manualContent").innerHTML = `
      ${counterHtml(true)}
      ${priceHtml('<button id="manualComplete" class="primary checkin-side-button" type="button">Check-in abschließen</button>')}`;

    bindCounters(true);
    bindPrice();
    $("manualComplete").onclick = completeManual;
  }

  async function completeManual() {
    if (U.sumCounts(counts) < 1) {
      toast("Mindestens eine Person erforderlich.");
      return;
    }
    if (!validateCorrection()) return;

    if (!(await confirmBox("Unangemeldeten Check-in bestätigen", `${U.sumCounts(counts)} Personen mit ${U.euro(chosenPrice())} Eintritt erfassen?`, "Erfassen"))) return;
    if (!(await confirmOfflineCheckin())) return;

    const id = `M-${String(data.sequence++).padStart(3, "0")}`;
    const checkin = {
      id,
      name: "Unangemeldeter Check-in",
      counts: U.clone(counts),
      paid: chosenPrice(),
      basePrice: basePrice(),
      tariff: tariffMode,
      correctionReason,
      offline: !navigator.onLine,
      time: U.now()
    };
    if (window.AVT_BACKEND?.isConfigured()) {
      const result = await AVT_BACKEND.write("manualCheckin", { checkin }, { allowQueue: true });
      checkin.offline = Boolean(result.queued);
      if (result.data) applySnapshot(result.data);
      if (result.queued) {
        data.manual.push(checkin);
        S.save(data);
      }
    } else {
      data.manual.push(checkin);
      S.save(data);
    }
    renderSuccess({ ...checkin, number: id, kind: "manual" });
  }

  function renderSuccess(checkin) {
    panels.forEach(panel => $(panel).classList.add("hidden"));
    $("resultPanel").classList.remove("hidden");

    const detailPayload = {
      name: checkin.name,
      number: checkin.number,
      ids: current?.ids || [checkin.number],
      counts: checkin.counts,
      paid: checkin.paid,
      correctionReason: checkin.correctionReason || "",
      tariff: checkin.tariff || "regular",
      offline: !!checkin.offline
    };

    $("resultContent").innerHTML = `
      ${checkin.offline ? `<div class="offline-indicator">Offline gespeichert – noch nicht synchronisiert</div>` : ""}
      <div class="card success success-compact">
        <div class="success-head">
          <h2>Check-in erfolgreich</h2>
          <button id="successDetailsBtn" class="secondary success-detail-button" type="button">Details</button>
        </div>
      </div>
      <button class="primary full summary-follow-button" data-nav="scan">Nächsten QR-Code scannen</button>
      ${currentStandHtml()}`;

    $("resultContent").querySelectorAll("[data-nav]").forEach(button => {
      button.onclick = () => nav(button.dataset.nav);
    });

    $("successDetailsBtn").onclick = () => showSuccessDetails(detailPayload);

    renderAll();
    updateHeaderStats();
    requestAnimationFrame(() => {
      scrollContainer()?.scrollTo({
        top: successScrollPosition(),
        behavior: "auto"
      });
    });
  }

  function showSuccessDetails(detailPayload) {
    const ids = detailPayload.ids || [detailPayload.number];
    const tariffLabel =
      detailPayload.tariff === "family"
        ? "Familientarif"
        : "Regulärer Tarif";

    const correctionLine = detailPayload.correctionReason
      ? `<p><strong>Korrekturgrund:</strong> ${U.esc(reasonLabelFromId(detailPayload.correctionReason) || detailPayload.correctionReason)}</p>`
      : "";
    const offlineLine = detailPayload.offline
      ? `<p><strong>Speicherung:</strong> Offline auf diesem Gerät gespeichert</p>`
      : "";

    $("modalTitle").textContent = "Details zum Check-in";
    $("modalBody").innerHTML = `
      <p><strong>${U.esc(detailPayload.name)}</strong></p>
      <p><strong>IDs:</strong> ${ids.map(id => U.esc(id)).join(", ")}</p>
      <div class="ids-list">${ids.map(id => `<span>${U.esc(id)}</span>`).join("")}</div>
      <div class="card" style="margin:12px 0 0 0;padding:12px;">
        <h3 style="margin:0 0 8px 0;">Personenzahl</h3>
        <dl class="detail-grid">
          ${Object.keys(categories).filter(key => detailPayload.counts[key]).map(key => `<dt>${categories[key].label}</dt><dd>${detailPayload.counts[key]}</dd>`).join("")}
          <dt>Gesamt</dt><dd>${U.sumCounts(detailPayload.counts)}</dd>
        </dl>
      </div>
      <div class="card" style="margin:12px 0 0 0;padding:12px;">
        <h3 style="margin:0 0 8px 0;">Eintritt</h3>
        <p><strong>Tarif:</strong> ${U.esc(tariffLabel)}</p>
        <p><strong>Gezahlt:</strong> ${U.euro(detailPayload.paid)}</p>
        ${correctionLine}
        ${offlineLine}
      </div>`;
    $("modalTitle").textContent = "Details zum Check-in";
    $("modalConfirm").textContent = "Schließen";
    $("modalCancel").classList.add("hidden");
    $("modal").classList.remove("hidden");
    modalResolve = () => {
      $("modalCancel").classList.remove("hidden");
    };
  }

  function reasonLabelFromId(reasonId) {
    return correctionReasons.find(reason => reason.id === reasonId)?.label || "";
  }

  function actualPersonsHtml(personCounts) {
    return `<div class="card">
      <h3>Tatsächliche Personenzahl</h3>
      <dl class="detail-grid">
        ${Object.keys(categories).filter(key => personCounts[key]).map(key => `<dt>${categories[key].label}</dt><dd>${personCounts[key]}</dd>`).join("")}
        <dt>Gesamt</dt><dd>${U.sumCounts(personCounts)}</dd>
      </dl>
    </div>`;
  }

  function currentStandHtml() {
    const currentStats = stats();
    return `<div class="card">
      <h3>Aktueller Gesamtstand</h3>
      <dl class="detail-grid">
        <dt>Regulär</dt><dd>${currentStats.regular}</dd>
        <dt>Warteliste</dt><dd>${currentStats.wait}</dd>
        <dt>Stornierte Ausnahmen</dt><dd>${currentStats.exceptions}</dd>
        <dt>Unangemeldet</dt><dd>${currentStats.manual}</dd>
        <dt>Gesamt anwesend</dt><dd>${currentStats.present} / ${C.event.maxPersons}</dd>
        <dt>Sicher freie Plätze</dt><dd>${currentStats.safe}</dd>
        <dt>Eintritt</dt><dd>${U.euro(currentStats.entry)}</dd>
        <dt>Spenden</dt><dd>${U.euro(currentStats.donations)}</dd>
        <dt>Offen – regulär</dt><dd>${currentStats.regularOpen}</dd>
        <dt>Offen – Warteliste</dt><dd>${currentStats.waitOpen}</dd>
      </dl>
    </div>`;
  }

  function renderDonationPanel() {
    $("donationAmount").value = "";
    const currentStats = stats();
    $("donationSummary").innerHTML = `<div class="card">
      <h3>Bisher erfasste Spenden</h3>
      <dl class="detail-grid">
        <dt>Anzahl</dt><dd>${data.donations.length}</dd>
        <dt>Summe</dt><dd>${U.euro(currentStats.donations)}</dd>
      </dl>
    </div>`;
  }

  async function saveDonation() {
    const rawValue = $("donationAmount").value;
    const amount = Number(String(rawValue).replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast("Bitte einen gültigen Spendenbetrag eingeben.");
      return;
    }
    if (!(await confirmBox("Spende bestätigen", `Spende von ${U.euro(amount)} erfassen?`, "Spende erfassen"))) return;

    data.donations.push({ amount, time: U.now() });
    S.save(data);
    nav("home", { forceTop: true });
    updateHeaderStats();
    initializeBackend();
    forcePageTop();
    toast("Spende wurde erfasst.");
  }

  function renderOverview() {
    const currentStats = stats();
    $("presentTop").textContent = currentStats.present;
    const checkins = [
      ...Object.values(data.checkins),
      ...data.manual.map(item => ({ ...item, number: item.id, kind: "manual" }))
    ];

    $("overviewContent").innerHTML = `
      ${currentStandHtml()}
      <div class="card">
        <h3>Einnahmen</h3>
        <dl class="detail-grid">
          <dt>Eintritt</dt><dd>${U.euro(currentStats.entry)}</dd>
          <dt>Spenden</dt><dd>${U.euro(currentStats.donations)}</dd>
          <dt>Gesamteinnahmen</dt><dd>${U.euro(currentStats.total)}</dd>
        </dl>
      </div>
      <div class="card">
        <h3>Erfasste Check-ins</h3>
        ${checkins.length
          ? checkins.map(item => `<p><strong>${U.esc(item.number)}</strong> · ${U.sumCounts(item.counts)} Personen · ${U.euro(item.paid)}</p>`).join("")
          : '<p class="muted">Noch keine Check-ins.</p>'}
      </div>`;
  }

  async function reset() {
    if (await confirmBox("Testdaten zurücksetzen", "Alle lokalen Check-ins, Einnahmen und Spenden löschen?", "Zurücksetzen")) {
      if (window.AVT_BACKEND?.isConfigured() && onlineState !== "offline") {
        const snapshot = await AVT_BACKEND.resetServer();
        applySnapshot(snapshot);
      } else {
        data = S.reset();
      }
      current = null;
      counts = null;
      resetPriceState();
      renderAll();
      renderSearch();
      toast("Testdaten zurückgesetzt.");
    }
  }

  function showMessage(title, text, tone, withOverview = false) {
    panels.forEach(panel => $(panel).classList.add("hidden"));
    $("resultPanel").classList.remove("hidden");
    $("resultContent").innerHTML = `
      <div class="card ${tone || ""}"><h2>${U.esc(title)}</h2><p>${U.esc(text)}</p></div>
      ${withOverview ? '<button class="secondary full" data-nav="overview">Übersicht öffnen</button>' : ""}`;

    $("resultContent").querySelectorAll("[data-nav]").forEach(button => {
      button.onclick = () => nav(button.dataset.nav);
    });
  }

  function confirmBox(title, body, confirmText) {
    $("modalTitle").textContent = title;
    $("modalBody").textContent = body;
    $("modalConfirm").textContent = confirmText;
    $("modal").classList.remove("hidden");
    return new Promise(resolve => { modalResolve = resolve; });
  }

  function closeModal(value) {
    $("modal").classList.add("hidden");
    $("modalCancel").classList.remove("hidden");
    if (modalResolve) modalResolve(value);
    modalResolve = null;
  }

  function toast(message) {
    $("toast").textContent = message;
    $("toast").classList.remove("hidden");
    setTimeout(() => $("toast").classList.add("hidden"), 2200);
  }

  document.addEventListener("DOMContentLoaded", init);
})();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
}
