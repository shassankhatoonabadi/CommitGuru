"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon, Laptop2 } from "lucide-react"
import { Menu } from "@headlessui/react"
import { Button } from "@/components/ui/button"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const options = [
    { label: "Light", value: "light", icon: <Sun className="h-4 w-4" /> },
    { label: "Dark", value: "dark", icon: <Moon className="h-4 w-4" /> },
    { label: "System", value: "system", icon: <Laptop2 className="h-4 w-4" /> },
  ]

  return (
    <Menu as="div" className="relative text-left">
      <Menu.Button as={Button} variant="ghost" size="icon" aria-label="Toggle Theme">
        {theme === "light" ? <Sun className="h-5 w-5" /> :
         theme === "dark" ? <Moon className="h-5 w-5" /> :
         <Laptop2 className="h-5 w-5" />}
      </Menu.Button>
      <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right bg-popover border border-border rounded-md shadow-lg z-50 focus:outline-none">
        <div className="py-1">
          {options.map(({ label, value, icon }) => (
            <Menu.Item key={value}>
              {({ active }) => (
                <button
                  onClick={() => setTheme(value)}
                  className={`flex items-center gap-2 w-full text-left px-4 py-2 text-sm ${
                    theme === value
                      ? 'bg-muted text-foreground'
                      : active
                      ? 'bg-muted text-muted-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {icon} {label}
                </button>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Menu>
  )
}