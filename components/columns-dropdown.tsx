import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings2, Check, Columns } from "lucide-react"
import { type Table as TableType } from "@tanstack/react-table"
import { useState, useEffect } from "react"

interface ColumnsDropdownProps {
  table: TableType<any>
}

export function ColumnsDropdown({ table }: ColumnsDropdownProps) {
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set())

  // Sincronizza lo stato locale con lo stato effettivo della tabella
  useEffect(() => {
    const visible = new Set(
      table.getAllColumns()
        .filter(col => col.getIsVisible())
        .map(col => col.id)
    )
    setVisibleColumns(visible)
  }, [table])

  const handleToggle = (columnId: string) => {
    const column = table.getColumn(columnId)
    if (!column) return

    const nextIsVisible = !column.getIsVisible()
    
    // Previeni la disattivazione se è l'ultima colonna visibile
    if (!nextIsVisible && table.getVisibleLeafColumns().length === 1) {
      return
    }

    // Aggiorna lo stato della colonna
    column.toggleVisibility(nextIsVisible)
    
    // Aggiorna lo stato locale
    setVisibleColumns(prev => {
      const next = new Set(prev)
      if (nextIsVisible) {
        next.add(columnId)
      } else {
        next.delete(columnId)
      }
      return next
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 rounded-full border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900"
        >
          <Columns className="h-4 w-4 mr-2" />
          Columns
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
            const isVisible = visibleColumns.has(column.id)
            return (
              <div
                key={column.id}
                role="button"
                onClick={() => handleToggle(column.id)}
                className={`
                  px-3 py-2 cursor-pointer 
                  hover:bg-gray-50 
                  flex items-center justify-between
                  transition-colors
                  ${isVisible ? 'text-primary bg-primary/5' : 'text-gray-700'}
                `}
              >
                <span className="text-sm">
                  {column.id.charAt(0).toUpperCase() + column.id.slice(1)}
                </span>
                {isVisible && (
                  <Check className="h-4 w-4 flex-shrink-0 ml-2" />
                )}
              </div>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 