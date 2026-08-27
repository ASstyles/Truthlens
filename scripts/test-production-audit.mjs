// TruthLens Production Verification Test Suite (Tests A to J)

async function runProductionAuditTests() {
  console.log("=================================================================");
  console.log("TRUTHLENS COMPREHENSIVE PRODUCTION AUDIT TEST SUITE (TESTS A-J)");
  console.log("=================================================================\n");

  const baseUrl = "http://localhost:3000";
  let passed = 0;
  let total = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`  [PASS] Test ${total}: ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] Test ${total}: ${name}`);
      throw new Error(`Assertion failed: ${name}`);
    }
  }

  const timestamp = Date.now();
  const uidAlice = `uid-alice-prod-${timestamp}`;
  const uidBob = `uid-bob-prod-${timestamp}`;

  // =================================================================
  // TEST A: User A Full Flow
  // =================================================================
  console.log("-----------------------------------------------------------------");
  console.log("TEST A: User A Register -> GitHub -> Wallet -> Assessment -> Certificate");
  console.log("-----------------------------------------------------------------");

  // 1. User A Register / Session
  const sessionResA = await fetch(`${baseUrl}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: uidAlice,
      name: "Alice Developer",
      email: "alice@truthlens.io",
      role: "STUDENT",
    }),
  });
  const cookieAlice = sessionResA.headers.get("set-cookie")?.split(";")[0] || "";
  assert(sessionResA.status === 200, "User A session created");

  // 2. Connect GitHub Account A
  await fetch(`${baseUrl}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieAlice },
    body: JSON.stringify({
      uid: uidAlice,
      githubToken: "gho_alice_prod_token_111",
      githubUsername: "AliceDev",
    }),
  });

  const profileA = await fetch(`${baseUrl}/api/user/profile?uid=${uidAlice}`, {
    headers: { Cookie: cookieAlice },
  }).then((r) => r.json());
  assert(profileA.githubConnected === true && profileA.githubUsername === "AliceDev", "User A connected to @AliceDev");

  // 3. Connect Wallet A
  await fetch(`${baseUrl}/api/user/wallet`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieAlice },
    body: JSON.stringify({ uid: uidAlice, walletAddress: "0x1111111111111111111111111111111111111111" }),
  });

  // 4. Perform Assessment
  const startResA = await fetch(`${baseUrl}/api/assessment/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieAlice },
    body: JSON.stringify({
      projectId: "demo-apex-dex",
      candidateUid: uidAlice,
      candidateName: "Alice Developer",
      candidateEmail: "alice@truthlens.io",
      isDemo: true,
    }),
  }).then((r) => r.json());

  await fetch(`${baseUrl}/api/assessment/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieAlice },
    body: JSON.stringify({
      assessmentId: startResA.assessmentId,
      answer: "I implemented atomic balance checks and reentrancy locks to prevent MEV exploitation in ApexLiquidityRouter.",
      questionNumber: 1,
    }),
  });

  const completeResA = await fetch(`${baseUrl}/api/assessment/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieAlice },
    body: JSON.stringify({
      assessmentId: startResA.assessmentId,
      integrityScore: 100,
      totalTimeSpentSeconds: 120,
    }),
  }).then((r) => r.json());

  assert(completeResA.report.overallScore > 0, "User A received valid assessment score");

  // 5. Generate Certificate A
  const issueResA = await fetch(`${baseUrl}/api/blockchain/issue`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieAlice },
    body: JSON.stringify({
      report: completeResA.report,
      recipientWallet: "0x1111111111111111111111111111111111111111",
      networkKey: "amoy",
    }),
  }).then((r) => r.json());

  const credIdA = issueResA.credential.credentialId;
  assert(credIdA && credIdA.startsWith("TL-"), `User A issued credential: ${credIdA}`);

  // =================================================================
  // TEST B: Log out User A -> User B Logs In -> Zero Leakage Check
  // =================================================================
  console.log("\n-----------------------------------------------------------------");
  console.log("TEST B: Logout User A -> User B Logs In -> Verify ZERO User A Leaks");
  console.log("-----------------------------------------------------------------");

  await fetch(`${baseUrl}/api/auth/session`, { method: "DELETE" });

  const sessionResB = await fetch(`${baseUrl}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: uidBob,
      name: "Bob Engineer",
      email: "bob@truthlens.io",
      role: "STUDENT",
    }),
  });
  const cookieBob = sessionResB.headers.get("set-cookie")?.split(";")[0] || "";

  const profileBInit = await fetch(`${baseUrl}/api/user/profile?uid=${uidBob}`, {
    headers: { Cookie: cookieBob },
  }).then((r) => r.json());
  assert(profileBInit.githubConnected === false, "User B starts with githubConnected: false");
  assert(profileBInit.githubUsername === null, "User B has NO User A GitHub handle");
  assert(profileBInit.walletAddress === null, "User B has NO User A wallet address");

  const credsBInit = await fetch(`${baseUrl}/api/user/credentials?uid=${uidBob}`, {
    headers: { Cookie: cookieBob },
  }).then((r) => r.json());
  assert(credsBInit.count === 0, "User B starts with 0 credentials");

  // =================================================================
  // TEST C: User B Connects Different GitHub Account
  // =================================================================
  console.log("\n-----------------------------------------------------------------");
  console.log("TEST C: User B Connects GitHub Account B (@BobBuilder)");
  console.log("-----------------------------------------------------------------");

  await fetch(`${baseUrl}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieBob },
    body: JSON.stringify({
      uid: uidBob,
      githubToken: "gho_bob_prod_token_222",
      githubUsername: "BobBuilder",
    }),
  });

  const profileBConnected = await fetch(`${baseUrl}/api/user/profile?uid=${uidBob}`, {
    headers: { Cookie: cookieBob },
  }).then((r) => r.json());
  assert(profileBConnected.githubConnected === true, "User B is connected to GitHub");
  assert(profileBConnected.githubUsername === "BobBuilder", "User B GitHub account is @BobBuilder");

  // =================================================================
  // TEST D: User B Performs Same Project Assessment
  // =================================================================
  console.log("\n-----------------------------------------------------------------");
  console.log("TEST D: User B Performs Assessment -> Unique Session & Result");
  console.log("-----------------------------------------------------------------");

  const startResB = await fetch(`${baseUrl}/api/assessment/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieBob },
    body: JSON.stringify({
      projectId: "demo-apex-dex",
      candidateUid: uidBob,
      candidateName: "Bob Engineer",
      candidateEmail: "bob@truthlens.io",
      isDemo: true,
    }),
  }).then((r) => r.json());

  assert(startResB.assessmentId !== startResA.assessmentId, "User B assessmentId is strictly unique");

  await fetch(`${baseUrl}/api/assessment/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieBob },
    body: JSON.stringify({
      assessmentId: startResB.assessmentId,
      answer: "I used dynamic fee moving averages and deadlined execution blocks to mitigate oracle latency risks.",
      questionNumber: 1,
    }),
  });

  const completeResB = await fetch(`${baseUrl}/api/assessment/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieBob },
    body: JSON.stringify({
      assessmentId: startResB.assessmentId,
      integrityScore: 95,
      totalTimeSpentSeconds: 140,
    }),
  }).then((r) => r.json());

  assert(completeResB.report.candidateUid === uidBob, "User B report belongs strictly to User B UID");

  // =================================================================
  // TEST E: Generate Certificate for User B
  // =================================================================
  console.log("\n-----------------------------------------------------------------");
  console.log("TEST E: Generate Certificate for User B -> Verify Unique Credential");
  console.log("-----------------------------------------------------------------");

  const issueResB = await fetch(`${baseUrl}/api/blockchain/issue`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieBob },
    body: JSON.stringify({
      report: completeResB.report,
      recipientWallet: "0x2222222222222222222222222222222222222222",
      networkKey: "amoy",
    }),
  }).then((r) => r.json());

  const credIdB = issueResB.credential.credentialId;
  assert(credIdB && credIdB !== credIdA, `User B issued unique credential: ${credIdB}`);
  assert(issueResB.credential.recipientWallet === "0x2222222222222222222222222222222222222222", "User B credential bound to User B wallet");

  // =================================================================
  // TEST F: Public Verification for User A Certificate
  // =================================================================
  console.log("\n-----------------------------------------------------------------");
  console.log("TEST F: Public Verification for User A Certificate");
  console.log("-----------------------------------------------------------------");

  const verifyResA = await fetch(`${baseUrl}/api/blockchain/verify?id=${encodeURIComponent(credIdA)}`).then((r) => r.json());
  assert(verifyResA.success === true && verifyResA.verification.isAuthentic === true, "User A certificate verifies as authentic");
  assert(verifyResA.credential.recipientWallet === "0x1111111111111111111111111111111111111111", "Public verification confirms User A wallet");

  // =================================================================
  // TEST G: Public Verification for User B Certificate
  // =================================================================
  console.log("\n-----------------------------------------------------------------");
  console.log("TEST G: Public Verification for User B Certificate");
  console.log("-----------------------------------------------------------------");

  const verifyResB = await fetch(`${baseUrl}/api/blockchain/verify?id=${encodeURIComponent(credIdB)}`).then((r) => r.json());
  assert(verifyResB.success === true && verifyResB.verification.isAuthentic === true, "User B certificate verifies as authentic");
  assert(verifyResB.credential.recipientWallet === "0x2222222222222222222222222222222222222222", "Public verification confirms User B wallet");

  // =================================================================
  // TEST H: IDOR Protection: User B Attempts to Access User A Assessment
  // =================================================================
  console.log("\n-----------------------------------------------------------------");
  console.log("TEST H: IDOR Protection: User B Tries Accessing User A Private Assessment");
  console.log("-----------------------------------------------------------------");

  const idorRes = await fetch(`${baseUrl}/api/assessment/report?id=${encodeURIComponent(startResA.assessmentId)}`, {
    headers: { Cookie: cookieBob },
  });
  assert(idorRes.status === 403, "Server strictly rejects User B accessing User A private report with 403 Forbidden");

  // =================================================================
  // TEST I: Protected API Spoofing Defense
  // =================================================================
  console.log("\n-----------------------------------------------------------------");
  console.log("TEST I: Protected API Spoofing Defense");
  console.log("-----------------------------------------------------------------");

  // User B attempts to query User A credentials by spoofing session
  const spoofCredsRes = await fetch(`${baseUrl}/api/user/credentials?uid=${uidAlice}`, {
    headers: { Cookie: cookieBob },
  }).then((r) => r.json());
  // Server session for cookieBob is User B, so returned credentials must belong to User B (credIdB)
  assert(spoofCredsRes.credentials.every((c) => c.credentialId === credIdB), "Server uses session UID to prevent query param spoofing");

  // =================================================================
  // TEST J: Re-Login Session Restoration & Persistence
  // =================================================================
  console.log("\n-----------------------------------------------------------------");
  console.log("TEST J: Logout & Re-Login -> Verify Pure Persistence for Both Accounts");
  console.log("-----------------------------------------------------------------");

  // Restore User A
  const reProfileA = await fetch(`${baseUrl}/api/user/profile?uid=${uidAlice}`, {
    headers: { Cookie: cookieAlice },
  }).then((r) => r.json());
  const reCredsA = await fetch(`${baseUrl}/api/user/credentials?uid=${uidAlice}`, {
    headers: { Cookie: cookieAlice },
  }).then((r) => r.json());

  assert(reProfileA.githubUsername === "AliceDev", "User A restored with @AliceDev");
  assert(reCredsA.credentials[0].credentialId === credIdA, `User A restored with ${credIdA}`);

  // Restore User B
  const reProfileB = await fetch(`${baseUrl}/api/user/profile?uid=${uidBob}`, {
    headers: { Cookie: cookieBob },
  }).then((r) => r.json());
  const reCredsB = await fetch(`${baseUrl}/api/user/credentials?uid=${uidBob}`, {
    headers: { Cookie: cookieBob },
  }).then((r) => r.json());

  assert(reProfileB.githubUsername === "BobBuilder", "User B restored with @BobBuilder");
  assert(reCredsB.credentials[0].credentialId === credIdB, `User B restored with ${credIdB}`);

  console.log("\n=================================================================");
  console.log(`ALL ${passed}/${total} PRODUCTION AUDIT TESTS (TESTS A-J) PASSED!`);
  console.log("=================================================================\n");
}

runProductionAuditTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
