import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Images are resized in the browser on upload, so next/image only picks the stored file.
    loader: "custom",
    loaderFile: "./src/lib/images/loader.ts",
    // The stored widths (IMAGE_WIDTHS in src/lib/media.ts): srcset lists exactly these files.
    deviceSizes: [400, 800, 1600],
    imageSizes: [],
  },
};

export default nextConfig;
