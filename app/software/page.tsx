"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserManualCarousel } from "@/components/user-manual-carousel";
import { Footer } from "@/components/footer";
import { CampaignModal } from "@/components/campaign-modal";
import { AuthButtonClient } from "@/components/auth-button-client";

export default function SoftwarePage() {
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center relative">
      {/* Background */}
      <div
        className="fixed inset-0 -z-10 bg-black bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/images/backgound.png)",
          transform: "translateZ(0)",
          WebkitTransform: "translateZ(0)",
        }}
      />

      <div className="flex-1 w-full flex flex-col gap-0 items-center">
        <nav className="sticky top-0 z-50 w-full bg-transparent">
          <div className="w-full max-w-6xl flex justify-between items-center px-3 sm:px-8 h-16 mx-auto">
            <div className="flex items-center gap-6">
              <Link href="/services" className="font-bold text-white text-base bg-black px-3 py-1 border border-gray-800">clone:it</Link>
              <div className="hidden sm:flex items-center gap-6">
                <Link href="/services" className="text-sm text-gray-100 hover:text-white transition-colors">Services</Link>
                <Link href="/blog" className="text-sm text-gray-100 hover:text-white transition-colors">Blog</Link>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <AuthButtonClient />
            </div>

            {/* Hamburger */}
            <button
              className="sm:hidden flex items-center justify-center w-8 h-8"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <line x1="0" y1="1" x2="16" y2="1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="0" y1="6" x2="16" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="0" y1="11" x2="16" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </nav>

        {/* Full-screen mobile menu overlay */}
        {menuOpen && (
          <div className="sm:hidden fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header row */}
            <div className="flex justify-between items-center px-3 h-16">
              <Link href="/services" onClick={() => setMenuOpen(false)} className="font-bold text-white text-base bg-black px-3 py-1 border border-gray-800">clone:it</Link>
              <button
                className="flex items-center justify-center w-8 h-8"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <line x1="1" y1="1" x2="15" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="15" y1="1" x2="1" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            {/* Links */}
            <div className="flex flex-col gap-6 px-3 pt-8">
              <Link href="/services" onClick={() => setMenuOpen(false)} className="text-sm text-gray-400 hover:text-white transition-colors">
                Services
              </Link>
              <Link href="/blog" onClick={() => setMenuOpen(false)} className="text-sm text-gray-400 hover:text-white transition-colors">
                Blog
              </Link>
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="text-sm text-gray-400 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link href="/auth/sign-up" onClick={() => setMenuOpen(false)} className="text-sm text-gray-400 hover:text-white transition-colors">
                Sign up
              </Link>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col gap-0 w-full max-w-6xl mx-auto px-3 sm:px-8 py-1 sm:py-3 md:py-4">
          <div className="w-full">
            <div className="text-center py-8 sm:py-10">
              <h1 className="text-4xl sm:text-7xl md:text-8xl lg:text-6xl font-bold text-white mb-8">
                Simple solution for a digital construction site
              </h1>
              <div className="mt-8">
                <div className="flex justify-center">
                  <Suspense
                    fallback={
                      <div className="w-[600px] h-[300px] sm:h-[400px] bg-gray-200 animate-pulse rounded-lg" />
                    }
                  >
                    <UserManualCarousel width={600} mobileHeight={300} desktopHeight={400} />
                  </Suspense>
                </div>
                <div className="h-14 mt-2 flex justify-center">
                  <a
                    href="https://apps.apple.com/us/app/simple-site/id6749160249"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative transition-opacity hover:opacity-80"
                  >
                    <Image
                      src="/app_screens/available-app-store_1.png"
                      alt="Available on the App Store"
                      width={100}
                      height={30}
                      className="h-10 w-auto object-contain max-w-[300px] rounded-lg"
                    />
                  </a>
                </div>
              </div>
            </div>

            <Footer user={null} textColor="text-white" />
          </div>
        </div>
      </div>

      <CampaignModal isOpen={showCampaignModal} onClose={() => setShowCampaignModal(false)} />
    </main>
  );
}
