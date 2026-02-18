const API_BASE = import.meta.env.VITE_API_URL || 'https://attend-karo-backend.onrender.com/api';

// ──────────────────────────────────────────────
// Session storage helpers — keep sensitive data out of URL state
// ──────────────────────────────────────────────
const SESSION_STORAGE_KEY = 'ak_session';

export function storeSessionData(data) {
    try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    } catch { /* quota exceeded — non-critical */ }
}

export function getSessionData() {
    try {
        const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function clearSessionData() {
    try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch { /* ignore */ }
}

// ──────────────────────────────────────────────
// API helpers with timeout + abort support
// ──────────────────────────────────────────────
async function safeFetch(url, options = {}, timeoutMs = 20000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(url, {
            ...options,
            signal: controller.signal,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
            throw new Error(err.message || `Request failed (${res.status})`);
        }

        return res.json();
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error('Request timed out. Server is busy, please retry.');
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Validate a session code and get session info
 */
export async function validateSession(sessionCode) {
    return safeFetch(`${API_BASE}/display/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionCode: sessionCode.trim().toUpperCase() }),
    });
}

/**
 * Fetch a fresh QR token for a session
 */
export async function fetchQRToken(sessionId) {
    return safeFetch(`${API_BASE}/display/${sessionId}/qr-token`, {}, 15000);
}

/**
 * Get live session stats
 */
export async function fetchSessionStats(sessionId) {
    return safeFetch(`${API_BASE}/display/${sessionId}/stats`);
}

/**
 * Get recent student scans (live feed)
 */
export async function fetchRecentScans(sessionId) {
    return safeFetch(`${API_BASE}/display/${sessionId}/recent-scans`);
}

/**
 * End session — requires re-entering session code for confirmation
 */
export async function endSession(sessionId, sessionCode) {
    return safeFetch(`${API_BASE}/display/${sessionId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionCode: sessionCode.trim().toUpperCase() }),
    });
}
