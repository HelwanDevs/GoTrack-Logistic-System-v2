import { createFileRoute } from '@tanstack/react-router'
import { ProductsPage } from "@/pages/ProductsPage";

export const Route = createFileRoute('/dashboard/_layout/products')({
  component: () => <ProductsPage />,
});
