// ==============================================================================
// TRUTHLENS CORE DOMAIN TYPES
// ==============================================================================

export type AssessmentMode = "INDEPENDENT" | "AI_ASSISTED";

export type InternalDifficulty = "EASY" | "MEDIUM" | "HARD";

export type CredentialStatus = "ACTIVE" | "REVOKED";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  githubUsername?: string;
  walletAddress?: string;
  role?: "STUDENT" | "RECRUITER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

export interface RepositoryMetadata {
  id: string;
  name: string;
  owner: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  isPrivate: boolean;
  defaultBranch: string;
  lastUpdated: string;
  url: string;
  topics: string[];
}

export interface DependencyItem {
  name: string;
  version: string;
  category: "FRONTEND" | "BACKEND" | "DATABASE" | "AI_ML" | "BLOCKCHAIN" | "DEV" | "SECURITY";
}

export interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "WS";
  path: string;
  handler: string;
  file: string;
  isProtected: boolean;
}

export interface ArchitectureNode {
  id: string;
  name: string;
  type: "FRONTEND" | "BACKEND_API" | "AUTH" | "DATABASE" | "CACHE" | "QUEUE" | "AI_MODEL" | "SMART_CONTRACT" | "EXTERNAL_SERVICE";
  description: string;
  technologies: string[];
  connections: string[]; // target node IDs
}

export interface RiskItem {
  severity: "HIGH" | "MEDIUM" | "LOW";
  category: "SECURITY" | "PERFORMANCE" | "RELIABILITY" | "ARCHITECTURE";
  title: string;
  description: string;
  affectedComponent: string;
}

export interface ImportantFunction {
  name: string;
  file: string;
  purpose: string;
  complexity: "HIGH" | "MEDIUM" | "LOW";
  criticalLogic: string;
}

export interface ProjectKnowledgeModel {
  projectId: string;
  projectName: string;
  repositoryUrl: string;
  primaryLanguage: string;
  languages: { name: string; percentage: number }[];
  frameworks: string[];
  technologies: string[];
  dependencies: DependencyItem[];
  architectureNodes: ArchitectureNode[];
  apiEndpoints: ApiEndpoint[];
  databaseType: string;
  databaseSchemaSummary: string;
  authMethod: string;
  externalServices: string[];
  aiComponents: string[];
  smartContracts?: string[];
  importantFiles: { path: string; purpose: string; linesOfCode: number }[];
  importantFunctions: ImportantFunction[];
  risks: RiskItem[];
  analyzedAt: string;
}

// ------------------------------------------------------------------------------
// ASSESSMENT & EVALUATION TYPES
// ------------------------------------------------------------------------------

export type QuestionCategory =
  | "PROJECT_UNDERSTANDING"
  | "CODE_UNDERSTANDING"
  | "ARCHITECTURE"
  | "DEBUGGING"
  | "TECHNICAL_REASONING"
  | "SYSTEM_DESIGN"
  | "SECURITY"
  | "DECISION_MAKING"
  | "FAILURE_SCENARIOS"
  | "MODIFICATION_ADAPTATION";

export interface AssessmentQuestion {
  id: string;
  order: number;
  category: QuestionCategory;
  title: string;
  question: string;
  contextCodeSnippet?: string;
  contextFile?: string;
  expectedKeyPoints: string[];
  complexityLevel: "FOUNDATIONAL" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  followUpPromptTemplate?: string;
}

export interface AdaptiveThreadStep {
  stepNumber: number;
  prompt: string;
  candidateAnswer: string;
  timestamp: string;
  evaluatedSignals?: string[];
}

export interface QuestionResponse {
  questionId: string;
  category: QuestionCategory;
  questionText: string;
  primaryAnswer: string;
  adaptiveFollowUps: AdaptiveThreadStep[];
  submittedAt: string;
  timeSpentSeconds: number;
}

export interface EvidenceItem {
  id: string;
  category: QuestionCategory;
  statement: string; // e.g. "✓ Explained authentication architecture & refresh token rotation mechanics"
  demonstratedCompetence: "STRONG" | "SATISFACTORY" | "PARTIAL";
  contextQuote?: string;
}

