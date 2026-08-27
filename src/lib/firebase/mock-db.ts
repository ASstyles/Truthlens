import {
  UserProfile,
  ProjectKnowledgeModel,
  AssessmentQuestion,
  QuestionResponse,
  CompetencyReport,
  SoulboundCredential,
  SevenLayerVerificationResult,
  AssessmentMode,
  IntegrityEvent,
  IntegritySummary,
} from "../types";
import { DEMO_PROJECTS } from "../github/demo-projects";
import { canonicalizeJson, hashCanonicalCredentialKeccak } from "../ipfs/canonical-hash";

export interface ActiveAssessmentSession {
  assessmentId: string;
  sessionId?: string;
  projectId: string;
  projectName: string;
  candidateName: string;
  candidateEmail: string;
  candidateUid: string;
  mode: AssessmentMode;
  isDemo: boolean;
  totalQuestions: number;
  currentTurn: number;
  currentQuestion: {
    question: string;
    competency: string;
    category: string;
    order: number;
    expectedKeyPoints?: string[];
    contextHint?: string;
    internalDifficulty?: "EASY" | "MEDIUM" | "HARD";
  };
  turns: Array<{
    questionNumber: number;
    question: string;
    competency: string;
    category: string;
    answer: string;
    score?: number;
    strengths?: string[];
    weaknesses?: string[];
    reasoning?: string;
    internalDifficulty?: "EASY" | "MEDIUM" | "HARD";
  }>;
  integrityLog?: IntegrityEvent[];
  integrityScore?: number;
  lastHeartbeat?: string;
  report?: CompetencyReport;
  createdAt: string;
  updatedAt: string;
}

export interface UserGithubAuthRecord {
  accessToken: string;
  username: string;
  avatarUrl?: string;
  connectedAt: string;
}

/**
 * TruthLens Multi-Tenant Database Store
 * Implements strict per-user UID partitioning across:
 * - users/{uid}/profile
 * - users/{uid}/github
 * - users/{uid}/projects/{projectId}
 * - users/{uid}/assessments/{assessmentId}
 * - users/{uid}/credentials/{credentialId}
 * - public credentials registry: credentials/{credentialId} (for /verify/:id)
 */
class TruthLensDatabase {
  // 1. User profiles partitioned by Firebase UID
  private users: Record<string, UserProfile> = {};

  // 2. User GitHub OAuth tokens partitioned by Firebase UID
  private userGithub: Record<string, UserGithubAuthRecord> = {};

  // 3. User Project Knowledge Models: Record<UID, Record<ProjectId, ProjectKnowledgeModel>>
  private userProjects: Record<string, Record<string, ProjectKnowledgeModel>> = {};

  // 4. User Assessment Sessions: Record<UID, Record<AssessmentId, ActiveAssessmentSession>>
  private userAssessments: Record<string, Record<string, ActiveAssessmentSession>> = {};

  // 5. User Soulbound Credentials: Record<UID, Record<CredentialId, SoulboundCredential>>
  private userCredentials: Record<string, Record<string, SoulboundCredential>> = {};

  // 6. Public Credentials Registry: Record<CredentialId, SoulboundCredential> (for public verification)
  private publicCredentials: Record<string, SoulboundCredential> = {};

  // 7. Global / Demo Project Knowledge Models (Explicit Demo Mode Only)
  private demoProjects: Record<string, ProjectKnowledgeModel> = {};

  // 8. Ephemeral OAuth States tied to Initiating UID: Record<StateNonce, OAuthStateRecord>
  private oauthStates: Record<string, { state: string; uid: string; targetEmail?: string; createdAt: number }> = {};

