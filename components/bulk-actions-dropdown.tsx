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
      onRefresh();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete reviews');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="sm"
          disabled={selectedRows.length === 0}
          className={`
            rounded-xl bg-primary text-primary-foreground transition-all
            ${selectedRows.length === 0 
              ? 'opacity-50 cursor-not-allowed'
              : 'shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px]'
            }
          `}
        >
          Bulk Actions ({selectedRows.length}) <ChevronDown className="ml-2 h-4 w-4" />
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
  );
} 