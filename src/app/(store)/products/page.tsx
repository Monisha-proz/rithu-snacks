"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Sparkles, ChevronRight, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterSidebar } from "@/components/storefront/filters/FilterSidebar";
import { CustomerProductGrid } from "@/features/customers/components/catalog/CustomerProductGrid";
import {
  useCustomerProducts,
  useCustomerCategories,
} from "@/features/customers/hooks/use-customer-catalog";
import type { CustomerProductListItemDto } from "@/features/customers/types/catalog.types";
import type { CustomerProductListInput } from "@/features/customers/validations/catalog.schema";

const SORT_OPTIONS: {
  value: string;
  label: string;
  sortBy: CustomerProductListInput["sortBy"];
  sortOrder: CustomerProductListInput["sortOrder"];
}[] = [
  { value: "createdAt_desc", label: "Newest First", sortBy: "createdAt", sortOrder: "desc" },
  { value: "price_asc", label: "Price: Low to High", sortBy: "price", sortOrder: "asc" },
  { value: "price_desc", label: "Price: High to Low", sortBy: "price", sortOrder: "desc" },
  { value: "name_asc", label: "Name: A to Z", sortBy: "name", sortOrder: "asc" },
  { value: "name_desc", label: "Name: Z to A", sortBy: "name", sortOrder: "desc" },
];

function ProductCatalogSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div
          key={n}
          className="rounded-2xl border border-[#E8D9CD] bg-[#FFFDF9] p-4 space-y-4 overflow-hidden"
        >
          <div className="aspect-square w-full rounded-xl bg-[#F0E4D8]/60" />
          <div className="space-y-2">
            <div className="h-4 w-20 rounded-md bg-[#F0E4D8]/60" />
            <div className="h-5 w-3/4 rounded-md bg-[#F0E4D8]/60" />
            <div className="h-3 w-full rounded-md bg-[#F0E4D8]/60" />
          </div>
          <div className="pt-2 border-t border-[#F0E4D8] flex items-center justify-between">
            <div className="h-6 w-16 rounded-md bg-[#F0E4D8]/60" />
            <div className="h-4 w-20 rounded-md bg-[#F0E4D8]/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ShopAllPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("createdAt_desc");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [stockStatus, setStockStatus] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [vegType, setVegType] = useState<"all" | "veg" | "non_veg">("all");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Accumulated products for Infinite Scroll
  const [accumulatedProducts, setAccumulatedProducts] = useState<CustomerProductListItemDto[]>([]);

  // Fetch all categories (supports 250 categories)
  const { data: categoriesData } = useCustomerCategories({ pageSize: 250 });
  const categories = categoriesData?.data ?? [];

  const currentCategory = useMemo(() => {
    if (!selectedCategory) return null;
    return categories.find((c) => c.id === selectedCategory);
  }, [categories, selectedCategory]);

  const pageTitle = useMemo(() => {
    if (currentCategory?.name) return currentCategory.name;
    return "Shop All Snacks";
  }, [currentCategory]);

  // Find active sort config
  const activeSort = useMemo(() => {
    return SORT_OPTIONS.find((s) => s.value === sortKey) ?? SORT_OPTIONS[0];
  }, [sortKey]);

  // Query products with filters
  const {
    data: productsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useCustomerProducts({
    page,
    pageSize: 12,
    search: search.trim() ? search.trim() : undefined,
    categoryIds: selectedCategory ? [selectedCategory] : undefined,
    productIds: selectedProductId ? [selectedProductId] : undefined,
    minPrice: minPrice > 0 ? minPrice : undefined,
    maxPrice: maxPrice < 1000 ? maxPrice : undefined,
    inStock: stockStatus === "all" ? undefined : stockStatus === "in_stock",
    vegType: vegType === "all" ? undefined : vegType,
    sortBy: activeSort.sortBy,
    sortOrder: activeSort.sortOrder,
  });

  const meta = productsResponse?.meta;

  // Infinite Scroll accumulation logic
  useEffect(() => {
    if (!productsResponse?.data) return;

    if (page === 1) {
      setAccumulatedProducts(productsResponse.data);
    } else {
      setAccumulatedProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newItems = productsResponse.data.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newItems];
      });
    }
  }, [productsResponse?.data, page]);

  // Derive displayed products: on page 1 always prioritize productsResponse.data directly
  const displayedProducts = useMemo(() => {
    if (page === 1 && productsResponse?.data) {
      return productsResponse.data;
    }
    return accumulatedProducts;
  }, [page, productsResponse?.data, accumulatedProducts]);

  // Infinite Scroll IntersectionObserver sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (
          first.isIntersecting &&
          meta &&
          page < meta.totalPages &&
          !isFetching &&
          !isLoading
        ) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: "250px" }
    );

    const currentSentinel = sentinelRef.current;
    observer.observe(currentSentinel);

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
      observer.disconnect();
    };
  }, [meta, page, isFetching, isLoading]);

  // Category Selection
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedProductId(null);
    setSelectedCategory(categoryId);
    setPage(1);
  };

  // Product Selection under Category
  const handleProductSelect = (productId: string | null) => {
    setSelectedProductId(productId);
    setPage(1);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch("");
    setSortKey("createdAt_desc");
    setSelectedCategory(null);
    setSelectedProductId(null);
    setStockStatus("all");
    setVegType("all");
    setMinPrice(0);
    setMaxPrice(1000);
    setPage(1);
    refetch();
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(selectedCategory) ||
    Boolean(selectedProductId) ||
    stockStatus !== "all" ||
    vegType !== "all" ||
    minPrice > 0 ||
    maxPrice < 1000 ||
    sortKey !== "createdAt_desc";

  const activeFilterCount = [
    Boolean(search),
    Boolean(selectedCategory),
    Boolean(selectedProductId),
    stockStatus !== "all",
    vegType !== "all",
    minPrice > 0 || maxPrice < 1000,
    sortKey !== "createdAt_desc",
  ].filter(Boolean).length;

  const hasMorePages = meta ? page < meta.totalPages : false;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero / Header Banner */}
      <div className="border-b border-[#F0E4D8] bg-gradient-to-b from-[#FFFDF9] via-[#FAF4ED] to-[#F5ECE1] py-8 sm:py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Breadcrumb navigation */}
          <nav className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#7A6258] mb-3">
            <Link href="/" className="hover:text-[#7A2224] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#7A6258]">
              Products
            </span>
            {selectedCategory && currentCategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="font-bold text-[#2D1810]">
                  {currentCategory.name}
                </span>
              </>
            )}
          </nav>

          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#7A2224]/10 text-[#7A2224] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5 text-[#F8BE15]" />
              Authentic Collection
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#2D1810] font-serif tracking-tight">
              {pageTitle}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#7A6258] max-w-2xl mx-auto leading-relaxed">
              Authentic South Indian snacks, savories, and traditional sweets crafted with pure ingredients and timeless recipes.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full bg-white">
        <div className="container mx-auto px-4 py-6 sm:py-10 max-w-7xl bg-white">
          {/* Mobile Filter Toggle Button */}
          <div className="lg:hidden mb-6 flex items-center justify-between gap-3 bg-white border border-[#E8D9CD] rounded-xl p-3 shadow-xs">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7A2224] text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-4.5 h-4.5 rounded-full bg-[#F8BE15] text-[#2D1810] font-black text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <span className="text-xs text-[#7A6258] font-medium">
              Showing <strong className="text-[#2D1810]">{meta?.total ?? displayedProducts.length}</strong> snacks
            </span>
          </div>

          {/* 2-Column Layout: Left FilterSidebar, Right Products Grid */}
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Left Sticky FilterSidebar */}
            <FilterSidebar
              categories={categories}
              selectedCategoryId={selectedCategory}
              onSelectCategory={handleCategorySelect}
              selectedProductId={selectedProductId}
              onSelectProduct={handleProductSelect}
              searchQuery={search}
              onSearchChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              sortKey={sortKey}
              onSortChange={(val) => {
                setSortKey(val);
                setPage(1);
              }}
              stockStatus={stockStatus}
              onStockStatusChange={(val) => {
                setStockStatus(val);
                setPage(1);
              }}
              vegType={vegType}
              onVegTypeChange={(val) => {
                setVegType(val);
                setPage(1);
              }}
              minPriceLimit={0}
              maxPriceLimit={1000}
              currentMinPrice={minPrice}
              currentMaxPrice={maxPrice}
              onPriceChange={(min, max) => {
                setMinPrice(min);
                setMaxPrice(max);
                setPage(1);
              }}
              onResetFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
              isMobileOpen={isMobileFilterOpen}
              onCloseMobile={() => setIsMobileFilterOpen(false)}
              totalResultsCount={meta?.total}
            />

            {/* Right Main Products Display (3 cards per row) */}
            <div className="flex-1 min-w-0 w-full">
              {/* Header info bar */}
              <div className="hidden lg:flex items-center justify-between mb-6 pb-3 border-b border-[#E8D9CD]">
                <p className="text-sm text-[#7A6258]">
                  Showing{" "}
                  <strong className="text-[#2D1810]">
                    {meta?.total ?? displayedProducts.length}
                  </strong>{" "}
                  authentic {meta?.total === 1 ? "snack" : "snacks"}
                  {currentCategory && (
                    <>
                      {" "}in <strong className="text-[#7A2224] font-bold">{currentCategory.name}</strong>
                    </>
                  )}
                  {selectedProductId && (
                    <span className="ml-2 text-xs bg-[#F5ECE1] text-[#7A2224] px-2 py-0.5 rounded-full font-semibold">
                      Product filtered
                    </span>
                  )}
                </p>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-[#7A2224] hover:underline cursor-pointer transition-colors"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>

              {/* Error State */}
              {error && (
                <div className="rounded-2xl border border-[#E8D9CD] bg-[#FFFDF9] p-8 text-center max-w-md mx-auto my-8 shadow-xs">
                  <h3 className="text-base font-bold text-[#2D1810] mb-2">
                    Unable to load snacks
                  </h3>
                  <p className="text-xs text-[#7A6258] mb-4">
                    We encountered a connection issue fetching the product catalog.
                  </p>
                  <Button
                    onClick={() => refetch()}
                    className="h-9 px-5 rounded-xl bg-[#7A2224] hover:bg-[#5A1911] text-white text-xs font-bold cursor-pointer"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Content Area: Skeleton vs Accumulated Products with Infinite Scroll (3 per row) */}
              {isLoading && page === 1 ? (
                <ProductCatalogSkeleton />
              ) : (
                <>
                  <CustomerProductGrid
                    products={displayedProducts}
                    columns={3}
                    onResetFilters={hasActiveFilters ? handleResetFilters : undefined}
                  />

                  {/* Infinite Scroll Sentinel & Loading Indicator */}
                  <div
                    ref={sentinelRef}
                    className="h-16 flex items-center justify-center my-6"
                  >
                    {isFetching && page > 1 && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E8D9CD] shadow-xs text-xs font-bold text-[#7A2224] animate-in fade-in">
                        <Loader2 className="w-4 h-4 animate-spin text-[#7A2224]" />
                        Loading more snacks...
                      </div>
                    )}

                    {!hasMorePages && displayedProducts.length > 0 && !isFetching && (
                      <p className="text-xs font-semibold text-[#9C8274] select-none">
                        ✦ You have viewed all {displayedProducts.length} snacks ✦
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
