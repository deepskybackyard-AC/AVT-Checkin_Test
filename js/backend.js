"use strict";

window.AVT_BACKEND = (function () {
  const C = window.AVT_CONFIG;
  const U = window.AVT_UTIL;
  const API_TIMEOUT_MS = Math.max(10000, Number(C.saveFlow?.requestTimeoutSeconds || 30) * 1000);

  function isConfigured() {
    return Boolean(C.backend?.enabled && C.backend?.url && !String(C.backend.url).includes("HIER_"));
  }

  function callbackName() {
    return "avtCb_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
  }

  function request(action, payload = {}) {
    if (!isConfigured()) {
      return Promise.reject(new Error("Backend ist noch nicht konfiguriert."));
    }

    return new Promise((resolve, reject) => {
      const cb = callbackName();
      const script = document.createElement("script");
      const url = new URL(C.backend.url);
      url.searchParams.set("callback", cb);
      url.searchParams.set("action", action);
      url.searchParams.set("payload", JSON.stringify(payload || {}));
      url.searchParams.set("_", Date.now().toString());

      const timer = window.setTimeout(() => {
        cleanup();
        reject(new Error("Backend antwortet nicht."));
      }, API_TIMEOUT_MS);

      function cleanup() {
        window.clearTimeout(timer);
        try { delete window[cb]; } catch { window[cb] = undefined; }
        script.remove();
      }

      window[cb] = result => {
        cleanup();
        if (!result || result.ok === false) {
          reject(new Error(result?.error || "Backendfehler."));
          return;
        }
        resolve(result);
      };

      script.onerror = () => {
        cleanup();
        reject(new Error("Backend konnte nicht erreicht werden."));
      };

      script.src = url.toString();
      document.head.appendChild(script);
    });
  }

  function loadCached() {
    try {
      return JSON.parse(localStorage.getItem(C.storageKeys.cachedBackend) || "null");
    } catch {
      return null;
    }
  }

  function saveCached(snapshot) {
    localStorage.setItem(C.storageKeys.cachedBackend, JSON.stringify({
      ...snapshot,
      cachedAt: U.now()
    }));
  }

  function getQueue() {
    try {
      return JSON.parse(localStorage.getItem(C.storageKeys.offlineQueue) || "[]");
    } catch {
      return [];
    }
  }

  function setQueue(queue) {
    localStorage.setItem(C.storageKeys.offlineQueue, JSON.stringify(queue || []));
  }

  function queueCount() {
    return getQueue().length;
  }

  function newOperationId() {
    const device = getDeviceId();
    return device + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function getDeviceId() {
    let id = localStorage.getItem(C.storageKeys.deviceId);
    if (!id) {
      id = "dev-" + Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36);
      localStorage.setItem(C.storageKeys.deviceId, id);
    }
    return id;
  }

  async function ping() {
    return request("ping", { deviceId: getDeviceId() });
  }

  async function bootstrap() {
    const result = await request("bootstrap", { deviceId: getDeviceId() });
    saveCached(result.data);
    return result.data;
  }

  async function state() {
    const result = await request("state", { deviceId: getDeviceId() });
    saveCached(result.data);
    return result.data;
  }

  function prepareOperation(action, payload = {}) {
    return {
      operationId: payload.operationId || newOperationId(),
      action,
      payload: {
        ...payload,
        deviceId: getDeviceId()
      },
      createdAt: U.now()
    };
  }

  async function sendPrepared(operation) {
    const result = await request(operation.action, operation);
    if (result.data) saveCached(result.data);
    return { ...result, operation };
  }

  function enqueuePrepared(operation) {
    enqueue(operation);
    return operation;
  }

  function removeQueued(operationId) {
    setQueue(getQueue().filter(item => item.operationId !== operationId));
  }

  function isQueued(operationId) {
    return getQueue().some(item => item.operationId === operationId);
  }

  async function write(action, payload, { allowQueue = true } = {}) {
    const operation = prepareOperation(action, payload);

    if (!navigator.onLine && allowQueue) {
      enqueue(operation);
      return { ok: true, queued: true, operation };
    }

    try {
      return await sendPrepared(operation);
    } catch (error) {
      if (allowQueue) {
        enqueue(operation);
        return { ok: true, queued: true, operation, warning: error.message };
      }
      throw error;
    }
  }

  function enqueue(operation) {
    const queue = getQueue();
    if (!queue.some(item => item.operationId === operation.operationId)) {
      queue.push(operation);
      setQueue(queue);
    }
  }

  async function syncQueue() {
    const queue = getQueue();
    if (!queue.length) {
      return {
        ok: true,
        synced: 0,
        failed: 0,
        errors: [],
        syncedOperations: []
      };
    }

    const remaining = [];
    const errors = [];
    const syncedOperations = [];

    for (const operation of queue) {
      try {
        await request(operation.action, operation);
        syncedOperations.push({
          operationId: operation.operationId,
          action: operation.action
        });
      } catch (error) {
        remaining.push(operation);
        errors.push({
          operationId: operation.operationId,
          action: operation.action,
          error: error.message
        });
      }
    }

    setQueue(remaining);
    const fresh = await state().catch(() => null);
    return {
      ok: true,
      synced: syncedOperations.length,
      failed: remaining.length,
      errors,
      syncedOperations,
      data: fresh
    };
  }

  async function resetServer() {
    const result = await request("reset", { deviceId: getDeviceId() });
    if (result.data) saveCached(result.data);
    setQueue([]);
    return result.data;
  }

  return {
    isConfigured,
    request,
    ping,
    bootstrap,
    state,
    prepareOperation,
    sendPrepared,
    enqueuePrepared,
    removeQueued,
    isQueued,
    write,
    resetServer,
    loadCached,
    saveCached,
    getQueue,
    setQueue,
    queueCount,
    syncQueue,
    getDeviceId,
    newOperationId
  };
})();
