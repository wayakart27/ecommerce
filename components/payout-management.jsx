"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Send, RefreshCw, Eye, AlertCircle, CheckCircle, Clock, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getPayoutRequests,
  initiatePayoutTransfer,
  submitPayoutOTP,
  checkPayoutStatus,
  retryFailedPayout,
  resendPayoutOTP,
} from "@/actions/payout"


const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  otp: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
}

const paymentStatusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

export function PayoutManagement() {
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all")
  const [selectedPayout, setSelectedPayout] = useState(null)
  const [otpDialogOpen, setOtpDialogOpen] = useState(false)
  const [otp, setOtp] = useState("")
  const [actionLoading, setActionLoading] = useState(null)
  const { toast } = useToast()

  const fetchPayouts = async () => {
    try {
      setLoading(true)
      const result = await getPayoutRequests({
        page,
        limit: 10,
        search,
        status: statusFilter,
        paymentStatus: paymentStatusFilter,
      })

      console.log(result.data)

      if (result.success) {
        setPayouts(result.data.payouts)
        setTotalPages(result.data.totalPages)
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch payout requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayouts()
  }, [page, search, statusFilter, paymentStatusFilter])

  const handleInitiateTransfer = async (payout) => {
    try {
      setActionLoading(`initiate-${payout.payout._id}`)
      const result = await initiatePayoutTransfer(payout._id, payout.payout._id)

      if (result.success) {
        if (result.data?.requiresOtp) {
          setSelectedPayout(payout)
          setOtpDialogOpen(true)
          toast({
            title: "OTP Required",
            description: "Please enter the OTP sent to complete the transfer",
          })
        } else {
          toast({
            title: "Success",
            description: result.message,
          })
        }
        fetchPayouts()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate transfer",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleSubmitOTP = async () => {
    if (!selectedPayout || !otp.trim()) return

    try {
      setActionLoading("submit-otp")
      const result = await submitPayoutOTP(selectedPayout._id, selectedPayout.payout._id, otp)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setOtpDialogOpen(false)
        setOtp("")
        setSelectedPayout(null)
        fetchPayouts()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit OTP",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCheckStatus = async (payout) => {
    try {
      setActionLoading(`status-${payout.payout._id}`)
      const result = await checkPayoutStatus(payout._id, payout.payout._id)

      if (result.success) {
        toast({
          title: "Status Updated",
          description: result.message,
        })
        fetchPayouts()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check status",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRetryPayout = async (payout) => {
    try {
      setActionLoading(`retry-${payout.payout._id}`)
      const result = await retryFailedPayout(payout.payout._id)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        fetchPayouts()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to retry payout",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleResendOTP = async (payout) => {
    try {
      setActionLoading(`resend-${payout.payout._id}`)
      const result = await resendPayoutOTP(payout._id, payout.payout._id)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend OTP",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "processing":
      case "otp":
        return <Clock className="h-4 w-4" />
      case "failed":
        return <X className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Name, email, account..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="otp">OTP Required</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment-status">Payment Status</Label>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All payment statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payment statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchPayouts} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payouts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : payouts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No payout requests found</p>
            </CardContent>
          </Card>
        ) : (
          payouts.map((payout) => (
            <Card key={payout.payout._id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{payout.name}</h3>
                      <Badge className={statusColors[payout.payout.status]}>
                        {getStatusIcon(payout.payout.status)}
                        <span className="ml-1">{payout.payout.status}</span>
                      </Badge>
                      <Badge
                        className={paymentStatusColors[payout.payout.paymentStatus]}
                      >
                        {payout.payout.paymentStatus}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{payout.email}</p>
                    <div className="text-sm text-muted-foreground">
                      <p>
                        {payout.bankDetails.accountName} - {payout.bankDetails.accountNumber}
                      </p>
                      <p>{payout.bankDetails.bankName}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium text-lg">{formatCurrency(payout.payout.amount)}</span>
                      <span className="text-muted-foreground">Requested: {formatDate(payout.payout.requestedAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {payout.payout.status === "pending" && (
                      <Button
                        onClick={() => handleInitiateTransfer(payout)}
                        disabled={actionLoading === `initiate-${payout.payout._id}`}
                        size="sm"
                      >
                        {actionLoading === `initiate-${payout.payout._id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Initiate Transfer
                      </Button>
                    )}

                    {payout.payout.status === "otp" && (
                      <>
                        <Button
                          onClick={() => {
                            setSelectedPayout(payout)
                            setOtpDialogOpen(true)
                          }}
                          size="sm"
                        >
                          Enter OTP
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleResendOTP(payout)}
                          disabled={actionLoading === `resend-${payout.payout._id}`}
                          size="sm"
                        >
                          {actionLoading === `resend-${payout.payout._id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Resend OTP
                        </Button>
                      </>
                    )}

                    {payout.payout.status === "failed" && (
                      <Button
                        variant="outline"
                        onClick={() => handleRetryPayout(payout)}
                        disabled={actionLoading === `retry-${payout.payout._id}`}
                        size="sm"
                      >
                        {actionLoading === `retry-${payout.payout._id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Retry
                      </Button>
                    )}

                    {(payout.payout.status === "processing" || payout.payout.paystackReference) && (
                      <Button
                        variant="outline"
                        onClick={() => handleCheckStatus(payout)}
                        disabled={actionLoading === `status-${payout.payout._id}`}
                        size="sm"
                      >
                        {actionLoading === `status-${payout.payout._id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Eye className="h-4 w-4 mr-2" />
                        )}
                        Check Status
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
            Next
          </Button>
        </div>
      )}

      {/* OTP Dialog */}
      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter OTP</DialogTitle>
            <DialogDescription>
              Please enter the OTP sent to complete the transfer for {selectedPayout?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="otp">OTP Code</Label>
              <Input
                id="otp"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
              />
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The OTP has been sent to your registered phone number. Please check your messages.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button
                onClick={handleSubmitOTP}
                disabled={!otp.trim() || actionLoading === "submit-otp"}
                className="flex-1"
              >
                {actionLoading === "submit-otp" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit OTP
              </Button>
              <Button
                variant="outline"
                onClick={() => selectedPayout && handleResendOTP(selectedPayout)}
                disabled={actionLoading === `resend-${selectedPayout?.payout._id}`}
              >
                {actionLoading === `resend-${selectedPayout?.payout._id}` ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Resend
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
