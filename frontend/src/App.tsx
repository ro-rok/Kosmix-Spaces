import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import SpaceDetail from "./pages/SpaceDetail";
import HowItWorks from "./pages/HowItWorks";
import Trust from "./pages/Trust";
import Partners from "./pages/Partners";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// Admin
import { AdminLayout } from "@/admin/AdminLayout";
import { AdminDashboard } from "@/admin/pages/AdminDashboard";
import { AdminListings } from "@/admin/pages/AdminListings";
import { AdminListingDetail } from "@/admin/pages/AdminListingDetail";
import { AdminLeads } from "@/admin/pages/AdminLeads";
import { AdminVisits } from "@/admin/pages/AdminVisits";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
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
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="listings" element={<AdminListings />} />
            <Route path="listings/:slug" element={<AdminListingDetail />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="visits" element={<AdminVisits />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
