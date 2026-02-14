import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * SVG circular countdown ring — matches Stitch design's purple timer
 */
export default function CountdownRing({ seconds, total, size = 80 }) {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = seconds / total;
    const offset = circumference * (1 - progress);

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
                    stroke="var(--border-sharp)"
                    strokeWidth="3"
                />
                {/* Animated ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--purple)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        transition: 'stroke-dashoffset 1s linear',
                        filter: 'drop-shadow(0 0 6px rgba(124, 77, 255, 0.5))',
                    }}
                />
            </svg>
            <span
                style={{
                    position: 'absolute',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: size * 0.25,
                    fontWeight: 700,
                    color: 'var(--purple)',
                    textShadow: '0 0 10px rgba(124, 77, 255, 0.4)',
                }}
            >
                {String(seconds).padStart(2, '0')}
            </span>
        </div>
    );
}
