"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { searchProducts } from "@/actions/search";
import Image from "next/image";

const SearchDialog = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Reset search when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [isOpen]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim() === "") {
        setSearchResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchProducts(searchQuery, 8);
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching products:", error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectProduct = (product) => {
    router.push(`/product/${product.slug}-${product.productId}`);
    onClose();
    setSearchQuery("");
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const highlightMatch = (text, query) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.trim()})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-blue-300 [&_button[aria-label='Close']]:hidden">
        <div className="flex items-center border-b border-blue-200 px-4 py-3">
          <Search className="h-5 w-5 text-gray-400 mr-3" />
          <div className="relative flex-1">
            <Input
              autoFocus
              placeholder="Search phones, laptops, accessories..."
              className="flex h-10 w-full border-0 bg-transparent py-2 pr-8 text-sm outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-blue-50 transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-1 rounded-full hover:bg-blue-50 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <Command className="border-none">
          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm text-gray-500">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  Searching...
                </div>
              ) : searchQuery.trim() ? (
                "No products found. Try another search."
              ) : (
                "Search for phones, laptops, or accessories..."
              )}
            </CommandEmpty>

            {searchResults.length > 0 && !isLoading && (
              <CommandGroup className="max-h-[400px] overflow-y-auto p-2">
                {searchResults.map((product) => (
                  <CommandItem
                    key={product.id}
                    onSelect={() => handleSelectProduct(product)}
                    className="flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                    <div className="h-12 w-12 rounded overflow-hidden flex-shrink-0 border border-blue-100 bg-gray-50">
                      <Image
                        src={product.defaultImage || "/placeholder.svg"}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        width={48}
                        height={48}
                      />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium text-gray-800 truncate">
                        {highlightMatch(product.name, searchQuery)}
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-600 font-medium">
                          {formatPrice(
                            product.discountedPrice || product.price
                          )}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {product.category}
                        </span>
                      </div>
                      {product.stock <= 0 && (
                        <span className="text-xs text-red-500 font-medium">
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;
