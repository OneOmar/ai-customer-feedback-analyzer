"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface SentimentData {
  name: string
  value: number
}

interface SentimentChartProps {
  /**
   * Array of sentiment data with name and count
   */
  data: SentimentData[]
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
   * Whether to show as donut chart (true) or pie chart (false)
   */
  donut?: boolean
}

/**
 * Color palette for sentiment types
 */
const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#22c55e", // green-500
  negative: "#ef4444", // red-500
  neutral: "#6b7280", // gray-500
  mixed: "#eab308", // yellow-500
}

/**
 * Get color for sentiment type
 */
function getSentimentColor(sentiment: string): string {
  const lowerSentiment = sentiment.toLowerCase()
  return SENTIMENT_COLORS[lowerSentiment] || SENTIMENT_COLORS.neutral
}

/**
 * Custom tooltip for sentiment chart
 */
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]
    const total = payload.reduce((sum: number, item: any) => sum + item.payload.value, 0)
    const percentage = ((data.value / total) * 100).toFixed(1)

    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-semibold capitalize">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {data.value} feedback ({percentage}%)
        </p>
      </div>
    )
  }
  return null
}

/**
 * Custom label function for pie chart
 */
function renderCustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  // Only show label if percentage is greater than 5%
  if (percent < 0.05) return null

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

/**
 * SentimentChart Component
 * 
 * Displays sentiment distribution as a pie or donut chart
 * with tooltips and accessible legend
 */
export function SentimentChart({
  data,
  className,
  title = "Sentiment Distribution",
  description = "Breakdown of feedback sentiment",
  donut = true,
}: SentimentChartProps) {
  // Filter out zero values and sort by value
  const chartData = data
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((item) => ({
      ...item,
      fill: getSentimentColor(item.name),
    }))

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  if (chartData.length === 0) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const innerRadius = donut ? 60 : 0
  const outerRadius = 100

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full" role="img" aria-label={`${title}: ${description}`}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={outerRadius}
                innerRadius={innerRadius}
                fill="#8884d8"
                dataKey="value"
                stroke="none"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="capitalize text-sm">{value}</span>
                )}
                iconType="circle"
                wrapperStyle={{ fontSize: "14px" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center text-sm text-muted-foreground" aria-live="polite">
            Total: {total} feedback{total !== 1 ? " items" : " item"}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

