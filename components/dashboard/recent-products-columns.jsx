// components/dashboard/recent-products-columns.jsx
import Image from 'next/image';
import Link from 'next/link';

export const RecentProductsColumns = [
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        {row.original.image ? (
          <Image 
            src={row.original.image} 
            alt={row.original.name} 
            className="w-10 h-10 rounded-md object-cover"
          />
        ) : (
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
        )}
        <Link 
          href={`/product/${row.original._id}`}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      </div>
    ),
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => (
      <div className="text-right">
        {row.original.price}
      </div>
    ),
  },
  {
    accessorKey: "action",
    header: "",
    cell: ({ row }) => (
      <div className="text-right">
        <Link 
          href={`/products/${row.original.slug}`}
          className="text-sm text-blue-600 hover:underline"
        >
          View 
        </Link>
      </div>
    ),
  }
];