"use client";

// React hooks for state management  
import { useState, useCallback } from "react";
// Lucide React icons
// Footer component
import { Footer } from "@/components/footer";
// Authentication component
import { AuthButtonClient } from "@/components/auth-button-client";
// Next.js Link component for navigation
import Link from "next/link";
// Translation system
import { translations, type Language, useLanguage } from "@/lib/translations";

// Main component for the tunnels page
export default function Tunnels() {
  // Language management with localStorage persistence
  const { language, setLanguage, mounted } = useLanguage();
  
  // Photo modal state for tunnel photos
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{src: string, alt: string} | null>(null);

  // Helper function to get translated text based on current language
  const t = useCallback(
    (key: keyof typeof translations.en) => {
      const value = translations[language][key];
      return typeof value === "string" ? value : "";
    },
    [language],
  );

  // ===== PHOTO MODAL FUNCTIONALITY =====
  const handleOpenPhotoModal = useCallback((photo: {src: string, alt: string}) => {
    setSelectedPhoto(photo);
    setPhotoModalOpen(true);
  }, []);

  const handleClosePhotoModal = useCallback(() => {
    setPhotoModalOpen(false);
    setSelectedPhoto(null);
  }, []);

  // ===== MAIN RENDER =====
  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-0 items-center">
        {/* Navigation header with language selector and auth */}
        <nav className="sticky top-0 z-20 w-full flex justify-center h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="w-full max-w-5xl flex justify-between items-center px-3 sm:px-5 text-sm">
            <div className="flex text-lg gap-5 items-center font-semibold">
              <Link 
                href="/" 
                className="text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors"
              >
                {t("siteTitle")}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              {/* Language selector */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="h-8 w-8 px-0 text-sm border border-gray-300 bg-white focus:outline-none focus:border-gray-400 cursor-pointer appearance-none text-center"
                style={{ textAlignLast: "center" }}
              >
                <option value="en">EN</option>
                <option value="de">DE</option>
              </select>

              <AuthButtonClient />
            </div>
          </div>
        </nav>

        {/* Main content area */}
        <div className="flex-1 flex flex-col gap-0 max-w-5xl px-3 sm:px-5">
          <div className="w-full">
            <div className="text-center py-10 sm:py-12" style={{paddingBottom: '2px'}}>
                <h1 className="text-4xl sm:text-7xl md:text-8xl lg:text-6xl font-bold text-gray-900 mb-8">
                  {t("welcomeTitle")}
                </h1>

                {/* Tunnel Photos Gallery */}
                <div className="mt-8 max-w-4xl mx-auto">
                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    {[
                      { src: "/tunnels/15.PNG", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/1.JPG", alt: "Tunnel Construction Site 1" },               
                      { src: "/tunnels/2.jpg", alt: "Tunnel Construction Site 2" },
                      { src: "/tunnels/10.jpg", alt: "Tunnel Construction Site 10" },
                      { src: "/tunnels/8.jpg", alt: "Tunnel Construction Site 8" },
                      { src: "/tunnels/4.JPG", alt: "Tunnel Construction Site 4" },
                      { src: "/tunnels/3.JPG", alt: "Tunnel Construction Site 3" },
                      { src: "/tunnels/17.jpg", alt: "Tunnel Construction Site 11" },    
                      { src: "/tunnels/9.jpg", alt: "Tunnel Construction Site 9" },
                      { src: "/tunnels/7.jpg", alt: "Tunnel Construction Site 7" },     
                      { src: "/tunnels/14.PNG", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/12.JPG", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/13.PNG", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/5.JPG", alt: "Tunnel Construction Site 5" },
                      { src: "/tunnels/6.JPG", alt: "Tunnel Construction Site 6" },
                      { src: "/tunnels/11.jpg", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/22.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/21.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/23.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/24.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/25.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/26.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/27.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/28.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/29.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/30.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/31.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/32.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/33.jpg", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/34.jpg", alt: "Tunnel Construction Site 11" },
                    ].map((photo, index) => (
                      <div 
                        key={index} 
                        className="relative overflow-hidden rounded-none shadow-lg bg-gray-100 aspect-[4/3] cursor-pointer"
                        onClick={() => handleOpenPhotoModal(photo)}
                      >
                        <img
                          src={photo.src}
                          alt={photo.alt}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>

   
      <Footer />

      {/* Simple Photo Modal */}
      {photoModalOpen && selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-75"
            onClick={handleClosePhotoModal}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-none max-w-4xl max-h-[90vh] overflow-hidden">
            
            {/* Image */}
            <div className="relative">
              <img
                src={selectedPhoto.src}
                alt={selectedPhoto.alt}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </main>
  );
}