'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import ThemeToggle from '@/components/ThemeToggle'
import { usePathname } from 'next/navigation'
import { Menu } from '@headlessui/react'
import {
  Dialog,
  DialogPanel,
} from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session } = useSession()
  const username = session?.user?.username || session?.user?.email
  const pathname = usePathname()

  const linkClass = (href) =>
    `text-sm font-semibold hover:underline transition ${pathname === href ? 'text-blue-500' : 'text-muted-foreground'
    }`

  return (
    <header className="bg-background text-foreground border-b border-border">
      <nav className="relative mx-auto max-w-7xl px-6 py-4 flex items-center">
        {/* Left: Logo */}
        <div className="flex flex-1">
          <a href="/" className="flex items-center gap-2">
            <img
              alt="Commit Guru Logo"
              src="https://cdn.iconscout.com/icon/premium/png-512-thumb/git-commit-4241545-3517850.png?f=webp&w=512"
              className="h-8 w-auto"
            />
            <span className="text-lg font-bold text-[hsl(var(--accent))]">
              Commit Guru
            </span>
          </a>
        </div>

        {/* Center: Nav Links */}
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden lg:flex gap-x-12">
          <a href="/" className={linkClass('/')}>Home</a>
          <a href="/dashboard" className={linkClass('/dashboard')}>Dashboard</a>
          <a href="/about" className={linkClass('/about')}>About</a>
        </div>

        {/* Right: Welcome + Toggle */}
        <div className="flex flex-1 justify-end items-center gap-4 text-sm">
          {session?.user ? (
            <Menu as="div" className="relative text-left">
              <Menu.Button className="hover:underline">
                Welcome, <span className="font-semibold">{username}</span>
              </Menu.Button>
              <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right bg-popover border border-border rounded-md shadow-lg focus:outline-none z-50">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="/dashboard"
                        className={`block px-4 py-2 text-sm ${active ? 'bg-muted text-foreground' : 'text-muted-foreground'
                          }`}
                      >
                        Dashboard
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => signOut()}
                        className={`block w-full text-left px-4 py-2 text-sm ${active ? 'bg-muted text-foreground' : 'text-muted-foreground'
                          }`}
                      >
                        Logout
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Menu>
          ) : (
            <a href="/login" className="font-semibold hover:underline">Login</a>
          )}
          <ThemeToggle />
        </div>
      </nav>


      {/* Mobile Menu (unchanged) */}
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-10 bg-black/50" />
        <DialogPanel className="fixed inset-y-0 right-0 z-20 w-full max-w-sm bg-background text-foreground p-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <a href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
              <img
                alt="Commit Guru Logo"
                src="https://cdn.iconscout.com/icon/premium/png-512-thumb/git-commit-4241545-3517850.png?f=webp&w=512"
                className="h-8 w-auto"
              />
              <span className="text-lg font-bold text-[hsl(var(--accent))]">Commit Guru</span>
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <a href="/" className="block text-base font-semibold hover:underline">Home</a>
            <a href="/dashboard" className="block text-base font-semibold hover:underline">Dashboard</a>
            <a href="/about" className="block text-base font-semibold hover:underline">About</a>
          </div>

          <div className="mt-8 border-t border-border pt-6 flex items-center justify-between">
            {session?.user ? (
              <a href="/dashboard" className="text-sm font-semibold hover:underline">
                Welcome, {username}
              </a>
            ) : (
              <a href="/login" className="text-sm font-semibold hover:underline">
                Login
              </a>
            )}
            <ThemeToggle />
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  )
}