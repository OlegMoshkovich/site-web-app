"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ModelPage() {
  const supabase = createClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: authData, error } = await supabase.auth.getUser();
      if (error || !authData.user) {
        router.push('/auth/login');
        return;
      }
      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [router, supabase.auth]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      {/* Model Viewer Section - Full screen on mobile */}
      <div className="w-full h-full">
        <iframe
          title="Speckle"
          src="https://app.speckle.systems/projects/788f7f5aab/models/6442f853fd?embedToken=a9b27a5668f2032119bd5d938d953d4a2268832aba#embed=%7B%22isEnabled%22%3Atrue%7D"
          width="100%"
          height="100%"
          frameBorder="0"
          className="w-full h-full"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
