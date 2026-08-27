# 🔍 TruthLens: Proof-of-Competence Platform for the AI Era

> **"Don't just claim that you built it. Prove that you understand it."**

TruthLens is a decentralized, AI-driven **Proof-of-Competence** platform that evaluates whether a developer genuinely understands, can debug, and can adapt software projects they claim to have built.

---

## ⚡ What TruthLens Is (and Is NOT)

- ❌ **TruthLens is NOT an AI detector.** It does not guess whether ChatGPT, Claude, or Copilot generated the code.
- ✅ **TruthLens is a Proof-of-Competence engine.** It analyzes the submitted codebase, challenges the candidate with dynamic multi-turn architectural questions and chaos/failure scenarios, evaluates demonstrated technical reasoning, and issues an immutable, non-transferable **Soulbound Token (ERC-5192)** anchored on Polygon Amoy EVM with canonical IPFS metadata.

---

## 🏛️ 5-Layer Core Architecture

```
Layer 1 — Evidence:       GitHub Repository & Source Code Topology
         ↓
Layer 2 — Intelligence:   TruthLens Static Project Analyzer → Project Knowledge Model
         ↓
Layer 3 — Evaluation:     Adaptive Proof-of-Competence Assessment & Evidence Engine
         ↓
Layer 4 — Credential:     Evidence-Backed Competency Report & IPFS Metadata
         ↓
Layer 5 — Trust:          Soulbound Smart Contract (Polygon Amoy) + 7-Point Public Verification + QR
```

---

## 🚀 Key Features

1. **Static Project & Code Analyzer**:
   - Parses languages, frameworks (Next.js, FastAPI, Solidity, Go), dependencies, API routes, database schemas, auth patterns (JWT, SIWE, OAuth2), and security-critical entry points into a rich `ProjectKnowledgeModel`.
2. **Adaptive Anti-Outsourcing Assessment**:
   - Zero generic trivia questions. Every question is anchored to the submitted codebase.
   - Dynamic multi-turn interrogation: Follow-up questions dynamically drill into failure modes, cache stampedes, 20x traffic bottlenecks, and engineering tradeoffs based on the candidate's prior answers.
   - **Dual Modes**: *Independent Assessment* (unassisted reasoning) vs *AI-Assisted Assessment* (working effectively with AI).
3. **Evidence-Backed Competency Scoring**:
   - Generates 6-dimension weighted radar scores (Project Understanding, Architecture, Code Navigation, Debugging, Security, Decision Making).
   - Generates concrete verified evidence bullets (e.g. `✓ Articulated atomic swap execution mechanics & slippage bounds in ApexLiquidityRouter.sol`).
4. **Decentralized Soulbound Credential (ERC-5192)**:
   - Non-transferable ERC-721 token on **Polygon Amoy Testnet (Chain ID: 80002)**.
   - Minimal on-chain footprint (`credentialId`, `credentialHash`, `ipfsCID`, `issuer`, `recipient`, `status`, `revokedAt`).
   - Token transfers revert with `SoulboundTokenCannotBeTransferred()`.
5. **Canonical IPFS Metadata (Privacy-Preserving)**:
   - RFC-8785 canonical JSON serialization hashed with Keccak-256.
   - **Zero PII, zero source code, zero raw answers on public IPFS.**
6. **7-Point Independent Cryptographic Verification**:
   - Public URL `/verify/[credentialId]` with mobile-friendly dynamic QR code.
   - Real-time mathematical verification: Registry Existence ➔ IPFS Retrieval ➔ Keccak-256 Hash Match ➔ Blockchain Anchor ➔ Issuer Role ➔ Active/Revocation Status ➔ Soulbound Wallet Binding.
7. **Instant 1-Click SIH Live Demo**:
   - Pre-loaded with 3 high-detail realistic production codebases (*Apex DeFi AMM Protocol*, *NeuroMed AI Diagnostic Orchestrator*, *Sentinel Distributed Event Mesh*) for zero-setup judging.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide React, Framer Motion |
