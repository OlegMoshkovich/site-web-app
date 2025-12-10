"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { translations, useLanguage } from "@/lib/translations";
import Link from "next/link";

export default function Page() {
  const { language, mounted } = useLanguage();

  // Helper function to get translated text based on current language
  const t = (key: keyof typeof translations.en) => {
    const value = translations[language][key];
    return typeof value === "string" ? value : "";
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {t("thankYouForSigningUp")}
              </CardTitle>
              {/* <CardDescription>Check your email to confirm</CardDescription> */}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("checkEmailToConfirm")} <Link href="/auth/login" className="text-blue-500 underline">{t("signInLink")}</Link>{t("checkEmailToConfirmAfter")}
                <br />
                <br />
                {t("ifYouHaveQuestions")} <a href="mailto:paul.wegerer@cloneit.at" className="text-blue-500">paul.wegerer@cloneit.at</a>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
