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
// Layout constants
import { getNavbarClasses, getContentClasses } from "@/lib/layout-constants";
import Image from "next/image";
// Supabase client for database operations
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
        <div className={getContentClasses().widthOnly}>
          <div>
           
          


        {/* Offered Services */}
        <div className="mb-0">
          <div className="text-left pt-[50px]">
              <h1 className="text-xl  md:text-2xl sm:text-xl lg:text-2xl font-semibold text-black mb-8 leading-tight ml-[10px] md:ml-0 break-words hyphens-auto">
                {t("companyHeroTitle")}
              </h1>

          <div className="space-y-2 mx-[10px] md:mx-0">
            <Accordion type="multiple" >
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

        {/* Technology Section */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
          </div>
          <h1 className="text-xl  md:text-2xl sm:text-xl lg:text-2xl font-semibold text-black mb-8 leading-tight ml-[10px] md:ml-0 break-words hyphens-auto">
              {t("companyTechnologyTitle")}
              </h1>
          

          
          <div className="space-y-2 mx-[10px] md:mx-0">
          <Accordion type="multiple" >
              <AccordionItem value="site-management-app">
                <AccordionTrigger>Site Management App</AccordionTrigger>
                <AccordionContent>
                
                <div className="flex justify-center">
                  <Image
                    src="/products/site.png"
                    alt="Site Management App"
                    width={400}
                    height={300}
                    className="w-1/2 h-auto rounded-lg mb-4 object-cover"
                  />
                  </div>
       
                  {t("siteManagementAppContent")}
        
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="augmented-reality-app">
                <AccordionTrigger>Augmented Reality</AccordionTrigger>
                <AccordionContent>
                
                 
                  <div className="flex justify-center">
                    <Image
                      src="/products/ar.png"
                      alt="Augmented Reality App"
                      width={200}
                      height={150}
                      className="w-1/2 h-auto rounded-lg mb-4 object-cover"
                    />
                  </div>
                
                {t("augmentedRealityContent")}
             
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Projects Section */}
        <div className="mb-8">
          <h1 className="text-xl  md:text-2xl sm:text-xl lg:text-2xl font-semibold text-black mb-8 leading-tight ml-[10px] md:ml-0 break-words hyphens-auto text-left">
            {t("companyProjectsTitle")}
              </h1>
          
           
          <div className="space-y-2 mx-[10px] md:mx-0">
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="power-plant">
                  <AccordionTrigger>Geothermal Plant</AccordionTrigger>
                <AccordionContent>
                <div className="flex justify-center">
                <Image
                    src="/projects/powerplant.png"
                    alt="Geothermal Plant"
                    width={400}
                    height={300}
                    className="w-1/2 h-auto rounded-lg mb-4 object-cover"
                  />
                  </div>
                  {t("powerPlantContent")}
                  
                </AccordionContent>
              </AccordionItem>
              
              

            </Accordion>
          </div>
        </div>

        {/* Partnership Section */}
        {/* <div className="mb-16">
           <h1 className="text-2xl  md:text-2xl font-semibold text-black mb-8 leading-tight ml-[10px] md:ml-0 break-words hyphens-auto">
          {t("companyPartnershipsTitle")}
              </h1>

          
          <div className="space-y-2 mx-[10px] md:mx-0">
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="dr">
                <AccordionTrigger>Deutsche Bahn</AccordionTrigger>
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
                <AccordionTrigger>Dr Sauber + Partners</AccordionTrigger>
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
        </div> */}

        {/* Footer Section */}
        <div className="text-center">
        <h1 className="text-xl md:text-2xl sm:text-xl lg:text-2xl font-semibold text-black mb-8 leading-tight ml-[10px] md:ml-0 break-words hyphens-auto text-left">
        Team
        </h1>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-[10px] md:mx-auto">
            <div className="flex flex-col">
              <div className="w-full h-full bg-black overflow-hidden flex items-center justify-center ">
                <Image src="/images/paul.png" alt="Paul" width={200} height={200} className="w-full h-full object-cover " />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium">Paul</span>
                <span className="text-sm font-medium text-gray-300">Enginner</span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="w-full h-full bg-black overflow-hidden flex items-center justify-center ">
                <Image src="/images/liebhard.jpg" alt="Liebhard" width={200} height={200} className="w-full h-full object-cover " />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium">Liebhard </span>
                <span className="text-sm font-medium text-gray-300">Enginner</span>
              </div>
            </div>

            
            <div className="flex flex-col">
              <div className="w-full h-full bg-black overflow-hidden flex items-center justify-center">
                <Image src="/images/oleg.png" alt="Oleg" width={200} height={200} className="w-full h-full object-cover " />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium">Oleg </span>
                <span className="text-sm font-medium text-gray-300">Enginner</span>
              </div>
            </div>

            {/* <div className="flex flex-col">
              <a
                href="https://www.convex.at/projekte/ccpp-muenchen-sued/?lang=en"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-full bg-black overflow-hidden flex items-center justify-center"
              >
                <Image src="/images/timur.jpg" alt="Timur" width={200} height={200} className="w-full h-full object-cover grayscale" />
              </a>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium">Timur </span>
                <span className="text-sm font-medium text-gray-300">Enginner PhD</span>
              </div>
            </div>  */}

       
          </div>
        </div>

        {/* Footer */}
        <Footer />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}