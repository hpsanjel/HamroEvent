import { createFileRoute } from "@tanstack/react-router";
import SuperAdminDashboard from "@/components/superadmin-dashboard";

export const Route = createFileRoute("/app/superadmin")({
  component: SuperAdminDashboard,
});
