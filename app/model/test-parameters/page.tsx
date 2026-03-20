"use client";

import Image from "next/image";
import Link from "next/link";
import { AuthButtonClient } from "@/components/auth-button-client";
import { getNavbarClasses } from "@/lib/layout-constants";

export default function ModelTestParametersPage() {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      <nav className={getNavbarClasses().container}>
        <div className={getNavbarClasses().content}>
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

      <div className="flex-1 w-full">
        <iframe
          title="Speckle"
          src="https://app.speckle.systems/projects/f49286cce4/models/a32fb9371b?embedToken=295ee988a5cd5d6e12ee843e6741b01da30848653c#embed=%7B%22isEnabled%22%3Atrue%7D"
          className="w-full h-full border-0"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
