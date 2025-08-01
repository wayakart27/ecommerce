"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { getProfitAnalysis } from "@/actions/profit";
import { PaginationControls } from "@/components/pagination-controls";
import { format, parseISO } from "date-fns";

export default function ProfitAnalysisPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalProfit, setTotalProfit] = useState(0);
  const [itemsCount, setItemsCount] = useState(0);
  const [totalSold, setTotalSold] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0
  });
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    setStartDate(todayStr);
    setEndDate(todayStr);
  }, []);

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) return;
    
    setLoading(true);
    try {
      const result = await getProfitAnalysis(
        startDate, 
        endDate,
        pagination.currentPage, 
        itemsPerPage
      );
      
      setData(result.data || []);
      setTotalProfit(result.totalProfit || 0);
      setItemsCount(result.itemsCount || 0);
      setTotalSold(result.soldPrice || 0);
      setPagination({
        currentPage: result.pagination?.currentPage || 1,
        totalPages: result.pagination?.totalPages || 1,
        totalOrders: result.pagination?.totalOrders || 0
      });
    } catch (error) {
      toast.error("Failed to fetch profit data");
      console.error("Error fetching profit data:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, pagination.currentPage, itemsPerPage]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [fetchData, startDate, endDate]);

  const formatDisplayDate = (dateString) => {
    try {
      if (!dateString) return "N/A";
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
      return format(date, "MMM d, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  const handleApplyDates = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    if (isNaN(start) || isNaN(end)) {
      toast.error("Invalid date values");
      return;
    }
    
    if (start > end) {
      toast.error("Start date cannot be after end date");
      return;
    }
    
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const handleClearFilters = () => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    setStartDate(todayStr);
    setEndDate(todayStr);
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const handleItemsPerPageChange = (e) => {
    const newSize = Number(e.target.value);
    setItemsPerPage(newSize);
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  // Navigate to product profit details
  const navigateToProductDetails = (productId, productName, orderDate) => {
    const dateObj = typeof orderDate === 'string' ? parseISO(orderDate) : orderDate;
    const dateStr = format(dateObj, "yyyy-MM-dd");
    router.push(
      `/dashboard/profit/${productId}?date=${dateStr}&name=${encodeURIComponent(productName)}`
    );
  };

  // Navigate to order details
  const navigateToOrderDetails = (orderId) => {
    router.push(`/dashboard/orders/${orderId}`);
  };

  const today = new Date();
  const todayFormatted = format(today, "yyyy-MM-dd");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Profit Analysis</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Profit Margin Report</CardTitle>
          <CardDescription>
            Analyze profit margins based on completed orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Date Range</label>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                    max={endDate || todayFormatted}
                  />
                </div>
                <span className="text-muted-foreground">to</span>
                <div className="flex-1">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                    min={startDate}
                    max={todayFormatted}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Items per page</label>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="border rounded-md p-2 text-sm w-full"
              >
                {[5, 10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end gap-2 flex-col md:flex-row">
              <Button 
                onClick={handleApplyDates} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Apply Filters
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                className="w-full"
              >
                Reset
              </Button>
            </div>
          </div>
          
          <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800">Total Profit</p>
              <p className="text-xl font-bold text-blue-900">
                {new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  minimumFractionDigits: 2,
                }).format(totalProfit)}
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="text-sm text-green-800">Items Sold</p>
              <p className="text-xl font-bold text-green-900">{itemsCount}</p>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <p className="text-sm text-amber-800">Total Sold</p>
              <p className="text-xl font-bold text-amber-900">
                {new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  minimumFractionDigits: 2,
                }).format(totalSold)}
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 md:col-span-1">
              <p className="text-sm text-purple-800">Date Range</p>
              <p className="font-medium text-purple-900 truncate">
                {formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}
              </p>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold">S/N</TableHead>
                  <TableHead className="font-bold">Order ID</TableHead>
                  <TableHead className="font-bold">Product</TableHead>
                  <TableHead className="font-bold hidden md:table-cell">Category</TableHead>
                  <TableHead className="font-bold text-right">Purchase</TableHead>
                  <TableHead className="font-bold text-right">Selling</TableHead>
                  <TableHead className="font-bold text-right">Qty</TableHead>
                  <TableHead className="font-bold text-right">Sold</TableHead>
                  <TableHead className="font-bold text-right">Profit</TableHead>
                  <TableHead className="font-bold hidden md:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(itemsPerPage)].map((_, index) => (
                    <TableRow key={`loading-${index}`} className="animate-pulse">
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-4 bg-gray-200 rounded w-1/4 ml-auto"></div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-4 bg-gray-200 rounded w-1/4 ml-auto"></div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-4 bg-gray-200 rounded w-1/4 ml-auto"></div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-4 bg-gray-200 rounded w-1/4 ml-auto"></div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-4 bg-gray-200 rounded w-1/4 ml-auto"></div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      {startDate || endDate
                        ? "No records found for the selected date range."
                        : "Please select a date range to view data."}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item, index) => {
                    const serialNumber = (pagination.currentPage - 1) * itemsPerPage + index + 1;
                    
                    return (
                      <TableRow key={`${item.orderId}-${item.productId}-${index}`} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{serialNumber}</TableCell>
                        <TableCell 
                          className="font-mono text-sm text-blue-600 hover:underline cursor-pointer"
                          onClick={() => navigateToOrderDetails(item.id)}
                        >
                          {item.orderId}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          <button
                            onClick={() => navigateToProductDetails(item.productId, item.productName, item.orderDate)}
                            className="text-blue-600 hover:underline text-left cursor-pointer"
                          >
                            {item.productName}
                          </button>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {item.category}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("en-NG", {
                            style: "currency",
                            currency: "NGN",
                            minimumFractionDigits: 2,
                          }).format(item.purchasePrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("en-NG", {
                            style: "currency",
                            currency: "NGN",
                            minimumFractionDigits: 2,
                          }).format(item.sellingPrice)}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {new Intl.NumberFormat("en-NG", {
                            style: "currency",
                            currency: "NGN",
                            minimumFractionDigits: 2,
                          }).format(item.price)}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          item.profit > 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {new Intl.NumberFormat("en-NG", {
                            style: "currency",
                            currency: "NGN",
                            minimumFractionDigits: 2,
                          }).format(item.profit)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {formatDisplayDate(item.orderDate)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            
            {!loading && data.length > 0 && (
              <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}