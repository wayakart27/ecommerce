"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ShoppingCart,
  Truck,
  Box,
  Package,
  CheckCircle,
  List,
  ArrowRight,
  Sheet,
  CreditCard,
  DollarSign,
  User,
} from "lucide-react";
import {
  getAdminDashboardData,
  getCustomerDashboardData,
  getUserDashboardData,
} from "@/actions/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import SalesChart from "@/components/dashboard/sales-chart";
import CustomerChart from "@/components/dashboard/customer-chart";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (status === "authenticated") {
        setLoading(true);

        try {
          let data;
          if (session?.user?.role === "Admin") {
            data = await getAdminDashboardData(timeRange);
          } else if (session?.user?.role === "User") {
            data = await getUserDashboardData(timeRange);
          } else {
            data = await getCustomerDashboardData(session?.user?.id);
          }

          setDashboardData(data);
        } catch (error) {
          console.error("Failed to load dashboard data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();
  }, [status, session, timeRange]);

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
  };

  if (status === "loading" || loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {session?.user?.role === "Admin"
            ? "Admin Dashboard"
            : session?.user?.role === "User"
            ? "Staff Dashboard"
            : "My Dashboard"}
        </h1>

        {["Admin", "User"].includes(session?.user?.role) && (
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {session?.user?.role === "Admin" ? (
        <AdminDashboard data={dashboardData} timeRange={timeRange} />
      ) : session?.user?.role === "User" ? (
        <StaffDashboard data={dashboardData} timeRange={timeRange} />
      ) : (
        <CustomerDashboard data={dashboardData} />
      )}
    </div>
  );
}

// Skeleton Loader Component
const DashboardSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="flex justify-between items-center">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-32" />
    </div>

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32 mt-2" />
            <Skeleton className="h-4 w-48 mt-3" />
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  </div>
);

// Admin Dashboard Component
const AdminDashboard = ({ data, timeRange }) => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <DashboardCard
        title="Total Sales"
        value={data?.formattedSales}
        icon={<DollarSign className="h-5 w-5" />}
        description={`Current ${timeRange} sales`}
      />

      <DashboardCard
        title="Total Orders"
        value={data?.totalOrders}
        icon={<ShoppingCart className="h-5 w-5" />}
        description={`Current ${timeRange} orders`}
      />

      <DashboardCard
        title="Total Customers"
        value={data?.totalCustomers}
        icon={<User className="h-5 w-5" />}
        description={`New customers this ${timeRange}`}
      />

      <DashboardCard
        title="Pending Delivery"
        value={data?.pendingDelivery}
        icon={<Package className="h-5 w-5" />}
        description="Orders awaiting delivery"
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesChart data={data?.salesData} timeRange={timeRange} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
          <CardDescription>
            Most popular products by sales volume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Sales</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.topSellingProducts?.map((product) => (
                <TableRow key={product?.productId}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {product?.defaultImage ? (
                        <img
                          src={product?.defaultImage}
                          alt={product?.name}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                      )}
                      {product?.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {product?.totalQuantity}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                    }).format(product?.discountedPrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                    }).format(product?.totalSales)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>
);

// Staff Dashboard Component
const StaffDashboard = ({ data, timeRange }) => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <DashboardCard
        title="Total Orders"
        value={data?.totalOrders}
        icon={<ShoppingCart className="h-5 w-5" />}
        description={`Current ${timeRange} orders`}
      />

      <DashboardCard
        title="Payment Pending"
        value={data?.pendingDelivery}
        icon={<Truck className="h-5 w-5" />}
        description="Orders awaiting payments"
      />

      <DashboardCard
        title="Total Products"
        value={data?.totalProducts}
        icon={<Package className="h-5 w-5" />}
        description="Available in inventory"
      />

      <DashboardCard
        title="Completed Orders"
        value={data?.completedOrders}
        icon={<CheckCircle className="h-5 w-5" />}
        description={`Delivered this ${timeRange}`}
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Order Status Breakdown</CardTitle>
          <CardDescription>Distribution of order statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.orderStatusBreakdown
                ?.filter(
                  (status) =>
                    status.status === "processing" ||
                    status.status === "shipped" ||
                    status.status === "delivered"
                )
                ?.map((status) => (
                  <TableRow key={status.status}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {status.status === "processing" && (
                          <List className="h-4 w-4 text-blue-500" />
                        )}
                        {status.status === "shipped" && (
                          <Truck className="h-4 w-4 text-orange-500" />
                        )}
                        {status.status === "delivered" && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <span className="capitalize">{status.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{status.count}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Actions</CardTitle>
          <CardDescription>Orders requiring attention</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <PendingActionCard
              title="Prcessing Orders"
              value={data?.pendingOrders}
              description="Orders in processing"
              icon={<List className="h-5 w-5" />}
              link="/dashboard/orders"
            />

            <PendingActionCard
              title="Payment Pending"
              value={data?.pendingDelivery}
              description="Orders awaiting payments"
              icon={<Truck className="h-5 w-5" />}
              link="/dashboard/orders"
            />
          </div>

          <Button asChild className="mt-4">
            <Link href="/dashboard/orders">
              View All Orders <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
);

// Customer Dashboard Component
const CustomerDashboard = ({ data }) => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <DashboardCard
        title="Total Purchases"
        value={data.formattedPurchases}
        icon={<CreditCard className="h-5 w-5" />}
        description="Your total spending"
      />

      <DashboardCard
        title="Total Orders"
        value={data.totalOrders}
        icon={<ShoppingCart className="h-5 w-5" />}
        description="All your orders"
      />

      <DashboardCard
        title="Total Deliveries"
        value={data.totalDeliveries}
        icon={<Truck className="h-5 w-5" />}
        description="Completed deliveries"
      />

      <DashboardCard
        title="Pending Deliveries"
        value={data.pendingDeliveries}
        icon={<Box className="h-5 w-5" />}
        description="On the way to you"
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>Your monthly order activity</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerChart data={data.orderHistory} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently Added Products</CardTitle>
          <CardDescription>New products in our store</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Product</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.recentProducts?.map((product) => (
                <TableRow key={product?._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product?.defaultImage ? (
                        <img
                          src={product?.defaultImage}
                          alt={product?.name}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                      )}
                      <div className="relative group">
                        <span className="font-medium line-clamp-1 max-w-[180px]">
                          {product?.name.length > 20
                            ? `${product?.name.slice(0, 25)}...`
                            : product?.name}
                        </span>
                        {product?.name.length > 20 && (
                          <div className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap bottom-full left-0 mb-1">
                            {product?.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{product?.price}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="link" size="sm">
                      <Link href={`/product/${product.slug}-${product.productId}`}>
                        View <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>
);

// Reusable Dashboard Card Component
const DashboardCard = ({ title, value, icon, description }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="h-5 w-5 text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
);

// Pending Action Card Component for Staff Dashboard
const PendingActionCard = ({ title, value, description, icon, link }) => (
  <Card className="hover:bg-accent transition-colors">
    <Link href={link}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-5 w-5 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Link>
  </Card>
);
