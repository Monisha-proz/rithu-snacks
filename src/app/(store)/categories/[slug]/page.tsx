"use client";

import { use, useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronRight, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import {
  useCustomerProducts,
  useCustomerCategories,
} from "@/features/customers/hooks/use-customer-catalog";
import { CustomerProductGrid } from "@/features/customers/components/catalog/CustomerProductGrid";
import { FilterSidebar } from "@/components/storefront/filters/FilterSidebar";
import type { CustomerProductListInput } from "@/features/customers/validations/catalog.schema";
import type { CustomerProductListItemDto } from "@/features/customers/types/catalog.types";

interface CategoryProductsPageProps {
  params: Promise<{ slug: string }>;
}

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
          className="rounded-2xl border border-theme-border bg-theme-surface p-4 space-y-4 overflow-hidden"
        >
          <div className="aspect-square w-full rounded-xl skeleton-shimmer" />
          <div className="space-y-2">
            <div className="h-4 w-20 rounded-md skeleton-shimmer" />
            <div className="h-5 w-3/4 rounded-md skeleton-shimmer" />
            <div className="h-3 w-full rounded-md skeleton-shimmer" />
          </div>
          <div className="pt-2 border-t border-theme-border-subtle flex items-center justify-between">
            <div className="h-6 w-16 rounded-md skeleton-shimmer" />
            <div className="h-4 w-20 rounded-md skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CategoryProductsPage({
  params,
}: CategoryProductsPageProps) {
  const { slug } = use(params);
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("createdAt_desc");
  const [activeCategoryOverride, setActiveCategoryOverride] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [stockStatus, setStockStatus] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [vegType, setVegType] = useState<"all" | "veg" | "non_veg">("all");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Accumulated products for Infinite Scroll
  const [accumulatedProducts, setAccumulatedProducts] = useState<CustomerProductListItemDto[]>([]);

  // Fetch all categories (pageSize 250 supported)
  const { data: categoriesData } = useCustomerCategories({ pageSize: 250 });
  const categories = categoriesData?.data ?? [];

  // Resolve current active category (from URL slug or in-page selection)
  const activeSlug = activeCategoryOverride ?? slug;

  const currentCategory = useMemo(() => {
    return categories.find(
      (c) =>
        c.id === activeSlug ||
        c.name.toLowerCase() === activeSlug.toLowerCase() ||
        c.name.toLowerCase().replace(/\s+/g, "-") === activeSlug.toLowerCase() ||
        c.name.toLowerCase().replace(/\s+/g, "_") === activeSlug.toLowerCase()
    );
  }, [categories, activeSlug]);

  const activeCategoryId = useMemo(() => {
    if (activeSlug === "all") return null;
    if (currentCategory) return currentCategory.id;
    if (activeSlug && activeSlug !== "all") return activeSlug;
    return null;
  }, [currentCategory, activeSlug]);

  const categoryTitle = useMemo(() => {
    if (currentCategory?.name) return currentCategory.name;
    if (activeSlug === "all" || !activeCategoryId) return "All Snacks";
    if (activeSlug.includes("-") && activeSlug.length > 30) return "Category Snacks";
    return activeSlug.charAt(0).toUpperCase() + activeSlug.slice(1);
  }, [currentCategory, activeSlug, activeCategoryId]);

  // Find active sort config
  const activeSort = useMemo(() => {
    return SORT_OPTIONS.find((s) => s.value === sortKey) ?? SORT_OPTIONS[0];
  }, [sortKey]);

  // Query products with database-level filters (optimized for scale)
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
    categoryIds: activeCategoryId ? [activeCategoryId] : undefined,
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

  // Derive displayed products: on page 1 always prioritize productsResponse.data directly,
  // falling back to accumulatedProducts (for infinite scroll pages 2+).
  // This guarantees products never get wiped to an empty screen when clearing filters!
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
    if (!categoryId) {
      setActiveCategoryOverride("all");
      setPage(1);
      window.history.pushState(null, "", "/categories/all");
      return;
    }
    setActiveCategoryOverride(categoryId);
    setPage(1);
    window.history.pushState(null, "", `/categories/${categoryId}`);
  };

  // Product Selection under Category
  const handleProductSelect = (productId: string | null) => {
    setSelectedProductId(productId);
    setPage(1);
  };

  // Reset Filters - safely clears all filters and refetches
  const handleResetFilters = () => {
    setSearch("");
    setSortKey("createdAt_desc");
    setStockStatus("all");
    setVegType("all");
    setMinPrice(0);
    setMaxPrice(1000);
    setSelectedProductId(null);
    setActiveCategoryOverride(null);
    setPage(1);
    refetch();
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(selectedProductId) ||
    stockStatus !== "all" ||
    vegType !== "all" ||
    minPrice > 0 ||
    maxPrice < 1000 ||
    sortKey !== "createdAt_desc";

  const activeFilterCount = [
    Boolean(search),
    Boolean(selectedProductId),
    stockStatus !== "all",
    vegType !== "all",
    minPrice > 0 || maxPrice < 1000,
    sortKey !== "createdAt_desc",
  ].filter(Boolean).length;

  const hasMorePages = meta ? page < meta.totalPages : false;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero / Header Banner with Warm Background */}
      <div className="border-b border-[var(--theme-border)] bg-gradient-to-b from-[#FFFDF9] via-[#FAF4ED] to-[#F5ECE1] py-8 sm:py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Breadcrumb navigation */}
          <nav className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#7A6258] mb-3">
            <Link href="/" className="hover:text-[#7A2224] transition-colors">
              Home
            </Link>

            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-bold text-[#2D1810]">
              {categoryTitle}
            </span>
          </nav>

          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#7A2224]/10 text-[#7A2224] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5 text-[#F8BE15]" />
              Authentic Collection
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#2D1810] font-serif tracking-tight">
              {categoryTitle}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#7A6258] max-w-2xl mx-auto leading-relaxed">
              Handcrafted authentic snacks and delicacies made with traditional recipes, pure ingredients, and rich heritage.
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
            selectedCategoryId={activeCategoryId}
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
                authentic {meta?.total === 1 ? "snack" : "snacks"} in{" "}
                <strong className="text-[#7A2224] font-bold">
                  {categoryTitle}
                </strong>
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
                  We encountered a connection issue fetching the snacks for this category.
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
