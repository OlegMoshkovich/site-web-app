"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  const logout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Button 
      onClick={logout} 
      variant="outline" 
      size="sm"
      className={cn("h-8 w-8 px-0 flex items-center justify-center", className)}
      title="Logout"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
