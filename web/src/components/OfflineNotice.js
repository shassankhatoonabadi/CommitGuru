"use client"

import { useEffect, useState } from "react"
import { WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OfflineNotice() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => setOffline(!navigator.onLine)
    updateOnlineStatus()

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background text-foreground px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex justify-center items-center w-20 h-20 rounded-full bg-muted">
          <WifiOff className="h-10 w-10 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">No internet connection</h1>
          <p className="text-sm text-muted-foreground">
            You appear to be offline. Please check your network and try again.
          </p>
        </div>

        <Button
          variant="default"
          className="inline-flex items-center gap-2"
          onClick={() => location.reload()}
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    </div>
  )
}
