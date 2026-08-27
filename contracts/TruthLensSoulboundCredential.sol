// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces/IERC5192.sol";

/**
 * @title TruthLensSoulboundCredential
 * @notice Non-transferable (Soulbound) Proof-of-Competence Credential Registry (ERC-5192 compliant).
 * @dev Anchors cryptographic hashes and IPFS metadata of evaluated developer competence on-chain.
 */
contract TruthLensSoulboundCredential is ERC721, AccessControl, IERC5192 {
    using Strings for uint256;

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant ADMIN_ROLE = DEFAULT_ADMIN_ROLE;

    enum CredentialStatus {
        ACTIVE,
        REVOKED
    }

    struct CredentialRecord {
        uint256 tokenId;
        string credentialId; // e.g., "TL-2026-8492-v1"
        bytes32 credentialHash; // Keccak-256 hash of canonical IPFS metadata
        string ipfsCID; // IPFS Content Identifier for public metadata
        address recipient; // Developer wallet bound to the credential
        address issuer; // Authorized TruthLens issuer
        uint256 issuedAt; // Timestamp of issuance
        CredentialStatus status; // ACTIVE or REVOKED
        uint256 revokedAt; // 0 if active, timestamp if revoked
    }

    uint256 private _nextTokenId = 1;

    // Storage mappings
    mapping(uint256 => CredentialRecord) private _credentials;
    mapping(string => uint256) private _credentialIdToTokenId;
    mapping(bytes32 => bool) private _usedCredentialHashes;
    mapping(address => uint256[]) private _recipientTokens;

    // Custom errors for gas efficiency
    error SoulboundTokenCannotBeTransferred();
    error CredentialAlreadyExists(string credentialId);
    error CredentialHashAlreadyUsed(bytes32 hash);
    error CredentialNotFound();
    error CredentialAlreadyRevoked();
    error InvalidRecipientAddress();
    error EmptyCredentialData();

    // Events
    event CredentialIssued(
        uint256 indexed tokenId,
        string indexed credentialId,
        address indexed recipient,
        bytes32 credentialHash,
        string ipfsCID,
        address issuer,
        uint256 issuedAt
    );

    event CredentialRevoked(
        uint256 indexed tokenId,
        string indexed credentialId,
        address indexed revoker,
        string reason,
        uint256 revokedAt
    );

    constructor(
        string memory name,
        string memory symbol,
        address initialAdmin
    ) ERC721(name, symbol) {
        address admin = initialAdmin == address(0) ? msg.sender : initialAdmin;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, admin);
    }

    /**
     * @notice Returns whether the token is soulbound/locked.
     * @dev ERC-5192 compliance. Always returns true for minted tokens.
     */
    function locked(uint256 tokenId) external view override returns (bool) {
        _requireOwned(tokenId);
        return true;
    }

    /**
     * @notice Issues a new Soulbound Proof-of-Competence Credential.
     * @param recipient Developer wallet address
     * @param credentialId Unique alphanumeric credential identifier (e.g. TL-2026-8492-v1)
     * @param credentialHash Keccak-256 hash of the canonical IPFS JSON metadata
     * @param ipfsCID IPFS Content Identifier
     * @return tokenId The newly minted token ID
     */
    function issueCredential(
        address recipient,
        string calldata credentialId,
        bytes32 credentialHash,
        string calldata ipfsCID
    ) external onlyRole(ISSUER_ROLE) returns (uint256) {
        if (recipient == address(0)) revert InvalidRecipientAddress();
        if (bytes(credentialId).length == 0 || bytes(ipfsCID).length == 0 || credentialHash == bytes32(0)) {
            revert EmptyCredentialData();
        }
        if (_credentialIdToTokenId[credentialId] != 0) {
            revert CredentialAlreadyExists(credentialId);
        }
        if (_usedCredentialHashes[credentialHash]) {
            revert CredentialHashAlreadyUsed(credentialHash);
        }

        uint256 tokenId = _nextTokenId++;

        // Mint Soulbound ERC-721 token
        _safeMint(recipient, tokenId);

        // Store credential record
        _credentials[tokenId] = CredentialRecord({
            tokenId: tokenId,
            credentialId: credentialId,
            credentialHash: credentialHash,
            ipfsCID: ipfsCID,
            recipient: recipient,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            status: CredentialStatus.ACTIVE,
            revokedAt: 0
        });

        _credentialIdToTokenId[credentialId] = tokenId;
        _usedCredentialHashes[credentialHash] = true;
        _recipientTokens[recipient].push(tokenId);

        // ERC-5192 event
        emit Locked(tokenId);

        emit CredentialIssued(
            tokenId,
            credentialId,
            recipient,
            credentialHash,
            ipfsCID,
            msg.sender,
            block.timestamp
        );

        return tokenId;
    }

    /**
     * @notice Revokes a credential in case of integrity violation or administrative correction.
     * @dev Does not delete the token record to preserve permanent audit provenance.
     * @param tokenId The token ID to revoke
     * @param reason Explanation for revocation
     */
    function revokeCredential(
        uint256 tokenId,
        string calldata reason
    ) external onlyRole(ISSUER_ROLE) {
        _requireOwned(tokenId);
        CredentialRecord storage record = _credentials[tokenId];

        if (record.status == CredentialStatus.REVOKED) {
            revert CredentialAlreadyRevoked();
        }

        record.status = CredentialStatus.REVOKED;
        record.revokedAt = block.timestamp;

        emit CredentialRevoked(
            tokenId,
            record.credentialId,
            msg.sender,
            reason,
            block.timestamp
        );
    }

    /**
     * @notice Retrieves credential details by Token ID.
     */
    function getCredentialByTokenId(
        uint256 tokenId
    ) external view returns (CredentialRecord memory) {
        _requireOwned(tokenId);
        return _credentials[tokenId];
    }

    /**
     * @notice Retrieves credential details by public Credential ID (e.g. TL-2026-8492-v1).
     */
    function getCredentialById(
        string calldata credentialId
    ) external view returns (CredentialRecord memory) {
        uint256 tokenId = _credentialIdToTokenId[credentialId];
        if (tokenId == 0) revert CredentialNotFound();
        return _credentials[tokenId];
    }

    /**
     * @notice Retrieves all token IDs issued to a developer wallet.
     */
    function getCredentialsByRecipient(
        address recipient
    ) external view returns (uint256[] memory) {
        return _recipientTokens[recipient];
    }

    /**
     * @notice Independent 7-point cryptographic on-chain verification method.
     * @param credentialId The credential identifier to verify
     * @param expectedHash The expected hash computed from canonical IPFS metadata
     * @return isValid True if credential exists, hash matches, and is currently active
     * @return isRevoked True if the credential was explicitly revoked
     * @return recipient The wallet address to which the credential is bound
     * @return ipfsCID The IPFS CID reference
     * @return issuedAt The timestamp when the credential was minted
     */
    function verifyCredential(
        string calldata credentialId,
        bytes32 expectedHash
    )
        external
        view
        returns (
            bool isValid,
            bool isRevoked,
            address recipient,
            string memory ipfsCID,
            uint256 issuedAt
        )
    {
        uint256 tokenId = _credentialIdToTokenId[credentialId];
        if (tokenId == 0) {
            return (false, false, address(0), "", 0);
        }

        CredentialRecord memory record = _credentials[tokenId];
        bool hashMatches = (record.credentialHash == expectedHash);
        bool notRevoked = (record.status == CredentialStatus.ACTIVE);

        return (
            hashMatches && notRevoked,
            record.status == CredentialStatus.REVOKED,
            record.recipient,
            record.ipfsCID,
            record.issuedAt
        );
    }

    /**
     * @dev Enforces Soulbound non-transferability.
     * Reverts if transfer is attempted between two non-zero addresses.
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0)) and burning (to == address(0))
        if (from != address(0) && to != address(0)) {
            revert SoulboundTokenCannotBeTransferred();
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Standard interface support for ERC721, AccessControl, and ERC-5192.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, AccessControl) returns (bool) {
        return
            interfaceId == 0xb45a3c0e || // ERC-5192 Interface ID
            super.supportsInterface(interfaceId);
    }
}
