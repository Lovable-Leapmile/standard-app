import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationFilterProps {
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  placeholder?: string;
}

export function PaginationFilter({ 
  itemsPerPage, 
  onItemsPerPageChange, 
  searchQuery = "", 
  onSearchChange,
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  placeholder = "Search..."
}: PaginationFilterProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="space-y-4">
      <div className="flex items-center h-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-10 h-10 border-border/60 focus:border-primary"
          />
        </div>
      </div>
      
      {totalItems > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {startItem} to {endItem} of {totalItems} items
          </span>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}