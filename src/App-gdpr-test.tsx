import { useState } from "react";
import CookieConsent from "@/components/cookie-consent";
import PrivacyPolicy from "@/components/privacy-policy";
import DataProtection from "@/components/data-protection";
import { Button } from "@/components/ui/button";
import { Shield, Settings, Cookie } from "lucide-react";

export default function AppGDPRTest() {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showDataProtection, setShowDataProtection] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center mb-8">GDPR Components Test</h1>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Button 
            onClick={() => setShowPrivacy(true)}
            className="h-20 flex flex-col gap-2"
          >
            <Shield className="h-6 w-6" />
            Privacy Policy
          </Button>
          
          <Button 
            onClick={() => setShowDataProtection(true)}
            className="h-20 flex flex-col gap-2"
            variant="outline"
          >
            <Settings className="h-6 w-6" />
            Data Protection
          </Button>
          
          <Button 
            className="h-20 flex flex-col gap-2"
            variant="secondary"
            disabled
          >
            <Cookie className="h-6 w-6" />
            Cookie Consent
          </Button>
        </div>

        <div className="text-center text-muted-foreground">
          <p>Cookie consent should appear automatically on first visit</p>
          <p>Click buttons above to test privacy components</p>
        </div>

        {/* Modals */}
        {showPrivacy && (
          <div className="fixed inset-0 z-50 bg-background">
            <PrivacyPolicy onBack={() => setShowPrivacy(false)} />
          </div>
        )}
        
        {showDataProtection && (
          <div className="fixed inset-0 z-50 bg-background">
            <DataProtection />
          </div>
        )}

        {/* Cookie Consent - always visible for testing */}
        <CookieConsent />
      </div>
    </div>
  );
}
