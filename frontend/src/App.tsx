import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SessionExpiryHandler } from "@/components/SessionExpiryHandler";
import { Layout } from "@/components/Layout";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { AdminRoute } from "@/components/AdminRoute";
import { PartnerRoute } from "@/components/PartnerRoute";
import { InlineLoading } from "@/components/ui/loading";
import { performanceMonitor } from "@/lib/performance";

// Public pages - loaded immediately for better UX
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import PremiumSpaceDetail from "./pages/PremiumSpaceDetail";
import HowItWorks from "./pages/HowItWorks";
import Trust from "./pages/Trust";
import Partners from "./pages/Partners";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import ApiTest from "./pages/ApiTest";

// Admin pages - lazy loaded to reduce initial bundle size
const AdminLayout = lazy(() => import("@/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import("@/admin/pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const AdminListings = lazy(() => import("@/admin/pages/AdminListings").then(m => ({ default: m.AdminListings })));
const AdminListingDetail = lazy(() => import("@/admin/pages/AdminListingDetail").then(m => ({ default: m.AdminListingDetail })));
const AdminLeads = lazy(() => import("@/admin/pages/AdminLeads").then(m => ({ default: m.AdminLeads })));
const AdminVisits = lazy(() => import("@/admin/pages/AdminVisits").then(m => ({ default: m.AdminVisits })));
const AdminPartners = lazy(() => import("@/admin/pages/AdminPartners").then(m => ({ default: m.AdminPartners })));
const AdminLocalities = lazy(() => import("@/admin/pages/AdminLocalities"));
const AdminLogin = lazy(() => import("@/admin/pages/AdminLogin").then(m => ({ default: m.AdminLogin })));

// Partner pages - lazy loaded to reduce initial bundle size
const PartnerLayout = lazy(() => import("@/partner/PartnerLayout").then(m => ({ default: m.PartnerLayout })));
const PartnerLogin = lazy(() => import("@/partner/pages/PartnerLogin").then(m => ({ default: m.PartnerLogin })));
const PartnerDashboard = lazy(() => import("@/partner/pages/PartnerDashboard").then(m => ({ default: m.PartnerDashboard })));
const PartnerListings = lazy(() => import("@/partner/pages/PartnerListings").then(m => ({ default: m.PartnerListings })));
const PartnerListingDetail = lazy(() => import("@/partner/pages/PartnerListingDetail").then(m => ({ default: m.PartnerListingDetail })));
const SubmitListing = lazy(() => import("@/partner/pages/SubmitListing").then(m => ({ default: m.SubmitListing })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.status === 401) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes cache for better performance
      cacheTime: 1000 * 60 * 10, // 10 minutes cache retention
    },
  },
});

// Loading fallback component for lazy-loaded routes
const RouteLoadingFallback = ({ text = "Loading..." }: { text?: string }) => (
  <div className="min-h-screen flex items-center justify-center">
    <InlineLoading text={text} />
  </div>
);

const App = () => {
  // Initialize performance monitoring
  React.useEffect(() => {
    // Report initial metrics
    const reportInitialMetrics = () => {
      setTimeout(() => {
        performanceMonitor.reportMetrics();
      }, 2000);
    };

    if (document.readyState === 'complete') {
      reportInitialMetrics();
    } else {
      window.addEventListener('load', reportInitialMetrics);
    }

    return () => {
      window.removeEventListener('load', reportInitialMetrics);
      performanceMonitor.disconnect();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ConnectionStatus />
          <SessionExpiryHandler />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              {/* Public Routes - No lazy loading for better UX */}
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/spaces/*" element={<PremiumSpaceDetail />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/trust" element={<Trust />} />
                <Route path="/partners" element={<Partners />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/api-test" element={<ApiTest />} />
              </Route>

              {/* Admin Routes - Lazy loaded */}
              <Route 
                path="/admin/login" 
                element={
                  <Suspense fallback={<RouteLoadingFallback text="Loading admin login..." />}>
                    <AdminLogin />
                  </Suspense>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <Suspense fallback={<RouteLoadingFallback text="Loading admin panel..." />}>
                      <AdminLayout />
                    </Suspense>
                  </AdminRoute>
                }
              >
                <Route 
                  index 
                  element={
                    <Suspense fallback={<InlineLoading text="Loading dashboard..." />}>
                      <AdminDashboard />
                    </Suspense>
                  } 
                />
                <Route 
                  path="listings" 
                  element={
                    <Suspense fallback={<InlineLoading text="Loading listings..." />}>
                      <AdminListings />
                    </Suspense>
                  } 
                />
                <Route 
                  path="listings/:listingId" 
                  element={
                    <Suspense fallback={<InlineLoading text="Loading listing details..." />}>
                      <AdminListingDetail />
                    </Suspense>
                  } 
                />
                <Route 
                  path="partners" 
                  element={
                    <Suspense fallback={<InlineLoading text="Loading partners..." />}>
                      <AdminPartners />
                    </Suspense>
                  } 
                />
                <Route 
                  path="localities" 
                  element={
                    <Suspense fallback={<InlineLoading text="Loading localities..." />}>
                      <AdminLocalities />
                    </Suspense>
                  } 
                />
                <Route 
                  path="leads" 
                  element={
                    <Suspense fallback={<InlineLoading text="Loading leads..." />}>
                      <AdminLeads />
                    </Suspense>
                  } 
                />
                <Route 
                  path="visits" 
                  element={
                    <Suspense fallback={<InlineLoading text="Loading visits..." />}>
                      <AdminVisits />
                    </Suspense>
                  } 
                />
              </Route>

              {/* Partner Routes - Lazy loaded */}
              <Route 
                path="/partner/login" 
                element={
                  <Suspense fallback={<RouteLoadingFallback text="Loading partner login..." />}>
                    <PartnerLogin />
                  </Suspense>
                } 
              />
              <Route
                path="/partner"
                element={
                  <PartnerRoute>
                    <Suspense fallback={<RouteLoadingFallback text="Loading partner portal..." />}>
                      <PartnerLayout />
                    </Suspense>
                  </PartnerRoute>
                }
              >
                <Route 
                  index 
                  element={
                    <Suspense fallback={<InlineLoading text="Loading dashboard..." />}>
                      <PartnerDashboard />
                    </Suspense>
                  } 
                />
                <Route 
                  path="listings" 
                  element={
                    <Suspense fallback={<InlineLoading text="Loading listings..." />}>
                      <PartnerListings />
                    </Suspense>
                  } 
                />
                <Route 
                  path="listings/new" 
                  element={
                    <Suspense fallback={<InlineLoading text="Loading listing builder..." />}>
                      <SubmitListing />
                    </Suspense>
                  } 
                />
                <Route 
                  path="listings/:id" 
                  element={
                    <Suspense fallback={<InlineLoading text="Loading listing details..." />}>
                      <PartnerListingDetail />
                    </Suspense>
                  } 
                />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
