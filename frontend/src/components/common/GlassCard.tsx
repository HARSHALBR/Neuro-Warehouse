"use client";

import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: string; // e.g. "rgba(16,185,129,0.25)"
  interactive?: boolean;
  radialWash?: string; // e.g. "rgba(16,185,129,0.12)"
}

export default function GlassCard({
  children,
  className = "",
  glowColor,
  interactive = false,
  radialWash,
  style,
  ...props
}: GlassCardProps) {
  const customStyles: React.CSSProperties = {
    ...style,
    ...(glowColor ? ({ "--card-glow": glowColor } as React.CSSProperties) : {}),
  };

  return (
    <div
      className={`glass-card ${interactive ? "glass-card-interactive cursor-pointer" : ""} ${className}`}
      style={customStyles}
      {...props}
    >
      {/* Subtle Radial Color Wash Layer */}
      {radialWash && (
        <div
          className="absolute inset-0 pointer-events-none rounded-[18px] opacity-70 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at 15% 15%, ${radialWash}, transparent 70%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
