import React from "react";
import ExternalBreadcrumb from "@/components/tools/ExternalBreadcrumb";

type NextoolyToolPageShellProps = {
  // 1. SEO & Header Info
  title: string;
  description: string;
  
  // 2. Breadcrumb Configuration
  breadcrumbLabel: string;
  categoryLabel?: string;
  categoryHref?: string;

  // 3. The Content
  tool: React.ReactNode;
  belowTool?: React.ReactNode;
  
  // 4. Technical
  schema?: React.ReactNode;
};

export default function NextoolyToolPageShell({
  title,
  description,
  breadcrumbLabel,
  categoryLabel,
  categoryHref,
  tool,
  belowTool,
  schema,
}: NextoolyToolPageShellProps) {
  return (
    <main className="min-h-screen bg-white font-sans">
      {schema ?? null}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* --- Block 1: Breadcrumb --- */}
        <div className="mb-[12px]">
          <ExternalBreadcrumb 
            currentLabel={breadcrumbLabel} 
            categoryLabel={categoryLabel}
            categoryHref={categoryHref}
          />
        </div>

        {/* --- Block 2: Page Header (Exact Match to Main Site) --- */}
        <div className="text-left border-b border-gray-200 pb-2 mb-8">
          <h1 className="text-[26px] font-bold text-[#0f172a] mb-[6px] leading-tight">
            {title}
          </h1>
          <p className="text-[15px] text-[#475569] mb-[16px] leading-relaxed">
            {description}
          </p>
        </div>

        {/* --- Block 3: The Tool Area --- */}
        <div className="mb-16 min-h-[400px]">
          {tool}
        </div>

        {/* --- Block 4: Content Sections --- */}
        {belowTool ? (
          <div className="max-w-5xl mx-auto">
            {belowTool}
          </div>
        ) : null}
      </div>
    </main>
  );
}