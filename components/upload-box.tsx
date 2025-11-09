"use client"

import { useState, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface FeedbackItem {
  text: string
  rating?: number
  source?: string
  productId?: string
  username?: string
}

interface CSVRow {
  [key: string]: string | number
}

interface UploadBoxProps {
  /**
   * Callback function called after successful analysis
   */
  onAnalyzeComplete?: () => void
}

/**
 * UploadBox Component
 * 
 * Allows users to upload feedback via:
 * - Textarea for single feedback input
 * - CSV file upload
 * 
 * Features:
 * - Preview of uploaded rows (first 5)
 * - Analyze button that posts to /api/analyze
 * - Loading state
 * - Toast notifications for success/error
 */
export function UploadBox({ onAnalyzeComplete }: UploadBoxProps = {}) {
  const { user } = useUser()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [textareaValue, setTextareaValue] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Common text column names to look for in CSV
  const textColumnNames = ["text", "feedback", "content", "comment", "review", "message", "description"]

  /**
   * Find the text column in CSV data
   */
  const findTextColumn = (headers: string[]): string | null => {
    const lowerHeaders = headers.map(h => h.toLowerCase().trim())
    for (const textCol of textColumnNames) {
      const index = lowerHeaders.findIndex(h => h === textCol)
      if (index !== -1) {
        return headers[index]
      }
    }
    // If no common name found, use first column
    return headers[0] || null
  }

  /**
   * Parse CSV file and extract feedback items
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast({
            title: "CSV parsing error",
            description: results.errors[0].message || "Failed to parse CSV file",
            variant: "destructive",
          })
          return
        }

        const data = results.data as CSVRow[]
        if (data.length === 0) {
          toast({
            title: "Empty CSV",
            description: "The CSV file contains no data",
            variant: "destructive",
          })
          return
        }

        setCsvData(data)
        toast({
          title: "CSV loaded",
          description: `Loaded ${data.length} rows from CSV file`,
        })
      },
      error: (error) => {
        toast({
          title: "CSV parsing error",
          description: error.message || "Failed to parse CSV file",
          variant: "destructive",
        })
      },
    })
  }

  /**
   * Convert CSV data to FeedbackItem array
   */
  const convertCsvToFeedbackItems = (data: CSVRow[]): FeedbackItem[] => {
    if (data.length === 0) return []

    const headers = Object.keys(data[0])
    const textColumn = findTextColumn(headers)

    if (!textColumn) {
      throw new Error("Could not find text column in CSV")
    }

    return data.map((row) => {
      const item: FeedbackItem = {
        text: String(row[textColumn] || "").trim(),
      }

      // Try to extract optional fields
      if (row.rating !== undefined) {
        const rating = typeof row.rating === "number" ? row.rating : parseFloat(String(row.rating))
        if (!isNaN(rating)) item.rating = rating
      }
      if (row.source) item.source = String(row.source)
      if (row.product_id || row.productId) item.productId = String(row.product_id || row.productId)
      if (row.username || row.user_name || row.user) item.username = String(row.username || row.user_name || row.user)

      return item
    }).filter((item) => item.text.length > 0) // Filter out empty text
  }

  /**
   * Handle analyze button click
   */
  const handleAnalyze = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to analyze feedback",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // If file is selected, use multipart/form-data upload endpoint
      if (selectedFile) {
        const formData = new FormData()
        formData.append("file", selectedFile)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || data.message || "Upload and analysis failed")
        }

        toast({
          title: "Analysis complete",
          description: `Successfully analyzed ${data.succeeded || 0} feedback item(s)`,
        })

        // Reset form on success
        setTextareaValue("")
        setSelectedFile(null)
        setCsvData([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }

        // Call callback if provided
        if (onAnalyzeComplete) {
          onAnalyzeComplete()
        }
      } else if (textareaValue.trim()) {
        // For single textarea input, use JSON endpoint
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            items: [{ text: textareaValue.trim() }],
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || data.message || "Analysis failed")
        }

        toast({
          title: "Analysis complete",
          description: `Successfully analyzed ${data.succeeded || 1} feedback item(s)`,
        })

        // Reset form on success
        setTextareaValue("")

        // Call callback if provided
        if (onAnalyzeComplete) {
          onAnalyzeComplete()
        }
      } else {
        toast({
          title: "No feedback provided",
          description: "Please enter feedback text or upload a CSV file",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get preview data (first 5 rows)
  const previewData = csvData.slice(0, 5)
  const textColumn = csvData.length > 0 ? findTextColumn(Object.keys(csvData[0])) : null

  return (
    <div className="space-y-6">
      {/* Single Feedback Input */}
      <Card>
        <CardHeader>
          <CardTitle>Single Feedback</CardTitle>
          <CardDescription>
            Enter a single feedback item to analyze
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter your feedback here..."
            value={textareaValue}
            onChange={(e) => setTextareaValue(e.target.value)}
            disabled={isLoading}
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      {/* CSV File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Upload</CardTitle>
          <CardDescription>
            Upload a CSV file containing multiple feedback items
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isLoading}
              className="flex-1"
            />
            {selectedFile && (
              <div className="flex items-center text-sm text-muted-foreground">
                {selectedFile.name}
              </div>
            )}
          </div>

          {/* CSV Preview */}
          {previewData.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Preview (first {Math.min(5, csvData.length)} rows)</h3>
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {Object.keys(previewData[0]).map((header) => (
                          <th
                            key={header}
                            className="px-3 py-2 text-left font-medium text-muted-foreground"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, idx) => (
                        <tr key={idx} className="border-t">
                          {Object.keys(row).map((key) => (
                            <td key={key} className="px-3 py-2">
                              <div className="max-w-[200px] truncate" title={String(row[key])}>
                                {String(row[key])}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {csvData.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  Showing 5 of {csvData.length} rows
                </p>
              )}
              {textColumn && (
                <p className="text-xs text-muted-foreground">
                  Using &quot;{textColumn}&quot; column as feedback text
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analyze Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleAnalyze}
          disabled={isLoading || (csvData.length === 0 && !textareaValue.trim())}
          size="lg"
          className="w-full sm:w-auto"
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </Button>
      </div>
    </div>
  )
}

