/* eslint-disable react/display-name */
import React from "react";
import Image from "next/image";
import { getImageUrl } from "@/sanity/lib/image";
import { Instagram } from "lucide-react";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

type Props = {
  pageData: {
    galleryImages: SanityImageSource[];
  };
  isMobile: boolean;
  isMobileOverlayVisible: boolean;
};

const HomePageSection4 = React.forwardRef<HTMLDivElement, Props>(
  ({ pageData, isMobile, isMobileOverlayVisible }, ref) => {
    return (
      <div
        ref={ref}
        className={`section4 absolute block top-0 left-0 w-screen h-screen overflow-hidden bg-[#F8F4EC] group cursor-pointer ${
          isMobile && isMobileOverlayVisible ? "mobile-overlay-visible" : ""
        }`}
        onClick={() =>
          window.open(
            "https://www.instagram.com/juneof__",
            "_blank",
            "noopener,noreferrer"
          )
        }
        role="button"
        tabIndex={0}
        aria-label="Visit June Of on Instagram - Sustainable fashion editorial and behind-the-scenes content"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            window.open(
              "https://www.instagram.com/juneof__",
              "_blank",
              "noopener,noreferrer"
            );
          }
        }}
      >
        {/* Dark overlay that appears on hover (desktop) or scroll (mobile) */}
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity duration-500 ease-out z-10 pointer-events-none ${
            isMobile
              ? isMobileOverlayVisible
                ? "opacity-100"
                : "opacity-0"
              : "opacity-0 group-hover:opacity-100"
          }`}
        />

        {/* Instagram icon that appears on hover (desktop) or scroll (mobile) */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-out z-20 pointer-events-none ${
            isMobile
              ? isMobileOverlayVisible
                ? "opacity-100"
                : "opacity-0"
              : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <Instagram
            className="w-16 h-16 md:w-20 md:h-20 text-white"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>

        {pageData.galleryImages?.map((image, index) => {
          const positions = [
            "top-[50vh] left-[8.5vw] w-[20vw]",
            "top-[90vh] left-[23vw] w-[16vw]",
            "top-[20vh] left-[40vw] w-[20vw]",
            "top-[99vh] left-[80vw] w-[19vw]",
            "top-0 right-0 w-[15vw]",
            "top-[70vh] right-[15vw] w-[17vw]",
            "top-[40vh] right-[35vw] w-[16vw]",
          ];
          const positionClass = positions[index % positions.length];
          return (
            <Image
              key={index}
              className={`pic${index + 1} absolute min-w-[150px] max-w-[300px] ${positionClass}`}
              src={getImageUrl(image)}
              alt={`Gallery image ${index + 1} from june of collection`}
              width={300}
              height={400}
              sizes="(max-width: 768px) 200px, 20vw"
            />
          );
        })}
      </div>
    );
  }
);

export default HomePageSection4;
