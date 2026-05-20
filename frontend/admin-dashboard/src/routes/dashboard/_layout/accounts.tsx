import { createFileRoute, redirect } from "@tanstack/react-router";
import { AccountsPage } from "@/pages/AccountsPage";
import { checkIsAuthenticated } from "@/features/auth";
import { checkIsAdmin } from "@/features/auth/utils";

export const Route = createFileRoute("/dashboard/_layout/accounts")({
  beforeLoad: async () => { 
    // only addmin can access accounts page
    if (!checkIsAuthenticated() || !checkIsAdmin()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => <AccountsPage />,
});
