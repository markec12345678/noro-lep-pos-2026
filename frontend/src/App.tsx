import { lazy, Suspense, useMemo } from "react";
import { Toaster as CustomToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import LoadingSpinner from "./components/ui/loader";
import { useRealtimeSync } from "./hooks/useRealtimeSync";
import Reports from "./pages/Reports";

// Lazy load pages
const POS = lazy(() => import("@/pages/POS"));
const FoodMenus = lazy(() => import("@/pages/FoodMenus"));
const Categories = lazy(() => import("@/pages/Categories"));
const Tables = lazy(() => import("@/pages/Tables"));
const Orders = lazy(() => import("@/pages/Orders"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Kitchen = lazy(() => import("@/pages/Kitchen"));
const Login = lazy(() => import("@/pages/Login"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const CashDrawer = lazy(() => import("@/pages/CashDrawer"));
const FiscalSettings = lazy(() => import("@/pages/FiscalSettings"));
const QRCodes = lazy(() => import("@/pages/QRCodes"));
const Customers = lazy(() => import("@/pages/Customers"));
const LoyaltyRewards = lazy(() => import("@/pages/LoyaltyRewards"));

// Public routes (no auth required) — lazy loaded for code splitting
const PublicMenu = lazy(() => import("@/pages/PublicMenu"));
const PublicOrderStatus = lazy(() => import("@/pages/PublicOrderStatus"));
const PublicLoyalty = lazy(() => import("@/pages/PublicLoyalty"));

// Protected Route Component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useMemo(() => !!localStorage.getItem("user"), []);

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

/**
 * Inner component that mounts the realtime hook inside QueryClientProvider.
 * (Hooks must be called inside the provider.)
 */
const AppInner = () => {
  // Subscribe to WebSocket events → invalidates React Query caches
  useRealtimeSync();

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public routes — no authentication required */}
          <Route path="/public/menu/:tableToken" element={<PublicMenu />} />
          <Route path="/public/order/:orderId" element={<PublicOrderStatus />} />
          <Route path="/public/loyalty" element={<PublicLoyalty />} />

          {/* Authenticated routes */}
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Tables />} />
            <Route path="tables/:tableId" element={<POS />} />
            <Route path="menus" element={<FoodMenus />} />
            <Route path="categories" element={<Categories />} />
            <Route path="kitchen" element={<Kitchen />} />
            <Route path="orders" element={<Orders />} />
            <Route path="reports" element={<Reports />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="cash-drawer" element={<CashDrawer />} />
            <Route path="fiscal" element={<FiscalSettings />} />
            <Route path="qr-codes" element={<QRCodes />} />
            <Route path="customers" element={<Customers />} />
            <Route path="loyalty-rewards" element={<LoyaltyRewards />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

const App = () => {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Re-fetch on window focus so switching tabs pulls fresh data
            refetchOnWindowFocus: true,
            // Keep data fresh for 30s before considering stale
            staleTime: 30_000,
          },
        },
      }),
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CustomToaster />
        <SonnerToaster />
        <AppInner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
