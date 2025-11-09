"use client"

/**
 * Example usage of SentimentChart and TopicsChart components
 * 
 * This file demonstrates how to use the chart components with sample data.
 * You can import and use these components in your pages.
 */

import { SentimentChart, type SentimentData } from "@/components/sentiment-chart"
import { TopicsChart, type TopicData } from "@/components/topics-chart"

/**
 * Example component showing how to use both charts
 */
export function ChartsExample() {
  // Example sentiment data
  const sentimentData: SentimentData[] = [
    { name: "positive", value: 45 },
    { name: "negative", value: 20 },
    { name: "neutral", value: 25 },
    { name: "mixed", value: 10 },
  ]

  // Example topics data
  const topicsData: TopicData[] = [
    { topic: "product quality", count: 35 },
    { topic: "shipping speed", count: 28 },
    { topic: "customer service", count: 22 },
    { topic: "pricing", count: 18 },
    { topic: "user interface", count: 15 },
    { topic: "documentation", count: 12 },
    { topic: "features", count: 10 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <SentimentChart
          data={sentimentData}
          title="Sentiment Distribution"
          description="Breakdown of feedback sentiment"
          donut={true}
        />
        
        <TopicsChart
          data={topicsData}
          title="Top Topics"
          description="Most frequently mentioned topics"
          maxTopics={10}
          height={300}
        />
      </div>
    </div>
  )
}

/**
 * Example: How to transform API response data for charts
 */
export function transformAnalysisResultsToChartData(analysisResults: any[]) {
  // Count sentiments
  const sentimentCounts: Record<string, number> = {
    positive: 0,
    negative: 0,
    neutral: 0,
    mixed: 0,
  }

  // Count topics
  const topicCounts: Record<string, number> = {}

  analysisResults.forEach((result) => {
    if (result.analysis?.sentiment) {
      const sentiment = result.analysis.sentiment.toLowerCase()
      if (sentimentCounts[sentiment] !== undefined) {
        sentimentCounts[sentiment]++
      }
    }

    if (result.analysis?.topics) {
      result.analysis.topics.forEach((topic: string) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1
      })
    }
  })

  // Transform to chart data format
  const sentimentData: SentimentData[] = Object.entries(sentimentCounts)
    .filter(([_, count]) => count > 0)
    .map(([name, value]) => ({ name, value }))

  const topicsData: TopicData[] = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)

  return { sentimentData, topicsData }
}

