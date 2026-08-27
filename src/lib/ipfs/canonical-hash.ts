import { ethers } from "ethers";

/**
 * Deterministically serializes a JavaScript object into canonical JSON format (RFC-8785 compliant).
 * Ensures that key order, whitespace, and nested objects produce the EXACT SAME byte representation
 * regardless of platform or runtime.
 */
export function canonicalizeJson(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const canonicalArray = obj.map((item) => canonicalizeJson(item));
    return `[${canonicalArray.join(",")}]`;
  }

  // Sort keys alphabetically
  const sortedKeys = Object.keys(obj).sort();
  const canonicalEntries = sortedKeys.map((key) => {
    const value = obj[key];
    return `${JSON.stringify(key)}:${canonicalizeJson(value)}`;
  });

  return `{${canonicalEntries.join(",")}}`;
}

/**
 * Generates an EVM-compatible Keccak-256 hash (bytes32 hex string) of the canonical JSON.
 * Matches Solidity's keccak256(bytes).
 */
export function hashCanonicalCredentialKeccak(metadataObj: any): string {
  const canonicalString = canonicalizeJson(metadataObj);
  const utf8Bytes = ethers.toUtf8Bytes(canonicalString);
  return ethers.keccak256(utf8Bytes);
}

/**
 * Computes SHA-256 hash for interoperability.
 */
export function hashCanonicalCredentialSha256(metadataObj: any): string {
  const canonicalString = canonicalizeJson(metadataObj);
  const utf8Bytes = ethers.toUtf8Bytes(canonicalString);
  return ethers.sha256(utf8Bytes);
}

/**
 * Verifies if a given canonical metadata object matches an on-chain Keccak-256 hash.
 */
export function verifyCanonicalHash(metadataObj: any, expectedOnChainHash: string): boolean {
  const computedHash = hashCanonicalCredentialKeccak(metadataObj);
  return computedHash.toLowerCase() === expectedOnChainHash.toLowerCase();
}
