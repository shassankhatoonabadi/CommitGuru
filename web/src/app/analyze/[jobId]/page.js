"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

const STATUS_MAP = {
  queued: { label: "Queued", progress: 10 },
  in_progress: { label: "Processing", progress: 50 },
  completed: { label: "Completed", progress: 100 },
  error: { label: "Error", progress: 100 },
}

export default function AnalyzeStatusPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params?.jobId

  const [status, setStatus] = useState("queued")
  const [step, setStep] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!jobId) return

    const stream = new EventSource(`/api/job-stream?jobId=${jobId}`)

    stream.onmessage = (e) => {
      const { status, step, error } = JSON.parse(e.data)
      setStatus(status)
      setStep(step)
      setError(error)

      if (status === "completed") {
        setTimeout(() => router.push("/dashboard"), 2000)
      }
    }

    return () => stream.close()
  }, [jobId])

  const statusInfo = STATUS_MAP[status]

  return (
    <main className="flex items-center justify-center min-h-screen px-4 py-12">
      <Card className="w-full max-w-xl shadow-lg border">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl flex items-center gap-2">
            {status === "completed" && <CheckCircle2 className="text-green-500" />}
            {status === "error" && <XCircle className="text-red-500" />}
            {status === "in_progress" || status === "queued" ? (
              <Loader2 className="animate-spin text-blue-500" />
            ) : null}
            Analyzing Repository
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            This may take a few moments. Sit tight!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-1">
            <p className="text-lg font-medium">{statusInfo?.label}</p>
            <p className="text-sm text-muted-foreground">{step || "Starting..."}</p>
          </div>

          <Progress value={statusInfo?.progress} />

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </main>
  )
}