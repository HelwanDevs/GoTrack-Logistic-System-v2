import { NotFoundPage } from "@/pages/NotFoundPage";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$")({
    component: () => <NotFoundPage />,
  
});
