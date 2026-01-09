import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { AdminRoute } from "@/components/AdminRoute";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import SpaceDetail from "./pages/SpaceDetail";
import HowItWorks from "./pages/HowItWorks";
import Trust from "./pages/Trust";
import Partners from "./pages/Partners";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import ApiTest from "./pages/ApiTest";

// Admin
import { AdminLayout } from "@/admin/AdminLayout";
import { AdminDashboard } from "@/admin/pages/AdminDashboard";
import { AdminListings } from "@/admin/pages/AdminListings";
import { AdminListingDetail } from "@/admin/pages/AdminListingDetail";
import { AdminLeads } from "@/admin/pages/AdminLeads";
import { AdminVisits } from "@/admin/pages/AdminVisits";
import { AdminPartners } from "@/admin/pages/AdminPartners";
import { AdminLogin } from "@/admin/pages/AdminLogin";

// Partner
import { PartnerLayout } from "@/partner/PartnerLayout";
import { PartnerRoute } from "@/components/PartnerRoute";
import { PartnerLogin } from "@/partner/pages/PartnerLogin";
import { PartnerDashboard } from "@/partner/pages/PartnerDashboard";
import { PartnerListings } from "@/partner/pages/PartnerListings";
import { PartnerListingDetail } from "@/partner/pages/PartnerListingDetail";
import { SubmitListing } from "@/partner/pages/SubmitListing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ConnectionStatus />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/spaces/:slug" element={<SpaceDetail />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/trust" element={<Trust />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/api-test" element={<ApiTest />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="listings" element={<AdminListings />} />
            <Route path="listings/:listingId" element={<AdminListingDetail />} />
            <Route path="partners" element={<AdminPartners />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="visits" element={<AdminVisits />} />
          </Route>

          {/* Partner Routes */}
          <Route path="/partner/login" element={<PartnerLogin />} />
          <Route
            path="/partner"
            element={
              <PartnerRoute>
                <PartnerLayout />
              </PartnerRoute>
            }
          >
            <Route index element={<PartnerDashboard />} />
            <Route path="listings" element={<PartnerListings />} />
            <Route path="listings/new" element={<SubmitListing />} />
            <Route path="listings/:id" element={<PartnerListingDetail />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
