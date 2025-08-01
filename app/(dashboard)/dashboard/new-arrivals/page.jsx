"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, Search, Send } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { getProductsByDateRange, sendNewArrivalsNotification } from "@/actions/products";
import Image from "next/image";

// Helper function to format prices in Naira
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

// Helper to convert local date to UTC start of day
const toUTCStart = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

// Helper to convert local date to UTC end of day
const toUTCEnd = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
};

export default function NewArrivalsPage() {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  // Get date 7 days ago in YYYY-MM-DD format
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(sevenDaysAgoStr);
  const [endDate, setEndDate] = useState(today);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch products within date range
  const fetchProducts = useCallback(async () => {
    if (!startDate || !endDate) return;
    
    setLoading(true);
    try {
      // Convert to UTC dates with start and end of day
      const start = toUTCStart(startDate);
      const end = toUTCEnd(endDate);
      
      const products = await getProductsByDateRange(start, end);
      
      setProducts(products);
      setFilteredProducts(products);
      setSelectedProducts([]);
    } catch (error) {
      toast.error("Failed to load products", { description: error.message });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Handle search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredProducts(products);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(term) || 
        product.description.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term)
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Handle product selection
  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Select all filtered products
  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  // Send email notification
  const sendEmailNotification = async () => {
    if (selectedProducts.length === 0) {
      toast.warning("No products selected", { description: "Please select products to notify about" });
      return;
    }

    setIsSending(true);
    try {
      const result = await sendNewArrivalsNotification(selectedProducts);
      
      if (result.success) {
        toast.success("Notification sent", { 
          description: `Email sent to ${result.recipientCount} customers about ${selectedProducts.length} products`
        });
        setSelectedProducts([]);
      } else {
        toast.error("Failed to send notification", { description: result.error });
      }
    } catch (error) {
      toast.error("Failed to send notification", { description: error.message });
    } finally {
      setIsSending(false);
    }
  };

  // Auto-fetch products when date range changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Format date for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New Arrivals Notification</CardTitle>
          <CardDescription>
            Notify customers about newly added products
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate || today}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center">to</div>
                <div className="flex-1">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={today}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, description, or category..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button 
                className="w-full"
                onClick={fetchProducts}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh Products"}
              </Button>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    {loading ? (
                      <Skeleton className="h-4 w-4 rounded" />
                    ) : (
                      <Checkbox
                        checked={
                          filteredProducts.length > 0 && 
                          selectedProducts.length === filteredProducts.length
                        }
                        onCheckedChange={toggleSelectAll}
                        disabled={filteredProducts.length === 0}
                      />
                    )}
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="hidden sm:table-cell">Added On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <Skeleton className="h-4 w-4 rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-md" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {searchTerm 
                        ? "No products match your search" 
                        : "No products found in selected date range"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleProductSelection(product.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-10 w-10 rounded-md object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{product.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {product.description.substring(0, 40)}
                            </div>
                            <div className="sm:hidden text-xs mt-1">
                              <span className="font-semibold">Category:</span> {product.category}
                            </div>
                            <div className="sm:hidden text-xs">
                              <span className="font-semibold">Added:</span> {formatDisplayDate(product.createdAt)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {product.category}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatPrice(product.price)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {formatDisplayDate(product.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-40" />
              ) : (
                `${selectedProducts.length} of ${filteredProducts.length} product(s) selected`
              )}
            </div>
            {loading ? (
              <Skeleton className="h-10 w-40 rounded-md" />
            ) : (
              <Button
                onClick={sendEmailNotification}
                disabled={selectedProducts.length === 0 || isSending}
              >
                {isSending ? (
                  <>
                    <Send className="mr-2 h-4 w-4 animate-pulse" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Notify Customers
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}