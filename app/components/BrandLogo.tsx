"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "./auth/AuthProvider";

interface BrandLogoProps {
  href?: string;
  showWordmark?: boolean;
  className?: string;
  textClassName?: string;
  iconClassName?: string;
  iconSize?: number;
}

export function BrandLogo({
  href,
  showWordmark = true,
  className = "",
  textClassName = "",
  iconClassName = "",
  iconSize = 18,
}: BrandLogoProps) {
  const { isAuthenticated } = useAuth();
  const targetHref = href ?? (isAuthenticated ? "/dashboard" : "/");

  return (
    <Link
      href={targetHref}
      className={`inline-flex items-center gap-2 ${className}`.trim()}
      aria-label="Ansar AI home"
    >
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#0b0d12] text-white shadow-sm ring-1 ring-slate-700/80 ${iconClassName}`.trim()}
        style={{ width: iconSize + 12, height: iconSize + 12 }}
      >
        <Image
          src="/logo.svg"
          alt="Ansar AI logo"
          width={iconSize}
          height={iconSize}
          priority
          className="h-full w-full object-contain p-1.5"
        />
      </div>

      {showWordmark && (
        <span
          className={`text-lg font-bold tracking-tight ${textClassName || "text-foreground"}`.trim()}
        >
          Ansar AI
        </span>
      )}
    </Link>
  );
}
