import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Trash2, BarChart2 } from "lucide-react"
import { toast } from "sonner"
import { getCookie } from "cookies-next"
import { AnalyticsDialog } from "./analytics/AnalyticsDialog"
import { Review } from "@/services/api"

interface BulkActionsDropdownProps {
  selectedRows: Review[]
  onRefresh: () => void
  onBulkDelete?: () => void
}

export function BulkActionsDropdown({ 
  selectedRows, 
  onRefresh,
  onBulkDelete 
}: BulkActionsDropdownProps) {
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)

  const handleBulkDelete = async () => {
    try {
      const selectedIds = selectedRows.map(row => row._id);

      if (selectedIds.length === 0) {
        toast.error('No reviews selected');
        return;
      }

      console.log('Sending bulk delete request for IDs:', selectedIds);

      const token = getCookie('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/bulk-delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reviewIds: selectedIds })
      });

      console.log('Bulk delete response:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Bulk delete error response:', errorData);
        throw new Error(errorData.message || 'Failed to delete reviews');
      }

      const data = await response.json();
      console.log('Bulk delete success:', data);

      toast.success(`Successfully deleted ${selectedIds.length} reviews`);
      onBulkDelete && onBulkDelete();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete reviews');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 px-2 lg:px-3">
            Bulk Actions
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setIsAnalyticsOpen(true)}
            disabled={selectedRows.length < 10}
          >
            <BarChart2 className="mr-2 h-4 w-4" />
            Analizza Recensioni
          </DropdownMenuItem>
          {onBulkDelete && (
            <DropdownMenuItem
              className="text-red-600"
              onClick={handleBulkDelete}
            >
              Elimina Recensioni
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AnalyticsDialog
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        selectedReviews={selectedRows}
      />
    </>
  )
} 