import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "cyan" | "success" | "warning" | "danger" | "neutral";
  size?: "sm" | "md";
  className?: string;
  icon?: React.ReactNode;
}

export function Badge({
  children,
  variant = "primary",
  size = "sm",
  className,
  icon,
}: BadgeProps) {
  const base = "inline-flex items-center font-medium rounded-full border";

  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-xs gap-1.5",
    md: "px-3 py-1 text-sm gap-2",
  };

  const variants = {
    primary: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
    cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    success: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    danger: "bg-red-500/10 text-red-300 border-red-500/30",
    neutral: "bg-slate-800/60 text-slate-300 border-slate-700/60",
  };

  return (
    <span className={twMerge(clsx(base, sizeStyles[size], variants[variant], className))}>
      {icon}
      {children}
    </span>
  );
}
