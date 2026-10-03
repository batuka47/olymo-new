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
  // Old addresses that may be printed or shared; 301 so search engines move them over.
  // Destinations are routes.editorialPolicy and routes.partner (src/config/navigation.ts), written
  // out because this file cannot import app modules.
  async redirects() {
    return [
      { source: "/redakts", destination: "/editorial-policy", statusCode: 301 },
      { source: "/hamtrah", destination: "/partner", statusCode: 301 },
    ];
  },
};

export default nextConfig;
