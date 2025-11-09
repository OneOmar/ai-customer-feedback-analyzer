import { requireAuth } from '@/lib/auth'
import { UploadBox } from '@/components/upload-box'

/**
 * Protected Upload Page
 * Upload CSV files with customer feedback
 */
export default async function UploadPage() {
  await requireAuth()

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Upload Feedback</h1>
        <p className="text-muted-foreground mb-8">
          Import customer feedback data from CSV files or enter single feedback for AI analysis
        </p>

        <UploadBox />

        <div className="mt-8 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">CSV Format Requirements:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Must include a column with feedback text (feedback, content, text, comment, review, message, or description)</li>
            <li>Optional columns: rating, source, product_id, username</li>
            <li>Maximum file size: 10MB</li>
            <li>Maximum rows: 200 per batch</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

