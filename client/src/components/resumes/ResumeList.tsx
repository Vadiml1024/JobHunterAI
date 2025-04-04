import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Resume } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  MoreHorizontal, 
  Eye, 
  Pencil,
  Download,
  Copy,
  Trash,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

export default function ResumeList() {
  const [previewResume, setPreviewResume] = useState<Resume | null>(null);
  const [editResume, setEditResume] = useState<Resume | null>(null);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  
  const { data: resumes, isLoading } = useQuery<Resume[]>({
    queryKey: ["/api/resumes"]
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/resumes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
    }
  });
  
  const analyzeMutation = useMutation({
    mutationFn: async (id: number) => {
      setAnalyzingId(id);
      return await apiRequest("POST", `/api/resumes/${id}/analyze`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      setAnalyzingId(null);
    },
    onError: (error) => {
      console.error("Resume analysis error:", error);
      alert("Failed to analyze resume. Please try again later.");
      setAnalyzingId(null);
    }
  });
  
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this resume?")) {
      deleteMutation.mutate(id);
    }
  };
  
  const handleAnalyzeResume = (id: number) => {
    analyzeMutation.mutate(id);
  };
  
  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown date';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  const handlePreview = (resume: Resume) => {
    console.log("Preview resume data:", resume);
    console.log("Experience type:", typeof resume.experience);
    console.log("Experience value:", resume.experience);
    console.log("Education type:", typeof resume.education);
    console.log("Education value:", resume.education);
    setPreviewResume(resume);
  };
  
  const handleEdit = (resume: Resume) => {
    setEditResume(resume);
  };

  return (
    <>
      <Card>
        <CardContent className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="ml-3">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center">
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  
                  <div className="mt-4 flex space-x-3">
                    <Skeleton className="h-9 w-full rounded-md" />
                    <Skeleton className="h-9 w-full rounded-md" />
                  </div>
                </div>
              ))
            ) : (
              resumes?.map((resume) => (
                <div key={resume.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 flex-shrink-0 ${
                        resume.language === 'English' ? 'bg-primary-100 text-primary-700' :
                        resume.language === 'French' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      } rounded-lg flex items-center justify-center`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">{resume.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {resume.language} • Updated {formatDate(resume.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(resume)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          <span>Download</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          <span>Duplicate</span>
                        </DropdownMenuItem>
                        {(!Array.isArray(resume.skills) || resume.skills.length === 0) && (
                          <DropdownMenuItem 
                            onClick={() => handleAnalyzeResume(resume.id)}
                            disabled={analyzingId === resume.id}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            <span>{analyzingId === resume.id ? "Analyzing..." : "Analyze Skills"}</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDelete(resume.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center">
                      <div className="text-xs font-medium mr-2">Matching score:</div>
                      <Progress value={resume.matchScore} className="h-2 flex-grow" />
                      <div className="ml-2 text-xs font-medium">{resume.matchScore}%</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(Array.isArray(resume.skills) ? resume.skills : []).slice(0, 3).map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-800">
                        {skill}
                      </Badge>
                    ))}
                    {Array.isArray(resume.skills) && resume.skills.length > 3 && (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                        +{resume.skills.length - 3} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mt-4 flex space-x-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-9"
                      onClick={() => handlePreview(resume)}
                    >
                      <Eye className="mr-1.5 h-4 w-4" />
                      Preview
                    </Button>
                    <Button 
                      className="flex-1 h-9"
                      onClick={() => handleEdit(resume)}
                    >
                      <Pencil className="mr-1.5 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))
            )}
            
            {!isLoading && (!resumes || resumes.length === 0) && (
              <div className="col-span-full text-center py-10 text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No resumes yet</h3>
                <p>Upload your first resume or create one from scratch</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Resume Modal */}
      <Dialog open={!!previewResume} onOpenChange={(open) => !open && setPreviewResume(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Resume Preview: {previewResume?.name}</DialogTitle>
            <DialogDescription>
              View your resume details and information
            </DialogDescription>
          </DialogHeader>
          
          {previewResume && (
            <div className="mt-4 space-y-6 overflow-y-auto pr-2 flex-grow">
              <div>
                <h3 className="text-lg font-medium text-primary">Personal Information</h3>
                <div className="mt-2 bg-muted/30 p-4 rounded-md">
                  <p><strong>Name:</strong> {previewResume.name}</p>
                  <p><strong>Language:</strong> {previewResume.language}</p>
                  <p><strong>Last Updated:</strong> {formatDate(previewResume.updatedAt)}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-primary">Skills</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Array.isArray(previewResume.skills) ? previewResume.skills : []).map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                  {(!Array.isArray(previewResume.skills) || previewResume.skills.length === 0) && (
                    <p className="text-muted-foreground">No skills found</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-primary">Resume Content</h3>
                <div className="mt-2 bg-muted/30 p-4 rounded-md">
                  {previewResume.content ? (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed max-h-[30vh] overflow-y-auto">
                      {previewResume.content}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No resume content available</p>
                  )}
                </div>
              </div>
              
              {previewResume.summary && (
                <div>
                  <h3 className="text-lg font-medium text-primary">Summary</h3>
                  <div className="mt-2 bg-muted/30 p-4 rounded-md">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {previewResume.summary}
                    </div>
                  </div>
                </div>
              )}
              
              {previewResume.experience && (
                <div>
                  <h3 className="text-lg font-medium text-primary">Experience</h3>
                  <div className="mt-2 bg-muted/30 p-4 rounded-md space-y-2">
                    {Array.isArray(previewResume.experience) ? (
                      previewResume.experience.map((exp: any, i: number) => (
                        <div key={i} className="pb-2 border-b last:border-b-0 last:pb-0">
                          <div className="font-medium">{exp.position || exp.role || 'Position'}</div>
                          <div>{exp.company || 'Company'}</div>
                          {exp.description && <div className="text-sm text-gray-600 mt-1">{exp.description}</div>}
                        </div>
                      ))
                    ) : typeof previewResume.experience === 'string' ? (
                      (() => {
                        console.log("Experience is a string:", previewResume.experience);
                        try {
                          // Try to parse it as JSON string
                          const parsedExperience = JSON.parse(previewResume.experience);
                          console.log("Parsed experience:", parsedExperience);
                          
                          if (Array.isArray(parsedExperience)) {
                            return parsedExperience.map((exp: any, i: number) => (
                              <div key={i} className="pb-2 border-b last:border-b-0 last:pb-0">
                                <div className="font-medium">{exp.position || exp.role || 'Position'}</div>
                                <div>{exp.company || 'Company'}</div>
                                {exp.description && <div className="text-sm text-gray-600 mt-1">{exp.description}</div>}
                              </div>
                            ));
                          } else {
                            return <div className="whitespace-pre-wrap text-sm leading-relaxed">{previewResume.experience}</div>;
                          }
                        } catch (e) {
                          console.log("Error parsing experience:", e);
                          return <div className="whitespace-pre-wrap text-sm leading-relaxed">{previewResume.experience}</div>;
                        }
                      })()
                    ) : (
                      <p className="text-muted-foreground">No experience data found</p>
                    )}
                  </div>
                </div>
              )}
              
              {previewResume.education && (
                <div>
                  <h3 className="text-lg font-medium text-primary">Education</h3>
                  <div className="mt-2 bg-muted/30 p-4 rounded-md space-y-2">
                    {Array.isArray(previewResume.education) ? (
                      previewResume.education.map((edu: any, i: number) => (
                        <div key={i} className="pb-2 border-b last:border-b-0 last:pb-0">
                          <div className="font-medium">{edu.institution || 'Institution'}</div>
                          <div>{edu.qualification || edu.degree || 'Qualification'}</div>
                          {edu.description && <div className="text-sm text-gray-600 mt-1">{edu.description}</div>}
                        </div>
                      ))
                    ) : typeof previewResume.education === 'string' ? (
                      (() => {
                        console.log("Education is a string:", previewResume.education);
                        try {
                          // Try to parse it as JSON string
                          const parsedEducation = JSON.parse(previewResume.education);
                          console.log("Parsed education:", parsedEducation);
                          
                          if (Array.isArray(parsedEducation)) {
                            return parsedEducation.map((edu: any, i: number) => (
                              <div key={i} className="pb-2 border-b last:border-b-0 last:pb-0">
                                <div className="font-medium">{edu.institution || 'Institution'}</div>
                                <div>{edu.qualification || edu.degree || 'Qualification'}</div>
                                {edu.description && <div className="text-sm text-gray-600 mt-1">{edu.description}</div>}
                              </div>
                            ));
                          } else {
                            return <div className="whitespace-pre-wrap text-sm leading-relaxed">{previewResume.education}</div>;
                          }
                        } catch (e) {
                          console.log("Error parsing education:", e);
                          return <div className="whitespace-pre-wrap text-sm leading-relaxed">{previewResume.education}</div>;
                        }
                      })()
                    ) : previewResume.education && typeof previewResume.education === 'object' ? (
                      // Handle when education is an object (not an array or string)
                      Object.entries(previewResume.education).map(([key, value], i) => {
                        console.log(`Education entry ${i}:`, key, value);
                        const edu = value as Record<string, any>;
                        return (
                          <div key={i} className="pb-2 border-b last:border-b-0 last:pb-0">
                            <div className="font-medium">{edu.institution || key || 'Institution'}</div>
                            <div>{edu.qualification || edu.degree || 'Qualification'}</div>
                            {edu.description && <div className="text-sm text-gray-600 mt-1">{edu.description}</div>}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground">No education data found</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-between pt-4 mt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => previewResume?.fileUrl ? window.open(previewResume.fileUrl, '_blank') : alert('No file available')}
              className="gap-2"
              disabled={!previewResume?.fileUrl}
            >
              <FileText className="h-4 w-4" />
              View Original File
            </Button>
            <Button onClick={() => setPreviewResume(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Resume Modal */}
      <Dialog open={!!editResume} onOpenChange={(open) => !open && setEditResume(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Resume: {editResume?.name}</DialogTitle>
            <DialogDescription>
              Update your resume information
            </DialogDescription>
          </DialogHeader>
          
          {editResume && (
            <div className="mt-4 overflow-y-auto pr-2 flex-grow">
              <p className="pb-4">The resume editing feature is coming soon. Here you will be able to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Edit your resume details</li>
                <li>Update your skills and experience</li>
                <li>Replace your resume file</li>
                <li>Generate optimized versions for specific job applications</li>
              </ul>
              
              <div className="mt-6 flex justify-end pt-4 border-t">
                <Button onClick={() => setEditResume(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
