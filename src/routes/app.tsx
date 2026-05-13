import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useStoreSignal } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Home, LogOut, Settings, Shield } from "lucide-react";
import PrivacyPolicy from "@/components/privacy-policy";
import DataProtection from "@/components/data-protection";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  useStoreSignal();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showDataProtection, setShowDataProtection] = useState(false);

  console.log('[AppLayout] User:', user, 'Loading:', loading);

  useEffect(() => {
    console.log('[AppLayout] Auth state changed - loading:', loading, 'user:', !!user);
    if (!loading && !user) {
      console.log('[AppLayout] Redirecting to login');
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  // Simple loading state
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to PitchPro</h1>
          <p className="text-muted-foreground mb-4">Please log in to continue</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            Login with Google
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-3 backdrop-blur-xl sm:px-5">
            <SidebarTrigger />
            <div className="flex-1" />
            <span className="hidden truncate text-xs text-muted-foreground sm:inline">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={() => setShowPrivacyPolicy(true)}>
              <Shield className="mr-1 h-3.5 w-3.5" /> Privacy
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowDataProtection(true)}>
              <Settings className="mr-1 h-3.5 w-3.5" /> Data Rights
            </Button>
            <Link to="/" className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
              <Home className="h-3.5 w-3.5" /> Home
            </Link>
            <Button size="sm" variant="ghost" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/login" }); }}>
              <LogOut className="mr-1 h-3.5 w-3.5" /> Sign out
            </Button>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
      
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
      
      <InstallPrompt />
    </SidebarProvider>
  );
}
