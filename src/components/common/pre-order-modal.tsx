"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";

interface PreOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    id?: string;
    title?: string;
    handle?: string;
  };
}

export default function PreOrderModal({
  isOpen,
  onClose,
  product,
}: PreOrderModalProps) {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  // lock body scroll while open
  useEffect(() => {
    if (!mounted) return;
    const original = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = original;
    }
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen, mounted]);

  // close on ESC
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (!mounted) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mounted, handleKeyDown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/customer/express-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product?.id,
          email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.message || "Something went wrong. Try again.");
        return;
      }

      toast.success(
        data?.message || "Thanks — we'll notify you when it's back!"
      );
      setEmail("");
      onClose();
    } catch (err) {
      console.error("PreOrder submit error:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;
  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45"
        onClick={() => onClose()}
        aria-hidden
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Notify me when ${product?.title || "this product"} is available`}
        className="relative z-10 w-full max-w-[876px] min-h-[490px] bg-white p-8 md:p-14 shadow-2xl overflow-hidden"
      >
        {/* close (forced to the top-right) */}
        {/* Note: we explicitly set left: 'auto' via inline style to override any left-based overrides (e.g., older classes or logical properties). */}
        <button
          aria-label="Close"
          onClick={() => onClose()}
          className="!absolute !top-4 !right-4 z-20 w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition"
          style={{ left: "auto" }}
        >
          <span className="relative block w-5 h-[2px] bg-black rotate-45" />
          <span className="absolute block w-5 h-[2px] bg-black -rotate-45" />
        </button>

        {/* decorative svgs (kept subtle) */}
        <svg
          className="absolute left-0 top-0 opacity-90 pointer-events-none"
          width="238"
          height="298"
          viewBox="0 0 238 298"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-99 297C-99 297 -68.8457 198.034 -40 161.89C10.1356 99.0682 54.2716 210.657 107.5 161.89C157.91 115.705 158.509 -3.48482 208.5 -51.8507C219.309 -62.3083 237 -74 237 -74"
            stroke="black"
          />
        </svg>
        <svg
          className="absolute right-0 bottom-0 opacity-90 pointer-events-none"
          width="479"
          height="257"
          viewBox="0 0 479 257"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M96.5506 173.808C49.5905 200.337 0.5 272.975 0.5 272.975V291.671H547.5V0.670654C547.5 0.670654 518.699 9.25204 501.103 16.9276C419.718 52.427 418.743 139.909 336.677 173.808C250.023 209.601 178.17 127.698 96.5506 173.808Z"
            stroke="black"
            stroke-opacity="0.7"
          />
        </svg>

        {/* Content */}
        <div className="text-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full">
          <h2 className="font-serif text-3xl md:text-4xl leading-tight text-[#111827]">
            <span className="inline-block bg-[#f9f6f0] px-3 mr-3 -ml-1 md:text-5xl">
              Be the first
            </span>
            to know when this
            <br />
            product is available
          </h2>

          <form onSubmit={handleSubmit} className="mt-8">
            <div className="max-w-sm mx-auto px-4">
              <Label htmlFor="preorder-email" className="sr-only">
                Email
              </Label>
              <InputGroup className="h-14 border border-black">
                <InputGroupInput
                  id="preorder-email"
                  name="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md pr-20 !text-lg placeholder-gray-400"
                />
                <InputGroupAddon align="inline-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-black text-white w-10 h-10 rounded-md flex items-center justify-center"
                    aria-label="Submit"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M5 12h14"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M12 5l7 7-7 7"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
