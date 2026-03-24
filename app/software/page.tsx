"use client";

import { Suspense } from "react";
import Image from "next/image";
import { UserManualCarousel } from "@/components/user-manual-carousel";
import { HomeNavbar } from "@/components/home-navbar";
import { Footer } from "@/components/footer";
import { CampaignModal } from "@/components/campaign-modal";
import { useState } from "react";

export default function SoftwarePage() {
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center relative">
      {/* Background */}
      <div
        className="fixed inset-0 -z-10 bg-black bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/images/backgound.png)",
          transform: "translateZ(0)",
          WebkitTransform: "translateZ(0)",
        }}
      />

      <div className="flex-1 w-full flex flex-col gap-0 items-center">
        <HomeNavbar
          user={null}
          showSearchSelector={false}
          onToggleSearch={() => {}}
          showLabelSelector={false}
          onToggleLabelSelector={() => {}}
          selectedLabels={[]}
          showDateSelector={false}
          onToggleDateSelector={() => {}}
          hasActiveFilters={false}
          areAccordionsExpanded={false}
          onToggleAccordions={() => {}}
          onShowCampaignModal={() => setShowCampaignModal(true)}
          t={() => ""}
        />

        <div className="flex-1 flex flex-col gap-0 w-full max-w-6xl mx-auto px-3 sm:px-8 py-1 sm:py-3 md:py-4">
          <div className="w-full">
            <div className="text-center py-8 sm:py-10">
              <h1 className="text-4xl sm:text-7xl md:text-8xl lg:text-6xl font-bold text-white mb-8">
                Simple solution for a digital construction site
              </h1>
              <div className="mt-8">
                <div className="flex justify-center">
                  <Suspense
                    fallback={
                      <div className="w-[600px] h-[300px] sm:h-[400px] bg-gray-200 animate-pulse rounded-lg" />
                    }
                  >
                    <UserManualCarousel width={600} mobileHeight={300} desktopHeight={400} />
                  </Suspense>
                </div>
                <div className="h-14 mt-2 flex justify-center">
                  <a
                    href="https://apps.apple.com/us/app/simple-site/id6749160249"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative transition-opacity hover:opacity-80"
                  >
                    <Image
                      src="/app_screens/available-app-store_1.png"
                      alt="Available on the App Store"
                      width={100}
                      height={30}
                      className="h-10 w-auto object-contain max-w-[300px] rounded-lg"
                    />
                  </a>
                </div>
              </div>
            </div>

            <Footer user={null} textColor="text-white" />
          </div>
        </div>
      </div>

      <CampaignModal isOpen={showCampaignModal} onClose={() => setShowCampaignModal(false)} />
    </main>
  );
}
