'use client';

import { CartProvider } from "@/hooks/useCart";
import { Toaster } from "sonner";

export function Providers({ children }) {
  return (
      <CartProvider>
      <Toaster position="bottom-center" />
          {children}
      </CartProvider>
  );
}