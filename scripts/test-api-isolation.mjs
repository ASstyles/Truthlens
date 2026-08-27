// Comprehensive Multi-User Isolation End-to-End Test

async function runTests() {
  console.log("=================================================================");
  console.log("TRUTHLENS MULTI-USER API & DATA ISOLATION INTEGRATION TEST");
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
      throw new Error(`Failed: ${name}`);
    }
  }

  const uidAlice = `uid-alice-${Date.now()}`;
  const uidBob = `uid-bob-${Date.now()}`;

  // 1. Profile Isolation Test
  console.log("1. Testing User Profile Isolation via API...");
  const resAlice = await fetch(`${baseUrl}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: uidAlice,
      name: "Alice Developer",
      email: "alice@truthlens.io",
      role: "STUDENT",
    }),
  });
  const dataAlice = await resAlice.json();
  assert(dataAlice.success && dataAlice.user.uid === uidAlice, "Alice session registered");

  const resBob = await fetch(`${baseUrl}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: uidBob,
      name: "Bob Engineer",
      email: "bob@truthlens.io",
      role: "STUDENT",
    }),
  });
  const dataBob = await resBob.json();
  assert(dataBob.success && dataBob.user.uid === uidBob, "Bob session registered");

  const checkAlice = await fetch(`${baseUrl}/api/user/profile?uid=${uidAlice}`).then((r) => r.json());
  const checkBob = await fetch(`${baseUrl}/api/user/profile?uid=${uidBob}`).then((r) => r.json());

  assert(checkAlice.user.name === "Alice Developer", "Alice profile is Alice Developer");
  assert(checkBob.user.name === "Bob Engineer", "Bob profile is Bob Engineer");
  assert(checkAlice.user.email !== checkBob.user.email, "Alice and Bob emails are isolated");

  // 2. Wallet Isolation Test
  console.log("\n2. Testing Web3 Wallet Isolation via API...");
  const walletAlice = "0x1111111111111111111111111111111111111111";
  const walletBob = "0x2222222222222222222222222222222222222222";

  // Alice connects wallet
  await fetch(`${baseUrl}/api/user/wallet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid: uidAlice, walletAddress: walletAlice }),
  });

  const aliceProfileAfterWallet = await fetch(`${baseUrl}/api/user/profile?uid=${uidAlice}`).then((r) => r.json());
  const bobProfileAfterWallet = await fetch(`${baseUrl}/api/user/profile?uid=${uidBob}`).then((r) => r.json());

  assert(aliceProfileAfterWallet.walletAddress === walletAlice, "Alice has linked wallet 0x1111...");
  assert(bobProfileAfterWallet.walletAddress === null, "Bob wallet is null (Alice wallet did NOT leak to Bob)");

  // Bob links his own distinct wallet
  await fetch(`${baseUrl}/api/user/wallet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid: uidBob, walletAddress: walletBob }),
  });
  const bobProfileWithWallet = await fetch(`${baseUrl}/api/user/profile?uid=${uidBob}`).then((r) => r.json());
  assert(bobProfileWithWallet.walletAddress === walletBob, "Bob has linked wallet 0x2222...");

  // 3. GitHub Connection Isolation Test
  console.log("\n3. Testing GitHub Connection Isolation via API...");
  const aliceRepos = await fetch(`${baseUrl}/api/github/repos?uid=${uidAlice}`).then((r) => r.json());
  const bobRepos = await fetch(`${baseUrl}/api/github/repos?uid=${uidBob}`).then((r) => r.json());

  assert(aliceRepos.connected === false, "Alice is not connected to GitHub initially");
  assert(bobRepos.connected === false, "Bob is not connected to GitHub initially");

  // 4. Assessment Session & Score Isolation Test
  console.log("\n4. Testing Assessment Session & Score Isolation via API...");
  const startAlice = await fetch(`${baseUrl}/api/assessment/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId: "demo-apex-dex",
      candidateUid: uidAlice,
      candidateName: "Alice Developer",
      candidateEmail: "alice@truthlens.io",
      isDemo: true,
    }),
  }).then((r) => r.json());

  const startBob = await fetch(`${baseUrl}/api/assessment/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId: "demo-apex-dex",
      candidateUid: uidBob,
      candidateName: "Bob Engineer",
      candidateEmail: "bob@truthlens.io",
      isDemo: true,
    }),
  }).then((r) => r.json());

  assert(startAlice.success && startAlice.assessmentId, "Alice started assessment");
  assert(startBob.success && startBob.assessmentId, "Bob started assessment");
  assert(startAlice.assessmentId !== startBob.assessmentId, "Alice and Bob assessment IDs are unique");

  // Complete Alice assessment
  const completeAlice = await fetch(`${baseUrl}/api/assessment/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assessmentId: startAlice.assessmentId,
      integrityScore: 98,
      totalTimeSpentSeconds: 120,
    }),
  }).then((r) => r.json());

  assert(completeAlice.success && completeAlice.report.candidateUid === uidAlice, "Alice assessment completed under Alice UID");

  // Alice checks credentials hub
  const aliceCreds = await fetch(`${baseUrl}/api/user/credentials?uid=${uidAlice}`).then((r) => r.json());
  const bobCreds = await fetch(`${baseUrl}/api/user/credentials?uid=${uidBob}`).then((r) => r.json());

  assert(bobCreds.credentials.length === 0, "Bob credentials hub is empty ('No assessment completed yet')");

  // 5. Soulbound Credential Issuance & Hub Isolation Test
  console.log("\n5. Testing Soulbound Credential Hub Isolation...");
  const issueAlice = await fetch(`${baseUrl}/api/blockchain/issue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      report: completeAlice.report,
      recipientWallet: walletAlice,
    }),
  }).then((r) => r.json());

  assert(issueAlice.success && issueAlice.credential.credentialId, "Soulbound Credential issued for Alice");

  const aliceCredsAfterMint = await fetch(`${baseUrl}/api/user/credentials?uid=${uidAlice}`).then((r) => r.json());
  const bobCredsAfterMint = await fetch(`${baseUrl}/api/user/credentials?uid=${uidBob}`).then((r) => r.json());

  assert(aliceCredsAfterMint.credentials.length === 1, "Alice credentials hub contains 1 issued credential");
  assert(aliceCredsAfterMint.credentials[0].credentialId === issueAlice.credential.credentialId, "Alice credential matches minted ID");
  assert(bobCredsAfterMint.credentials.length === 0, "Bob credentials hub remains strictly 0 (Zero cross-user leakage)");

  // 6. Public Verification Test
  console.log("\n6. Testing Public 7-Layer Verification...");
  const verifyRes = await fetch(`${baseUrl}/api/blockchain/verify?id=${encodeURIComponent(issueAlice.credential.credentialId)}`).then((r) => r.json());
  assert(verifyRes.success === true, "Public verification successfully verifies Alice credential without requiring login");

  console.log("\n=================================================================");
  console.log(`ALL ${passed}/${total} MULTI-USER API ISOLATION TESTS PASSED!`);
  console.log("=================================================================\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
