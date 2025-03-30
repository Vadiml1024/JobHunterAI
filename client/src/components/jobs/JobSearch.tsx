import { useState } from "react";
import { Search, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Filter {
  id: string;
  label: string;
}

export default function JobSearch({ onSearch }: { onSearch: (filters: any) => void }) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [activeFilters, setActiveFilters] = useState<Filter[]>([
    { id: "remote", label: "Remote" },
    { id: "fulltime", label: "Full-time" },
    { id: "react", label: "React" }
  ]);
  
  const handleSearch = () => {
    const filters = {
      query,
      location,
      filters: activeFilters.map(f => f.id)
    };
    onSearch(filters);
  };
  
  const removeFilter = (id: string) => {
    setActiveFilters(activeFilters.filter(f => f.id !== id));
  };
  
  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                className="pl-10"
                placeholder="Job title, skills, or company"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                className="pl-10"
                placeholder="Location or Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Button className="w-full" onClick={handleSearch}>
              Search Jobs
            </Button>
          </div>
        </div>
        
        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
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
