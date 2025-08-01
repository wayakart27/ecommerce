"use client";

import { Button } from "@/components/ui/button";
import { Edit, Trash2, Check } from "lucide-react";

export const AddressCard = ({ 
  address, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete,
  onSetDefault 
}) => {
  return (
    <div
      className={`p-4 border rounded-lg transition-colors ${
        isSelected ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex justify-between items-start">
        <div 
          className="flex-1 cursor-pointer" 
          onClick={onSelect}
        >
          <p className="font-medium text-gray-700">
            {address.firstName} {address.lastName}
          </p>
          <p className="text-gray-600">{address.address}</p>
          <p className="text-gray-600">
            {address.city}, {address.state}
          </p>
          <p className="text-gray-600">{address.phone}</p>
          <p className="text-gray-600">{address.email}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {address.isDefault ? (
            <span className="text-xs bg-[#D4AF37] text-white px-2 py-1 rounded-full">
              Default
            </span>
          ) : (
            <button
              className="text-xs text-[#D4AF37] hover:underline"
              onClick={() => onSetDefault(address.id)}
            >
              Set as default
            </button>
          )}
          <div className="flex gap-2">
            <button
              className="text-gray-500 hover:text-[#D4AF37]"
              onClick={() => onEdit(address)}
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              className="text-gray-500 hover:text-red-600"
              onClick={() => onDelete(address.id)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};