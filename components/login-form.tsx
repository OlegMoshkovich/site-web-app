"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useLanguage, useTranslations } from "@/lib/translations";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get('invitation');
  const { language } = useLanguage();
  const t = useTranslations(language);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      // If there's an invitation token, redirect to accept invitation
      if (invitationToken) {
        router.push(`/invitations/${invitationToken}`);
        return;
      }

      // Check if user should see onboarding
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          // First check if user has any existing data (sites, collaborations, observations)
          const { data: existingData } = await supabase
            .from('site_collaborators')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

          // If user has existing data, they're not new - go to main page
          if (existingData && existingData.length > 0) {
            router.push("/");
          } else {
            // Check profiles table for onboarding status
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('onboarding_completed')
              .eq('id', user.id)
              .single();

            // Only redirect to onboarding if profile doesn't exist AND no table error
            if (!profile && !profileError?.message.includes('relation "public.profiles" does not exist')) {
              router.push("/onboarding");
            } else {
              router.push("/");
            }
          }
        } catch (error) {
          console.warn('Error checking onboarding status, going to main app:', error);
          router.push("/");
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
      <CardHeader>
          <CardTitle className="text-2xl">Simple Site </CardTitle>
          <CardDescription>
            {invitationToken ? 
              "Sign in to accept your collaboration invitation" : 
              t('loginToYourAccount')
            }
          </CardDescription>
        </CardHeader>     
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    {t('forgotYourPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner className="mr-2" />
                    {t('login')}...
                  </>
                ) : (
                  t('login')
                )}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              {t('dontHaveAccount')}{" "}
              <Link
                href="/auth/sign-up"
                className="underline underline-offset-4"
              >
                {t('signUp')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
