import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface JobFiltersProps {
  onApplyFilters: (filters: any) => void;
}

export default function JobFilters({ onApplyFilters }: JobFiltersProps) {
  const [jobType, setJobType] = useState<string[]>(["fulltime"]);
  const [experienceLevel, setExperienceLevel] = useState<string[]>(["senior"]);
  const [remoteOptions, setRemoteOptions] = useState<string[]>(["remote"]);
  const [salaryRange, setSalaryRange] = useState<number>(100000);
  
  const handleJobTypeChange = (value: string) => {
    setJobType(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };
  
  const handleExperienceLevelChange = (value: string) => {
    setExperienceLevel(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };
  
  const handleRemoteOptionsChange = (value: string) => {
    setRemoteOptions(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };
  
  const handleSalaryChange = (values: number[]) => {
    setSalaryRange(values[0]);
  };
  
  const handleResetFilters = () => {
    setJobType([]);
    setExperienceLevel([]);
    setRemoteOptions([]);
    setSalaryRange(30000);
  };
  
  const handleApplyFilters = () => {
    onApplyFilters({
      jobType,
      experienceLevel,
      remoteOptions,
      salaryRange
    });
  };

  return (
    <Card className="sticky top-24 border-none shadow">
      <CardHeader className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <CardTitle className="text-base font-medium text-gray-900">Filters</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Job Type</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <Checkbox 
                id="filter-full-time" 
                checked={jobType.includes("fulltime")}
                onCheckedChange={() => handleJobTypeChange("fulltime")}
              />
              <Label htmlFor="filter-full-time" className="ml-2 text-sm text-gray-700">
                Full-time
              </Label>
            </div>
            <div className="flex items-center">
              <Checkbox 
                id="filter-part-time" 
                checked={jobType.includes("parttime")}
                onCheckedChange={() => handleJobTypeChange("parttime")}
              />
              <Label htmlFor="filter-part-time" className="ml-2 text-sm text-gray-700">
                Part-time
              </Label>
            </div>
            <div className="flex items-center">
              <Checkbox 
                id="filter-contract" 
                checked={jobType.includes("contract")}
                onCheckedChange={() => handleJobTypeChange("contract")}
              />
              <Label htmlFor="filter-contract" className="ml-2 text-sm text-gray-700">
                Contract
              </Label>
            </div>
            <div className="flex items-center">
              <Checkbox 
                id="filter-internship" 
                checked={jobType.includes("internship")}
                onCheckedChange={() => handleJobTypeChange("internship")}
              />
              <Label htmlFor="filter-internship" className="ml-2 text-sm text-gray-700">
                Internship
              </Label>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Experience Level</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <Checkbox 
                id="filter-entry" 
                checked={experienceLevel.includes("entry")}
                onCheckedChange={() => handleExperienceLevelChange("entry")}
              />
              <Label htmlFor="filter-entry" className="ml-2 text-sm text-gray-700">
                Entry Level
              </Label>
            </div>
            <div className="flex items-center">
              <Checkbox 
                id="filter-mid" 
                checked={experienceLevel.includes("mid")}
                onCheckedChange={() => handleExperienceLevelChange("mid")}
              />
              <Label htmlFor="filter-mid" className="ml-2 text-sm text-gray-700">
                Mid Level
              </Label>
            </div>
            <div className="flex items-center">
              <Checkbox 
                id="filter-senior" 
                checked={experienceLevel.includes("senior")}
                onCheckedChange={() => handleExperienceLevelChange("senior")}
              />
              <Label htmlFor="filter-senior" className="ml-2 text-sm text-gray-700">
                Senior Level
              </Label>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Salary Range</h3>
          <div className="space-y-2">
            <div>
              <Slider
                defaultValue={[salaryRange]}
                max={200000}
                min={30000}
                step={10000}
                value={[salaryRange]}
                onValueChange={handleSalaryChange}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>$30k</span>
                <span>$200k+</span>
              </div>
              <div className="text-sm text-gray-700 mt-2 text-center">${salaryRange.toLocaleString()}+</div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Remote Options</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <Checkbox 
                id="filter-remote" 
                checked={remoteOptions.includes("remote")}
                onCheckedChange={() => handleRemoteOptionsChange("remote")}
              />
              <Label htmlFor="filter-remote" className="ml-2 text-sm text-gray-700">
                Remote
              </Label>
            </div>
            <div className="flex items-center">
              <Checkbox 
                id="filter-hybrid" 
                checked={remoteOptions.includes("hybrid")}
                onCheckedChange={() => handleRemoteOptionsChange("hybrid")}
              />
              <Label htmlFor="filter-hybrid" className="ml-2 text-sm text-gray-700">
                Hybrid
              </Label>
            </div>
            <div className="flex items-center">
              <Checkbox 
                id="filter-onsite" 
                checked={remoteOptions.includes("onsite")}
                onCheckedChange={() => handleRemoteOptionsChange("onsite")}
              />
              <Label htmlFor="filter-onsite" className="ml-2 text-sm text-gray-700">
                On-site
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-4 border-t border-gray-200 flex flex-col space-y-3 px-6 pb-8 sticky bottom-0 z-10 bg-white">
        <Button 
          className="w-full"
          onClick={handleApplyFilters}
        >
          Apply Filters
        </Button>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleResetFilters}
        >
          Reset Filters
        </Button>
      </CardFooter>
    </Card>
  );
}
