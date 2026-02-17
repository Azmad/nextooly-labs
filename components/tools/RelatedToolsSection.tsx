import React from "react";

export type RelatedTool = {
  name: string;
  desc: string;
  href: string;
  badge?: string; // e.g. "New", "Popular"
};

type RelatedToolsSectionProps = {
  title: string;       // e.g. "More Image Tools"
  tools: RelatedTool[];
};

export default function RelatedToolsSection({ 
  title, 
  tools 
}: RelatedToolsSectionProps) {
  return (
    <section className="mt-16 p-6 rounded-xl border border-gray-200 bg-slate-50">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        {title}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tools.map((tool, i) => (
          <a 
            key={i}
            href={tool.href}
            // Use target="_blank" only if linking to a different domain (like main site)
            className="group flex flex-col p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all h-full no-underline"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900 text-sm">{tool.name}</h3>
              {tool.badge && (
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  {tool.badge}
                </span>
              )}
            </div>
            
            <p className="text-gray-500 text-xs leading-relaxed mb-4 flex-1">
              {tool.desc}
            </p>

            <div className="text-blue-600 text-xs font-semibold flex items-center gap-1 mt-auto">
              Open tool <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}