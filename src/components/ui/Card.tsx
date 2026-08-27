import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "glow" | "cyan" | "solid";
  hoverEffect?: boolean;
}

export function Card({
  children,
  variant = "glass",
  hoverEffect = false,
  className,
  ...props
}: CardProps) {
  const base = "rounded-2xl p-6 transition-all duration-300";

  const variants = {
    glass: "glass-panel text-slate-100",
    glow: "glass-panel-glow text-slate-100",
    cyan: "glass-panel-cyan text-slate-100",
    solid: "bg-surface-100 border border-slate-800 text-slate-100",
  };

  const hover = hoverEffect ? "hover:-translate-y-1 hover:border-slate-600 hover:shadow-glow cursor-pointer" : "";

  return (
    <div className={twMerge(clsx(base, variants[variant], hover, className))} {...props}>
      {children}
    </div>
  );
}
