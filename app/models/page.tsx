"use client";

import Image from "next/image";
import { AuthButtonClient } from "@/components/auth-button-client";
import { getNavbarClasses } from "@/lib/layout-constants";

export default function ModelsPage() {
  return (
    <div className="w-full h-screen flex flex-col">
      {/* Top navigation bar matching non-signed-in state from index page */}
      <nav className={getNavbarClasses().container}>
        <div className={getNavbarClasses().content}>
          <div className="flex items-center gap-2">
            {/* Banner logo */}
            <div className="h-8 px-2 sm:px-3 bg-transparent flex items-center justify-center rounded">
              <Image
                src="/images/banner_logo.png"
                alt="Site Banner"
                width={120}
                height={32}
                className="h-4 sm:h-6 w-auto max-w-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* AuthButton */}
            <AuthButtonClient />
          </div>
        </div>
      </nav>

      {/* Model viewer iframe - Aligns with navbar content edges */}
      <div className="flex-1 w-full flex justify-center">
        <div className="w-full max-w-6xl h-full relative">
          <iframe
            src="https://bldrs.ai/share/v/gh/OlegMoshkovich/SimpleSiteModels/main/Kranfundament%20Test.ifc"
            className="w-full h-full border-0"
            title="3D Model Viewer"
            allow="fullscreen"
          />
          {/* White overlay to cover bottom branding */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-white pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
