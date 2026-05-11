import { createFileRoute } from "@tanstack/react-router";
import ExportPage from "@/components/export-page";

export const Route = createFileRoute("/app/export")({
  component: ExportPage,
});
