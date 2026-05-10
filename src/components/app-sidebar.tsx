import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Trophy,
  Users,
  CalendarRange,
  Wallet,
  HeartHandshake,
  ScanLine,
  Sparkles,
  Ticket,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Events", url: "/app/events", icon: Trophy },
  { title: "Registrations", url: "/app/registrations", icon: Users },
  { title: "Schedule & Bracket", url: "/app/schedule", icon: CalendarRange },
  { title: "Budget", url: "/app/budget", icon: Wallet },
  { title: "Donations", url: "/app/donations", icon: HeartHandshake },
  { title: "Tickets", url: "/app/tickets", icon: Ticket },
  { title: "Check-in", url: "/app/checkin", icon: ScanLine },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (url: string) =>
    url === "/app" ? currentPath === "/app" : currentPath.startsWith(url);

  const handleNav = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" onClick={handleNav} className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-stadium shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold leading-none">PitchPro</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Event OS</span>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Manage</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} onClick={handleNav} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && (
          <div className="px-2 py-2 text-[11px] text-muted-foreground">
            ☁️ Synced to cloud · realtime
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
