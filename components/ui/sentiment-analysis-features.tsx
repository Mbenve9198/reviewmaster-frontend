import { cn } from "@/lib/utils"
import { AlertTriangle, TrendingUp, Lightbulb } from "lucide-react"
import { useState } from "react"

export function SentimentAnalysisFeatures({
  onSelect,
  selectedFeature,
}: { onSelect: (section: string) => void; selectedFeature: string | null }) {
  const features = [
    {
      title: "Top 3 Problems",
      description: "Identify the most pressing issues affecting customer satisfaction.",
      icon: <AlertTriangle />,
      key: "problems",
    },
    {
      title: "Top 3 Strengths",
      description: "Highlight your hotel's best features for marketing purposes.",
      icon: <TrendingUp />,
      key: "strengths",
    },
    {
      title: "Suggestions",
      description: "Get actionable insights to improve your hotel's performance.",
      icon: <Lightbulb />,
      key: "suggestions",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 relative z-10 py-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature
          key={feature.key}
          title={feature.title}
          description={feature.description}
          icon={feature.icon}
          index={index}
          isSelected={selectedFeature === feature.key}
          onSelect={() => onSelect(feature.key)}
        />
      ))}
    </div>
  )
}

const Feature = ({
  title,
  description,
  icon,
  index,
  isSelected,
  onSelect,
}: {
  title: string
  description: string
  icon: React.ReactNode
  index: number
  isSelected: boolean
  onSelect: () => void
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature dark:border-neutral-800 cursor-pointer",
        index === 0 && "lg:border-l dark:border-neutral-800",
        isSelected && "bg-primary/5",
      )}
      onClick={onSelect}
    >
      <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">{icon}</div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div
          className={cn(
            "absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 transition-all duration-200 origin-center",
            isSelected && "bg-primary h-8",
          )}
        />
        <span
          className={cn(
            "group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100",
            isSelected && "translate-x-2 text-primary",
          )}
        >
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">{description}</p>
    </div>
  )
}

