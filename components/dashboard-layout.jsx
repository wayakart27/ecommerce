"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  Box,
  CreditCard,
  Home,
  LogOut,
  Package,
  ShoppingBag,
  ShoppingCart,
  Settings,
  Tag,
  Truck,
  User,
  Users,
  X,
  Trash2,
  TruckIcon,
  Loader2,
  CurrencyIcon,
  SheetIcon,
  Gift,
  GiftIcon,
  UserIcon,
  LucideCurrency,
  Currency,
  GitFork,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/hooks/useCart";
import Image from "next/image";

// Currency formatting function
const formatNaira = (amount) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State for loading indicators
  const [isNavigatingToCart, setIsNavigatingToCart] = useState(false);
  const [isNavigatingToCheckout, setIsNavigatingToCheckout] = useState(false);

  // Use cart context
  const {
    cartItems,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
    getEffectivePrice,
  } = useCart();

  const { data: session } = useSession();
  const userRole = session?.user?.role;

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  const adminNavItems = [
    { title: "Dashboard", href: "/dashboard", icon: Home, exact: true },
    { title: "Categories", href: "/dashboard/categories", icon: Tag },
    { title: "Products", href: "/dashboard/products", icon: Package },
    { title: "Delivery Cost", href: "/dashboard/delivery", icon: TruckIcon },
    { title: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
    { title: "Profit", href: "/dashboard/profit", icon: CurrencyIcon },
    { title: "Revenue", href: "/dashboard/revenue", icon: GitFork },
    { title: "Referrals", href: "/dashboard/referrals", icon: GiftIcon },
    { title: "Payout", href: "/dashboard/payout", icon: Currency },
    { title: "User Referral Details", href: "/dashboard/userDetails", icon: UserIcon },
    { title: "Customers", href: "/dashboard/users", icon: User },
    { title: "New Arrivals", href: "/dashboard/new-arrivals", icon: SheetIcon },
    { title: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const userNavItems = [
    { title: "Dashboard", href: "/dashboard", icon: Home, exact: true },
    { title: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
    { title: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const customerNavItems = [
    { title: "Dashboard", href: "/dashboard", icon: Home, exact: true },
    { title: "My Orders", href: "/dashboard/my-order", icon: Box },
    { title: "Referral Bonus", href: "/dashboard/my-referral", icon: Gift },
    { title: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const navItems =
    userRole === "Admin"
      ? adminNavItems
      : userRole === "User"
      ? userNavItems
      : customerNavItems;

  const isNavItemActive = (item) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/auth/login");
  };

  const handleClearCartWithToast = () => {
    clearCart();
    toast.success("Cart cleared");
  };

  // Handle navigation to cart with loader
  const handleNavigateToCart = () => {
    setIsNavigatingToCart(true);
    router.push("/cart");
  };

  // Handle navigation to checkout with loader
  const handleNavigateToCheckout = () => {
    setIsNavigatingToCheckout(true);
    router.push("/checkout");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0">
            <div className="flex items-center justify-center border-b px-4 py-3">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="https://res.cloudinary.com/djr7uqara/image/upload/v1757276957/x5jwhjxsbak613duhbn3.png"
                  alt="PureLuxury Logo"
                  width={120}
                  height={48}
                  className="rounded-lg object-contain"
                  priority
                />
              </Link>
            </div>
            <nav className="flex flex-col gap-2 p-3 overflow-y-auto">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isNavItemActive(item)
                      ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white"
                      : "hover:bg-gray-100"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                  {item.badge && (
                    <Badge className="ml-auto flex h-6 w-6 items-center justify-center rounded-full">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
              {/* Added visible logout link in sidebar */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100 text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Only show logo on desktop, not on mobile */}
        <Link href="/" className="hidden md:flex items-center gap-2">
          <div className="relative h-10 w-28 md:h-14 md:w-40 transition-all duration-300 hover:opacity-90">
            <div className="relative w-[70px] h-[40px] sm:w-[90px] sm:h-[45px] md:w-[120px] md:h-[60px] mx-auto">
              <Image
                src="https://res.cloudinary.com/djr7uqara/image/upload/v1757276957/x5jwhjxsbak613duhbn3.png"
                alt="PureLuxury"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 640px) 70px, (max-width: 768px) 90px, 120px"
              />
            </div>
          </div>
        </Link>

        <div className="flex-1"></div>

        {/* Show Shop link on mobile */}
        <div className="md:hidden flex items-center">
          <Link
            href="/"
            className="flex items-center px-3 py-2 rounded-md transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white text-sm cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span>Shop</span>
            </div>
          </Link>
        </div>

        {/* Added visible logout button on desktop */}
        <div className="hidden md:flex items-center gap-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>

          <Link
            href="/"
            className="flex items-center px-3 py-2 rounded-md transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white text-sm cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span>Shop</span>
            </div>
          </Link>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative cursor-pointer"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Shopping cart</span>
              {getTotalItems() > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 bg-blue-600">
                  {getTotalItems()}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Cart ({getTotalItems()})
                </h3>
                {cartItems.length > 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleClearCartWithToast}
                    className="text-destructive cursor-pointer"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Your cart is empty
                </p>
              ) : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-100 border rounded-md w-12 h-12 flex items-center justify-center">
                            {item.defaultImage ? (
                              <Image
                                src={item.defaultImage}
                                alt={item.name}
                                width={48}
                                height={48}
                                className="object-cover rounded-md"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatNaira(getEffectivePrice(item))} ×{" "}
                              {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {formatNaira(
                              getEffectivePrice(item) * item.quantity
                            )}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive/90 cursor-pointer"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between pt-2 border-t">
                      <span>Subtotal</span>
                      <span className="font-semibold">
                        {formatNaira(getTotalPrice())}
                      </span>
                    </div>

                    {/* View Cart Button with Loader */}
                    <Button
                      className="w-full cursor-pointer bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500"
                      onClick={handleNavigateToCart}
                      disabled={isNavigatingToCart}
                    >
                      {isNavigatingToCart ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "View Cart"
                      )}
                    </Button>

                    {/* Checkout Button with Loader */}
                    <Button
                      className="w-full cursor-pointer"
                      variant="secondary"
                      onClick={handleNavigateToCheckout}
                      disabled={isNavigatingToCheckout}
                    >
                      {isNavigatingToCheckout ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Checkout"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full cursor-pointer"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={session?.user?.image || "/placeholder-user.jpg"}
                  alt="User"
                />
                <AvatarFallback>{userRole?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {session?.user?.name || "My Account"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/dashboard/settings">
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-r md:block">
          <nav className="flex flex-col gap-2 p-3 h-[calc(100vh-4rem)] overflow-y-auto">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer",
                  isNavItemActive(item)
                    ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white"
                    : "hover:bg-gray-100"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
                {item.badge && (
                  <Badge className="ml-auto flex h-6 w-6 items-center justify-center rounded-full">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
            {/* Added visible logout link in sidebar */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100 text-red-600"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </nav>
        </aside>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function Menu(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}