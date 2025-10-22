// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CredentialRegistry {
    struct Credential {
        bytes32 credentialHash;
        address issuer;
        address holder;
        uint256 issuedAt;
        bool isRevoked;
        uint256 credentialType; // 1 = Student ID, 2 = KYC
    }

    mapping(bytes32 => Credential) public credentials;
    mapping(address => bytes32[]) public holderCredentials;
    mapping(address => bool) public authorizedIssuers;

    address public admin;

    event CredentialIssued(
        bytes32 indexed credentialId,
        address indexed issuer,
        address indexed holder,
        uint256 credentialType
    );

    event CredentialRevoked(bytes32 indexed credentialId);

    event ConsentGranted(
        address indexed holder,
        address indexed verifier,
        bytes32 indexed credentialId
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "Not authorized issuer");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function addAuthorizedIssuer(address _issuer) public onlyAdmin {
        authorizedIssuers[_issuer] = true;
    }

    function issueCredential(
        bytes32 _credentialHash,
        address _holder,
        uint256 _credentialType
    ) public onlyAuthorizedIssuer returns (bytes32) {
        bytes32 credentialId = keccak256(
            abi.encodePacked(_credentialHash, _holder, block.timestamp)
        );

        credentials[credentialId] = Credential({
            credentialHash: _credentialHash,
            issuer: msg.sender,
            holder: _holder,
            issuedAt: block.timestamp,
            isRevoked: false,
            credentialType: _credentialType
        });

        holderCredentials[_holder].push(credentialId);

        emit CredentialIssued(credentialId, msg.sender, _holder, _credentialType);

        return credentialId;
    }

    function verifyCredential(bytes32 _credentialId, bytes32 _hash)
        public
        view
        returns (bool)
    {
        Credential memory cred = credentials[_credentialId];
        return cred.credentialHash == _hash && !cred.isRevoked;
    }

    function revokeCredential(bytes32 _credentialId) public {
        Credential storage cred = credentials[_credentialId];
        require(msg.sender == cred.issuer, "Only issuer can revoke");
        cred.isRevoked = true;
        emit CredentialRevoked(_credentialId);
    }

    function grantConsent(address _verifier, bytes32 _credentialId) public {
        require(credentials[_credentialId].holder == msg.sender, "Not credential holder");
        emit ConsentGranted(msg.sender, _verifier, _credentialId);
    }

    // Helper function to get credential details
    function getCredential(bytes32 _credentialId) public view returns (
        bytes32 hash,
        address issuer,
        address holder,
        uint256 issuedAt,
        bool isRevoked,
        uint256 credentialType
    ) {
        Credential memory cred = credentials[_credentialId];
        return (
            cred.credentialHash,
            cred.issuer,
            cred.holder,
            cred.issuedAt,
            cred.isRevoked,
            cred.credentialType
        );
    }

    // Get all credentials for a holder
    function getHolderCredentials(address _holder) public view returns (bytes32[] memory) {
        return holderCredentials[_holder];
    }
}