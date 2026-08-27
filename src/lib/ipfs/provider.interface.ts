import { PrivacyPreservingMetadata } from "../types";

export interface IpfsUploadResult {
  cid: string;
  gatewayUrl: string;
  canonicalHash: string; // Keccak-256
  sizeBytes: number;
  pinnedAt: string;
}

export interface IIpfsProvider {
  name: string;
  uploadCanonicalMetadata(metadata: PrivacyPreservingMetadata): Promise<IpfsUploadResult>;
  fetchMetadata(cid: string): Promise<PrivacyPreservingMetadata | null>;
}
