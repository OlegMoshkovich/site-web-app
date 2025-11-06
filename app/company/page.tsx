"use client";

import { useCallback } from "react";
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
  const t = useCallback(
    (key: keyof typeof translations.en) => {
      const value = translations[language][key];
      return typeof value === "string" ? value : "";
    },
    [language],
  );

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
                clone:it
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
              <h1 className="text-3xl  md:text-4xl font-black text-black mb-8 leading-tight ml-[10px] md:ml-0">
                The new version of
                construction site supervision.
                <br />
                We develope and implement bespoke technology solutions for the construction site we manage and supervise.
              </h1>
          


        {/* Offered Services */}
        <div className="mb-16">
          
          <div className="w-[100%] mx-auto">
            <Accordion type="multiple" >
              <AccordionItem value="site-planning">
                <AccordionTrigger>SITE PLANNING</AccordionTrigger>
                <AccordionContent>
                  Comprehensive site planning services including layout design, 
                  resource allocation, and timeline optimization for construction projects.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="site-supervision">
                <AccordionTrigger>SITE SUPERVISION</AccordionTrigger>
                <AccordionContent>
                  Professional on-site supervision ensuring quality control, 
                  safety compliance, and project milestone adherence.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="site-management">
                <AccordionTrigger>SITE MANAGEMENT</AccordionTrigger>
                <AccordionContent>
                  End-to-end site management solutions covering logistics, 
                  personnel coordination, and progress tracking.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Technology Section */}
        <div className="mb-16">
          <div className="max-w-3xl mx-auto text-center mb-12">
          </div>
          <h1 className="text-3xl  md:text-4xl font-black text-black mb-8 leading-tight ml-[10px] md:ml-0">
              We are the first users of our tools, we develop them for ourselves, 
              and we also make them available to the world, please try.
              </h1>
          

          
          <div className="space-y-2">
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="site-management-app">
                <AccordionTrigger>SITE MANAGEMENT APP</AccordionTrigger>
                <AccordionContent>
                  Mobile application for real-time site management including task assignment, 
                  progress tracking, and team communication.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="augmented-reality-app">
                <AccordionTrigger>AUGMENTED REALITY APP</AccordionTrigger>
                <AccordionContent>
                  Innovative AR application for visualizing construction plans, 
                  identifying potential issues, and enhancing on-site decision making.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Projects Section */}
        <div className="mb-16">
          <h1 className="text-3xl  md:text-4xl font-black text-black mb-8 leading-tight ml-[10px] md:ml-0">
          We are proud of our projects and the value we offer to the world, below are
          some of the current and the past project we did together.
              </h1>
          
          <div className="space-y-2">
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="power-plant">
                <AccordionTrigger>POWER PLANT - MUNICH</AccordionTrigger>
                <AccordionContent>
                  Large-scale power plant construction project in Munich featuring 
                  advanced energy infrastructure and sustainable technology implementation.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="cheese-factory">
                <AccordionTrigger>CHEESE FACTORY - WELS</AccordionTrigger>
                <AccordionContent>
                  Modern cheese manufacturing facility in Wels with specialized 
                  climate control systems and automated production lines.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="infrastructure">
                 <AccordionTrigger>INFRASTRUCTURE - WELS</AccordionTrigger>
                <AccordionContent>
                  Critical infrastructure development project in Wels including 
                  transportation networks and utility systems.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Partnership Section */}
        <div className="mb-16">
           <h1 className="text-3xl  md:text-4xl font-black text-black mb-8 leading-tight ml-[10px] md:ml-0">
          We are the industry insiders and understand the challenged of the
              construction sites. <br /> We also recognise all the constructions sites have unique components,
              that is why we pilot our technology with the leaders in the AEC space to
              jointly come up with the best tools for the construction management.
              </h1>

          
          <div className="space-y-2">
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="dr">
                <AccordionTrigger>DB</AccordionTrigger>
                <AccordionContent>
                  Strategic partnership with DR for technology development and 
                  implementation in construction management solutions.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="dr-sauber">
                  <AccordionTrigger>DR SAUBER + PARTNERS</AccordionTrigger>
                <AccordionContent>
                  Collaborative pilot program with Dr Sauber + Partners focusing on 
                  innovative construction methodologies and quality assurance.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="strabag">
                <AccordionTrigger>STRABAG</AccordionTrigger>
                <AccordionContent>
                  Partnership with STRABAG for large-scale construction project management 
                  and technology integration across European markets.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Footer Section */}
        <div className="text-center">
          
          <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="w-full h-full bg-black overflow-hidden flex items-center justify-center">
              <img src="/images/paul.png" alt="Paul" className="w-full h-full object-cover" />
            </div>
            <div className="w-full h-full bg-black overflow-hidden flex items-center justify-center">
              <img src="/images/liebhard.jpg" alt="Paul" className="w-full h-full object-cover" />
            </div>
            <div className="w-full h-full bg-black overflow-hidden flex items-center justify-center">
              <img src="/images/timur.jpg" alt="Paul" className="w-full h-full object-cover" />
            </div>
            <div className="w-full h-full bg-black overflow-hidden flex items-center justify-center">
              <img src="/images/oleg.png" alt="Paul" className="w-full h-full object-cover" />
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