"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle, CheckCircle2, Clock, Search, X, CheckCircle, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { getPayoutRequests, markManualTransferComplete } from "@/actions/payout"

const formatNaira = (amount) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount)
}

const banks = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "Globus Bank", code: "00103" },
  { name: "Guaranty Trust Bank (GTB)", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda Bank", code: "50211" },
  { name: "Opay", code: "999992" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "Suntrust Bank", code: "100" },
  { name: "Titan Trust Bank", code: "102" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
  { name: "Jaiz Bank", code: "301" },
  { name: "Moniepoint MFB", code: "50515" },
  { name: "PalmPay", code: "999991" },
  { name: "Rubies Bank", code: "125" },
  { name: "Sparkle Microfinance Bank", code: "51310" },
  { name: "VFD Microfinance Bank", code: "566" },
]

// Helper function to display user-friendly status
const getStatusDisplay = (status) => {
  const statusMap = {
    'pending': 'Pending',
    'processing': 'Processing',
    'completed': 'Completed',
    'failed': 'Failed',
    'cancelled': 'Cancelled',
    'success': 'Success'
  };
  return statusMap[status] || status;
}

// Simple Date Picker Component
const SimpleDatePicker = ({ value, onChange, placeholder }) => {
  return (
    <div className="relative">
      <Input
        type="date"
        value={value ? value.toISOString().split('T')[0] : ''}
        onChange={(e) => {
          if (e.target.value) {
            onChange(new Date(e.target.value))
          } else {
            onChange(null)
          }
        }}
        placeholder={placeholder}
        className="pr-8 w-full"
      />
      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  )
}

export default function PayoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedPayout, setSelectedPayout] = useState(null)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [processingTransfer, setProcessingTransfer] = useState(null)
  const [referenceNumber, setReferenceNumber] = useState("")
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [totalAmount, setTotalAmount] = useState(0)

  const fetchPayouts = useCallback(async (status = "", search = "", startDate = null, endDate = null) => {
    try {
      setLoading(true)
      
      const filters = {
        status: status,
        search: search.trim()
      }

      // Add date range filter if provided
      if (startDate && endDate) {
        filters.startDate = startDate.toISOString()
        filters.endDate = endDate.toISOString()
      }

      const response = await getPayoutRequests(filters)
      
      if (response.success) {
        setPayouts(response.data.payouts)
        // Calculate total amount
        const total = response.data.payouts.reduce((sum, payout) => sum + payout.payout.amount, 0)
        setTotalAmount(total)
      } else {
        toast.error(response.message)
      }
    } catch (error) {
      toast.error("Failed to load payouts")
      console.error(error)
    } finally {
      setLoading(false)
      setSearchLoading(false)
      if (isInitialLoad) setIsInitialLoad(false)
    }
  }, [isInitialLoad])

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role !== "Admin") {
        router.push("/")
      } else {
        fetchPayouts()
      }
    }
  }, [session, status, router, fetchPayouts])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() !== '' || statusFilter !== '' || startDate || endDate) {
        setSearchLoading(true)
        fetchPayouts(statusFilter, searchQuery.trim(), startDate, endDate)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, statusFilter, startDate, endDate, fetchPayouts])

  const handleManualTransferComplete = useCallback(async (payout) => {
    if (!referenceNumber.trim()) {
      toast.error("Please enter a Paystack reference number")
      return
    }

    try {
      setProcessingTransfer(payout.payout._id)
      const response = await markManualTransferComplete(
        payout._id,
        payout.payout._id,
        referenceNumber.trim()
      )
      
      if (response.success) {
        toast.success(response.message)
        setReferenceNumber("")
        setIsConfirmDialogOpen(false)
        await fetchPayouts(statusFilter, searchQuery, startDate, endDate)
      } else {
        toast.error(response.message)
      }
    } catch (error) {
      toast.error("Failed to mark transfer as complete")
      console.error(error)
    } finally {
      setProcessingTransfer(null)
    }
  }, [fetchPayouts, statusFilter, searchQuery, referenceNumber, startDate, endDate])

  const handleSearch = useCallback(() => {
    setSearchLoading(true)
    fetchPayouts(statusFilter, searchQuery.trim(), startDate, endDate)
  }, [fetchPayouts, statusFilter, searchQuery, startDate, endDate])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setStartDate(null)
    setEndDate(null)
    fetchPayouts(statusFilter, '', null, null)
  }

  const clearDateFilter = () => {
    setStartDate(null)
    setEndDate(null)
    fetchPayouts(statusFilter, searchQuery, null, null)
  }

  const openManualTransferDialog = (payout) => {
    setSelectedPayout(payout)
    setReferenceNumber("")
    setIsConfirmDialogOpen(true)
  }

  if (isInitialLoad) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Payout Management</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payouts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-8 w-full"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="h-8 w-8 absolute right-1 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button onClick={handleSearch} disabled={loading || searchLoading} className="w-full sm:w-auto">
            {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </div>
      </div>

      {/* Total Amount Display */}
      <div className="bg-primary/10 p-4 rounded-lg mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-medium">Total Amount:</div>
          <div className="text-2xl font-bold text-primary">{formatNaira(totalAmount)}</div>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Showing {payouts.length} payout{payouts.length !== 1 ? 's' : ''}
          {(statusFilter || searchQuery || startDate || endDate) && ' (filtered)'}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === "" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("")
              fetchPayouts("", searchQuery, startDate, endDate)
            }}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("pending")
              fetchPayouts("pending", searchQuery, startDate, endDate)
            }}
            size="sm"
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === "processing" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("processing")
              fetchPayouts("processing", searchQuery, startDate, endDate)
            }}
            size="sm"
          >
            Processing
          </Button>
          <Button
            variant={statusFilter === "completed" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("completed")
              fetchPayouts("completed", searchQuery, startDate, endDate)
            }}
            size="sm"
          >
            Completed
          </Button>
          <Button
            variant={statusFilter === "failed" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("failed")
              fetchPayouts("failed", searchQuery, startDate, endDate)
            }}
            size="sm"
          >
            Failed
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 ml-auto">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <SimpleDatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Start Date"
              />
              <SimpleDatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="End Date"
              />
            </div>
            {(startDate || endDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearDateFilter}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => fetchPayouts(statusFilter, searchQuery, startDate, endDate)}
            disabled={loading || searchLoading}
            size="sm"
            className="w-full sm:w-auto"
          >
            {loading || searchLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <span>Refresh</span>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S/N</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Bank Details</TableHead>
                  <TableHead>Payout Status</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Payment Reference No.</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(loading || searchLoading) ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={i}>
                        {Array(9)
                          .fill(0)
                          .map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                      </TableRow>
                    )))
                : payouts.length > 0 ? (
                  payouts.map((payout, index) => (
                    <TableRow key={payout.payout._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{payout.name}</div>
                        <div className="text-sm text-muted-foreground">{payout.email}</div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatNaira(payout.payout.amount)}
                      </TableCell>
                      <TableCell>
                        {payout.bankDetails ? (
                          <div className="text-sm space-y-1">
                            <div className="font-medium">{payout.bankDetails.accountName}</div>
                            <div>{payout.bankDetails.accountNumber}</div>
                            <div className="text-muted-foreground">
                              {banks.find((b) => b.code === payout.bankDetails.bankCode)?.name || "Unknown Bank"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payout.payout.status === "completed"
                              ? "default"
                              : payout.payout.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                          className="flex items-center gap-1"
                        >
                          {payout.payout.status === "completed" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : payout.payout.status === "pending" ? (
                            <Clock className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {getStatusDisplay(payout.payout.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payout.payout.paymentStatus === "success"
                              ? "default"
                              : payout.payout.paymentStatus === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                          className="flex items-center gap-1"
                        >
                          {payout.payout.paymentStatus === "success" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : payout.payout.paymentStatus === "failed" ? (
                            <AlertCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {getStatusDisplay(payout.payout.paymentStatus) || "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(parseISO(payout.payout.requestedAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        {payout.payout.paystackReference ? (
                          <div className="text-xs font-mono">
                            {payout.payout.paystackReference}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {payout.payout.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => openManualTransferDialog(payout)}
                            disabled={processingTransfer === payout.payout._id}
                          >
                            {processingTransfer === payout.payout._id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            Mark as Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No payout records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Manual Transfer Complete</DialogTitle>
            <DialogDescription>
              Please enter the Paystack reference number for the transfer of{" "}
              {selectedPayout && formatNaira(selectedPayout.payout.amount)} to{" "}
              {selectedPayout?.bankDetails?.accountName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm font-medium mb-2">Transfer Details:</div>
              <div className="text-sm">Amount: {selectedPayout && formatNaira(selectedPayout.payout.amount)}</div>
              <div className="text-sm">Recipient: {selectedPayout?.bankDetails?.accountName}</div>
              <div className="text-sm">Account: {selectedPayout?.bankDetails?.accountNumber}</div>
              <div className="text-sm">Bank: {banks.find(b => b.code === selectedPayout?.bankDetails?.bankCode)?.name}</div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="reference" className="text-sm font-medium">
                Paystack Reference Number
              </label>
              <Input
                id="reference"
                placeholder="Enter Paystack reference number"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleManualTransferComplete(selectedPayout)}
              disabled={!referenceNumber.trim() || processingTransfer === selectedPayout?.payout._id}
            >
              {processingTransfer === selectedPayout?.payout._id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Complete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}