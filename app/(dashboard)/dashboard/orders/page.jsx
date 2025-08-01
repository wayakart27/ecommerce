"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarIcon,
  Eye,
  MoreHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  Loader2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import {
  getAllOrders,
  updateOrderStatusWithTracking,
  verifyPaystackPayment,
} from "@/actions/order";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton component

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // States for verification dialog
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [transactionIdInput, setTransactionIdInput] = useState("");
  const [verifying, setVerifying] = useState(false);

  const itemsPerPage = 8;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    const page = searchParams.get("page") || 1;
    setCurrentPage(Number(page));
  }, [searchParams]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const result = await getAllOrders({
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearchTerm,
          status: statusFilter,
          date: date ? formatDateForAPI(date) : "",
        });

        if (result.success) {
          setOrders(result.data);
          setTotalPages(result.pages);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentPage, debouncedSearchTerm, statusFilter, date]);

 const formatDateForAPI = (date) => {
  if (!date) return "";
  // Ensure we're working with UTC date
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  return utcDate.toISOString().split('T')[0];
};

 const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: 'UTC'
  });
};

  const handleUpdateStatus = async (id, newStatus, email) => {
    try {
      setActionInProgress(id);

      const result = await updateOrderStatusWithTracking(id, newStatus, email);

      if (result.success) {
        setOrders(
          orders.map((order) =>
            order._id === id
              ? {
                  ...order,
                  status: newStatus,
                  ...(newStatus === "processing" && {
                    isPaid: true,
                    paidAt: new Date(),
                  }),
                  ...(newStatus === "delivered" && {
                    isDelivered: true,
                    deliveredAt: new Date(),
                  }),
                  ...(newStatus === "cancelled" && {
                    isCancelled: true,
                    cancelledAt: new Date(),
                  }),
                }
              : order
          )
        );
        toast.success(`Order status updated to ${newStatus}`);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("Failed to update order status");
    } finally {
      setActionInProgress(null);
    }
  };

  // Open verification dialog
  const openVerificationDialog = (order) => {
    setCurrentOrder(order);
    setTransactionIdInput(order.transactionId || "");
    setVerifyDialogOpen(true);
  };

  // Close verification dialog
  const closeVerificationDialog = () => {
    setVerifyDialogOpen(false);
    setCurrentOrder(null);
    setTransactionIdInput("");
    setVerifying(false);
  };

  // Verify payment function
  const handleVerifyPayment = async () => {
    if (!currentOrder || !transactionIdInput) {
      toast.error("Please enter a valid transaction ID");
      return;
    }

    try {
      setVerifying(true);

      const result = await verifyPaystackPayment(
        currentOrder._id,
        transactionIdInput
      );

      if (result.success) {
        // Refetch orders to get updated data
        const refetchResult = await getAllOrders({
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearchTerm,
          status: statusFilter,
          date: date ? formatDateForAPI(date) : "",
        });

        if (refetchResult.success) {
          setOrders(refetchResult.data);
        }

        toast.success("Payment verified successfully", {
          description: result.message || "Order status updated to Processing",
        });
        closeVerificationDialog();
      } else {
        toast.error("Payment verification failed", {
          description:
            result.error || result.message || "Could not verify transaction",
        });
      }
    } catch (error) {
      toast.error("Payment verification error", {
        description: error.message || "Failed to verify transaction",
      });
    } finally {
      setVerifying(false);
    }
  };

  // Status options
  const getAvailableStatusOptions = (currentStatus) => {
    switch (currentStatus) {
      case "pending":
        return []; // No status options for pending orders
      case "processing":
        return [
          { value: "shipped", label: "Mark as Shipped" },
          { value: "cancelled", label: "Cancel Order", destructive: true },
        ];
      case "shipped":
        return [
          { value: "delivered", label: "Mark as Delivered" },
          { value: "cancelled", label: "Cancel Order", destructive: true },
        ];
      case "delivered":
        return [
          { value: "refunded", label: "Process Refund", destructive: true },
        ];
      case "cancelled":
        return [
          {
            value: "processing",
            label: "Mark as Processing",
            destructive: true,
          },
        ];
      default:
        return [];
    }
  };

  const handlePageChange = (page) => {
    router.push(`/dashboard/orders?page=${page}`);
  };

  const handleResetFilters = () => {
    setDate(undefined);
    setStatusFilter("all");
    setSearchTerm("");
    setCurrentPage(1);
    toast.success("All filters have been reset");
  };

  const handleClearDate = () => {
    setDate(null);
  };

  // Calculate column span based on whether we're showing tracking info
  const columnSpan = statusFilter === "pending" ? 8 : 9;

  // Skeleton rows for loading state
  const renderSkeletonRows = () => {
    return Array.from({ length: 5 }).map((_, rowIndex) => (
      <TableRow key={`skeleton-${rowIndex}`}>
        <TableCell>
          <Skeleton className="h-4 w-4" />
        </TableCell>
        {statusFilter !== "pending" && (
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
        )}
        <TableCell>
          <Skeleton className="h-4 w-32" />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16 mt-1 md:hidden" />
            </div>
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-6 w-20 rounded-full" />
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <Skeleton className="h-4 w-12" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-16 ml-auto" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-8 rounded-md" />
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Verification Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
            <DialogDescription>
              Verify payment for order #{currentOrder?.orderId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="transactionId">
                Transaction ID (Paystack Reference)
              </Label>
              <Input
                id="transactionId"
                value={transactionIdInput}
                onChange={(e) => setTransactionIdInput(e.target.value)}
                placeholder="Enter Paystack reference ID"
                disabled={verifying}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the Paystack transaction reference ID to verify payment
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={closeVerificationDialog}
                disabled={verifying}
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerifyPayment}
                disabled={!transactionIdInput || verifying}
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Payment"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
          <CardDescription>
            View and manage all customer orders. Search by Order ID, Tracking
            ID, or customer details.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search orders (ID, Tracking, Name, Email)..."
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
          })}
          <X
            className="ml-2 h-4 w-4 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleClearDate();
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
          const utcDate = new Date(Date.UTC(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate()
          ));
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
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>

              {(date || statusFilter !== "all" || searchTerm) && (
                <Button variant="ghost" onClick={handleResetFilters}>
                  Reset All
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S/N</TableHead>
                  {statusFilter !== "pending" && (
                    <TableHead>Tracking ID</TableHead>
                  )}
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Items</TableHead>
                  <TableHead className="text-right">Payment Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  renderSkeletonRows()
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columnSpan}
                      className="h-24 text-center"
                    >
                      No orders found. Try adjusting your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order, key) => (
                    <TableRow
                      key={order._id}
                      className={
                        actionInProgress === order._id ? "opacity-60" : ""
                      }
                    >
                      <TableCell className="font-mono text-sm">
                        {key + 1}.
                      </TableCell>
                      {statusFilter !== "pending" && (
                        <TableCell className="font-mono text-sm">
                          {order.trackingId || "N/A"}
                        </TableCell>
                      )}
                      <TableCell className="font-mono text-sm">
                        {order.transactionId || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={order.customer?.image}
                              alt={order.customer?.name}
                            />
                            <AvatarFallback>
                              {order.customer?.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div>{order.customer?.name || "Customer"}</div>
                            <div className="text-xs text-muted-foreground md:hidden">
                              {formatDisplayDate(order.date)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDisplayDate(order.date)}
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
                      <TableCell className="hidden md:table-cell">
                        {order.items || 0} item(s)
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={order.isPaid ? "default" : "destructive"}
                        >
                          {order.isPaid ? "Paid" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {order.formattedTotal}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={
                                actionInProgress === order._id || verifying
                              }
                            >
                              {actionInProgress === order._id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/orders/${order._id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </Link>
                            </DropdownMenuItem>

                            {/* Verify Payment option for pending orders */}
                            {(order.status === "pending" || order.status === "processing") &&
                              (!order.isPaid && (
                                <DropdownMenuItem
                                  onClick={() => openVerificationDialog(order)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                  Verify Payment
                                </DropdownMenuItem>
                              ))}

                            {/* Status update options */}
                            {order.isPaid &&
                              getAvailableStatusOptions(order.status).length >
                                0 && (
                                <>
                                  <DropdownMenuLabel>
                                    Update Status
                                  </DropdownMenuLabel>
                                  {getAvailableStatusOptions(order.status).map(
                                    (option) => (
                                      <DropdownMenuItem
                                        key={option.value}
                                        onClick={() =>
                                          handleUpdateStatus(
                                            order?._id,
                                            option?.value,
                                            order?.shippingAddress.email
                                          )
                                        }
                                        disabled={actionInProgress !== null}
                                        className={
                                          option.destructive
                                            ? "text-destructive focus:text-destructive"
                                            : ""
                                        }
                                      >
                                        {option.label}
                                      </DropdownMenuItem>
                                    )
                                  )}
                                </>
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
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
