import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateSession } from '../services/api';

export default function SessionSetup() {
    const [sessionCode, setSessionCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!sessionCode.trim()) return;

        setLoading(true);
        setError('');

        try {
            const data = await validateSession(sessionCode.trim());
            // Navigate to QR display with session info
            navigate(`/display/${data.session.id}`, {
                state: {
                    session: data.session,
                    studentsScanned: data.studentsScanned,
                    sessionCode: sessionCode.trim().toUpperCase(),
                },
            });
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
            <div className="glow-blob" />

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
                <div className="glass-panel" style={{ width: '100%', maxWidth: 440, padding: '40px' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 40 }}>
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 56,
                                height: 56,
                                borderRadius: 12,
                                background: 'var(--input-bg)',
                                border: '1px solid var(--border-sharp)',
                                marginBottom: 24,
                                color: 'var(--accent)',
                                fontSize: 30,
                            }}
                        >
                            <span className="material-icons-round">qr_code_2</span>
                        </div>
                        <h1
                            style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: 22,
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                marginBottom: 8,
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
                                letterSpacing: '0.15em',
                            }}
                        >
                            Session Management Console
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div>
                            <label className="mono-label" htmlFor="session-id">
                                SESSION_ID_INPUT
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
                                        color: sessionCode ? 'var(--accent)' : '#444',
                                        transition: 'color 0.2s',
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
                                    placeholder="CS-101-2023-A"
                                    value={sessionCode}
                                    onChange={(e) => {
                                        setSessionCode(e.target.value.toUpperCase());
                                        setError('');
                                    }}
                                    autoComplete="off"
                                    autoFocus
                                    required
                                />
                            </div>
                            <p
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 10,
                                    color: error ? 'var(--status-red)' : '#444',
                                    marginTop: 8,
                                    marginLeft: 4,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    transition: 'color 0.2s',
                                }}
                            >
                                {error ? `> Error: ${error}` : '> Waiting for administrative input...'}
                            </p>
                        </div>

                        <div style={{ paddingTop: 8 }}>
                            <button className="btn-accent" type="submit" disabled={loading || !sessionCode.trim()}>
                                {loading ? (
                                    <span className="spinner" />
                                ) : (
                                    <>
                                        <span>Generate QR Code</span>
                                        <span className="material-icons-round" style={{ fontSize: 18 }}>
                                            arrow_forward_ios
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Footer */}
                    <div
                        style={{
                            marginTop: 32,
                            paddingTop: 24,
                            borderTop: '1px solid var(--border-sharp)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="status-dot" />
                            <span className="footer-text" style={{ color: 'var(--text-dim)' }}>
                                System Active
                            </span>
                        </div>
                        <span className="footer-text" style={{ color: 'var(--text-dim)' }}>
                            Build 2.4.0
                        </span>
                    </div>
                </div>
            </main>

            {/* Copyright */}
            <footer
                style={{
                    position: 'relative',
                    zIndex: 10,
                    padding: '24px 0',
                    textAlign: 'center',
                }}
            >
                <p className="footer-text" style={{ color: '#333' }}>
                    © 2024 Attend Karo Systems.
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
