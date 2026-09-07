"use client";

import * as React from "react";
import {
  Search,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { customerCatalogApi } from "@/features/customers/api/customer-catalog.api";
import { Select, type SelectOption } from "@/components/ui/select";

export interface CategoryOption {
  id: string;
  name: string;
}

export interface FilterSidebarProps {
  // Categories (handles 200+ categories)
  categories: CategoryOption[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;

  // Selected Product inside category
  selectedProductId?: string | null;
  onSelectProduct?: (productId: string | null) => void;

  // Search by name
  searchQuery: string;
  onSearchChange: (search: string) => void;

  // Sort By
  sortKey: string;
  onSortChange: (sortKey: string) => void;

  // Availability / In Stock
  stockStatus: "all" | "in_stock" | "out_of_stock";
  onStockStatusChange: (status: "all" | "in_stock" | "out_of_stock") => void;

  // Dietary (Veg / Non-Veg)
  vegType: "all" | "veg" | "non_veg";
  onVegTypeChange: (vegType: "all" | "veg" | "non_veg") => void;

  // Price Range Slider
  minPriceLimit?: number;
  maxPriceLimit?: number;
  currentMinPrice: number;
  currentMaxPrice: number;
  onPriceChange: (min: number, max: number) => void;

  // Clear & Active States
  onResetFilters: () => void;
  hasActiveFilters: boolean;

  // Optional styling & mobile drawer state
  className?: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  totalResultsCount?: number;
}

const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
];

export function FilterSidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  selectedProductId = null,
  onSelectProduct,
  searchQuery,
  onSearchChange,
  sortKey,
  onSortChange,
  stockStatus,
  onStockStatusChange,
  vegType,
  onVegTypeChange,
  minPriceLimit = 0,
  maxPriceLimit = 1000,
  currentMinPrice,
  currentMaxPrice,
  onPriceChange,
  onResetFilters,
  hasActiveFilters,
  className = "",
  isMobileOpen = false,
  onCloseMobile,
  totalResultsCount,
}: FilterSidebarProps) {
  // Category accordion & inline search for 200+ categories
  const [isCategoriesOpen, setIsCategoriesOpen] = React.useState(true);
  const [categorySearch, setCategorySearch] = React.useState("");

  // Nested Tree: Single expanded category ID (one open at a time) & cached products per category
  const [expandedCategoryId, setExpandedCategoryId] = React.useState<string | null>(
    () => selectedCategoryId || null
  );
  const [categoryProducts, setCategoryProducts] = React.useState<
    Record<string, Array<{ id: string; name: string }>>
  >({});
  const [loadingCategoryIds, setLoadingCategoryIds] = React.useState<Set<string>>(new Set());

  // Ref to prevent duplicate or runaway in-flight fetches for the same category
  const fetchingRef = React.useRef<Set<string>>(new Set());

  // Auto-expand selected category
  React.useEffect(() => {
    if (selectedCategoryId) {
      setExpandedCategoryId(selectedCategoryId);
      if (
        !categoryProducts[selectedCategoryId] &&
        !fetchingRef.current.has(selectedCategoryId)
      ) {
        fetchingRef.current.add(selectedCategoryId);
        setLoadingCategoryIds((prev) => new Set(prev).add(selectedCategoryId));

        customerCatalogApi
          .getProducts({
            categoryIds: [selectedCategoryId],
            pageSize: 50,
          })
          .then((res) => {
            const prods = (res.data || []).map((p) => ({ id: p.id, name: p.name }));
            setCategoryProducts((prev) => ({ ...prev, [selectedCategoryId]: prods }));
          })
          .catch((err) => {
            console.error("Failed to load products for selected category", selectedCategoryId, err);
          })
          .finally(() => {
            fetchingRef.current.delete(selectedCategoryId);
            setLoadingCategoryIds((prev) => {
              const next = new Set(prev);
              next.delete(selectedCategoryId);
              return next;
            });
          });
      }
    }
  }, [selectedCategoryId, categoryProducts]);

  // Fetch products for a category when user clicks expand chevron (only one open at a time)
  const toggleCategoryExpand = React.useCallback(
    async (categoryId: string, e?: React.MouseEvent) => {
      e?.stopPropagation();

      const isCurrentlyExpanded = expandedCategoryId === categoryId;
      const nextCategoryId = isCurrentlyExpanded ? null : categoryId;
      setExpandedCategoryId(nextCategoryId);

      // If expanding and products not yet loaded or fetching, fetch them once
      if (
        nextCategoryId &&
        !categoryProducts[categoryId] &&
        !fetchingRef.current.has(categoryId)
      ) {
        fetchingRef.current.add(categoryId);
        setLoadingCategoryIds((prev) => new Set(prev).add(categoryId));
        try {
          const res = await customerCatalogApi.getProducts({
            categoryIds: [categoryId],
            pageSize: 50,
          });
          const prods = (res.data || []).map((p) => ({ id: p.id, name: p.name }));
          setCategoryProducts((prev) => ({ ...prev, [categoryId]: prods }));
        } catch (err) {
          console.error("Failed to load products for category", categoryId, err);
        } finally {
          fetchingRef.current.delete(categoryId);
          setLoadingCategoryIds((prev) => {
            const next = new Set(prev);
            next.delete(categoryId);
            return next;
          });
        }
      }
    },
    [expandedCategoryId, categoryProducts]
  );

  // Local state for instant slider responsiveness, debounced to parent
  const [localMinPrice, setLocalMinPrice] = React.useState(currentMinPrice);
  const [localMaxPrice, setLocalMaxPrice] = React.useState(currentMaxPrice);

  React.useEffect(() => {
    setLocalMinPrice(currentMinPrice);
    setLocalMaxPrice(currentMaxPrice);
  }, [currentMinPrice, currentMaxPrice]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localMinPrice !== currentMinPrice || localMaxPrice !== currentMaxPrice) {
        onPriceChange(localMinPrice, localMaxPrice);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [localMinPrice, localMaxPrice, currentMinPrice, currentMaxPrice, onPriceChange]);

  // Memoized category search for fast rendering of 200+ categories
  const filteredCategories = React.useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.toLowerCase().trim();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  // Local search text with instant UI feedback
  const [localSearch, setLocalSearch] = React.useState(searchQuery);
  React.useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, onSearchChange]);

  // Price slider math
  const priceMinPercent = Math.min(
    100,
    Math.max(0, ((localMinPrice - minPriceLimit) / (maxPriceLimit - minPriceLimit)) * 100)
  );
  const priceMaxPercent = Math.min(
    100,
    Math.max(0, ((localMaxPrice - minPriceLimit) / (maxPriceLimit - minPriceLimit)) * 100)
  );

  // Handle internal reset to immediately clear local search, category search, and price slider
  const handleInternalReset = React.useCallback(() => {
    setLocalSearch("");
    setCategorySearch("");
    setLocalMinPrice(minPriceLimit);
    setLocalMaxPrice(maxPriceLimit);
    onResetFilters();
  }, [minPriceLimit, maxPriceLimit, onResetFilters]);

  const sidebarContent = (
    <div className="flex flex-col gap-5 text-[#2D1810]">
      {/* 1. Header: Title & Clear Filter Button */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#F0E4D8]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#7A2224]" />
          <h2 className="text-xs font-black uppercase tracking-wider text-[#2D1810]">
            Filter Snacks
          </h2>
          {totalResultsCount !== undefined && (
            <span className="text-[11px] bg-[#F5ECE1] text-[#7A2224] px-2 py-0.5 rounded-full font-bold">
              {totalResultsCount}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleInternalReset}
          className={`text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer select-none ${
            hasActiveFilters
              ? "text-[#7A2224] hover:text-[#5A1911] hover:underline"
              : "text-[#9C8274] hover:text-[#7A2224]"
          }`}
          title="Clear all filters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear Filter
        </button>
      </div>

      {/* 2. Search Snack by Name */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="filter-search-input"
          className="text-[11px] font-extrabold uppercase tracking-wider text-[#7A6258]"
        >
          Search Snack by Name
        </label>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C8274] pointer-events-none" />
          <input
            id="filter-search-input"
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="e.g. Murukku, Mixture..."
            className="w-full bg-[#FAF6F0] border border-[#DCC7B7] rounded-xl pl-10 pr-9 py-2.5 text-sm text-[#2D1810] placeholder-[#A0887A] focus:outline-none focus:border-[#7A2224] focus:ring-1 focus:ring-[#7A2224] transition-all"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch("");
                onSearchChange("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8274] hover:text-[#2D1810] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Sort By Dropdown */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="filter-sort-select"
          className="text-[11px] font-extrabold uppercase tracking-wider text-[#7A6258]"
        >
          Sort By
        </label>
        <Select
          id="filter-sort-select"
          value={sortKey}
          onValueChange={(val) => onSortChange(val)}
          options={SORT_OPTIONS}
          size="md"
          className="bg-[#FAF6F0] border-[#DCC7B7] rounded-xl text-sm font-medium text-[#2D1810]"
        />
      </div>

      {/* 4. Availability Pills */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7A6258]">
          Availability
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() =>
              onStockStatusChange(stockStatus === "in_stock" ? "all" : "in_stock")
            }
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
              stockStatus === "in_stock"
                ? "bg-[#166534] text-white border border-[#166534] shadow-xs"
                : "bg-white text-[#4A3228] border border-[#DCC7B7] hover:bg-[#FAF6F0]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            In Stock
          </button>

          <button
            type="button"
            onClick={() =>
              onStockStatusChange(stockStatus === "out_of_stock" ? "all" : "out_of_stock")
            }
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
              stockStatus === "out_of_stock"
                ? "bg-[#991B1B] text-white border border-[#991B1B] shadow-xs"
                : "bg-white text-[#4A3228] border border-[#DCC7B7] hover:bg-[#FAF6F0]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Out of Stock
          </button>
        </div>
      </div>

      {/* 5. Dietary (Veg / Non-Veg) Pills */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7A6258]">
          Dietary
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onVegTypeChange(vegType === "veg" ? "all" : "veg")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
              vegType === "veg"
                ? "bg-emerald-700 text-white border border-emerald-700 shadow-xs"
                : "bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Pure Veg
          </button>

          <button
            type="button"
            onClick={() => onVegTypeChange(vegType === "non_veg" ? "all" : "non_veg")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
              vegType === "non_veg"
                ? "bg-red-700 text-white border border-red-700 shadow-xs"
                : "bg-white text-red-800 border border-red-300 hover:bg-red-50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Non-Veg
          </button>
        </div>
      </div>

      {/* 6. Categories -> Product List Nested Tree (Matching Image 3 on light theme) */}
      <div className="flex flex-col gap-2.5 pt-3 border-t border-[#F0E4D8]">
        <button
          type="button"
          onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
          className="flex items-center justify-between w-full text-left cursor-pointer group select-none"
        >
          <span className="text-sm font-extrabold text-[#2D1810] tracking-wide">
            Categories & Products
          </span>
          {isCategoriesOpen ? (
            <ChevronUp className="w-4 h-4 text-[#7A6258] group-hover:text-[#2D1810] transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#7A6258] group-hover:text-[#2D1810] transition-colors" />
          )}
        </button>

        {isCategoriesOpen && (
          <div className="flex flex-col gap-2 mt-1 animate-in fade-in duration-200">
            {/* Inline search box for 200+ categories */}
            {categories.length > 5 && (
              <div className="relative mb-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9C8274]" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full bg-[#FAF6F0] border border-[#DCC7B7] rounded-lg pl-8.5 pr-7 py-1.5 text-xs text-[#2D1810] placeholder-[#A0887A] focus:outline-none focus:border-[#7A2224] transition-all"
                />
                {categorySearch && (
                  <button
                    type="button"
                    onClick={() => setCategorySearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9C8274] hover:text-[#2D1810] transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Scrollable category list with expandable nested products */}
            <div className="max-h-72 overflow-y-auto flex flex-col gap-2 pr-1.5 scrollbar-thin scrollbar-thumb-[#DCC7B7] scrollbar-track-transparent">
              {/* Option: All Snacks */}
              {!categorySearch && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory(null);
                    onSelectProduct?.(null);
                  }}
                  className={`flex items-center gap-2.5 py-1 text-left cursor-pointer group transition-colors select-none ${
                    selectedCategoryId === null && !selectedProductId
                      ? "text-[#1E4D3E] font-bold"
                      : "text-[#3D2C24] hover:text-[#1E4D3E] font-medium"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                      selectedCategoryId === null && !selectedProductId
                        ? "border-[#1E4D3E] bg-[#1E4D3E]/10"
                        : "border-[#5A4338] group-hover:border-[#1E4D3E]"
                    }`}
                  >
                    {selectedCategoryId === null && !selectedProductId && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1E4D3E]" />
                    )}
                  </span>
                  <span
                    className={`text-sm ${
                      selectedCategoryId === null && !selectedProductId
                        ? "underline underline-offset-4 decoration-2 decoration-[#1E4D3E]"
                        : ""
                    }`}
                  >
                    All Snacks
                  </span>
                </button>
              )}

              {/* Category Items with Expand/Collapse and Nested Products */}
              {filteredCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                const isExpanded = expandedCategoryId === cat.id;
                const products = categoryProducts[cat.id] || [];
                const isLoadingProducts = loadingCategoryIds.has(cat.id);

                return (
                  <div key={cat.id} className="flex flex-col">
                    {/* Category Row */}
                    <div className="flex items-center justify-between group py-1">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCategory(isSelected ? null : cat.id);
                          onSelectProduct?.(null);
                          if (!isExpanded) toggleCategoryExpand(cat.id);
                        }}
                        className={`flex items-center gap-2.5 text-left cursor-pointer flex-1 min-w-0 select-none ${
                          isSelected
                            ? "text-[#1E4D3E] font-bold"
                            : "text-[#3D2C24] hover:text-[#1E4D3E] font-medium"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                            isSelected && !selectedProductId
                              ? "border-[#1E4D3E] bg-[#1E4D3E]/10"
                              : isSelected
                              ? "border-[#1E4D3E]"
                              : "border-[#5A4338] group-hover:border-[#1E4D3E]"
                          }`}
                        >
                          {isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#1E4D3E]" />
                          )}
                        </span>
                        <span
                          className={`text-sm truncate ${
                            isSelected && !selectedProductId
                              ? "underline underline-offset-4 decoration-2 decoration-[#1E4D3E]"
                              : ""
                          }`}
                          title={cat.name}
                        >
                          {cat.name}
                        </span>
                      </button>

                      {/* Expand/Collapse Chevron Button */}
                      <button
                        type="button"
                        onClick={(e) => toggleCategoryExpand(cat.id, e)}
                        className="p-1 rounded-md text-[#7A6258] hover:text-[#2D1810] hover:bg-[#F5ECE1] transition-colors cursor-pointer"
                        title={isExpanded ? "Collapse products" : "Expand products"}
                        aria-label={isExpanded ? "Collapse products" : "Expand products"}
                      >
                        {isLoadingProducts ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7A2224]" />
                        ) : isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[#7A2224]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#9C8274]" />
                        )}
                      </button>
                    </div>

                    {/* Nested Products List underneath this Category */}
                    {isExpanded && (
                      <div className="pl-6 pr-1 pt-1 pb-1.5 flex flex-col gap-1.5 border-l-2 border-[#EADCCF] ml-2.5 my-1 animate-in fade-in duration-150">
                        {isLoadingProducts ? (
                          <div className="flex items-center gap-2 py-1 text-xs text-[#9C8274]">
                            <Loader2 className="w-3 h-3 animate-spin text-[#7A2224]" />
                            Loading products...
                          </div>
                        ) : products.length > 0 ? (
                          products.map((prod) => {
                            const isProductActive = selectedProductId === prod.id;
                            return (
                              <button
                                key={prod.id}
                                type="button"
                                onClick={() => {
                                  if (selectedCategoryId !== cat.id) {
                                    onSelectCategory(cat.id);
                                  }
                                  onSelectProduct?.(isProductActive ? null : prod.id);
                                }}
                                className={`flex items-center gap-2 py-0.5 text-left cursor-pointer group transition-colors select-none ${
                                  isProductActive
                                    ? "text-[#1E4D3E] font-bold"
                                    : "text-[#5A4338] hover:text-[#1E4D3E] font-medium"
                                }`}
                              >
                                <span
                                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                                    isProductActive
                                      ? "border-[#1E4D3E] bg-[#1E4D3E]/15"
                                      : "border-[#9C8274] group-hover:border-[#1E4D3E]"
                                  }`}
                                >
                                  {isProductActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E4D3E]" />
                                  )}
                                </span>
                                <span
                                  className={`text-xs truncate ${
                                    isProductActive
                                      ? "underline underline-offset-2 decoration-1 decoration-[#1E4D3E]"
                                      : ""
                                  }`}
                                  title={prod.name}
                                >
                                  {prod.name}
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <span className="text-[11px] text-[#9C8274] italic py-0.5">
                            No products found in this category
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredCategories.length === 0 && (
                <p className="text-xs text-[#9C8274] py-2 text-center">
                  No matching categories
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 7. Budget / Price Range Slider */}
      <div className="flex flex-col gap-3 pt-3 border-t border-[#F0E4D8]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7A6258]">
            Budget
          </span>
          <span className="text-xs font-bold text-[#7A2224]">
            {formatPrice(localMinPrice)} – {formatPrice(localMaxPrice)}
          </span>
        </div>

        {/* Dual Thumb Range Track */}
        <div className="relative pt-3 pb-2 px-1">
          {/* Base track */}
          <div className="w-full h-2 bg-[#EADCCF] rounded-full relative">
            {/* Active highlighted range */}
            <div
              className="absolute h-2 bg-[#7A2224] rounded-full"
              style={{
                left: `${priceMinPercent}%`,
                width: `${Math.max(0, priceMaxPercent - priceMinPercent)}%`,
              }}
            />
          </div>

          {/* Overlaid native range inputs for dual thumb operation */}
          <input
            type="range"
            min={minPriceLimit}
            max={maxPriceLimit}
            step={10}
            value={localMinPrice}
            onChange={(e) => {
              const val = Math.min(Number(e.target.value), localMaxPrice - 10);
              setLocalMinPrice(val);
            }}
            className="absolute top-2.5 left-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#7A2224] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none"
          />

          <input
            type="range"
            min={minPriceLimit}
            max={maxPriceLimit}
            step={10}
            value={localMaxPrice}
            onChange={(e) => {
              const val = Math.max(Number(e.target.value), localMinPrice + 10);
              setLocalMaxPrice(val);
            }}
            className="absolute top-2.5 left-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#7A2224] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none"
          />
        </div>

        {/* Min / Max Price Value Bubbles */}
        <div className="flex items-center justify-between text-xs font-bold text-[#7A6258] pt-1">
          <span className="bg-[#FAF6F0] px-2.5 py-1 rounded-md border border-[#DCC7B7] text-[#2D1810]">
            {formatPrice(localMinPrice)}
          </span>
          <span className="text-[#9C8274]">—</span>
          <span className="bg-[#FAF6F0] px-2.5 py-1 rounded-md border border-[#DCC7B7] text-[#2D1810]">
            {formatPrice(localMaxPrice)}
            {localMaxPrice >= maxPriceLimit ? "+" : ""}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block w-72 xl:w-80 shrink-0 bg-white border border-[#E8D9CD] rounded-2xl p-5 xl:p-6 shadow-xs sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-[#DCC7B7] scrollbar-track-transparent ${className}`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Drawer Modal */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Slide-in drawer */}
          <div className="relative ml-0 w-full max-w-xs sm:max-w-sm h-full bg-white border-r border-[#E8D9CD] p-5 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-300 z-10">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0E4D8]">
                <span className="font-extrabold text-base text-[#2D1810]">Filters</span>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-lg text-[#7A6258] hover:text-[#2D1810] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {sidebarContent}
            </div>

            {/* Mobile Apply Button */}
            <div className="pt-5 mt-5 border-t border-[#F0E4D8]">
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-full py-3 rounded-xl bg-[#7A2224] hover:bg-[#5A1911] text-white font-extrabold text-sm tracking-wide uppercase transition-all shadow-sm cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FilterSidebar;
