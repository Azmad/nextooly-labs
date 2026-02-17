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
import type { Metadata } from "next";

// 1. Import the Page Shell & Components
import NextoolyToolPageShell from "@/components/tools/NextoolyToolPageShell";
import RelatedToolsSection from "@/components/tools/RelatedToolsSection";
import { HowToGridSection, FaqListSection } from "@/components/tools/NextoolyContentBlocks";
import JsonLdSchema from "@/components/tools/JsonLdSchema";

// 2. Import your actual Tool Component
import ImageBackgroundRemoverTool from "@/components/ImageBackgroundRemoverTool";

export const metadata: Metadata = {
  title: "Free Background Remover – Remove Image Backgrounds Online | Nextooly Labs",
  description: "Remove background from images instantly using AI. 100% free, client-side tool that runs securely in your browser. No sign-up required.",
};

export default function BackgroundRemoverPage() {
  
  // --- A. Define Related Tools (Using your URLs) ---
  const relatedTools = [
    {
      name: "Image Compressor",
      desc: "Reduce image file size without losing quality. Optimize JPG, PNG & WebP.",
      href: "https://nextooly.com/tools/image-compressor",
      badge: "Popular"
    },
    {
      name: "Image Watermark",
      desc: "Protect your work by adding custom text or logo watermarks to your photos.",
      href: "https://nextooly.com/tools/image-watermark"
    },
    {
      name: "Image Metadata",
      desc: "View hidden Exif data, camera settings, and location info from any photo.",
      href: "https://nextooly.com/tools/image-metadata-viewer"
    },
    {
      name: "Image Cropper",
      desc: "Crop, rotate, and resize your images to fit any social media aspect ratio.",
      href: "https://nextooly.com/tools/image-cropper"
    }
  ];

  // --- B. Define How-To Steps ---
  const howToSteps = [
    { 
      step: "1", 
      title: "Upload Image", 
      desc: "Click the upload area or drag and drop a JPG or PNG image containing a clear subject." 
    },
    { 
      step: "2", 
      title: "AI Processing", 
      desc: "Our browser-based AI will automatically detect the subject and separate it from the background." 
    },
    { 
      step: "3", 
      title: "Review Result", 
      desc: "Preview the transparent image. The checkerboard pattern indicates transparent areas." 
    },
    { 
      step: "4", 
      title: "Download", 
      desc: "Save your new background-free image as a PNG file to your device instantly." 
    },
  ];

  // --- C. Define FAQs ---
  const faqs = [
    {
      q: "Is this background remover really free?",
      a: "Yes, it is 100% free. Unlike other tools that charge for HD downloads, Nextooly Labs allows you to process unlimited images at full quality."
    },
    {
      q: "Does my image get uploaded to a server?",
      a: "No. This tool runs entirely in your browser. Your photos are processed locally on your device and are never sent to our servers, ensuring complete privacy."
    },
    {
      q: "What image formats are supported?",
      a: "We currently support JPG, PNG, and WebP formats. For best results, use an image with a clearly defined subject."
    },
    {
      q: "Why is the background removal sometimes imperfect?",
      a: "The AI works best when there is good contrast between the subject and the background. Complex hair details or low-light images may require manual touch-ups (coming soon)."
    }
  ];

  // --- D. Render the Page Shell ---
  return (
    <NextoolyToolPageShell
      // Header Info
      schema={
        <JsonLdSchema 
          name="AI Background Remover"
          description="Remove image backgrounds automatically in 5 seconds. 100% free & private."
          url="https://labs.nextooly.com/image-background-remover"
        />
      }
      title="AI Background Remover"
      description="Remove image backgrounds automatically in 5 seconds. 100% free & private."
      
      // Breadcrumbs
      breadcrumbLabel="Background Remover"
      categoryLabel="Image Tools"
      categoryHref="https://nextooly.com/category/image-media"
      
      // The Main Tool
      tool={<ImageBackgroundRemoverTool />}
      
      // Content Below the Tool
      belowTool={
        <>
          {/* 1. How-To Guide */}
          <HowToGridSection heading="How to remove background from image" steps={howToSteps} />
          
          {/* 2. FAQs */}
          <FaqListSection heading="Frequently Asked Questions" faqs={faqs} />
          
          {/* 3. Related Tools (Now Last) */}
          <RelatedToolsSection title="More Image Tools" tools={relatedTools} />
        </>
      }
    />
  );
}