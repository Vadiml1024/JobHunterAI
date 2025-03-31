import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Building, Calendar, Clock, MapPin, FileText, Link, Share2, CalendarIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SiLinkedin } from 'react-icons/si';
import { LinkedInButton } from '../integrations/LinkedInButton';
// Import utilities
const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "N/A";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(dateObj);
};

interface ApplicationDetailProps {
  applicationId: number;
}

export function ApplicationDetail({ applicationId }: ApplicationDetailProps) {
  const queryClient = useQueryClient();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  
  // Application status options
  const stages = [
    { id: 'applied', label: 'Applied' },
    { id: 'screening', label: 'Screening' },
    { id: 'interview', label: 'Interview' },
    { id: 'technical', label: 'Technical' },
    { id: 'offer', label: 'Offer' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'withdrawn', label: 'Withdrawn' }
  ];
  
  // Get application details
  const { data: application, isLoading } = useQuery({
    queryKey: ['/api/applications', applicationId],
    queryFn: async () => {
      const response = await fetch(`/api/applications/${applicationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch application');
      }
      return response.json();
    }
  });
  
  // Get job details for this application
  const { data: job } = useQuery({
    queryKey: ['/api/jobs', application?.jobId],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${application.jobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }
      return response.json();
    },
    enabled: !!application?.jobId
  });
  
  // Get resume details for this application
  const { data: resume } = useQuery({
    queryKey: ['/api/resumes', application?.resumeId],
    queryFn: async () => {
      const response = await fetch(`/api/resumes/${application.resumeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch resume');
      }
      return response.json();
    },
    enabled: !!application?.resumeId
  });
  
  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      toast({
        title: 'Status Updated',
        description: `Application status changed to ${newStatus}`
      });
      setStatusDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive'
      });
    }
  });
  
  const handleStatusChange = () => {
    if (!newStatus) {
      toast({
        title: 'Selection Required',
        description: 'Please select a status',
        variant: 'destructive'
      });
      return;
    }
    
    updateStatusMutation.mutate(newStatus);
  };
  
  const getStatusBadgeClass = (status: string | null) => {
    if (!status) return 'bg-gray-200 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'screening':
        return 'bg-purple-100 text-purple-800';
      case 'interview':
        return 'bg-yellow-100 text-yellow-800';
      case 'technical':
        return 'bg-indigo-100 text-indigo-800';
      case 'offer':
        return 'bg-green-100 text-green-800';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };
  
  const handleLinkedInShareSuccess = (data: any) => {
    toast({
      title: 'Shared Successfully',
      description: 'Your application has been shared on LinkedIn'
    });
  };
  
  if (isLoading) {
    return (
      <Card className="w-full shadow-sm">
        <CardHeader>
          <div className="w-1/2 h-6 bg-gray-200 animate-pulse rounded mb-2"></div>
          <div className="w-1/3 h-4 bg-gray-100 animate-pulse rounded"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full h-20 bg-gray-100 animate-pulse rounded"></div>
          <div className="w-full h-40 bg-gray-100 animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (!application || !job) {
    return (
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle>Application Not Found</CardTitle>
          <CardDescription>
            The requested application details could not be loaded.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{job.title}</CardTitle>
            <CardDescription className="text-base mt-1">
              <span className="font-medium">{job.company}</span>
            </CardDescription>
          </div>
          <Badge className={getStatusBadgeClass(application.status)}>
            {stages.find(s => s.id === application.status)?.label || 'Applied'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex items-center text-sm text-gray-500">
              <Building className="h-4 w-4 mr-2" />
              <span>{job.company}</span>
            </div>
            
            {job.location && (
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{job.location}</span>
              </div>
            )}
            
            {job.jobType && (
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-2" />
                <span>{job.jobType}</span>
              </div>
            )}
            
            {job.url && (
              <div className="flex items-center text-sm text-gray-500">
                <Link className="h-4 w-4 mr-2" />
                <a 
                  href={job.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Job Listing
                </a>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Applied on {formatDate(application.appliedAt)}</span>
            </div>
            
            {resume && (
              <div className="flex items-center text-sm text-gray-500">
                <FileText className="h-4 w-4 mr-2" />
                <span>Resume: {resume.name}</span>
              </div>
            )}
            
            {application.interviewDate && (
              <div className="flex items-center text-sm text-gray-500">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span>Interview scheduled for {formatDate(application.interviewDate)}</span>
              </div>
            )}
            
            {application.deadlineDate && (
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-2" />
                <span>Deadline: {formatDate(application.deadlineDate)}</span>
              </div>
            )}
          </div>
        </div>
        
        <Separator />
        
        {job.description && (
          <div className="space-y-2">
            <h3 className="text-md font-medium">Job Description</h3>
            <div className="text-sm text-gray-600 whitespace-pre-wrap">
              {job.description}
            </div>
          </div>
        )}
        
        {application.notes && (
          <div className="space-y-2">
            <h3 className="text-md font-medium">Your Notes</h3>
            <div className="text-sm text-gray-600 whitespace-pre-wrap p-3 bg-gray-50 rounded-md">
              {application.notes}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2 flex-wrap gap-2">
        <div className="flex space-x-2">
          <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Update Status</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Update Application Status</DialogTitle>
                <DialogDescription>
                  Change the status of your application to track its progress
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="col-span-4">
                    Application Status
                  </Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="col-span-4">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map(stage => (
                        <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={handleStatusChange}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline">
            Edit Notes
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Add to Calendar
          </Button>
          
          <LinkedInButton
            type="share"
            variant="outline"
            applicationId={applicationId}
            onSuccess={handleLinkedInShareSuccess}
          />
        </div>
      </CardFooter>
    </Card>
  );
}