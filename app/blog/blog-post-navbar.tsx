"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/translations";

function LangSwitcher({ language, setLanguage }: { language: "de" | "en"; setLanguage: (l: "de" | "en") => void }) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => setLanguage("de")}
        className={`${language === "de" ? "text-white" : "text-gray-600 hover:text-gray-400"} transition-colors`}
      >
        DE
      </button>
      <span className="text-gray-800">|</span>
      <button
        onClick={() => setLanguage("en")}
        className={`${language === "en" ? "text-white" : "text-gray-600 hover:text-gray-400"} transition-colors`}
      >
        EN
      </button>
    </div>
  );
}

export function BlogPostNavbar() {
  const { language, setLanguage } = useLanguage();

  return (
    <nav className="fixed top-0 z-50 w-full flex justify-center h-16 bg-black">
      <div className="w-full max-w-6xl flex justify-between items-center px-3 sm:px-8 text-md">
        <Link href="/services" className="font-bold text-white text-base bg-black px-3 py-1 border border-gray-800">
          clone:it
        </Link>
        <LangSwitcher language={language} setLanguage={setLanguage} />
      </div>
    </nav>
  );
}
