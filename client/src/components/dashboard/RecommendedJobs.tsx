import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Job } from "@/types";
import { Building, DollarSign, Clock, Link } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecommendedJobs() {
  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs/recommended"],
  });

  const handleApply = (jobId: number) => {
    console.log(`Applying to job: ${jobId}`);
    // Redirect to application page or open modal
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Recommended Jobs</h2>
        <Button variant="link" className="text-primary-600 hover:text-primary-700 p-0">
          View All
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:grid-cols-2">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="border-none">
              <CardContent className="p-5">
                <div className="flex items-start">
                  <Skeleton className="w-12 h-12 rounded-md" />
                  <div className="ml-4">
                    <Skeleton className="h-5 w-36 mb-2" />
                    <Skeleton className="h-4 w-24 mb-3" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full mt-5" />
              </CardContent>
            </Card>
          ))
        ) : (
          jobs?.map((job) => (
            <Card key={job.id} className="border-none">
              <CardContent className="p-5">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-100 rounded-md flex items-center justify-center text-primary-700">
                      <Building />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-base font-medium text-gray-900">{job.title}</h3>
                    <div className="mt-1 flex items-center space-x-1">
                      <span className="text-sm text-gray-600">{job.company}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-sm text-gray-600">{job.location}</span>
                    </div>
                    <div className="mt-2">
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                        Match: {job.matchScore}%
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center text-sm text-gray-500">
                    <DollarSign className="text-gray-400 mr-1.5 h-4 w-4" />
                    {job.salary}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="text-gray-400 mr-1.5 h-4 w-4" />
                    {job.jobType}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {job.skills?.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="mt-5">
                  <Button className="w-full" onClick={() => handleApply(job.id)}>
                    Apply Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        
        {!isLoading && (!jobs || jobs.length === 0) && (
          <div className="col-span-full text-center py-10 text-gray-500">
            <p className="mb-2">No recommended jobs yet.</p>
            <p>Complete your profile and upload your resume to get personalized recommendations.</p>
          </div>
        )}
      </div>
    </div>
  );
}
