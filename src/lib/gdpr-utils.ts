interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

interface ConsentData {
  preferences: CookiePreferences;
  timestamp: string;
  version: string;
}

export const GDPR_CONSENT_VERSION = "1.0";

export class GDPRManager {
  private static instance: GDPRManager;
  private consentData: ConsentData | null = null;

  private constructor() {
    this.loadConsent();
  }

  static getInstance(): GDPRManager {
    if (!GDPRManager.instance) {
      GDPRManager.instance = new GDPRManager();
    }
    return GDPRManager.instance;
  }

  private loadConsent(): void {
    try {
      const stored = localStorage.getItem('cookie-consent');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.consentData = {
          preferences: parsed,
          timestamp: localStorage.getItem('cookie-consent-date') || new Date().toISOString(),
          version: GDPR_CONSENT_VERSION
        };
      }
    } catch (error) {
      console.warn('Failed to load consent data:', error);
    }
  }

  hasConsent(): boolean {
    return this.consentData !== null;
  }

  getConsent(): ConsentData | null {
    return this.consentData;
  }

  canUseAnalytics(): boolean {
    return this.consentData?.preferences.analytics || false;
  }

  canUseFunctional(): boolean {
    return this.consentData?.preferences.functional || false;
  }

  canUseMarketing(): boolean {
    return this.consentData?.preferences.marketing || false;
  }

  setConsent(preferences: CookiePreferences): void {
    this.consentData = {
      preferences,
      timestamp: new Date().toISOString(),
      version: GDPR_CONSENT_VERSION
    };
    
    try {
      localStorage.setItem('cookie-consent', JSON.stringify(preferences));
      localStorage.setItem('cookie-consent-date', this.consentData.timestamp);
    } catch (error) {
      console.warn('Failed to save consent data:', error);
    }
  }

  revokeConsent(): void {
    this.consentData = null;
    try {
      localStorage.removeItem('cookie-consent');
      localStorage.removeItem('cookie-consent-date');
    } catch (error) {
      console.warn('Failed to remove consent data:', error);
    }
  }

  // GDPR Cookie Management
  setCookie(name: string, value: string, days: number = 30, category: keyof CookiePreferences = 'necessary'): void {
    if (category !== 'necessary' && !this.consentData?.preferences[category]) {
      console.warn(`Cannot set ${category} cookie without consent`);
      return;
    }

    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    
    // Set secure and sameSite attributes for GDPR compliance
    const secure = window.location.protocol === 'https:';
    const sameSite = 'Lax';
    
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; ${secure ? 'secure;' : ''} SameSite=${sameSite}`;
  }

  getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  // Data Subject Rights
  async exportUserData(): Promise<any> {
    // This would typically make an API call to export user data
    // For now, return what's available in localStorage
    const userData: any = {};
    
    try {
      const keys = ['cookie-consent', 'cookie-consent-date', 'user-preferences'];
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          userData[key] = value;
        }
      });
    } catch (error) {
      console.warn('Failed to export user data:', error);
    }
    
    return userData;
  }

  async deleteUserData(): Promise<void> {
    // This would typically make an API call to delete user data
    // For now, clear localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('user-') || key.includes('consent') || key.includes('preference')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear all cookies
      document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        this.deleteCookie(name);
      });
    } catch (error) {
      console.warn('Failed to delete user data:', error);
    }
  }

  // Consent for specific data processing
  hasDataProcessingConsent(purpose: string): boolean {
    // Map purposes to cookie categories
    const purposeMapping: Record<string, keyof CookiePreferences> = {
      'analytics': 'analytics',
      'marketing': 'marketing',
      'functional': 'functional',
      'necessary': 'necessary'
    };
    
    const category = purposeMapping[purpose];
    if (!category) return false;
    
    return this.consentData?.preferences[category] || false;
  }
}

// Utility functions for GDPR compliance
export const gdpr = GDPRManager.getInstance();

export const setGDPRCookie = (name: string, value: string, days?: number, category?: keyof CookiePreferences) => {
  gdpr.setCookie(name, value, days, category);
};

export const getGDPRCookie = (name: string): string | null => {
  return gdpr.getCookie(name);
};

export const hasAnalyticsConsent = (): boolean => gdpr.canUseAnalytics();
export const hasFunctionalConsent = (): boolean => gdpr.canUseFunctional();
export const hasMarketingConsent = (): boolean => gdpr.canUseMarketing();
