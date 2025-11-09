"use client"

import { useState, useEffect, useCallback } from "react"
import { UploadBox } from "@/components/upload-box"
import { SentimentChart, type SentimentData } from "@/components/sentiment-chart"
import { TopicsChart, type TopicData } from "@/components/topics-chart"
import { FeedbackCard } from "@/components/feedback-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

/**
 * Feedback with analysis from API
 */
interface FeedbackWithAnalysis {
  id: string
  user_id: string
  text: string
  created_at: string
  updated_at: string
  feedback_analysis: {
    id: string
    feedback_id: string
    sentiment: string | null
    sentiment_score: number | null
    topics: string[] | null
    summary: string | null
    recommendation: string | null
    created_at: string
  } | null
}

/**
 * Compute sentiment counts from feedback data
 */
function computeSentimentCounts(data: FeedbackWithAnalysis[]): SentimentData[] {
  const counts: Record<string, number> = {
    positive: 0,
    negative: 0,
    neutral: 0,
    mixed: 0,
  }

  data.forEach((item) => {
    if (item.feedback_analysis?.sentiment) {
      const sentiment = item.feedback_analysis.sentiment.toLowerCase()
      if (sentiment in counts) {
        counts[sentiment]++
      }
    }
  })

  return Object.entries(counts)
    .filter(([_, count]) => count > 0)
    .map(([name, value]) => ({ name, value }))
}

/**
 * Compute topic frequencies from feedback data
 */
function computeTopicFrequencies(data: FeedbackWithAnalysis[]): TopicData[] {
  const topicCounts: Record<string, number> = {}

  data.forEach((item) => {
    if (item.feedback_analysis?.topics && Array.isArray(item.feedback_analysis.topics)) {
      item.feedback_analysis.topics.forEach((topic: string) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1
      })
    }
  })

  return Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * DashboardContent Component
 * 
 * Main dashboard component that:
 * - Fetches feedback with analyses from API
 * - Computes sentiment counts and topic frequencies
 * - Displays charts and feedback cards
 * - Supports refetch after new upload
 */
export function DashboardContent() {
  const { toast } = useToast()
  const [data, setData] = useState<FeedbackWithAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  /**
   * Fetch feedback data from API
   */
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/feedback?limit=50")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch feedback")
      }

      setData(result.data || [])
    } catch (error) {
      console.error("Error fetching feedback:", error)
      toast({
        title: "Error loading feedback",
        description: error instanceof Error ? error.message : "Failed to load feedback data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [toast])

  /**
   * Refetch data (called after analysis completes)
   */
  const handleRefetch = useCallback(async () => {
    setIsRefreshing(true)
    await fetchData()
  }, [fetchData])

  // Fetch data on mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Compute chart data
  const sentimentData = computeSentimentCounts(data)
  const topicsData = computeTopicFrequencies(data)

  // Filter feedback with analysis for display
  const feedbackWithAnalysis = data.filter((item) => item.feedback_analysis !== null)

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Feedback</CardTitle>
          <CardDescription>
            Upload CSV files or enter single feedback for AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadBox onAnalyzeComplete={handleRefetch} />
        </CardContent>
      </Card>

      {/* Charts Section */}
      {!isLoading && data.length > 0 && (
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
      )}

      {/* Stats Cards */}
      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.length}</div>
              <p className="text-xs text-muted-foreground">
                {feedbackWithAnalysis.length} analyzed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Sentiments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sentimentData.length}</div>
              <p className="text-xs text-muted-foreground">Different sentiment types</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{topicsData.length}</div>
              <p className="text-xs text-muted-foreground">Unique topics identified</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Recent Feedback</h2>
            <p className="text-muted-foreground">
              {feedbackWithAnalysis.length} feedback items with analysis
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefetch}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading feedback...</p>
              </div>
            </CardContent>
          </Card>
        ) : feedbackWithAnalysis.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">No feedback analyzed yet</p>
                <p className="text-sm text-muted-foreground">
                  Upload feedback above to get started
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {feedbackWithAnalysis.slice(0, 12).map((item) => (
              <FeedbackCard
                key={item.id}
                text={item.text}
                analysis={{
                  sentiment: item.feedback_analysis?.sentiment || "neutral",
                  sentiment_score: item.feedback_analysis?.sentiment_score || undefined,
                  topics: item.feedback_analysis?.topics || [],
                  summary: item.feedback_analysis?.summary || "",
                  recommendation: item.feedback_analysis?.recommendation || "",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

