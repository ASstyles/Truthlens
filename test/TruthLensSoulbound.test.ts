import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("TruthLensSoulboundCredential", function () {
  let contract: any;
  let owner: any;
  let issuer: any;
  let candidateA: any;
  let candidateB: any;
  let stranger: any;

  const CREDENTIAL_ID_1 = "TL-2026-8492-v1";
  const CREDENTIAL_ID_2 = "TL-2026-9021-v1";
  const IPFS_CID_1 = "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedvi";
  const IPFS_CID_2 = "bafkreigcfwh2aom3j2o8j3e98w2l3k4j8x9w0e1";
  const DUMMY_HASH_1 = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({ id: CREDENTIAL_ID_1, scoreBand: "Expert" })));
  const DUMMY_HASH_2 = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({ id: CREDENTIAL_ID_2, scoreBand: "Proficient" })));

  beforeEach(async function () {
    [owner, issuer, candidateA, candidateB, stranger] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("TruthLensSoulboundCredential");
    contract = await Factory.deploy("TruthLens Soulbound Credential", "TL-SBT", owner.address);
    await contract.waitForDeployment();

    // Grant ISSUER_ROLE to issuer account
    const ISSUER_ROLE = await contract.ISSUER_ROLE();
    await contract.grantRole(ISSUER_ROLE, issuer.address);
  });

  describe("1. Deployment & Roles", function () {
    it("should set the correct name, symbol, and initial admin", async function () {
      expect(await contract.name()).to.equal("TruthLens Soulbound Credential");
      expect(await contract.symbol()).to.equal("TL-SBT");

      const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();
      const ISSUER_ROLE = await contract.ISSUER_ROLE();

      expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await contract.hasRole(ISSUER_ROLE, issuer.address)).to.be.true;
      expect(await contract.hasRole(ISSUER_ROLE, stranger.address)).to.be.false;
    });

    it("should support ERC-5192 interface (0xb45a3c0e)", async function () {
      expect(await contract.supportsInterface("0xb45a3c0e")).to.be.true;
    });
  });

  describe("2. Credential Issuance & Soulbound State", function () {
    it("should allow an authorized issuer to issue a soulbound credential", async function () {
      const tx = await contract.connect(issuer).issueCredential(
        candidateA.address,
        CREDENTIAL_ID_1,
        DUMMY_HASH_1,
        IPFS_CID_1
      );

      await expect(tx)
        .to.emit(contract, "CredentialIssued")
        .withArgs(1, CREDENTIAL_ID_1, candidateA.address, DUMMY_HASH_1, IPFS_CID_1, issuer.address, (val: any) => val > 0);

      await expect(tx)
        .to.emit(contract, "Locked")
        .withArgs(1);

      // Verify token ownership
      expect(await contract.ownerOf(1)).to.equal(candidateA.address);
      expect(await contract.balanceOf(candidateA.address)).to.equal(1);

      // Verify ERC-5192 locked state
      expect(await contract.locked(1)).to.be.true;

      // Query by credentialId
      const record = await contract.getCredentialById(CREDENTIAL_ID_1);
      expect(record.credentialId).to.equal(CREDENTIAL_ID_1);
      expect(record.credentialHash).to.equal(DUMMY_HASH_1);
      expect(record.ipfsCID).to.equal(IPFS_CID_1);
      expect(record.recipient).to.equal(candidateA.address);
      expect(record.issuer).to.equal(issuer.address);
      expect(record.status).to.equal(0); // ACTIVE
    });

    it("should prevent unauthorized callers from issuing credentials", async function () {
      await expect(
        contract.connect(stranger).issueCredential(
          candidateA.address,
          CREDENTIAL_ID_1,
          DUMMY_HASH_1,
          IPFS_CID_1
        )
      ).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount");
    });

    it("should prevent duplicate credential IDs", async function () {
      await contract.connect(issuer).issueCredential(
        candidateA.address,
        CREDENTIAL_ID_1,
        DUMMY_HASH_1,
        IPFS_CID_1
      );

      await expect(
        contract.connect(issuer).issueCredential(
          candidateB.address,
          CREDENTIAL_ID_1,
          DUMMY_HASH_2,
          IPFS_CID_2
        )
      ).to.be.revertedWithCustomError(contract, "CredentialAlreadyExists");
    });

    it("should prevent duplicate credential hashes", async function () {
      await contract.connect(issuer).issueCredential(
        candidateA.address,
        CREDENTIAL_ID_1,
        DUMMY_HASH_1,
        IPFS_CID_1
      );

      await expect(
        contract.connect(issuer).issueCredential(
          candidateB.address,
          CREDENTIAL_ID_2,
          DUMMY_HASH_1,
          IPFS_CID_2
        )
      ).to.be.revertedWithCustomError(contract, "CredentialHashAlreadyUsed");
    });
  });

  describe("3. Soulbound Non-Transferability Enforcement", function () {
    beforeEach(async function () {
      await contract.connect(issuer).issueCredential(
        candidateA.address,
        CREDENTIAL_ID_1,
        DUMMY_HASH_1,
        IPFS_CID_1
      );
    });

    it("should revert if candidate attempts to transfer token to another wallet", async function () {
      await expect(
        contract.connect(candidateA).transferFrom(candidateA.address, candidateB.address, 1)
      ).to.be.revertedWithCustomError(contract, "SoulboundTokenCannotBeTransferred");

      await expect(
        contract.connect(candidateA)["safeTransferFrom(address,address,uint256)"](
          candidateA.address,
          candidateB.address,
          1
        )
      ).to.be.revertedWithCustomError(contract, "SoulboundTokenCannotBeTransferred");
    });

    it("should revert if an approved operator attempts to transfer the token", async function () {
      // Even if candidate approves stranger
      await contract.connect(candidateA).approve(stranger.address, 1);

      await expect(
        contract.connect(stranger).transferFrom(candidateA.address, candidateB.address, 1)
      ).to.be.revertedWithCustomError(contract, "SoulboundTokenCannotBeTransferred");
    });
  });

  describe("4. Verification & Cryptographic Integrity", function () {
    beforeEach(async function () {
      await contract.connect(issuer).issueCredential(
        candidateA.address,
        CREDENTIAL_ID_1,
        DUMMY_HASH_1,
        IPFS_CID_1
      );
    });

    it("should return valid=true when credential exists and hash matches", async function () {
      const result = await contract.verifyCredential(CREDENTIAL_ID_1, DUMMY_HASH_1);
      expect(result.isValid).to.be.true;
      expect(result.isRevoked).to.be.false;
      expect(result.recipient).to.equal(candidateA.address);
      expect(result.ipfsCID).to.equal(IPFS_CID_1);
    });

    it("should return valid=false when expected hash does not match stored hash", async function () {
      const tamperedHash = ethers.keccak256(ethers.toUtf8Bytes("tampered-metadata"));
      const result = await contract.verifyCredential(CREDENTIAL_ID_1, tamperedHash);
      expect(result.isValid).to.be.false;
      expect(result.isRevoked).to.be.false;
    });

    it("should return false for non-existent credential", async function () {
      const result = await contract.verifyCredential("NON-EXISTENT-ID", DUMMY_HASH_1);
      expect(result.isValid).to.be.false;
      expect(result.recipient).to.equal(ethers.ZeroAddress);
    });
  });

  describe("5. Credential Revocation Lifecycle", function () {
    beforeEach(async function () {
      await contract.connect(issuer).issueCredential(
        candidateA.address,
        CREDENTIAL_ID_1,
        DUMMY_HASH_1,
        IPFS_CID_1
      );
    });

    it("should allow an authorized issuer to revoke a credential with reason", async function () {
      const tx = await contract.connect(issuer).revokeCredential(1, "Assessment integrity violation");

      await expect(tx)
        .to.emit(contract, "CredentialRevoked")
        .withArgs(1, CREDENTIAL_ID_1, issuer.address, "Assessment integrity violation", (val: any) => val > 0);

      const record = await contract.getCredentialById(CREDENTIAL_ID_1);
      expect(record.status).to.equal(1); // REVOKED
      expect(record.revokedAt).to.be.gt(0);

      // Verify via verifyCredential
      const verification = await contract.verifyCredential(CREDENTIAL_ID_1, DUMMY_HASH_1);
      expect(verification.isValid).to.be.false;
      expect(verification.isRevoked).to.be.true;
    });

    it("should prevent unauthorized callers from revoking credentials", async function () {
      await expect(
        contract.connect(stranger).revokeCredential(1, "Malicious attempt")
      ).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount");
    });

    it("should prevent revoking an already revoked credential", async function () {
      await contract.connect(issuer).revokeCredential(1, "First revocation");

      await expect(
        contract.connect(issuer).revokeCredential(1, "Second revocation")
      ).to.be.revertedWithCustomError(contract, "CredentialAlreadyRevoked");
    });
  });
});
