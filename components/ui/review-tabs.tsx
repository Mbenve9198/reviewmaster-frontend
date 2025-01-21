import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ReviewTabsProps {
  value: string;
  onValueChange: (value: string) => void;
}

function ReviewTabs({ value, onValueChange }: ReviewTabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-full min-w-[600px]">
      <TabsList className="relative h-auto w-full gap-0.5 bg-transparent p-0 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border">
        <TabsTrigger
          value="all"
          className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
        >
          All Reviews
        </TabsTrigger>
        <TabsTrigger
          value="responded"
          className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
        >
          Responded
        </TabsTrigger>
        <TabsTrigger
          value="not-responded"
          className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
        >
          Not Responded
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

export { ReviewTabs }

