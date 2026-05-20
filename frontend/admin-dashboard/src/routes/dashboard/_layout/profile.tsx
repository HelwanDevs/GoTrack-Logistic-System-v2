import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProfilesPage } from "@/pages/ProfilesPage";

export const Route = createFileRoute("/dashboard/_layout/profile")({
component: () => <Outlet />,
});
