// Single place where runtime configuration is read.
// Everything comes from NEXT_PUBLIC_* variables (see .env.example).

export const config = {
  marketplaceAddress:
    process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS ||
    "0x5FbDB2315678afecb367f032d93F642f64180aa3", // first deployment on a fresh local Hardhat node
  transferAddress:
    process.env.NEXT_PUBLIC_TRANSFER_ADDRESS ||
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545",
  ipfs: {
    apiHost: process.env.NEXT_PUBLIC_IPFS_API_HOST || "",
    projectId: process.env.NEXT_PUBLIC_IPFS_PROJECT_ID || "",
    projectSecret: process.env.NEXT_PUBLIC_IPFS_PROJECT_SECRET || "",
    gateway: (process.env.NEXT_PUBLIC_IPFS_GATEWAY || "").replace(/\/$/, ""),
  },
};
