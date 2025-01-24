import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings2, Check } from "lucide-react"
import { Table } from "@tanstack/react-table"

interface ColumnsDropdownProps {
  table: Table<any>
}

export function ColumnsDropdown({ table }: ColumnsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="rounded-xl bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className="w-[180px] bg-white rounded-xl border border-gray-200"
      >
        <DropdownMenuLabel className="text-gray-500 text-sm font-normal px-3 py-2 border-b">
          Toggle Columns
        </DropdownMenuLabel>
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => {
            const isChecked = column.getIsVisible();
            return (
              <div
                key={column.id}
                className="px-3 py-2 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                onClick={() => column.toggleVisibility(!isChecked)}
              >
                <span className="text-sm text-gray-700">
                  {column.id.charAt(0).toUpperCase() + column.id.slice(1)}
                </span>
                {isChecked && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 