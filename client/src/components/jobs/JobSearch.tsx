import React, { useState, useEffect } from "react";
import { Search, MapPin, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { JobBoard } from "./JobBoard";

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
  const [selectedSources, setSelectedSources] = useState<number[]>([]);
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  
  // Get job sources from API
  const { data, refetch, isLoading } = useQuery({
    queryKey: ['/api/job-sources']
  });
  
  // Force type the data as JobSource[] and provide a default empty array
  const jobSources: JobSource[] = data as JobSource[] || [];

  // Log job sources for debugging
  useEffect(() => {
    console.log("Job sources loaded:", jobSources);
  }, [jobSources]);

  // Set first source as default when sources are loaded
  useEffect(() => {
    if (jobSources.length > 0 && selectedSources.length === 0) {
      setSelectedSources([jobSources[0].id]);
    }
  }, [jobSources]);
  
  const handleSearch = () => {
    // Don't search without at least one source
    if (selectedSources.length === 0) return;
    
    const jobType = activeFilters.find(f => 
      ['fulltime', 'parttime', 'contract', 'internship'].includes(f.id)
    )?.id;
    
    const remote = activeFilters.some(f => f.id === 'remote');
    
    // Create search params object with multiple sources
    const searchParams = {
      sourceIds: selectedSources,
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
  
  const handleSourceToggle = (sourceId: number) => {
    setSelectedSources(prev => {
      if (prev.includes(sourceId)) {
        // Remove the source if already selected
        return prev.filter(id => id !== sourceId);
      } else {
        // Add the source if not already selected
        return [...prev, sourceId];
      }
    });
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

  // Helper to render static job boards
  const renderJobBoards = () => {
    // Hardcoded job board names
    const jobBoardNames = ["LinkedIn", "Indeed", "Glassdoor"];
    
    return (
      <>
        {jobSources.map((source, index) => (
          <React.Fragment key={`job-source-${source.id}`}>
            <JobBoard
              name={source.name || jobBoardNames[index] || `Job Source ${index + 1}`}
              id={source.id}
              isSelected={selectedSources.includes(source.id)}
              onToggle={handleSourceToggle}
            />
          </React.Fragment>
        ))}
      </>
    );
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
            <div className="border rounded-md p-2 h-full">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <Globe className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Click on badges to select job boards:</span>
                </div>
                <button 
                  onClick={() => refetch()} 
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Refresh
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {isLoading ? (
                  <div className="text-sm text-gray-500 py-1 w-full">
                    <span className="inline-block mr-2 animate-spin">⟳</span>
                    Loading job boards...
                  </div>
                ) : jobSources && jobSources.length > 0 ? (
                  renderJobBoards()
                ) : (
                  <div className="text-sm text-gray-500 py-1 w-full flex items-center">
                    <span className="inline-block mr-2">⚠️</span>
                    No job boards found. 
                    <button 
                      onClick={() => refetch()} 
                      className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Search Button */}
          <div className="md:col-span-2">
            <Button 
              className="w-full" 
              onClick={handleSearch} 
              disabled={selectedSources.length === 0}
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
              className={`cursor-pointer transition-all hover:scale-105 ${
                activeFilters.some(f => f.id === filter.id) 
                  ? "bg-primary-500 text-white" 
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              onClick={() => activeFilters.some(f => f.id === filter.id) 
                ? removeFilter(filter.id) 
                : addFilter(filter)
              }
            >
              {filter.label} {activeFilters.some(f => f.id === filter.id) ? 
                '✓' : 
                <span className="text-xs ml-1 opacity-75">+</span>}
            </Badge>
          ))}
          
          <div className="ml-4 mr-2 text-sm font-medium text-gray-500">Work Type:</div>
          {remoteFilters.map(filter => (
            <Badge 
              key={filter.id}
              variant={activeFilters.some(f => f.id === filter.id) ? "default" : "outline"}
              className={`cursor-pointer transition-all hover:scale-105 ${
                activeFilters.some(f => f.id === filter.id) 
                  ? "bg-primary-500 text-white" 
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              onClick={() => activeFilters.some(f => f.id === filter.id) 
                ? removeFilter(filter.id) 
                : addFilter(filter)
              }
            >
              {filter.label} {activeFilters.some(f => f.id === filter.id) ? 
                '✓' : 
                <span className="text-xs ml-1 opacity-75">+</span>}
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