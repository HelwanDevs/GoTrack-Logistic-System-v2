import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkIsEmployee, checkIsAuthenticated } from "@/features/auth";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (checkIsAuthenticated() && checkIsEmployee()) {
      throw redirect({ to: "/dashboard" });
    } else {
      throw redirect({ to: "/login" });
    }
  },
});
