"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AILabPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#EDE8E0]">
      {/* Navigation */}
      <nav className="w-full bg-[#EDE8E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0">
          <div className="flex justify-between items-start py-6">
            {/* Logo */}
            <div className="flex items-center">
              <div className="bg-black text-white p-2 font-mono text-sm leading-tight tracking-widest">
                <div className="text-center px-2 ">T H E</div>
                <div className="text-center px-2 ">A I R</div>
                <div className="text-center px-2 ">L A B</div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-col items-end space-y-1 pt-1">
              <a href="#demos" className="text-gray-800 hover:text-gray-600 font-medium text-right">
                Demos
              </a>
              <a href="#funding" className="text-gray-800 hover:text-gray-600 font-medium text-right">
                Funding
              </a>
              <a href="#papers" className="text-gray-800 hover:text-gray-600 font-medium text-right">
                Papers
              </a>
              <a href="#team" className="text-gray-800 hover:text-gray-600 font-medium text-right">
                Team
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-800" />
              ) : (
                <Menu className="h-6 w-6 text-gray-800" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-300 bg-[#EDE8E0]">
            <div className="px-4 py-3 space-y-3">
              <a
                href="#demos"
                className="block text-gray-800 hover:text-gray-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Demos
              </a>
              <a
                href="#funding"
                className="block text-gray-800 hover:text-gray-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Funding
              </a>
              <a
                href="#papers"
                className="block text-gray-800 hover:text-gray-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Papers
              </a>
              <a
                href="#team"
                className="block text-gray-800 hover:text-gray-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Team
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="w-full min-h-screen bg-[#E1DECF] px-4 sm:px-6 lg:px-0 flex items-start pt-32">
        <div className="max-w-7xl mx-auto w-full">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900">
            Welcome to
            <br />
            The AI Research Lab,
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-4xl leading-relaxed mt-6">
            where our primary focus is on{" "}
            <span className="font-semibold">eliminating uncertainty</span>,{" "}
            <span className="font-semibold">creating diversity</span>, and finding
            better reliable ways to{" "}
            <span className="font-semibold">train the language models.</span>
          </p>
        </div>
      </section>

      {/* Eliminating Uncertainty Section */}
      <section className="w-full min-h-screen bg-[#401903] px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="text-white">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 tracking-wide">
                ELIMINATING UNCERTAINTY
              </h2>
              <p className="text-base md:text-lg mb-8 leading-relaxed">
                We look inside the black box, connecting the dots, finding the
                faults, to eliminate uncertainty and create variety, solving one
                of the most pressing fundamental AI issues.
              </p>
              <Button
                variant="outline"
                className="bg-white text-gray-900 hover:bg-gray-100 border-none px-8 py-2"
              >
                LEARN MORE
              </Button>
            </div>
            <div className="relative w-full aspect-square md:aspect-auto md:h-96 flex items-center justify-center">
              <Image
                src="/illustrations/1.png"
                alt="Eliminating Uncertainty Illustration"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Creating Diversity Section */}
      <section className="w-full min-h-screen bg-[#685747] px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="text-white">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 tracking-wide">
                CREATING DIVERSITY
              </h2>
              <p className="text-base md:text-lg mb-8 leading-relaxed">
                We look inside the black box, connecting the dots, finding the
                faults, to eliminate uncertainty and create variety, solving one
                of the most pressing fundamental AI issues.
              </p>
              <Button
                variant="outline"
                className="bg-white text-gray-900 hover:bg-gray-100 border-none px-8 py-2"
              >
                LEARN MORE
              </Button>
            </div>
            <div className="relative w-full aspect-square md:aspect-auto md:h-96 flex items-center justify-center">
              <Image
                src="/illustrations/2.png"
                alt="Creating Diversity Illustration"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* New Ways of Training Section */}
      <section className="w-full min-h-screen bg-[#2C3E50] px-4 sm:px-6 lg:px-0 flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="text-white">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 tracking-wide">
                NEW WAYS OF TRAINING
              </h2>
              <p className="text-lg md:text-xl mb-12 leading-relaxed max-w-xl">
                We look inside the black box, connecting the dots, finding the
                faults, to eliminate uncertainty and create variety, solving one
                of the most pressing fundamental AI issues.
              </p>
              <Button
                variant="outline"
                className="bg-[#E8E4DC] text-gray-900 hover:bg-gray-200 border-none px-10 py-6 text-base font-semibold tracking-wide"
              >
                LEARN MORE
              </Button>
            </div>
            <div className="relative w-full aspect-square md:aspect-auto md:h-[500px] flex items-center justify-center">
              <Image
                src="/illustrations/1.png"
                alt="New Ways of Training Illustration"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
