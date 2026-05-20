import { createFileRoute } from '@tanstack/react-router'
import { BranchesPage } from "@/pages/BranchesPage";

export const Route = createFileRoute('/dashboard/_layout/branches')({
  component: () => <BranchesPage />,
});
