import { IIpfsProvider, IpfsUploadResult } from "./provider.interface";
import { PrivacyPreservingMetadata } from "../types";
import { canonicalizeJson, hashCanonicalCredentialKeccak } from "./canonical-hash";
import { ipfsCache } from "../utils/cache";

export class PinataIpfsProvider implements IIpfsProvider {
  public name = "Pinata IPFS";
  private jwt: string;
  private apiKey: string;
  private secretKey: string;
  private gateway: string;

  constructor(jwt?: string, gateway?: string) {
    this.jwt = jwt || process.env.PINATA_JWT || "";
    this.apiKey = process.env.PINATA_API_KEY || "";
    this.secretKey = process.env.PINATA_SECRET_API_KEY || "";
    this.gateway = gateway || process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/";
  }

  async uploadCanonicalMetadata(metadata: PrivacyPreservingMetadata): Promise<IpfsUploadResult> {
    const canonicalString = canonicalizeJson(metadata);
    const canonicalHash = hashCanonicalCredentialKeccak(metadata);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.jwt && this.jwt.trim().length > 10) {
      headers["Authorization"] = `Bearer ${this.jwt.trim()}`;
    } else if (this.apiKey && this.secretKey) {
      headers["pinata_api_key"] = this.apiKey.trim();
      headers["pinata_secret_api_key"] = this.secretKey.trim();
    } else {
      throw new Error("PINATA_JWT or PINATA_API_KEY/PINATA_SECRET_API_KEY is required in environment.");
    }

    const payload = {
      pinataOptions: {
        cidVersion: 1,
      },
      pinataMetadata: {
        name: `truthlens-${metadata.credentialId}.json`,
        keyvalues: {
          credentialId: metadata.credentialId,
          version: metadata.version,
          issuer: metadata.issuer,
          canonicalHash: canonicalHash,
        },
      },
      pinataContent: JSON.parse(canonicalString),
    };

    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Pinata upload failed (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    const cid = data.IpfsHash;
    const gatewayUrl = `${this.gateway.replace(/\/+$/, "")}/${cid}`;

    const result: IpfsUploadResult = {
      cid,
      gatewayUrl,
      canonicalHash,
      sizeBytes: data.PinSize || new TextEncoder().encode(canonicalString).length,
      pinnedAt: data.Timestamp || new Date().toISOString(),
    };

    // Cache the uploaded metadata
    ipfsCache.set(cid, metadata, 1800);

    return result;
  }

  async fetchMetadata(cid: string): Promise<PrivacyPreservingMetadata | null> {
    if (!cid) return null;

    // Check fast memory cache first
    const cached = ipfsCache.get<PrivacyPreservingMetadata>(cid);
    if (cached) {
      return cached;
    }

    try {
      const gatewayUrl = `${this.gateway.replace(/\/+$/, "")}/${cid}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s gateway timeout

      const res = await fetch(gatewayUrl, {
        signal: controller.signal,
        next: { revalidate: 300 },
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const data = (await res.json()) as PrivacyPreservingMetadata;
      ipfsCache.set(cid, data, 1800);
      return data;
    } catch {
      return null;
    }
  }
}
