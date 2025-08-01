"use client";

import { useState, useEffect } from "react";
import {
  Edit,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenuSeparator,
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
import { PaginationControls } from "@/components/pagination-controls";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import slugify from "slugify";
import {
  createCategory,
  deleteCategory,
  getCategories,
  toggleCategoryStatus,
  updateCategory,
} from "@/actions/categories";

export default function CategoriesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page")) || 1
  );
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    status: "Active",
  });

  const [actionInProgress, setActionInProgress] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    page: 1,
    limit: 6,
  });

  // Fetch categories when page or search term changes
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const result = await getCategories(
          currentPage,
          pagination.limit,
          searchTerm
        );

        setCategories(result.categories);
        setPagination(result.pagination);

        // Update URL
        const params = new URLSearchParams();
        if (currentPage > 1) params.set("page", currentPage.toString());
        if (searchTerm) params.set("search", searchTerm);
        router.replace(`?${params.toString()}`);
      } catch (error) {
        toast.error("Failed to load categories");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [currentPage, searchTerm, pagination.limit]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Reset to first page when searching
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    const categoryToRemove = categories.find((category) => category._id === id);
    const categoryName = categoryToRemove?.name || id;

    setActionInProgress(id);

    try {
      const deletedCategory = await deleteCategory(id);

      if (!deletedCategory.success) {
        toast.error("Category Error!", {
          description: deletedCategory.error,
        });
      }

      const result = await getCategories(
        currentPage,
        pagination.limit,
        searchTerm
      );
      setCategories(result.categories);
      setPagination(result.pagination);

      if (deletedCategory.success) {
        toast.success("Category ", {
          description: "Category deleted Successfully",
        });
      }
    } catch (error) {
      toast.error("Failed to delete category");
      console.error(error);
    } finally {
      setActionInProgress(null);
      setCategoryToDelete(null);
    }
  };

  const handleAddCategory = async () => {
    const { name, description, status } = newCategory;
    const slug = slugify(name, { lower: true, strict: true });

    setIsSubmitting(true);

    const categoryData = {
      name,
      description,
      status,
      slug,
    };

    try {
      const result = await createCategory(categoryData);

      if (result.success) {
        // Refetch categories
        const updatedCategories = await getCategories(
          currentPage,
          pagination.limit,
          searchTerm
        );
        setCategories(updatedCategories.categories);
        setPagination(updatedCategories.pagination);

        setNewCategory({
          name: "",
          description: "",
          status: "Active",
        });
        toast.success("Category Added", {
          description: "Category added successfully!",
        });
        setIsAddDialogOpen(false);
      } else {
        toast.error("Failed to add category", { description: result.error[0]?.message || result.error });
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while adding the category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory) return;

    setIsSubmitting(true);

    try {
      const updatedResult = await updateCategory(
        editingCategory._id,
        editingCategory
      );

      if (!updatedResult.success) {
        toast.success("Category Failed!", {
          description: updatedResult.error,
        });
      }

      // For now, we'll just refetch the data
      const result = await getCategories(
        currentPage,
        pagination.limit,
        searchTerm
      );
      setCategories(result.categories);
      setPagination(result.pagination);

      if (updatedResult.success) {
        toast.success("Category updated", {
          description: updatedResult.message,
        });
      }
    } catch (error) {
      toast.error("Failed to update category");
      console.error(error);
    } finally {
      setIsSubmitting(false);
      setIsEditDialogOpen(false);
      setEditingCategory(null);
    }
  };

  const handleToggleStatus = async (id) => {
    const category = categories.find((category) => category._id === id);
    if (!category) return;

    setActionInProgress(id);

    try {
      const updatedResult = await toggleCategoryStatus(id);

      if (!updatedResult.success) {
        toast.success("Toggle Category", {
          description: updatedResult.error,
        });
      }

      const result = await getCategories(
        currentPage,
        pagination.limit,
        searchTerm
      );
      setCategories(result.categories);
      setPagination(result.pagination);

      if (updatedResult.success) {
        toast.success("Category updated", {
          description: updatedResult.message,
        });
      }
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
              // Reset form when dialog closes
              setTimeout(() => {
                setNewCategory({
                  name: "",
                  description: "",
                  status: "Active",
                });
              }, 100);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new product category.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  placeholder="Enter category name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter category description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={!newCategory.name || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <span className="mr-2">Creating...</span>
                  </div>
                ) : (
                  "Add Category"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Category Management</CardTitle>
          <CardDescription>
            Manage your product categories, add new ones, or update existing
            ones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search categories..."
                className="pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S/N</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Description
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Products
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: pagination.limit }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-4 w-6" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-8 w-8 rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No categories found.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category, key) => (
                    <TableRow
                      key={category._id}
                      className={
                        actionInProgress === category._id ? "opacity-60" : ""
                      }
                    >
                      <TableCell className="font-medium">
                        {key + 1}.
                      </TableCell>
                      <TableCell className="font-medium">
                        {category.categoryId}
                      </TableCell>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {category.description}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {category.productCount || 0}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            category.status === "Active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {category.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={actionInProgress === category._id}
                            >
                              {actionInProgress === category._id ? (
                                <span className="loading-spinner" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingCategory(category);
                                setIsEditDialogOpen(true);
                              }}
                              disabled={actionInProgress !== null}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(category._id)}
                              disabled={actionInProgress !== null}
                            >
                              {category.status === "Active"
                                ? "Deactivate"
                                : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => {
                                e.preventDefault();
                                if (actionInProgress === null) {
                                  setCategoryToDelete(category._id);
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

          {loading && pagination.pages > 1 ? (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          ) : pagination.pages > 1 ? (
            <PaginationControls
              currentPage={currentPage}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
            />
          ) : null}

          <AlertDialog
            open={categoryToDelete !== null}
            onOpenChange={(open) => {
              if (!open) {
                setTimeout(() => setCategoryToDelete(null), 100);
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  category.
                  {categoryToDelete &&
                    categories.find((c) => c._id === categoryToDelete)
                      ?.productCount > 0 && (
                      <span className="mt-2 block text-destructive">
                        Warning: This category contains products. Deleting it
                        may affect product listings.
                      </span>
                    )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (categoryToDelete) {
                      handleDelete(categoryToDelete);
                    }
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <span className="mr-2">Deleting...</span>
                    </div>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) {
                setTimeout(() => setEditingCategory(null), 100);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogDescription>
                  Update the category details.
                </DialogDescription>
              </DialogHeader>
              {editingCategory && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Category Name</Label>
                    <Input
                      id="edit-name"
                      value={editingCategory.name}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editingCategory.description}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleEditCategory} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <span className="mr-2">Saving...</span>
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}