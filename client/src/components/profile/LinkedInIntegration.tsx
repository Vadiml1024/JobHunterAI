import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SiLinkedin } from 'react-icons/si';
import { LinkedInButton } from '../integrations/LinkedInButton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Resume } from '@/types';

export function LinkedInIntegration() {
  const queryClient = useQueryClient();
  
  // Get user data to check if LinkedIn profile is connected
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user']
  });
  
  // Get resumes to provide export functionality
  const { data: resumes } = useQuery<Resume[]>({
    queryKey: ['/api/resumes']
  });
  
  const handleImportSuccess = () => {
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
  };
  
  const hasLinkedInProfile = user && (user.linkedinProfile || user.linkedinData);
  const hasResumes = resumes && Array.isArray(resumes) && resumes.length > 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl flex items-center">
            <SiLinkedin className="h-5 w-5 mr-2 text-blue-600" />
            LinkedIn Integration
          </CardTitle>
          <CardDescription>
            Import from and export to LinkedIn
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
            <div className="flex">
              <div className="mr-3 flex-shrink-0">
                <SiLinkedin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">LinkedIn Integration</p>
                <p className="mt-1">
                  {hasLinkedInProfile 
                    ? 'Your LinkedIn profile is connected. You can update it or export your resume to LinkedIn format.'
                    : 'Connect your LinkedIn profile to import your experience and skills, or export your resume to LinkedIn format.'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Import Options</h4>
            <p className="text-sm text-gray-500">
              Import your profile information from LinkedIn to create a new resume
            </p>
            <LinkedInButton 
              type="import"
              variant="outline"
              onSuccess={handleImportSuccess}
            />
          </div>
          
          {hasResumes && (
            <div className="space-y-2">
              <h4 className="font-medium">Export Options</h4>
              <p className="text-sm text-gray-500">
                Export your resume to LinkedIn format
              </p>
              <div className="flex flex-wrap gap-2">
                {resumes && resumes.map((resume: Resume) => (
                  <LinkedInButton
                    key={resume.id}
                    type="export"
                    variant="outline"
                    resumeId={resume.id}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <p className="text-xs text-gray-500">
          Note: This integration uses the LinkedIn public profile data and does not authorize through LinkedIn's API. 
          For a production application, OAuth authorization would be implemented.
        </p>
      </CardFooter>
    </Card>
  );
}