"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

export function PaginationControls({ currentPage, totalPages, onPageChange }) {
  const handleFirstPage = () => {
    onPageChange(1)
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const handleLastPage = () => {
    onPageChange(totalPages)
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // If total pages is less than or equal to maxPagesToShow, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always include first page
      pageNumbers.push(1)

      // Calculate start and end of page range
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if at the beginning
      if (currentPage <= 2) {
        end = Math.min(totalPages - 1, 4)
      }

      // Adjust if at the end
      if (currentPage >= totalPages - 1) {
        start = Math.max(2, totalPages - 3)
      }

      // Add ellipsis if needed
      if (start > 2) {
        pageNumbers.push("...")
      }

      // Add page numbers
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i)
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pageNumbers.push("...")
      }

      // Always include last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <Button
        variant="outline"
        size="icon"
        onClick={handleFirstPage}
        disabled={currentPage === 1}
        aria-label="Go to first page"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handlePreviousPage}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center space-x-1">
        {getPageNumbers().map((page, index) =>
          typeof page === "number" ? (
            <Button
              key={index}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              onClick={() => onPageChange(page)}
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </Button>
          ) : (
            <span key={index} className="px-2">
              {page}
            </span>
          ),
        )}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleLastPage}
        disabled={currentPage === totalPages}
        aria-label="Go to last page"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
