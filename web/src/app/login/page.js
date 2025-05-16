"use client"

import { useEffect, useState } from "react"

export default function LoginPage() {
  const [message, setMessage] = useState("")

  useEffect(() => {
    const callBackend = async () => {
      try {
        const res = await fetch("/api/login", { method: "POST" })
        const data = await res.json()
        setMessage(data.message)
      } catch (error) {
        console.error("Error fetching from backend:", error)
        setMessage("Failed to connect to backend")
      }
    }

    callBackend()
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Login Page</h1>
      <p className="mt-4 text-muted-foreground">{message}</p>
    </main>
  )
}