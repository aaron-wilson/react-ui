import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  productionBrowserSourceMaps: process.env.SENTRY_SOURCE_MAPS === "true",
};
export default createMDX()(config);
