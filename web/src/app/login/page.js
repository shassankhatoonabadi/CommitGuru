"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ThemeToggle from "@/components/ThemeToggle"
import { toast } from "sonner"

export default function AuthPage() {
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSignup) {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Account created successfully!")
        const loginRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })
        if (!loginRes?.error) window.location.href = "/"
      } else {
        setMessage(data.message || "Sign up failed")
        toast.error(data.message || "Sign up failed")
      }
    } else {
      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (loginRes?.error) {
        setMessage(loginRes.error)
        toast.error(loginRes.error)
      } else {
        toast.success("Logged in successfully!")
        window.location.href = "/"
      }
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md border border-border shadow-2xl backdrop-blur-lg bg-card/80">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-extrabold drop-shadow-sm">
            {isSignup ? "Create an Account" : "Welcome to "}
            {!isSignup && <span className="text-blue-500"> Commit Guru</span>}
          </CardTitle>
          {!isSignup && <p className="text-sm text-muted-foreground mt-1">Sign in to get started.</p>}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {isSignup ? "Sign Up" : "Sign In"}
            </Button>

            <div className="my-4 text-center text-sm text-muted-foreground">or</div>

            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-border text-foreground hover:bg-accent"
              onClick={() => signIn("github", { callbackUrl: "/" })}
            >
              <Github className="w-5 h-5" /> Sign in with GitHub
            </Button>

            {message && <p className="mt-2 text-sm text-red-500 text-center animate-pulse">{message}</p>}
          </form>

          <div className="text-center mt-6">
            <p className="text-sm">
              {isSignup ? "Already have an account?" : "Don't have an account?"}
              <button
                onClick={() => setIsSignup(!isSignup)}
                className="ml-1 font-semibold text-green-500 hover:underline"
              >
                {isSignup ? "Log in" : "Sign up"}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}