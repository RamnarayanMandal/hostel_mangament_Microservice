"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Building2, 
  Calendar, 
  CreditCard,
  BookOpen,
  Clock,
  Star,
  Search,
  Bed,
  ArrowRight
} from 'lucide-react'
import { 
  StaggerContainer, 
  StaggerItem, 
  FadeIn, 
  SlideUp, 
  HoverLift
} from '@/components/ui/motion'
import { useRouter } from 'next/navigation'

export default function StudentDashboard() {
  const router = useRouter()
  
  const stats = [
    {
      title: "My Hostel",
      value: "Block A - Room 101",
      icon: Building2,
      description: "Current accommodation"
    },
    {
      title: "Next Payment",
      value: "₹15,000",
      icon: CreditCard,
      description: "Due in 15 days"
    },
    {
      title: "Classes Today",
      value: "4",
      icon: BookOpen,
      description: "Upcoming classes"
    },
    {
      title: "Study Hours",
      value: "6.5 hrs",
      icon: Clock,
      description: "This week"
    }
  ]

  const recentActivities = [
    {
      title: "Payment Successful",
      description: "Hostel fee paid for March",
      time: "2 hours ago",
      icon: CreditCard
    },
    {
      title: "Room Maintenance",
      description: "AC service completed",
      time: "1 day ago",
      icon: Building2
    },
    {
      title: "New Assignment",
      description: "Computer Science Project",
      time: "2 days ago",
      icon: BookOpen
    }
  ]

  return (
    <div className="space-y-6">
      <SlideUp>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here&apos;s your hostel overview.</p>
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
                    <stat.icon className="h-4 w-4 text-gray-400" />
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

      {/* Recent Activity */}
      <StaggerContainer>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StaggerItem>
            <FadeIn>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Latest updates from your hostel</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <activity.icon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.description}</p>
                          <p className="text-xs text-gray-400">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </StaggerItem>

          <StaggerItem>
            <FadeIn>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common student tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <HoverLift>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-auto p-3"
                        onClick={() => router.push('/hostels')}
                      >
                        <div className="flex items-center space-x-3">
                          <Search className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">Browse Hostels</p>
                            <p className="text-sm text-gray-500">Find available rooms</p>
                          </div>
                        </div>
                      </Button>
                    </HoverLift>
                    <HoverLift>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-auto p-3"
                        onClick={() => router.push('/student/bookings')}
                      >
                        <div className="flex items-center space-x-3">
                          <Bed className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium">My Bookings</p>
                            <p className="text-sm text-gray-500">View your reservations</p>
                          </div>
                        </div>
                      </Button>
                    </HoverLift>
                    <HoverLift>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-auto p-3"
                        onClick={() => router.push('/hostels')}
                      >
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium">Book New Room</p>
                            <p className="text-sm text-gray-500">Make a new reservation</p>
                          </div>
                        </div>
                      </Button>
                    </HoverLift>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </div>
  )
}

