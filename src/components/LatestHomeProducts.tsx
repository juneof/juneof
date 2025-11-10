"use client";

import React, { useEffect, useState } from "react";
import { getLatestProducts, ShopifyProductNode } from "@/lib/shopify";
import { Loader2 } from "lucide-react";
import ProductCard from "@/app/components/ProductCard";
import { Button } from "./ui/button";
import Link from "next/link";

/**
 * Transform a Shopify product node into the props expected by ProductCard
 */
function transformShopifyProduct(product: ShopifyProductNode) {
  const primaryImage =
    product.images?.edges?.[0]?.node?.url ?? "https://picsum.photos/300/450";

  const hoverImage =
    product.images?.edges?.[1]?.node?.url ??
    product.images?.edges?.[0]?.node?.url ??
    "https://picsum.photos/id/238/300/450";

  const price = Number(product.priceRange?.minVariantPrice?.amount ?? 0);
  const currencyCode =
    product.priceRange?.minVariantPrice?.currencyCode ?? "USD";

  const expressInterest = product.metafield?.value === "true";

  return {
    imageUrl: primaryImage,
    hoverImageUrl: hoverImage,
    name: product.title?.toUpperCase() ?? "UNTITLED",
    price,
    productUrl: `/product/${product.handle}`,
    currencyCode,
    expressInterest,
  };
}

const LatestHomeProducts: React.FC = () => {
  const [displayProducts, setDisplayProducts] = useState<
    Array<{
      imageUrl: string;
      hoverImageUrl: string;
      name: string;
      price: number;
      productUrl: string;
      currencyCode: string;
      expressInterest: boolean;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchLatest() {
      setIsLoading(true);
      try {
        // getLatestProducts is expected to return ShopifyProductNode[]
        const latest = await getLatestProducts(); // defaults to 8 as implemented earlier
        if (!mounted) return;

        if (Array.isArray(latest) && latest.length > 0) {
          setDisplayProducts(latest.map(transformShopifyProduct));
        } else {
          setDisplayProducts([]);
        }
      } catch (err) {
        console.error("Failed to fetch latest products:", err);
        if (mounted) setDisplayProducts([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchLatest();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F8F4EC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
          <p className="text-gray-600 text-sm tracking-wider lowercase">
            loading products...
          </p>
        </div>
      </main>
    );
  }

  if (!isLoading && displayProducts.length === 0) {
    return (
      <main className="min-h-screen bg-[#F8F4EC] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700">No products found.</p>
          <p className="text-sm text-gray-500">
            Check your Shopify store or try again later.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F4EC] p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 lowercase tracking-widest opacity-0">
          &nbsp;
        </h1>
        <p className="text-gray-600 mt-2 opacity-0">&nbsp;</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {displayProducts.map((product) => (
          <ProductCard
            key={`shopify-${product.productUrl}`}
            imageUrl={product.imageUrl}
            hoverImageUrl={product.hoverImageUrl}
            name={product.name}
            price={product.price}
            productUrl={product.productUrl}
            currencyCode={product.currencyCode}
            expressInterest={product.expressInterest}
          />
        ))}
      </div>

      <div className="w-full flex items-center justify-center my-10">
        <Link href="/product-listing">
          <Button className="px-10 py-6 text-lg font-normal flex items-center justify-center gap-2">
            Shop All
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-move-right-icon lucide-move-right"
            >
              <path d="M18 8L22 12L18 16" />
              <path d="M2 12H22" />
            </svg>
          </Button>
        </Link>
      </div>
    </main>
  );
};

export default LatestHomeProducts;
