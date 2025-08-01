import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const topProducts = [
  {
    id: "PRD001",
    name: "Wireless Headphones",
    category: "Electronics",
    price: "$129.99",
    sales: 1245,
    stock: "In Stock",
  },
  {
    id: "PRD002",
    name: "Smart Watch Pro",
    category: "Electronics",
    price: "$199.99",
    sales: 982,
    stock: "Low Stock",
  },
  {
    id: "PRD003",
    name: "Organic Cotton T-Shirt",
    category: "Clothing",
    price: "$24.99",
    sales: 879,
    stock: "In Stock",
  },
  {
    id: "PRD004",
    name: "Stainless Steel Water Bottle",
    category: "Accessories",
    price: "$34.99",
    sales: 765,
    stock: "In Stock",
  },
  {
    id: "PRD005",
    name: "Bluetooth Speaker",
    category: "Electronics",
    price: "$79.99",
    sales: 654,
    stock: "Out of Stock",
  },
];

export function SalesTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead className="hidden md:table-cell">Category</TableHead>
          <TableHead>Price</TableHead>
          <TableHead className="text-right">Sales</TableHead>
          <TableHead className="hidden md:table-cell">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {topProducts.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell className="hidden md:table-cell">{product.category}</TableCell>
            <TableCell>{product.price}</TableCell>
            <TableCell className="text-right">{product.sales}</TableCell>
            <TableCell className="hidden md:table-cell">
              <Badge
                variant={
                  product.stock === "In Stock"
                    ? "default"
                    : product.stock === "Low Stock"
                    ? "outline"
                    : "destructive"
                }
              >
                {product.stock}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
