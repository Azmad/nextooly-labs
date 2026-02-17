import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import Footer from "@/components/layout/Footer"; // Updated import path

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nextooly Labs",
  description: "Experimental client-side tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <div className="flex-1">
            {children}
        </div>
        {/* Footer goes here */}
        <Footer /> 
        <Analytics />
      </body>
    </html>
  );
}