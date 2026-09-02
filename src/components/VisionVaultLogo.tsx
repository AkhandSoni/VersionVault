import React from 'react';

interface VersionVaultLogoProps {
  compact?: boolean;
  className?: string;
}

export function VisionVaultLogo({ compact = false, className = '' }: VersionVaultLogoProps) {
  return (
    <span
      aria-label="Version Vault"
      className={`inline-flex shrink-0 items-center ${compact ? 'h-10 w-36' : 'h-14 w-48'} ${className}`}
    >
      <svg viewBox="0 0 400 128" role="img" aria-hidden="true" className="h-full w-full">
        <path
          d="M18 5 L56 5 L75 78 L96 5 L132 5 L91 93 L59 93 Z"
          fill="#ff5a2f"
        />
        <path
          d="M26 66 L56 66 L74 121 L94 66 L124 66 L88 128 L61 128 Z"
          fill="#ffb16d"
        />
        <text
          x="128"
          y="50"
          fill="#1f2623"
          fontFamily="Georgia, ui-serif, serif"
          fontSize="46"
          fontWeight="900"
          letterSpacing="0"
        >
          Version
        </text>
        <text
          x="126"
          y="116"
          fill="#424b46"
          fontFamily="Georgia, ui-serif, serif"
          fontSize="55"
          fontWeight="900"
          letterSpacing="0"
        >
          Vault
        </text>
      </svg>
    </span>
  );
}
