import { useState, useEffect } from "react";
import AccessibilityWidget from "@/components/accessibility-widget";

export default function AppSimple() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="text-center">
          <p className="mt-2 text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-4xl">⚽</span>
              <h1 className="font-display text-3xl font-bold">PitchPro</h1>
              <span className="ml-2 text-xl text-muted-foreground">— Event Management Platform</span>
            </div>
            <nav className="flex gap-4">
              <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded">
                Dashboard
              </button>
              <button className="px-4 py-2 text-sm border border-border rounded">
                Create Event
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Welcome to PitchPro</h2>
            <p className="text-muted-foreground">
              Your accessibility widget should be visible in the bottom-right corner.
            </p>
            <div className="mt-8 p-6 bg-muted rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Accessibility Widget Test</h3>
              <p className="text-sm">
                Look for the accessibility icon in the bottom-right corner of your screen.
                It should appear as a pulsing red button with the accessibility icon.
              </p>
            </div>
          </div>
        </div>
      </main>

      <AccessibilityWidget />
    </div>
  );
}
