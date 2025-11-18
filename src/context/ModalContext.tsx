"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  Suspense,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import PreOrderModal from "@/components/common/pre-order-modal";
import { client as sanityClient } from "@/sanity/lib/client";
import {
  isModalDismissed,
  persistModalDismiss,
  hasModalSessionShown,
  markModalSessionShown,
  isModalEligible,
} from "@/lib/modal.client";

type SanityModal = any;

interface ModalContextType {
  openModal: (modalData: SanityModal, product?: any) => void;
  closeModal: () => void;
  modalData: SanityModal | null;
  isOpen: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function useGlobalModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useGlobalModal must be used inside ModalProvider");
  return ctx;
}

function detectPageInfo(pathname: string | null | undefined) {
  if (!pathname || pathname === "/")
    return { slug: "/", handle: null, routeIsProductPage: false };
  const normalized = pathname.replace(/^\/+|\/+$/g, "");
  const parts = normalized.split("/").filter(Boolean);
  if (parts[0] === "product" && parts[1]) {
    return { slug: normalized, handle: parts[1], routeIsProductPage: true };
  }
  return { slug: normalized, handle: null, routeIsProductPage: false };
}

function buildVariants(slug: string) {
  const normalized = slug.replace(/^\/+|\/+$/g, "");
  const set = new Set<string>();
  set.add(slug);
  if (normalized) {
    set.add(normalized);
    set.add(`/${normalized}`);
    set.add(`product/${normalized}`);
  } else {
    set.add("/");
  }
  return Array.from(set);
}

async function fetchModalForRoute({
  slug,
  handle,
  routeIsProductPage,
}: {
  slug: string;
  handle?: string | null;
  routeIsProductPage: boolean;
}) {
  const baseSelect = `{
    _id, modalName, title, enabled,
    allowOnPreOrderProductPages, showOnAllProductPages,
    enableSchedule, startAt, endAt,
    enableDismissDuration, dismissDurationDays,
    showOncePerSession, showOnceSessionKeySuffix,
    slugs, showOnProductHandles,
    ctaText, heading, subHeading,
    discountPercent, productSpecificMessage,
    appearance, priority, _createdAt,
    enableDisplayDelay, displayDelayUnit, displayDelayValue
  }`;

  const variants = buildVariants(slug);

  const query = `*[
    _type == "preOrderModal" &&
    enabled == true &&
    (
      count(slugs[@ in $variants]) > 0 ||
      ($handle != null && $handle in showOnProductHandles[]) ||
      ($isProductPage == true && showOnAllProductPages == true) ||
      ($isProductPage == true && allowOnPreOrderProductPages == true)
    ) &&
    (
      !defined(enableSchedule) || enableSchedule == false ||
      (
        enableSchedule == true &&
        (!defined(startAt) || startAt <= now()) &&
        (!defined(endAt) || endAt >= now())
      )
    )
  ] | order(priority desc, _createdAt desc)[0] ${baseSelect}`;

  try {
    const modal = await sanityClient.fetch(query, {
      variants,
      handle,
      isProductPage: routeIsProductPage,
    });
    return modal || null;
  } catch (err) {
    console.error("[GlobalModalProvider] fetchModalForRoute error:", err);
    return null;
  }
}

type ProductContext = {
  handle: string | null;
  availableForSale?: boolean;
} | null;

function ModalProviderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [modalData, setModalData] = useState<SanityModal | null>(null);
  const [productData, setProductData] = useState<any | null>(null);
  const [productCtx, setProductCtx] = useState<ProductContext>(null);

  // current route slug (normalized) used as modalScope for session keys
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);

  const openModal = useCallback((modal: SanityModal, product?: any) => {
    setModalData(modal);
    setProductData(product || null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (modalData) {
      try {
        persistModalDismiss(modalData);
      } catch {}
      try {
        // prefer the currentSlug, fallback to slug derived from pathname
        const slugToUse = currentSlug ?? detectPageInfo(pathname).slug;
        if (modalData.showOncePerSession)
          markModalSessionShown(modalData, slugToUse);
      } catch {}
    }
    setIsOpen(false);
  }, [modalData, currentSlug, pathname]);

  // Listen & request product context (handshake)
  useEffect(() => {
    function onProductContext(ev: Event) {
      const detail = (ev as CustomEvent).detail || {};
      const next: ProductContext = {
        handle: typeof detail.handle === "string" ? detail.handle : null,
        availableForSale:
          typeof detail.availableForSale === "boolean"
            ? detail.availableForSale
            : undefined,
      };
      setProductCtx(next);
    }
    window.addEventListener(
      "preorder:product-context",
      onProductContext as any
    );
    window.dispatchEvent(new Event("preorder:request-product-context"));
    return () =>
      window.removeEventListener(
        "preorder:product-context",
        onProductContext as any
      );
  }, []);

  // Clear product context when leaving product detail routes
  useEffect(() => {
    const { routeIsProductPage } = detectPageInfo(pathname);
    if (!routeIsProductPage) {
      // Prevent listing/home pages from being treated as product pages due to stale context
      setProductCtx(null);
    }
  }, [pathname]);

  useEffect(() => {
    let mounted = true;
    let delayTimer: ReturnType<typeof setTimeout> | null = null;

    async function evaluate() {
      const {
        slug,
        handle: routeHandle,
        routeIsProductPage,
      } = detectPageInfo(pathname);

      // set the current slug for session scoping and other uses
      setCurrentSlug(slug);

      // Only treat current route as product page if it actually matches /product/<handle>
      const effectiveHandle = routeHandle;
      const effectiveIsProductPage = routeIsProductPage;

      const modal = await fetchModalForRoute({
        slug,
        handle: effectiveHandle,
        routeIsProductPage: effectiveIsProductPage,
      });

      if (!mounted) return;

      if (!modal) {
        setModalData(null);
        setIsOpen(false);
        return;
      }

      // Check session-scoped "shown" flag for this slug
      if (modal.showOncePerSession && hasModalSessionShown(modal, slug)) {
        setModalData(modal);
        setIsOpen(false);
        return;
      }

      if (isModalDismissed(modal)) {
        setModalData(modal);
        setIsOpen(false);
        return;
      }

      // Use product availability only if on a product page
      const productAvailable =
        effectiveIsProductPage && productCtx
          ? productCtx.availableForSale
          : undefined;

      const eligible = isModalEligible({
        modal,
        slug,
        productHandle: effectiveIsProductPage ? effectiveHandle : null,
        productAvailable,
        routeIsProductPage: effectiveIsProductPage,
      });

      if (!eligible) {
        setModalData(modal);
        setIsOpen(false);
        return;
      }

      const delayMs = modal?.enableDisplayDelay
        ? (Number(modal.displayDelayValue) || 0) *
          (modal.displayDelayUnit === "minutes" ? 60000 : 1000)
        : 0;

      setModalData(modal);
      setProductData(null);

      if (delayTimer) clearTimeout(delayTimer);

      if (delayMs > 0) {
        delayTimer = setTimeout(() => {
          if (!mounted) return;
          setIsOpen(true);
        }, delayMs);
      } else {
        setIsOpen(true);
      }
    }

    evaluate();

    return () => {
      mounted = false;
      if (delayTimer) clearTimeout(delayTimer);
    };
  }, [pathname, searchParams, productCtx]);

  return (
    <ModalContext.Provider value={{ openModal, closeModal, modalData, isOpen }}>
      {/* Always render PreOrderModal to keep hook order stable.
          Visibility controlled by isOpen and modalData presence.
          Pass modalScope so session marking is route-scoped. */}
      <PreOrderModal
        isOpen={Boolean(isOpen && modalData)}
        onClose={closeModal}
        product={productData || undefined}
        modalDetails={modalData}
        // pass normalized slug as modalScope (or undefined)
        // PreOrderModal should pass this into markModalSessionShown when marking shown.
        modalScope={currentSlug || undefined}
      />

      {/* children are rendered by ModalProvider wrapper */}
    </ModalContext.Provider>
  );
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ModalProviderInner />
      {children}
    </Suspense>
  );
}
