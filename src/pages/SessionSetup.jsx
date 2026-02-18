import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateSession, storeSessionData } from '../services/api';

export default function SessionSetup() {
    const [sessionCode, setSessionCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [statusText, setStatusText] = useState('');
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Terminal typing effect for status text
    useEffect(() => {
        const lines = [
            '> System initialized...',
            '> QR engine ready...',
            '> Awaiting session code...',
        ];
        let lineIndex = 0;
        let charIndex = 0;
        let currentText = '';

        const typeInterval = setInterval(() => {
            if (lineIndex >= lines.length) {
                clearInterval(typeInterval);
                return;
            }

            const line = lines[lineIndex];
            if (charIndex < line.length) {
                currentText += line[charIndex];
                setStatusText(currentText);
                charIndex++;
            } else {
                currentText += '\n';
                lineIndex++;
                charIndex = 0;
            }
        }, 30);

        return () => clearInterval(typeInterval);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!sessionCode.trim()) return;

        setLoading(true);
        setError('');

        try {
            const data = await validateSession(sessionCode.trim());

            // Store in sessionStorage (not URL state) for security
            storeSessionData({
                session: data.session,
                sessionCode: sessionCode.trim().toUpperCase(),
                totalEnrolled: data.totalEnrolled,
                config: data.config,
            });

            // Navigate — no sensitive state in URL
            navigate(`/display/${data.session.id}`);
        } catch (err) {
            setError(err.message || 'Invalid session code');
            // Shake animation
            inputRef.current?.classList.add('shake');
            setTimeout(() => inputRef.current?.classList.remove('shake'), 500);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Background effects */}
            <div className="bg-grid" />
            <div className="glow-blob glow-blob--green" />
            <div className="glow-blob glow-blob--purple" />
            <div className="scan-lines" />

            <main
                style={{
                    position: 'relative',
                    zIndex: 10,
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '24px',
                }}
            >
                <div
                    className="glass-panel scale-in"
                    style={{ width: '100%', maxWidth: 460, padding: '48px 40px' }}
                >
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 40 }}>
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 64,
                                height: 64,
                                borderRadius: 14,
                                background: 'var(--accent-dim)',
                                border: '1px solid rgba(0, 230, 118, 0.15)',
                                marginBottom: 24,
                                color: 'var(--accent)',
                                fontSize: 32,
                                boxShadow: '0 0 30px rgba(0, 230, 118, 0.1)',
                            }}
                        >
                            <span className="material-icons-round">qr_code_2</span>
                        </div>
                        <h1
                            style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: 26,
                                fontWeight: 800,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                marginBottom: 10,
                                background: 'linear-gradient(135deg, var(--text-main) 0%, var(--accent) 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            Attend Karo
                        </h1>
                        <p
                            style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 10,
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.18em',
                            }}
                        >
                            Session Management Console
                        </p>
                    </div>

                    {/* Terminal Status */}
                    <div
                        style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 10,
                            color: 'var(--text-dim)',
                            padding: '12px 14px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-sharp)',
                            marginBottom: 28,
                            whiteSpace: 'pre-line',
                            lineHeight: 1.8,
                            letterSpacing: '0.04em',
                            minHeight: 60,
                        }}
                    >
                        {statusText}
                        <span className="cursor-blink" />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div>
                            <label className="mono-label" htmlFor="session-id">
                                SESSION_CODE
                            </label>
                            <div style={{ position: 'relative' }} ref={inputRef}>
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        bottom: 0,
                                        left: 16,
                                        display: 'flex',
                                        alignItems: 'center',
                                        pointerEvents: 'none',
                                        color: sessionCode ? 'var(--accent)' : 'var(--text-dim)',
                                        transition: 'color 0.3s',
                                    }}
                                >
                                    <span className="material-icons-round" style={{ fontSize: 18 }}>
                                        terminal
                                    </span>
                                </div>
                                <input
                                    id="session-id"
                                    className="mono-input"
                                    type="text"
                                    placeholder="Enter session code"
                                    value={sessionCode}
                                    onChange={(e) => {
                                        setSessionCode(e.target.value.toUpperCase());
                                        setError('');
                                    }}
                                    autoComplete="off"
                                    autoFocus
                                    maxLength={20}
                                    required
                                />
                            </div>

                            {/* Status / Error message */}
                            <div
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 10,
                                    marginTop: 10,
                                    marginLeft: 4,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    transition: 'color 0.3s',
                                    color: error ? 'var(--status-red)' : 'var(--text-dim)',
                                }}
                            >
                                <span
                                    className="material-icons-round"
                                    style={{
                                        fontSize: 12,
                                        color: error ? 'var(--status-red)' : 'var(--text-dim)',
                                    }}
                                >
                                    {error ? 'error_outline' : 'chevron_right'}
                                </span>
                                <span>
                                    {error
                                        ? error
                                        : sessionCode.trim()
                                            ? `Code: ${sessionCode.trim()}`
                                            : 'Waiting for input...'}
                                </span>
                            </div>
                        </div>

                        <div style={{ paddingTop: 8 }}>
                            <button
                                className="btn-accent"
                                type="submit"
                                disabled={loading || !sessionCode.trim()}
                            >
                                {loading ? (
                                    <span className="spinner" />
                                ) : (
                                    <>
                                        <span className="material-icons-round" style={{ fontSize: 18 }}>
                                            play_arrow
                                        </span>
                                        <span>Initialize QR Display</span>
                                        <span className="material-icons-round" style={{ fontSize: 14 }}>
                                            arrow_forward
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Footer */}
                    <div
                        style={{
                            marginTop: 36,
                            paddingTop: 24,
                            borderTop: '1px solid var(--border-sharp)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="status-dot" />
                            <span className="footer-text">System Online</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                                className="material-icons-round"
                                style={{ fontSize: 12, color: 'var(--text-dim)' }}
                            >
                                security
                            </span>
                            <span className="footer-text">Encrypted</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Copyright */}
            <footer
                style={{
                    position: 'relative',
                    zIndex: 10,
                    padding: '20px 0',
                    textAlign: 'center',
                }}
            >
                <p className="footer-text" style={{ color: 'var(--text-dim)' }}>
                    © 2024 Attend Karo Systems — Secure Attendance Infrastructure
                </p>
            </footer>

            {/* Material Icons */}
            <link
                href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
                rel="stylesheet"
            />
        </>
    );
}
