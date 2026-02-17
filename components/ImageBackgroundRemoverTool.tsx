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

"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";

const ESM_BG_REMOVAL_URL = "https://esm.sh/@imgly/background-removal@1.5.5";
const IMGLY_PUBLIC_PATH = "https://staticimgly.com/@imgly/background-removal-data/1.5.5/dist/";

type RemoveBgFn = (src: string, config: any) => Promise<Blob>;

type State = {
  originalFile: File | null;
  originalUrl: string | null;
  processedUrl: string | null;
  processedBlob: Blob | null;
  status: "idle" | "ready" | "downloading-model" | "processing" | "done" | "error";
  progress: number;
  error: string | null;
};

async function loadRemoveBackground(): Promise<RemoveBgFn> {
  // TRICK: We assign the URL to a variable first. 
  // This stops Next.js from trying to "compile" the external website.
  const url = ESM_BG_REMOVAL_URL;
  
  // We use the variable 'url' here instead of the constant directly
  const mod = await import(/* webpackIgnore: true */ url);
  
  const fn = mod.removeBackground || mod.default || (typeof mod === "function" ? mod : null);
  if (!fn || typeof fn !== "function") {
    throw new Error("Could not find the background removal function in the loaded module.");
  }
  return fn as RemoveBgFn;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Helper icons using SVG
const UploadIcon = () => (
  <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
);

const Checkerboard = () => (
  <div
    className="absolute inset-0 z-0 bg-white"
    style={{
      backgroundImage: "linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)",
      backgroundSize: "20px 20px",
      backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px"
    }}
  />
);

export default function ImageBackgroundRemoverTool() {
  const [state, setState] = useState<State>({
    originalFile: null,
    originalUrl: null,
    processedUrl: null,
    processedBlob: null,
    status: "idle",
    progress: 0,
    error: null,
  });

  const [isDragging, setIsDragging] = useState(false);
  const busy = state.status === "downloading-model" || state.status === "processing";

  const removeBgFnRef = useRef<RemoveBgFn | null>(null);

  useEffect(() => {
    let mounted = true;
    const preloadLibrary = async () => {
      try {
        const fn = await loadRemoveBackground();
        if (mounted) {
          removeBgFnRef.current = fn;
          console.log("Background removal tool preloaded successfully.");
        }
      } catch (err) {
        console.warn("Background removal tool failed to preload (will retry on click):", err);
      }
    };
    preloadLibrary();
    return () => { mounted = false; };
  }, []);

  const reset = useCallback(() => {
    setState((prev) => {
      if (prev.originalUrl) URL.revokeObjectURL(prev.originalUrl);
      if (prev.processedUrl) URL.revokeObjectURL(prev.processedUrl);
      return { originalFile: null, originalUrl: null, processedUrl: null, processedBlob: null, status: "idle", progress: 0, error: null };
    });
  }, []);

  const handleFileSelection = useCallback((file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setState(p => ({ ...p, error: "Please select a valid image file." }));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setState({
      originalFile: file,
      originalUrl: objectUrl,
      processedUrl: null,
      processedBlob: null,
      status: "ready",
      progress: 0,
      error: null,
    });
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelection(file || null);
  }, [handleFileSelection]);

  const processImage = useCallback(async () => {
    if (!state.originalUrl || !state.originalFile) return;

    try {
      setState(p => ({ ...p, status: "downloading-model", progress: 1, error: null }));
      
      let removeBackground = removeBgFnRef.current;
      
      if (!removeBackground) {
        removeBackground = await loadRemoveBackground();
        removeBgFnRef.current = removeBackground;
      }
      
      setState(p => ({ ...p, status: "processing", progress: 5 }));

      const config = {
        publicPath: IMGLY_PUBLIC_PATH,
        model: "medium",
        progress: (key: string, current: number, total: number) => {
          const pct = total > 0 ? Math.round((current / total) * 100) : 0;
          setState(p => ({ ...p, progress: Math.max(p.progress, pct) }));
        },
      };

      const resultBlob = await removeBackground(state.originalUrl, config);
      const processedUrl = URL.createObjectURL(resultBlob);

      setState(p => ({ ...p, processedBlob: resultBlob, processedUrl, status: "done", progress: 100 }));
    } catch (err: any) {
      setState(p => ({ ...p, status: "error", error: err.message || "Failed to load background removal tool." }));
    }
  }, [state.originalUrl, state.originalFile]);

  const download = useCallback(() => {
    if (!state.processedBlob) return;
    const a = document.createElement("a");
    a.href = state.processedUrl!;
    const baseName = state.originalFile?.name?.replace(/\.[^/.]+$/, "") || "image";
    a.download = `${baseName}-no-bg.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [state.processedBlob, state.processedUrl, state.originalFile]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-6 sm:p-10">
            
            {!state.originalUrl && (
              <div 
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`relative group border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer
                  ${isDragging 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                  }`}
              >
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  accept="image/*" 
                  onChange={(e) => handleFileSelection(e.target.files?.[0] ?? null)} 
                  disabled={busy} 
                />
                <div className="flex flex-col items-center justify-center">
                  <UploadIcon />
                  <p className="text-lg font-medium text-gray-700">
                    <span className="text-blue-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG or WEBP up to 10MB</p>
                </div>
              </div>
            )}

            {state.error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm flex items-center">
                <span className="mr-2">⚠️</span> {state.error}
              </div>
            )}

            {busy && (
              <div className="mt-8 space-y-3">
                <div className="flex justify-between text-sm font-medium text-gray-600">
                  <span>{state.status === "downloading-model" ? "Initializing AI Model..." : "Processing Image..."}</span>
                  <span>{state.progress}%</span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${state.progress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-gray-400">
                  {state.status === "downloading-model" && "This might take a moment on the first run."}
                </p>
              </div>
            )}

            {state.originalUrl && !busy && state.status !== "done" && (
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-6">
                <button
                  onClick={processImage}
                  className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Remove Background
                </button>
                <button
                  onClick={reset}
                  className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-200"
                >
                  Cancel
                </button>
              </div>
            )}
            
            {state.status === "done" && (
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-6 border-t border-gray-100 pt-6">
                <button
                  onClick={download}
                  className="w-full sm:w-auto flex items-center justify-center px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <DownloadIcon /> Download HD Image
                </button>
                <button
                  onClick={reset}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium underline decoration-gray-300 underline-offset-4"
                >
                  Process another image
                </button>
              </div>
            )}
          </div>
        </div>

        {state.originalUrl && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Original</span>
                {state.originalFile && <span className="text-xs text-gray-400">{formatBytes(state.originalFile.size)}</span>}
              </div>
              <div className="relative flex-1 bg-gray-100 min-h-[300px] flex items-center justify-center p-4">
                 <img 
                   src={state.originalUrl} 
                   alt="Original" 
                   className="max-w-full max-h-[500px] object-contain shadow-sm rounded-lg" 
                 />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Background Removed</span>
              </div>
              <div className="relative flex-1 bg-gray-100 min-h-[300px] flex items-center justify-center overflow-hidden">
                <Checkerboard />
                <div className="relative z-10 w-full h-full p-4 flex items-center justify-center">
                  {state.processedUrl ? (
                    <img 
                      src={state.processedUrl} 
                      alt="Processed" 
                      className="max-w-full max-h-[500px] object-contain shadow-sm rounded-lg" 
                    />
                  ) : (
                    <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 max-w-xs">
                      <div className="animate-pulse flex flex-col items-center">
                        <div className="h-12 w-12 bg-gray-200 rounded-full mb-3"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 w-20 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}