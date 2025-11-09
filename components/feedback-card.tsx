"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeedbackAnalysis {
  sentiment: string
  sentiment_score?: number
  topics: string[]
  summary: string
  recommendation: string
}

interface FeedbackCardProps {
  /**
   * The original feedback text
   */
  text: string
  /**
   * Analysis results from the API
   */
  analysis: FeedbackAnalysis
  /**
   * Optional className for styling
   */
  className?: string
}

/**
 * Get sentiment badge variant and color based on sentiment value
 */
function getSentimentStyle(sentiment: string): {
  variant: "default" | "secondary" | "destructive" | "outline"
  className: string
} {
  const lowerSentiment = sentiment.toLowerCase()

  if (lowerSentiment === "positive") {
    return {
      variant: "default",
      className: "bg-green-500/10 text-green-700 border-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
    }
  }

  if (lowerSentiment === "negative") {
    return {
      variant: "destructive",
      className: "bg-red-500/10 text-red-700 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30",
    }
  }

  if (lowerSentiment === "mixed") {
    return {
      variant: "secondary",
      className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30",
    }
  }

  // Default to neutral
  return {
    variant: "outline",
    className: "bg-gray-500/10 text-gray-700 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30",
  }
}

/**
 * FeedbackCard Component
 * 
 * Displays a single feedback analysis result with:
 * - Color-coded sentiment badge
 * - Topic chips
 * - Summary (2 lines)
 * - Recommendation (1 line)
 * - Expandable original text
 */
export function FeedbackCard({ text, analysis, className }: FeedbackCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const sentimentStyle = getSentimentStyle(analysis.sentiment)

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge
                variant={sentimentStyle.variant}
                className={cn(
                  "font-semibold capitalize",
                  sentimentStyle.className
                )}
              >
                {analysis.sentiment}
                {analysis.sentiment_score !== undefined && (
                  <span className="ml-1 opacity-75">
                    ({Math.round(analysis.sentiment_score * 100)}%)
                  </span>
                )}
              </Badge>
              {analysis.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {analysis.topics.slice(0, 5).map((topic, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs font-normal"
                    >
                      {topic}
                    </Badge>
                  ))}
                  {analysis.topics.length > 5 && (
                    <Badge variant="outline" className="text-xs font-normal">
                      +{analysis.topics.length - 5} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary - 2 lines */}
        <div>
          <h4 className="text-sm font-semibold mb-1.5">Summary</h4>
          <p
            className="text-sm text-muted-foreground line-clamp-2"
            title={analysis.summary}
          >
            {analysis.summary}
          </p>
        </div>

        {/* Recommendation - 1 line */}
        <div>
          <h4 className="text-sm font-semibold mb-1.5">Recommendation</h4>
          <p
            className="text-sm text-muted-foreground line-clamp-1"
            title={analysis.recommendation}
          >
            {analysis.recommendation}
          </p>
        </div>

        {/* Expandable Original Text */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full">
            <span>{isExpanded ? "Hide" : "Show"} original feedback</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 overflow-hidden transition-all data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 duration-200">
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <p className="whitespace-pre-wrap break-words">{text}</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

