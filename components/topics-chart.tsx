"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface TopicData {
  topic: string
  count: number
}

interface TopicsChartProps {
  /**
   * Array of topic data with topic name and count
   */
  data: TopicData[]
  /**
   * Optional className for styling
   */
  className?: string
  /**
   * Chart title
   */
  title?: string
  /**
   * Chart description
   */
  description?: string
  /**
   * Maximum number of topics to display
   */
  maxTopics?: number
  /**
   * Chart height in pixels
   */
  height?: number
}

/**
 * Custom tooltip for topics chart
 */
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const count = data.count || payload[0].value

    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-semibold">{data.fullTopic || label || data.topic}</p>
        <p className="text-sm text-muted-foreground">
          {count} feedback {count !== 1 ? "items" : "item"}
        </p>
      </div>
    )
  }
  return null
}

/**
 * Format topic name for display (truncate if too long)
 */
function formatTopicName(topic: string, maxLength: number = 30): string {
  if (topic.length <= maxLength) return topic
  return topic.substring(0, maxLength) + "..."
}

/**
 * TopicsChart Component
 * 
 * Displays top topics as a horizontal bar chart
 * with tooltips and accessible legend
 */
export function TopicsChart({
  data,
  className,
  title = "Top Topics",
  description = "Most frequently mentioned topics in feedback",
  maxTopics = 10,
  height = 400,
}: TopicsChartProps) {
  // Sort by count, take top N, and format for chart
  const chartData = data
    .sort((a, b) => b.count - a.count)
    .slice(0, maxTopics)
    .reverse() // Reverse to show highest at top
    .map((item) => ({
      topic: formatTopicName(item.topic, 25),
      count: item.count,
      fullTopic: item.topic, // Keep full topic for tooltip
    }))

  const total = data.reduce((sum, item) => sum + item.count, 0)

  if (chartData.length === 0) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No topics available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full" role="img" aria-label={`${title}: ${description}`}>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                label={{ value: "Count", position: "insideBottom", offset: -5, fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="topic"
                width={120}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }} />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
                name="Count"
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center text-sm text-muted-foreground" aria-live="polite">
            Showing top {chartData.length} of {data.length} topics • Total: {total} mentions
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

