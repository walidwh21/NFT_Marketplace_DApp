const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function deploy(name) {
  const factory = await hre.ethers.getContractFactory(name);
  const instance = await factory.deploy();
  await instance.deployed();
  console.log(`${name.padEnd(16)} -> ${instance.address}`);
  return instance.address;
}

async function main() {
  const addresses = {
    NFTMarketplace: await deploy("NFTMarketplace"),
    TransferFunds: await deploy("TransferFunds"),
  };

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${hre.network.name}.json`);
  fs.writeFileSync(file, JSON.stringify(addresses, null, 2) + "\n");

  console.log(`\nSaved to ${path.relative(process.cwd(), file)}`);
  console.log("Copy these into .env.local as NEXT_PUBLIC_MARKETPLACE_ADDRESS / NEXT_PUBLIC_TRANSFER_ADDRESS.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
