"use client"

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Building2, 
  Users, 
  Bed, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clearAuthData } from '@/lib/auth'
import { showSuccess } from '@/lib/sweetAlert'
import { staffNavigation } from '@/data/navigation/staffNav'
import { filterNavigationByPermissions } from '@/config/permissions'
import { usePermissions } from '@/hooks/usePermissions'

interface StaffLayoutProps {
  children: React.ReactNode
}

export default function StaffLayout({ children }: StaffLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { userRole } = usePermissions()

  // Filter navigation based on user permissions
  const filteredNavigation = filterNavigationByPermissions(staffNavigation, userRole)

  // Convert filtered navigation to the format expected by the layout
  const navigation = filteredNavigation.map(item => ({
    name: item.title,
    href: item.href,
    icon: item.icon,
    current: pathname === item.href
  }))

  const handleLogout = () => {
    clearAuthData()
    showSuccess('Logged Out', 'You have been successfully logged out.')
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Hostel Staff</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Button
                key={item.name}
                variant={item.current ? "default" : "ghost"}
                className={`w-full justify-start ${
                  item.current 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => {
                  router.push(item.href)
                  setSidebarOpen(false)
                }}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Button>
            ))}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Hostel Staff</span>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Button
                key={item.name}
                variant={item.current ? "default" : "ghost"}
                className={`w-full justify-start ${
                  item.current 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => router.push(item.href)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Button>
            ))}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
              <Button variant="ghost" size="sm">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
