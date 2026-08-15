import { Loader2 } from "lucide-react";

interface AuthLoadingScreenProps {
  message?: string;
}

export function AuthLoadingScreen({
  message = "Verifying your session...",
}: AuthLoadingScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full border bg-background p-4 shadow-sm">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>

        <p className="text-sm text-muted-foreground">
          {message}
        </p>
      </div>
    </div>
  );
}