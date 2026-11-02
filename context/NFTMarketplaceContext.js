import React, { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useRouter } from "next/router";

import { pinFile, pinJSON } from "../lib/ipfs";
import {
  readMarketplace,
  writeMarketplace,
  writeTransferLedger,
  hydrateItem,
} from "../lib/contracts";

export const NFTMarketplaceContext = React.createContext();

const HEADLINE = "Discover, collect, and sell digital collectibles";

export const NFTMarketplaceProvider = ({ children }) => {
  const router = useRouter();

  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [error, setError] = useState("");
  const [openError, setOpenError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionCount, setTransactionCount] = useState("");

  const fail = useCallback((message, cause) => {
    if (cause) console.error(message, cause);
    setError(message);
    setOpenError(true);
  }, []);

  // ------------------------------------------------------------------ wallet

  const refreshBalance = async (address) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setBalance(ethers.utils.formatEther(await provider.getBalance(address)));
  };

  /** Silent check on page load: picks up an already-authorised wallet, never prompts. */
  const checkIfWalletConnected = async () => {
    if (!window.ethereum) return fail("Please install a browser wallet such as MetaMask");
    try {
      const [first] = await window.ethereum.request({ method: "eth_accounts" });
      if (!first) return;
      setAccount(first);
      await refreshBalance(first);
    } catch (err) {
      console.error("Wallet check failed", err);
    }
  };

  /** Explicit user action: prompts the wallet for permission. */
  const connectWallet = async () => {
    if (!window.ethereum) return fail("Please install a browser wallet such as MetaMask");
    try {
      const [first] = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(first);
      await refreshBalance(first);
    } catch (err) {
      fail("Could not connect to the wallet", err);
    }
  };

  // -------------------------------------------------------------------- IPFS

  const uploadToIPFS = async (file) => {
    try {
      return await pinFile(file);
    } catch (err) {
      fail("Uploading to IPFS failed", err);
    }
  };

  // ----------------------------------------------------------------- listing

  /** Mint a token (or re-list an owned one) at `priceInEth`. */
  const createSale = async (metadataUrl, priceInEth, isReselling, tokenId) => {
    try {
      const price = ethers.utils.parseEther(priceInEth);
      const market = await writeMarketplace();
      const fee = await market.getListingPrice();

      const tx = isReselling
        ? await market.resellToken(tokenId, price, { value: fee })
        : await market.createToken(metadataUrl, price, { value: fee });
      await tx.wait();
    } catch (err) {
      fail("Creating the listing failed", err);
    }
  };

  const createNFT = async (name, price, image, description, nav = router) => {
    if (!name || !description || !price || !image) return fail("Please fill in every field");
    try {
      const metadataUrl = await pinJSON({ name, description, image });
      await createSale(metadataUrl, price);
      nav.push("/searchPage");
    } catch (err) {
      fail("Creating the NFT failed", err);
    }
  };

  // ------------------------------------------------------------------- reads

  /** All items currently for sale. Works without a wallet. */
  const fetchNFTs = async () => {
    try {
      const market = readMarketplace();
      const raw = await market.fetchMarketItems();
      return await Promise.all(raw.map((item) => hydrateItem(market, item)));
    } catch (err) {
      console.error("Could not load marketplace items", err);
      return [];
    }
  };

  /** Items the connected wallet owns ("fetchMyNFTs") or has listed ("fetchItemsListed"). */
  const fetchMyNFTsOrListedNFTs = async (type) => {
    if (!account) return [];
    try {
      const market = await writeMarketplace();
      const raw =
        type === "fetchItemsListed"
          ? await market.fetchItemsListed()
          : await market.fetchMyNFTs();
      return await Promise.all(raw.map((item) => hydrateItem(market, item)));
    } catch (err) {
      console.error("Could not load your items", err);
      return [];
    }
  };

  const buyNFT = async (nft) => {
    try {
      const market = await writeMarketplace();
      const tx = await market.createMarketSale(nft.tokenId, {
        value: ethers.utils.parseEther(String(nft.price)),
      });
      await tx.wait();
      router.push("/author");
    } catch (err) {
      fail("The purchase failed", err);
    }
  };

  // ---------------------------------------------------------- transfer ledger

  const transferEther = async (to, amountInEth, message) => {
    if (!account) return fail("Connect a wallet first");
    try {
      setBusy(true);
      const value = ethers.utils.parseEther(amountInEth);

      await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: account, to, gas: "0x5208", value: value._hex }],
      });

      const ledger = await writeTransferLedger();
      const tx = await ledger.addDataToBlockchain(to, value, message);
      await tx.wait();

      setTransactionCount((await ledger.getTransactionCount()).toNumber());
      await getAllTransactions();
      await refreshBalance(account);
    } catch (err) {
      fail("The transfer failed", err);
    } finally {
      setBusy(false);
    }
  };

  const getAllTransactions = async () => {
    if (!window.ethereum) return;
    try {
      const ledger = await writeTransferLedger();
      const records = await ledger.getAllTransactions();
      setTransactions(
        records.map((r) => ({
          addressFrom: r.sender,
          addressTo: r.receiver,
          message: r.message,
          amount: Number(ethers.utils.formatEther(r.amount)),
          timestamp: new Date(r.timestamp.toNumber() * 1000).toLocaleString(),
        }))
      );
    } catch (err) {
      console.error("Could not load transfers", err);
    }
  };

  return (
    <NFTMarketplaceContext.Provider
      value={{
        titleData: HEADLINE,
        currentAccount: account,
        accountBalance: balance,
        error,
        setError,
        openError,
        setOpenError,
        loading: busy,
        transactions,
        transactionCount,
        checkIfWalletConnected,
        connectWallet,
        uploadToIPFS,
        createNFT,
        createSale,
        fetchNFTs,
        fetchMyNFTsOrListedNFTs,
        buyNFT,
        transferEther,
        getAllTransactions,
      }}
    >
      {children}
    </NFTMarketplaceContext.Provider>
  );
};
