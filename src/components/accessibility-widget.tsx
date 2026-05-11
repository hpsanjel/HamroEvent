import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Accessibility, 
  Contrast, 
  Type, 
  ImageOff, 
  Palette, 
  Eye,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X
} from "lucide-react";

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  hideImages: boolean;
  grayscale: boolean;
  fontSize: number;
  darkMode: boolean;
  reducedMotion: boolean;
  focusVisible: boolean;
}

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    hideImages: false,
    grayscale: false,
    fontSize: 100,
    darkMode: false,
    reducedMotion: false,
    focusVisible: true,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      applySettings(parsed);
    } else {
      // Default to dark mode since site is dark by default
      const defaultSettings = {
        ...settings,
        darkMode: true // Default to dark mode
      };
      setSettings(defaultSettings);
      applySettings(defaultSettings);
    }
  }, []);

  // Apply settings to document
  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;
    const body = document.body;

    // Remove all accessibility classes first
    root.classList.remove('high-contrast', 'large-text', 'hide-images', 'grayscale', 'dark-mode', 'reduced-motion', 'focus-visible');
    body.style.removeProperty('font-size');

    // Apply new settings
    if (newSettings.highContrast) {
      root.classList.add('high-contrast');
    }
    if (newSettings.largeText) {
      root.classList.add('large-text');
    }
    if (newSettings.hideImages) {
      root.classList.add('hide-images');
    }
    if (newSettings.grayscale) {
      root.classList.add('grayscale');
    }
    // Apply dark mode: when darkMode is true, we want dark mode (no class), when false, we want light mode (add class)
    if (!newSettings.darkMode) {
      root.classList.add('dark-mode'); // This class actually makes it light mode
    }
    if (newSettings.reducedMotion) {
      root.classList.add('reduced-motion');
    }
    if (newSettings.focusVisible) {
      root.classList.add('focus-visible');
    }

    // Apply font size
    body.style.fontSize = `${newSettings.fontSize}%`;

    // Save to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    applySettings(newSettings);
  };

  const resetSettings = () => {
    const defaultSettings: AccessibilitySettings = {
      highContrast: false,
      largeText: false,
      hideImages: false,
      grayscale: false,
      fontSize: 100,
      darkMode: false,
      reducedMotion: false,
      focusVisible: true,
    };
    setSettings(defaultSettings);
    applySettings(defaultSettings);
  };

  const increaseFontSize = () => {
    const newSize = Math.min(settings.fontSize + 10, 200);
    updateSetting('fontSize', newSize);
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(settings.fontSize - 10, 80);
    updateSetting('fontSize', newSize);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] accessibility-widget">
      {/* Floating button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary-foreground"
          aria-label="Accessibility settings"
          style={{ zIndex: 9999 }}
        >
          <Accessibility className="w-14 h-14" />
        </Button>
      )}

      {/* Accessibility panel */}
      {isOpen && (
        <Card className="w-96 shadow-xl border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Accessibility className="w-5 h-5" />
                Accessibility Settings
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetSettings}
                  className="text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-xs"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Contrast className="w-4 h-4" />
                <Label className="text-sm">High Contrast</Label>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                style={{
                  '--background': 'oklch(0.85 0.03 250)',
                  '--thumb-background': 'oklch(0.8 0.05 250)',
                } as React.CSSProperties}
              />
            </div>

            {/* Large Text */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                <Label className="text-sm">Large Text</Label>
              </div>
              <Switch
                checked={settings.largeText}
                onCheckedChange={(checked) => updateSetting('largeText', checked)}
                style={{
                  '--background': 'oklch(0.85 0.03 250)',
                  '--thumb-background': 'oklch(0.8 0.05 250)',
                } as React.CSSProperties}
              />
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  <Label className="text-sm">Font Size</Label>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={decreaseFontSize}
                    className="w-8 h-8 p-0"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </Button>
                  <span className="text-sm font-medium w-12 text-center">
                    {settings.fontSize}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={increaseFontSize}
                    className="w-8 h-8 p-0"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <Slider
                value={[settings.fontSize]}
                onValueChange={([value]) => updateSetting('fontSize', value)}
                min={80}
                max={200}
                step={10}
                className="w-full"
              />
            </div>

            <Separator />

            {/* Hide Images */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageOff className="w-4 h-4" />
                <Label className="text-sm">Hide Images</Label>
              </div>
              <Switch
                checked={settings.hideImages}
                onCheckedChange={(checked) => updateSetting('hideImages', checked)}
                style={{
                  '--background': 'oklch(0.85 0.03 250)',
                  '--thumb-background': 'oklch(0.8 0.05 250)',
                } as React.CSSProperties}
              />
            </div>

            {/* Grayscale */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <Label className="text-sm">Black & White</Label>
              </div>
              <Switch
                checked={settings.grayscale}
                onCheckedChange={(checked) => updateSetting('grayscale', checked)}
                style={{
                  '--background': 'oklch(0.85 0.03 250)',
                  '--thumb-background': 'oklch(0.8 0.05 250)',
                } as React.CSSProperties}
              />
            </div>

            {/* Dark Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <Label className="text-sm">{settings.darkMode ? 'Dark Mode' : 'Light Mode'}</Label>
              </div>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={(checked) => updateSetting('darkMode', checked)}
                style={{
                  '--background': 'oklch(0.85 0.03 250)',
                  '--thumb-background': 'oklch(0.8 0.05 250)',
                } as React.CSSProperties}
              />
            </div>

            <Separator />

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <Label className="text-sm">Reduced Motion</Label>
              </div>
              <Switch
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
                style={{
                  '--background': 'oklch(0.85 0.03 250)',
                  '--thumb-background': 'oklch(0.8 0.05 250)',
                } as React.CSSProperties}
              />
            </div>

            {/* Enhanced Focus */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <Label className="text-sm">Enhanced Focus</Label>
              </div>
              <Switch
                checked={settings.focusVisible}
                onCheckedChange={(checked) => updateSetting('focusVisible', checked)}
                style={{
                  '--background': 'oklch(0.85 0.03 250)',
                  '--thumb-background': 'oklch(0.8 0.05 250)',
                } as React.CSSProperties}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
