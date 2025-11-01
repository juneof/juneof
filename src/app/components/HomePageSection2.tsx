/* eslint-disable react/display-name */
import React from "react";
import Image from "next/image";
import { getImageUrl } from "@/sanity/lib/image";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

type Props = {
  pageData: {
    sticky_image: SanityImageSource;
  };
  handleImageLoad: (src: string) => void;
};

const HomePageSection2 = React.forwardRef<HTMLDivElement, Props>(
  ({ pageData, handleImageLoad }, ref) => {
    return (
      <div ref={ref} className="section2">
        <div className="container">
          <Image
            src={getImageUrl(pageData.sticky_image)}
            alt="june of model in flowing sustainable garment"
            width={1800}
            height={1200}
            priority
            sizes="(max-width: 768px) 80vw, 55vw"
            onLoad={() => handleImageLoad(getImageUrl(pageData.sticky_image))}
          />
        </div>
        <div>
          <h1 className="text-3xl font-normal m-0 leading-tight lowercase tracking-widest">
            a playful homage to the creative depth of India
          </h1>
        </div>
      </div>
    );
  }
);

export default HomePageSection2;
