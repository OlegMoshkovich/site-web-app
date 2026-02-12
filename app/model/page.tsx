"use client";

import Image from "next/image";
import { AuthButtonClient } from "@/components/auth-button-client";
import { getNavbarClasses } from "@/lib/layout-constants";

export default function ModelPage() {

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
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

      {/* Model Viewer Section - Aligns with navbar content edges */}
      <div className="flex-1 w-full flex justify-center">
        <div className="w-full max-w-6xl h-full relative">
          <iframe
            title="Speckle"
            src="https://app.speckle.systems/projects/788f7f5aab/models/6442f853fd?embedToken=a9b27a5668f2032119bd5d938d953d4a2268832aba#embed=%7B%22isEnabled%22%3Atrue%7D"
            width="100%"
            height="100%"
            frameBorder="0"
            className="w-full h-full"
            allow="fullscreen"
          />
          {/* White overlay to cover bottom branding */}
          <div className="absolute bottom-0 left-0 right-0 h-[50px] bg-white pointer-events-none" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-[43px] w-full bg-white" />
    </div>
  );
}
