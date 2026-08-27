import { ethers } from "ethers";

export function generateRandomNonce(): string {
  return ethers.hexlify(ethers.randomBytes(16));
}

export function generateCredentialId(projectName: string, version = "v1"): string {
  const cleanName = projectName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4);
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `TL-2026-${cleanName}-${randomNum}-${version}`;
}
