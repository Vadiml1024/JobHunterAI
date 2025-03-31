import { useState, useEffect } from "react";
import { Search, MapPin, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface Filter {
  id: string;
  label: string;
}

interface JobSource {
  id: number;
  name: string;
  url?: string;
  apiKey?: string;
}

export default function JobSearch({ onSearch }: { onSearch: (filters: any) => void }) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [selectedSource, setSelectedSource] = useState<number | null>(null);
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  
  // Get job sources from API
  const { data: jobSources = [] } = useQuery<JobSource[]>({
    queryKey: ['/api/job-sources'],
    refetchOnWindowFocus: false
  });

  // Set first source as default when sources are loaded
  useEffect(() => {
    if (jobSources.length > 0 && !selectedSource) {
      setSelectedSource(jobSources[0].id);
    }
  }, [jobSources, selectedSource]);
  
  const handleSearch = () => {
    // Don't search without a source
    if (!selectedSource) return;
    
    const jobType = activeFilters.find(f => 
      ['fulltime', 'parttime', 'contract', 'internship'].includes(f.id)
    )?.id;
    
    const remote = activeFilters.some(f => f.id === 'remote');
    
    // Create search params object
    const searchParams = {
      sourceId: selectedSource,
      query: {
        keywords: query,
        location,
        jobType,
        remote,
        page: 1,
        pageSize: 10
      }
    };
    
    onSearch(searchParams);
  };
  
  const handleSourceChange = (value: string) => {
    setSelectedSource(parseInt(value));
  };
  
  const addFilter = (filter: Filter) => {
    // If it's already in the list, don't add again
    if (activeFilters.some(f => f.id === filter.id)) return;
    
    // If it's a job type, remove other job types first
    if (['fulltime', 'parttime', 'contract', 'internship'].includes(filter.id)) {
      const updatedFilters = activeFilters.filter(f => 
        !['fulltime', 'parttime', 'contract', 'internship'].includes(f.id)
      );
      setActiveFilters([...updatedFilters, filter]);
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };
  
  const removeFilter = (id: string) => {
    setActiveFilters(activeFilters.filter(f => f.id !== id));
  };
  
  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  // Predefined filter options
  const jobTypeFilters = [
    { id: "fulltime", label: "Full-time" },
    { id: "parttime", label: "Part-time" },
    { id: "contract", label: "Contract" },
    { id: "internship", label: "Internship" }
  ];
  
  const remoteFilters = [
    { id: "remote", label: "Remote" }
  ];
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Job Title/Keyword Search */}
          <div className="md:col-span-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                className="pl-10"
                placeholder="Job title, skills, or company"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
          
          {/* Location */}
          <div className="md:col-span-3">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                className="pl-10"
                placeholder="Location or Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
          
          {/* Job Source Selection */}
          <div className="md:col-span-3">
            <Select value={selectedSource?.toString()} onValueChange={handleSourceChange}>
              <SelectTrigger className="w-full">
                <div className="flex items-center">
                  <Globe className="mr-2 h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="Select Job Board" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {jobSources.map(source => (
                  <SelectItem key={source.id} value={source.id.toString()}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Search Button */}
          <div className="md:col-span-2">
            <Button 
              className="w-full" 
              onClick={handleSearch} 
              disabled={!selectedSource}
            >
              Search Jobs
            </Button>
          </div>
        </div>
        
        {/* Job Types and Remote Filter Options */}
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <div className="mr-2 text-sm font-medium text-gray-500">Job Type:</div>
          {jobTypeFilters.map(filter => (
            <Badge 
              key={filter.id}
              variant={activeFilters.some(f => f.id === filter.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => activeFilters.some(f => f.id === filter.id) 
                ? removeFilter(filter.id) 
                : addFilter(filter)
              }
            >
              {filter.label}
            </Badge>
          ))}
          
          <div className="ml-4 mr-2 text-sm font-medium text-gray-500">Work Type:</div>
          {remoteFilters.map(filter => (
            <Badge 
              key={filter.id}
              variant={activeFilters.some(f => f.id === filter.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => activeFilters.some(f => f.id === filter.id) 
                ? removeFilter(filter.id) 
                : addFilter(filter)
              }
            >
              {filter.label}
            </Badge>
          ))}
        </div>
        
        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <div className="text-sm font-medium text-gray-500">Active Filters:</div>
            {activeFilters.map(filter => (
              <Badge 
                key={filter.id} 
                variant="secondary"
                className="flex items-center gap-1 text-sm bg-gray-100 text-gray-800 hover:bg-gray-200 px-3 py-1"
              >
                {filter.label}
                <button onClick={() => removeFilter(filter.id)}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            ))}
            <Button 
              variant="link" 
              className="text-sm text-primary-600 hover:text-primary-700 px-2 h-auto py-0"
              onClick={clearAllFilters}
            >
              Clear all
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
