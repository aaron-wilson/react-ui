import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};
export default createMDX()(config);
