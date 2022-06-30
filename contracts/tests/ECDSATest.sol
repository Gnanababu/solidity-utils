// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../libraries/ECDSA.sol";

contract ECDSATest {
    // solhint-disable-next-line func-name-mixedcase
    function recover_v_r_s(bytes32 hash, uint8 v, bytes32 r, bytes32 s) external view returns(address signer) {
        return ECDSA.recover(hash, v, r, s);
    }

    // solhint-disable-next-line func-name-mixedcase
    function recover_r_vs(bytes32 hash, bytes32 r, bytes32 vs) external view returns(address signer) {
        return ECDSA.recover(hash, r, vs);
    }

    function recover(bytes32 hash, bytes calldata signature) external view returns(address signer) {
        return ECDSA.recover(hash, signature);
    }

    function recoverOrIsValidSignature(address signer, bytes32 hash, bytes calldata signature) external view returns(bool success) {
        return ECDSA.recoverOrIsValidSignature(signer, hash, signature);
    }

    function recoverOrIsValidSignature(address signer, bytes32 hash, bytes32 r, bytes32 vs) external view returns(bool success) {
        return ECDSA.recoverOrIsValidSignature(signer, hash, r, vs);
    }

    function recoverOrIsValidSignature65(address signer, bytes32 hash, bytes32 r, bytes32 vs) external view returns(bool success) {
        return ECDSA.recoverOrIsValidSignature65(signer, hash, r, vs);
    }

    function isValidSignature(address signer, bytes32 hash, bytes calldata signature) external view returns(bool success) {
        return ECDSA.isValidSignature(signer, hash, signature);
    }

    function isValidSignature(address signer, bytes32 hash, bytes32 r, bytes32 vs) external view returns(bool success) {
        return ECDSA.isValidSignature(signer, hash, r, vs);
    }

    function isValidSignature65(address signer, bytes32 hash, bytes32 r, bytes32 vs) external view returns(bool success) {
        return ECDSA.isValidSignature65(signer, hash, r, vs);
    }
}