| **Blockchain** | Solidity 0.8.24 (Cancun EVM), Hardhat, OpenZeppelin Contracts v5, ERC-5192 |
| **Networks** | Polygon Amoy Testnet (80002), Ethereum Sepolia (11155111), Local Hardhat (31337) |
| **AI Assessment** | Google Gemini Pro (`@google/generative-ai`) with smart dynamic local fallback |
| **Storage & IPFS** | Pinata IPFS Pinning + Deterministic Keccak-256 Canonical Serializer (RFC-8785) |
| **Database & Auth**| Firebase Authentication & Firestore (with local zero-config persistent store) |
| **Web3 Client** | Ethers.js v6, Browser Wallet (MetaMask / EIP-1193), QR Canvas Generator |

---

## 📦 Quick Start & Local Development

### 1. Clone and Install Dependencies
```bash
cd truthlens
npm install --legacy-peer-deps
```

### 2. Run Smart Contract Tests
```bash
npm run hardhat:test
```
*Expected: 14 passing tests covering deployment, ERC-5192 locking, non-transferability, duplicate prevention, and revocation lifecycle.*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧭 SIH Presentation Walkthrough (Step-by-Step)

1. **Landing Page (`/`)**:
   - Click **"Launch Live Demo"** or select one of the 3 pre-loaded production repositories.
2. **Project Analyzer (`/dashboard/analyze`)**:
   - Inspect the automatically synthesized **System Architecture DAG**, dependency breakdown, and security risk radar.
3. **Adaptive Assessment (`/dashboard/assessment`)**:
   - Select assessment mode (*Independent* or *AI-Assisted*).
   - Answer the project-grounded questions or click **"Auto-Fill Demo Response"**.
   - Experience the **Dynamic Adaptive Follow-up Turn** drilling into chaos/failure modes.
4. **Proof-of-Competence Report (`/dashboard/report/[id]`)**:
   - View the overall score ring (e.g. 88/100), 6-dimension Competency Radar, and verified evidence statements.
   - Click **"Connect Wallet & Issue Soulbound Credential"**.
5. **On-Chain Credential Issuance**:
   - Sign the cryptographic wallet ownership message.
   - Soulbound token is minted on Polygon Amoy testnet with canonical IPFS hash.
6. **Public Verification & QR Portal (`/verify/[credentialId]`)**:
   - Open public verification page (no login required).
   - Inspect the **7-Point Cryptographic Checklist** (Hash match, PolygonScan tx, IPFS CID, Active status).
   - Scan the dynamic QR code with any mobile camera!
7. **Governance & Revocation (`/admin`)**:
   - Inspect on-chain credentials and test authorized revocation with permanent audit reason logging.

---

## 📜 Smart Contract Specification

The smart contract is located at `contracts/TruthLensSoulboundCredential.sol`.

### Core Interfaces & Events:
- `IERC5192`: Minimal Soulbound Token interface (`Locked(tokenId)` event and `locked(tokenId) -> bool`).
- `issueCredential(address recipient, string credentialId, bytes32 credentialHash, string ipfsCID)`
- `verifyCredential(string credentialId, bytes32 expectedHash)`
- `revokeCredential(uint256 tokenId, string reason)`

---

## 🔒 Security & Privacy Guarantees

1. **Zero Secret Leakage**: No private API keys or OAuth secrets in frontend code.
2. **Public IPFS Privacy**: Only canonical metadata summaries, verified skills, and score bands are pinned publicly. Source code and private evaluation answers are never exposed to IPFS or on-chain.
3. **Soulbound Immutability**: Credentials cannot be transferred from Wallet A to Wallet B under any circumstances.
4. **Audit Provenance**: Revoked credentials are not erased; their status transitions to `REVOKED` on-chain with a permanent audit timestamp and reason.

---

## 📄 License
MIT License. Built for the Smart India Hackathon and developer integrity in the AI era.
