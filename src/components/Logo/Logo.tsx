import React from 'react'
import styles from './Logo.module.css'

interface LogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'full' | 'icon'
    className?: string
}

const sizeMap = {
    sm: { width: 120, height: 36 },
    md: { width: 180, height: 54 },
    lg: { width: 240, height: 72 },
    xl: { width: 300, height: 90 }
}

const iconSizeMap = {
    sm: 28,
    md: 40,
    lg: 56,
    xl: 72
}

export default function Logo({ size = 'md', variant = 'full', className }: LogoProps) {
    if (variant === 'icon') {
        const iconSize = iconSizeMap[size]
        return (
            <svg
                width={iconSize}
                height={iconSize}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`${styles.logo} ${className || ''}`}
            >
                {/* Background circle with theme-aware colors */}
                <circle
                    cx="32"
                    cy="32"
                    r="28"
                    className={styles.iconBackground}
                    strokeWidth="3"
                />

                {/* Microgreens sprouts centered */}
                <g transform="translate(16, 18)">
                    {/* Sprout 1 - Center */}
                    <path
                        d="M16 26 Q16 20 16 16"
                        className={styles.stem}
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    <circle cx="16" cy="16" r="3" className={styles.seedHead} />
                    <ellipse cx="13" cy="14" rx="3" ry="1.5" className={styles.leafLeft} />
                    <ellipse cx="19" cy="14" rx="3" ry="1.5" className={styles.leafRight} />

                    {/* Sprout 2 - Left */}
                    <path
                        d="M8 28 Q8 22 8 18"
                        className={styles.stem}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />
                    <circle cx="8" cy="18" r="2.5" className={styles.seedHead} />
                    <ellipse cx="5.5" cy="16.5" rx="2.5" ry="1.2" className={styles.leafLeft} />
                    <ellipse cx="10.5" cy="16.5" rx="2.5" ry="1.2" className={styles.leafRight} />

                    {/* Sprout 3 - Right */}
                    <path
                        d="M24 28 Q24 23 24 19"
                        className={styles.stem}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />
                    <circle cx="24" cy="19" r="2.5" className={styles.seedHead} />
                    <ellipse cx="21.5" cy="17.5" rx="2.5" ry="1.2" className={styles.leafLeft} />
                    <ellipse cx="26.5" cy="17.5" rx="2.5" ry="1.2" className={styles.leafRight} />

                    {/* Soil base */}
                    <rect x="0" y="28" width="32" height="6" rx="3" className={styles.soil} />
                </g>

                {/* Modern accent elements */}
                <g className={styles.accents}>
                    <circle cx="12" cy="12" r="2.5" />
                    <circle cx="52" cy="12" r="2" />
                    <circle cx="12" cy="52" r="2" />
                    <circle cx="52" cy="52" r="2.5" />
                </g>
            </svg>
        )
    }

    const { width, height } = sizeMap[size]

    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 240 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${styles.logo} ${className || ''}`}
        >
            {/* Background circle for the icon */}
            <circle
                cx="36"
                cy="36"
                r="30"
                className={styles.iconBackground}
                strokeWidth="2.5"
            />

            {/* Microgreens sprouts */}
            <g transform="translate(18, 20)">
                {/* Sprout 1 - Center */}
                <path
                    d="M18 28 Q18 22 18 18"
                    className={styles.stem}
                    strokeWidth="2.8"
                    strokeLinecap="round"
                />
                <circle cx="18" cy="18" r="2.8" className={styles.seedHead} />
                <ellipse cx="15.5" cy="16.5" rx="2.8" ry="1.4" className={styles.leafLeft} />
                <ellipse cx="20.5" cy="16.5" rx="2.8" ry="1.4" className={styles.leafRight} />

                {/* Sprout 2 - Left */}
                <path
                    d="M8 30 Q8 24 8 20"
                    className={styles.stem}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                />
                <circle cx="8" cy="20" r="2.4" className={styles.seedHead} />
                <ellipse cx="5.8" cy="18.5" rx="2.4" ry="1.2" className={styles.leafLeft} />
                <ellipse cx="10.2" cy="18.5" rx="2.4" ry="1.2" className={styles.leafRight} />

                {/* Sprout 3 - Right */}
                <path
                    d="M28 30 Q28 25 28 21"
                    className={styles.stem}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                />
                <circle cx="28" cy="21" r="2.4" className={styles.seedHead} />
                <ellipse cx="25.8" cy="19.5" rx="2.4" ry="1.2" className={styles.leafLeft} />
                <ellipse cx="30.2" cy="19.5" rx="2.4" ry="1.2" className={styles.leafRight} />

                {/* Soil base */}
                <rect x="0" y="30" width="36" height="5" rx="2.5" className={styles.soil} />
            </g>

            {/* Text: OFMS */}
            <text
                x="84"
                y="32"
                className={styles.logoText}
                fontSize="24"
                fontWeight="700"
            >
                OFMS
            </text>

            {/* Subtitle */}
            <text
                x="84"
                y="48"
                className={styles.logoSubtext}
                fontSize="13"
                fontWeight="500"
            >
                Organic Farmer
            </text>

            {/* Modern accent line */}
            <rect x="84" y="54" width="36" height="2.5" rx="1.25" className={styles.accentBar} />
            <rect x="124" y="56.5" width="18" height="1.2" rx="0.6" className={styles.accentDot} />

            {/* Tech pattern dots */}
            <g className={styles.techPattern}>
                <circle cx="190" cy="18" r="2" />
                <circle cx="200" cy="18" r="1.5" />
                <circle cx="208" cy="18" r="2" />
                <circle cx="216" cy="18" r="1.5" />

                <circle cx="190" cy="28" r="1.5" />
                <circle cx="200" cy="28" r="2" />
                <circle cx="208" cy="28" r="1.5" />
                <circle cx="216" cy="28" r="2" />

                <circle cx="190" cy="38" r="2" />
                <circle cx="200" cy="38" r="1.5" />
                <circle cx="208" cy="38" r="2" />
                <circle cx="216" cy="38" r="1.5" />

                <circle cx="190" cy="48" r="1.5" />
                <circle cx="200" cy="48" r="2" />
                <circle cx="208" cy="48" r="1.5" />
                <circle cx="216" cy="48" r="2" />
            </g>
        </svg>
    )
} 