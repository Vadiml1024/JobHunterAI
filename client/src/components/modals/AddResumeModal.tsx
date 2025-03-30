import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUp } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AddResumeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddResumeModal({ open, onClose }: AddResumeModalProps) {
  const [resumeName, setResumeName] = useState("");
  const [language, setLanguage] = useState("English");
  const [createMethod, setCreateMethod] = useState("upload");
  const [file, setFile] = useState<File | null>(null);
  
  const createResumeMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/resumes", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error("Failed to create resume");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      onClose();
      resetForm();
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resumeName) {
      alert("Please enter a resume name");
      return;
    }
    
    if (createMethod === "upload" && !file) {
      alert("Please upload a file");
      return;
    }
    
    const formData = new FormData();
    formData.append("name", resumeName);
    formData.append("language", language);
    
    if (file) {
      formData.append("file", file);
    }
    
    createResumeMutation.mutate(formData);
  };
  
  const resetForm = () => {
    setResumeName("");
    setLanguage("English");
    setCreateMethod("upload");
    setFile(null);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Resume</DialogTitle>
          <DialogDescription>
            Upload a new resume or create one from scratch.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="resume-name">Resume Name</Label>
            <Input 
              id="resume-name" 
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              placeholder="e.g., Software Developer CV"
            />
          </div>
          
          <div>
            <Label htmlFor="resume-language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="resume-language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="French">French</SelectItem>
                <SelectItem value="German">German</SelectItem>
                <SelectItem value="Spanish">Spanish</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Create Method</Label>
            <RadioGroup value={createMethod} onValueChange={setCreateMethod} className="mt-2 space-y-3">
              <div className="flex items-center">
                <RadioGroupItem value="upload" id="upload-existing" />
                <Label htmlFor="upload-existing" className="ml-3">Upload existing resume</Label>
              </div>
              <div className="flex items-center">
                <RadioGroupItem value="create" id="create-new" />
                <Label htmlFor="create-new" className="ml-3">Create from scratch</Label>
              </div>
              <div className="flex items-center">
                <RadioGroupItem value="import" id="import-linkedin" />
                <Label htmlFor="import-linkedin" className="ml-3">Import from LinkedIn</Label>
              </div>
            </RadioGroup>
          </div>
          
          {createMethod === "upload" && (
            <div className="mt-2">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-md px-6 pt-5 pb-6 flex justify-center"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.add('border-primary-500');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('border-primary-500');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('border-primary-500');
                  
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    const droppedFile = e.dataTransfer.files[0];
                    const fileExtension = droppedFile.name.split('.').pop()?.toLowerCase();
                    
                    if (['pdf', 'doc', 'docx'].includes(fileExtension || '')) {
                      setFile(droppedFile);
                    } else {
                      alert('Please upload a PDF or DOCX file');
                    }
                  }
                }}
              >
                <div className="space-y-1 text-center">
                  <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex flex-col items-center text-sm text-gray-600">
                    <Button 
                      type="button"
                      variant="ghost" 
                      className="font-medium text-primary-600 hover:text-primary-500"
                      onClick={() => {
                        // Create a temporary input element and trigger it
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.doc,.docx';
                        input.onchange = (e) => {
                          const target = e.target as HTMLInputElement;
                          if (target.files && target.files[0]) {
                            setFile(target.files[0]);
                          }
                        };
                        input.click();
                      }}
                    >
                      Upload a file
                    </Button>
                    <p className="mt-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, DOCX up to 10MB</p>
                  {file && (
                    <div className="text-sm text-green-600 mt-2 flex items-center justify-center gap-2">
                      <span>Selected: {file.name}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="h-6 w-6 p-0 text-red-500"
                        onClick={() => setFile(null)}
                      >
                        ✕
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-6 gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={createResumeMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createResumeMutation.isPending}
            >
              {createResumeMutation.isPending ? "Creating..." : "Continue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
