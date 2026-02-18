/**
 * SVG circular countdown ring with dynamic color transitions
 * Green → Amber → Red as time runs out
 */
export default function CountdownRing({ seconds, total, size = 100 }) {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = seconds / total;
    const offset = circumference * (1 - progress);

    // Dynamic color: green → amber → red
    let ringColor, glowColor, textColor;
    if (progress > 0.5) {
        ringColor = 'var(--accent)';
        glowColor = 'rgba(0, 230, 118, 0.5)';
        textColor = 'var(--accent)';
    } else if (progress > 0.25) {
        ringColor = 'var(--status-amber, #FFD600)';
        glowColor = 'rgba(255, 214, 0, 0.4)';
        textColor = 'var(--status-amber, #FFD600)';
    } else {
        ringColor = 'var(--status-red)';
        glowColor = 'rgba(255, 23, 68, 0.5)';
        textColor = 'var(--status-red)';
    }

    return (
        <div
            style={{
                position: 'relative',
                width: size,
                height: size,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                style={{ transform: 'rotate(-90deg)' }}
            >
                {/* Background track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.06)"
                    strokeWidth="3"
                />
                {/* Animated ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease',
                        filter: `drop-shadow(0 0 8px ${glowColor})`,
                    }}
                />
            </svg>
            <div
                style={{
                    position: 'absolute',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <span
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: size * 0.28,
                        fontWeight: 700,
                        color: textColor,
                        transition: 'color 0.4s ease',
                        textShadow: `0 0 12px ${glowColor}`,
                        lineHeight: 1,
                    }}
                >
                    {String(seconds).padStart(2, '0')}
                </span>
                <span
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 7,
                        fontWeight: 500,
                        color: 'var(--text-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                    }}
                >
                    SEC
                </span>
            </div>
        </div>
    );
}
