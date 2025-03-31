import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MobileNav from "@/components/layout/MobileNav";
import ChatAssistant from "@/components/layout/ChatAssistant";
import { ApplicationDetail } from "@/components/applications/ApplicationDetail";
import { Application, Job, Resume, ApplicationStatus as AppStatus } from "@/types";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronRight, Building, Calendar, FileText, Info, ExternalLink, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ApplicationsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AppStatus | 'all'>('all');
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [applicationDetailOpen, setApplicationDetailOpen] = useState(false);

  const { data: applications, isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: jobs, isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: resumes, isLoading: isLoadingResumes } = useQuery<Resume[]>({
    queryKey: ["/api/resumes"],
  });

  // Define application stages with counts
  const stages: { id: AppStatus | 'all'; label: string; color: string }[] = [
    { id: 'all', label: 'All Applications', color: 'bg-gray-100 text-gray-700' },
    { id: 'applied', label: 'Applied', color: 'bg-primary-100 text-primary-700' },
    { id: 'screening', label: 'Screening', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'interview', label: 'Interview', color: 'bg-blue-100 text-blue-700' },
    { id: 'offer', label: 'Offer', color: 'bg-green-100 text-green-700' },
    { id: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
  ];

  // Filter applications by status
  const filteredApplications = activeTab === 'all' 
    ? applications 
    : applications?.filter(app => app.status === activeTab);

  // Count applications by status
  const getStatusCount = (status: AppStatus | 'all') => {
    if (status === 'all') {
      return applications?.length || 0;
    }
    return applications?.filter(app => app.status === status).length || 0;
  };

  // Get job and resume details
  const getJobById = (id: number) => {
    return jobs?.find(job => job.id === id);
  };

  const getResumeById = (id?: number) => {
    if (!id) return null;
    return resumes?.find(resume => resume.id === id);
  };

  // Format date
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    const stage = stages.find(s => s.id === status);
    return stage?.color || "bg-gray-100 text-gray-700";
  };

  const isLoading = isLoadingApplications || isLoadingJobs || isLoadingResumes;

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
          {/* Applications Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Applications</h1>
                <p className="mt-1 text-gray-600">Track and manage your job applications</p>
              </div>
            </div>
          </div>

          {/* Applications Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
            {stages.map((stage) => (
              <Card 
                key={stage.id}
                className={`cursor-pointer border-2 ${activeTab === stage.id ? 'border-primary-500' : 'border-transparent'}`}
                onClick={() => setActiveTab(stage.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${stage.color} mb-2`}>
                    <span className="font-medium">{getStatusCount(stage.id)}</span>
                  </div>
                  <p className="text-sm font-medium">{stage.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Applications List */}
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">Loading applications...</p>
                </div>
              ) : !filteredApplications || filteredApplications.length === 0 ? (
                <div className="text-center py-10">
                  <Info className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No applications found</h3>
                  <p className="text-gray-500 mb-4">
                    {activeTab === 'all' 
                      ? "You haven't applied to any jobs yet." 
                      : `You don't have any applications in the ${activeTab} stage.`}
                  </p>
                  <Button>
                    Search for Jobs
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredApplications.map((app) => {
                    const job = getJobById(app.jobId);
                    const resume = getResumeById(app.resumeId);
                    
                    if (!job) return null;
                    
                    return (
                      <div key={app.id} className="py-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 flex-shrink-0 bg-gray-200 rounded-md flex items-center justify-center text-gray-700">
                              <Building className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="text-base font-medium text-gray-900">{job.title}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-sm text-gray-600">{job.company}</span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-sm text-gray-600">{job.location || 'Remote'}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 mt-2">
                                <Badge className={getStatusBadgeClass(app.status)}>
                                  {stages.find(s => s.id === app.status)?.label || 'Applied'}
                                </Badge>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Applied {formatDate(app.appliedAt)}
                                </div>
                                {resume && (
                                  <div className="flex items-center text-sm text-gray-500">
                                    <FileText className="h-4 w-4 mr-1" />
                                    {resume.name}
                                  </div>
                                )}
                                {app.source && (
                                  <div className="flex items-center text-sm text-gray-500">
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    {app.source}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedApplicationId(app.id);
                              setApplicationDetailOpen(true);
                            }}
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Application Detail Dialog */}
        <Dialog 
          open={applicationDetailOpen} 
          onOpenChange={setApplicationDetailOpen}
        >
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <div className="absolute right-4 top-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setApplicationDetailOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {selectedApplicationId && (
              <ApplicationDetail applicationId={selectedApplicationId} />
            )}
          </DialogContent>
        </Dialog>

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
