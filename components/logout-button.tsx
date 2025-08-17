"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const logout = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={logout} 
      variant="outline" 
      size="sm"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Logging out...
        </>
      ) : (
        "Logout"
      )}
    </Button>
  );
}
