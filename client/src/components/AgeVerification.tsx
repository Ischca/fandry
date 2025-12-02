import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Heart, ShieldAlert } from "lucide-react";
import { Link } from "wouter";

const AGE_VERIFIED_KEY = "fandry_age_verified";

export function AgeVerification({ children }: { children: React.ReactNode }) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem(AGE_VERIFIED_KEY);
    if (verified === "true") {
      setIsVerified(true);
    } else {
      setIsVerified(false);
      setShowDialog(true);
    }
  }, []);

  const handleVerify = () => {
    localStorage.setItem(AGE_VERIFIED_KEY, "true");
    setIsVerified(true);
    setShowDialog(false);
  };

  const handleDeny = () => {
    window.location.href = "https://www.google.com";
  };

  // Loading state
  if (isVerified === null) {
    return null;
  }

  return (
    <>
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <ShieldAlert className="h-8 w-8 text-primary" />
            </div>
            <AlertDialogTitle className="text-2xl">
              年齢確認
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base space-y-4">
              <p>
                このサイトには成人向けコンテンツが含まれています。
              </p>
              <p className="font-medium text-foreground">
                あなたは18歳以上ですか？
              </p>
              <p className="text-xs text-muted-foreground">
                「はい」を選択することで、
                <Link href="/terms" className="underline hover:text-primary">
                  利用規約
                </Link>
                および
                <Link href="/privacy" className="underline hover:text-primary">
                  プライバシーポリシー
                </Link>
                に同意したものとみなされます。
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleDeny}
              className="w-full sm:w-auto"
            >
              いいえ、18歳未満です
            </Button>
            <Button
              onClick={handleVerify}
              className="w-full sm:w-auto"
            >
              はい、18歳以上です
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {isVerified && children}
      {!isVerified && (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <Heart className="h-12 w-12 text-primary mx-auto" />
            <h1 className="text-2xl font-bold">Fandry</h1>
            <p className="text-muted-foreground">年齢確認が必要です</p>
          </div>
        </div>
      )}
    </>
  );
}
