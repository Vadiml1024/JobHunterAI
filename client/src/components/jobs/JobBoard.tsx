import { Badge } from "@/components/ui/badge";

interface JobBoardProps {
  name: string;
  id: number;
  isSelected: boolean;
  onToggle: (id: number) => void;
}

export function JobBoard({ name, id, isSelected, onToggle }: JobBoardProps) {
  return (
    <Badge 
      key={`job-source-${id}`}
      variant={isSelected ? "default" : "outline"}
      className={`cursor-pointer transition-all hover:scale-105 ${
        isSelected 
          ? "bg-primary-500 text-white" 
          : "bg-gray-100 hover:bg-gray-200"
      }`}
      onClick={() => onToggle(id)}
    >
      {name} {isSelected ? 
        '✓' : 
        <span className="text-xs ml-1 opacity-75">+</span>}
    </Badge>
  );
}