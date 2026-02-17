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

type BackgroundConfig =
  | { type: 'transparent' }
  | { type: 'color'; value: string }
  | { type: 'image'; value: string; file: File };

type FitMode = 'cover' | 'contain' | 'fill';

// --- Helper Functions ---

async function loadRemoveBackground(): Promise<RemoveBgFn> {
  const url = ESM_BG_REMOVAL_URL;
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

// Icons
const UploadIcon = () => (
  <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
);
const DownloadIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
);
const ImageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
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

  const [bgConfig, setBgConfig] = useState<BackgroundConfig>({ type: 'transparent' });
  const [fitMode, setFitMode] = useState<FitMode>('cover');
  const [blur, setBlur] = useState(0);
  // const [shadow, setShadow] = useState(0);
  const [brightness, setBrightness] = useState(100); // 100% is default
  const [contrast, setContrast] = useState(100);   // 100% is default
  const [isDragging, setIsDragging] = useState(false);

  const busy = state.status === "downloading-model" || state.status === "processing";
  const removeBgFnRef = useRef<RemoveBgFn | null>(null);

  // --- Updated Canvas Engine (Shadow + Blur Rendering) ---
  const generateCompositeImage = useCallback(async (foregroundUrl: string, config: BackgroundConfig): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas failure"));

        // 1. Draw Background
        if (config.type !== 'transparent') {
          ctx.save();
          if (blur > 0) ctx.filter = `blur(${blur}px)`;

          if (config.type === "color") {
            ctx.fillStyle = config.value;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (config.type === "image") {
            const bgImg = new Image();
            bgImg.crossOrigin = "anonymous";
            await new Promise<void>((r) => {
              bgImg.onload = () => {
                let dW, dH, dX, dY;
                if (fitMode === 'cover') {
                  const ratio = Math.max(canvas.width / bgImg.width, canvas.height / bgImg.height);
                  dW = bgImg.width * ratio; dH = bgImg.height * ratio;
                } else if (fitMode === 'contain') {
                  const ratio = Math.min(canvas.width / bgImg.width, canvas.height / bgImg.height);
                  dW = bgImg.width * ratio; dH = bgImg.height * ratio;
                } else {
                  dW = canvas.width; dH = canvas.height;
                }
                dX = (canvas.width - dW) / 2; dY = (canvas.height - dH) / 2;
                ctx.drawImage(bgImg, dX, dY, dW, dH);
                r();
              };
              bgImg.src = config.value;
            });
          }
          ctx.restore();
        }

        // 2. Draw Foreground with Shadow
        ctx.save();
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
        ctx.drawImage(img, 0, 0);
        ctx.restore();

        canvas.toBlob((blob) => blob ? resolve(blob) : reject("Blob failed"), "image/png");
      };
      img.src = foregroundUrl;
    });
  }, [fitMode, blur, brightness, contrast]);

  useEffect(() => {
    return () => {
      if (state.originalUrl) URL.revokeObjectURL(state.originalUrl);
      if (state.processedUrl) URL.revokeObjectURL(state.processedUrl);
    };
  }, [state.originalUrl, state.processedUrl]);

  useEffect(() => {
    let mounted = true;
    const preloadLibrary = async () => {
      try {
        const fn = await loadRemoveBackground();
        if (mounted) removeBgFnRef.current = fn;
      } catch (err) { console.warn("Library preload failed:", err); }
    };
    preloadLibrary();
    return () => { mounted = false; };
  }, []);

  const reset = useCallback(() => {
    setState({ originalFile: null, originalUrl: null, processedUrl: null, processedBlob: null, status: "idle", progress: 0, error: null });
    setBgConfig({ type: 'transparent' });
    setBlur(0);
    setBrightness(100);
    setContrast(100);
  }, []);

  const handleFileSelection = useCallback((file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    setState({ originalFile: file, originalUrl: URL.createObjectURL(file), processedUrl: null, processedBlob: null, status: "ready", progress: 0, error: null });
  }, []);

  const processImage = useCallback(async () => {
    if (!state.originalUrl) return;
    try {
      setState(p => ({ ...p, status: "downloading-model", progress: 1 }));

      const removeBackground = removeBgFnRef.current || await loadRemoveBackground();

      setState(p => ({ ...p, status: "processing", progress: 5 }));

      const resultBlob = await removeBackground(state.originalUrl, {
        publicPath: IMGLY_PUBLIC_PATH,
        model: "medium",
        // UPDATE THIS LINE: Cap progress at 90%
        progress: (_: any, c: number, t: number) => setState(p => ({
          ...p,
          progress: Math.min(90, Math.max(p.progress, Math.round((c / t) * 100)))
        }))
      });

      // This final step will instantly jump from 90% -> 100%, feeling "snappy"
      setState(p => ({ ...p, processedBlob: resultBlob, processedUrl: URL.createObjectURL(resultBlob), status: "done", progress: 100 }));

    } catch (err: any) { setState(p => ({ ...p, status: "error", error: err.message })); }
  }, [state.originalUrl]);

  const download = useCallback(async () => {
    if (!state.processedUrl) return;
    const blob = await generateCompositeImage(state.processedUrl, bgConfig);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${state.originalFile?.name?.split('.')[0] || 'edit'}-nextooly.png`;
    a.click();
  }, [state.processedUrl, bgConfig, generateCompositeImage, state.originalFile]);

  const getPreviewStyle = () => {
    const base: React.CSSProperties = { transition: 'all 0.3s ease' };

    // Combine Blur with Brightness and Contrast
    const filterParts = [];
    if (blur > 0) filterParts.push(`blur(${blur}px)`);
    filterParts.push(`brightness(${brightness}%)`);
    filterParts.push(`contrast(${contrast}%)`);

    const imgStyle: React.CSSProperties = {
      ...base,
      backgroundColor: bgConfig.type === 'color' ? bgConfig.value : 'transparent',
      backgroundImage: bgConfig.type === 'image' ? `url(${bgConfig.value})` : 'none',
      backgroundSize: fitMode === 'fill' ? '100% 100%' : fitMode,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      filter: filterParts.join(' ')
    };
    return imgStyle;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Main Upload Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-6 sm:p-10">
            {!state.originalUrl && (
              <div onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileSelection(e.dataTransfer.files[0]); }}
                className={`relative group border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}`}>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => handleFileSelection(e.target.files?.[0] || null)} />
                <div className="flex flex-col items-center">
                  <UploadIcon />
                  <p className="text-lg font-medium text-gray-700"><span className="text-blue-600">Click to upload</span> or drag and drop</p>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG or WEBP up to 10MB</p>
                </div>
              </div>
            )}

            {state.error && <div className="mt-4 p-4 bg-red-50 text-red-700 text-sm rounded-lg">⚠️ {state.error}</div>}

            {busy && (
              <div className="mt-8 space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span>{state.status === "downloading-model" ? "Initializing AI Model..." : "Processing Image..."}</span>
                  <span>{state.progress}%</span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${state.progress}%` }} />
                </div>
              </div>
            )}

            {state.originalUrl && !busy && (
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-6">
                {state.status === "done" ? (
                  <button onClick={download} className="w-full sm:w-auto flex items-center justify-center px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-colors"><DownloadIcon /> Download Result</button>
                ) : (
                  <button onClick={processImage} className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all active:scale-95">Remove Background</button>
                )}
                <button onClick={reset} className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">Reset</button>
              </div>
            )}
          </div>
        </div>

        {/* Editor Interface */}
        {state.originalUrl && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-3 bg-gray-50 border-b flex justify-between items-center"><span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Original</span></div>
              <div className="p-4 bg-gray-100 flex items-center justify-center min-h-[400px]">
                <img src={state.originalUrl} alt="Original" className="max-w-full max-h-[500px] object-contain rounded-lg" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-3 bg-gray-50 border-b"><span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Nextooly Editor</span></div>
              <div className="relative flex-1 bg-gray-100 flex items-center justify-center p-4 min-h-[400px]">
                <Checkerboard />
                <div className="relative z-20 w-full h-full flex items-center justify-center">
                  {state.processedUrl ? (
                    <img src={state.processedUrl} alt="Processed" style={getPreviewStyle()} className="max-w-full max-h-[500px] object-contain rounded-lg shadow-sm" />
                  ) : (
                    <div className="animate-pulse flex flex-col items-center"><div className="h-12 w-12 bg-gray-200 rounded-full mb-3"></div><div className="h-4 w-32 bg-gray-200 rounded"></div></div>
                  )}
                </div>
              </div>

              {state.status === "done" && (
                <div className="p-6 bg-white border-t border-gray-200 space-y-6">
                  {/* Background Selector */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Background Layers</p>
                    <div className="flex flex-wrap gap-2.5 items-center">
                      <button onClick={() => setBgConfig({ type: 'transparent' })} className={`w-8 h-8 rounded-full border-2 overflow-hidden ${bgConfig.type === 'transparent' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-300'}`}><div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/checkerboard-crosshatch.png')] opacity-30" /></button>
                      {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#fbbf24'].map(c => (
                        <button
                          key={c}
                          onClick={() => setBgConfig({ type: 'color', value: c })}
                          className={`w-8 h-8 rounded-lg border-2 transition-transform active:scale-90 ${bgConfig.type === 'color' && bgConfig.value === c
                              ? 'border-blue-600 ring-2 ring-blue-100'
                              : 'border shadow-sm' // <--- Changed from border-gray-200
                            }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      {/* <div className="relative w-8 h-8 rounded-full border-2 border-gray-200 overflow-hidden cursor-pointer"><input type="color" className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0" onChange={e => setBgConfig({ type: 'color', value: e.target.value })} /></div> */}
                      <div
                        className={`relative w-8 h-8 rounded-lg border-2 transition-all active:scale-90 shadow-sm overflow-hidden ${bgConfig.type === 'color' && !['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#fbbf24'].includes(bgConfig.value)
                          ? 'border-blue-600 ring-2 ring-blue-100'
                          : 'border-gray-200'
                          }`}
                        style={{
                          backgroundColor: bgConfig.type === 'color' ? bgConfig.value : '#ffffff'
                        }}
                      >
                        <input
                          type="color"
                          className="absolute inset-0 opacity-0 cursor-pointer scale-150"
                          value={bgConfig.type === 'color' ? bgConfig.value : '#ffffff'}
                          title="Choose custom color"
                          onChange={e => setBgConfig({ type: 'color', value: e.target.value })}
                        />

                        {/* Visual "+" indicator if custom color is not selected */}
                        {!(bgConfig.type === 'color' && !['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#fbbf24'].includes(bgConfig.value)) && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-gray-400 text-lg font-light">+</span>
                          </div>
                        )}
                      </div>


                      <div className="w-px h-6 bg-gray-200 mx-1"></div>
                      <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-xs font-bold transition-all ${bgConfig.type === 'image' ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                        <ImageIcon /> <span>Replace BG</span><input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setBgConfig({ type: 'image', value: URL.createObjectURL(f), file: f }); }} />
                      </label>
                    </div>
                  </div>

                  {/* Effects Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Blur</span>
                        <span className="text-xs font-bold text-blue-600">{blur}px</span>
                      </div>
                      <input type="range" min="0" max="25" value={blur} onChange={e => setBlur(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div> */}

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Brightness</span>
                        <span className="text-xs font-bold text-blue-600">{brightness}%</span>
                      </div>
                      <input type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contrast</span>
                        <span className="text-xs font-bold text-blue-600">{contrast}%</span>
                      </div>
                      <input type="range" min="50" max="150" value={contrast} onChange={e => setContrast(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                  </div>

                  {/* Alignment (Image Only) */}
                  {bgConfig.type === 'image' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Fit & Alignment</p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'cover', label: 'Fill / Cover', sub: 'Stretch & Crop' },
                          { id: 'contain', label: 'Fit Inside', sub: 'Maintain Aspect' },
                          { id: 'fill', label: 'Stretch', sub: 'Force Fill' }
                        ].map(m => (
                          <button key={m.id} onClick={() => setFitMode(m.id as FitMode)} className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${fitMode === m.id ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                            <span className={`font-bold text-xs ${fitMode === m.id ? 'text-blue-700' : 'text-gray-700'}`}>{m.label}</span>
                            <span className="text-[9px] text-gray-400 uppercase font-medium mt-0.5">{m.sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}