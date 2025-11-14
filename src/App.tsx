import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Registration from "./pages/Registration";
import CustomerDashboard from "./pages/CustomerDashboard";
import SiteAdminDashboard from "./pages/SiteAdminDashboard";
import SiteSecurityDashboard from "./pages/SiteSecurityDashboard";
import RTO from "./pages/RTO";
import Locations from "./pages/Locations";
import Profile from "./pages/Profile";
import Support from "./pages/Support";
import Reservation from "./pages/Reservation";
import ReservationDetails from "./pages/ReservationDetails";
import HowItWorks from "./pages/HowItWorks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.VITE_APP_BASE || '/'}>
        <Routes>
          <Route path="/" element={<PageLayout pageTitle="Login" showBack={false} showSettings={false}><Index /></PageLayout>} />
          <Route path="/login" element={<PageLayout pageTitle="Login" showBack={false} showSettings={false}><Login /></PageLayout>} />
          <Route path="/registration" element={<PageLayout pageTitle="Registration" showBack={true} showSettings={false}><Registration /></PageLayout>} />
          <Route path="/customer-dashboard" element={<PageLayout pageTitle="Customer Dashboard" showBack={false}><CustomerDashboard /></PageLayout>} />
          <Route path="/site-admin-dashboard" element={<PageLayout pageTitle="Site Admin" showBack={true}><SiteAdminDashboard /></PageLayout>} />
          <Route path="/site-security-dashboard" element={<PageLayout pageTitle="Site Security" showBack={true}><SiteSecurityDashboard /></PageLayout>} />
          <Route path="/rto" element={<PageLayout pageTitle="RTO" showBack={true}><RTO /></PageLayout>} />
          <Route path="/locations" element={<PageLayout pageTitle="Your Locations" showBack={true}><Locations /></PageLayout>} />
          <Route path="/profile" element={<PageLayout pageTitle="Profile" showBack={true}><Profile /></PageLayout>} />
          <Route path="/support" element={<PageLayout pageTitle="Support" showBack={true}><Support /></PageLayout>} />
          <Route path="/reservation" element={<PageLayout pageTitle="Create Reservation" showBack={true}><Reservation /></PageLayout>} />
          <Route path="/reservation-details/:reservationId" element={<PageLayout pageTitle="Reservation Details" showBack={true}><ReservationDetails /></PageLayout>} />
          <Route path="/how-it-works" element={<PageLayout pageTitle="How it Works" showBack={true} showSettings={false}><HowItWorks /></PageLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<PageLayout pageTitle="Not Found" showBack={true}><NotFound /></PageLayout>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
