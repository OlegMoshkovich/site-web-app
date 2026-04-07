"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "./logout-button";
import { useEffect, useState } from "react";

type AuthButtonClientProps = {
  /** Dark navbar (e.g. legal pages on black background) */
  appearance?: "default" | "dark";
};

export function AuthButtonClient({ appearance = "default" }: AuthButtonClientProps) {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: { user: { id: string; email?: string } } | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (!mounted || isLoading) {
    return null;
  }

  const isDark = appearance === "dark";

  return user ? (
    <div className="flex items-center gap-4">
      <LogoutButton
        className={
          isDark
            ? "border-gray-600 bg-transparent text-gray-200 hover:bg-gray-900 hover:text-white"
            : undefined
        }
      />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button
        asChild
        size="sm"
        variant="outline"
        className={
          isDark
            ? "h-8 px-3 text-sm border-gray-600 bg-transparent text-gray-200 hover:bg-gray-900 hover:text-white"
            : "h-8 px-3 text-sm"
        }
      >
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <div className="hidden md:block">
        <Button
          asChild
          size="sm"
          variant={isDark ? "outline" : "default"}
          className={
            isDark
              ? "h-8 px-3 text-sm border-gray-600 bg-white text-black hover:bg-gray-200"
              : "h-8 px-3 text-sm"
          }
        >
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
      </div>
    </div>
  );
}
