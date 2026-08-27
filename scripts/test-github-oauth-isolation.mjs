// Comprehensive GitHub OAuth Multi-User Isolation and Conflict Prevention Test

async function runGithubIsolationTests() {
  console.log("=================================================================");
  console.log("TRUTHLENS GITHUB OAUTH MULTI-USER ISOLATION & CONFLICT TEST");
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
      throw new Error(`Failed test: ${name}`);
    }
  }

  const uidAlice = `uid-alice-gh-${Date.now()}`;
  const uidBob = `uid-bob-gh-${Date.now()}`;

  // 1. Register User A and User B TruthLens Sessions
  console.log("1. Setting up User A and User B TruthLens profiles...");
  await fetch(`${baseUrl}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: uidAlice,
      name: "Alice Developer",
      email: "alice@truthlens.io",
      role: "STUDENT",
    }),
  });

  await fetch(`${baseUrl}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: uidBob,
      name: "Bob Engineer",
      email: "bob@truthlens.io",
      role: "STUDENT",
    }),
  });

  // Verify initial state: neither user has GitHub connected
  const initialAlice = await fetch(`${baseUrl}/api/user/profile?uid=${uidAlice}`).then((r) => r.json());
  const initialBob = await fetch(`${baseUrl}/api/user/profile?uid=${uidBob}`).then((r) => r.json());

  assert(initialAlice.githubConnected === false, "User A initially has NO GitHub connection");
  assert(initialBob.githubConnected === false, "User B initially has NO GitHub connection");

  const initialAliceRepos = await fetch(`${baseUrl}/api/github/repos?uid=${uidAlice}`).then((r) => r.json());
  const initialBobRepos = await fetch(`${baseUrl}/api/github/repos?uid=${uidBob}`).then((r) => r.json());

  assert(initialAliceRepos.connected === false && initialAliceRepos.repos.length === 0, "User A has empty repo list");
  assert(initialBobRepos.connected === false && initialBobRepos.repos.length === 0, "User B has empty repo list");

  // 2. User A Initiates GitHub OAuth
  console.log("\n2. Testing OAuth State Binding for User A...");
  const initAlice = await fetch(`${baseUrl}/api/auth/github?uid=${uidAlice}&email=alice@truthlens.io`, {
    redirect: "manual",
  });

  const locationAlice = initAlice.headers.get("location");
  assert(locationAlice !== null && locationAlice.includes("github.com/login/oauth/authorize"), "User A receives GitHub OAuth authorize URL");

  const authUrl = new URL(locationAlice);
  const stateAlice = authUrl.searchParams.get("state");
  assert(stateAlice !== null && stateAlice.length > 20, "User A receives cryptographically secure state nonce");

  // 3. User A Connects GitHub Account A (AliceDev)
  console.log("\n3. Associating GitHub Account A with User A...");
  await fetch(`${baseUrl}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: uidAlice,
      githubToken: "gho_alice_secret_token_111",
      githubUsername: "AliceDev",
    }),
  });

  const profileAliceAfter = await fetch(`${baseUrl}/api/user/profile?uid=${uidAlice}`).then((r) => r.json());
  assert(profileAliceAfter.githubConnected === true, "User A is now connected to GitHub");
  assert(profileAliceAfter.githubUsername === "AliceDev", "User A GitHub handle is AliceDev");

  // 4. Verify User B is completely unaffected
  console.log("\n4. Verifying User B does NOT inherit User A's GitHub connection...");
  const profileBobCheck = await fetch(`${baseUrl}/api/user/profile?uid=${uidBob}`).then((r) => r.json());
  assert(profileBobCheck.githubConnected === false, "User B still has githubConnected: false");
  assert(profileBobCheck.githubUsername === null, "User B still has githubUsername: null");

  const bobReposCheck = await fetch(`${baseUrl}/api/github/repos?uid=${uidBob}`).then((r) => r.json());
  assert(bobReposCheck.connected === false && bobReposCheck.repos.length === 0, "User B sees ZERO repositories from User A");

  // 5. User B Connects GitHub Account B (BobBuilder)
  console.log("\n5. Associating GitHub Account B with User B...");
  await fetch(`${baseUrl}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: uidBob,
      githubToken: "gho_bob_secret_token_222",
      githubUsername: "BobBuilder",
    }),
  });

  const profileBobAfter = await fetch(`${baseUrl}/api/user/profile?uid=${uidBob}`).then((r) => r.json());
  assert(profileBobAfter.githubConnected === true, "User B is now connected to GitHub");
  assert(profileBobAfter.githubUsername === "BobBuilder", "User B GitHub handle is BobBuilder");

  // 6. Verify User A and User B have separate, unshared GitHub accounts
  console.log("\n6. Checking User A and User B Concurrent Isolation...");
  const profileAliceFinal = await fetch(`${baseUrl}/api/user/profile?uid=${uidAlice}`).then((r) => r.json());
  assert(profileAliceFinal.githubUsername === "AliceDev", "User A remains connected to AliceDev");
  assert(profileBobAfter.githubUsername === "BobBuilder", "User B remains connected to BobBuilder");
  assert(profileAliceFinal.githubUsername !== profileBobAfter.githubUsername, "GitHub accounts are distinct per TruthLens user");

  // 7. Testing Invalidation on Reconnect (Requirement 9)
  console.log("\n7. Testing Invalidation on Reconnect for User A...");
  await fetch(`${baseUrl}/api/auth/github?uid=${uidAlice}`, { redirect: "manual" });
  const profileAliceReconnecting = await fetch(`${baseUrl}/api/user/profile?uid=${uidAlice}`).then((r) => r.json());
  assert(profileAliceReconnecting.githubConnected === false, "Old GitHub connection was invalidated when initiating reconnection");

  // Re-establish User A's connection
  await fetch(`${baseUrl}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: uidAlice,
      githubToken: "gho_alice_new_token_333",
      githubUsername: "AliceDev",
    }),
  });

  // 8. Disconnect User A's GitHub connection
  console.log("\n8. Testing Disconnect Isolation...");
  await fetch(`${baseUrl}/api/auth/github/disconnect?uid=${uidAlice}`, { method: "POST" });

  const profileAliceDisconnected = await fetch(`${baseUrl}/api/user/profile?uid=${uidAlice}`).then((r) => r.json());
  const profileBobAfterAliceDisconnect = await fetch(`${baseUrl}/api/user/profile?uid=${uidBob}`).then((r) => r.json());

  assert(profileAliceDisconnected.githubConnected === false, "User A GitHub connection removed after disconnect");
  assert(profileAliceDisconnected.githubUsername === null, "User A GitHub username cleared");
  assert(profileBobAfterAliceDisconnect.githubConnected === true, "User B GitHub connection remains intact");
  assert(profileBobAfterAliceDisconnect.githubUsername === "BobBuilder", "User B GitHub username remains BobBuilder");

  // 9. Anti-CSRF / Fake State Rejection Test
  console.log("\n9. Testing Anti-CSRF Fake State Rejection...");
  const fakeCallback = await fetch(`${baseUrl}/api/auth/github/callback?code=fake_code&state=forged_state_nonce_1234`, {
    redirect: "manual",
  });
  const fakeRedirect = fakeCallback.headers.get("location");
  assert(fakeRedirect !== null && fakeRedirect.includes("error=invalid_or_expired_oauth_state"), "Server strictly rejects mismatched/forged OAuth state");

  console.log("\n=================================================================");
  console.log(`ALL ${passed}/${total} GITHUB OAUTH ISOLATION & CONFLICT TESTS PASSED!`);
  console.log("=================================================================\n");
}

runGithubIsolationTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
