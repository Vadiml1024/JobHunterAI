import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MobileNav from "@/components/layout/MobileNav";
import ChatAssistant from "@/components/layout/ChatAssistant";
import ResumeList from "@/components/resumes/ResumeList";
import ResumeOptimization from "@/components/resumes/ResumeOptimization";
import AddResumeModal from "@/components/modals/AddResumeModal";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function ResumePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [addResumeModalOpen, setAddResumeModalOpen] = useState(false);

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
          {/* Resumes Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Resumes & CVs</h1>
                <p className="mt-1 text-gray-600">Manage your resume portfolio for different languages and roles</p>
              </div>
              <Button 
                onClick={() => setAddResumeModalOpen(true)}
                className="flex items-center"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Resume
              </Button>
            </div>
          </div>

          {/* Resume List */}
          <ResumeList />

          {/* Resume Optimization */}
          <ResumeOptimization />

          {/* Add Resume Modal */}
          <AddResumeModal 
            open={addResumeModalOpen} 
            onClose={() => setAddResumeModalOpen(false)} 
          />
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
