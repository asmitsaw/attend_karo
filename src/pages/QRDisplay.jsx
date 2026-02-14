import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import CountdownRing from '../components/CountdownRing';
import { fetchQRToken, endSession as endSessionAPI } from '../services/api';

const QR_REFRESH_INTERVAL = 10; // seconds

export default function QRDisplay() {
    const { sessionId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const { session, sessionCode } = location.state || {};

    const [qrData, setQrData] = useState('');
    const [countdown, setCountdown] = useState(QR_REFRESH_INTERVAL);
    const [studentsScanned, setStudentsScanned] = useState(location.state?.studentsScanned || 0);
    const [isActive, setIsActive] = useState(true);
    const [error, setError] = useState('');
    const [ending, setEnding] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const timerRef = useRef(null);
    const containerRef = useRef(null);

    // Fetch fresh QR token from backend
    const refreshQR = useCallback(async () => {
        try {
            const data = await fetchQRToken(sessionId);
            setQrData(data.qrData);
            setStudentsScanned(data.studentsScanned);
            setCountdown(QR_REFRESH_INTERVAL);
            setError('');
        } catch (err) {
            if (err.message === 'Session has ended') {
                setIsActive(false);
            } else {
                setError(err.message);
            }
        }
    }, [sessionId]);

    // Initial QR fetch + interval
    useEffect(() => {
        if (!sessionId) {
            navigate('/');
            return;
        }

        refreshQR();
        const interval = setInterval(refreshQR, QR_REFRESH_INTERVAL * 1000);
        return () => clearInterval(interval);
    }, [sessionId, refreshQR, navigate]);

    // Countdown timer (visual only)
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setCountdown((prev) => (prev <= 1 ? QR_REFRESH_INTERVAL : prev - 1));
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, []);

    // Fullscreen toggle
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    // Listen to F11
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

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFSChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFSChange);
        return () => document.removeEventListener('fullscreenchange', handleFSChange);
    }, []);

    // End session
    const handleEndSession = async () => {
        if (ending) return;
        if (!window.confirm('Are you sure you want to end this session? This cannot be undone.')) return;

        setEnding(true);
        try {
            await endSessionAPI(sessionId, sessionCode);
            setIsActive(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setEnding(false);
        }
    };

    // Session ended view
    if (!isActive) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 24,
                    background: 'var(--pure-black)',
                }}
            >
                <div
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'rgba(255, 23, 68, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid rgba(255, 23, 68, 0.3)',
                    }}
                >
                    <span
                        className="material-icons-round"
                        style={{ fontSize: 40, color: 'var(--status-red)' }}
                    >
                        stop_circle
                    </span>
                </div>
                <h2
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 20,
                        color: 'var(--text-main)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                    }}
                >
                    Session Ended
                </h2>
                <p
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.08em',
                    }}
                >
                    Final count: {studentsScanned} students marked present
                </p>
                <button
                    className="btn-accent"
                    style={{ width: 'auto', marginTop: 16 }}
                    onClick={() => navigate('/')}
                >
                    <span className="material-icons-round" style={{ fontSize: 18 }}>arrow_back</span>
                    New Session
                </button>
                <link
                    href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
                    rel="stylesheet"
                />
            </div>
        );
    }

    return (
        <>
            <div ref={containerRef} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--pure-black)' }}>
                {/* Background grid */}
                <div className="bg-grid" />

                {/* ── Header Bar ── */}
                <header
                    style={{
                        position: 'relative',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '20px 32px',
                        borderBottom: '1px solid var(--border-sharp)',
                    }}
                >
                    <div>
                        <h1
                            style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: 20,
                                fontWeight: 700,
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
                                marginTop: 4,
                            }}
                        >
                            {session?.classInfo || ''} &bull; {session?.facultyName || ''}
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                        {/* Status Pill */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 14px',
                                borderRadius: 20,
                                border: '1px solid rgba(0, 230, 118, 0.3)',
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
                                    letterSpacing: '0.1em',
                                }}
                            >
                                Live
                            </span>
                        </div>

                        {/* End Session */}
                        <button className="btn-danger" onClick={handleEndSession} disabled={ending}>
                            <span className="material-icons-round" style={{ fontSize: 14 }}>
                                power_settings_new
                            </span>
                            <span>{ending ? 'Ending...' : 'End Session'}</span>
                        </button>
                    </div>
                </header>

                {/* ── Main content ── */}
                <main
                    style={{
                        position: 'relative',
                        zIndex: 10,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 40,
                        padding: 32,
                    }}
                >
                    {/* Student count */}
                    <div style={{ textAlign: 'center' }}>
                        <p className="mono-label" style={{ marginBottom: 4, textAlign: 'center' }}>
                            Students Scanned
                        </p>
                        <div
                            style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 64,
                                fontWeight: 700,
                                color: 'var(--accent)',
                                lineHeight: 1,
                                textShadow: '0 0 30px rgba(0, 230, 118, 0.3)',
                            }}
                        >
                            {String(studentsScanned).padStart(3, '0')}
                        </div>
                    </div>

                    {/* QR Code + Countdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
                        {/* QR Code */}
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

                        {/* Countdown Ring */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                            <CountdownRing seconds={countdown} total={QR_REFRESH_INTERVAL} size={100} />
                            <p
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 9,
                                    color: 'var(--text-dim)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                }}
                            >
                                Next Refresh
                            </p>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 11,
                                color: 'var(--status-red)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                            }}
                        >
                            &gt; Error: {error}
                        </div>
                    )}

                    {/* Session Code Badge */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 20px',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-sharp)',
                            borderRadius: 4,
                        }}
                    >
                        <span
                            className="material-icons-round"
                            style={{ fontSize: 16, color: 'var(--text-muted)' }}
                        >
                            vpn_key
                        </span>
                        <span
                            style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 14,
                                fontWeight: 700,
                                letterSpacing: '0.2em',
                                color: 'var(--accent)',
                            }}
                        >
                            {sessionCode || session?.sessionCode || 'N/A'}
                        </span>
                    </div>
                </main>

                {/* ── Footer ── */}
                <footer
                    style={{
                        position: 'relative',
                        zIndex: 10,
                        padding: '16px 32px',
                        borderTop: '1px solid rgba(51, 51, 51, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <p className="footer-text">© 2024 Attend Karo Systems</p>
                    <button
                        className="footer-text"
                        onClick={toggleFullscreen}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            color: '#444',
                        }}
                    >
                        <span className="material-icons-round" style={{ fontSize: 14 }}>
                            {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                        </span>
                        <span>{isFullscreen ? 'Exit Fullscreen' : 'Press F11 for Fullscreen'}</span>
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
