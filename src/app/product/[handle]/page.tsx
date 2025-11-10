import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import {
  storefrontApiRequest,
  GET_PRODUCT_BY_HANDLE_QUERY,
  GET_PRODUCTS_FOR_LISTING_QUERY,
  ShopifyProductByHandleData,
  ShopifyProductsData,
} from "@/lib/shopify";
import {
  getWashCareByProductId,
  getSizeGuideByProductId,
  extractProductId,
  ProductWithGuides,
} from "@/lib/sanity-queries";
import { fetchModalForProductHandle } from "@/lib/modal.server";
import ProductPageClient from "./ProductPageClient";

export const dynamic = "force-dynamic";
export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{
    handle: string;
  }>;
}

// ✅ Generate SEO Metadata
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;

  try {
    const data = await storefrontApiRequest<ShopifyProductByHandleData>(
      GET_PRODUCT_BY_HANDLE_QUERY,
      { handle }
    );

    if (!data.productByHandle) {
      return {
        title: "Product Not Found",
        description: "The requested product could not be found.",
      };
    }

    const product = data.productByHandle;
    const price = parseFloat(product.priceRange.minVariantPrice.amount);
    const currency = product.priceRange.minVariantPrice.currencyCode;
    const imageUrl =
      product.images.edges[0]?.node.url || "/landing-images/logo.svg";

    return {
      title: product.title,
      description:
        product.description ||
        `${product.title} - Sustainable fashion from June Of.`,
      openGraph: {
        title: `${product.title} | June Of`,
        description:
          product.description ||
          `${product.title} - Sustainable fashion from June Of`,
        url: `https://www.juneof.com/product/${handle}`,
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 800,
            alt: product.title,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.title} | June Of`,
        description:
          product.description ||
          `${product.title} - Sustainable fashion from June Of`,
        images: [imageUrl],
      },
      alternates: {
        canonical: `https://www.juneof.com/product/${handle}`,
      },
      other: {
        "product:price:amount": price.toString(),
        "product:price:currency": currency,
        "product:availability": "in stock",
        "product:condition": "new",
        "product:brand": "June Of",
      },
    };
  } catch (error) {
    console.error("Failed to generate metadata for product:", error);
    return {
      title: "Product | June Of",
      description: "Sustainable fashion from June Of.",
    };
  }
}

// ✅ Generate static paths
export async function generateStaticParams() {
  try {
    const data = await storefrontApiRequest<ShopifyProductsData>(
      GET_PRODUCTS_FOR_LISTING_QUERY,
      { first: 50 }
    );

    return data.products.edges.map((edge) => ({
      handle: edge.node.handle,
    }));
  } catch (error) {
    console.error("Failed to generate static params:", error);
    return [];
  }
}

// ✅ Server component — fetch product, guides, and modal
export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;
  let productWithGuides: ProductWithGuides | null = null;

  try {
    const data = await storefrontApiRequest<ShopifyProductByHandleData>(
      GET_PRODUCT_BY_HANDLE_QUERY,
      { handle },
      { bypassCache: true }
    );

    if (!data.productByHandle) notFound();

    const product = data.productByHandle;
    const numericProductId = extractProductId(product.id);

    // 🔹 Fetch everything in parallel
    const [washCareGuide, sizeGuide, preOrderModal] = await Promise.all([
      getWashCareByProductId(numericProductId),
      getSizeGuideByProductId(numericProductId),
      // ✅ Pass "product/<handle>" since slugs may use that full route format
      fetchModalForProductHandle(`product/${handle}`),
    ]);

    productWithGuides = {
      ...product,
      washCareGuide,
      sizeGuide,
      preOrderModal, // note: Global provider handles showing; this remains available if needed
    };

    console.log(
      `Fetched product ${handle}`,
      `WashCare: ${washCareGuide ? "✓" : "✗"}`,
      `SizeGuide: ${sizeGuide ? "✓" : "✗"}`,
      `Modal: ${preOrderModal ? "✓" : "✗"}`
    );
  } catch (error) {
    console.error("Failed to fetch product:", error);
    notFound();
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductPageClient product={productWithGuides} />
    </Suspense>
  );
}
