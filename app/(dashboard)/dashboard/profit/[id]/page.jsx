"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getProductProfitDetails } from "@/actions/profit";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function ProductProfitDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.productId || params?.id;
  const productName = searchParams.get("name") || "Product";
  const dateParam = searchParams.get("date");
  
  const [productData, setProductData] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId && dateParam) {
      fetchProductData();
    }
  }, [productId, dateParam]);

  const fetchProductData = async () => {
    setLoading(true);
    
    try {
      const result = await getProductProfitDetails(
        productId,
        dateParam
      );
      
      setProductData(result.summary || {});
      setDailyData(result.dailyBreakdown || []);
    } catch (error) {
      toast.error("Failed to fetch product profit details");
      console.error("Error fetching product profit details:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  const formatDate = (dateInput) => {
    try {
      if (!dateInput) return "N/A";
      
      // Handle both strings and Date objects
      let date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      
      // Adjust for timezone offset to prevent date shifting
      if (typeof dateInput === 'string' && dateInput.includes('T') === false) {
        // Add time component to prevent timezone conversion
        date = new Date(dateInput + 'T00:00:00');
      }
      
      if (isNaN(date)) return "Invalid date";
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return "Invalid date";
    }
  };

  // Display the original date without adjustment
  const displayDate = dateParam ? formatDate(dateParam) : "N/A";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.back()}
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        {loading ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h1 className="text-2xl font-bold tracking-tight">
            Profit Analysis: {productName} - {(productData.productId)}
          </h1>
        )}
      </div>
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={`top-skeleton-${i}`} className="border">
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-32 mt-2" />
              </CardContent>
            </Card>
          ))
        ) : productData ? (
          <>
            <Card className="bg-blue-50 border-blue-100">
              <CardHeader>
                <CardTitle className="text-blue-800 text-sm">Category</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-blue-900">
                  {productData.category || "N/A"}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 border-green-100">
              <CardHeader>
                <CardTitle className="text-green-800 text-sm">Purchase Price</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-green-900">
                  {formatCurrency(productData.avgPurchasePrice)}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50 border-purple-100">
              <CardHeader>
                <CardTitle className="text-purple-800 text-sm">Selling Price</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-purple-900">
                  {formatCurrency(productData.avgSellingPrice)}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-amber-50 border-amber-100">
              <CardHeader>
                <CardTitle className="text-amber-800 text-sm">Profit Per Item</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-amber-900">
                  {formatCurrency(productData.avgProfit)}
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
      
      {/* Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={`bottom-skeleton-${i}`} className="border">
              <CardHeader>
                <Skeleton className="h-4 w-36" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mt-2" />
              </CardContent>
            </Card>
          ))
        ) : productData ? (
          <>
            <Card className="bg-indigo-50 border-indigo-100">
              <CardHeader>
                <CardTitle className="text-indigo-800 text-sm">Total Items Sold</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-indigo-900">
                  {productData.totalQuantity}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-teal-50 border-teal-100">
              <CardHeader>
                <CardTitle className="text-teal-800 text-sm">Total Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-teal-900">
                  {formatCurrency(productData.totalProfit)}
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
      
      {/* Daily Breakdown Table */}
      <Card>
        <CardHeader>
          {loading ? (
            <Skeleton className="h-6 w-48" />
          ) : (
            <CardTitle>
              Daily Sales Breakdown: {displayDate}
            </CardTitle>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Items Sold</TableHead>
                <TableHead className="text-right">Total Profit</TableHead>
                <TableHead className="text-right">Avg. Selling Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`row-skeleton-${i}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : dailyData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No daily sales data available
                  </TableCell>
                </TableRow>
              ) : (
                dailyData.map((day) => (
                  <TableRow key={day.date} className="hover:bg-gray-50">
                    <TableCell>{formatDate(day.date)}</TableCell>
                    <TableCell className="text-right">{day.quantity}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(day.totalProfit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(day.avgSellingPrice)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}