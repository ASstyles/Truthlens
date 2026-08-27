import { NextRequest, NextResponse } from "next/server";
import { getIpfsProvider } from "@/lib/ipfs/storage";
import { canonicalizeJson, hashCanonicalCredentialKeccak } from "@/lib/ipfs/canonical-hash";
import { BlockchainClient } from "@/lib/blockchain/client";
import { db } from "@/lib/firebase/mock-db";
import { generateCredentialId } from "@/lib/utils/crypto";
import { PrivacyPreservingMetadata, SoulboundCredential } from "@/lib/types";
import { DEFAULT_NETWORK } from "@/lib/blockchain/config";
import { getAuthenticatedSession } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);
    const body = await req.json();
    const {
      report,
      recipientWallet,
      signature,
      proofMessage,
      networkKey = "amoy",
    } = body;

    if (!report || !recipientWallet) {
      return NextResponse.json({ error: "Missing report or recipientWallet" }, { status: 400 });
    }

    // 1. Verify wallet signature if provided
    if (signature && proofMessage) {
      const isSignatureValid = BlockchainClient.verifySignature(proofMessage, signature, recipientWallet);
      if (!isSignatureValid) {
        return NextResponse.json({ error: "Cryptographic wallet signature verification failed." }, { status: 401 });
      }
    }

    // 2. Generate versioned Credential ID
    const version = report.version || "v1";
    const credentialId = generateCredentialId(report.projectName, version);

    // 3. Build Privacy-Preserving IPFS Metadata Document
    // (Notice: NO raw source code, NO private answers, NO PII on public IPFS)
    const ipfsMetadata: PrivacyPreservingMetadata = {
      credentialId,
      version: "1.0",
      skills: report.verifiedTechnologies || [],
      assessmentLevel: report.assessmentLevel || "Advanced",
      scoreBand: `${report.scoreBand} (${report.overallScore}/100)`,
      evidenceSummary: (report.evidenceList || []).map((e: any) => e.statement),
      issuer: "TruthLens Authority (Polygon Amoy Anchor)",
      issuedAt: new Date().toISOString(),
      blockchainNetwork: DEFAULT_NETWORK.name,
      contractAddress: DEFAULT_NETWORK.contractAddress,
      recipientWallet,
      projectName: report.projectName,
    };

    // 4. Canonicalize and Hash
    const canonicalHash = hashCanonicalCredentialKeccak(ipfsMetadata);

    // 5. Upload to IPFS
    const ipfsProvider = getIpfsProvider();
    const ipfsResult = await ipfsProvider.uploadCanonicalMetadata(ipfsMetadata);

    // 6. Anchor on Blockchain (EVM Testnet / Polygon Amoy)
    const blockchainClient = new BlockchainClient(networkKey);
    const txResult = await blockchainClient.issueCredentialOnChain(
      recipientWallet,
      credentialId,
      canonicalHash,
      ipfsResult.cid
    );

    // 7. Assemble Full Credential Record
    const credentialRecord: SoulboundCredential = {
      tokenId: txResult.tokenId,
      credentialId,
      version,
      recipientWallet,
      candidateName: report.candidateName || session?.user?.name || "Developer",
      projectId: report.projectId,
      projectName: report.projectName,
      assessmentId: report.assessmentId,
      assessmentMode: report.assessmentMode,
      overallScore: report.overallScore,
      scoreBand: report.scoreBand,
      assessmentLevel: report.assessmentLevel,
      verifiedTechnologies: report.verifiedTechnologies,
      evidenceList: report.evidenceList,
      ipfsCID: ipfsResult.cid,
      ipfsGatewayUrl: ipfsResult.gatewayUrl,
      credentialHash: canonicalHash,
      blockchainNetwork: DEFAULT_NETWORK.name,
      contractAddress: DEFAULT_NETWORK.contractAddress,
      transactionHash: txResult.txHash,
      blockNumber: txResult.blockNumber,
      issuerAddress: process.env.ISSUER_ADDRESS || "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      status: "ACTIVE",
      issuedAt: ipfsMetadata.issuedAt,
    };

    // 8. Persist in database (scoped to candidateUid and public registry)
    const targetUid = session?.uid || report.candidateUid;
    if (targetUid) {
      db.saveUserCredential(targetUid, credentialRecord);
    } else {
      db.savePublicCredential(credentialRecord);
    }

    return NextResponse.json(
      {
        success: true,
        credential: credentialRecord,
        ipfs: ipfsResult,
        transaction: txResult,
        explorerUrl: `${DEFAULT_NETWORK.blockExplorer}/tx/${txResult.txHash}`,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      }
    );
  } catch (err: any) {
    console.error("Credential issuance error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
