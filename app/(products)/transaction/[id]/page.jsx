"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { toast } from "sonner";
import Image from "next/image";
import {
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Package,
  CreditCard,
  User,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { verifyPaystackPayment, getOrderById } from "@/actions/order";
import { Skeleton } from "@/components/ui/skeleton";

function formatPrice(price) {
  // Handle NaN, undefined, and null values
  const numericPrice = Number(price) || 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(numericPrice);
}

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-white flex flex-col">
    <Navbar />
    <main className="container mt-32 mb-20 flex-1 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-center mb-6">
            <Skeleton className="h-16 w-16 rounded-full" />
          </div>
          <div className="text-center mb-6">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
          <div className="flex justify-center gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </main>
    <Footer />
    <WhatsAppButton />
  </div>
);

const TransactionConfirmationPage = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const transactionId = params.id;

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("pending");

  useEffect(() => {
    const verifyTransaction = async () => {
      if (!transactionId) return;

      setIsLoading(true);
      try {
        // First, try to get the order details
        const orderResult = await getOrderById(transactionId);

        console.log(orderResult)

        if (orderResult.success) {
          setOrder(orderResult.data);

          // If order is already paid, show success
          if (orderResult.data.paymentStatus === 'paid' || orderResult.data.isPaid) {
            setVerificationStatus("success");
            setIsLoading(false);
            return;
          }

          // If payment is still pending, verify with Paystack
          if (
            orderResult.data.paymentStatus === "pending" &&
            orderResult.data.paystackReference
          ) {
            setIsVerifying(true);
            const verificationResult = await verifyPaystackPayment(
              transactionId,
              orderResult.data.paystackReference
            );

            if (verificationResult.success) {
              setVerificationStatus("success");
              // Refresh order data
              const updatedOrder = await getOrderById(transactionId);
              if (updatedOrder.success) {
                setOrder(updatedOrder.data);
              }
            } else {
              setVerificationStatus("failed");
            }
          } else {
            setVerificationStatus("pending");
          }
        } else {
          setVerificationStatus("not_found");
        }
      } catch (error) {
        console.error("Transaction verification error:", error);
        setVerificationStatus("error");
      } finally {
        setIsLoading(false);
        setIsVerifying(false);
      }
    };

    verifyTransaction();
  }, [transactionId]);

  const handleRetryVerification = async () => {
    if (!order?.paystackReference) return;

    setIsVerifying(true);
    try {
      const result = await verifyPaystackPayment(
        transactionId,
        order.paystackReference
      );
      if (result.success) {
        setVerificationStatus("success");
        // Refresh order data
        const updatedOrder = await getOrderById(transactionId);
        if (updatedOrder.success) {
          setOrder(updatedOrder.data);
        }
        toast.success("Payment verified successfully!");
      } else {
        setVerificationStatus("failed");
        toast.error("Payment verification failed. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred during verification.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const renderStatusIcon = () => {
    switch (verificationStatus) {
      case "success":
        return (
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        );
      case "failed":
        return <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />;
      case "pending":
        return <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />;
      default:
        return <XCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />;
    }
  };

  const renderStatusMessage = () => {
    switch (verificationStatus) {
      case "success":
        return (
          <>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600">
              Thank you for your purchase. Your order has been confirmed and is
              being processed.
            </p>
          </>
        );
      case "failed":
        return (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Payment Failed
            </h2>
            <p className="text-gray-600">
              We couldn't verify your payment. Please try again or contact
              support if the issue persists.
            </p>
          </>
        );
      case "pending":
        return (
          <>
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">
              Payment Processing
            </h2>
            <p className="text-gray-600">
              Your payment is being processed. This may take a few moments.
            </p>
          </>
        );
      case "not_found":
        return (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Order Not Found
            </h2>
            <p className="text-gray-600">
              We couldn't find an order with the provided ID. Please check your
              order history or contact support.
            </p>
          </>
        );
      default:
        return (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Verification Error
            </h2>
            <p className="text-gray-600">
              An error occurred while verifying your payment. Please try again
              later.
            </p>
          </>
        );
    }
  };

  const renderOrderDetails = () => {
    if (!order) return null;

    return (
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Order Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue-600" />
              Order Summary
            </h4>
            <div className="space-y-2">
              <p className="flex justify-between text-sm">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{order.orderId || order._id}</span>
              </p>
              <p className="flex justify-between text-sm">
                <span className="text-gray-600">Order Date:</span>
                <span className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </p>
              <p className="flex justify-between text-sm">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">
                  {order.orderItems?.reduce(
                    (total, item) => total + (item.quantity || 1),
                    0
                  ) || 0}
                </span>
              </p>
              <p className="flex justify-between text-sm">
                <span className="text-gray-600">Total Amount with Shipping:</span>
                <span className="font-medium text-green-600">
                  {formatPrice(order.totalAmount || order.totalPrice)}
                </span>
              </p>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center">
              <Truck className="h-5 w-5 mr-2 text-blue-600" />
              Shipping Information
            </h4>
            {order.shippingAddress && (
              <div className="space-y-2">
                <p className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  {order.shippingAddress.firstName}{" "}
                  {order.shippingAddress.lastName}
                </p>
                <p className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {order.shippingAddress.address}, {order.shippingAddress.city},{" "}
                  {order.shippingAddress.state}
                </p>
                <p className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {order.shippingAddress.phone}
                </p>
                <p className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {order.shippingAddress.email}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-medium text-gray-700 mb-3 flex items-center">
            <Package className="h-5 w-5 mr-2 text-blue-600" />
            Order Items
          </h4>
          <div className="space-y-4">
            {order.orderItems?.map((item) => (
              <div
                key={item._id}
                className="flex items-center border-b border-gray-100 pb-4 last:border-0"
              >
                <div className="w-16 h-16 relative flex-shrink-0">
                  {item.product?.defaultImage ? (
                    <Image
                      src={item.product.defaultImage || "/fallback.jpg"}
                      alt={item.name || "Product"}
                      fill
                      className="object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                      <span className="text-xs text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity || 1}
                  </p>
                  <p className="text-sm text-blue-600">
                    Price: {formatPrice((item.discountedPrice || 0) * (item.quantity || 1))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderActionButtons = () => {
    switch (verificationStatus) {
      case "success":
        return (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/dashboard/my-order")}
              className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white cursor-pointer"
            >
              View My Orders
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 cursor-pointer"
            >
              Continue Shopping
            </Button>
          </div>
        );
      case "failed":
        return (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleRetryVerification}
              disabled={isVerifying}
              className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Retry Verification"
              )}
            </Button>
            <Button
              onClick={() => router.push("/dashboard/my-order")}
              variant="outline"
              className="border-gray-600 text-gray-600 hover:bg-gray-50"
            >
              View Order History
            </Button>
          </div>
        );
      case "pending":
        return (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleRetryVerification}
              disabled={isVerifying}
              className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking Status...
                </>
              ) : (
                "Check Payment Status"
              )}
            </Button>
            <Button
              onClick={() => router.push("/dashboard/my-order")}
              variant="outline"
              className="border-gray-600 text-gray-600 hover:bg-gray-50"
            >
              View Order History
            </Button>
          </div>
        );
      default:
        return (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/dashboard/my-order")}
              className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white"
            >
              View My Orders
            </Button>
            <Button
              onClick={() => router.push("/#contact")}
              variant="outline"
              className="border-gray-600 text-gray-600 hover:bg-gray-50"
            >
              Contact Support
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="container mt-32 mb-20 flex-1 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/dashboard/my-order"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>

          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-sm">
            {/* Status Icon */}
            {renderStatusIcon()}

            {/* Status Message */}
            <div className="text-center mb-8">{renderStatusMessage()}</div>

            {/* Payment Details */}
            {order && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                <h4 className="font-medium text-blue-700 mb-3 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Payment Method</p>
                    <p className="font-medium">Paystack</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Payment Status</p>
                    <p
                      className={`font-medium ${
                        order.paymentStatus === 'paid' || order.isPaid
                          ? "text-green-600"
                          : order.paymentStatus === 'failed'
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {order.paymentStatus === 'paid' || order.isPaid ? "Paid" : 
                       order.paymentStatus === 'failed' ? "Failed" : 
                       order.paymentStatus || "Pending"}
                    </p>
                  </div>
                  {order.paystackReference && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Transaction Reference</p>
                      <p className="font-medium text-sm">
                        {order.paystackReference}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Details */}
            {order && renderOrderDetails()}

            {/* Action Buttons */}
            <div className="text-center">{renderActionButtons()}</div>
          </div>

          {/* Support Information */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Need Help?
            </h3>
            <p className="text-gray-600 mb-4">
              If you have any questions about your order or payment, our support
              team is here to help.
            </p>
            <div className="space-y-2 text-sm">
              <p className="flex items-center text-gray-600">
                <span className="text-blue-600 mr-2">•</span> Phone: 08160126157
              </p>
              <p className="flex items-center text-gray-600">
                <span className="text-blue-600 mr-2">•</span> Email:
                pureluxury247@gmail.com
              </p>
              <p className="flex items-center text-gray-600">
                <span className="text-blue-600 mr-2">•</span> Response Time:
                Within 24 hours
              </p>
            </div>
          </div>
        </div>
      </main>
      <WhatsAppButton />
    </div>
  );
};

export default TransactionConfirmationPage;
