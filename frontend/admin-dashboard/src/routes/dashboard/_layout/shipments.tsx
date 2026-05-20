import { createFileRoute } from '@tanstack/react-router'
import { ShipmentsPage } from '@/pages/ShipmentsPage';

export const Route = createFileRoute('/dashboard/_layout/shipments')({
  component: () => <ShipmentsPage />,
});
