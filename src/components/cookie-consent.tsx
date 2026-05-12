import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Shield, Cookie } from "lucide-react";

interface CookieConsentProps {
  onAccept?: (preferences: CookiePreferences) => void;
}

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export default function CookieConsent({ onAccept }: CookieConsentProps) {
  const [showConsent, setShowConsent] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    saveConsent(allPreferences);
  };

  const handleAcceptSelected = () => {
    saveConsent(preferences);
  };

  const handleRejectAll = () => {
    const minimalPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    saveConsent(minimalPreferences);
  };

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowConsent(false);
    onAccept?.(prefs);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Cookie className="h-6 w-6 text-muted-foreground mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Privacy & Cookie Consent</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConsent(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                We use cookies and similar technologies to help personalize content, tailor and measure ads, and provide a better experience. 
                By clicking accept all, you agree to our use of cookies.
              </p>

              {showDetails && (
                <div className="space-y-4 mb-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="necessary"
                      checked={preferences.necessary}
                      disabled
                      className="rounded"
                    />
                    <label htmlFor="necessary" className="text-sm font-medium">
                      Essential Cookies
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Required for the website to function properly, including authentication and security.
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="analytics"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="analytics" className="text-sm font-medium">
                      Analytics Cookies
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Help us understand how visitors interact with our website by collecting and reporting information anonymously.
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="functional"
                      checked={preferences.functional}
                      onChange={(e) => setPreferences(prev => ({ ...prev, functional: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="functional" className="text-sm font-medium">
                      Functional Cookies
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Enable enhanced functionality and personalization, such as remembering your preferences.
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="marketing"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="marketing" className="text-sm font-medium">
                      Marketing Cookies
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Used to deliver advertising that is relevant to you and your interests.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleAcceptAll} size="sm">
                  Accept All
                </Button>
                {!showDetails && (
                  <Button variant="outline" onClick={() => setShowDetails(true)} size="sm">
                    Customize
                  </Button>
                )}
                {showDetails && (
                  <Button variant="outline" onClick={handleAcceptSelected} size="sm">
                    Accept Selected
                  </Button>
                )}
                <Button variant="ghost" onClick={handleRejectAll} size="sm">
                  Reject All
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/privacy-policy" className="text-xs">
                    Privacy Policy
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
