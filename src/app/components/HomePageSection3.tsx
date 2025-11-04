/* eslint-disable react/display-name */
import React from "react";
import Image from "next/image";
import { getImageUrl } from "@/sanity/lib/image";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import ProductListingClient from "../product-listing/ProductListingClient";

type Props = {
  pageData: {
    text_section_image: SanityImageSource;
  };
  handleImageLoad: (src: string) => void;
};

const HomePageSection3 = React.forwardRef<HTMLDivElement, Props>(
  ({ pageData, handleImageLoad }, ref) => {
    return (
      <div
        ref={ref}
        className="section3 absolute block top-0 left-0 w-screen bg-[#FDF3E1]"
      >
        <div className="container overflow-hidden w-screen max-w-none left-0 h-screen">
          <Image
            className="w-full scale-[1.3] opacity-0 h-screen"
            src={getImageUrl(pageData.text_section_image)}
            alt="june of sustainable fashion collection showcasing indian heritage"
            width={1200}
            height={800}
            priority
            sizes="100vw"
            onLoad={() =>
              handleImageLoad(getImageUrl(pageData.text_section_image))
            }
          />

          <div className="absolute inset-0 z-99">
            <ProductListingClient />
          </div>
        </div>
      </div>
    );
  }
);

export default HomePageSection3;
