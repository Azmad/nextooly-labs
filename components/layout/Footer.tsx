import React from 'react';

const MAIN_SITE = "https://nextooly.com";
const GITHUB_REPO = "https://github.com/Azmad/nextooly-labs"; 

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-200 bg-gray-50 mt-auto pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-5 text-sm text-gray-600">
        
        {/* Left: Copyright */}
        <div>
          © {year} <span className="font-bold text-gray-900">Nextooly Labs</span>.
        </div>

        {/* Center: Open Source Link */}
        <div className="flex items-center gap-2">
            <span>Powered by</span>
            <a 
                href="https://img.ly" 
                target="_blank" 
                rel="noreferrer" 
                className="underline hover:text-gray-900"
            >
                IMG.LY
            </a>
            <span>•</span>
            <a 
                href={GITHUB_REPO} 
                target="_blank" 
                rel="noreferrer"
                className="text-blue-600 font-medium hover:underline"
            >
                Source Code
            </a>
        </div>

        {/* Right: Legal Links */}
        <div className="flex gap-5">
          <a href={`${MAIN_SITE}/privacy`} className="hover:text-gray-900 hover:underline">
            Privacy
          </a>
          <a href={`${MAIN_SITE}/terms`} className="hover:text-gray-900 hover:underline">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}