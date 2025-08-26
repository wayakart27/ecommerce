"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Edit, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { PaginationControls } from "@/components/pagination-controls";

import { toast } from "sonner";
import { deleteProduct, getAllProducts, getAllCategories} from "@/actions/products";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productToDelete, setProductToDelete] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [loading, setLoading] = useState(false);

  const itemsPerPage = 8;

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await getAllCategories();
        setCategories(categoriesData);
      } catch (error) {
        toast.error("Failed to load categories");
      }
    };
    loadCategories();
  }, []);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Fetch products when filters change
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const { products: fetchedProducts, pagination } = await getAllProducts(
          currentPage,
          itemsPerPage,
          debouncedSearchTerm,
          selectedCategory === "all" ? "" : selectedCategory
        );

        setProducts(fetchedProducts || []);
        setTotalPages(pagination?.pages || 1);
      } catch (error) {
        toast.error("Error fetching products", {
          description: "There was an error loading the product list.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [currentPage, debouncedSearchTerm, selectedCategory]);

  const handleDelete = async (id) => {
    const product = products.find((p) => p._id === id);
    if (!product) return;

    setActionInProgress(id);

    try {
      const result = await deleteProduct(id);
      
      if (result.success) {
        setProducts((prev) => prev.filter((p) => p._id !== id));
        toast.success(`${product.name} has been deleted successfully.`);
      } else {
        toast.error(result.error || "Failed to delete product");
      }
    } catch (error) {
      toast.error("An unexpected error occurred while deleting the product");
    } finally {
      setActionInProgress(null);
      setProductToDelete(null);
    }
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setCurrentPage(1); // Reset to first page when category changes
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <Button asChild>
          <Link href="/dashboard/products/add">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Product Management</CardTitle>
          <CardDescription>
            Manage your products, add new ones, or update existing ones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S/N</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Category
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Market Price</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Purchase Price
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Selling Price
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <>
                    {[...Array(3)].map((_, index) => (
                      <TableRow
                        key={`loading-${index}`}
                        className="animate-pulse"
                      >
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
                        <TableCell className="hidden md:table-cell">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="h-8 bg-gray-200 rounded w-8 mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      {debouncedSearchTerm || selectedCategory !== "all"
                        ? "No products match your filters."
                        : "No products found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product, index) => (
                    <TableRow
                      key={product._id}
                      className={
                        actionInProgress === product._id ? "opacity-60" : ""
                      }
                    >
                      <TableCell className="font-medium">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {product?.productId || "-"}
                      </TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {product.category?.name || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: "NGN",
                          minimumFractionDigits: 2,
                        }).format(product.price || 0)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: "NGN",
                          minimumFractionDigits: 2,
                        }).format(product.purchasePrice || 0)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: "NGN",
                          minimumFractionDigits: 2,
                        }).format(product.discountedPrice || 0)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {product?.stock || 0}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.isActive ? "default" : "destructive"
                          }
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={actionInProgress === product._id}
                            >
                              {actionInProgress === product._id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/products/edit/${product._id}`}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => {
                                e.preventDefault();
                                if (actionInProgress === null) {
                                  setProductToDelete(product._id);
                                }
                              }}
                              disabled={actionInProgress !== null}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      <AlertDialog
        open={!!productToDelete}
        onOpenChange={(open) => {
          if (!open) setProductToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setProductToDelete(null)}
              disabled={actionInProgress !== null}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (productToDelete && actionInProgress === null) {
                  handleDelete(productToDelete);
                }
              }}
              className="bg-destructive text-white"
              disabled={actionInProgress !== null}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}