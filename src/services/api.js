const API_BASE = import.meta.env.VITE_API_URL || 'https://attend-karo-backend.onrender.com/api';

/**
 * Validate a session code and get session info
 */
export async function validateSession(sessionCode) {
    const res = await fetch(`${API_BASE}/display/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionCode }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Network error' }));
        throw new Error(err.message || 'Validation failed');
    }

    return res.json();
}

/**
 * Fetch a fresh QR token for a session
 */
export async function fetchQRToken(sessionId) {
    const res = await fetch(`${API_BASE}/display/${sessionId}/qr-token`);

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Network error' }));
        throw new Error(err.message || 'Failed to get QR token');
    }

    return res.json();
}

/**
 * Get live session stats
 */
export async function fetchSessionStats(sessionId) {
    const res = await fetch(`${API_BASE}/display/${sessionId}/stats`);

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Network error' }));
        throw new Error(err.message || 'Failed to get stats');
    }

    return res.json();
}

/**
 * End session using session code
 */
export async function endSession(sessionId, sessionCode) {
    const res = await fetch(`${API_BASE}/display/${sessionId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionCode }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Network error' }));
        throw new Error(err.message || 'Failed to end session');
    }

    return res.json();
}
