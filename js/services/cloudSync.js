/**
 * Pusat Jual Beli Solo Raya - Central Real-Time Worldwide Cloud Sync Engine
 * High-Speed Multi-Relay SSE & Cloud PubSub with Cache-Busting
 */

const PRIMARY_SYNC_URL = 'https://ntfy.envs.net/pusat_barkas_settings_280995';
const SECONDARY_SYNC_URL = 'https://ntfy.sh/pusat_barkas_settings_280995';

const CLOUD_ENDPOINTS = Object.freeze([PRIMARY_SYNC_URL, SECONDARY_SYNC_URL]);

let eventSource = null;
let isConnected = false;
let isCloudSyncInitialized = false;
let sseErrorCount = 0;
const MAX_SSE_ERRORS = 3;

/**
 * Normalize an ntfy envelope into the application payload once.
 * Both the initial history fetch and the live SSE path use this helper.
 */
function parseCloudMessage(rawMessage) {
  if (typeof rawMessage !== 'string') return null;

  const trimmed = rawMessage.trim();
  if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
    return null;
  }

  try {
    const envelope = JSON.parse(trimmed);
    if (!envelope || envelope.event !== 'message' || !envelope.message) return null;

    let payload = envelope.message;
    if (typeof payload === 'string') {
      const nested = payload.trim();
      if (!nested || (!nested.startsWith('{') && !nested.startsWith('['))) return null;
      try {
        payload = JSON.parse(nested);
      } catch (_) {
        return null;
      }
    }

    return payload && typeof payload === 'object' ? payload : null;
  } catch (_) {
    return null;
  }
}

function notifyCloudPayload(payload, callbacks) {
  if (!payload || typeof payload !== 'object') return;

  const { onTextsUpdate, onSettingsUpdate, onListingsUpdate, onUsersUpdate } = callbacks;

  if (payload.type === 'SETTINGS_UPDATED' && payload.data) {
    onSettingsUpdate?.(payload.data);
    return;
  }

  if (payload.type === 'TEXTS_UPDATED' && payload.data) {
    onTextsUpdate?.(payload.data);
    return;
  }

  if (payload.type === 'LISTINGS_UPDATED' && payload.data) {
    onListingsUpdate?.(payload.data);
    return;
  }

  if (payload.type === 'USERS_UPDATED' && payload.data) {
    onUsersUpdate?.(payload.data);
    return;
  }

  if (
    payload.type === 'APP_REVIEW_ADDED' ||
    payload.type === 'APP_REVIEW_UPDATED' ||
    payload.type === 'APP_REVIEW_DELETED'
  ) {
    window.dispatchEvent(new CustomEvent('appReviewsChanged', { detail: payload }));
  }
}

function pickLatestPayload(current, payload, itemTime = 0) {
  if (!payload?.data) return current;

  const candidateTime = payload.data.updatedAt
    ? new Date(payload.data.updatedAt).getTime()
    : (payload.timestamp || itemTime || 0);

  if (!current) return { data: payload.data, time: candidateTime };
  return candidateTime >= current.time ? { data: payload.data, time: candidateTime } : current;
}

function normalizeCallbacks(onTextsUpdate, onSettingsUpdate, onListingsUpdate, onUsersUpdate) {
  if (onTextsUpdate && typeof onTextsUpdate === 'object') {
    return onTextsUpdate;
  }

  return {
    onTextsUpdate,
    onSettingsUpdate,
    onListingsUpdate,
    onUsersUpdate
  };
}

// -------------------------------------------------------------
// INITIALIZE CLOUD REAL-TIME LISTENER (ON HP & ALL DEVICES)
// -------------------------------------------------------------
export function initCloudRealtimeSync(onTextsUpdate, onSettingsUpdate, onListingsUpdate, onUsersUpdate) {
  if (isCloudSyncInitialized) return;
  isCloudSyncInitialized = true;

  const callbacks = normalizeCallbacks(onTextsUpdate, onSettingsUpdate, onListingsUpdate, onUsersUpdate);
  fetchLatestCloudState(callbacks);
  startRealtimeStream(callbacks);
}

// Fresh Fetch latest updates with cache-busting from central database.
// Supports both the legacy four-callback signature and the internal callbacks object.
export async function fetchLatestCloudState(onTextsUpdate, onSettingsUpdate, onListingsUpdate, onUsersUpdate) {
  const callbacks = normalizeCallbacks(onTextsUpdate, onSettingsUpdate, onListingsUpdate, onUsersUpdate);
  const cacheBuster = Date.now();

  for (const baseUrl of CLOUD_ENDPOINTS) {
    try {
      const res = await fetch(`${baseUrl}/json?poll=1&_cb=${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!res.ok) continue;

      const textData = await res.text();
      if (!textData || !textData.trim()) continue;

      const latest = {
        texts: null,
        settings: null,
        listings: null,
        users: null
      };

      for (const line of textData.trim().split('\n')) {
        const payload = parseCloudMessage(line);
        if (!payload) continue;

        if (payload.type === 'SETTINGS_UPDATED') {
          latest.settings = pickLatestPayload(latest.settings, payload);
        } else if (payload.type === 'TEXTS_UPDATED') {
          latest.texts = pickLatestPayload(latest.texts, payload);
        } else if (payload.type === 'LISTINGS_UPDATED' && payload.data) {
          latest.listings = payload.data;
        } else if (payload.type === 'USERS_UPDATED' && payload.data) {
          latest.users = payload.data;
        }
      }

      callbacks.onTextsUpdate?.(latest.texts?.data);
      callbacks.onSettingsUpdate?.(latest.settings?.data);
      callbacks.onListingsUpdate?.(latest.listings);
      callbacks.onUsersUpdate?.(latest.users);
      return;
    } catch (_) {
      // Fallback to the next relay.
    }
  }
}

// Live SSE Stream with auto-reconnect limit
function startRealtimeStream(callbacks) {
  if (eventSource) {
    try { eventSource.close(); } catch (_) {}
  }

  try {
    eventSource = new EventSource(`${PRIMARY_SYNC_URL}/sse`);

    eventSource.onopen = () => {
      isConnected = true;
      sseErrorCount = 0;
      console.log('[CloudSync] Saluran Real-time SSE terhubung aktif.');
    };

    eventSource.onmessage = (event) => {
      const payload = parseCloudMessage(typeof event?.data === 'string' ? event.data : '');
      if (!payload) {
        const rawData = typeof event?.data === 'string' ? event.data.trim() : '';
        if (rawData) console.log('[CloudSync Real-time Teks]:', rawData);
        return;
      }

      console.log(`[CloudSync Event]: ${payload.type || 'MESSAGE'}`);
      notifyCloudPayload(payload, callbacks);
    };

    eventSource.onerror = () => {
      isConnected = false;
      sseErrorCount++;
      if (sseErrorCount >= MAX_SSE_ERRORS) {
        console.warn('[CloudSync] Max SSE retry attempts reached. Closing EventSource to prevent network overload.');
        try { eventSource.close(); } catch (_) {}
      }
    };
  } catch (error) {
    console.warn('SSE stream init:', error);
  }
}

// -------------------------------------------------------------
// BROADCAST UPDATE TO ALL CONNECTED DEVICES IN PARALLEL
// -------------------------------------------------------------
export async function broadcastToCloud(type, data) {
  const payload = JSON.stringify({
    type,
    data,
    timestamp: Date.now()
  });

  const promises = CLOUD_ENDPOINTS.map((url) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: payload
    }).catch(() => null)
  );

  await Promise.allSettled(promises);
  return true;
}
