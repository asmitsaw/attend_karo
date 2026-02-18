import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import CountdownRing from '../components/CountdownRing';
import {
    fetchQRToken,
    endSession as endSessionAPI,
    fetchRecentScans,
    getSessionData,
    clearSessionData,
} from '../services/api';

const QR_REFRESH_INTERVAL = 5; // seconds
const MAX_SESSION_HOURS = 3;   // auto-disconnect after this

export default function QRDisplay() {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    // Retrieve session data from sessionStorage (security: not from URL state)
    const stored = getSessionData();
    const session = stored?.session;
    const sessionCode = stored?.sessionCode;
    const totalEnrolled = stored?.totalEnrolled || 0;

    const [qrData, setQrData] = useState('');
    const [countdown, setCountdown] = useState(QR_REFRESH_INTERVAL);
    const [studentsScanned, setStudentsScanned] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [error, setError] = useState('');
    const [recentScans, setRecentScans] = useState([]);
    const [sessionDuration, setSessionDuration] = useState('00:00');
    const [endResult, setEndResult] = useState(null);
    const [ending, setEnding] = useState(false);

    // Fullscreen
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef(null);
    const timerRef = useRef(null);
    const durationRef = useRef(null);

    // Redirect if no session data
    useEffect(() => {
        if (!sessionId || !session) {
            navigate('/');
        }
    }, [sessionId, session, navigate]);

    // ── Fetch QR token ──
    const refreshQR = useCallback(async () => {
        try {
            const data = await fetchQRToken(sessionId);
            setQrData(data.qrData);
            setStudentsScanned(data.studentsScanned);
            setCountdown(QR_REFRESH_INTERVAL);
            setError('');
        } catch (err) {
            if (err.message === 'Session has ended' || err.message === 'Session has expired') {
                setIsActive(false);
            } else {
                setError(err.message);
            }
        }
    }, [sessionId]);

    // ── Fetch recent scans ──
    const loadRecentScans = useCallback(async () => {
        try {
            const data = await fetchRecentScans(sessionId);
            setRecentScans(data.recentScans || []);
        } catch {
            /* non-critical */
        }
    }, [sessionId]);

    // ── Initial fetch + intervals ──
    useEffect(() => {
        if (!sessionId) return;

        refreshQR();
        loadRecentScans();

        const qrInterval = setInterval(refreshQR, QR_REFRESH_INTERVAL * 1000);
        const scansInterval = setInterval(loadRecentScans, 8000);

        return () => {
            clearInterval(qrInterval);
            clearInterval(scansInterval);
        };
    }, [sessionId, refreshQR, loadRecentScans]);

    // ── Countdown timer ──
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setCountdown((prev) => (prev <= 1 ? QR_REFRESH_INTERVAL : prev - 1));
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, []);

    // ── Session duration timer ──
    useEffect(() => {
        if (!session?.startTime) return;

        const updateDuration = () => {
            const start = new Date(session.startTime);
            const now = new Date();
            const diffMs = now - start;
            const mins = Math.floor(diffMs / 60000);
            const secs = Math.floor((diffMs % 60000) / 1000);
            setSessionDuration(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);

            // Auto-disconnect check
            const hours = diffMs / (1000 * 60 * 60);
            if (hours >= MAX_SESSION_HOURS) {
                setIsActive(false);
            }
        };

        updateDuration();
        durationRef.current = setInterval(updateDuration, 1000);
        return () => clearInterval(durationRef.current);
    }, [session?.startTime]);

    // ── Fullscreen ──
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'F11') {
                e.preventDefault();
                toggleFullscreen();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [toggleFullscreen]);

    useEffect(() => {
        const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFSChange);
        return () => document.removeEventListener('fullscreenchange', handleFSChange);
    }, []);

    // ── End session — direct, no modal ──
    const handleEndSession = async () => {
        if (ending || !sessionCode) return;
        setEnding(true);
        try {
            const result = await endSessionAPI(sessionId, sessionCode);
            setEndResult(result);
            setIsActive(false);
            clearSessionData();
        } catch (err) {
            setError(err.message);
        } finally {
            setEnding(false);
        }
    };

    // ── Masked session code (security: show only last 2) ──
    const maskedCode = sessionCode
        ? '•'.repeat(Math.max(0, sessionCode.length - 2)) + sessionCode.slice(-2)
        : '••••••';

    // ── Attendance percentage ──
    const attendancePct = totalEnrolled > 0
        ? Math.round((studentsScanned / totalEnrolled) * 100)
        : 0;

    // ═══════════════════════════════════
    // SESSION ENDED VIEW
    // ═══════════════════════════════════
    if (!isActive) {
        return (
            <>
                <div className="bg-grid" />
                <div className="session-ended fade-in">
                    <div
                        style={{
                            width: 88,
                            height: 88,
                            borderRadius: '50%',
                            background: 'var(--status-red-dim)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid rgba(255, 23, 68, 0.25)',
                            boxShadow: '0 0 40px var(--status-red-glow)',
                        }}
                    >
                        <span
                            className="material-icons-round"
                            style={{ fontSize: 44, color: 'var(--status-red)' }}
                        >
                            stop_circle
                        </span>
                    </div>

                    <h2
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 24,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginTop: 8,
                        }}
                    >
                        Session Ended
                    </h2>

                    <p
                        style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            letterSpacing: '0.06em',
                        }}
                    >
                        {session?.className || 'Session'} — {session?.classInfo || ''}
                    </p>

                    {/* Summary Stats */}
                    <div className="summary-grid">
                        <div className="stat-card">
                            <span className="stat-value" style={{ color: 'var(--accent)' }}>
                                {endResult?.markedPresent ?? studentsScanned}
                            </span>
                            <span className="stat-label">Present</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value" style={{ color: 'var(--status-red)' }}>
                                {endResult?.markedAbsent ?? '—'}
                            </span>
                            <span className="stat-label">Absent</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value" style={{ color: 'var(--purple)' }}>
                                {endResult?.durationMinutes
                                    ? `${endResult.durationMinutes}m`
                                    : sessionDuration}
                            </span>
                            <span className="stat-label">Duration</span>
                        </div>
                    </div>

                    {/* Progress */}
                    {totalEnrolled > 0 && (
                        <div style={{ width: '100%', maxWidth: 420, marginTop: 8 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: 6,
                                }}
                            >
                                <span className="stat-label">Attendance Rate</span>
                                <span className="stat-label" style={{ color: 'var(--accent)' }}>
                                    {attendancePct}%
                                </span>
                            </div>
                            <div className="progress-track">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${attendancePct}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        className="btn-accent"
                        style={{ width: 'auto', marginTop: 20, padding: '14px 32px' }}
                        onClick={() => {
                            clearSessionData();
                            navigate('/');
                        }}
                    >
                        <span className="material-icons-round" style={{ fontSize: 18 }}>
                            arrow_back
                        </span>
                        New Session
                    </button>
                </div>

                <link
                    href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
                    rel="stylesheet"
                />
            </>
        );
    }

    // ═══════════════════════════════════
    // ACTIVE SESSION VIEW
    // ═══════════════════════════════════
    return (
        <>
            <div
                ref={containerRef}
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--bg-dark)',
                }}
            >
                {/* Background */}
                <div className="bg-grid" />
                <div className="scan-lines" />

                {/* ── Header Bar ── */}
                <header
                    style={{
                        position: 'relative',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 32px',
                        borderBottom: '1px solid var(--border-sharp)',
                        background: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <div>
                        <h1
                            style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: 20,
                                fontWeight: 800,
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                            }}
                        >
                            {session?.className || 'Session'}
                        </h1>
                        <p
                            style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 10,
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                marginTop: 3,
                            }}
                        >
                            {session?.classInfo || ''} &bull; {session?.facultyName || ''}
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        {/* Duration */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 14px',
                                borderRadius: 20,
                                border: '1px solid var(--border-sharp)',
                                background: 'rgba(255,255,255,0.02)',
                            }}
                        >
                            <span
                                className="material-icons-round"
                                style={{ fontSize: 14, color: 'var(--text-dim)' }}
                            >
                                schedule
                            </span>
                            <span
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    letterSpacing: '0.04em',
                                }}
                            >
                                {sessionDuration}
                            </span>
                        </div>

                        {/* Live Status */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 14px',
                                borderRadius: 20,
                                border: '1px solid rgba(0, 230, 118, 0.2)',
                                background: 'var(--accent-dim)',
                            }}
                        >
                            <span className="status-dot" />
                            <span
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 10,
                                    color: 'var(--accent)',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.12em',
                                }}
                            >
                                Live
                            </span>
                        </div>

                        {/* End Session — direct, no modal */}
                        <button
                            className="btn-danger"
                            onClick={handleEndSession}
                            disabled={ending}
                        >
                            {ending ? (
                                <span className="spinner" style={{ width: 14, height: 14 }} />
                            ) : (
                                <>
                                    <span className="material-icons-round" style={{ fontSize: 14 }}>
                                        power_settings_new
                                    </span>
                                    <span>End</span>
                                </>
                            )}
                        </button>
                    </div>
                </header>

                {/* ── Main Content ── */}
                <main
                    style={{
                        position: 'relative',
                        zIndex: 10,
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px 32px',
                        gap: 56,
                    }}
                >
                    {/* Left: Stats + Feed */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 20,
                            minWidth: 200,
                            maxWidth: 240,
                        }}
                    >
                        {/* Student Count */}
                        <div className="stat-card" style={{ alignItems: 'flex-start' }}>
                            <span className="stat-label">Students Present</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                <span
                                    className="stat-value count-up"
                                    style={{
                                        fontSize: 48,
                                        color: 'var(--accent)',
                                        textShadow: '0 0 30px rgba(0, 230, 118, 0.25)',
                                    }}
                                >
                                    {String(studentsScanned).padStart(2, '0')}
                                </span>
                                {totalEnrolled > 0 && (
                                    <span
                                        style={{
                                            fontFamily: "'JetBrains Mono', monospace",
                                            fontSize: 14,
                                            color: 'var(--text-dim)',
                                            fontWeight: 500,
                                        }}
                                    >
                                        / {totalEnrolled}
                                    </span>
                                )}
                            </div>
                            {/* Progress bar */}
                            {totalEnrolled > 0 && (
                                <div style={{ width: '100%', marginTop: 8 }}>
                                    <div className="progress-track">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${attendancePct}%` }}
                                        />
                                    </div>
                                    <span
                                        className="stat-label"
                                        style={{ marginTop: 6, display: 'block', color: 'var(--accent)' }}
                                    >
                                        {attendancePct}%
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Recent Scans Feed */}
                        <div>
                            <div
                                className="section-title"
                                style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <span className="material-icons-round" style={{ fontSize: 14, color: 'var(--accent)' }}>
                                    person_add
                                </span>
                                <span>Recent Scans</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {recentScans.length === 0 ? (
                                    <p
                                        style={{
                                            fontFamily: "'JetBrains Mono', monospace",
                                            fontSize: 10,
                                            color: 'var(--text-dim)',
                                            padding: '12px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        Waiting for students...
                                    </p>
                                ) : (
                                    recentScans.map((scan, i) => (
                                        <div key={i} className="feed-item">
                                            <div className="feed-avatar">
                                                {scan.student_name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p
                                                    style={{
                                                        fontFamily: "'Inter', sans-serif",
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        color: 'var(--text-main)',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    {scan.student_name}
                                                </p>
                                                <p
                                                    style={{
                                                        fontFamily: "'JetBrains Mono', monospace",
                                                        fontSize: 9,
                                                        color: 'var(--text-dim)',
                                                        letterSpacing: '0.04em',
                                                    }}
                                                >
                                                    {scan.roll_number}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Center: QR Code */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                        <div className="qr-container" style={{ position: 'relative' }}>
                            <span className="qr-corner top-left" />
                            <span className="qr-corner top-right" />
                            <span className="qr-corner bottom-left" />
                            <span className="qr-corner bottom-right" />
                            {qrData ? (
                                <QRCodeSVG
                                    value={qrData}
                                    size={280}
                                    bgColor="white"
                                    fgColor="black"
                                    level="H"
                                    includeMargin={false}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: 280,
                                        height: 280,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#f5f5f5',
                                    }}
                                >
                                    <span className="spinner" style={{ width: 32, height: 32, color: '#333' }} />
                                </div>
                            )}
                        </div>

                        {/* Masked Session Code */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 20px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid var(--border-sharp)',
                                borderRadius: 'var(--radius-sm)',
                            }}
                        >
                            <span
                                className="material-icons-round"
                                style={{ fontSize: 14, color: 'var(--text-dim)' }}
                            >
                                vpn_key
                            </span>
                            <span className="masked-code">
                                <span>{maskedCode.slice(0, -2)}</span>
                                <span className="visible">{maskedCode.slice(-2)}</span>
                            </span>
                        </div>
                    </div>

                    {/* Right: Countdown */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 16,
                        }}
                    >
                        <CountdownRing seconds={countdown} total={QR_REFRESH_INTERVAL} size={110} />
                        <p
                            style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 9,
                                color: 'var(--text-dim)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.12em',
                            }}
                        >
                            Next Refresh
                        </p>

                        {/* Quick Info */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                marginTop: 16,
                                padding: '14px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-sharp)',
                                background: 'rgba(255,255,255,0.02)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span
                                    className="material-icons-round"
                                    style={{ fontSize: 12, color: 'var(--accent)' }}
                                >
                                    shield
                                </span>
                                <span className="stat-label" style={{ color: 'var(--text-muted)' }}>
                                    HMAC-SHA256
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span
                                    className="material-icons-round"
                                    style={{ fontSize: 12, color: 'var(--purple)' }}
                                >
                                    timer
                                </span>
                                <span className="stat-label" style={{ color: 'var(--text-muted)' }}>
                                    {QR_REFRESH_INTERVAL}s Cycle
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span
                                    className="material-icons-round"
                                    style={{ fontSize: 12, color: 'var(--status-amber)' }}
                                >
                                    gps_fixed
                                </span>
                                <span className="stat-label" style={{ color: 'var(--text-muted)' }}>
                                    Geo-Fenced
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Error toast */}
                    {error && (
                        <div
                            style={{
                                position: 'fixed',
                                bottom: 80,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                padding: '10px 24px',
                                background: 'rgba(255, 23, 68, 0.1)',
                                border: '1px solid rgba(255, 23, 68, 0.3)',
                                borderRadius: 'var(--radius-sm)',
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 11,
                                color: 'var(--status-red)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                zIndex: 50,
                                animation: 'fadeIn 0.3s ease-out',
                            }}
                        >
                            <span className="material-icons-round" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 6 }}>
                                warning
                            </span>
                            {error}
                        </div>
                    )}
                </main>

                {/* ── Footer ── */}
                <footer
                    style={{
                        position: 'relative',
                        zIndex: 10,
                        padding: '12px 32px',
                        borderTop: '1px solid var(--border-sharp)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(0,0,0,0.3)',
                    }}
                >
                    <p className="footer-text">© 2024 Attend Karo Systems</p>
                    <button
                        className="btn-ghost"
                        onClick={toggleFullscreen}
                    >
                        <span className="material-icons-round" style={{ fontSize: 14 }}>
                            {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                        </span>
                        <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
                    </button>
                </footer>
            </div>

            {/* Material Icons */}
            <link
                href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
                rel="stylesheet"
            />
        </>
    );
}
