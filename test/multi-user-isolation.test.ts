import { expect } from "chai";
import { db, ActiveAssessmentSession } from "../src/lib/firebase/mock-db";
import { UserProfile, SoulboundCredential, CompetencyReport } from "../src/lib/types";

describe("TruthLens Multi-User Data Isolation Test Suite", () => {
  const uidAlice = "uid-alice-101";
  const uidBob = "uid-bob-202";

  beforeEach(() => {
    // Clean up test users
    db.clearUserData(uidAlice);
    db.clearUserData(uidBob);
  });

  it("1. Profile Isolation: User A and User B profiles must be strictly partitioned by UID", () => {
    const aliceProfile: UserProfile = {
      uid: uidAlice,
      name: "Alice Developer",
      email: "alice@truthlens.io",
      role: "STUDENT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const bobProfile: UserProfile = {
      uid: uidBob,
      name: "Bob Engineer",
      email: "bob@truthlens.io",
      role: "STUDENT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveUser(aliceProfile);
    db.saveUser(bobProfile);

    const retrievedAlice = db.getUser(uidAlice);
    const retrievedBob = db.getUser(uidBob);

    expect(retrievedAlice).to.not.be.null;
    expect(retrievedAlice?.name).to.equal("Alice Developer");
    expect(retrievedAlice?.email).to.equal("alice@truthlens.io");
    expect(retrievedAlice?.uid).to.equal(uidAlice);

    expect(retrievedBob).to.not.be.null;
    expect(retrievedBob?.name).to.equal("Bob Engineer");
    expect(retrievedBob?.email).to.equal("bob@truthlens.io");
    expect(retrievedBob?.uid).to.equal(uidBob);

    // Cross check
    expect(retrievedAlice?.name).to.not.equal(retrievedBob?.name);
  });

  it("2. Wallet Isolation: User A's connected wallet must not leak to User B", () => {
    const walletAlice = "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    const walletBob = "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

    db.saveUser({
      uid: uidAlice,
      name: "Alice",
      email: "alice@test.com",
      role: "STUDENT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    db.saveUser({
      uid: uidBob,
      name: "Bob",
      email: "bob@test.com",
      role: "STUDENT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Alice connects wallet
    db.updateUserWallet(uidAlice, walletAlice);

    // Bob has not connected wallet yet
    const aliceUser = db.getUser(uidAlice);
    const bobUser = db.getUser(uidBob);

    expect(aliceUser?.walletAddress).to.equal(walletAlice);
    expect(bobUser?.walletAddress).to.be.undefined;

    // Bob connects his own distinct wallet
    db.updateUserWallet(uidBob, walletBob);
    const bobUserAfter = db.getUser(uidBob);

    expect(bobUserAfter?.walletAddress).to.equal(walletBob);
    expect(bobUserAfter?.walletAddress).to.not.equal(aliceUser?.walletAddress);
  });

  it("3. GitHub OAuth Isolation: GitHub access tokens & sessions must belong exclusively to initiating UID", () => {
    // Alice connects GitHub
    db.saveUserGithub(uidAlice, {
      accessToken: "gho_alice_token_secret_999",
      username: "alice-github",
      avatarUrl: "https://avatars.githubusercontent.com/u/1111",
    });

    // Bob connects GitHub
    db.saveUserGithub(uidBob, {
      accessToken: "gho_bob_token_secret_888",
      username: "bob-github",
      avatarUrl: "https://avatars.githubusercontent.com/u/2222",
    });

    const aliceGh = db.getUserGithub(uidAlice);
    const bobGh = db.getUserGithub(uidBob);

    expect(aliceGh?.username).to.equal("alice-github");
    expect(aliceGh?.accessToken).to.equal("gho_alice_token_secret_999");

    expect(bobGh?.username).to.equal("bob-github");
    expect(bobGh?.accessToken).to.equal("gho_bob_token_secret_888");

    // Disconnecting Alice's GitHub must not affect Bob
    db.deleteUserGithub(uidAlice);

    expect(db.getUserGithub(uidAlice)).to.be.null;
    expect(db.getUserGithub(uidBob)?.username).to.equal("bob-github");
  });

  it("4. Assessment Session & Score Isolation: User A's questions, answers, and marks cannot be read by User B", () => {
    const sessionAlice: ActiveAssessmentSession = {
      assessmentId: "eval-alice-turn-1",
      projectId: "alice-project-dex",
      projectName: "alice-dex",
      candidateName: "Alice Developer",
      candidateEmail: "alice@test.com",
      candidateUid: uidAlice,
      mode: "INDEPENDENT",
      isDemo: false,
      totalQuestions: 8,
      currentTurn: 1,
      currentQuestion: {
        question: "How do you handle slippage in your AMM router?",
        competency: "Architecture & Systems",
        category: "ARCHITECTURE",
        order: 1,
      },
      turns: [
        {
          questionNumber: 1,
          question: "How do you handle slippage?",
          competency: "Architecture",
          category: "ARCHITECTURE",
          answer: "We enforce minAmountOut checks against on-chain pool reserves.",
          score: 95,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sessionBob: ActiveAssessmentSession = {
      assessmentId: "eval-bob-turn-1",
      projectId: "bob-microservice-mesh",
      projectName: "bob-mesh",
      candidateName: "Bob Engineer",
      candidateEmail: "bob@test.com",
      candidateUid: uidBob,
      mode: "INDEPENDENT",
      isDemo: false,
      totalQuestions: 8,
      currentTurn: 1,
      currentQuestion: {
        question: "How is Kafka partition rebalancing mitigated?",
        competency: "Scalability",
        category: "SCALABILITY",
        order: 1,
      },
      turns: [
        {
          questionNumber: 1,
          question: "How is Kafka partition rebalancing mitigated?",
          competency: "Scalability",
          category: "SCALABILITY",
          answer: "We use cooperative sticky assignor.",
          score: 70,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveUserAssessment(uidAlice, sessionAlice);
    db.saveUserAssessment(uidBob, sessionBob);

    // Alice queries assessments
    const aliceAssessments = db.getUserAssessments(uidAlice);
    expect(aliceAssessments).to.have.lengthOf(1);
    expect(aliceAssessments[0].projectName).to.equal("alice-dex");
    expect(aliceAssessments[0].turns[0].score).to.equal(95);

    // Bob queries assessments
    const bobAssessments = db.getUserAssessments(uidBob);
    expect(bobAssessments).to.have.lengthOf(1);
    expect(bobAssessments[0].projectName).to.equal("bob-mesh");
    expect(bobAssessments[0].turns[0].score).to.equal(70);

    // Cross-user access check
    expect(db.getUserAssessment(uidBob, "eval-alice-turn-1")).to.be.null;
    expect(db.getUserAssessment(uidAlice, "eval-bob-turn-1")).to.be.null;
  });

  it("5. Soulbound Credential Hub Isolation: User A's credentials do not appear in User B's dashboard", () => {
    const credAlice: SoulboundCredential = {
      tokenId: 2001,
      credentialId: "TL-2026-ALICE-95-v1",
      version: "1.0",
      recipientWallet: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      candidateName: "Alice Developer",
      projectId: "alice-dex",
      projectName: "Alice DEX Protocol",
      assessmentId: "eval-alice-turn-1",
      assessmentMode: "INDEPENDENT",
      overallScore: 95,
      scoreBand: "Highly Competent",
      assessmentLevel: "Advanced",
      verifiedTechnologies: ["Solidity", "Hardhat"],
      evidenceList: [],
      ipfsCID: "bafk-alice-cid",
      ipfsGatewayUrl: "https://gateway.pinata.cloud/ipfs/bafk-alice-cid",
      credentialHash: "0xhashalice",
      blockchainNetwork: "Polygon Amoy Testnet",
      contractAddress: "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1",
      transactionHash: "0xtxalice",
      status: "ACTIVE",
      issuedAt: new Date().toISOString(),
    };

    const credBob: SoulboundCredential = {
      tokenId: 2002,
      credentialId: "TL-2026-BOB-70-v1",
      version: "1.0",
      recipientWallet: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
      candidateName: "Bob Engineer",
      projectId: "bob-mesh",
      projectName: "Bob Event Mesh",
      assessmentId: "eval-bob-turn-1",
      assessmentMode: "INDEPENDENT",
      overallScore: 70,
      scoreBand: "Proficient",
      assessmentLevel: "Intermediate",
      verifiedTechnologies: ["Go", "Kafka"],
      evidenceList: [],
      ipfsCID: "bafk-bob-cid",
      ipfsGatewayUrl: "https://gateway.pinata.cloud/ipfs/bafk-bob-cid",
      credentialHash: "0xhashbob",
      blockchainNetwork: "Polygon Amoy Testnet",
      contractAddress: "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1",
      transactionHash: "0xtxbob",
      status: "ACTIVE",
      issuedAt: new Date().toISOString(),
    };

    db.saveUserCredential(uidAlice, credAlice);
    db.saveUserCredential(uidBob, credBob);

    // Alice's credentials list
    const aliceCreds = db.getUserCredentials(uidAlice);
    expect(aliceCreds).to.have.lengthOf(1);
    expect(aliceCreds[0].credentialId).to.equal("TL-2026-ALICE-95-v1");
    expect(aliceCreds[0].overallScore).to.equal(95);

    // Bob's credentials list
    const bobCreds = db.getUserCredentials(uidBob);
    expect(bobCreds).to.have.lengthOf(1);
    expect(bobCreds[0].credentialId).to.equal("TL-2026-BOB-70-v1");
    expect(bobCreds[0].overallScore).to.equal(70);

    // Public 7-Layer Verification can verify either credential by ID without candidate authentication
    expect(db.getPublicCredential("TL-2026-ALICE-95-v1")).to.not.be.null;
    expect(db.getPublicCredential("TL-2026-BOB-70-v1")).to.not.be.null;
  });

  it("6. State Purge: Clearing User A's data removes all private resources without affecting User B", () => {
    db.saveUser({
      uid: uidAlice,
      name: "Alice",
      email: "alice@test.com",
      role: "STUDENT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    db.saveUser({
      uid: uidBob,
      name: "Bob",
      email: "bob@test.com",
      role: "STUDENT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    db.clearUserData(uidAlice);

    expect(db.getUser(uidAlice)).to.be.null;
    expect(db.getUser(uidBob)).to.not.be.null;
    expect(db.getUser(uidBob)?.name).to.equal("Bob");
  });
});
