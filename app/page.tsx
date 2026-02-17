/*
 * Nextooly Labs – Experimental Web Tools
 * Copyright (C) 2026 Nextooly
 *
 * This file is part of the Nextooly Labs project.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React from "react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nextooly Labs – Experimental Client-Side Tools",
  description: "Free, privacy-focused developer tools running entirely in your browser using WebAssembly. No server uploads.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-slate-50 border-b border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
            Beta / Experimental
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Nextooly Labs
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A collection of privacy-first tools running entirely in your browser. 
            Powered by WebAssembly for native performance without server uploads.
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Available Tools</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Background Remover */}
          <Link 
            href="/image-background-remover"
            className="group block p-6 bg-white border border-slate-200 rounded-xl hover:shadow-xl transition-all hover:border-blue-400 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
              NEW
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
              <svg className="w-6 h-6 text-blue-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600">
              AI Background Remover
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Remove image backgrounds instantly using client-side AI. 100% free & private.
            </p>
          </Link>

          {/* Placeholder for Next Tool */}
          <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center opacity-60">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">More Coming Soon</h3>
            <p className="text-xs text-slate-500 mt-1">Image Compressor & Cropper</p>
          </div>

        </div>
      </div>
    </main>
  );
}