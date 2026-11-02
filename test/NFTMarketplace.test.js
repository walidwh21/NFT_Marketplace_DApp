const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarketplace", () => {
  const ONE = ethers.utils.parseEther("1");
  let market, operator, seller, buyer, fee;

  beforeEach(async () => {
    [operator, seller, buyer] = await ethers.getSigners();
    const Market = await ethers.getContractFactory("NFTMarketplace");
    market = await Market.deploy();
    await market.deployed();
    fee = await market.getListingPrice();
  });

  const list = (signer = seller, price = ONE) =>
    market.connect(signer).createToken("ipfs://meta", price, { value: fee });

  it("escrows a freshly listed token", async () => {
    await list();
    expect(await market.ownerOf(1)).to.equal(market.address);
    const open = await market.fetchMarketItems();
    expect(open).to.have.length(1);
    expect(open[0].seller).to.equal(seller.address);
  });

  it("rejects a wrong listing fee or zero price", async () => {
    await expect(
      market.connect(seller).createToken("u", ONE, { value: 0 })
    ).to.be.revertedWith("Send exactly the listing fee");
    await expect(
      market.connect(seller).createToken("u", 0, { value: fee })
    ).to.be.revertedWith("Price must be greater than zero");
  });

  it("pays the seller and the operator on sale", async () => {
    await list();
    const sellerBefore = await seller.getBalance();
    const operatorBefore = await operator.getBalance();

    await market.connect(buyer).createMarketSale(1, { value: ONE });

    expect(await market.ownerOf(1)).to.equal(buyer.address);
    expect((await seller.getBalance()).sub(sellerBefore)).to.equal(ONE);
    expect((await operator.getBalance()).sub(operatorBefore)).to.equal(fee);
    expect(await market.fetchMarketItems()).to.have.length(0);
  });

  it("rejects underpayment and double purchase", async () => {
    await list();
    await expect(
      market.connect(buyer).createMarketSale(1, { value: ONE.sub(1) })
    ).to.be.revertedWith("Send exactly the asking price");
    await market.connect(buyer).createMarketSale(1, { value: ONE });
    await expect(
      market.connect(operator).createMarketSale(1, { value: ONE })
    ).to.be.revertedWith("Item is not for sale");
  });

  it("lets a buyer resell and tracks ownership views", async () => {
    await list();
    await market.connect(buyer).createMarketSale(1, { value: ONE });
    expect(await market.connect(buyer).fetchMyNFTs()).to.have.length(1);

    await market.connect(buyer).resellToken(1, ONE.mul(2), { value: fee });
    expect(await market.ownerOf(1)).to.equal(market.address);
    expect(await market.connect(buyer).fetchItemsListed()).to.have.length(1);
    expect(await market.connect(buyer).fetchMyNFTs()).to.have.length(0);
  });

  it("restricts fee changes to the operator", async () => {
    await expect(
      market.connect(seller).updateListingPrice(1)
    ).to.be.revertedWith("Caller is not the marketplace operator");
    await market.updateListingPrice(123);
    expect(await market.getListingPrice()).to.equal(123);
  });
});
