/* eslint-disable react/display-name */
import React from "react";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import LatestHomeProducts from "@/components/LatestHomeProducts";

type Props = {
  pageData: {
    text_section_image: SanityImageSource;
  };
  handleImageLoad: (src: string) => void;
  onProductsReady?: () => void;
};

const HomePageSection3 = React.forwardRef<HTMLDivElement, Props>(
  ({ pageData, handleImageLoad, onProductsReady }, ref) => {
    React.useEffect(() => {
      handleImageLoad("section3-no-image");
    }, [handleImageLoad]);

    return (
      <div
        ref={ref}
        className="section3 absolute block top-0 left-0 w-screen bg-[#FDF3E1]"
        style={{ minHeight: 'fit-content' }}
      >
        <div className="container overflow-hidden w-screen max-w-none left-0">
          <div className="absolute inset-0 z-99">
            <LatestHomeProducts onContentReady={onProductsReady} />
          </div>
        </div>
      </div>
    );
  }
);

export default HomePageSection3;
