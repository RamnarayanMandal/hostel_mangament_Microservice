import { 
  Building2, 
  Users, 
  Home, 
  Settings, 
  User,
  FileText,
  Calendar,
  BarChart3,
  Shield,
  Bell,
  CreditCard,
  MessageSquare,
  HelpCircle
} from 'lucide-react'
import { NavItemType } from '@/components/ui/nav-item'
import { NavigationItem } from '@/config/permissions'

export const adminNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/admin/",
    icon: Home,
    permissions: ['hostels:read', 'students:read', 'bookings:read']
  },
  {
    title: "Hostels",
    href: "/admin/hostels",
    icon: Building2,
    permissions: ['hostels:read']
  },
  {
    title: "Students",
    href: "/admin/students",
    icon: Users,
    permissions: ['students:read']
  },
  {
    title: "Staff",
    href: "/admin/staff",
    icon: User,
    permissions: ['staff:read'],
    roles: ['SUPER_ADMIN', 'HOSTEL_ADMIN', 'ADMIN']
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    permissions: ['admin:read'],
    roles: ['SUPER_ADMIN', 'HOSTEL_ADMIN', 'ADMIN']
  },
  {
    title: "Bookings",
    href: "/admin/bookings",
    icon: Calendar,
    permissions: ['bookings:read']
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
    permissions: ['reports:read']
  },
  {
    title: "Documents",
    href: "/admin/documents",
    icon: FileText,
    permissions: ['documents:read']
  },
  {
    title: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
    permissions: ['payments:read'],
    roles: ['SUPER_ADMIN', 'HOSTEL_ADMIN', 'ADMIN', 'ACCOUNTANT']
  },
  {
    title: "Security",
    href: "/admin/security",
    icon: Shield,
    permissions: ['security:read'],
    roles: ['SUPER_ADMIN', 'ADMIN']
  },
  {
    title: "Messages",
    href: "/admin/messages",
    icon: MessageSquare,
    permissions: ['messages:read']
  },
  {
    title: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    permissions: ['notifications:read']
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    permissions: ['settings:read'],
    roles: ['SUPER_ADMIN', 'HOSTEL_ADMIN', 'ADMIN']
  },
  {
    title: "Help & Support",
    href: "/admin/help",
    icon: HelpCircle
  }
]

// Legacy export for backward compatibility
export const adminNavigationLegacy: NavItemType[] = adminNavigation.map(item => ({
  title: item.title,
  href: item.href,
  icon: item.icon
})) 