"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Footer } from "@/components/footer";
import { AuthButtonClient } from "@/components/auth-button-client";
import Link from "next/link";
import { translations, type Language, useLanguage } from "@/lib/translations";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// Layout constants
import { getNavbarClasses, getContentClasses } from "@/lib/layout-constants";
import Image from "next/image";
import { TypewriterText } from "@/components/typewriter-text";
// Supabase client for database operations
// Custom language hook that defaults to German for about page
function useLanguageWithGermanDefault() {
  const [language, setLanguageState] = useState<Language>('de');
  const [mounted, setMounted] = useState(false);

  // Load language from localStorage on mount, but default to German if nothing is saved
  useEffect(() => {
    const savedLanguage = localStorage.getItem('about-page-language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'de')) {
      setLanguageState(savedLanguage);
    } else {
      // Default to German for about page
      setLanguageState('de');
    }
    setMounted(true);
  }, []);

  // Save language to localStorage when it changes
  const setLanguage = useCallback((newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('about-page-language', newLanguage);
  }, []);

  return { language, setLanguage, mounted };
}

export default function CompanyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Language management with German default for about page
  const { language, setLanguage, mounted } = useLanguageWithGermanDefault();
  // State for controlling typewriter sequence
  const [showFirstTitle, setShowFirstTitle] = useState(false);
  const [showSecondTitle, setShowSecondTitle] = useState(false);
  // State for modal
  const [showModal, setShowModal] = useState(false);

  // Check for modal parameter in URL on mount
  useEffect(() => {
    if (searchParams.get('modal') === 'campaign') {
      setShowModal(true);
    }
  }, [searchParams]);

  // Function to open modal and update URL
  const openModal = useCallback(() => {
    setShowModal(true);
    const params = new URLSearchParams(searchParams);
    params.set('modal', 'campaign');
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Function to close modal and update URL
  const closeModal = useCallback(() => {
    setShowModal(false);
    const params = new URLSearchParams(searchParams);
    params.delete('modal');
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Helper function to get translated text based on current language
  const t = (key: keyof typeof translations.en) => {
    const value = translations[language][key];
    return typeof value === "string" ? value : "";
  };

  // ===== MAIN RENDER =====
  if (!mounted) {
    return null;
  }

  return (
    <main className="flex flex-col items-center">
      <div className="w-full flex flex-col gap-0 items-center">
        {/* Navigation header with language selector and auth */}
        <nav className={getNavbarClasses().container}>
          <div className={getNavbarClasses().content}>
            <div className="flex text-lg gap-5 items-center font-semibold">
              <Link 
                href="/" 
                className="text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors"
              >

                  <Image
                    src="/images/banner_logo.png"
                    alt="Site Banner"
                    width={120}
                    height={32}
                    className="h-4 sm:h-6 w-auto max-w-none"
                  />
              
              </Link>
            </div>
            <div className="flex items-center gap-2">
              {/* Green square button */}
              <button
                onClick={openModal}
                className="h-8 w-8 bg-[#00FF1A] hover:bg-green-600 transition-colors cursor-pointer flex items-center justify-center"
                title="View Campaign"
              >
                <span className="text-white text-xs"></span>
              </button>
              
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
        <div className={getContentClasses().container}>
          <div className={getContentClasses().inner}>

          <div className="text-center mt-10">
        {/* <h1 className="text-xl md:text-2xl sm:text-xl lg:text-2xl font-semibold text-black leading-tight">
        Team
        </h1> */}
          
          <div className="flex justify-center items-center gap-2 sm:gap-4 md:gap-8 flex-nowrap max-w-2xl mx-auto">
            <div className="flex flex-col items-center">
                  <div className="w-24 h-32 sm:w-32 sm:h-40 md:w-40 md:h-60 bg-black overflow-hidden flex items-center justify-center">
                <Image
                  src="/images/paul.png"
                  alt="Paul"
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col items-center mt-2">
                <span className="text-xs sm:text-sm font-medium">Paul</span>
                <span className="text-xs sm:text-sm font-medium text-gray-300">Enginner</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
                <div className="w-24 h-32 sm:w-32 sm:h-40 md:w-40 md:h-60 bg-black overflow-hidden flex items-center justify-center">
                <Image
                  src="/images/liebhard.jpg"
                  alt="Liebhard"
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col items-center mt-2">
                <span className="text-xs sm:text-sm font-medium">Liebhard</span>
                <span className="text-xs sm:text-sm font-medium text-gray-300">Enginner</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-24 h-32 sm:w-32 sm:h-40 md:w-40 md:h-60 bg-black overflow-hidden flex items-center justify-center">
                <Image
                  src="/images/oleg.png"
                  alt="Oleg"
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col items-center mt-2">
                <span className="text-xs sm:text-sm font-medium">Oleg</span>
                <span className="text-xs sm:text-sm font-medium text-gray-300">Enginner</span>
              </div>
            </div>
          </div>
        </div>
        {/* Offered Services */}
        <div className="mb-0">
          <div className="pt-[30px]">
              <div className="flex items-center h-[140px] md:h-[80px]">
                <h1 className="text-lg md:text-2xl sm:text-xl lg:text-2xl font-semibold text-black leading-tight w-full">
                  <TypewriterText 
                    text={t("companyHeroTitle")} 
                    speed={80}
                    onComplete={() => {
                      setShowSecondTitle(true);
                      // Scroll into view or any action AFTER all text is displayed
                    }}
                  />
                </h1>
              </div>

          <div className="space-y-2 pt-10">
            <Accordion type="multiple" >
            <AccordionItem value="site-management-app">
                <AccordionTrigger>Construction IT Services</AccordionTrigger>
                <AccordionContent>
                
                  {t("siteManagementAppContent")}
        
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="site-planning">
                <AccordionTrigger>Site Planning</AccordionTrigger>
                <AccordionContent>
                  {t("sitePlanningContent")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="site-supervision">
                <AccordionTrigger>Site Supervision</AccordionTrigger>
                <AccordionContent>
                {t("siteSupervisionContent")}
                </AccordionContent>
              </AccordionItem>
             
            </Accordion>
          </div>
        </div>



        {/* Footer Section */}
       

        {/* Footer */}
        <Footer />
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal for campaign image */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div 
            className="bg-black w-full h-full relative flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl z-10"
            >
              ×
            </button>
            <div className="flex justify-center items-center w-full h-full p-4">
              <Image
                src="/campaign/CloneitToTheMoon.png"
                alt="Cloneit To The Moon Campaign"
                width={1200}
                height={800}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}