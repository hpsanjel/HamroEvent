import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-8xl font-display font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Off the pitch</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That page doesn't exist. Let's get you back in the game.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#c9f24a" },
      { title: "PitchPro — Sports Event Manager for Local Organizers" },
      { name: "description", content: "Run football, cricket, basketball tournaments end-to-end. Registrations, payments, brackets, budgets, check-in — one app." },
      { property: "og:title", content: "PitchPro — Sports Event Manager for Local Organizers" },
      { property: "og:description", content: "Run football, cricket, basketball tournaments end-to-end. Registrations, payments, brackets, budgets, check-in — one app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "PitchPro — Sports Event Manager for Local Organizers" },
      { name: "twitter:description", content: "Run football, cricket, basketball tournaments end-to-end. Registrations, payments, brackets, budgets, check-in — one app." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/MyhLXv7qPXTT49ilXts3ngLsRUB3/social-images/social-1777882223228-Screenshot_2026-05-04_at_10.10.06.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/MyhLXv7qPXTT49ilXts3ngLsRUB3/social-images/social-1777882223228-Screenshot_2026-05-04_at_10.10.06.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icon-192.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark">
      {children}
    </div>
  );
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster position="top-right" theme="dark" />
    </>
  );
}
