import { ethers } from "hardhat";

async function main() {
  console.log("----------------------------------------------------");
  console.log("Deploying TruthLensSoulboundCredential Smart Contract...");
  console.log("----------------------------------------------------");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH/POL`);

  const name = "TruthLens Soulbound Credential";
  const symbol = "TL-SBT";

  const TruthLensFactory = await ethers.getContractFactory("TruthLensSoulboundCredential");
  const contract = await TruthLensFactory.deploy(name, symbol, deployer.address);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✅ TruthLensSoulboundCredential deployed successfully!");
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔗 Name: ${name} (${symbol})`);
  console.log(`👑 Admin & Initial Issuer: ${deployer.address}`);
  console.log("----------------------------------------------------");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
