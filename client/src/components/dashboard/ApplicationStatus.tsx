import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatus, Application, Job } from "@/types";
import { Building, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ApplicationStatusWidget() {
  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });
  
  const { data: jobs, isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });
  
  // Define application stages
  const stages: { name: ApplicationStatus; label: string; color: string }[] = [
    { name: "applied", label: "Applied", color: "bg-primary-100 text-primary-600" },
    { name: "screening", label: "Screening", color: "bg-gray-100 text-gray-600" },
    { name: "interview", label: "Interview", color: "bg-blue-100 text-blue-600" },
    { name: "offer", label: "Offer", color: "bg-green-100 text-green-600" },
    { name: "rejected", label: "Rejected", color: "bg-gray-100 text-gray-600" },
  ];
  
  // Count applications by status
  const statusCounts = stages.reduce((acc, stage) => {
    acc[stage.name] = applications?.filter(app => app.status === stage.name)?.length || 0;
    return acc;
  }, {} as Record<ApplicationStatus, number>);
  
  // Get recent applications (up to 3)
  const recentApplications = applications
    ?.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
    ?.slice(0, 3);
    
  const getJobById = (id: number) => {
    return jobs?.find(job => job.id === id);
  };
  
  const getStatusBadgeClass = (status: string) => {
    const stage = stages.find(s => s.name === status);
    return stage?.color || "bg-gray-100 text-gray-600";
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Application Status</h2>
        <Button variant="link" className="text-primary-600 hover:text-primary-700 p-0">
          View All
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Progress Overview</CardTitle>
            <Button variant="link" className="text-sm font-medium text-primary-600 hover:text-primary-700 p-0">
              View All
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-5 gap-2 mb-6 mt-4">
            {stages.map((stage) => (
              <div key={stage.name} className="col-span-1">
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${stage.name === 'applied' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'} mb-1.5`}>
                    <span className="font-medium">
                      {isLoading ? (
                        <Skeleton className="h-4 w-4 rounded-full" />
                      ) : (
                        statusCounts[stage.name] || 0
                      )}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-gray-500">{stage.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {isLoading || isLoadingJobs ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="w-10 h-10 rounded-md" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              ))
            ) : (
              recentApplications?.map((app) => {
                const job = getJobById(app.jobId);
                return job ? (
                  <div key={app.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-700">
                            <Building size={18} />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{job.title}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">{job.company}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{job.location || 'Remote'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Badge className={`${getStatusBadgeClass(app.status)}`}>
                          {stages.find(s => s.name === app.status)?.label || 'Applied'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : null;
              })
            )}

            {!isLoading && !isLoadingJobs && (!recentApplications || recentApplications.length === 0) && (
              <div className="text-center py-6 text-gray-500">
                <p>No applications yet. Start applying to jobs!</p>
                <Button variant="outline" className="mt-2">
                  Explore Jobs
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
