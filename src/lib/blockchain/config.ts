export interface BlockchainNetwork {
  id: string;
  name: string;
  chainId: number;
  hexChainId: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contractAddress: string;
  isTestnet: boolean;
}

export const SUPPORTED_NETWORKS: Record<string, BlockchainNetwork> = {
  amoy: {
    id: "amoy",
    name: "Polygon Amoy Testnet",
    chainId: 80002,
    hexChainId: "0x13882",
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
    blockExplorer: "https://amoy.polygonscan.com",
    nativeCurrency: {
      name: "POL",
      symbol: "POL",
      decimals: 18,
    },
    contractAddress: process.env.NEXT_PUBLIC_SOULBOUND_CONTRACT_ADDRESS || "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1",
    isTestnet: true,
  },
  localhost: {
    id: "localhost",
    name: "Hardhat Local Node",
    chainId: 31337,
    hexChainId: "0x7a69",
    rpcUrl: "http://127.0.0.1:8545",
    blockExplorer: "http://localhost:8545",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
    contractAddress: process.env.NEXT_PUBLIC_SOULBOUND_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    isTestnet: true,
  },
  sepolia: {
    id: "sepolia",
    name: "Ethereum Sepolia Testnet",
    chainId: 11155111,
    hexChainId: "0xaa36a7",
    rpcUrl: "https://rpc.sepolia.org",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "SepoliaETH",
      symbol: "ETH",
      decimals: 18,
    },
    contractAddress: process.env.NEXT_PUBLIC_SOULBOUND_CONTRACT_ADDRESS || "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1",
    isTestnet: true,
  },
};

export const DEFAULT_NETWORK = SUPPORTED_NETWORKS.amoy;
