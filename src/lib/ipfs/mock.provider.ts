import { IIpfsProvider, IpfsUploadResult } from "./provider.interface";
import { PrivacyPreservingMetadata } from "../types";
import { canonicalizeJson, hashCanonicalCredentialKeccak } from "./canonical-hash";
import { ethers } from "ethers";

// In-memory persistent simulated IPFS gateway cache for demo & offline mode
const mockIpfsStore: Record<string, { metadata: PrivacyPreservingMetadata; rawJson: string }> = {};

export class MockIpfsProvider implements IIpfsProvider {
  public name = "Simulated Local IPFS";
  private gateway = "https://ipfs.io/ipfs/";

  async uploadCanonicalMetadata(metadata: PrivacyPreservingMetadata): Promise<IpfsUploadResult> {
    const canonicalString = canonicalizeJson(metadata);
    const canonicalHash = hashCanonicalCredentialKeccak(metadata);

    // Generate a deterministic realistic base58 CIDv1 from the canonical hash
    const hashWithoutPrefix = canonicalHash.slice(2, 42);
    const simulatedCid = `bafkrei${hashWithoutPrefix.toLowerCase()}7uzcmw7ojee6xedvi`;

    mockIpfsStore[simulatedCid] = {
      metadata: JSON.parse(canonicalString),
      rawJson: canonicalString,
    };

    return {
      cid: simulatedCid,
      gatewayUrl: `${this.gateway}${simulatedCid}`,
      canonicalHash,
      sizeBytes: new TextEncoder().encode(canonicalString).length,
      pinnedAt: new Date().toISOString(),
    };
  }

  async fetchMetadata(cid: string): Promise<PrivacyPreservingMetadata | null> {
    const entry = mockIpfsStore[cid];
    if (entry) {
      return entry.metadata;
    }
    return null;
  }
}

export function getIpfsStoreSnapshot(): Record<string, PrivacyPreservingMetadata> {
  const result: Record<string, PrivacyPreservingMetadata> = {};
  for (const [cid, val] of Object.entries(mockIpfsStore)) {
    result[cid] = val.metadata;
  }
  return result;
}
