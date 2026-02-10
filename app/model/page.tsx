"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AuthButtonClient } from "@/components/auth-button-client";
import { getNavbarClasses } from "@/lib/layout-constants";

export default function ModelPage() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col">
      {/* Top navigation bar */}
      <nav className={`${getNavbarClasses().container} bg-white`}>
        <div className={`${getNavbarClasses().content} max-w-none w-full px-2 sm:px-4`}>
          <div className="flex items-center gap-2">
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
            <AuthButtonClient />
          </div>
        </div>
      </nav>
      {/* Model Viewer Section - Full screen on mobile */}
      <div className="relative w-full flex-1">
        <iframe
          title="Speckle"
          src="https://app.speckle.systems/projects/788f7f5aab/models/6442f853fd?embedToken=a9b27a5668f2032119bd5d938d953d4a2268832aba#embed=%7B%22isEnabled%22%3Atrue%7D"
          width="100%"
          height="100%"
          frameBorder="0"
          className="w-full h-full"
          allow="fullscreen"
          onLoad={() => setIsLoading(false)}
        />
      </div>
      <div className="absolute bottom-0 left-0 h-[43px] w-full bg-white" />
    </div>
  );
}
