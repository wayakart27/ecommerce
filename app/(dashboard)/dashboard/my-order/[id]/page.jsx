"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getOrderAndShippingById } from "@/actions/order";
import { 
  ShoppingBag, Package, CreditCard, Truck, Frown, ArrowLeft, 
  Clock, Cog, XCircle, List, CheckCircle2, Calendar 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function OrderDetailsPage() {
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deliveryDateRange, setDeliveryDateRange] = useState(null);
  const orderId = params?.orderId || params?.id;

  function formatNaira(amount) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function formatDate(dateString) {
    if (!dateString) return "N/A";
    
    // Handle both string dates and Date objects
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Function to calculate delivery date range from order data
  const calculateDeliveryDateRange = (orderData) => {
    if (!orderData) return null;
    
    // First try to use the deliveryDateRange from server
    if (orderData.deliveryDateRange) {
      return {
        from: formatDate(orderData.deliveryDateRange.from),
        to: orderData.deliveryDateRange.to ? formatDate(orderData.deliveryDateRange.to) : null,
        isRange: orderData.deliveryDateRange.isRange,
        source: 'server'
      };
    }
    
    // If no deliveryDateRange, try to use estimatedDeliveryDate
    if (orderData.estimatedDeliveryDate && orderData.paidAt) {
      return {
        from: formatDate(orderData.estimatedDeliveryDate),
        to: null,
        isRange: false,
        source: 'estimated'
      };
    }
    
    // If no estimated date, try to use expectedDeliveryDays
    if (orderData.expectedDeliveryDays && orderData.paidAt) {
      const paidDate = new Date(orderData.paidAt);
      const startDate = new Date(paidDate);
      const endDate = new Date(paidDate);
      
      // Extract the day range from the string (e.g., "1-3" or "1")
      if (orderData.expectedDeliveryDays.includes('-')) {
        const daysMatch = orderData.expectedDeliveryDays.match(/(\d+)-(\d+)/);
        
        if (daysMatch) {
          const minDays = parseInt(daysMatch[1]);
          const maxDays = parseInt(daysMatch[2]);
          
          startDate.setDate(paidDate.getDate() + minDays);
          endDate.setDate(paidDate.getDate() + maxDays);
          
          return {
            from: formatDate(startDate),
            to: formatDate(endDate),
            isRange: true,
            source: 'calculated'
          };
        }
      } else {
        const days = parseInt(orderData.expectedDeliveryDays);
        
        if (!isNaN(days)) {
          startDate.setDate(paidDate.getDate() + days);
          
          return {
            from: formatDate(startDate),
            to: null,
            isRange: false,
            source: 'calculated'
          };
        }
      }
    }
    
    return null;
  };

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const result = await getOrderAndShippingById(orderId);

        if (result.success) {
          setOrder(result.data);

          console.log(result.data)
          
          // Calculate delivery date range from order data
          const formattedDateRange = calculateDeliveryDateRange(result.data);
          setDeliveryDateRange(formattedDateRange);
        } else {
          setError(result.message || "Order not found");
        }
      } catch (err) {
        setError(err.message || "Failed to load order");
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Loading skeleton (unchanged)
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <Skeleton className="h-10 w-64" />
          
          {/* Order Timeline Skeleton */}
          <div className="border rounded-lg p-4 sm:p-6">
            <Skeleton className="h-8 w-40 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center">
                  <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
                  <div className="ml-3 sm:ml-4 flex-1">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Order Items Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-40" />
            <div className="border rounded-lg">
              {[1, 2].map((item) => (
                <div key={item} className="p-3 sm:p-4 border-b flex items-center">
                  <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 rounded" />
                  <div className="ml-3 sm:ml-4 flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                  <Skeleton className="h-5 w-16 sm:w-20" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Order Summary Skeleton */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
            <div className="border rounded-lg p-4 sm:p-6 space-y-4">
              <Skeleton className="h-8 w-40" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 sm:p-6 space-y-4">
              <Skeleton className="h-8 w-40" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
          
          {/* Shipping Info Skeleton */}
          <div className="border rounded-lg p-4 sm:p-6 space-y-4">
            <Skeleton className="h-8 w-40" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2 mt-4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state (unchanged)
  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <div className="flex justify-center mb-6">
          <Frown className="h-16 w-16 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
        <p className="text-gray-600 mb-8">{error}</p>
        <Button asChild>
          <Link href="/dashboard/my-order">View Your Orders</Link>
        </Button>
      </div>
    );
  }

  // Empty state (unchanged)
  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <div className="flex justify-center mb-6">
          <ShoppingBag className="h-16 w-16 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
        <p className="text-gray-600 mb-8">
          We couldn't find any order with that ID. Please check your order number and try again.
        </p>
        <Button asChild>
          <Link href="/dashboard/my-order">View Your Orders</Link>
        </Button>
      </div>
    );
  }

  // Prepare timeline data (unchanged)
  const getStatusDetails = (status) => {
    const statusLower = status.toLowerCase();
    
    switch(statusLower) {
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5" />,
          color: 'bg-red-100 text-yellow-800',
          title: 'Pending'
        };
      case 'processing':
        return {
          icon: <Cog className="h-5 w-5" />,
          color: 'bg-blue-100 text-blue-800',
          title: 'Processing'
        };
      case 'shipped':
        return {
          icon: <Truck className="h-5 w-5" />,
          color: 'bg-indigo-100 text-indigo-800',
          title: 'Shipped'
        };
      case 'delivered':
        return {
          icon: <CheckCircle2 className="h-5 w-5" />,
          color: 'bg-green-100 text-green-800',
          title: 'Delivered'
        };
      case 'cancelled':
        return {
          icon: <XCircle className="h-5 w-5" />,
          color: 'bg-red-100 text-red-800',
          title: 'Cancelled'
        };
      default:
        return {
          icon: <List className="h-5 w-5" />,
          color: 'bg-gray-100 text-gray-800',
          title: status
        };
    }
  };

  // Filter timeline data - remove pending if order is paid
  const filteredStatusTrack = order.statusTrack 
    ? order.statusTrack.filter(status => 
        !(order.isPaid && status.status.toLowerCase() === 'pending')
      )
    : [];

  // Sort timeline by date
  const sortedStatusTrack = [...filteredStatusTrack].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <div className="mb-6">
        <Link 
          href="/dashboard/my-order"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Link>
      </div>

      {/* Order Header */}
      <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-2">
        <div className="flex items-center">
          <Package className="h-6 w-6 sm:h-8 sm:w-8 mr-2 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold">Order #{order.orderId}</h1>
        </div>
        <Badge variant="secondary" className="sm:ml-4 w-fit">
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>

      {/* Order Timeline Section */}
      <div className="mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center">
          <List className="h-5 w-5 mr-2" /> Order Timeline
        </h2>
        <div className="border rounded-lg p-4 sm:p-6">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 sm:left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {/* Timeline items */}
            {sortedStatusTrack.length > 0 ? (
              sortedStatusTrack.map((track, index, array) => {
                const statusDetails = getStatusDetails(track.status);
                const isLast = index === array.length - 1;
                const statusDate = new Date(track.date);
                
                return (
                  <div 
                    key={track._id} 
                    className="flex items-start mb-6 last:mb-0"
                  >
                    {/* Status icon with line connector */}
                    <div className="relative z-10">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${statusDetails.color}`}>
                        {statusDetails.icon}
                      </div>
                      {!isLast && (
                        <div className="absolute left-1/2 top-8 sm:top-10 -translate-x-1/2 h-full w-0.5 bg-gray-200"></div>
                      )}
                    </div>
                    
                    {/* Status details */}
                    <div className="ml-3 sm:ml-4 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="font-medium text-sm sm:text-base">
                          {statusDetails.title}
                        </h3>
                        <span className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">
                          {statusDate.toLocaleDateString()} at {statusDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {track.status.toLowerCase() === order.status.toLowerCase() && (
                        <Badge className="mt-2 text-xs sm:text-sm" variant={
                          order.status === "delivered" 
                            ? "default" 
                            : order.status === "cancelled" 
                              ? "destructive" 
                              : "secondary"
                        }>
                          Current Status
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p>No status history available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Items Section */}
      <div className="mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center">
          <ShoppingBag className="h-5 w-5 mr-2" /> Items
        </h2>
        <div className="border rounded-lg">
          {order.orderItems.map((item) => (
            <div key={item._id} className="p-3 sm:p-4 border-b flex items-center">
              <div className="mr-3 sm:mr-4">
                {item.product?.defaultImage?.url?.length > 0 ? (
                  <img
                    src={item.product.defaultImage?.url}
                    alt={item.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded"
                    width={64}
                    height={64}
                  />
                ) : (
                  <div className="bg-gray-100 border-2 border-dashed rounded-xl w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                    <Package className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm sm:text-base truncate">
                  {item.name || item.product?.name} - {item.product?.productId}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Quantity: {item.quantity}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Price: {formatNaira(item.discountedPrice)}
                </p>
              </div>
              <div className="text-right ml-2">
                <p className="font-medium text-sm sm:text-base">
                  {formatNaira(item.discountedPrice * item.quantity)}
                </p>
                {item.product?.slug && (
                  <a
                    href={`/product/${item.product?.slug}-${item.product?.productId}`}
                    className="text-xs sm:text-sm text-blue-600 hover:underline"
                  >
                    View Product
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 mb-8">
        <div className="border rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" /> Order Summary
          </h2>
          <div className="space-y-2 text-sm sm:text-base">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatNaira(order.itemsPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>{formatNaira(order.shippingPrice)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-bold">
              <span>Total:</span>
              <span>{formatNaira(order.totalPrice)}</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" /> Payment Information
          </h2>
          <div className="space-y-2 text-sm sm:text-base">
            <p>
              <span className="font-medium">Method:</span> {order.paymentMethod}
            </p>
            <p>
              <span className="font-medium">Status:</span>{" "}
              <Badge variant={order.isPaid ? "default" : "destructive"} className="text-xs sm:text-sm">
                {order.isPaid ? "Paid" : "Not Paid"}
              </Badge>
            </p>
            {order.paidAt && (
              <p>
                <span className="font-medium">Paid at:</span>{" "}
                {new Date(order.paidAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Shipping Information */}
      <div className="border rounded-lg p-4 sm:p-6 mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center">
          <Truck className="h-5 w-5 mr-2" /> Shipping Information
        </h2>
        {order.shippingAddress ? (
          <div className="space-y-4 text-sm sm:text-base">
            <div>
              <p className="font-medium">{order.shippingAddress.firstName +' '+ order.shippingAddress.lastName}</p>
              <p className="text-gray-600">{order.shippingAddress.phone}</p>
              <p className="text-gray-600">
                {order.shippingAddress.address}, {order.shippingAddress.city}
              </p>
              <p className="text-gray-600">
                {order.shippingAddress.state}, {order.shippingAddress.country}
              </p>
            </div>
            <div className="border-t pt-4 space-y-2">
              {/* Delivery date range */}
              {deliveryDateRange && (
                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <Calendar className="h-4 w-4 text-primary shrink-0 mt-1" />
                  <div className="flex flex-col">
                    <span className="font-bold">Expected Delivery:</span>
                    <span className="text-sm sm:text-base">
                      {deliveryDateRange.isRange 
                        ? `${deliveryDateRange.from} to ${deliveryDateRange.to}`
                        : deliveryDateRange.from
                      }
                    </span>
                  </div>
                </div>
              )}
              <p>
                <span className="font-medium">Carrier:</span> {order.shippingCarrier || 'N/A'}
              </p>
              <p>
                <span className="font-medium">Tracking ID:</span> {order.trackingId || 'N/A'}
              </p>
              <p>
                <span className="font-medium">Status:</span>{" "}
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
                  className="text-xs sm:text-sm"
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </p>
              {order.isDelivered && (
                <p>
                  <span className="font-medium">Delivered at:</span>{" "}
                  {new Date(order.deliveredAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No shipping address found</p>
        )}
      </div>    
    </div>
  );
}