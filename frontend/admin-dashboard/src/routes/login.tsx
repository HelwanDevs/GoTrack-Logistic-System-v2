import { LoadingSpinner } from "@/components/LoadingSpinner";
import { LoginPage } from "@/pages/LoginPage";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkIsEmployee, checkIsAuthenticated } from "@/features/auth";
import { Suspense } from "react";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    if (checkIsAuthenticated() && checkIsEmployee()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginPage />
    </Suspense>
  ),
});
