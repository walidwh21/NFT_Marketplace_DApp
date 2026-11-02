/** @type {import("next").NextConfig} */

// Hostnames that images may be loaded from (the IPFS gateway host is added automatically).
const gatewayHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_IPFS_GATEWAY).hostname;
  } catch {
    return null;
  }
})();

module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["ipfs.io", gatewayHost].filter(Boolean),
  },
};
