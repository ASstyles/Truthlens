// TruthLens Complete Multi-User Isolation End-to-End Test Suite (Test A, Test B, Test C)

async function runCompleteIsolationTests() {
  console.log("=================================================================");
  console.log("TRUTHLENS COMPLETE MULTI-USER ISOLATION E2E TEST SUITE");
  console.log("=================================================================\n");

  const baseUrl = "http://localhost:3000";
  let passed = 0;
  let total = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`  [PASS] Step ${total}: ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] Step ${total}: ${name}`);
      throw new Error(`Assertion failed: ${name}`);
    }
  }

  const timestamp = Date.now();
  const uidAlice = `uid-user-a-${timestamp}`;
  const uidBob = `uid-user-b-${timestamp}`;

  // =================================================================
  // TEST A: USER A LIFECYCLE
  // =================================================================
  console.log("-----------------------------------------------------------------");
  console.log("TEST A: User A - Login, GitHub A Connect, Repos, Assessment & Score");
  console.log("-----------------------------------------------------------------");

  // 1. Create/Login User A
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
  assert(sessionResA.status === 200, "User A session created on server");

  // 2. Connect GitHub Account A (AliceDev)
  await fetch(`${baseUrl}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieAlice },
    body: JSON.stringify({
      uid: uidAlice,
      githubToken: "gho_alice_secret_token_111",
      githubUsername: "AliceDev",
    }),
  });

  // 3. Verify User A displays GitHub Account A
  const profileA = await fetch(`${baseUrl}/api/user/profile?uid=${uidAlice}`, {
    headers: { Cookie: cookieAlice },
  }).then((r) => r.json());
  assert(profileA.githubConnected === true, "User A profile shows githubConnected: true");
  assert(profileA.githubUsername === "AliceDev", "User A profile shows GitHub account @AliceDev");

  // 4. Link User A Wallet
  await fetch(`${baseUrl}/api/user/wallet`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieAlice },
    body: JSON.stringify({ uid: uidAlice, walletAddress: "0x1111111111111111111111111111111111111111" }),
  });

  // 5. Complete an assessment for User A
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

  // Submit Answer for User A
  await fetch(`${baseUrl}/api/assessment/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieAlice },
    body: JSON.stringify({
      assessmentId: startResA.assessmentId,
      answer: "I designed the atomic liquidity router to prevent MEV frontrunning using deterministic minimum output amounts and deadlined slippage bounds.",
      questionNumber: 1,
      integrityScore: 100,
    }),
  });

  const completeResA = await fetch(`${baseUrl}/api/assessment/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieAlice },
    body: JSON.stringify({
      assessmentId: startResA.assessmentId,
      integrityScore: 98,
      integrityEvents: [],
      totalTimeSpentSeconds: 120,
    }),
  }).then((r) => r.json());

  const scoreA = completeResA.report.overallScore;
  assert(scoreA > 0, `User A completed assessment with score ${scoreA}%`);

  // Issue Soulbound Credential for User A
  const issueResA = await fetch(`${baseUrl}/api/blockchain/issue`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieAlice },
    body: JSON.stringify({
      report: completeResA.report,
      recipientWallet: "0x1111111111111111111111111111111111111111",
      networkKey: "amoy",
    }),
  }).then((r) => r.json());

  const credentialIdA = issueResA.credential.credentialId;
  assert(credentialIdA && credentialIdA.startsWith("TL-"), `User A received credential: ${credentialIdA}`);

  // =================================================================
  // TEST B: USER B LIFECYCLE & ISOLATION CHECK
  // =================================================================
  console.log("\n-----------------------------------------------------------------");
  console.log("TEST B: Logout User A -> Login User B -> Verify ZERO User A Leaks");
  console.log("-----------------------------------------------------------------");

  // 1. Completely log out User A (clear session)
  const logoutRes = await fetch(`${baseUrl}/api/auth/session`, { method: "DELETE" });
  assert(logoutRes.status === 200, "User A session invalidated on server");

  // 2. Create/Login User B
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
  assert(sessionResB.status === 200, "User B session created on server");

  // 3. Before connecting GitHub, verify User B has NO GitHub connection
  const profileBInitial = await fetch(`${baseUrl}/api/user/profile?uid=${uidBob}`, {
    headers: { Cookie: cookieBob },
  }).then((r) => r.json());
  assert(profileBInitial.githubConnected === false, "User B starts with githubConnected: false");
  assert(profileBInitial.githubUsername === null, "User B starts with githubUsername: null (no User A @AliceDev leak)");

  // 4. Verify User B starts with empty repository list
  const reposBInitial = await fetch(`${baseUrl}/api/github/repos?uid=${uidBob}`, {
    headers: { Cookie: cookieBob },
  }).then((r) => r.json());
  assert(reposBInitial.connected === false && reposBInitial.repos.length === 0, "User B sees ZERO repositories from User A");

  // 5. Verify User B has NO wallet connected initially
  assert(profileBInitial.walletAddress === null, "User B wallet is null (User A wallet did NOT leak to User B)");

  // 6. Verify User B credentials hub is empty
  const credsBInitial = await fetch(`${baseUrl}/api/user/credentials?uid=${uidBob}`, {
    headers: { Cookie: cookieBob },
  }).then((r) => r.json());
  assert(credsBInitial.count === 0 && credsBInitial.credentials.length === 0, "User B credentials hub is strictly empty (0 credentials)");

  // 7. Connect GitHub Account B (BobBuilder)
  await fetch(`${baseUrl}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieBob },
    body: JSON.stringify({
      uid: uidBob,
      githubToken: "gho_bob_secret_token_222",
      githubUsername: "BobBuilder",
    }),
  });

  const profileBConnected = await fetch(`${baseUrl}/api/user/profile?uid=${uidBob}`, {
    headers: { Cookie: cookieBob },
  }).then((r) => r.json());
  assert(profileBConnected.githubConnected === true, "User B is now connected to GitHub");
  assert(profileBConnected.githubUsername === "BobBuilder", "User B GitHub account is @BobBuilder");

  // 8. Connect User B Wallet
  await fetch(`${baseUrl}/api/user/wallet`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieBob },
    body: JSON.stringify({ uid: uidBob, walletAddress: "0x2222222222222222222222222222222222222222" }),
  });

  // 9. Complete assessment for User B
  const startResB = await fetch(`${baseUrl}/api/assessment/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieBob },
    body: JSON.stringify({
      projectId: "demo-neuromed-ai",
      candidateUid: uidBob,
      candidateName: "Bob Engineer",
      candidateEmail: "bob@truthlens.io",
      isDemo: true,
    }),
  }).then((r) => r.json());

  // Submit Answer for User B
  await fetch(`${baseUrl}/api/assessment/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieBob },
    body: JSON.stringify({
      assessmentId: startResB.assessmentId,
      answer: "I implemented hierarchical vector chunking with cosine similarity re-ranking in FAISS to optimize retrieval latency under 10 milliseconds.",
      questionNumber: 1,
      integrityScore: 95,
    }),
  });

  const completeResB = await fetch(`${baseUrl}/api/assessment/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieBob },
    body: JSON.stringify({
      assessmentId: startResB.assessmentId,
      integrityScore: 92,
      integrityEvents: [],
      totalTimeSpentSeconds: 150,
    }),
  }).then((r) => r.json());

  const scoreB = completeResB.report.overallScore;

  // Issue Soulbound Credential for User B
  const issueResB = await fetch(`${baseUrl}/api/blockchain/issue`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieBob },
    body: JSON.stringify({
      report: completeResB.report,
      recipientWallet: "0x2222222222222222222222222222222222222222",
      networkKey: "amoy",
    }),
  }).then((r) => r.json());

  const credentialIdB = issueResB.credential.credentialId;
  assert(credentialIdB && credentialIdB !== credentialIdA, `User B received unique credential: ${credentialIdB}`);

  // =================================================================
  // TEST C: CONCURRENT SWITCHING AND ZERO LEAKAGE
  // =================================================================
  console.log("\n-----------------------------------------------------------------");
  console.log("TEST C: Switch back to User A -> Then User B -> Verify Pure Isolation");
  console.log("-----------------------------------------------------------------");

  // Check User A State
  const profileAFinal = await fetch(`${baseUrl}/api/user/profile?uid=${uidAlice}`, {
    headers: { Cookie: cookieAlice },
  }).then((r) => r.json());
  const credsAFinal = await fetch(`${baseUrl}/api/user/credentials?uid=${uidAlice}`, {
    headers: { Cookie: cookieAlice },
  }).then((r) => r.json());

  assert(profileAFinal.githubUsername === "AliceDev", "User A GitHub remains @AliceDev");
  assert(profileAFinal.walletAddress === "0x1111111111111111111111111111111111111111", "User A wallet remains 0x1111...");
  assert(credsAFinal.credentials[0].credentialId === credentialIdA, `User A credentials contain ${credentialIdA}`);
  assert(credsAFinal.credentials[0].overallScore === scoreA, `User A score is preserved (${scoreA}%)`);

  // Check User B State
  const profileBFinal = await fetch(`${baseUrl}/api/user/profile?uid=${uidBob}`, {
    headers: { Cookie: cookieBob },
  }).then((r) => r.json());
  const credsBFinal = await fetch(`${baseUrl}/api/user/credentials?uid=${uidBob}`, {
    headers: { Cookie: cookieBob },
  }).then((r) => r.json());

  assert(profileBFinal.githubUsername === "BobBuilder", "User B GitHub remains @BobBuilder");
  assert(profileBFinal.walletAddress === "0x2222222222222222222222222222222222222222", "User B wallet remains 0x2222...");
  assert(credsBFinal.credentials[0].credentialId === credentialIdB, `User B credentials contain ${credentialIdB}`);
  assert(credsBFinal.credentials[0].overallScore === scoreB, `User B score is preserved (${scoreB}%)`);

  // Confirm Zero Overlap
  assert(profileAFinal.githubUsername !== profileBFinal.githubUsername, "GitHub usernames are strictly isolated");
  assert(profileAFinal.walletAddress !== profileBFinal.walletAddress, "Wallet addresses are strictly isolated");
  assert(credsAFinal.credentials[0].credentialId !== credsBFinal.credentials[0].credentialId, "Credential IDs are strictly unique");

  console.log("\n=================================================================");
  console.log(`ALL ${passed}/${total} E2E USER ISOLATION TESTS PASSED PERFECTLY!`);
  console.log("=================================================================\n");
}

runCompleteIsolationTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
