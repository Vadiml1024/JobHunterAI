import { Badge } from "@/components/ui/badge";

interface JobSource {
  id: number;
  name: string;
  url?: string;
}

interface JobSourceBadgeProps {
  source: JobSource;
  isSelected: boolean;
  onClick: () => void;
}

export default function JobSourceBadge({ source, isSelected, onClick }: JobSourceBadgeProps) {
  return (
    <Badge 
      key={`job-source-${source.id}`}
      variant={isSelected ? "default" : "outline"}
      className={`cursor-pointer transition-all hover:scale-105 ${
        isSelected 
          ? "bg-primary-500 text-white" 
          : "bg-gray-100 hover:bg-gray-200"
      }`}
      onClick={onClick}
    >
      {source.name} {isSelected ? 
        '✓' : 
        <span className="text-xs ml-1 opacity-75">+</span>}
    </Badge>
  );
}