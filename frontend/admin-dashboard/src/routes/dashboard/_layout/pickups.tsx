import { createFileRoute } from '@tanstack/react-router'
import { PickupsPage } from "@/pages/PickupsPage";

export const Route = createFileRoute('/dashboard/_layout/pickups')({
  component: () => <PickupsPage />,
});