  constructor() {
    // Seed initial demo project models for explicit demo usage
    DEMO_PROJECTS.forEach((dp) => {
      this.demoProjects[dp.knowledgeModel.projectId] = dp.knowledgeModel;
      this.demoProjects[dp.metadata.id] = dp.knowledgeModel;
    });

    // Seed canonical public credential TL-2026-8492-v1 for public verification benchmarks
    const initialCredentialId = "TL-2026-8492-v1";
    const initialCid = "bafkreihdwdcefgh4dqkjv67uz6y3f7g42p73huvqnmkj65l3aex42";
    const initialVerifiedTech = ["Solidity", "Hardhat", "Chainlink Oracles", "Ethers.js v6", "Polygon"];
    const initialEvidence = [
      "✓ Articulated atomic swap execution mechanics & slippage bounds in ApexLiquidityRouter.sol",
      "✓ Correctly identified MEV sandwich vulnerabilities & implemented strict deadline constraints",
      "✓ Designed graceful fallback for Chainlink L2 Sequencer downtime & price staleness",
    ];

    const initialMetadataPayload = {
      credentialId: initialCredentialId,
      version: "1.0",
      skills: initialVerifiedTech,
      assessmentLevel: "Advanced",
      scoreBand: "Highly Competent (88/100)",
      evidenceSummary: initialEvidence,
      issuer: "TruthLens Authority (Polygon Amoy Anchor)",
      issuedAt: "2026-08-26T18:00:00Z",
      blockchainNetwork: "Polygon Amoy Testnet",
      contractAddress: "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1",
      recipientWallet: "0x71C8416620593520F3124190c107147A5F456B72",
      projectName: "apex-dex-protocol",
    };

    const initialHash = hashCanonicalCredentialKeccak(initialMetadataPayload);

    const seedCredential: SoulboundCredential = {
      tokenId: 1001,
      credentialId: initialCredentialId,
      version: "1.0",
      recipientWallet: "0x71C8416620593520F3124190c107147A5F456B72",
      candidateName: "Sample Candidate",
      projectId: "demo-apex-dex",
      projectName: "apex-dex-protocol",
      assessmentId: "eval-initial-apex-8492",
      assessmentMode: "INDEPENDENT",
      overallScore: 88,
      scoreBand: "Highly Competent",
      assessmentLevel: "Advanced",
      verifiedTechnologies: initialVerifiedTech,
      evidenceList: [
        {
          id: "ev-1",
          category: "ARCHITECTURE",
          statement: initialEvidence[0],
          demonstratedCompetence: "STRONG",
        },
        {
          id: "ev-2",
          category: "SECURITY",
          statement: initialEvidence[1],
          demonstratedCompetence: "STRONG",
        },
        {
          id: "ev-3",
          category: "FAILURE_SCENARIOS",
          statement: initialEvidence[2],
          demonstratedCompetence: "STRONG",
        },
      ],
      ipfsCID: initialCid,
      ipfsGatewayUrl: `https://gateway.pinata.cloud/ipfs/${initialCid}`,
      credentialHash: initialHash,
      blockchainNetwork: "Polygon Amoy Testnet",
      contractAddress: "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1",
      transactionHash: "0x4e2a87b54c86bfd732890632a9d80c6576b512037bb4e6d421890f5b9d21469e",
      blockNumber: 1249821,
      issuerAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      status: "ACTIVE",
      issuedAt: "2026-08-26T18:00:00Z",
    };

    this.publicCredentials[initialCredentialId] = seedCredential;
  }

  // --------------------------------------------------------------------------
  // USER PROFILE METHODS (users/{uid}/profile)
  // --------------------------------------------------------------------------
  getUser(uid: string): UserProfile | null {
    if (!uid) return null;
    return this.users[uid] || null;
  }

  saveUser(user: UserProfile): void {
    if (!user || !user.uid) return;
    this.users[user.uid] = {
      ...this.users[user.uid],
      ...user,
      updatedAt: new Date().toISOString(),
    };
  }

