import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function SearchPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className
}: SearchPaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 4) {
        // Near the beginning
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near the end
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      {/* Results info */}
      <div className="text-sm text-muted-foreground">
        Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of{' '}
        {totalItems.toLocaleString()} results
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((page, index) => (
            page === 'ellipsis' ? (
              <div key={`ellipsis-${index}`} className="px-2">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className={cn(
                  "min-w-[40px]",
                  currentPage === page && "bg-primary text-primary-foreground"
                )}
              >
                {page}
              </Button>
            )
          ))}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}