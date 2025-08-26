// components/revenue-dashboard.jsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Filter, 
  Calendar,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  BarChart3,
  Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/pagination-controls';
import { toast } from 'sonner';
import { getRevenueData, exportRevenueData } from '@/actions/revenue';

export default function RevenueDashboard() {
  const [revenueData, setRevenueData] = useState([]);
  const [totals, setTotals] = useState({});
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    startDate: null,
    endDate: null,
    status: 'all',
    page: 1,
    limit: 10
  });

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const result = await getRevenueData({
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        status: filters.status
      });

      if (result.success) {
        setRevenueData(result.data);
        setTotals(result.totals || {});
        setPagination(result.pagination || {});
      } else {
        toast.error('Failed to fetch revenue data', {
          description: result.message
        });
      }
    } catch (error) {
      toast.error('Error fetching revenue data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportRevenueData({
        search: filters.search,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        status: filters.status
      });

      if (result.success) {
        // Convert data to CSV
        const headers = Object.keys(result.data[0] || {}).join(',');
        const csvData = result.data.map(row => 
          Object.values(row).map(value => 
            typeof value === 'string' && value.includes(',') ? `"${value}"` : value
          ).join(',')
        ).join('\n');

        const csvContent = [headers, ...csvData].join('\n');
        
        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Export completed successfully');
      } else {
        toast.error('Failed to export data');
      }
    } catch (error) {
      toast.error('Error exporting data');
      console.error('Error:', error);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, [filters.page, filters.limit, filters.status, filters.startDate, filters.endDate, filters.search]);

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleDateChange = (type, date) => {
    setFilters(prev => ({ ...prev, [type]: date, page: 1 }));
  };

  const handleStatusChange = (value) => {
    setFilters(prev => ({ ...prev, status: value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount || 0);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-NG').format(number || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'secondary',
      processing: 'default',
      shipped: 'default',
      delivered: 'success',
      cancelled: 'destructive',
      refunded: 'destructive'
    };

    return (
      <Badge variant={statusColors[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Revenue Dashboard</h1>
          <p className="text-muted-foreground">Track your business revenue and performance</p>
        </div>
        <Button onClick={handleExport} disabled={exporting}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {/* Summary Cards - Using totals from getRevenueData */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(totals.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">Net profit</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(totals.totalSales)}</div>
                <p className="text-xs text-muted-foreground">Gross sales</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatNumber(totals.totalOrders)}</div>
                <p className="text-xs text-muted-foreground">Paid orders</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatNumber(totals.totalQuantity)}</div>
                <p className="text-xs text-muted-foreground">Items sold</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    (totals.totalShippingFee || 0) + 
                    (totals.totalPaystackCharges || 0) + 
                    (totals.totalRefereeEarning || 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Shipping, Fees & Referrals
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter revenue data by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <DatePicker
                selected={filters.startDate}
                onSelect={(date) => handleDateChange('startDate', date)}
                placeholder="Select start date"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <DatePicker
                selected={filters.endDate}
                onSelect={(date) => handleDateChange('endDate', date)}
                placeholder="Select end date"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Table - Added Quantity column */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Details</CardTitle>
          <CardDescription>
            Detailed breakdown of revenue, costs, and profits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S/N</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Order Price</TableHead>
                      <TableHead>Items Cost</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Gross Profit</TableHead>
                      <TableHead>Shipping</TableHead>
                      <TableHead>Referee</TableHead>
                      <TableHead>Referee Earning</TableHead>
                      <TableHead>Paystack Fees</TableHead>
                      <TableHead>Net Revenue</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueData.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>{item.sn}</TableCell>
                        <TableCell className="font-medium">{item.orderId}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.user?.name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">{item.user?.email || ''}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(item.totalPrice)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(item.totalItemsCost)}
                        </TableCell>
                        <TableCell>
                          {formatNumber(item.totalQuantity)}
                        </TableCell>
                        <TableCell>
                          <span className={item.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(item.profitLoss)}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(item.shippingFee)}</TableCell>
                        <TableCell>
                          {item.referee ? (
                            <div>
                              <div className="font-medium">{item.referee.name}</div>
                              <div className="text-sm text-muted-foreground">{item.referee.email}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.refereeEarning > 0 ? (
                            <div>
                              <div className="text-red-600">-{formatCurrency(item.refereeEarning)}</div>
                              <div className="text-sm text-muted-foreground">{item.refereePercentage}%</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-red-600">-{formatCurrency(item.paystackCharges)}</div>
                            <div className="text-sm text-muted-foreground capitalize">{item.paymentChannel}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <span className={item.revenue >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(item.revenue)}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {revenueData.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="mx-auto h-12 w-12 mb-4" />
                  <p>No revenue data found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              )}

              {pagination.pages > 1 && (
                <div className="mt-6">
                  <PaginationControls
                    currentPage={filters.page}
                    totalPages={pagination.pages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}

              {/* Totals */}
              {revenueData.length > 0 && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Page Totals</h3>
                  <div className="grid grid-cols-2 md:grid-cols-7 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Sales</div>
                      <div className="font-medium">{formatCurrency(totals.totalSales)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Items Cost</div>
                      <div className="font-medium">{formatCurrency(totals.totalItemsCost)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Quantity</div>
                      <div className="font-medium">{formatNumber(totals.totalQuantity)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Gross Profit</div>
                      <div className="font-medium">{formatCurrency(totals.totalProfitLoss)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Shipping</div>
                      <div className="font-medium">{formatCurrency(totals.totalShippingFee)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Referee Earnings</div>
                      <div className="font-medium text-red-600">-{formatCurrency(totals.totalRefereeEarning)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Paystack Fees</div>
                      <div className="font-medium text-red-600">-{formatCurrency(totals.totalPaystackCharges)}</div>
                    </div>
                    <div className="md:col-span-7 border-t pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <div className="text-muted-foreground font-medium">Net Revenue</div>
                        <div className="font-bold text-green-600 text-lg">
                          {formatCurrency(totals.totalRevenue)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}