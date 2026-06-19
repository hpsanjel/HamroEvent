import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Trophy,
  Users,
  QrCode,
  Wallet,
  CalendarRange,
  HeartHandshake,
  ScanLine,
  ArrowRight,
  CheckCircle2,
  Ticket,
  CreditCard,
  Upload,
  Search,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/use-auth";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PitchPro — Run Your Sports Tournament Like a Pro" },
      {
        name: "description",
        content:
          "Football, cricket, basketball — manage registrations, payments, brackets, budgets and check-in from one app. Built for local organizers.",
      },
      { property: "og:title", content: "PitchPro — Sports Event Manager" },
      {
        property: "og:description",
        content: "End-to-end tournament management for local organizers.",
      },
      { property: "og:image", content: hero },
      { property: "twitter:image", content: hero },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Trophy, title: "Event CRUD", text: "Create, publish and manage tournaments in seconds." },
  {
    icon: QrCode,
    title: "Share via QR",
    text: "One-tap share to social + scannable QR for instant registration.",
  },
  {
    icon: Users,
    title: "Team registration",
    text: "Public form captures team, players, payment proof — admin approves.",
  },
  {
    icon: Upload,
    title: "Payment proof",
    text: "Teams upload payment screenshots, organizers approve with one click.",
  },
  {
    icon: Ticket,
    title: "Event passes",
    text: "Generate free or paid passes with QR codes for attendees.",
  },
  {
    icon: CreditCard,
    title: "Ticket management",
    text: "Sell, track and validate tickets with integrated QR scanning.",
  },
  {
    icon: Search,
    title: "Ticket lookup",
    text: "Public can track their ticket status online using order ID or phone.",
  },
  {
    icon: CalendarRange,
    title: "Auto bracket",
    text: "Generate single-elimination tie sheet from approved teams.",
  },
  {
    icon: Wallet,
    title: "Budget tracker",
    text: "Income, expenses, prize pool — see the bottom line live.",
  },
  {
    icon: HeartHandshake,
    title: "Donations & sponsors",
    text: "Log every contribution with totals.",
  },
  {
    icon: ScanLine,
    title: "Event-day check-in",
    text: "Verify players & visitors instantly at the gate.",
  },
  { icon: Download, title: "Export Data", text: "Export all your event data with a single click." },
];

function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-stadium shadow-glow">
              <Trophy className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">PitchPro</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/lookup">Check Ticket</Link>
            </Button>
            <Button asChild size="sm">
              <Link to={user ? "/app" : "/login"}>
                {user ? "Dashboard" : "Sign in"} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-lines opacity-30" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2 lg:py-32">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              For local sports organizers
            </div>
            <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
              Run your tournament <span className="text-primary">like a pro.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              From the first registration to the trophy lift — PitchPro handles every step of your
              football, cricket or basketball event. No spreadsheets. No WhatsApp chaos.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-glow">
                <Link to="/login">
                  Get started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Free to use", "Organizer sign-in"].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-stadium opacity-30 blur-3xl" />
            <img
              src={hero}
              alt="Sports broadcast collage"
              width={1536}
              height={1024}
              className="relative aspect-[3/2] w-full rounded-3xl border border-border object-cover shadow-pop"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/40 bg-gradient-pitch py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold sm:text-5xl">
              Everything for the whistle <span className="text-primary">to the trophy.</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              One toolkit covering every step of your tournament — built around how local organizers
              actually work.
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition hover:border-primary/50 hover:shadow-glow"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow strip */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Create the event",
                d: "Sport, dates, venue, entry fee, payment QR — done in 2 minutes.",
              },
              {
                n: "02",
                t: "Share & collect teams",
                d: "Post the QR. Captains register, upload payment proof. You approve.",
              },
              {
                n: "03",
                t: "Run match-day",
                d: "Auto bracket, schedule, check-in, budget. Everything in your pocket.",
              },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-card/40 p-8">
                <div className="font-mono-num text-5xl font-bold text-primary">{s.n}</div>
                <h3 className="mt-3 font-display text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-stadium p-10 text-center shadow-pop sm:p-16">
            <h2 className="font-display text-4xl font-bold text-primary-foreground sm:text-5xl">
              Your next tournament starts now.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Spin up an event, share the QR, and let teams roll in. No accounts, no setup fees.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8">
              <Link to="/login">
                Get started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
