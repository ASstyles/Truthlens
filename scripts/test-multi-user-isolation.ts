import { db } from "../src/lib/firebase/mock-db";
import { UserProfile, SoulboundCredential, ActiveAssessmentSession } from "../src/lib/firebase/mock-db";

async function main() {
  console.log("=================================================================");
  console.log("TRUTHLENS MULTI-USER DATA ISOLATION AUTOMATED TEST SUITE");
  console.log("=================================================================\n");

  const uidAlice = "uid-alice-101";
  const uidBob = "uid-bob-202";

  // Clean previous test data
  db.clearUserData(uidAlice);
  db.clearUserData(uidBob);

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  [PASS] Test ${total}: ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] Test ${total}: ${testName}`);
      throw new Error(`Assertion failed in: ${testName}`);
    }
  }

  // 1. Profile Isolation Test
  console.log("1. Testing User Profile Partitioning...");
  db.saveUser({
    uid: uidAlice,
    name: "Alice Developer",
    email: "alice@truthlens.io",
    role: "STUDENT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  db.saveUser({
    uid: uidBob,
    name: "Bob Engineer",
    email: "bob@truthlens.io",
    role: "STUDENT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const aliceUser = db.getUser(uidAlice);
  const bobUser = db.getUser(uidBob);

  assert(aliceUser !== null && aliceUser.name === "Alice Developer", "Alice profile is saved and retrievable by UID");
  assert(bobUser !== null && bobUser.name === "Bob Engineer", "Bob profile is saved and retrievable by UID");
  assert(aliceUser?.email !== bobUser?.email, "Alice and Bob profiles do not cross-contaminate");

  // 2. Wallet Isolation Test
  console.log("\n2. Testing Web3 Wallet Isolation...");
  const walletAlice = "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const walletBob = "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

  db.updateUserWallet(uidAlice, walletAlice);
  assert(db.getUser(uidAlice)?.walletAddress === walletAlice, "Alice has wallet 0xAAAA...");
  assert(db.getUser(uidBob)?.walletAddress === undefined, "Bob has NO wallet initially (not leaking Alice's wallet)");

  db.updateUserWallet(uidBob, walletBob);
  assert(db.getUser(uidBob)?.walletAddress === walletBob, "Bob has his own distinct wallet 0xBBBB...");
  assert(db.getUser(uidAlice)?.walletAddress !== db.getUser(uidBob)?.walletAddress, "Wallets are strictly isolated per UID");

  // 3. GitHub OAuth Isolation Test
  console.log("\n3. Testing GitHub OAuth Isolation...");
  db.saveUserGithub(uidAlice, {
    accessToken: "gho_alice_secret_token_111",
    username: "alice-gh",
    avatarUrl: "https://avatars.githubusercontent.com/u/1",
  });

  db.saveUserGithub(uidBob, {
    accessToken: "gho_bob_secret_token_222",
    username: "bob-gh",
    avatarUrl: "https://avatars.githubusercontent.com/u/2",
  });

  assert(db.getUserGithub(uidAlice)?.username === "alice-gh", "Alice GitHub handle is alice-gh");
  assert(db.getUserGithub(uidAlice)?.accessToken === "gho_alice_secret_token_111", "Alice GitHub token is stored under Alice UID");
  assert(db.getUserGithub(uidBob)?.username === "bob-gh", "Bob GitHub handle is bob-gh");
  assert(db.getUserGithub(uidBob)?.accessToken === "gho_bob_secret_token_222", "Bob GitHub token is stored under Bob UID");

  // Disconnect Alice's GitHub
  db.deleteUserGithub(uidAlice);
  assert(db.getUserGithub(uidAlice) === null, "Alice GitHub is disconnected");
  assert(db.getUserGithub(uidBob)?.username === "bob-gh", "Bob GitHub remains connected and unaffected");

  // 4. Assessment Session & Score Isolation Test
  console.log("\n4. Testing Assessment Session & Score Isolation...");
  const sessionAlice: ActiveAssessmentSession = {
    assessmentId: "eval-alice-dex-95",
    projectId: "alice-dex",
    projectName: "Alice DEX",
    candidateName: "Alice Developer",
    candidateEmail: "alice@truthlens.io",
    candidateUid: uidAlice,
    mode: "INDEPENDENT",
    isDemo: false,
    totalQuestions: 8,
    currentTurn: 1,
    currentQuestion: {
      question: "How do you handle slippage in your router?",
      competency: "Architecture",
      category: "ARCHITECTURE",
      order: 1,
    },
    turns: [
      {
        questionNumber: 1,
        question: "How do you handle slippage?",
        competency: "Architecture",
        category: "ARCHITECTURE",
        answer: "We enforce minAmountOut checks.",
        score: 95,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sessionBob: ActiveAssessmentSession = {
    assessmentId: "eval-bob-mesh-70",
    projectId: "bob-mesh",
    projectName: "Bob Mesh",
    candidateName: "Bob Engineer",
    candidateEmail: "bob@truthlens.io",
    candidateUid: uidBob,
    mode: "INDEPENDENT",
    isDemo: false,
    totalQuestions: 8,
    currentTurn: 1,
    currentQuestion: {
      question: "How do you handle Kafka partition rebalancing?",
      competency: "Scalability",
      category: "SCALABILITY",
      order: 1,
    },
    turns: [
      {
        questionNumber: 1,
        question: "How do you handle Kafka rebalancing?",
        competency: "Scalability",
        category: "SCALABILITY",
        answer: "We use sticky assignor.",
        score: 70,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.saveUserAssessment(uidAlice, sessionAlice);
  db.saveUserAssessment(uidBob, sessionBob);

  const aliceAssessments = db.getUserAssessments(uidAlice);
  const bobAssessments = db.getUserAssessments(uidBob);

  assert(aliceAssessments.length === 1 && aliceAssessments[0].turns[0].score === 95, "Alice has 1 assessment with score 95%");
  assert(bobAssessments.length === 1 && bobAssessments[0].turns[0].score === 70, "Bob has 1 assessment with score 70%");
  assert(db.getUserAssessment(uidBob, "eval-alice-dex-95") === null, "Bob cannot access Alice's assessment session");
  assert(db.getUserAssessment(uidAlice, "eval-bob-mesh-70") === null, "Alice cannot access Bob's assessment session");

  // 5. Soulbound Credential Hub Isolation Test
  console.log("\n5. Testing Soulbound Credential Hub Isolation...");
  const credAlice: SoulboundCredential = {
    tokenId: 3001,
    credentialId: "TL-2026-ALICE-95-v1",
    version: "1.0",
    recipientWallet: walletAlice,
    candidateName: "Alice Developer",
    projectId: "alice-dex",
    projectName: "Alice DEX",
    assessmentId: "eval-alice-dex-95",
    assessmentMode: "INDEPENDENT",
    overallScore: 95,
    scoreBand: "Highly Competent",
    assessmentLevel: "Advanced",
    verifiedTechnologies: ["Solidity", "Hardhat"],
    evidenceList: [],
    ipfsCID: "bafk-alice",
    credentialHash: "0xhashalice",
    blockchainNetwork: "Polygon Amoy Testnet",
    contractAddress: "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1",
    status: "ACTIVE",
    issuedAt: new Date().toISOString(),
  };

  const credBob: SoulboundCredential = {
    tokenId: 3002,
    credentialId: "TL-2026-BOB-70-v1",
    version: "1.0",
    recipientWallet: walletBob,
    candidateName: "Bob Engineer",
    projectId: "bob-mesh",
    projectName: "Bob Mesh",
    assessmentId: "eval-bob-mesh-70",
    assessmentMode: "INDEPENDENT",
    overallScore: 70,
    scoreBand: "Proficient",
    assessmentLevel: "Intermediate",
    verifiedTechnologies: ["Go", "Kafka"],
    evidenceList: [],
    ipfsCID: "bafk-bob",
    credentialHash: "0xhashbob",
    blockchainNetwork: "Polygon Amoy Testnet",
    contractAddress: "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1",
    status: "ACTIVE",
    issuedAt: new Date().toISOString(),
  };

  db.saveUserCredential(uidAlice, credAlice);
  db.saveUserCredential(uidBob, credBob);

  const aliceCreds = db.getUserCredentials(uidAlice);
  const bobCreds = db.getUserCredentials(uidBob);

  assert(aliceCreds.length === 1 && aliceCreds[0].credentialId === "TL-2026-ALICE-95-v1", "Alice credentials hub contains only TL-2026-ALICE-95-v1");
  assert(bobCreds.length === 1 && bobCreds[0].credentialId === "TL-2026-BOB-70-v1", "Bob credentials hub contains only TL-2026-BOB-70-v1");
  assert(aliceCreds[0].overallScore === 95 && bobCreds[0].overallScore === 70, "Credential scores are distinct and unshared");

  // 6. Public Verification Accessibility Test
  console.log("\n6. Testing Public Verification Accessibility...");
  assert(db.getPublicCredential("TL-2026-ALICE-95-v1") !== null, "Alice credential is valid in public registry");
  assert(db.getPublicCredential("TL-2026-BOB-70-v1") !== null, "Bob credential is valid in public registry");
  assert(db.getPublicCredential("TL-2026-8492-v1") !== null, "Canonical benchmark credential is valid in public registry");

  // 7. Logout & State Purge Test
  console.log("\n7. Testing Logout State Purge...");
  db.clearUserData(uidAlice);
  assert(db.getUser(uidAlice) === null, "Alice user profile purged on logout");
  assert(db.getUserAssessments(uidAlice).length === 0, "Alice assessments purged on logout");
  assert(db.getUserCredentials(uidAlice).length === 0, "Alice credentials hub cleared");
  assert(db.getUser(uidBob) !== null && db.getUser(uidBob)?.name === "Bob Engineer", "Bob data remains completely intact");

  console.log("\n=================================================================");
  console.log(`ALL ${passed}/${total} MULTI-USER ISOLATION TESTS PASSED SUCCESSFULLY!`);
  console.log("=================================================================");
}

main().catch((err) => {
  console.error("Test Suite Failure:", err);
  process.exit(1);
});
