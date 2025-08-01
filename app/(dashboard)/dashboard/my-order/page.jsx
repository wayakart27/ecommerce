// app/account/orders/page.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CalendarIcon,
  Eye,
  MoreHorizontal,
  Search,
  CheckCircle,
  CreditCard,
  Loader2,
  Check,
  X,
  Clock,
  XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { PaginationControls } from "@/components/pagination-controls";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getOrdersByUserId,
  markOrderAsReceived,
  verifyPaystackPayment,
} from "@/actions/order";
import { Skeleton } from "@/components/ui/skeleton";

function formatNaira(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
}

export default function CustomerOrdersPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  // Payment verification states
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [referenceNumber, setReferenceNumber] = useState("");

  const itemsPerPage = 8;

  const fetchOrders = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const result = await getOrdersByUserId(userId);

      if (result.success) {
        setOrders(result.data);
      } else {
        setError(result.message);
        toast.error("Failed to load orders", {
          description: result.message,
        });
      }
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load orders", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase()?.includes(searchTerm.toLowerCase());

    const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
    const matchesDate = date ? orderDate === formatDate(date) : true;

    const matchesStatus =
      statusFilter === "all" ||
      order.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesDate && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentItems = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  function formatDate(date) {
    if (!date) return "";
    const utcDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    return utcDate.toISOString().split("T")[0];
  }

  // Update formatDisplayDate to handle UTC
  function formatDisplayDate(dateStr) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }

  const handleMarkAsReceived = async () => {
    if (!currentOrderId) return;

    setIsDialogOpen(false);
    const result = await markOrderAsReceived(currentOrderId);

    if (result.success) {
      toast.success("Order marked as received");
      fetchOrders();
    } else {
      toast.error(result.message || "Failed to mark order as received");
    }
  };

  const handleVerifyPayment = async () => {
    if (!currentOrderId) return;

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const order = orders.find((o) => o._id === currentOrderId);

      if (!order) {
        throw new Error("Order not found");
      }

      // Use user-entered reference number or fall back to transactionId
      const referenceToUse = referenceNumber || order.transactionId;

      if (!referenceToUse) {
        throw new Error(
          "Please enter a reference number or the order has no transaction ID"
        );
      }

      const result = await verifyPaystackPayment(order._id, referenceToUse);

      if (result.success) {
        toast.success("Payment verified successfully!");
        fetchOrders();
        setIsVerifyDialogOpen(false);
        setReferenceNumber(""); // Reset reference number input
      } else {
        setVerificationError(
          result.error || result.message || "Verification failed"
        );
        toast.error("Payment verification failed", {
          description:
            result.error || result.message || "Please try again later",
        });
      }
    } catch (err) {
      setVerificationError(err.message || "An error occurred");
      toast.error("Verification error", {
        description: err.message || "Please try again later",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>View and track your order history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search orders..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      <div className="flex items-center">
                        {date.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        })}
                        <X
                          className="ml-2 h-4 w-4 text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDate(null);
                          }}
                        />
                      </div>
                    ) : (
                      "Filter by date"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      if (selectedDate) {
                        // Create a new date at midnight UTC to avoid timezone issues
                        const utcDate = new Date(
                          Date.UTC(
                            selectedDate.getFullYear(),
                            selectedDate.getMonth(),
                            selectedDate.getDate()
                          )
                        );
                        setDate(utcDate);
                      } else {
                        setDate(null);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {(date || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDate(null); // Changed from undefined to null
                    setStatusFilter("all");
                    toast.info("Filters cleared");
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S/N</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Tracking ID</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Payment
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Received
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-6" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="h-24 text-center text-destructive"
                    >
                      Error: {error}
                    </TableCell>
                  </TableRow>
                ) : currentItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      {filteredOrders.length === 0
                        ? "No orders found"
                        : "No orders match your filters"}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((order, key) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">{key + 1}.</TableCell>
                      <TableCell className="font-medium">
                        {order.orderId}
                      </TableCell>
                      <TableCell className="font-medium">
                        {order.trackingId || "N/A"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.status === "delivered"
                              ? "default"
                              : order.status === "processing"
                              ? "outline"
                              : order.status === "shipped"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant={order.isPaid ? "default" : "destructive"}
                        >
                          {order.isPaid ? "Paid" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center">
                          {order.isOrderReceived ? (
                            <>
                              <Check className="h-4 w-4 text-green-500 mr-1" />
                              <span>Yes</span>
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 text-red-500 mr-1" />
                              <span>No</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {order.orderItems.length}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNaira(order.totalPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/my-order/${order._id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </Link>
                            </DropdownMenuItem>

                            {!order.isPaid && order.status === "pending" && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentOrderId(order._id);
                                  setIsVerifyDialogOpen(true);
                                }}
                              >
                                <CreditCard className="mr-2 h-4 w-4" /> Verify
                                Payment
                              </DropdownMenuItem>
                            )}

                            {!order.isOrderReceived &&
                              order.status === "delivered" && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentOrderId(order._id);
                                    setIsDialogOpen(true);
                                  }}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />{" "}
                                  Confirm Receipt
                                </DropdownMenuItem>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Order Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Order Receipt</DialogTitle>
            <DialogDescription>
              Are you sure you've received this order? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              By confirming, you acknowledge that you've received the order in
              good condition.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleMarkAsReceived}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Verification Dialog */}
      <Dialog
        open={isVerifyDialogOpen}
        onOpenChange={(open) => {
          setIsVerifyDialogOpen(open);
          if (!open) {
            setReferenceNumber("");
            setVerificationError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
            <DialogDescription>
              Enter your payment reference number to verify your transaction
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Payment reference number"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                {orders.find((o) => o._id === currentOrderId)?.transactionId ? (
                  <>
                    Default reference:{" "}
                    {orders.find((o) => o._id === currentOrderId).transactionId}
                  </>
                ) : (
                  "Please enter your payment reference number"
                )}
              </p>
            </div>

            {verificationError && (
              <div className="mt-4 p-3 bg-red-50 rounded-md">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">Verification Issue</span>
                </div>
                <p className="text-sm text-red-500 mt-1 pl-6">
                  {verificationError}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsVerifyDialogOpen(false);
                setReferenceNumber("");
              }}
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleVerifyPayment}
              disabled={
                isVerifying ||
                (!referenceNumber &&
                  !orders.find((o) => o._id === currentOrderId)?.transactionId)
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Verify Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
