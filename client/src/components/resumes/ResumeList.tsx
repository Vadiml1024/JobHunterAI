import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Resume } from "@/types";
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
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

export default function ResumeList() {
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
  
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this resume?")) {
      deleteMutation.mutate(id);
    }
  };
  
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
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
                      <DropdownMenuItem>
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
                  {resume.skills?.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-800">
                      {skill}
                    </Badge>
                  ))}
                  {resume.skills && resume.skills.length > 3 && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                      +{resume.skills.length - 3} more
                    </Badge>
                  )}
                </div>
                
                <div className="mt-4 flex space-x-3">
                  <Button variant="outline" className="flex-1 h-9">
                    <Eye className="mr-1.5 h-4 w-4" />
                    Preview
                  </Button>
                  <Button className="flex-1 h-9">
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
  );
}
