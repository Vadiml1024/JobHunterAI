import React from 'react';
import { Button } from '@/components/ui/button';
import { SiLinkedin } from 'react-icons/si';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface LinkedInButtonProps {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'link' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  type: 'import' | 'export' | 'share';
  resumeId?: number;
  applicationId?: number;
  onSuccess?: (data: any) => void;
}

export function LinkedInButton({ 
  variant = 'default', 
  size = 'default', 
  type,
  resumeId,
  applicationId,
  onSuccess 
}: LinkedInButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    if (!profileUrl) {
      toast({
        title: 'Profile URL Required',
        description: 'Please enter your LinkedIn profile URL',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/linkedin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profileUrl })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import LinkedIn profile');
      }

      const data = await response.json();
      toast({
        title: 'Success!',
        description: 'LinkedIn profile imported successfully'
      });

      if (onSuccess) {
        onSuccess(data);
      }

      setDialogOpen(false);
    } catch (error) {
      console.error('LinkedIn import error:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import LinkedIn profile',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!resumeId) {
      toast({
        title: 'Export Failed',
        description: 'No resume ID provided for export',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/linkedin/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export resume to LinkedIn');
      }

      const data = await response.json();
      toast({
        title: 'Success!',
        description: 'Resume exported to LinkedIn format'
      });

      if (onSuccess) {
        onSuccess(data);
      }

      setDialogOpen(false);
    } catch (error) {
      console.error('LinkedIn export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export resume to LinkedIn',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!applicationId) {
      toast({
        title: 'Share Failed',
        description: 'No application ID provided for sharing',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/linkedin/share-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          applicationId,
          message: shareMessage 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to share application on LinkedIn');
      }

      const data = await response.json();
      toast({
        title: 'Success!',
        description: 'Application shared on LinkedIn'
      });

      if (onSuccess) {
        onSuccess(data);
      }

      setDialogOpen(false);
    } catch (error) {
      console.error('LinkedIn share error:', error);
      toast({
        title: 'Share Failed',
        description: error instanceof Error ? error.message : 'Failed to share application on LinkedIn',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonLabel = () => {
    switch (type) {
      case 'import':
        return 'Import from LinkedIn';
      case 'export':
        return 'Export to LinkedIn';
      case 'share':
        return 'Share on LinkedIn';
      default:
        return 'LinkedIn';
    }
  };

  const getDialogTitle = () => {
    switch (type) {
      case 'import':
        return 'Import LinkedIn Profile';
      case 'export':
        return 'Export to LinkedIn';
      case 'share':
        return 'Share on LinkedIn';
      default:
        return 'LinkedIn Integration';
    }
  };

  const getDialogDescription = () => {
    switch (type) {
      case 'import':
        return 'Enter your LinkedIn profile URL to import your data';
      case 'export':
        return 'Export your resume to LinkedIn format';
      case 'share':
        return 'Share your job application on LinkedIn';
      default:
        return '';
    }
  };

  const handleAction = () => {
    switch (type) {
      case 'import':
        return handleImport();
      case 'export':
        return handleExport();
      case 'share':
        return handleShare();
      default:
        return;
    }
  };

  const renderDialogContent = () => {
    switch (type) {
      case 'import':
        return (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="linkedin-url" className="col-span-4">
                LinkedIn Profile URL
              </Label>
              <Input
                id="linkedin-url"
                placeholder="https://www.linkedin.com/in/your-profile"
                className="col-span-4"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
              />
            </div>
          </div>
        );
      case 'export':
        return (
          <div className="py-4">
            <p className="text-sm text-gray-500">
              This will convert your resume to LinkedIn format, which you can then copy and paste into your LinkedIn profile.
            </p>
          </div>
        );
      case 'share':
        return (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="share-message" className="col-span-4">
                Share Message (optional)
              </Label>
              <textarea
                id="share-message"
                placeholder="I'm excited to share that I've applied for a new position!"
                className="col-span-4 min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="flex items-center gap-2">
          <SiLinkedin className="h-4 w-4" />
          {getButtonLabel()}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>
        {renderDialogContent()}
        <DialogFooter>
          <Button
            type="submit"
            variant="default"
            onClick={handleAction}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⟳</span>
                Processing...
              </>
            ) : (
              <>
                <SiLinkedin className="h-4 w-4" />
                {type === 'import' ? 'Import' : type === 'export' ? 'Export' : 'Share'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}