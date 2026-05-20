import { createFileRoute } from '@tanstack/react-router'
import { InventoryItemsPage } from "@/pages/InventoryItemsPage";

export const Route = createFileRoute('/dashboard/_layout/inventory')({
  component: () => <InventoryItemsPage />,
});
