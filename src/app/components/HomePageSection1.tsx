/* eslint-disable react/display-name */
import React from "react";
import Image from "next/image";
import { getImageUrl } from "@/sanity/lib/image";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

type Props = {
  pageData: {
    section1_image1: SanityImageSource;
    section1_image2: SanityImageSource;
    section1_image3: SanityImageSource;
    section1_image4: SanityImageSource;
  };
  handleImageLoad: (src: string) => void;
};

const HomePageSection1 = React.forwardRef<HTMLDivElement, Props>(
  ({ pageData, handleImageLoad }, ref) => {
    return (
      <div
        ref={ref}
        className="section1 absolute block w-screen bg-[#FDF3E1] text-black md:bg-transparent"
      >
        <div className="container flex flex-row h-screen md:h-screen max-md:h-auto overflow-hidden w-screen max-w-none left-0 max-md:flex-col">
          <div className="panel first relative h-screen md:h-screen max-md:h-auto max-md:flex max-md:items-center max-md:justify-center max-md:pt-24 max-md:pb-12">
            <Image
              className="pic1 relative block w-auto md:w-full max-md:w-[90vw] max-md:h-auto"
              src={getImageUrl(pageData.section1_image1)}
              alt="june of sustainable fashion model wearing heritage-inspired clothing"
              width={800}
              height={600}
              priority
              sizes="(max-width: 768px) 90vw, 50vw"
              onLoad={() =>
                handleImageLoad(getImageUrl(pageData.section1_image1))
              }
            />
          </div>

          <div className="panel relative h-screen max-md:h-auto max-md:flex max-md:items-center max-md:justify-center max-md:pt-24 max-md:pb-12">
            <Image
              className="pic2 relative block w-full"
              src={getImageUrl(pageData.section1_image2)}
              alt="artisanal handwoven kantha cotton clothing from june of"
              width={800}
              height={600}
              priority
              sizes="(max-width: 768px) 72vw, 35vw"
              onLoad={() =>
                handleImageLoad(getImageUrl(pageData.section1_image2))
              }
            />
          </div>

          <div className="panel relative h-screen max-md:h-auto max-md:flex max-md:items-center max-md:justify-center max-md:pt-24 max-md:pb-12">
            <Image
              className="pic3 relative block w-full"
              src={getImageUrl(pageData.section1_image3)}
              alt="june of ethical fashion model showcasing timeless silhouettes"
              width={800}
              height={600}
              priority
              sizes="(max-width: 768px) 80vw, 20vw"
              onLoad={() =>
                handleImageLoad(getImageUrl(pageData.section1_image3))
              }
            />
          </div>

          <div className="panel last relative h-screen">
            <Image
              className="pic4 relative block w-full"
              src={getImageUrl(pageData.section1_image4)}
              alt="sustainable fashion portrait featuring june of's contemporary take on textiles"
              width={800}
              height={600}
              priority
              sizes="(max-width: 768px) 80vw, 55vw"
              onLoad={() =>
                handleImageLoad(getImageUrl(pageData.section1_image4))
              }
            />
          </div>
        </div>
      </div>
    );
  }
);

export default HomePageSection1;