export interface CompetencyDimensionScore {
  dimension: string;
  score: number; // 0-100
  weight: number;
  label: string;
  summary: string;
  evidenceStatements?: string[]; // "Why did you receive this score?" verified evidence bullets
}

// ------------------------------------------------------------------------------
// SECURE ASSESSMENT INTEGRITY TYPES
// ------------------------------------------------------------------------------

export type IntegrityEventType =
  | "TAB_BLUR"
  | "WINDOW_BLUR"
  | "TAB_HIDDEN"
  | "DEVTOOLS_SHORTCUT"
  | "PASTE_ATTEMPT"
  | "COPY_ATTEMPT"
  | "PRINT_ATTEMPT"
  | "PAGE_REFRESH_ATTEMPT"
  | "MULTI_TAB_COLLISION";

export interface IntegrityEvent {
  id: string;
  type: IntegrityEventType;
  timestamp: string;
  details: string;
  turnNumber?: number;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface IntegritySummary {
  integrityScore: number; // 0-100
  flagsCount: number;
  status: "VERIFIED_SECURE" | "MINOR_FLAGS" | "INTEGRITY_REVIEW";
  events: IntegrityEvent[];
  multiTabPrevented: boolean;
  totalTimeSpentSeconds?: number;
}

export interface CompetencyReport {
  assessmentId: string;
  projectId: string;
  projectName: string;
  candidateUid: string;
  candidateName: string;
  candidateEmail: string;
  assessmentMode: AssessmentMode;
  overallScore: number; // 0-100
  scoreBand: "Exceptional (Top 1%)" | "Highly Competent" | "Proficient" | "Developing" | "Insufficient Evidence";
  assessmentLevel: "Foundational" | "Intermediate" | "Advanced" | "Principal";
  dimensionScores: CompetencyDimensionScore[];
  evidenceList: EvidenceItem[];
  strengths: string[];
  weaknesses: string[];
  executiveSummary: string;
  verifiedTechnologies: string[];
  assessedAt: string;
  version: string; // e.g. "v1"
  integritySummary?: IntegritySummary;
}

// ------------------------------------------------------------------------------
// SOULBOUND CREDENTIAL & IPFS METADATA TYPES
// ------------------------------------------------------------------------------

export interface PrivacyPreservingMetadata {
  credentialId: string; // e.g. "TL-2026-8492-v1"
  version: string; // "1.0"
  skills: string[];
  assessmentLevel: string;
  scoreBand: string;
  evidenceSummary: string[];
  issuer: string;
  issuedAt: string;
  blockchainNetwork: string;
  contractAddress: string;
  recipientWallet: string;
  projectName: string;
  integrityScore?: number;
  integrityStatus?: string;
  isSimulatedDemo?: boolean;
}

export interface SoulboundCredential {
  tokenId?: number;
  credentialId: string;
  version: string;
  recipientWallet: string;
  candidateName: string;
  projectId: string;
  projectName: string;
  assessmentId: string;
  assessmentMode: AssessmentMode;
  overallScore: number;
  scoreBand: string;
  assessmentLevel: string;
  verifiedTechnologies: string[];
  evidenceList: EvidenceItem[];
  ipfsCID: string;
  ipfsGatewayUrl: string;
  credentialHash: string; // Keccak-256 of canonical IPFS metadata
  blockchainNetwork: string;
  contractAddress: string;
  transactionHash?: string;
  blockNumber?: number;
  issuerAddress: string;
  status: CredentialStatus;
  issuedAt: string;
  revokedAt?: string;
  revocationReason?: string;
  integritySummary?: IntegritySummary;
  isSimulatedDemo?: boolean;
}

export interface VerificationCheckItem {
  id: string;
  label: string;
  description: string;
  passed: boolean;
  detail: string;
}

export interface SevenLayerVerificationResult {
  isAuthentic: boolean;
  status: CredentialStatus;
  credentialId: string;
  recipientWallet: string;
  issuerAddress: string;
  credentialHash: string;
  calculatedHash: string;
  ipfsCID: string;
  issuedAt: string;
  revokedAt?: string;
  revocationReason?: string;
  isSimulatedDemo?: boolean;
  checks: VerificationCheckItem[];
  metadata?: PrivacyPreservingMetadata;
  integritySummary?: IntegritySummary;
}
