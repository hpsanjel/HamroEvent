import { useState } from "react";
import { Shield, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import PrivacyPolicy from "@/components/privacy-policy";
import DataProtection from "@/components/data-protection";

export default function Footer() {
  const { user } = useAuth();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showDataProtection, setShowDataProtection] = useState(false);

  return (
    <>
      <footer className="border-t border-border/40 py-6 text-center text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
          <span>
            Built by Hari Prasad Sanjel for Event Organizers. &copy; {new Date().getFullYear()} PitchPro.
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowPrivacyPolicy(true)}>
              <Shield className="mr-1 h-3.5 w-3.5" /> Privacy
            </Button>
            {user && (
              <Button variant="ghost" size="sm" onClick={() => setShowDataProtection(true)}>
                <Settings className="mr-1 h-3.5 w-3.5" /> Data Rights
              </Button>
            )}
          </div>
        </div>
      </footer>

      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-[9999] bg-background overflow-y-auto">
          <PrivacyPolicy onBack={() => setShowPrivacyPolicy(false)} />
        </div>
      )}

      {showDataProtection && (
        <div className="fixed inset-0 z-[9999] bg-background overflow-y-auto">
          <DataProtection onBack={() => setShowDataProtection(false)} />
        </div>
      )}
    </>
  );
}
