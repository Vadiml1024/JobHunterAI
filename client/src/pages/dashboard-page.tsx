import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MobileNav from "@/components/layout/MobileNav";
import ChatAssistant from "@/components/layout/ChatAssistant";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatisticsCards from "@/components/dashboard/StatisticsCards";
import ApplicationStatus from "@/components/dashboard/ApplicationStatus";
import RecommendedJobs from "@/components/dashboard/RecommendedJobs";

export default function DashboardPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <TopBar 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen}
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          {/* Dashboard Header */}
          <DashboardHeader />

          {/* Statistics Cards */}
          <StatisticsCards />

          {/* Application Status */}
          <ApplicationStatus />

          {/* Recommended Jobs */}
          <RecommendedJobs />
        </main>

        {/* Chat Assistant */}
        <ChatAssistant 
          open={chatOpen} 
          onClose={() => setChatOpen(false)} 
        />

        {/* Mobile Navigation */}
        <MobileNav />
      </div>
    </div>
  );
}
