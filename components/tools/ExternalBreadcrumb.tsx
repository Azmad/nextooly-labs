import React from "react";
import Link from "next/link";

type ExternalBreadcrumbProps = {
  currentLabel: string;
  categoryLabel?: string;
  categoryHref?: string;
  homeLabel?: string;
  homeHref?: string;
};

export default function ExternalBreadcrumb({
  currentLabel,
  categoryLabel,
  categoryHref = "#",
  homeLabel = "Home",
  homeHref = "https://nextooly.com", // Default to main site
}: ExternalBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[14px]">
      {/* 1. Home Link (Matches reference styles) */}
      <a href={homeHref} className="text-[rgb(37,99,235)] font-medium hover:underline">
        {homeLabel}
      </a>

      {/* Separator */}
      <span className="text-slate-400">/</span>

      {/* 2. Category Link */}
      {categoryLabel && (
        <>
          <a href={categoryHref} className="text-[rgb(37,99,235)] font-medium hover:underline">
            {categoryLabel}
          </a>
          <span className="text-slate-400">/</span>
        </>
      )}

      {/* 3. Current Tool (Matches reference styles) */}
      <span className="text-[#0f172a] font-semibold">{currentLabel}</span>
    </nav>
  );
}