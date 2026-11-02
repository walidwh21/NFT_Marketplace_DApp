import nftMarketplace from "./NFTMarketplace.json";
import transferFunds from "./TransferFunds.json";

// Contract ABIs. Addresses live in lib/config.js (driven by environment variables).
export const NFTMarketplaceABI = nftMarketplace.abi;
export const transferFundsABI = transferFunds.abi;
