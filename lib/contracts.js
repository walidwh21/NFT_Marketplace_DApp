import { ethers } from "ethers";
import Web3Modal from "web3modal";
import { config } from "./config";
import { NFTMarketplaceABI, transferFundsABI } from "../context/constants";

const marketplaceAt = (runner) =>
  new ethers.Contract(config.marketplaceAddress, NFTMarketplaceABI, runner);

const transferLedgerAt = (runner) =>
  new ethers.Contract(config.transferAddress, transferFundsABI, runner);

/** Read-only provider that does not need a wallet. */
export const readProvider = () => new ethers.providers.JsonRpcProvider(config.rpcUrl);

/** Opens the wallet picker and returns a signer. */
export async function getSigner() {
  const connection = await new Web3Modal().connect();
  return new ethers.providers.Web3Provider(connection).getSigner();
}

export const readMarketplace = () => marketplaceAt(readProvider());
export const writeMarketplace = async () => marketplaceAt(await getSigner());
export const writeTransferLedger = async () => transferLedgerAt(await getSigner());

/** Turn a raw MarketItem tuple into a UI-friendly object (resolving token metadata). */
export async function hydrateItem(contract, raw) {
  const tokenURI = await contract.tokenURI(raw.tokenId);
  const res = await fetch(tokenURI);
  const { image, name, description } = await res.json();

  return {
    tokenId: raw.tokenId.toNumber(),
    seller: raw.seller,
    owner: raw.owner,
    price: ethers.utils.formatEther(raw.price),
    image,
    name,
    description,
    tokenURI,
  };
}
