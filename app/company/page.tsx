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

export default function CompanyPage() {
  // Language management with localStorage persistence
  const { language, setLanguage, mounted } = useLanguage();

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
        <div className="w-full sm:w-[67%] mx-auto">
          <div>
            <div className="text-left pt-[50px] pb-20 sm:py-12">
              <h1 className="text-3xl  md:text-4xl font-bold text-black mb-8 leading-tight ml-[10px] md:ml-0 break-words hyphens-auto">
                {t("companyHeroTitle")}
              </h1>
          


        {/* Offered Services */}
        <div className="mb-16">
          
       
        <div className="space-y-2 mx-[10px] md:mx-0">
            <Accordion type="multiple" >
              <AccordionItem value="site-planning">
                <AccordionTrigger>SITE PLANNING</AccordionTrigger>
                <AccordionContent>
                  <p className="text-xl  md:text-xl  text-black mb-8 leading-tight ml-[10px] md:ml-0 break-words hyphens-auto">{t("sitePlanningContent")}</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="site-supervision">
                <AccordionTrigger>SITE SUPERVISION</AccordionTrigger>
                <AccordionContent>
                  <p className="text-xl  md:text-xl  text-black mb-8 leading-tight ml-[10px] md:ml-0">{t("siteSupervisionContent")}</p> 
                </AccordionContent>
              </AccordionItem>
              
             
            </Accordion>
          </div>
        </div>

        {/* Technology Section */}
        <div className="mb-16">
          <div className="max-w-3xl mx-auto text-center mb-12">
          </div>
          <h1 className="text-3xl  md:text-4xl font-bold text-black mb-8 leading-tight ml-[10px] md:ml-0 break-words hyphens-auto">
              {t("companyTechnologyTitle")}
              </h1>
          

          
          <div className="space-y-2 mx-[10px] md:mx-0">
          <Accordion type="multiple" >
              <AccordionItem value="site-management-app">
                <AccordionTrigger>SITE MANAGEMENT APP</AccordionTrigger>
                <AccordionContent>
                
                  
                  <img
                    src="/products/site.png"
                    alt="Site Management App"
                    className="w-full h-auto rounded-lg mb-4 object-cover"
                  />
                    <p className="text-xl  md:text-xl  text-black mb-8 leading-tight ml-[10px] md:ml-0">
                  {t("siteManagementAppContent")}
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="augmented-reality-app">
                <AccordionTrigger>AUGMENTED REALITY</AccordionTrigger>
                <AccordionContent>
                
                 
                  <img
                    src="/products/ar.png"
                    alt="DB Partnership"
                    className="w-full h-auto rounded-lg mb-4 object-cover"
                  />
                  <p className="text-xl  md:text-xl  text-black mb-8 leading-tight ml-[10px] md:ml-0">
                {t("augmentedRealityContent")}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Projects Section */}
        <div className="mb-16">
          <h1 className="text-3xl  md:text-4xl font-bold text-black mb-8 leading-tight ml-[10px] md:ml-0 break-words hyphens-auto">
          {t("companyProjectsTitle")}
              </h1>
          
           
          <div className="space-y-2 mx-[10px] md:mx-0">
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="power-plant">
                <AccordionTrigger>GEOTHERMAL PLANT</AccordionTrigger>
                <AccordionContent>
                <img
                    src="/projects/powerplant.png"
                    alt="DB Partnership"
                    className="w-full h-auto rounded-lg mb-4 object-cover"
                  />
                  <p className="text-xl  md:text-xl  text-black mb-8 leading-tight ml-[10px] md:ml-0"> {t("powerPlantContent")}</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="cheese-factory">
                <AccordionTrigger>CHEESE FACTORY</AccordionTrigger>
                <AccordionContent>
                  <p className="text-xl  md:text-xl  text-black mb-8 leading-tight ml-[10px] md:ml-0"> {t("cheeseFactoryContent")}</p>
                </AccordionContent>
              </AccordionItem>
              

            </Accordion>
          </div>
        </div>

        {/* Partnership Section */}
        <div className="mb-16">
           <h1 className="text-3xl  md:text-4xl font-bold text-black mb-8 leading-tight ml-[10px] md:ml-0 break-words hyphens-auto">
          {t("companyPartnershipsTitle")}
              </h1>

          
          <div className="space-y-2 mx-[10px] md:mx-0">
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="dr">
                <AccordionTrigger>DB</AccordionTrigger>
                <AccordionContent>
                  <img
                    src="/pilots/DB.png"
                    alt="DB Partnership"
                    className="w-full h-auto rounded-lg mb-4 object-cover"
                  />
                  <p className="text-xl  md:text-xl  text-black mb-8 leading-tight ml-[10px] md:ml-0"> {t("dbPartnershipContent")}</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="dr-sauber">
                <AccordionTrigger>DR SAUBER + PARTNERS</AccordionTrigger>
                <AccordionContent>
                  <img
                    src="/pilots/DR.png"
                    alt="DR Sauber + Partners"
                    className="w-full h-auto rounded-lg mb-4 object-cover"
                  />
                  <p className="text-xl  md:text-xl  text-black mb-8 leading-tight ml-[10px] md:ml-0"> {t("drSauberPartnershipContent")}</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="strabag">
                <AccordionTrigger>STRABAG</AccordionTrigger>
                <AccordionContent>
                  <img
                    src="/pilots/STRABAG.png"
                    alt="STRABAG Partnership"
                    className="w-full h-auto rounded-lg mb-4 object-cover"
                  />
                  {t("strabagPartnershipContent")}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Footer Section */}
        <div className="text-center">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-[10px] md:mx-auto">
            <div className="flex flex-col">
              <div className="w-full h-full bg-black overflow-hidden flex items-center justify-center ">
                <img src="/images/paul.png" alt="Paul" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-md font-medium">Paul</span>
                <a href="" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="w-full h-full bg-black overflow-hidden flex items-center justify-center ">
                <img src="/images/liebhard.jpg" alt="Liebhard" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-md font-medium">Liebhard</span>
                <a href="" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="w-full h-full bg-black overflow-hidden flex items-center justify-center ">
                <img src="/images/timur.jpg" alt="Timur" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-md font-medium">Timur</span>
                <a href="" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="w-full h-full bg-black overflow-hidden flex items-center justify-center">
                <img src="/images/oleg.png" alt="Oleg" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-md font-medium">Oleg</span>
                <a href="" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
            </div>
          </div>
        </div>
<div className="w-full">
  <Footer />
</div>
      </div>
    </main>
  );
}