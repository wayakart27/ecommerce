"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Users, Gift, Banknote, Loader2, AlertCircle, CheckCircle2, Clock, Eye, Search } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getAdminDashboardData,
  getUsersWithReferrals,
  getUserDetails,
  updateReferralSettings,
} from "@/actions/admin"

const formatNaira = (amount) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default function ReferralDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [dashboardData, setDashboardData] = useState(null)
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [minPayoutAmount, setMinPayoutAmount] = useState(500000)
  const [referralPercentage, setReferralPercentage] = useState(1.5)
  const [usersPage, setUsersPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getAdminDashboardData()
      if (response.success) {
        setDashboardData(response.data)
        setMinPayoutAmount(response.data.payoutStats.minPayoutAmount || 500000)
        setReferralPercentage(response.data.payoutStats.referralPercentage || 1.5)
      } else {
        toast.error(response.message)
      }
    } catch (error) {
      toast.error("Failed to load dashboard data")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async (page = 1, search = "") => {
    try {
      setUsersLoading(true)
      const response = await getUsersWithReferrals({ page, limit: 10, search })
      if (response.success) {
        setUsers(response.data.users)
        setUsersPage(page)
      } else {
        toast.error(response.message)
      }
    } catch (error) {
      toast.error("Failed to load users")
      console.error(error)
    } finally {
      setUsersLoading(false)
    }
  }, [])

  const fetchUserDetails = useCallback(async (userId) => {
    try {
      const response = await getUserDetails(userId)
      if (response.success) {
        setSelectedUser(response.data)
        setIsUserDialogOpen(true)
      } else {
        toast.error(response.message)
      }
    } catch (error) {
      toast.error("Failed to load user details")
      console.error(error)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [session, fetchDashboardData])

  if (loading || status === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          <Skeleton className="h-9 w-64 rounded-lg" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <Card key={i} className="border rounded-xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between p-4">
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Skeleton className="h-8 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border rounded-xl shadow-sm">
              <CardHeader className="p-4">
                <Skeleton className="h-6 w-32 rounded-md" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-64 w-full rounded-lg" />
              </CardContent>
            </Card>
            <Card className="border rounded-xl shadow-sm">
              <CardHeader className="p-4">
                <Skeleton className="h-6 w-32 rounded-md" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-64 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center text-center space-y-4 max-w-md p-6">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">Failed to load data</h2>
          <p className="text-gray-600">We couldn't load the dashboard data. Please try again later.</p>
          <Button onClick={fetchDashboardData} variant="outline">
            <Loader2 className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Referral Program</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track your referral program performance
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border rounded-xl shadow-sm overflow-hidden">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-lg font-semibold">Recent Completed Referrals</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Referee</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.recentReferrals.length > 0 ? (
                      dashboardData.recentReferrals.map((referral, index) => (
                        <TableRow key={referral._id + index} className="hover:bg-gray-50">
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{referral.name}</TableCell>
                          <TableCell>{referral.referee?.name || "Unknown"}</TableCell>
                          <TableCell className="text-right">{formatNaira(referral.amount)}</TableCell>
                          <TableCell>{format(new Date(referral.date), "MMM d, yyyy")}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No recent referrals found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border rounded-xl shadow-sm">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-lg font-semibold">Program Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="min-payout" className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Payout Amount
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      ₦
                    </span>
                    <Input
                      id="min-payout"
                      type="number"
                      value={minPayoutAmount}
                      onChange={(e) => setMinPayoutAmount(Number(e.target.value))}
                      className="pl-8"
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Current minimum: {formatNaira(minPayoutAmount)}
                  </p>
                </div>

                <div>
                  <label htmlFor="referral-percentage" className="block text-sm font-medium text-gray-700 mb-1">
                    Referral Percentage (First Purchase)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                      %
                    </span>
                    <Input
                      id="referral-percentage"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={referralPercentage}
                      onChange={(e) => setReferralPercentage(Number(e.target.value))}
                      className="pr-8"
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Current percentage: {referralPercentage}%
                  </p>
                </div>

                <Button
                  onClick={async () => {
                    try {
                      const response = await updateReferralSettings({
                        minPayoutAmount,
                        referralPercentage
                      })
                      if (response.success) {
                        toast.success("Program settings updated successfully")
                        fetchDashboardData()
                      } else {
                        toast.error(response.message)
                      }
                    } catch (error) {
                      toast.error("Failed to update settings")
                      console.error(error)
                    }
                  }}
                  className="w-full"
                >
                  Update Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border rounded-xl shadow-sm">
          <CardHeader className="p-4 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full sm:w-auto sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-9 w-full"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    fetchUsers(1, e.target.value)
                  }}
                />
              </div>
              <Button onClick={() => fetchUsers(1, searchTerm)} variant="outline">
                <Loader2 className={usersLoading ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        {Array(5).fill(0).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full rounded-md" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : users.length > 0 ? (
                    users.map((user, index) => (
                      <TableRow key={user._id} className="hover:bg-gray-50">
                        <TableCell>{index + 1 + (usersPage - 1) * 10}</TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {user.referralProgram?.referralCode || "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchUserDetails(user._id)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View details</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between px-2">
          <Button
            variant="outline"
            disabled={usersPage === 1 || usersLoading}
            onClick={() => fetchUsers(usersPage - 1, searchTerm)}
          >
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {usersPage}
          </div>
          <Button
            variant="outline"
            disabled={users.length < 10 || usersLoading}
            onClick={() => fetchUsers(usersPage + 1, searchTerm)}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Referral program performance and details
            </DialogDescription>
          </DialogHeader>
          {selectedUser ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                  <p className="text-sm">{selectedUser.name}</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Referral Code</h3>
                  <p className="text-sm font-mono">{selectedUser.referralProgram?.referralCode || "N/A"}</p>
                </div>
              </div>

              {selectedUser.referralProgram?.completedReferrals?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Completed Referrals</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>Referee</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedUser.referralProgram.completedReferrals.map((referral) => (
                          <TableRow key={referral._id} className="hover:bg-gray-50">
                            <TableCell>{referral.referee?.name || "Unknown"}</TableCell>
                            <TableCell className="text-right">{formatNaira(referral.amount)}</TableCell>
                            <TableCell>{format(new Date(referral.date), "MMM d, yyyy")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}