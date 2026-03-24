"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AuthButtonClient } from "@/components/auth-button-client";
import { getNavbarClasses } from "@/lib/layout-constants";

export default function ModelCustomPage() {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      <nav className={getNavbarClasses().container}>
        <div className="w-full flex justify-between items-center px-2 text-sm h-16">
          <div className="flex items-center gap-2">
            <Link href="/" className="h-8 px-2 sm:px-3 bg-transparent flex items-center justify-center rounded hover:opacity-80">
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
            <AuthButtonClient />
          </div>
        </div>
      </nav>

      <div className="flex-1 w-full relative">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900" />
          </div>
        )}
        <iframe
          title="Speckle"
          src="https://app.speckle.systems/projects/f49286cce4/models/5ec1fa78d6?embedToken=95eaf20b48b8953f23bbb6c331dade5f529aeae43d#embed=%7B%22isEnabled%22%3Atrue%7D"
          className="w-full h-full border-0"
          allow="fullscreen"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>
    </div>
  );
}
