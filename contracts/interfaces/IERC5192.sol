// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ERC-5192 Minimal Soulbound Tokens
/// @dev See https://eips.ethereum.org/EIPS/eip-5192
interface IERC5192 {
    /// @notice Emitted when the locking status of a token is changed to locked.
    /// @dev If a token is minted and at the same time locked, this event MUST be emitted.
    /// @param tokenId The identifier for a token.
    event Locked(uint256 tokenId);

    /// @notice Emitted when the locking status of a token is changed to unlocked.
    /// @dev If a token is minted and at the same time unlocked, this event MUST be emitted.
    /// @param tokenId The identifier for a token.
    event Unlocked(uint256 tokenId);

    /// @notice Returns the locking status of an Soulbound Token
    /// @dev SBTs assigned to an address are considered locked and cannot be transferred.
    /// @param tokenId The identifier for a token.
    /// @return locked Returns true if token is locked, false if token is unlocked.
    function locked(uint256 tokenId) external view returns (bool);
}
