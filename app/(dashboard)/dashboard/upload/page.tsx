import { requireAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * Protected Upload Page
 * Upload CSV files with customer feedback
 */
export default async function UploadPage() {
  await requireAuth()

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Upload Feedback</h1>
        <p className="text-muted-foreground mb-8">
          Import customer feedback data from CSV files for AI analysis
        </p>

        <Card>
          <CardHeader>
            <CardTitle>CSV Upload</CardTitle>
            <CardDescription>
              Upload a CSV file containing customer feedback. The file should include
              columns for feedback text, date, and any additional metadata.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <div className="mx-auto w-12 h-12 mb-4 text-muted-foreground">
                📁
              </div>
              <p className="text-sm font-medium mb-2">
                Drag and drop your CSV file here
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                or click to browse files
              </p>
              <Button variant="outline">
                Choose File
              </Button>
            </div>

            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">CSV Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Must include a column with feedback text (feedback, content, or text)</li>
                <li>Optional: date, customer_id, rating columns</li>
                <li>Maximum file size: 10MB</li>
                <li>Maximum rows: 10,000 per upload</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

