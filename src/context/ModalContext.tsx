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

/* ----------------------
   Types & Context
   ---------------------- */
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

/* ----------------------
   Helpers
   ---------------------- */
function detectPageInfo(pathname: string | null | undefined) {
  if (!pathname || pathname === "/") return { slug: "/", handle: null };
  const normalized = pathname.replace(/^\/+|\/+$/g, "");
  const parts = normalized.split("/").filter(Boolean);
  if (parts[0] === "product" && parts[1]) {
    return { slug: normalized, handle: parts[1] };
  }
  return { slug: normalized, handle: null };
}

/* ----------------------
   Fetch modal for route (you already have this working)
   ---------------------- */
async function fetchModalForRoute({
  slug,
  handle,
}: {
  slug: string;
  handle?: string | null;
}) {
  const baseSelect = `{
    _id, modalName, title, enabled, allowOnPreOrderProductPages,
    enableSchedule, startAt, endAt,
    enableDismissDuration, dismissDurationDays,
    showOncePerSession, showOnceSessionKeySuffix,
    slugs, showOnProductHandles,
    ctaText, heading, subHeading,
    discountPercent, productSpecificMessage,
    appearance, priority, _createdAt
  }`;

  const normalized = (slug ?? "").replace(/^\/+|\/+$/g, "");
  const variants = [
    slug,
    normalized,
    normalized ? `/${normalized}` : "/",
    normalized ? `${normalized}` : "/",
    normalized ? `product/${normalized}` : "/",
  ]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  const query = `*[
    _type == "preOrderModal" &&
    enabled == true &&
    (
      count(slugs[@ in $variants]) > 0 ||
      ($handle != null && $handle in showOnProductHandles[])
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
    const modal = await sanityClient.fetch(query, { variants, handle });
    return modal || null;
  } catch (err) {
    console.error("fetchModalForRoute error:", err);
    return null;
  }
}

/* ----------------------
   ModalProvider Inner Component (wrapped in Suspense)
   ---------------------- */
function ModalProviderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [modalData, setModalData] = useState<SanityModal | null>(null);
  const [productData, setProductData] = useState<any | null>(null);

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
        if (modalData.showOncePerSession) markModalSessionShown(modalData);
      } catch {}
    }
    setIsOpen(false);
  }, [modalData]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { slug, handle } = detectPageInfo(pathname);
        const modal = await fetchModalForRoute({ slug, handle });

        if (!mounted) return;
        if (!modal) {
          setModalData(null);
          setIsOpen(false);
          return;
        }

        if (modal.showOncePerSession && hasModalSessionShown(modal)) {
          setModalData(modal);
          setIsOpen(false);
          return;
        }

        if (isModalDismissed(modal)) {
          setModalData(modal);
          setIsOpen(false);
          return;
        }

        const eligible = isModalEligible({
          modal,
          slug,
          productHandle: handle || null,
          productAvailable: undefined,
        });

        if (!eligible) {
          setModalData(modal);
          setIsOpen(false);
          return;
        }

        setModalData(modal);
        setProductData(null);
        setIsOpen(true);
      } catch (err) {
        console.error("ModalProvider load error:", err);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [pathname, searchParams]);

  return (
    <ModalContext.Provider value={{ openModal, closeModal, modalData, isOpen }}>
      {modalData && (
        <PreOrderModal
          isOpen={isOpen}
          onClose={closeModal}
          product={productData || undefined}
          modalDetails={modalData}
        />
      )}
    </ModalContext.Provider>
  );
}

/* ----------------------
   Exported Provider (with Suspense wrapper)
   ---------------------- */
export function ModalProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ModalProviderInner />
      {children}
    </Suspense>
  );
}
