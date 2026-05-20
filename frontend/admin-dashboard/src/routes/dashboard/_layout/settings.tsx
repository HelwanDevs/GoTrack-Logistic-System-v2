import { createFileRoute, redirect } from "@tanstack/react-router";
import { SettingsPage } from "@/pages/SettingsPage";
import { checkIsAuthenticated, checkIsEmployee } from "@/features/auth";

export const Route = createFileRoute("/dashboard/_layout/settings")({
  component: () => <SettingsPage />,
});
