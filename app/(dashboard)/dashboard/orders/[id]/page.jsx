"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Truck,
  Clock,
  Cog,
  CheckCircle,
  XCircle,
  List,
  Loader2,
  Smile,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOrderAndShippingById, updateOrderStatusWithTracking } from "@/actions/order";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

export default function OrderDetailsPage() {
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderStatus, setOrderStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const orderId = params?.orderId || params?.id;

  // Format amount as Naira
  function formatNaira(amount) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // Fetch order details
  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const result = await getOrderAndShippingById(orderId);
      if (result.success) {
        setOrder(result.data);
        setOrderStatus(result.data.status);
      } else {
        setError(result.message || "Order not found");
      }
    } catch (err) {
      setError(err.message || "Failed to load order");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Handle status change
  const handleStatusChange = async (status) => {
    if (!order || !order._id) return;
    setIsUpdatingStatus(true);
    try {
      const updateResult = await updateOrderStatusWithTracking(
        order._id,
        status,
        order?.shippingAddress.email
      );
      if (updateResult.success) {
        toast.success("Order status updated", {
          description: `Order #${order.orderId} status changed to ${status}`,
        });
        // Refetch order data to get updated statusTrack
        await fetchOrder();
      } else {
        toast.error("Update failed", {
          description: updateResult.message || "Failed to update order status",
        });
        // Revert to previous status if update fails
        setOrderStatus(order.status);
      }
    } catch (err) {
      toast.error("Update failed", {
        description: err.message || "Failed to update order status",
      });
      setOrderStatus(order.status);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Get status details
  const getStatusDetails = (status) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "pending":
        return {
          icon: <Clock className="h-5 w-5" />,
          color: "bg-yellow-100 text-yellow-800",
          title: "Order Pending",
        };
      case "processing":
        return {
          icon: <Cog className="h-5 w-5" />,
          color: "bg-blue-100 text-blue-800",
          title: "Processing",
        };
      case "shipped":
        return {
          icon: <Truck className="h-5 w-5" />,
          color: "bg-indigo-100 text-indigo-800",
          title: "Shipped",
        };
      case "delivered":
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          color: "bg-green-100 text-green-800",
          title: "Delivered",
        };
      case "cancelled":
        return {
          icon: <XCircle className="h-5 w-5" />,
          color: "bg-red-100 text-red-800",
          title: "Cancelled",
        };
      case "received":
        return {
          icon: <Smile className="h-5 w-5" />,
          color: "bg-purple-100 text-purple-800",
          title: "Order Received",
        };
      default:
        return {
          icon: <List className="h-5 w-5" />,
          color: "bg-gray-100 text-gray-800",
          title: status,
        };
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <Skeleton className="h-9 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <Skeleton className="h-5 w-24 mb-2" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-40 mt-1" />
                  </div>
                </div>
              </div>
              <div>
                <Skeleton className="h-5 w-24 mb-2" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
              <div>
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-48 mt-1" />
                <Skeleton className="h-4 w-32 mt-2" />
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-40" />
              </div>
            </div>
            <Separator />
            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-start gap-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-56 mt-1" />
                      {item === 3 && <Skeleton className="h-5 w-24 mt-1" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2].map((item) => (
                    <TableRow key={item}>
                      <TableCell className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-md" />
                        <div>
                          <Skeleton className="h-5 w-32 mb-1" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-8" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Separator />
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between font-medium">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="mb-4 text-red-500">
                <XCircle className="h-16 w-16 mx-auto" />
              </div>
              <p className="text-lg text-gray-600">{error}</p>
              <Button className="mt-6" asChild>
                <Link href="/dashboard/orders">Back to Orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!order) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Order Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="mb-4 text-gray-400">
                <Package className="h-16 w-16 mx-auto" />
              </div>
              <p className="text-lg text-gray-600">We couldn't find this order</p>
              <Button className="mt-6" asChild>
                <Link href="/dashboard/orders">Back to Orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare timeline data
  let timelineEvents = [];
  if (order?.statusTrack) {
    timelineEvents = [
      ...timelineEvents,
      ...order.statusTrack.map((track) => ({
        ...track,
        type: "status",
      })),
    ];
  }
  if (order?.isOrderReceived && order?.orderReceivedAt) {
    timelineEvents.push({
      status: "received",
      date: order.orderReceivedAt,
      _id: "order-received",
      id: "order-received",
      type: "received",
    });
  }
  const sortedTimeline = timelineEvents
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((event) => {
      const statusDetails = getStatusDetails(event.status);
      let description = `Order status changed to ${event.status}`;
      if (event.type === "received") {
        description = "Customer confirmed order receipt";
      }
      return {
        ...event,
        status: statusDetails.title,
        formattedDate: new Date(event.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        description,
        icon: statusDetails.icon,
        color: statusDetails.color,
        isCurrent: event.status.toLowerCase() === order?.status.toLowerCase(),
      };
    });

  const orderDate = new Date(order?.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
      </div>
      {order && (
        <Card>
          <CardHeader>
            <CardTitle>Order #{order.orderId}</CardTitle>
            <CardDescription>
              Placed on {orderDate} by {order.user?.name || "Customer"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">Customer</div>
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage
                      src={order.user?.avatar || "/placeholder.svg"}
                      alt={order.user?.name || "Customer"}
                    />
                    <AvatarFallback>
                      {order.user?.name ? order.user.name.charAt(0) : "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {order.user?.name || "Customer"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.user?.email || "No email provided"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.shippingAddress?.phone || "No phone provided"}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Shipping Address</div>
                <div className="font-medium">
                  {order.shippingAddress?.address || "No address provided"}
                  <br />
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}{" "}
                  {order.shippingAddress?.postalCode}
                  <br />
                  {order.shippingAddress?.country || "Nigeria"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Shipping Method</div>
                <div className="font-medium">
                  {order.shippingCarrier || "Standard Shipping"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Tracking: {order.trackingId || "Not available"}
                </div>
                {order.deliveredAt && (
                  <div className="text-sm text-muted-foreground">
                    Delivered: {new Date(order.deliveredAt).toLocaleDateString()}
                  </div>
                )}
                {order.isOrderReceived && order.orderReceivedAt && (
                  <div className="text-sm text-muted-foreground">
                    Received: {new Date(order.orderReceivedAt).toLocaleDateString()}
                  </div>
                )}
                 {order.deliveryDate && (
                                <p className="mb-2 flex items-center">
                                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                                  <span className="font-bold">Expected Delivery: </span>
                                  <span className="ml-1 font-bold">{new Date(order.deliveryDate).toLocaleDateString()}</span>
                                </p>
                              )}
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Order Status</div>
              <div className="flex items-center gap-2">
                {isUpdatingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
                {orderStatus !== 'pending' && (
                  <Select
                  onValueChange={handleStatusChange}
                  value={orderStatus}
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                )}
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground mb-2">Order Timeline</div>
              <ul className="space-y-4">
                {sortedTimeline.length > 0 ? (
                  sortedTimeline.map((event, index) => (
                    <li key={index} className="flex items-start gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${event.color}`}
                      >
                        {event.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{event.status}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.formattedDate}
                        </div>
                        <div className="text-sm">{event.description}</div>
                        {event.isCurrent && event.type !== "received" && (
                          <Badge className="mt-1" variant="secondary">
                            Current Status
                          </Badge>
                        )}
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-center py-4 text-muted-foreground">
                    No timeline data available
                  </li>
                )}
              </ul>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground mb-2">Order Items</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.orderItems.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="flex items-center gap-4">
                        {item.product?.defaultImage ? (
                          <img
                            src={item.product.defaultImage}
                            alt={item.name}
                            className="h-12 w-12 rounded-md object-cover"
                          />
                        ) : (
                          <div className="bg-gray-100 border-2 border-dashed rounded-xl w-12 h-12 flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {item.name || item.product?.name} 
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.product?.productId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatNaira(item.discountedPrice)}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        {formatNaira(item.discountedPrice * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Separator />
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <div className="text-muted-foreground">Subtotal</div>
                <div>{formatNaira(order.itemsPrice)}</div>
              </div>
              <div className="flex justify-between">
                <div className="text-muted-foreground">Shipping</div>
                <div>{formatNaira(order.shippingPrice)}</div>
              </div>
              <div className="flex justify-between font-medium text-lg">
                <div>Total</div>
                <div>{formatNaira(order.totalPrice)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}