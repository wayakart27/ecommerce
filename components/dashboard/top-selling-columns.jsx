// components/dashboard/top-selling-columns.jsx
import { formatNaira } from '@/lib/utils';
import Image from 'next/image';

export const TopSellingColumns = [
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
        <span className="font-medium">{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: "totalQuantity",
    header: "Quantity Sold",
    cell: ({ row }) => (
      <div className="text-right">
        {row.getValue("totalQuantity")}
      </div>
    ),
  },
  {
    accessorKey: "totalRevenue",
    header: "Total Revenue",
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatNaira(row.getValue("totalRevenue"))}
      </div>
    ),
  }
];