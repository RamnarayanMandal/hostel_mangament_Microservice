"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Building2, 
  Users, 
  Bed, 
  Calendar, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Settings,
  BarChart3,
  UserCheck,
  Mail,
  Phone
} from 'lucide-react'
import { 
  StaggerContainer, 
  StaggerItem, 
  FadeIn, 
  SlideUp, 
  HoverLift
} from '@/components/ui/motion'

export default function StaffDashboard() {
  const stats = [
    {
      title: "Total Hostels",
      value: "8",
      icon: Building2,
      description: "Managed hostels",
      color: "text-blue-600"
    },
    {
      title: "Total Students",
      value: "324",
      icon: Users,
      description: "Resident students",
      color: "text-green-600"
    },
    {
      title: "Available Beds",
      value: "45",
      icon: Bed,
      description: "Vacant beds",
      color: "text-orange-600"
    },
    {
      title: "Pending Requests",
      value: "12",
      icon: Clock,
      description: "Allocation requests",
      color: "text-red-600"
    }
  ]

  const recentBookings = [
    {
      studentName: "Rajesh Kumar",
      hostelName: "Boys Hostel A",
      roomNumber: "A-101",
      bedNumber: "1",
      status: "Confirmed",
      date: "2025-01-15",
      amount: "₹15,000"
    },
    {
      studentName: "Priya Sharma",
      hostelName: "Girls Hostel B",
      roomNumber: "B-205",
      bedNumber: "2",
      status: "Pending",
      date: "2025-01-14",
      amount: "₹18,000"
    },
    {
      studentName: "Amit Singh",
      hostelName: "Boys Hostel C",
      roomNumber: "C-102",
      bedNumber: "1",
      status: "Confirmed",
      date: "2025-01-13",
      amount: "₹16,500"
    }
  ]

  const pendingTasks = [
    {
      title: "Room Allocation Review",
      description: "Review 5 pending room allocation requests",
      priority: "High",
      dueDate: "Today",
      icon: UserCheck,
      color: "text-red-600"
    },
    {
      title: "Maintenance Request",
      description: "Fix AC in Room B-205",
      priority: "Medium",
      dueDate: "Tomorrow",
      icon: Settings,
      color: "text-orange-600"
    },
    {
      title: "Monthly Report",
      description: "Generate occupancy report for January",
      priority: "Low",
      dueDate: "Jan 31",
      icon: FileText,
      color: "text-blue-600"
    }
  ]

  const quickActions = [
    {
      title: "Manage Bookings",
      description: "View and manage student bookings",
      icon: Calendar,
      color: "bg-blue-500",
      href: "/staff/bookings"
    },
    {
      title: "Room Allocation",
      description: "Allocate rooms to students",
      icon: Bed,
      color: "bg-green-500",
      href: "/staff/allocations"
    },
    {
      title: "Student Management",
      description: "Manage student profiles",
      icon: Users,
      color: "bg-purple-500",
      href: "/staff/students"
    },
    {
      title: "Reports",
      description: "Generate hostel reports",
      icon: BarChart3,
      color: "bg-orange-500",
      href: "/staff/reports"
    }
  ]

  return (
    <div className="space-y-6">
      <SlideUp>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here&apos;s your hostel management overview.</p>
        </div>
      </SlideUp>

      {/* Stats Grid */}
      <StaggerContainer>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StaggerItem key={index}>
              <HoverLift>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </CardContent>
                </Card>
              </HoverLift>
            </StaggerItem>
          ))}
        </div>
      </StaggerContainer>

      {/* Content Grid */}
      <StaggerContainer>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Bookings */}
          <StaggerItem className="lg:col-span-2">
            <FadeIn>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>Latest student booking requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentBookings.map((booking, index) => (
                      <HoverLift key={index}>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{booking.studentName}</p>
                              <p className="text-sm text-gray-500">
                                {booking.hostelName} - Room {booking.roomNumber}, Bed {booking.bedNumber}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              booking.status === 'Confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {booking.status}
                            </div>
                            <p className="text-sm font-medium mt-1">{booking.amount}</p>
                            <p className="text-xs text-gray-500">{booking.date}</p>
                          </div>
                        </div>
                      </HoverLift>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" className="w-full">
                      View All Bookings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </StaggerItem>

          {/* Pending Tasks */}
          <StaggerItem>
            <FadeIn>
              <Card>
                <CardHeader>
                  <CardTitle>Pending Tasks</CardTitle>
                  <CardDescription>Tasks requiring your attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingTasks.map((task, index) => (
                      <HoverLift key={index}>
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-start space-x-3">
                            <task.icon className={`h-5 w-5 ${task.color} mt-0.5`} />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{task.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  task.priority === 'High' 
                                    ? 'bg-red-100 text-red-800' 
                                    : task.priority === 'Medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {task.priority}
                                </span>
                                <span className="text-xs text-gray-400">{task.dueDate}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </HoverLift>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </StaggerItem>
        </div>
      </StaggerContainer>

      {/* Quick Actions */}
      <StaggerItem>
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common hostel management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <HoverLift key={index}>
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-gray-50"
                    >
                      <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-sm">{action.title}</p>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                    </Button>
                  </HoverLift>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </StaggerItem>

      {/* Recent Activity */}
      <StaggerItem>
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from hostel management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Room allocation completed</p>
                    <p className="text-xs text-gray-500">Student Rajesh Kumar allocated to Room A-101</p>
                    <p className="text-xs text-gray-400">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Notification sent</p>
                    <p className="text-xs text-gray-500">Payment reminder sent to 15 students</p>
                    <p className="text-xs text-gray-400">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Maintenance request</p>
                    <p className="text-xs text-gray-500">AC repair needed in Room B-205</p>
                    <p className="text-xs text-gray-400">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </StaggerItem>
    </div>
  )
}
