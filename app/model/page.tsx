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

      {/* Full-window Speckle project iframe */}
      <div className="flex-1 w-full">
        <iframe
          title="Speckle"
          src="https://app.speckle.systems/projects/f49286cce4"
          className="w-full h-full border-0"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
