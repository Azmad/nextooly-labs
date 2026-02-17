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
import Cropper from 'react-easy-crop';

const ESM_BG_REMOVAL_URL = "https://esm.sh/@imgly/background-removal@1.5.5";
const IMGLY_PUBLIC_PATH = "https://staticimgly.com/@imgly/background-removal-data/1.5.5/dist/";

type RemoveBgFn = (src: string, config: any) => Promise<Blob>;

// ===============================
// 1. IMPROVED CROP PRESETS
// ===============================
type CropPreset = {
  id: string;
  label: string;
  ratio: number | null; // null = freeform
};

const CROP_PRESETS: CropPreset[] = [
  { id: "free", label: "Free", ratio: null },
  { id: "square", label: "Square (1:1)", ratio: 1 },
  { id: "linkedin", label: "LinkedIn (1:1)", ratio: 1 },
  { id: "instagram", label: "Instagram DP (1:1)", ratio: 1 },
  { id: "passport-india", label: "Passport – India (3.5:4.5)", ratio: 3.5 / 4.5 },
  { id: "passport-us", label: "Passport – US (2:2)", ratio: 1 },
  { id: "portrait", label: "Portrait (4:5)", ratio: 4 / 5 },
  { id: "landscape", label: "Landscape (16:9)", ratio: 16 / 9 },
];

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

// --- Utility: Crop Image ---
async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image for cropping"));
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    pixelCrop.width, pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas is empty"));
    }, "image/png");
  });
}

// --- Helper Functions ---
async function loadRemoveBackground(): Promise<RemoveBgFn> {
  const url = ESM_BG_REMOVAL_URL;
  const mod = await import(/* webpackIgnore: true */ url);
  const fn = mod.removeBackground || mod.default || (typeof mod === "function" ? mod : null);
  if (!fn || typeof fn !== "function") throw new Error("Could not find background removal function.");
  return fn as RemoveBgFn;
}

// Icons
const UploadIcon = () => (<svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>);
const DownloadIcon = () => (<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>);
const ImageIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>);
const CropIcon = () => (<svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>);
const RefreshIcon = () => (<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>);

