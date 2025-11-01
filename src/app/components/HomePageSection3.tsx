/* eslint-disable react/display-name */
import React from "react";
import Image from "next/image";
import { getImageUrl } from "@/sanity/lib/image";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

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
        <div className="layout-text layout text box-border py-12 px-[3vw] lg:px-[3vw] max-lg:px-[5vw] flex justify-end">
          <div className="w-full md:w-1/2">
            <h1 className="text-3xl font-normal m-0 leading-tight lowercase tracking-widest">
              a playful homage to the creative depth of India
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mt-12 mb-0">
              <p className="link">
                <a
                  href="/about-us"
                  className="text-black lowercase tracking-widest hover:opacity-75 transition-opacity"
                >
                  about us
                </a>
              </p>
              <p className="link">
                <a
                  href="/product-listing"
                  className="text-black lowercase tracking-widest hover:opacity-75 transition-opacity"
                >
                  visit shop
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="container overflow-hidden bg-teal w-screen max-w-none left-0">
          <Image
            className="w-full scale-[1.3]"
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
        </div>
      </div>
    );
  }
);

export default HomePageSection3;
