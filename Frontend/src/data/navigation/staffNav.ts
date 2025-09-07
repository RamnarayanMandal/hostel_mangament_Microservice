import { 
  Building2, 
  Users, 
  Home, 
  Settings, 
  FileText,
  Calendar,
  BarChart3,
  Bell,
  CreditCard,
  MessageSquare,
  HelpCircle,
  UserCheck,
  ClipboardList
} from 'lucide-react'
import { NavigationItem } from '@/config/permissions'

export const staffNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/staff/",
    icon: Home,
    permissions: ['hostels:read', 'students:read', 'bookings:read']
  },
  {
    title: "Hostels",
    href: "/staff/hostels",
    icon: Building2,
    permissions: ['hostels:read']
  },
  {
    title: "Students",
    href: "/staff/students",
    icon: Users,
    permissions: ['students:read']
  },
  {
    title: "Bookings",
    href: "/staff/bookings",
    icon: Calendar,
    permissions: ['bookings:read']
  },
  {
    title: "Allocations",
    href: "/staff/allocations",
    icon: UserCheck,
    permissions: ['bookings:approve']
  },
  {
    title: "Check-ins",
    href: "/staff/checkins",
    icon: ClipboardList,
    permissions: ['bookings:update']
  },
  {
    title: "Reports",
    href: "/staff/reports",
    icon: BarChart3,
    permissions: ['reports:read']
  },
  {
    title: "Documents",
    href: "/staff/documents",
    icon: FileText,
    permissions: ['documents:read']
  },
  {
    title: "Messages",
    href: "/staff/messages",
    icon: MessageSquare,
    permissions: ['messages:read']
  },
  {
    title: "Notifications",
    href: "/staff/notifications",
    icon: Bell,
    permissions: ['notifications:read']
  },
  {
    title: "Settings",
    href: "/staff/settings",
    icon: Settings,
    permissions: ['settings:read']
  },
  {
    title: "Help & Support",
    href: "/staff/help",
    icon: HelpCircle
  }
]
