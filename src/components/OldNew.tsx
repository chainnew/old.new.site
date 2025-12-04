"use client";

import React, { useState, useRef, useCallback } from "react";

interface EnhanceResponse {
  enhancedUrl: string;
  error?: string;
}

const OldNew = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const enhanceImage = async (imageData: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      const data: EnhanceResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Enhancement failed");
      }

      setEnhancedImage(data.enhancedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enhancement failed");
      // Fallback: show a simulated enhancement
      setEnhancedImage(imageData);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement> | React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const file =
        "dataTransfer" in e
          ? e.dataTransfer?.files[0]
          : (e.target as HTMLInputElement).files?.[0];

      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setUploadedImage(result);
          enhanceImage(result);
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      setSliderPosition(Math.max(5, Math.min(95, x)));
    },
    [isDragging]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
      setSliderPosition(Math.max(5, Math.min(95, x)));
    },
    [isDragging]
  );

  const reset = () => {
    setUploadedImage(null);
    setEnhancedImage(null);
    setIsProcessing(false);
    setSliderPosition(50);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadImage = async () => {
    if (!enhancedImage) return;
    
    try {
      const response = await fetch(enhancedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "enhanced-photo.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback for data URLs
      const a = document.createElement("a");
      a.href = enhancedImage;
      a.download = "enhanced-photo.png";
      a.click();
    }
  };

  const isEnhanced = !isProcessing && enhancedImage !== null;

  return (
    <div className="min-h-screen relative overflow-hidden font-[var(--font-playfair)] text-[#f5e6d3]">
      {/* Grain overlay */}
      <div
        className="fixed inset-0 opacity-[0.04] pointer-events-none z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Header */}
      <header className="py-8 px-12 flex justify-between items-center relative z-10">
        <div className="flex items-baseline gap-2">
          <span
            className="text-4xl font-light tracking-tight"
            style={{
              background:
                "linear-gradient(135deg, #d4a574 0%, #f5e6d3 50%, #d4a574 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            old
          </span>
          <span className="text-4xl font-bold text-[#ff6b35]">.new</span>
        </div>
        <nav className="flex gap-10 font-[var(--font-dm-sans)] text-sm tracking-widest uppercase">
          <a href="#" className="text-[#a89080] hover:text-[#d4a574] transition-colors">
            How it works
          </a>
          <a href="#" className="text-[#a89080] hover:text-[#d4a574] transition-colors">
            Gallery
          </a>
          <a href="#" className="text-[#a89080] hover:text-[#d4a574] transition-colors">
            Pricing
          </a>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center px-8 pb-16 relative z-10">
        {/* Hero text */}
        <div className="text-center mb-12 max-w-[700px]">
          <h1 className="text-5xl font-light leading-tight mb-6 tracking-tight">
            <span className="opacity-60">Transform your</span>
            <br />
            <em className="italic text-[#d4a574]">treasured memories</em>
          </h1>
          <p className="font-[var(--font-dm-sans)] text-lg text-[#a89080] leading-relaxed font-light">
            AI-powered photo restoration that breathes new life into your vintage
            photographs.
            <br />
            Every scratch removed. Every fade reversed. Every moment preserved.
          </p>
        </div>

        {/* Upload / Processing / Result area */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setIsDragging(false)}
          className="w-full max-w-[800px] aspect-[4/3] relative rounded-lg overflow-hidden"
          style={{
            boxShadow:
              "0 25px 80px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)",
          }}
        >
          {!uploadedImage ? (
            // Upload zone
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center h-full cursor-pointer rounded-lg border-2 border-dashed border-[#4a3f35] transition-all hover:border-[#6b5845] hover:bg-[#231f1b]"
              style={{
                background: "linear-gradient(145deg, #2a2420 0%, #1e1a16 100%)",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleDrop}
                className="hidden"
              />

              {/* Vintage photo frame icon */}
              <div
                className="w-[120px] h-[140px] rounded p-2 mb-8 transform -rotate-3"
                style={{
                  background: "linear-gradient(145deg, #3d3530, #2a2420)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                }}
              >
                <div
                  className="w-full h-[85%] rounded-sm flex items-center justify-center"
                  style={{
                    background: "linear-gradient(145deg, #8b7355, #6b5845)",
                  }}
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#d4a574"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              </div>

              <p className="text-xl mb-2 text-[#d4a574]">
                Drop your photograph here
              </p>
              <p className="font-[var(--font-dm-sans)] text-sm text-[#6b5845]">
                or click to browse • JPG, PNG, TIFF
              </p>
            </label>
          ) : isProcessing ? (
            // Processing animation
            <div className="flex flex-col items-center justify-center h-full bg-[#1e1a16] relative">
              <img
                src={uploadedImage}
                alt="Processing"
                className="absolute inset-0 w-full h-full object-cover opacity-30"
                style={{ filter: "sepia(60%) brightness(0.7)" }}
              />

              {/* Scanning line animation */}
              <div className="absolute inset-0 overflow-hidden">
                <div
                  className="absolute left-0 right-0 h-[3px]"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, #ff6b35, #d4a574, #ff6b35, transparent)",
                    boxShadow: "0 0 30px #ff6b35, 0 0 60px #ff6b35",
                    animation: "scan 2s ease-in-out infinite",
                  }}
                />
              </div>

              <div className="relative z-[2] text-center">
                <div
                  className="w-[60px] h-[60px] border-2 border-[#4a3f35] border-t-[#ff6b35] rounded-full mx-auto mb-6"
                  style={{ animation: "spin 1s linear infinite" }}
                />
                <p className="text-xl text-[#d4a574]">Restoring your memory...</p>
                <p className="font-[var(--font-dm-sans)] text-sm text-[#6b5845] mt-2">
                  Analyzing • Enhancing • Colorizing
                </p>
              </div>
            </div>
          ) : isEnhanced ? (
            // Before/After comparison
            <div className="relative h-full select-none">
              {/* Before (sepia/old) */}
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={uploadedImage}
                  alt="Before"
                  className="w-full h-full object-cover"
                  style={{
                    filter:
                      "sepia(80%) contrast(0.9) brightness(0.85) saturate(0.7)",
                  }}
                />
                <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1.5 rounded font-[var(--font-dm-sans)] text-xs tracking-widest uppercase text-[#a89080]">
                  Original
                </div>
              </div>

              {/* After (enhanced) - clipped */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <img
                  src={enhancedImage}
                  alt="After"
                  className="w-full h-full object-cover"
                  style={{
                    filter: "contrast(1.1) saturate(1.2) brightness(1.05)",
                  }}
                />
                <div
                  className="absolute bottom-4 left-4 px-3 py-1.5 rounded font-[var(--font-dm-sans)] text-xs tracking-widest uppercase text-[#1a1612] font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #ff6b35, #d4a574)",
                  }}
                >
                  Enhanced
                </div>
              </div>

              {/* Slider handle */}
              <div
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
                className="absolute top-0 bottom-0 w-1 bg-[#f5e6d3] cursor-ew-resize"
                style={{
                  left: `${sliderPosition}%`,
                  transform: "translateX(-50%)",
                  boxShadow: "0 0 20px rgba(0,0,0,0.5)",
                }}
              >
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(145deg, #f5e6d3, #d4a574)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1a1612"
                    strokeWidth="2.5"
                  >
                    <path d="M8 12H16M8 12L10 9M8 12L10 15M16 12L14 9M16 12L14 15" />
                  </svg>
                </div>
              </div>

              {/* Reset button */}
              <button
                onClick={reset}
                className="absolute top-4 right-4 bg-black/60 border border-white/10 rounded-lg px-4 py-2.5 text-[#f5e6d3] font-[var(--font-dm-sans)] text-sm cursor-pointer flex items-center gap-2 transition-all hover:-translate-y-0.5"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Try another
              </button>
            </div>
          ) : null}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 px-4 py-2 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 font-[var(--font-dm-sans)] text-sm">
            {error} - Showing simulated enhancement
          </div>
        )}

        {/* Features */}
        {!uploadedImage && (
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-[900px] w-full">
            {[
              {
                icon: "✨",
                title: "AI Enhancement",
                desc: "Neural networks trained on millions of vintage photographs",
              },
              {
                icon: "🎨",
                title: "Smart Colorization",
                desc: "Historically accurate colors brought back to life",
              },
              {
                icon: "🔍",
                title: "Detail Recovery",
                desc: "Advanced upscaling reveals hidden details",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="text-center p-8 rounded-xl border border-[#d4a574]/10"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(42,36,32,0.5), rgba(30,26,22,0.5))",
                }}
              >
                <span className="text-3xl block mb-4">{feature.icon}</span>
                <h3 className="text-lg font-normal mb-2 text-[#d4a574]">
                  {feature.title}
                </h3>
                <p className="font-[var(--font-dm-sans)] text-sm text-[#6b5845] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Download CTA when enhanced */}
        {isEnhanced && (
          <div className="mt-8 flex gap-4">
            <button
              onClick={downloadImage}
              className="border-none rounded-lg px-10 py-4 text-white font-[var(--font-dm-sans)] text-base font-semibold cursor-pointer transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #ff6b35, #e55a2b)",
                boxShadow: "0 4px 20px rgba(255,107,53,0.3)",
              }}
            >
              Download Enhanced Photo
            </button>
            <button className="bg-transparent border border-[#4a3f35] rounded-lg px-8 py-4 text-[#d4a574] font-[var(--font-dm-sans)] text-base cursor-pointer transition-all hover:-translate-y-0.5 hover:border-[#6b5845]">
              Share Result
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default OldNew;
