import type { ButtonHTMLAttributes, ReactNode } from "react";

export const fieldClass =
  "w-full rounded-xl border border-moss-200 bg-white px-4 py-2.5 text-ink-900 placeholder:text-ink-500/60 shadow-sm outline-none transition focus:border-moss-500 focus:ring-4 focus:ring-moss-500/15";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "cream" | "outline" | "ghost" | "soft" | "onDark";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
};

// Setiap varian membawa warna sendiri (termasuk kondisi disabled) supaya tidak
// perlu menimpa class warna lewat className — dua utilitas warna pada elemen
// yang sama akan menang sesuai urutan di stylesheet, bukan urutan di className.
const variants = {
  primary:
    "bg-moss-700 text-sand-50 shadow-sm shadow-moss-900/20 hover:bg-moss-800 disabled:bg-moss-700/25 disabled:text-sand-200/70 disabled:shadow-none",
  cream:
    "bg-sand-100 text-moss-900 hover:bg-white disabled:bg-sand-100/35 disabled:text-moss-900/45",
  outline:
    "border border-moss-300 bg-white text-moss-800 hover:border-moss-500 hover:bg-moss-50 disabled:border-moss-200 disabled:text-ink-500/50",
  ghost:
    "text-ink-700 hover:bg-moss-100/70 disabled:text-ink-500/45",
  soft:
    "bg-moss-100 text-moss-900 hover:bg-moss-200 disabled:bg-moss-100/50 disabled:text-moss-900/40",
  onDark:
    "bg-moss-100 text-moss-900 hover:bg-white disabled:bg-white/10 disabled:text-sand-200/70",
} as const;

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
