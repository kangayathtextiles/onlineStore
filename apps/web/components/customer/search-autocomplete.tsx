"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Search, X, Loader2, Shirt, ChevronRight } from "lucide-react";
import { publicApi } from "@/lib/api";
import { ProductImage } from "@/components/ui/product-image";
import type { PublicProductSummary } from "@/types/api";

export interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (query: string) => void;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
}

export function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  placeholder = "Search title, fabric, code...",
  inputRef,
  className = "",
}: SearchAutocompleteProps) {
  const router = useRouter();
  const internalInputRef = React.useRef<HTMLInputElement | null>(null);
  const activeInputRef = inputRef || internalInputRef;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const [debouncedQuery, setDebouncedQuery] = React.useState(value);

  // 250ms debounce for suggestion fetching
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(value.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [value]);

  // SWR for suggestions: deduplicated, cached, and race-condition protected
  const shouldFetch = isOpen && debouncedQuery.length >= 2;
  const { data, isLoading } = useSWR(
    shouldFetch ? ["search-autocomplete", debouncedQuery] : null,
    async () => {
      const res = await publicApi.products.list({
        search: debouncedQuery,
        page: 1,
        page_size: 5,
      });
      return res.items;
    },
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  const suggestions: PublicProductSummary[] = data || [];

  // Reset highlighted index when suggestions change or query changes
  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [debouncedQuery]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleSelectProduct = (product: PublicProductSummary) => {
    setIsOpen(false);
    router.push(`/products/${encodeURIComponent(product.slug)}`);
  };

  const handleExecuteSearch = (query: string) => {
    setIsOpen(false);
    if (onSubmit) {
      onSubmit(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleExecuteSearch(value);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectProduct(suggestions[highlightedIndex]);
        } else {
          handleExecuteSearch(value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleClear = () => {
    onChange("");
    setDebouncedQuery("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    activeInputRef.current?.focus();
    if (onSubmit) {
      onSubmit("");
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input container */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={activeInputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen && debouncedQuery.length >= 2}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls="autocomplete-suggestions"
          aria-activedescendant={
            highlightedIndex >= 0 ? `suggestion-item-${highlightedIndex}` : undefined
          }
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (value.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className="w-full h-10 pl-9 pr-9 rounded-xl border border-zinc-200 bg-white/90 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-burgundy focus:border-transparent transition-all shadow-xs"
        />

        {/* Clear or Loading Spinner */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && debouncedQuery.length >= 2 && (
            <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
          )}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-zinc-400 hover:text-zinc-700 transition-colors rounded-full"
              aria-label="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown Popover */}
      {isOpen && debouncedQuery.length >= 2 && (
        <div
          id="autocomplete-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-amber-950/10 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 sm:min-w-[320px]"
        >
          {/* Header indicator */}
          <div className="px-3.5 py-2 bg-zinc-50/80 border-b border-zinc-100 flex items-center justify-between text-[11px] font-semibold text-zinc-500">
            <span>Product Suggestions</span>
            {suggestions.length > 0 && <span>{suggestions.length} found</span>}
          </div>

          {/* Results list or Empty State */}
          {suggestions.length === 0 && !isLoading ? (
            <div className="px-4 py-6 text-center space-y-1">
              <Shirt className="w-6 h-6 text-zinc-300 mx-auto" />
              <p className="text-xs font-semibold text-zinc-700">No garments matching &ldquo;{debouncedQuery}&rdquo;</p>
              <p className="text-[11px] text-zinc-400">
                Try searching by fabric (Kasavu, Silk), style code, or occasion.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
              {suggestions.map((item, idx) => {
                const isHighlighted = idx === highlightedIndex;
                return (
                  <div
                    key={item.id}
                    id={`suggestion-item-${idx}`}
                    role="option"
                    aria-selected={isHighlighted}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelectProduct(item)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${
                      isHighlighted ? "bg-amber-50/70" : "hover:bg-zinc-50"
                    }`}
                  >
                    {/* Thumbnail preview */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-100 border border-zinc-200/80 flex items-center justify-center">
                      {item.primary_image_url ? (
                        <ProductImage
                          src={item.primary_image_url}
                          alt={item.name}
                          aspectRatio="square"
                          fit="cover"
                          zoomOnHover={false}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Shirt className="w-5 h-5 text-zinc-400" />
                      )}
                    </div>

                    {/* Garment Details */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-zinc-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5 truncate">
                        {item.category_name && <span>{item.category_name}</span>}
                        {item.material && (
                          <>
                            <span>•</span>
                            <span className="truncate">{item.material}</span>
                          </>
                        )}
                        {item.style_code && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-zinc-400">{item.style_code}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stock pill & Arrow */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          item.is_available
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {item.is_available ? "In Stock" : "Sold Out"}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer CTA: View all results in catalog */}
          {debouncedQuery && (
            <div
              onClick={() => handleExecuteSearch(debouncedQuery)}
              className="p-2.5 bg-zinc-50 border-t border-zinc-100 text-center cursor-pointer hover:bg-zinc-100 transition-colors"
            >
              <span className="text-xs font-semibold text-burgundy hover:underline">
                View all results for &ldquo;{debouncedQuery}&rdquo; →
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
