import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MobileNav from "@/components/layout/MobileNav";
import ChatAssistant from "@/components/layout/ChatAssistant";
import JobSearch from "@/components/jobs/JobSearch";
import JobList from "@/components/jobs/JobList";
import JobFilters from "@/components/jobs/JobFilters";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SiLinkedin, SiIndeed, SiGlassdoor } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

interface JobSource {
  id: number;
  name: string;
  url?: string;
  apiKey?: string;
}

export default function JobsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState<any>({});
  const { toast } = useToast();

  // Check if any job sources exist
  const { data: jobSources = [] } = useQuery<JobSource[]>({
    queryKey: ['/api/job-sources']
  });
  
  // Add default job sources if none exist
  useEffect(() => {
    const setupDefaultSources = async () => {
      if (jobSources.length === 0) {
        try {
          // Create default job sources if none exist
          const defaultSources = [
            { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs' },
            { name: 'Indeed', url: 'https://www.indeed.com' },
            { name: 'Glassdoor', url: 'https://www.glassdoor.com/Job' }
          ];
          
          for (const source of defaultSources) {
            await fetch('/api/job-sources', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(source)
            });
          }
          
          // Invalidate the query to refresh job sources
          // queryClient.invalidateQueries({ queryKey: ['/api/job-sources'] });
        } catch (error) {
          console.error('Failed to create default job sources:', error);
        }
      }
    };
    
    setupDefaultSources();
  }, [jobSources]);

  const handleSearch = (filters: any) => {
    // Reset any previous filters
    setSearchFilters(filters);
  };

  const handleApplyFilters = (filters: any) => {
    // Keep sourceIds and query from search, add other filters
    setSearchFilters((prev: any) => {
      const { sourceIds, query } = prev;
      return { 
        ...filters,
        ...(sourceIds && sourceIds.length > 0 && query ? { sourceIds, query } : {})
      };
    });
  };

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
          {/* Jobs Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Job Search</h1>
                <p className="mt-1 text-gray-600">Find and apply to jobs across multiple job boards</p>
              </div>
            </div>
          </div>

          {/* Job Search Bar */}
          <JobSearch onSearch={handleSearch} />

          {/* Job Results */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <JobList filters={searchFilters} />
            </div>
            
            <div>
              <JobFilters onApplyFilters={handleApplyFilters} />
            </div>
          </div>
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
