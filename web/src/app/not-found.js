export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground text-lg">Oops, that page doesn't exist.</p>
      <a
        href="/"
        className="mt-6 px-4 py-2 bg-secondary text-white rounded hover:bg-primary/80 transition"
      >
        Back to Home
      </a>
    </div>
  )
}