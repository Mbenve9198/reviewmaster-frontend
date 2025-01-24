import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { getCookie } from "cookies-next"

interface BulkActionsDropdownProps {
  selectedRows: any[];
  onRefresh: () => void;
}

export function BulkActionsDropdown({ selectedRows, onRefresh }: BulkActionsDropdownProps) {
  const handleBulkDelete = async () => {
    try {
      const selectedIds = selectedRows.map(row => row._id);

      if (selectedIds.length === 0) {
        toast.error('No reviews selected');
        return;
      }

      const token = getCookie('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/bulk-delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reviewIds: selectedIds })
      });

      if (!response.ok) {
        throw new Error('Failed to delete reviews');
      }

      toast.success(`Successfully deleted ${selectedIds.length} reviews`);
      onRefresh();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete reviews');
    }
  };

  return (
    selectedRows.length > 0 && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="sm"
            className="rounded-xl bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all"
          >
            Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end"
          className="w-[160px] bg-white rounded-xl border border-gray-200"
        >
          <DropdownMenuItem
            onClick={handleBulkDelete}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg mx-1 my-1"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Reviews
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  )
} 