const Checkerboard = () => (
  <div
    className="absolute inset-0 z-0 bg-white pointer-events-none"
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
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isDragging, setIsDragging] = useState(false);

  // --- Crop State ---
  const [isCroppingOriginal, setIsCroppingOriginal] = useState(false);
  const [isCroppingResult, setIsCroppingResult] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [activePresetId, setActivePresetId] = useState<string>("free");
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [tempCompositeUrl, setTempCompositeUrl] = useState<string | null>(null);

  const busy = state.status === "downloading-model" || state.status === "processing";
  const removeBgFnRef = useRef<RemoveBgFn | null>(null);
  const processIdRef = useRef<number>(0);

  // Memory cleanup ref
  const prevBgUrlRef = useRef<string | null>(null);

  // --- BG Config Cleanup ---
  useEffect(() => {
    if (bgConfig.type === 'image') {
      if (prevBgUrlRef.current && prevBgUrlRef.current !== bgConfig.value) {
        URL.revokeObjectURL(prevBgUrlRef.current);
      }
      prevBgUrlRef.current = bgConfig.value;
    } else if (prevBgUrlRef.current) {
      URL.revokeObjectURL(prevBgUrlRef.current);
      prevBgUrlRef.current = null;
    }
  }, [bgConfig]);

  // --- Canvas Engine (For Download Only) ---
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
            await new Promise<void>((r, rej) => {
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
              bgImg.onerror = () => rej(new Error("Failed to load bg image"));
              bgImg.src = config.value;
            });
          }
          ctx.restore();
        }

        // 2. Draw Foreground
        ctx.save();
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
        ctx.drawImage(img, 0, 0);
        ctx.restore();

        canvas.toBlob((blob) => blob ? resolve(blob) : reject("Blob failed"), "image/png");
      };
      img.onerror = () => reject(new Error("Failed to load foreground"));
      img.src = foregroundUrl;
    });
  }, [fitMode, blur, brightness, contrast]);

  const handleCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // --- Crop Logic: Original ---
  const applyOriginalCrop = async () => {
    if (!state.originalUrl || !croppedAreaPixels) return;
    try {
      const croppedBlob = await getCroppedImg(state.originalUrl, croppedAreaPixels);
      const newUrl = URL.createObjectURL(croppedBlob);
      setState(prev => ({
        ...prev,
        originalFile: new File([croppedBlob], "cropped.png", { type: "image/png" }),
        originalUrl: newUrl,
        processedUrl: null, // Reset processed since source changed
        status: "ready"
      }));
      setIsCroppingOriginal(false);
      setZoom(1);
    } catch (e) { console.error(e); }
  };

  // --- Crop Logic: Result (NON-DESTRUCTIVE) ---
  const startResultCrop = useCallback(async () => {
    if (!state.processedUrl) return;
    setTempCompositeUrl(state.processedUrl); 
    setIsCroppingResult(true);
    setZoom(1);
    setAspect(undefined); 
    setActivePresetId("free");
  }, [state.processedUrl]);

  const cancelResultCrop = () => {
    setIsCroppingResult(false);
    setTempCompositeUrl(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const applyResultCrop = async () => {
    if (!tempCompositeUrl || !croppedAreaPixels) return;
    try {
      const croppedBlob = await getCroppedImg(tempCompositeUrl, croppedAreaPixels);
      const newUrl = URL.createObjectURL(croppedBlob);
      setState(prev => ({ ...prev, processedUrl: newUrl, processedBlob: croppedBlob }));
      cancelResultCrop(); 
    } catch (e) { console.error(e); }
  };

  // --- Global Cleanup ---
  useEffect(() => {
    return () => {
      if (state.originalUrl) URL.revokeObjectURL(state.originalUrl);
      if (state.processedUrl) URL.revokeObjectURL(state.processedUrl);
      if (prevBgUrlRef.current) URL.revokeObjectURL(prevBgUrlRef.current);
    };
  }, []);

  // --- Temp Cleanup ---
  useEffect(() => {
    return () => {
      if (tempCompositeUrl) URL.revokeObjectURL(tempCompositeUrl);
    };
  }, [tempCompositeUrl]);

  // --- Preload Model ---
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
    setBlur(0); setBrightness(100); setContrast(100);
    setIsCroppingOriginal(false); setIsCroppingResult(false);
  }, []);

  const handleFileSelection = useCallback((file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    processIdRef.current += 1;
    setState({ originalFile: file, originalUrl: URL.createObjectURL(file), processedUrl: null, processedBlob: null, status: "ready", progress: 0, error: null });
  }, []);

  const processImage = useCallback(async () => {
    if (!state.originalUrl) return;
    const currentId = processIdRef.current;

    try {
      setState(p => ({ ...p, status: "downloading-model", progress: 1 }));
      const removeBackground = removeBgFnRef.current || await loadRemoveBackground();
      if (currentId !== processIdRef.current) return;

      setState(p => ({ ...p, status: "processing", progress: 5 }));

      const resultBlob = await removeBackground(state.originalUrl, {
        publicPath: IMGLY_PUBLIC_PATH,
        model: "medium",
        progress: (_: any, c: number, t: number) => {
          if (currentId === processIdRef.current) {
            setState(p => ({
              ...p,
              progress: Math.min(90, Math.max(p.progress, Math.round((c / t) * 100)))
            }));
          }
        }
      });

      if (currentId === processIdRef.current) {
        setState(p => ({ ...p, processedBlob: resultBlob, processedUrl: URL.createObjectURL(resultBlob), status: "done", progress: 100 }));
      }
    } catch (err: any) {
      if (currentId === processIdRef.current) {
        setState(p => ({ ...p, status: "error", error: err.message }));
      }
    }
  }, [state.originalUrl]);

  const download = useCallback(async () => {
    if (!state.processedUrl) return;
    try {
      const blob = await generateCompositeImage(state.processedUrl, bgConfig);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${state.originalFile?.name?.split('.')[0] || 'edit'}-nextooly.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (e) { console.error("Download failed", e); }
  }, [state.processedUrl, bgConfig, generateCompositeImage, state.originalFile]);

  // --- Styles ---
  const getBackgroundStyle = () => ({
    position: 'absolute' as const, inset: 0, zIndex: 0,
    transition: 'all 0.3s ease',
    backgroundColor: bgConfig.type === 'color' ? bgConfig.value : 'transparent',
    backgroundImage: bgConfig.type === 'image' ? `url(${bgConfig.value})` : 'none',
    backgroundSize: fitMode === 'fill' ? '100% 100%' : fitMode,
    backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
    filter: blur > 0 ? `blur(${blur}px)` : 'none',
  });

  const getForegroundStyle = () => ({
    position: 'relative' as const, zIndex: 10,
    transition: 'all 0.3s ease',
    filter: `brightness(${brightness}%) contrast(${contrast}%)`
  });

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setBgConfig({ type: 'image', value: URL.createObjectURL(f), file: f });
      setFitMode('cover'); 
    }
    e.target.value = '';
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    const preset = CROP_PRESETS.find(p => p.id === newId);
    if (preset) {
      setActivePresetId(newId);
      setAspect(preset.ratio || undefined);
    }
  };

  return (
    // Changed h-screen to min-h-screen for mobile scrolling
    <div className="min-h-screen bg-gray-50 p-4 font-sans flex flex-col">
      <div className="w-full max-w-[1600px] mx-auto flex-1 flex flex-col gap-4">

        {/* 1. UPLOAD AREA */}
        {!state.originalUrl && (
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-10 w-full mt-10">
            <div onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileSelection(e.dataTransfer.files[0]); }}
              className={`relative group border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all cursor-pointer ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}`}>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => handleFileSelection(e.target.files?.[0] || null)} />
              <div className="flex flex-col items-center">
                <UploadIcon />
                <p className="text-lg font-medium text-gray-700">Drag & drop or <span className="text-blue-600">click to upload</span></p>
                <p className="text-sm text-gray-500 mt-1">High resolution PNG, JPG, WEBP</p>
              </div>
            </div>
            {state.error && <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">⚠️ {state.error}</div>}
          </div>
        )}

        {/* 2. LOADING STATE */}
        {busy && (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-lg text-center mt-10">
            <div className="h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{state.status === "downloading-model" ? "Loading AI Model..." : "Removing Background..."}</h3>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${state.progress}%` }} />
            </div>
          </div>
        )}

        {/* 3. MAIN WORKSPACE */}
        {state.originalUrl && !busy && (
          // Grid for Desktop, Stack for Mobile
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* LEFT COLUMN: ORIGINAL */}
            {/* Hidden on mobile if done processing, shown if processing/ready */}
            <div className={`${state.status === "done" ? "hidden lg:flex lg:col-span-4" : "flex col-span-1 lg:col-span-6 lg:col-start-4"} bg-white rounded-xl shadow-sm border border-gray-200 flex-col overflow-hidden transition-all duration-500 min-h-[50vh] lg:min-h-0`}>
              <div className="p-3 bg-gray-50 border-b flex justify-between items-center h-[53px]">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{isCroppingOriginal ? "Crop Mode" : "Original"}</span>
                {state.status === "ready" && !isCroppingOriginal && (
                  <button onClick={() => { setIsCroppingOriginal(true); setAspect(undefined); setActivePresetId("free"); }} className="flex items-center text-xs bg-white border px-2 py-1 rounded hover:bg-gray-50 font-bold text-gray-700 shadow-sm"><CropIcon /> Crop</button>
                )}
              </div>
              <div className="relative flex-1 bg-gray-100 flex items-center justify-center overflow-hidden min-h-[300px]">
                {isCroppingOriginal ? (
                  <div className="absolute inset-0 bg-black z-10 flex flex-col">
                    <div className="relative flex-1">
                      <Cropper image={state.originalUrl} crop={crop} zoom={zoom} aspect={aspect} onCropChange={setCrop} onCropComplete={handleCropComplete} onZoomChange={setZoom} />
                    </div>
                    {/* ASPECT RATIO CONTROLS */}
                    <div className="bg-black/90 p-3 border-t border-gray-800 flex justify-center z-50 safe-area-bottom">
                      <select value={activePresetId} onChange={handlePresetChange} className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-blue-500 w-full max-w-[200px]">
                        {CROP_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                      </select>
                    </div>
                    <div className="p-3 flex justify-center gap-2 bg-black/90 border-t border-gray-800 safe-area-bottom">
                      <button onClick={() => { setIsCroppingOriginal(false); setZoom(1); }} className="px-4 py-2 bg-white rounded-full text-xs font-bold shadow hover:bg-gray-100">Cancel</button>
                      <button onClick={applyOriginalCrop} className="px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-bold shadow hover:bg-blue-700">Done</button>
                    </div>
                  </div>
                ) : (
                  <img src={state.originalUrl} alt="Original" className="max-w-full max-h-full object-contain p-4" />
                )}
              </div>
              {state.status === "ready" && (
                <div className="p-6 border-t bg-white">
                  <button onClick={processImage} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2">
                    <span>✨ Remove Background</span>
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: EDITOR (Result + Toolkit) */}
            {state.status === "done" && (
              <div className="col-span-1 lg:col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col lg:flex-row overflow-hidden animate-in slide-in-from-right-8 duration-500 fade-in">
                
                {/* MIDDLE: RESULT CANVAS */}
                <div className="flex-1 flex flex-col min-w-0 border-b lg:border-b-0 lg:border-r border-gray-200 min-h-[50vh] lg:min-h-0 order-1">
                  <div className="p-3 bg-gray-50 border-b flex justify-between items-center h-[53px]">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Result</span>
                    {!isCroppingResult && (
                      <button onClick={startResultCrop} className="flex items-center text-xs bg-white border px-2 py-1 rounded hover:bg-gray-50 font-bold text-gray-700 shadow-sm transition-all">
                        <CropIcon /> Crop
                      </button>
                    )}
                  </div>

                  <div className="flex-1 relative bg-gray-100 flex items-center justify-center overflow-hidden min-h-0">
                    {isCroppingResult && tempCompositeUrl ? (
                      <div className="absolute inset-0 bg-gray-50/10 z-50 flex flex-col">
                        <div className="relative flex-1">
                          {/* RENDER ACTIVE BACKGROUND BEHIND CROPPER */}
                          <div style={getBackgroundStyle()} className="z-0" />
                          <Cropper
                            image={tempCompositeUrl}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspect}
                            onCropChange={setCrop}
                            onCropComplete={handleCropComplete}
                            onZoomChange={setZoom}
                          />
                        </div>
                        {/* RESULT CROP CONTROLS */}
                        <div className="bg-black/90 p-2 border-t border-gray-800 flex justify-center z-50 safe-area-bottom">
                          <select value={activePresetId} onChange={handlePresetChange} className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-blue-500 w-full max-w-[200px]">
                            {CROP_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                          </select>
                        </div>
                        <div className="p-3 w-full flex justify-center gap-3 bg-black/90 border-t border-gray-800 z-50 safe-area-bottom">
                          <button onClick={cancelResultCrop} className="bg-white px-4 py-2 rounded-full font-bold shadow-lg text-sm hover:bg-gray-100">Cancel</button>
                          <button onClick={applyResultCrop} className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-lg text-sm hover:bg-blue-700">Apply Crop</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Checkerboard />
                        <div className="relative inline-flex max-w-full max-h-full rounded-lg overflow-hidden shadow-2xl transition-all duration-300 m-4">
                          <div style={getBackgroundStyle()} />
                          {state.processedUrl && (
                            <img src={state.processedUrl} alt="Processed" style={getForegroundStyle()} className="block max-w-full max-h-full object-contain" />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* RIGHT SIDEBAR: TOOLKIT */}
                {/* On mobile: Order 2 (below result), Full Width. On Desktop: Fixed Width */}
                <div className={`w-full lg:w-[320px] bg-white flex flex-col h-auto lg:h-full transition-all duration-300 order-2 border-t lg:border-t-0 ${isCroppingResult ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                  <div className="p-4 border-b bg-gray-50 flex justify-between items-center h-[53px]">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">Toolkit</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar max-h-[40vh] lg:max-h-none">
                    {/* Backgrounds */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Background</p>
                      <div className="grid grid-cols-4 gap-2">
                        <button onClick={() => setBgConfig({ type: 'transparent' })} className={`aspect-square rounded-lg border-2 overflow-hidden ${bgConfig.type === 'transparent' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200'}`} title="Transparent">
                          <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/checkerboard-crosshatch.png')] opacity-30" />
                        </button>

                        <div className={`aspect-square rounded-lg border-2 relative overflow-hidden ${bgConfig.type === 'color' && !['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#fbbf24'].includes(bgConfig.value) ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200'}`}>
                          <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" value={bgConfig.type === 'color' ? bgConfig.value : '#ffffff'} onChange={e => setBgConfig({ type: 'color', value: e.target.value })} />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ backgroundColor: bgConfig.type === 'color' ? bgConfig.value : 'white' }}>
                            <span className="text-gray-400 font-light text-xl mix-blend-difference">+</span>
                          </div>
                        </div>

                        {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#fbbf24'].map(c => (
                          <button key={c} onClick={() => setBgConfig({ type: 'color', value: c })} className={`aspect-square rounded-lg transition-all ${bgConfig.type === 'color' && bgConfig.value === c ? 'ring-2 ring-blue-600 ring-offset-2' : 'border border-gray-200 shadow-sm'}`} style={{ backgroundColor: c }} />
                        ))}
                      </div>

                      <label className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:bg-gray-50 text-xs font-bold text-gray-600 transition-all touch-manipulation">
                        <ImageIcon /> Upload Image BG
                        <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
                      </label>

                      {/* --- FIT & ALIGNMENT CONTROLS --- */}
                      {bgConfig.type === 'image' && (
                        <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fit & Alignment</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'cover', label: 'Fill / Cover', sub: 'Stretch & Crop' },
                              { id: 'contain', label: 'Fit Inside', sub: 'Maintain Aspect' },
                              { id: 'fill', label: 'Stretch', sub: 'Force Fill' },
                            ].map((mode) => (
                              <button
                                key={mode.id}
                                onClick={() => setFitMode(mode.id as FitMode)}
                                className={`flex flex-col text-left px-2 py-2 rounded-lg border transition-all touch-manipulation ${
                                  fitMode === mode.id
                                    ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <span className={`text-[10px] font-bold leading-tight ${fitMode === mode.id ? 'text-blue-700' : 'text-gray-700'}`}>
                                  {mode.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Adjustments */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Adjustments</p>
                      {bgConfig.type !== 'transparent' && (
                        <div>
                          <div className="flex justify-between mb-1"><span className="text-xs text-gray-600">Blur BG</span><span className="text-xs font-bold text-blue-600">{blur}px</span></div>
                          <input type="range" min="0" max="20" value={blur} onChange={e => setBlur(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 touch-pan-x" />
                        </div>
                      )}
                      <div>
                        <div className="flex justify-between mb-1"><span className="text-xs text-gray-600">Brightness</span><span className="text-xs font-bold text-blue-600">{brightness}%</span></div>
                        <input type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 touch-pan-x" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1"><span className="text-xs text-gray-600">Contrast</span><span className="text-xs font-bold text-blue-600">{contrast}%</span></div>
                        <input type="range" min="50" max="150" value={contrast} onChange={e => setContrast(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 touch-pan-x" />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t bg-gray-50 flex flex-col gap-3 mt-auto safe-area-bottom">
                    <button onClick={download} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center justify-center touch-manipulation">
                      <DownloadIcon /> Download
                    </button>
                    <button onClick={reset} className="w-full py-2 text-gray-500 hover:text-red-600 font-semibold text-xs flex items-center justify-center gap-1 transition-colors touch-manipulation">
                      <RefreshIcon /> Start Over
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}