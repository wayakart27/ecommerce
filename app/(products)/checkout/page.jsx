"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import Image from "next/image";
import {
  Edit,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import {
  createAddress,
  getUserAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/actions/address";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { states } from "@/data/states";
import { Skeleton } from "@/components/ui/skeleton";
import { createOrder, verifyPaystackPayment } from "@/actions/order";
import { getProductById } from "@/actions/products";
import { calculateShippingCost } from "@/actions/shipping"; // ADD THIS IMPORT

// Form Schema
const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required" }),
  lastName: z.string().min(2, { message: "Last name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(11, { message: "Please enter a valid phone number" }),
  address: z.string().min(5, { message: "Address is required" }),
  city: z.string().min(2, { message: "City is required" }),
  state: z.string().min(2, { message: "State is required" }),
  country: z.string().min(2).default("Nigeria"),
  isDefault: z.boolean().default(false),
  type: z.enum(["home", "work", "other"]).default("home"),
});

function formatPrice(price) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(price);
}

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-full" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
    <div className="flex justify-end gap-4 pt-2">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-32" />
    </div>
  </div>
);

// Address Form Component
const AddressForm = ({ onSubmit, onCancel, defaultValues, isProcessing }) => {
  const [selectedState, setSelectedState] = useState(
    defaultValues?.state || ""
  );
  const [cities, setCities] = useState([]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "Nigeria",
      isDefault: true,
      type: "home",
    },
  });

  useEffect(() => {
    if (selectedState) {
      const stateData = states.find((s) => s.state === selectedState);
      setCities(stateData?.lgas || []);

      if (
        form.getValues("city") &&
        !stateData?.lgas.includes(form.getValues("city"))
      ) {
        form.setValue("city", "");
      }
    } else {
      setCities([]);
      form.setValue("city", "");
    }
  }, [selectedState, form]);

  useEffect(() => {
    if (defaultValues?.state) {
      setSelectedState(defaultValues.state);
      const stateData = states.find((s) => s.state === defaultValues.state);
      setCities(stateData?.lgas || []);
    }
  }, [defaultValues]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">First Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ali"
                    className="bg-white border-gray-300 text-gray-700"
                    disabled={isProcessing}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Last Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Haruna"
                    className="bg-white border-gray-300 text-gray-700"
                    disabled={isProcessing}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="you@example.com"
                    className="bg-white border-gray-300 text-gray-700"
                    disabled={isProcessing}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Phone Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="08012345678"
                    className="bg-white border-gray-300 text-gray-700"
                    disabled={isProcessing}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="123 Main Street"
                  className="bg-white border-gray-300 text-gray-700"
                  disabled={isProcessing}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">State</FormLabel>
                <FormControl>
                  <select
                    className="bg-white border-gray-300 text-gray-700 rounded-md p-2 w-full border"
                    disabled={isProcessing}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      setSelectedState(e.target.value);
                    }}
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state.alias} value={state.state}>
                        {state.state}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">City/LGA</FormLabel>
                <FormControl>
                  <select
                    className="bg-white border-gray-300 text-gray-700 rounded-md p-2 w-full border"
                    disabled={isProcessing || !selectedState}
                    {...field}
                  >
                    <option value="">Select City/LGA</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Country</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nigeria"
                  className="bg-gray-200 border-gray-300 text-gray-700"
                  disabled={isProcessing}
                  readOnly
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Address Type</FormLabel>
              <FormControl>
                <select
                  className="bg-white border-gray-300 text-gray-700 rounded-md p-2 w-full border"
                  disabled={isProcessing}
                  {...field}
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isProcessing}
                  checked={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="text-gray-700 !mt-0">
                Set as default address
              </FormLabel>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            className="text-gray-700 bg-transparent"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white"
            disabled={isProcessing}
          >
            {isProcessing
              ? "Processing..."
              : defaultValues
              ? "Update Address"
              : "Save Address"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

// Address Card Component - Updated with responsive icons
const AddressCard = ({
  address,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
  isDefault,
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <div
      className={`p-4 border rounded-lg transition-colors ${
        isSelected
          ? "border-blue-600 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div className="flex-1 cursor-pointer" onClick={onSelect}>
          <p className="font-medium text-gray-700">
            {address.firstName} {address.lastName}
            {isDefault && (
              <span className="ml-2 text-xs bg-gradient-to-r from-blue-600 to-blue-400 text-white px-2 py-1 rounded-full">
                Default
              </span>
            )}
          </p>
          <p className="text-gray-600">{address.address}</p>
          <p className="text-gray-600">
            {address.city}, {address.state}, {address.country}
          </p>
          <p className="text-gray-600">{address.phone}</p>
          <p className="text-gray-600">{address.email}</p>
          <p className="text-gray-500 text-sm mt-1 capitalize">
            {address.type} address
          </p>
        </div>
        <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 self-stretch sm:self-auto">
          <div className="flex gap-2">
            <button
              className="text-gray-500 hover:text-blue-600 cursor-pointer p-1"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(address);
              }}
            >
              <Edit className="h-4 w-4" />
            </button>

            <Dialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <DialogTrigger asChild>
                <button
                  className="text-gray-500 hover:text-red-600 cursor-pointer p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this address? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      onDelete(address._id);
                      setIsDeleteDialogOpen(false);
                    }}
                  >
                    Delete Address
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {!isDefault && (
              <button
                className="relative flex items-center text-xs text-blue-600 hover:underline cursor-pointer p-1 group"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDefault(address._id);
                }}
              >
                <Check className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Set default</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Shipping Info Component
const ShippingInfoSection = () => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-lg font-medium text-blue-600">
          Shipping Information
        </h3>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-blue-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-blue-600" />
        )}
      </div>

      {expanded && (
        <div className="mt-4 text-gray-600 space-y-2">
          <p className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              <strong>Nationwide Delivery:</strong> We ship products from
              abroad, but delivery is only within Nigeria and typically takes
              2–15 business days.
            </span>
          </p>
          <p className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              You'll receive email updates at every stage of your delivery
              process.
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

// Shipping Cost Display Component
const ShippingCostDisplay = ({ shippingFee, deliveryDays, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-between text-gray-500">
        <span>Shipping</span>
        <span className="text-gray-700">
          <span className="inline-block h-4 w-16 bg-gray-200 rounded animate-pulse" />
        </span>
      </div>
    );
  }

  return (
    <div className="flex justify-between text-gray-500">
      <div className="flex items-center">
        <span>Shipping</span>
        {deliveryDays && (
          <span className="ml-2 flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            <Clock className="h-3 w-3 mr-1" />
            {deliveryDays === "1" ? "Next day" : `${deliveryDays} days`}
          </span>
        )}
      </div>
      <span className="text-gray-700">
        {shippingFee === 0 ? "Free" : formatPrice(shippingFee)}
      </span>
    </div>
  );
};

const RedirectLoader = () => (
  <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex flex-col items-center justify-center">
    <div className="space-y-4 text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
      <p className="text-xl font-medium text-gray-700">
        Your order is confirmed!
      </p>
      <p className="text-gray-600">Preparing your order details...</p>
    </div>
  </div>
);

// Main Checkout Page Component
const CheckoutPage = () => {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [stockErrors, setStockErrors] = useState({});
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showRedirectLoader, setShowRedirectLoader] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isProcessingAddress, setIsProcessingAddress] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [productStocks, setProductStocks] = useState({});
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showAllAddresses, setShowAllAddresses] = useState(true);
  const [shippingFee, setShippingFee] = useState(null);
  const [deliveryDays, setDeliveryDays] = useState("");
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();
  const {
    cartItems,
    getTotalPrice,
    clearCart,
    getEffectivePrice,
    removeFromCart,
  } = useCart();

  const subtotal = getTotalPrice();
  const total = subtotal + (shippingFee || 0);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const checkStock = async () => {
      setIsCheckingStock(true);
      try {
        const stockData = await Promise.all(
          cartItems.map(async (item) => {
            const product = await getProductById(item.id);
            return { id: item.id, stock: product.stock };
          })
        );

        const stockMap = stockData.reduce((acc, curr) => {
          acc[curr.id] = curr.stock;
          return acc;
        }, {});

        setProductStocks(stockMap);
      } catch (error) {
        toast.error("Failed to check product availability");
      } finally {
        setIsCheckingStock(false);
      }
    };

    if (cartItems.length > 0) {
      checkStock();
    }
  }, [cartItems]);

  // Fetch user addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);
        const result = await getUserAddresses(session.user.id);
        if (result.success) {
          setSavedAddresses(result.data);
          const defaultAddr = result.data.find((addr) => addr.isDefault);
          if (defaultAddr) {
            setSelectedAddress(defaultAddr);
          }
        }
      } catch (error) {
        toast.error("Failed to load addresses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddresses();
  }, [session]);

  // Calculate shipping fee using server action
  useEffect(() => {
    const calculateShipping = async () => {
      if (!selectedAddress) {
        setShippingFee(null);
        setDeliveryDays("");
        return;
      }

      setIsCalculatingShipping(true);
      try {
        const result = await calculateShippingCost(
          {
            state: selectedAddress.state,
            city: selectedAddress.city,
          },
          getTotalPrice()
        );

        if (result.success) {
          setShippingFee(result.data.price);
          setDeliveryDays(result.data.deliveryDays.toString());
        } else {
          // Fallback to defaults
          setShippingFee(5000);
          setDeliveryDays("10");
        }
      } catch (error) {
        console.error("Shipping calculation error:", error);
        setShippingFee(5000);
        setDeliveryDays("10");
      } finally {
        setIsCalculatingShipping(false);
      }
    };

    calculateShipping();
  }, [selectedAddress, cartItems]);

  // Address handlers
  const handleSaveAddress = async (addressData) => {
    if (!session?.user?.id) return;

    setIsProcessingAddress(true);
    try {
      const addressWithUser = { ...addressData, user: session.user.id };
      const result = editingAddress
        ? await updateAddress(editingAddress._id, addressWithUser)
        : await createAddress(session.user.id, addressWithUser);

      if (result.success) {
        // Refresh addresses and force UI update
        const refreshResult = await getUserAddresses(session.user.id);
        if (refreshResult.success) {
          setSavedAddresses(refreshResult.data);

          // Always select the new/updated address
          const newAddress = refreshResult.data.find(
            (a) => a._id === result.data._id
          );
          setSelectedAddress(newAddress);

          // Force-show all addresses for non-default
          if (!addressData.isDefault) setShowAllAddresses(true);
        }
        setShowAddressForm(false);
        setEditingAddress(null);
      }
    } catch (error) {
      toast.error("Address save failed");
    } finally {
      setIsProcessingAddress(false);
    }
  };

  const handleSelectAddress = (address) => {
    // Only update if different address
    if (selectedAddress?._id !== address._id) {
      setSelectedAddress(address);
      // Force-show non-default addresses
      if (!address.isDefault) setShowAllAddresses(true);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const result = await deleteAddress(addressId);
      if (result.success) {
        // Refresh addresses from server
        const refreshResult = await getUserAddresses(session.user.id);
        if (refreshResult.success) {
          setSavedAddresses(refreshResult.data);

          // Update selected address if needed
          if (selectedAddress?._id === addressId) {
            const newSelected =
              refreshResult.data.find((addr) => addr.isDefault) ||
              refreshResult.data[0];
            setSelectedAddress(newSelected || null);
          }
        }

        toast.success("Address deleted");
      }
    } catch (error) {
      toast.error("Failed to delete address");
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    if (!session?.user?.id) return;

    try {
      const result = await setDefaultAddress(session.user.id, addressId);
      if (result.success) {
        // Refresh addresses from server
        const refreshResult = await getUserAddresses(session.user.id);
        if (refreshResult.success) {
          setSavedAddresses(refreshResult.data);
          setSelectedAddress(
            refreshResult.data.find((addr) => addr._id === addressId)
          );
        }

        toast.success("Default address updated");
      }
    } catch (error) {
      toast.error("Failed to set default address");
    }
  };

  // Payment handlers
  const handlePaystackPayment = async () => {
    setIsProcessingPayment(true);
    try {
      if (!selectedAddress) {
        return toast.error("Shipping address is required");
      }

      const stockValidation = await validateStockAvailability();
      if (!stockValidation.valid) {
        setStockErrors(stockValidation.errors);
        return;
      }

      const orderItems = cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        discountedPrice: getEffectivePrice(item),
      }));

      const orderData = {
        userId: session.user.id,
        shippingAddressId: selectedAddress._id,
        orderItems,
        itemsPrice: subtotal,
        shippingPrice: shippingFee,
        totalPrice: total,
      };

      // Create order first
      const { success, data: order, message } = await createOrder(orderData);
      if (!success) {
        // Clear cart if items were out of stock
        if (message.includes("out of stock")) {
          const invalidItems = message.match(/\[(.*?)\]/)[1].split(", ");
          invalidItems.forEach((id) => removeFromCart(id));
        }
        return toast.error(message);
      }

      if (typeof window.PaystackPop === "undefined") {
        return toast.error(
          "Payment service is unavailable. Please try again later."
        );
      }

      const email = selectedAddress.email;
      const amount = total * 100; // Convert to kobo
      const firstName = selectedAddress.firstName;
      const lastName = selectedAddress.lastName;
      const phone = selectedAddress.phone;

      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email,
        amount,
        currency: "NGN",
        ref: `PAYSTACK_${Date.now()}`,
        metadata: {
          custom_fields: [
            {
              display_name: "First Name",
              variable_name: "first_name",
              value: firstName,
            },
            {
              display_name: "Last Name",
              variable_name: "last_name",
              value: lastName,
            },
            {
              display_name: "Phone",
              variable_name: "phone",
              value: phone,
            },
            {
              display_name: "Order ID",
              variable_name: "order_id",
              value: order._id,
            },
          ],
        },
        onClose: () => {
          toast.error("Payment window closed");
          setIsProcessingPayment(false);
        },
        callback: (response) => {
          (async () => {
            try {
              const { success: paymentSuccess, message: paymentMessage } =
                await verifyPaystackPayment(order._id, response.reference);

              if (!paymentSuccess) {
                toast.error(paymentMessage);
                return;
              }

              // Clear cart and show loader before redirect
              clearCart(false);
              setShowRedirectLoader(true); // Show skeleton loader

              setTimeout(() => {
                router.push(`/dashboard/my-order/${order._id}`);
              }, 2000); // Show loader for 2 seconds before redirect
            } catch (error) {
              toast.error(error.message || "Payment verification failed");
            } finally {
              setIsProcessingPayment(false);
            }
          })();
        },
      });

      handler.openIframe();
    } catch (error) {
      setIsProcessingPayment(false);
      toast.error(error.message || "Payment initialization failed");
    }
  };

  const onSubmit = async () => {
    // Check for out of stock items first
    const outOfStockItems = cartItems.filter(
      (item) => (productStocks[item.id] || 0) < 1
    );

    if (outOfStockItems.length > 0) {
      toast.error("Please remove out of stock items before proceeding");
      return;
    }

    // Existing checks
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select a shipping address");
      return;
    }

    try {
      await handlePaystackPayment();
    } catch (error) {
      toast.error("Checkout failed");
    }
  };

  // Stock validation function
  const validateStockAvailability = async () => {
    const errors = {};
    let hasErrors = false;

    try {
      // Fetch latest stock for all products
      const stockData = await Promise.all(
        cartItems.map(async (item) => {
          const product = await getProductById(item.id);
          return {
            id: item.id,
            stock: product.stock,
            name: product.name,
            defaultImage: product.defaultImage,
          };
        })
      );

      // Check each item
      stockData.forEach(({ id, stock, name }) => {
        const cartItem = cartItems.find((item) => item.id === id);
        if (cartItem && cartItem.quantity > stock) {
          errors[id] = `Only ${stock} available`;
          hasErrors = true;
        }
      });
    } catch (error) {
      console.error("Stock validation failed:", error);
      toast.error("Failed to verify product availability");
      hasErrors = true;
    }

    return { valid: !hasErrors, errors };
  };

  if (showRedirectLoader) {
    return <RedirectLoader />;
  }

  // Render functions
  const renderOrderSummary = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-medium text-blue-600 mb-4">Order Summary</h2>
      <div className="space-y-4 divide-y divide-gray-200">
        {cartItems.map((item) => {
          const stock = productStocks[item.id] ?? Number.POSITIVE_INFINITY;
          const isOutOfStock = stock < 1;
          const isInsufficientStock = item.quantity > stock;
          const showError = isOutOfStock || isInsufficientStock;
          const effectivePrice = getEffectivePrice(item);

          return (
            <div key={item.id} className="flex py-3 relative group">
              {/* Show overlay only if actually out of stock */}
              {showError && (
                <div className="absolute inset-0 bg-red-50/90 flex items-center justify-center rounded-md z-10">
                  <div className="text-center p-2">
                    <span className="text-red-600 font-medium text-sm block">
                      {isOutOfStock
                        ? "This item is out of stock"
                        : `Only ${stock} available`}
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-2"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove Item
                    </Button>
                  </div>
                </div>
              )}

              {/* Product Image */}
              <div className="w-16 h-16 flex-shrink-0 relative">
                {item?.defaultImage ? (
                  <Image
                    src={item.defaultImage}
                    alt={item.name}
                    fill
                    className="object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                    <span className="text-xs text-gray-400">No image</span>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="ml-4 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-700 text-sm font-medium">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-gray-500 text-xs">
                        Quantity: {item.quantity || 1}
                      </p>
                      {!isOutOfStock && (
                        <span className="text-xs text-green-600">
                          ({stock} in stock)
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-400 hover:text-red-600 ml-2 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Price Information */}
                <div className="mt-2">
                  <p className="text-blue-600 text-sm">
                    Price: {formatPrice(effectivePrice)}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-gray-500 text-xs mt-1">
                      Total: {formatPrice(effectivePrice * item.quantity)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Totals */}
      <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
        <div className="flex justify-between text-gray-500">
          <span>Subtotal</span>
          <span className="text-gray-700">
            {isCheckingStock ? (
              <span className="inline-block h-4 w-16 bg-gray-200 rounded animate-pulse" />
            ) : (
              formatPrice(subtotal)
            )}
          </span>
        </div>

        <ShippingCostDisplay
          shippingFee={shippingFee}
          deliveryDays={deliveryDays}
          isLoading={isCalculatingShipping}
        />

        <div className="flex justify-between font-medium pt-2 text-blue-600">
          <span>Total</span>
          <span>
            {isCalculatingShipping ||
            isCheckingStock ||
            shippingFee === null ? (
              <span className="inline-block h-6 w-24 bg-gray-200 rounded animate-pulse" />
            ) : (
              formatPrice(total)
            )}
          </span>
        </div>
      </div>
    </div>
  );

  const renderPaymentButton = () => (
    <Button
      onClick={onSubmit}
      className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white w-full cursor-pointer"
      disabled={
        isProcessingPayment ||
        !selectedAddress ||
        isCalculatingShipping ||
        isCheckingStock ||
        shippingFee === null ||
        cartItems.some((item) => {
          const stock = productStocks[item.id] || 0;
          return stock < 1 || item.quantity > stock;
        })
      }
    >
      {isCheckingStock
        ? "Checking stock..."
        : isProcessingPayment
        ? "Processing..."
        : isCalculatingShipping
        ? "Calculating..."
        : shippingFee === null
        ? "Add a shipping address, please..."
        : `Pay with Paystack - ${formatPrice(total)}`}
    </Button>
  );

  const defaultAddress = savedAddresses?.find((addr) => addr.isDefault);
  const otherAddresses = savedAddresses?.filter((addr) => !addr.isDefault);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="container mt-32 mb-20 flex-1 px-4 md:px-6">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <LoadingSkeleton />
              <LoadingSkeleton />
            </div>
            <div className="space-y-6">
              <LoadingSkeleton />
              <LoadingSkeleton />
            </div>
          </div>
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="container mt-32 mb-20 flex-1 px-4 md:px-6">
        <h1 className="text-3xl font-semibold text-blue-600 mb-8">Checkout</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-500 mb-8">
              Please add some products to your cart before proceeding to
              checkout.
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ShippingInfoSection />

              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-medium text-blue-600">
                    Shipping Address
                  </h2>
                  {!showAddressForm && (
                    <Button
                      variant="outline"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
                      onClick={() => {
                        setShowAddressForm(true);
                        setEditingAddress(null);
                      }}
                    >
                      Add New Address
                    </Button>
                  )}
                </div>

                {showAddressForm ? (
                  <AddressForm
                    onSubmit={handleSaveAddress}
                    onCancel={() => {
                      setShowAddressForm(false);
                      setEditingAddress(null);
                    }}
                    defaultValues={editingAddress}
                    isProcessing={isProcessingAddress}
                  />
                ) : (
                  <>
                    {savedAddresses?.length > 0 ? (
                      <div className="space-y-4">
                        {defaultAddress && (
                          <AddressCard
                            key={defaultAddress._id}
                            address={defaultAddress}
                            isSelected={
                              selectedAddress?._id === defaultAddress._id
                            }
                            onSelect={() => handleSelectAddress(defaultAddress)}
                            onEdit={() => handleEditAddress(defaultAddress)}
                            onDelete={handleDeleteAddress}
                            onSetDefault={handleSetDefaultAddress}
                            isDefault={true}
                          />
                        )}

                        {otherAddresses.length > 0 && (
                          <div className="space-y-4">
                            <button
                              onClick={() =>
                                setShowAllAddresses(!showAllAddresses)
                              }
                              className="flex items-center text-sm text-blue-600 hover:underline"
                            >
                              {showAllAddresses ? (
                                <>
                                  <ChevronUp className="h-4 w-4 mr-1" />
                                  Hide {otherAddresses.length} other addresses
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-1" />
                                  Show {otherAddresses.length} other addresses
                                </>
                              )}
                            </button>

                            {showAllAddresses &&
                              otherAddresses.map((address) => (
                                <AddressCard
                                  key={address._id}
                                  address={address}
                                  isSelected={
                                    selectedAddress?._id === address._id
                                  }
                                  onSelect={() => handleSelectAddress(address)}
                                  onEdit={() => handleEditAddress(address)}
                                  onDelete={handleDeleteAddress}
                                  onSetDefault={handleSetDefaultAddress}
                                  isDefault={false}
                                />
                              ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500">No saved addresses yet</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-medium text-blue-600 mb-4">
                  Payment Method
                </h2>
                <div className="text-gray-600">
                  Secure payment processed by Paystack. You'll be redirected to
                  complete your payment.
                </div>
                <div className="pt-6">{renderPaymentButton()}</div>
              </div>
            </div>

            <div className="space-y-6">
              {renderOrderSummary()}

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-xl font-medium text-blue-600 mb-4">
                  Need Help?
                </h3>
                <p className="text-gray-500 mb-4">
                  If you have any questions about your order, feel free to
                  contact us.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center text-gray-600">
                    <span className="text-blue-600 mr-2">•</span> Phone:
                    08160126157, 08035318145
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <WhatsAppButton />
    </div>
  );
};

export default CheckoutPage;
