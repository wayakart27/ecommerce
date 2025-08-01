"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { CalendarIcon, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Sample data for charts
const revenueData = [
  { name: "Jan", revenue: 4000, profit: 2400 },
  { name: "Feb", revenue: 3000, profit: 1398 },
  { name: "Mar", revenue: 2000, profit: 9800 },
  { name: "Apr", revenue: 2780, profit: 3908 },
  { name: "May", revenue: 1890, profit: 4800 },
  { name: "Jun", revenue: 2390, profit: 3800 },
  { name: "Jul", revenue: 3490, profit: 4300 },
  { name: "Aug", revenue: 4000, profit: 2400 },
  { name: "Sep", revenue: 3000, profit: 1398 },
  { name: "Oct", revenue: 2000, profit: 9800 },
  { name: "Nov", revenue: 2780, profit: 3908 },
  { name: "Dec", revenue: 3490, profit: 4300 },
]

const salesData = [
  { name: "Mon", sales: 12 },
  { name: "Tue", sales: 19 },
  { name: "Wed", sales: 15 },
  { name: "Thu", sales: 22 },
  { name: "Fri", sales: 30 },
  { name: "Sat", sales: 40 },
  { name: "Sun", sales: 25 },
]

const categoryData = [
  { name: "Electronics", value: 400 },
  { name: "Clothing", value: 300 },
  { name: "Accessories", value: 200 },
  { name: "Home", value: 150 },
  { name: "Fitness", value: 100 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

const trafficData = [
  { name: "Direct", value: 40 },
  { name: "Organic Search", value: 30 },
  { name: "Referral", value: 20 },
  { name: "Social Media", value: 10 },
]

export default function AnalyticsPage() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [date, setDate] = useState(new Date())
  const [dateRange, setDateRange] = useState("30d")


  // Function to format date in a readable format
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Function to filter data based on date range
  const getFilteredData = (data, range) => {
    const today = new Date()
    let days = 30

    switch (range) {
      case "7d":
        days = 7
        break
      case "30d":
        days = 30
        break
      case "90d":
        days = 90
        break
      case "1y":
        days = 365
        break
    }

    // For demo purposes, we'll just return a subset of the data
    return data.slice(-Math.min((days / 30) * data.length, data.length))
  }

  const filteredRevenueData = getFilteredData(revenueData, dateRange)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? formatDate(date) : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={dateRange === "7d" ? "default" : "outline"} size="sm" onClick={() => setDateRange("7d")}>
          Last 7 days
        </Button>
        <Button variant={dateRange === "30d" ? "default" : "outline"} size="sm" onClick={() => setDateRange("30d")}>
          Last 30 days
        </Button>
        <Button variant={dateRange === "90d" ? "default" : "outline"} size="sm" onClick={() => setDateRange("90d")}>
          Last 90 days
        </Button>
        <Button variant={dateRange === "1y" ? "default" : "outline"} size="sm" onClick={() => setDateRange("1y")}>
          Last year
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$45,231.89</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+2350</div>
                <p className="text-xs text-muted-foreground">+12.2% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+573</div>
                <p className="text-xs text-muted-foreground">+10.5% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.2%</div>
                <p className="text-xs text-muted-foreground">+2.5% from last month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue & Profit</CardTitle>
                <CardDescription>Monthly revenue and profit overview</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={filteredRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
                    <XAxis
                      dataKey="name"
                      stroke={isDark ? "#888" : "#888"}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke={isDark ? "#888" : "#888"}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#fff",
                        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                        borderRadius: "6px",
                      }}
                      formatter={(value) => [`$${value}`, ""]}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>Distribution of sales by product category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}`, "Sales"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Sales</CardTitle>
                <CardDescription>Number of sales per day this week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
                    <XAxis
                      dataKey="name"
                      stroke={isDark ? "#888" : "#888"}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis stroke={isDark ? "#888" : "#888"} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#fff",
                        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Where your customers are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={trafficData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {trafficData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, "Traffic"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,350</div>
                <p className="text-xs text-muted-foreground">+12.2% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$59.78</div>
                <p className="text-xs text-muted-foreground">+2.5% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.2%</div>
                <p className="text-xs text-muted-foreground">+0.5% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Refund Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0.8%</div>
                <p className="text-xs text-muted-foreground">-0.2% from last month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales by Payment Method</CardTitle>
                <CardDescription>Distribution of sales by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Credit Card", value: 65 },
                        { name: "PayPal", value: 25 },
                        { name: "Bank Transfer", value: 10 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {[
                        { name: "Credit Card", value: 65 },
                        { name: "PayPal", value: 25 },
                        { name: "Bank Transfer", value: 10 },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, "Sales"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales by Time of Day</CardTitle>
                <CardDescription>When your customers are shopping</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { time: "Morning", sales: 120 },
                      { time: "Afternoon", sales: 180 },
                      { time: "Evening", sales: 240 },
                      { time: "Night", sales: 90 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
                    <XAxis
                      dataKey="time"
                      stroke={isDark ? "#888" : "#888"}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis stroke={isDark ? "#888" : "#888"} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#fff",
                        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                        borderRadius: "6px",
                      }}
                    />
                    <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,245</div>
                <p className="text-xs text-muted-foreground">+15 new this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">28</div>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">Critical attention needed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.6/5</div>
                <p className="text-xs text-muted-foreground">Based on 3,456 reviews</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Best performing products by sales volume</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Wireless Headphones</TableCell>
                      <TableCell className="text-right">1,245</TableCell>
                      <TableCell className="text-right">$161,850</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Smart Watch Pro</TableCell>
                      <TableCell className="text-right">982</TableCell>
                      <TableCell className="text-right">$196,400</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Bluetooth Speaker</TableCell>
                      <TableCell className="text-right">857</TableCell>
                      <TableCell className="text-right">$68,560</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Organic Cotton T-Shirt</TableCell>
                      <TableCell className="text-right">784</TableCell>
                      <TableCell className="text-right">$19,600</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Fitness Tracker</TableCell>
                      <TableCell className="text-right">652</TableCell>
                      <TableCell className="text-right">$39,120</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory Status</CardTitle>
                <CardDescription>Current inventory levels by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    layout="vertical"
                    data={[
                      { category: "Electronics", stock: 450 },
                      { category: "Clothing", stock: 320 },
                      { category: "Accessories", stock: 280 },
                      { category: "Home", stock: 190 },
                      { category: "Fitness", stock: 140 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
                    <XAxis
                      type="number"
                      stroke={isDark ? "#888" : "#888"}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      dataKey="category"
                      type="category"
                      stroke={isDark ? "#888" : "#888"}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#fff",
                        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                        borderRadius: "6px",
                      }}
                    />
                    <Bar dataKey="stock" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12,234</div>
                <p className="text-xs text-muted-foreground">+342 this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8,756</div>
                <p className="text-xs text-muted-foreground">71.6% of total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">New Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">342</div>
                <p className="text-xs text-muted-foreground">+12.5% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Customer Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">68.4%</div>
                <p className="text-xs text-muted-foreground">+2.1% from last month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Demographics</CardTitle>
                <CardDescription>Age distribution of customers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { age: "18-24", customers: 1845 },
                      { age: "25-34", customers: 4320 },
                      { age: "35-44", customers: 3280 },
                      { age: "45-54", customers: 1680 },
                      { age: "55+", customers: 1109 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
                    <XAxis
                      dataKey="age"
                      stroke={isDark ? "#888" : "#888"}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis stroke={isDark ? "#888" : "#888"} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#fff",
                        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                        borderRadius: "6px",
                      }}
                    />
                    <Bar dataKey="customers" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Lifetime Value</CardTitle>
                <CardDescription>Average spending by customer cohort</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={[
                      { month: "Jan", newCustomers: 120, returningCustomers: 240 },
                      { month: "Feb", newCustomers: 132, returningCustomers: 256 },
                      { month: "Mar", newCustomers: 145, returningCustomers: 270 },
                      { month: "Apr", newCustomers: 160, returningCustomers: 285 },
                      { month: "May", newCustomers: 175, returningCustomers: 302 },
                      { month: "Jun", newCustomers: 190, returningCustomers: 320 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
                    <XAxis
                      dataKey="month"
                      stroke={isDark ? "#888" : "#888"}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis stroke={isDark ? "#888" : "#888"} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#fff",
                        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="newCustomers"
                      name="New Customers"
                      stroke="#3b82f6"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="returningCustomers"
                      name="Returning Customers"
                      stroke="#10b981"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
