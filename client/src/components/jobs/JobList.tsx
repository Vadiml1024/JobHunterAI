import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Job } from "@/types";
import { Building, DollarSign, ArrowUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface JobListProps {
  filters?: any;
}

export default function JobList({ filters }: JobListProps) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("relevance");
  
  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs", filters],
    queryFn: async ({ queryKey }) => {
      const [endpoint, filterParams] = queryKey;
      
      // Build query string from filters
      const params = new URLSearchParams();
      
      if (filterParams) {
        Object.entries(filterParams).forEach(([key, value]) => {
          // Skip empty values and arrays
          if (!value) return;
          
          if (Array.isArray(value) && value.length > 0) {
            // Handle arrays like jobType, remoteOptions, etc.
            value.forEach(item => {
              params.append(key, item);
            });
          } else if (typeof value === 'string' || typeof value === 'number') {
            params.append(key, String(value));
          }
        });
      }
      
      const queryString = params.toString();
      const url = `${endpoint}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      return response.json();
    }
  });
  
  const itemsPerPage = 10;
  const totalPages = jobs ? Math.ceil(jobs.length / itemsPerPage) : 0;
  
  const paginatedJobs = jobs?.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  
  const handleSort = (value: string) => {
    setSortBy(value);
    // This would typically come with API sorting
  };
  
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <Card className="border-none shadow">
      <CardHeader className="border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-900">
            {jobs ? `${jobs.length} Jobs Found` : 'Searching jobs...'}
          </h2>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">Sort by:</span>
            <Select value={sortBy} onValueChange={handleSort}>
              <SelectTrigger className="w-[130px] text-sm h-9">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="salary">Salary: High to Low</SelectItem>
                <SelectItem value="match">Match Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ul className="divide-y divide-gray-200">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <li key={i} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="ml-4">
                      <Skeleton className="h-5 w-40 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <Skeleton className="h-5 w-24 rounded-full mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="mt-3">
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="mt-3">
                  <Skeleton className="h-4 w-32" />
                </div>
              </li>
            ))
          ) : (
            paginatedJobs?.map((job) => (
              <li key={job.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-primary-100 rounded-md flex items-center justify-center text-primary-700">
                        <Building className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-base font-medium text-gray-900">{job.title}</h3>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-600 mr-2">{job.company}</span>
                        <span className="text-sm text-gray-500">{job.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge className="bg-green-100 text-green-800">
                      {job.matchScore}% Match
                    </Badge>
                    <span className="text-sm text-gray-500 mt-1">
                      {formatDate(job.postedAt)} • {job.source}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {job.description}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {job.skills?.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-800">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <DollarSign className="mr-1.5 h-4 w-4 text-gray-400" />
                  {job.salary}
                </div>
              </li>
            ))
          )}
          
          {!isLoading && (!paginatedJobs || paginatedJobs.length === 0) && (
            <li className="px-6 py-12 text-center text-gray-500">
              <p className="mb-1 font-medium">No jobs found</p>
              <p>Try changing your search criteria or removing some filters</p>
            </li>
          )}
        </ul>
      </CardContent>
      
      {totalPages > 1 && (
        <CardFooter className="px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(page * itemsPerPage, jobs?.length || 0)}
                </span>{" "}
                of <span className="font-medium">{jobs?.length}</span> results
              </p>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setPage(pageNum)}
                        isActive={page === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {totalPages > 5 && (
                  <>
                    <PaginationItem>
                      <span className="flex h-9 w-9 items-center justify-center text-sm">...</span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink 
                        onClick={() => setPage(totalPages)}
                        isActive={page === totalPages}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
