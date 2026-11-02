require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { TESTNET_RPC_URL, DEPLOYER_PRIVATE_KEY } = process.env;

// A remote network is only registered when both values are provided,
// so `npx hardhat compile/test` works with no configuration at all.
const networks = {};
if (TESTNET_RPC_URL && DEPLOYER_PRIVATE_KEY) {
  networks.testnet = {
    url: TESTNET_RPC_URL,
    accounts: [DEPLOYER_PRIVATE_KEY],
  };
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks,
};
