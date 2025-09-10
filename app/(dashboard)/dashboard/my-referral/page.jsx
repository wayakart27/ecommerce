"use client"

import { useState, useEffect } from "react"
import {
  Gift,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Copy,
  Share2,
  User,
  ShoppingCart,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Banknote,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { toast } from "sonner"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "next-auth/react"
import {
  getReferralData,
  getReferralList,
  getPayoutHistory,
  requestPayout as requestPayoutAction,
} from "@/actions/referral"
import { verifyAccountNumber, updateBankDetailsWithVerification } from "@/actions/account"

const ITEMS_PER_PAGE = 10

// Base URL configuration for API calls
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    return window.location.origin;
  }
  
  // Server-side: use environment variable or default to localhost
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

export default function ReferralBonusPage() {
  const [userData, setUserData] = useState(null)
  const [referrals, setReferrals] = useState([])
  const [payouts, setPayouts] = useState([])
  const [banks] = useState([
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
  ])
  const [formData, setFormData] = useState({
    accountName: "",
    accountNumber: "",
    bankCode: "",
  })
  const [activeTab, setActiveTab] = useState("pending")
  const [currentPage, setCurrentPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [error, setError] = useState(null)

  const { data: session, status } = useSession()
  const userId = session?.user?.id

  const formatNaira = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if session is still loading
      if (status === "loading") {
        return;
      }

      // Check if user is authenticated
      if (!userId) {
        setError("User not authenticated. Please sign in.");
        setLoading(false);
        return;
      }

      const validReferralTypes = ["pending", "completed"]
      const referralType = validReferralTypes.includes(activeTab) ? activeTab : ""

      const [referralData, referralList, payoutHistory] = await Promise.all([
        getReferralData(userId),
        activeTab !== "payouts"
          ? getReferralList({
              userId,
              type: referralType,
              page: currentPage,
              limit: ITEMS_PER_PAGE,
              sort: "-date",
            })
          : { success: true, data: [] },
        activeTab === "payouts"
          ? getPayoutHistory({
              userId,
              page: currentPage,
              limit: ITEMS_PER_PAGE,
              sort: "-requestedAt",
            })
          : { success: true, data: [] },
      ])

      if (!referralData.success) throw new Error(referralData.message)

      setUserData({
        _id: userId,
        referralProgram: referralData.data,
      })

      if (referralData.data?.bankDetails) {
        setFormData({
          accountName: referralData.data.bankDetails.accountName || "",
          accountNumber: referralData.data.bankDetails.accountNumber || "",
          bankCode: referralData.data.bankDetails.bankCode || "",
        })
      }

      if (activeTab === "payouts") {
        if (!payoutHistory.success) throw new Error(payoutHistory.message)
        setPayouts(payoutHistory.data)
        setReferrals([])
      } else {
        if (!referralList.success) throw new Error(referralList.message)
        setReferrals(referralList.data)
        setPayouts([])
      }
    } catch (error) {
      console.error("Fetch error:", error)
      setError(error.message || "Failed to load data. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId && status === "authenticated") {
      fetchData()
    }
  }, [userId, currentPage, activeTab, status])

  const handleTabChange = (tab) => {
    const validTabs = ["pending", "completed", "payouts"]
    if (!validTabs.includes(tab)) return

    setActiveTab(tab)
    setCurrentPage(1)
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handleRetry = () => {
    fetchData()
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleBankSelect = (value) => {
    setFormData((prev) => ({
      ...prev,
      bankCode: value,
    }))
  }

  const handleVerifyAccount = async () => {
    if (!formData.accountNumber || !formData.bankCode) {
      toast.error("Please enter account number and select bank")
      return
    }

    try {
      setVerificationLoading(true)
      const response = await verifyAccountNumber(formData.accountNumber, formData.bankCode)

      if (response.success) {
        toast.success("Account verified successfully")
        setFormData((prev) => ({
          ...prev,
          accountName: response.data.accountName,
        }))
      } else {
        toast.error(response.message || "Account verification failed")
      }
    } catch (error) {
      toast.error("Failed to verify account. Please try again.")
      console.error(error)
    } finally {
      setVerificationLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      const response = await updateBankDetailsWithVerification(userId, formData)

      if (response.success) {
        toast.success("Bank details updated successfully")
        setIsDialogOpen(false)
        setUserData((prev) => ({
          ...prev,
          referralProgram: {
            ...prev.referralProgram,
            bankDetails: {
              accountName: formData.accountName,
              accountNumber: formData.accountNumber,
              bankCode: formData.bankCode,
            },
          },
        }))
      } else {
        toast.error(response.message || "Failed to update bank details")
      }
    } catch (error) {
      toast.error("Failed to update bank details. Please try again.")
      console.error(error)
    } finally {
      setActionLoading(false)
    }
  }

  const requestPayout = async () => {
    try {
      setActionLoading(true)
      const response = await requestPayoutAction(userId)

      if (response.success) {
        toast.success("Payout request submitted successfully")

        setUserData((prev) => ({
          ...prev,
          referralProgram: {
            ...prev.referralProgram,
            referralEarnings: 0,
            payoutHistory: [response.data, ...(prev.referralProgram.payoutHistory || [])],
          },
        }))

        await fetchData()
      } else {
        toast.error(response.message || "Failed to request payout")
      }
    } catch (error) {
      toast.error("Failed to request payout. Please try again.")
      console.error(error)
    } finally {
      setActionLoading(false)
    }
  }

  const copyReferralCode = () => {
    if (!userData) return
    navigator.clipboard.writeText(userData.referralProgram.referralCode)
    toast.success("Referral code copied to clipboard!")
  }

  const copyReferralLink = () => {
    if (!userData) return
    navigator.clipboard.writeText(userData.referralProgram.referralLink)
    toast.success("Referral link copied to clipboard!")
  }

  const shareReferralLink = () => {
    if (!userData) return
    if (navigator.share) {
      navigator
        .share({
          title: "Join me on this awesome platform!",
          text: "Sign up using my referral link to get a bonus",
          url: userData.referralProgram.referralLink,
        })
        .catch(() => {
          toast.info("Sharing was cancelled")
        })
    } else {
      copyReferralLink()
    }
  }

  // Show loading state while checking authentication
  if (status === "loading") {
    return <LoadingSkeleton />
  }

  // Show error if not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-sm text-gray-500 mb-6">Please sign in to access the referral program.</p>
        </div>
      </div>
    )
  }

  if (loading && !userData && !error) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Failed to load data</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <AlertCircle className="h-6 w-6 text-gray-600" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">No data available</h2>
          <p className="text-sm text-gray-500 mb-6">We couldn't find any referral data for your account.</p>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  const { referralProgram } = userData
  const payoutEligibility = {
    eligible: (referralProgram?.stats?.pendingEarnings || 0) >= (referralProgram?.stats?.minPayoutAmount || 0),
    currentBalance: referralProgram?.stats?.pendingEarnings || 0,
    required: Math.max(
      0,
      (referralProgram?.stats?.minPayoutAmount || 0) - (referralProgram?.stats?.pendingEarnings || 0),
    ),
    minPayoutAmount: referralProgram?.stats?.minPayoutAmount || 0,
  }

  const processingPaymentsCount =
    referralProgram.payoutHistory?.filter((payment) => payment.status === "processing").length || 0

  const pendingPaymentsCount =
    referralProgram.payoutHistory?.filter(
      (payment) => payment.status === "pending" || payment.paymentStatus === "pending",
    ).length || 0

  const hasPendingOrProcessingPayments = processingPaymentsCount > 0 || pendingPaymentsCount > 0

  const currentItems = activeTab === "payouts" ? payouts : referrals
  const totalItems =
    activeTab === "pending"
      ? referralProgram.pendingReferrals?.length || 0
      : activeTab === "completed"
        ? referralProgram.completedReferrals?.length || 0
        : referralProgram.payoutHistory?.length || 0
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Gift className="h-6 w-6 mr-2 text-primary" />
          <h1 className="text-2xl font-bold">Referral Program</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="font-mono">
            {referralProgram.referralCode}
          </Badge>
          <Button size="icon" variant="outline" onClick={copyReferralCode}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-primary/10 p-4 rounded-lg mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Your Referral Link</h3>
            <p className="text-sm text-muted-foreground break-all">{referralProgram.referralLink}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={copyReferralLink}>
              <Copy className="h-4 w-4 mr-2" /> Copy
            </Button>
            <Button variant="default" size="sm" onClick={shareReferralLink}>
              <Share2 className="h-4 w-4 mr-2" /> Share
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="border rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Clock className="h-5 w-5 mr-2 text-yellow-500" />
            <h3 className="font-medium">Pending Referrals</h3>
            {processingPaymentsCount > 0 && (
              <Badge variant="outline" className="ml-2">
                {processingPaymentsCount} processing
              </Badge>
            )}
          </div>
          <p className="text-2xl font-bold">{referralProgram.pendingReferrals?.length || 0}</p>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center mb-2">
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
            <h3 className="font-medium">Completed Referrals</h3>
          </div>
          <p className="text-2xl font-bold">{referralProgram.completedReferrals?.length || 0}</p>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Banknote className="h-5 w-5 mr-2 text-blue-500" />
            <h3 className="font-medium">Total Earnings</h3>
          </div>
          <p className="text-2xl font-bold">{formatNaira(referralProgram.stats?.totalEarned || 0)}</p>
        </div>
      </div>

      <div className="border rounded-lg p-4 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium mb-1">Available Balance</h3>
            <p className="text-xl font-bold">{formatNaira(referralProgram.stats?.pendingEarnings || 0)}</p>
            <p className="text-sm text-gray-600 mt-1">
              Minimum payout amount: {formatNaira(referralProgram.stats?.minPayoutAmount || 0)}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                  <Banknote className="h-4 w-4 mr-2" /> Bank Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Update Bank Details</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Account Number</label>
                    <div className="flex gap-2">
                      <Input
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        required
                        disabled={actionLoading}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleVerifyAccount}
                        disabled={!formData.accountNumber || !formData.bankCode || verificationLoading}
                        variant="outline"
                      >
                        {verificationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Bank</label>
                    <Select
                      onValueChange={handleBankSelect}
                      value={formData.bankCode}
                      required
                      disabled={actionLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map((bank) => (
                          <SelectItem key={bank.code} value={bank.code}>
                            {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Account Name</label>
                    <Input
                      name="accountName"
                      value={formData.accountName}
                      onChange={handleInputChange}
                      required
                      disabled={actionLoading || verificationLoading}
                      readOnly={!!formData.accountName}
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={actionLoading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={actionLoading || !formData.accountName}>
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {payoutEligibility.eligible ? (
              hasPendingOrProcessingPayments ? (
                <div className="text-sm text-amber-600 flex items-center justify-center sm:justify-start bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <Clock className="h-4 w-4 mr-2" />
                  <p>
                    You have {processingPaymentsCount > 0 && `${processingPaymentsCount} processing`}
                    {processingPaymentsCount > 0 && pendingPaymentsCount > 0 && " and "}
                    {pendingPaymentsCount > 0 && `${pendingPaymentsCount} pending`} payment(s). Please wait for approval
                    before requesting another payout.
                  </p>
                </div>
              ) : (
                <Button
                  onClick={requestPayout}
                  disabled={!referralProgram.bankDetails?.accountNumber || actionLoading}
                  className="w-full sm:w-auto"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Request Payout
                    </>
                  )}
                </Button>
              )
            ) : (
              <div className="text-sm text-gray-600 flex items-center justify-center sm:justify-start">
                <p>Need {formatNaira(payoutEligibility.required)} more to payout</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            <Clock className="h-4 w-4 mr-2" /> Pending
          </TabsTrigger>
          <TabsTrigger value="completed">
            <CheckCircle2 className="h-4 w-4 mr-2" /> Completed
          </TabsTrigger>
          <TabsTrigger value="payouts">
            <CreditCard className="h-4 w-4 mr-2" /> Payouts
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="border rounded-lg p-4 overflow-x-auto">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded-full mr-3" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {activeTab === "pending" && (
              <div className="space-y-4">
                {referrals.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">S/N</th>
                          <th className="text-left py-2">User</th>
                          <th className="text-left py-2">Date</th>
                          <th className="text-right py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.map((referral, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-3">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                            <td className="py-3">
                              <div className="flex items-center">
                                <div className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                                  <User className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {referral.referee?.name || `User ${referral.referee?._id?.slice(-6)}`}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">{format(new Date(referral.date), "MMM d, yyyy")}</td>
                            <td className="py-3 text-right">
                              <Badge variant="secondary">Pending Purchase</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No pending referrals found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "completed" && (
              <div className="space-y-4">
                {referrals.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">S/N</th>
                          <th className="text-left py-2">User</th>
                          <th className="text-left py-2">Amount</th>
                          <th className="text-left py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.map((referral, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-3">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                            <td className="py-3">
                              <div className="flex items-center">
                                <div className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                                  <ShoppingCart className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {referral.referee?.name || `User ${referral.referee?._id?.slice(-6)}`}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">{formatNaira(referral.amount)}</td>
                            <td className="py-3">{format(new Date(referral.date), "MMM d, yyyy")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No completed referrals found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "payouts" && (
              <div className="space-y-4">
                {payouts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">S/N</th>
                          <th className="text-left py-2">Amount</th>
                          <th className="text-left py-2">Bank Details</th>
                          <th className="text-left py-2">Date</th>
                          <th className="text-right py-2">Approval Status</th>
                          <th className="text-right py-2">Payment Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payouts.map((payout, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-3">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                            <td className="py-3 font-medium">{formatNaira(payout.amount)}</td>
                            <td className="py-3">
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
                            </td>
                            <td className="py-3">
                              <div className="flex flex-col">
                                <span>{format(new Date(payout.requestedAt), "MMM d, yyyy")}</span>
                                {payout.processedAt && (
                                  <span className="text-sm text-gray-500">
                                    {format(new Date(payout.processedAt), "MMM d, yyyy")}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <Badge
                                variant={
                                  payout.status === "completed"
                                    ? "default"
                                    : payout.status === "failed"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {payout.status}
                              </Badge>
                            </td>
                            <td className="py-3 text-right">
                              <Badge
                                variant={
                                  payout.paymentStatus === "success"
                                    ? "default"
                                    : payout.paymentStatus === "processing"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {payout.paymentStatus || "pending"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No payout history found</p>
                  </div>
                )}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1 || loading}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      return (
                        <PaginationItem key={i}>
                          <Button
                            variant={currentPage === pageNum ? "default" : "ghost"}
                            onClick={() => handlePageChange(pageNum)}
                            disabled={loading}
                          >
                            {pageNum}
                          </Button>
                        </PaginationItem>
                      )
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage === totalPages || loading}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Skeleton className="h-6 w-6 mr-2" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      <div className="bg-primary/10 p-4 rounded-lg mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full md:w-96" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Skeleton className="h-5 w-5 mr-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>

      <div className="border rounded-lg p-4 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="border rounded-lg p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center">
              <Skeleton className="h-10 w-10 rounded-full mr-3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}