  updateUser(uid: string, updates: Partial<UserProfile>): UserProfile | null {
    if (!uid || !this.users[uid]) return null;
    const updated = {
      ...this.users[uid],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.users[uid] = updated;
    return updated;
  }

  updateUserWallet(uid: string, walletAddress: string | null): UserProfile | null {
    if (!uid) return null;
    if (!this.users[uid]) {
      this.users[uid] = {
        uid,
        name: "Developer",
        email: "",
        walletAddress: walletAddress || undefined,
        role: "STUDENT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return this.users[uid];
    }
    this.users[uid].walletAddress = walletAddress || undefined;
    this.users[uid].updatedAt = new Date().toISOString();
    return this.users[uid];
  }

  // --------------------------------------------------------------------------
  // USER GITHUB METHODS (users/{uid}/github)
  // --------------------------------------------------------------------------
  getUserGithub(uid: string): UserGithubAuthRecord | null {
    if (!uid) return null;
    return this.userGithub[uid] || null;
  }

  findUserByGithubUsername(username: string): string | null {
    if (!username) return null;
    const clean = username.toLowerCase().trim();
    for (const [uid, record] of Object.entries(this.userGithub)) {
      if (record.username && record.username.toLowerCase().trim() === clean) {
        return uid;
      }
    }
    return null;
  }

  saveUserGithub(uid: string, data: { accessToken: string; username: string; avatarUrl?: string }): void {
    if (!uid || !data.accessToken) return;
    this.userGithub[uid] = {
      accessToken: data.accessToken,
      username: data.username,
      avatarUrl: data.avatarUrl,
      connectedAt: new Date().toISOString(),
    };
    if (this.users[uid]) {
      this.users[uid].githubUsername = data.username;
      if (data.avatarUrl && !this.users[uid].photoURL) {
        this.users[uid].photoURL = data.avatarUrl;
      }
      this.users[uid].updatedAt = new Date().toISOString();
    }
  }

  deleteUserGithub(uid: string): void {
    if (!uid) return;
    delete this.userGithub[uid];
    if (this.users[uid]) {
      delete this.users[uid].githubUsername;
      this.users[uid].updatedAt = new Date().toISOString();
    }
  }

  // --------------------------------------------------------------------------
  // USER PROJECT METHODS (users/{uid}/projects/{projectId})
  // --------------------------------------------------------------------------
  getUserProjects(uid: string): ProjectKnowledgeModel[] {
    if (!uid || !this.userProjects[uid]) return [];
    return Object.values(this.userProjects[uid]);
  }

  getUserProject(uid: string, projectId: string): ProjectKnowledgeModel | null {
    if (uid && this.userProjects[uid] && this.userProjects[uid][projectId]) {
      return this.userProjects[uid][projectId];
    }
    // Fallback to demo projects only if demo ID requested
    return this.demoProjects[projectId] || null;
  }

  saveUserProject(uid: string, project: ProjectKnowledgeModel): void {
    if (!project || !project.projectId) return;
    if (uid) {
      if (!this.userProjects[uid]) {
        this.userProjects[uid] = {};
      }
      this.userProjects[uid][project.projectId] = project;
    }
    // Also index in global demo store if it is a demo project
    this.demoProjects[project.projectId] = project;
  }

  // Backward compatibility alias for global lookups
  getProject(id: string): ProjectKnowledgeModel | null {
    if (this.demoProjects[id]) return this.demoProjects[id];
    for (const uid in this.userProjects) {
      if (this.userProjects[uid][id]) {
        return this.userProjects[uid][id];
      }
    }
    return null;
  }

  saveProject(project: ProjectKnowledgeModel, uid?: string): void {
    if (!project) return;
    if (uid) {
      this.saveUserProject(uid, project);
    } else {
      this.demoProjects[project.projectId] = project;
    }
  }

  // --------------------------------------------------------------------------
  // USER ASSESSMENT METHODS (users/{uid}/assessments/{assessmentId})
  // --------------------------------------------------------------------------
  getUserAssessments(uid: string): ActiveAssessmentSession[] {
    if (!uid || !this.userAssessments[uid]) return [];
    return Object.values(this.userAssessments[uid]);
  }

  getUserAssessment(uid: string, assessmentId: string): ActiveAssessmentSession | null {
    if (!uid || !this.userAssessments[uid]) return null;
    return this.userAssessments[uid][assessmentId] || null;
  }

  saveUserAssessment(uid: string, session: ActiveAssessmentSession): void {
    if (!session || !session.assessmentId) return;
    const targetUid = uid || session.candidateUid || "default-user";
    if (!this.userAssessments[targetUid]) {
      this.userAssessments[targetUid] = {};
    }
    this.userAssessments[targetUid][session.assessmentId] = session;
  }

  updateUserAssessment(
    uid: string,
    assessmentId: string,
    updates: Partial<ActiveAssessmentSession>
  ): ActiveAssessmentSession | null {
    const targetUid = uid || "default-user";
    let session = this.getUserAssessment(targetUid, assessmentId);
    if (!session) {
      // Find across sessions if UID was unmapped
      session = this.getAssessmentSession(assessmentId);
    }
    if (!session) return null;

    Object.assign(session, updates, { updatedAt: new Date().toISOString() });
    if (session.candidateUid) {
      if (!this.userAssessments[session.candidateUid]) {
        this.userAssessments[session.candidateUid] = {};
      }
      this.userAssessments[session.candidateUid][assessmentId] = session;
    }
    return session;
  }

  createAssessmentSession(session: ActiveAssessmentSession): void {
    this.saveUserAssessment(session.candidateUid, session);
  }

  getAssessmentSession(assessmentId: string): ActiveAssessmentSession | null {
    if (!assessmentId) return null;
    for (const uid in this.userAssessments) {
      if (this.userAssessments[uid][assessmentId]) {
        return this.userAssessments[uid][assessmentId];
      }
    }
    return null;
  }

  updateAssessmentSession(
    assessmentId: string,
    updates: Partial<ActiveAssessmentSession>
  ): ActiveAssessmentSession | null {
    const session = this.getAssessmentSession(assessmentId);
    if (!session) return null;
    return this.updateUserAssessment(session.candidateUid, assessmentId, updates);
  }

  saveAssessment(
    assessmentId: string,
    questions: AssessmentQuestion[],
    responses: QuestionResponse[],
    report?: CompetencyReport
  ): void {
    const session = this.getAssessmentSession(assessmentId);
    if (session && report) {
      session.report = report;
      this.updateAssessmentSession(assessmentId, { report });
    }
  }

  getAssessment(assessmentId: string) {
    const session = this.getAssessmentSession(assessmentId);
    if (!session) return null;
    return {
      questions: [],
      responses: [],
      report: session.report,
    };
  }

  // --------------------------------------------------------------------------
  // USER & PUBLIC CREDENTIAL METHODS
  // --------------------------------------------------------------------------
  getUserCredentials(uid: string): SoulboundCredential[] {
    if (!uid || !this.userCredentials[uid]) return [];
    return Object.values(this.userCredentials[uid]);
  }

  saveUserCredential(uid: string, cred: SoulboundCredential): void {
    if (!cred || !cred.credentialId) return;
    const targetUid = uid || "default-user";
    if (!this.userCredentials[targetUid]) {
      this.userCredentials[targetUid] = {};
    }
    this.userCredentials[targetUid][cred.credentialId] = cred;
    // Also register in public verification registry
    this.publicCredentials[cred.credentialId] = cred;
  }

  saveCredential(cred: SoulboundCredential): void {
    this.publicCredentials[cred.credentialId] = cred;
  }

  savePublicCredential(cred: SoulboundCredential): void {
    this.publicCredentials[cred.credentialId] = cred;
  }

  getCredential(credentialId: string): SoulboundCredential | null {
    if (!credentialId) return null;
    if (this.publicCredentials[credentialId]) {
      return this.publicCredentials[credentialId];
    }
    for (const uid in this.userCredentials) {
      if (this.userCredentials[uid][credentialId]) {
        return this.userCredentials[uid][credentialId];
      }
    }
    return null;
  }

  getPublicCredential(credentialId: string): SoulboundCredential | null {
    return this.getCredential(credentialId);
  }

  getAllCredentials(): SoulboundCredential[] {
    return Object.values(this.publicCredentials);
  }

  revokeCredential(credentialId: string, reason: string): boolean {
    const cred = this.getCredential(credentialId);
    if (!cred) return false;
    cred.status = "REVOKED";
    cred.revokedAt = new Date().toISOString();
    cred.revocationReason = reason;
    this.publicCredentials[credentialId] = cred;
    return true;
  }

  // --------------------------------------------------------------------------
  // OAUTH STATE MANAGEMENT (ANTI-CSRF & UID BINDING)
  // --------------------------------------------------------------------------
  saveOAuthState(state: string, data: { uid: string; targetEmail?: string }): void {
    if (!state || !data.uid) return;
    this.cleanupOAuthStates();
    this.oauthStates[state] = {
      state,
      uid: data.uid,
      targetEmail: data.targetEmail,
      createdAt: Date.now(),
    };
  }

  getOAuthState(state: string): { state: string; uid: string; targetEmail?: string; createdAt: number } | null {
    if (!state) return null;
    this.cleanupOAuthStates();
    return this.oauthStates[state] || null;
  }

  deleteOAuthState(state: string): void {
    if (!state) return;
    delete this.oauthStates[state];
  }

  cleanupOAuthStates(): void {
    const now = Date.now();
    const expiry = 15 * 60 * 1000; // 15 minutes TTL
    for (const [s, rec] of Object.entries(this.oauthStates)) {
      if (now - rec.createdAt > expiry) {
        delete this.oauthStates[s];
      }
    }
  }

  // --------------------------------------------------------------------------
  // STATE CLEANUP / LOGOUT PURGE
  // --------------------------------------------------------------------------
  clearUserData(uid: string): void {
    if (!uid) return;
    delete this.users[uid];
    delete this.userGithub[uid];
    delete this.userProjects[uid];
    delete this.userAssessments[uid];
    delete this.userCredentials[uid];
  }
}

const globalForDb = globalThis as unknown as { db: TruthLensDatabase };
export const db = globalForDb.db || (globalForDb.db = new TruthLensDatabase());
