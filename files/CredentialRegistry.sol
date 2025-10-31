// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CredentialRegistry
 * @dev Smart contract for managing eKYC credentials with consent management
 */
contract CredentialRegistry is Ownable {
    
    // Struct to store credential information
    struct Credential {
        address owner;           // Credential owner's address
        string nid;             // National ID number
        bytes32 credentialHash; // Hash of encrypted credential data
        address issuer;         // Address of the issuer
        uint256 issuanceDate;   // Timestamp of issuance
        uint256 expiryDate;     // Expiry date of the credential
        bool isValid;           // Validity status
    }

    // Mapping to store credentials: owner address => NID => Credential
    mapping(address => mapping(string => Credential)) private credentials;
    
    // Mapping to store consent: owner => NID => requester => hasConsent
    mapping(address => mapping(string => mapping(address => bool))) private consents;
    
    // Mapping to store authorized issuers
    mapping(address => bool) public authorizedIssuers;

    // Events
    event CredentialIssued(
        address indexed owner,
        string nid,
        bytes32 credentialHash,
        address indexed issuer
    );
    
    event CredentialRevoked(
        address indexed owner,
        string nid,
        address indexed revoker
    );
    
    event ConsentGranted(
        address indexed owner,
        string nid,
        address indexed requester
    );
    
    event ConsentRevoked(
        address indexed owner,
        string nid,
        address indexed requester
    );
    
    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);

    // Constructor
    constructor() Ownable(msg.sender) {}

    // Modifiers
    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "Not an authorized issuer");
        _;
    }

    /**
     * @dev Add an authorized issuer (only owner)
     */
    function addAuthorizedIssuer(address _issuer) external onlyOwner {
        require(_issuer != address(0), "Invalid issuer address");
        require(!authorizedIssuers[_issuer], "Issuer already authorized");
        
        authorizedIssuers[_issuer] = true;
        emit IssuerAuthorized(_issuer);
    }

    /**
     * @dev Remove an authorized issuer (only owner)
     */
    function removeAuthorizedIssuer(address _issuer) external onlyOwner {
        require(authorizedIssuers[_issuer], "Issuer not authorized");
        
        authorizedIssuers[_issuer] = false;
        emit IssuerRevoked(_issuer);
    }

    /**
     * @dev Issue a new credential
     */
    function issueCredential(
        address _owner,
        string memory _nid,
        bytes32 _credentialHash,
        uint256 _expiryDate
    ) external onlyAuthorizedIssuer {
        require(_owner != address(0), "Invalid owner address");
        require(bytes(_nid).length > 0, "NID cannot be empty");
        require(_credentialHash != bytes32(0), "Invalid credential hash");
        require(_expiryDate > block.timestamp, "Expiry date must be in the future");
        require(credentials[_owner][_nid].owner == address(0), "Credential already exists");

        credentials[_owner][_nid] = Credential({
            owner: _owner,
            nid: _nid,
            credentialHash: _credentialHash,
            issuer: msg.sender,
            issuanceDate: block.timestamp,
            expiryDate: _expiryDate,
            isValid: true
        });

        emit CredentialIssued(_owner, _nid, _credentialHash, msg.sender);
    }

    /**
     * @dev Revoke a credential
     */
    function revokeCredential(address _owner, string memory _nid) external {
        Credential storage credential = credentials[_owner][_nid];
        
        require(credential.owner != address(0), "Credential does not exist");
        require(credential.isValid, "Credential already revoked");
        require(
            msg.sender == credential.issuer || msg.sender == owner(),
            "Not authorized to revoke"
        );

        credential.isValid = false;
        emit CredentialRevoked(_owner, _nid, msg.sender);
    }

    /**
     * @dev Verify if a credential is valid
     */
    function verifyCredential(address _owner, string memory _nid) 
        external 
        view 
        returns (bool) 
    {
        Credential memory credential = credentials[_owner][_nid];
        
        if (credential.owner == address(0)) {
            return false; // Credential doesn't exist
        }
        
        if (!credential.isValid) {
            return false; // Credential revoked
        }
        
        if (block.timestamp > credential.expiryDate) {
            return false; // Credential expired
        }
        
        return true;
    }

    /**
     * @dev Get credential details
     */
    function getCredential(address _owner, string memory _nid) 
        external 
        view 
        returns (Credential memory) 
    {
        return credentials[_owner][_nid];
    }

    /**
     * @dev Grant consent to a requester
     */
    function grantConsent(string memory _nid, address _requester) external {
        require(credentials[msg.sender][_nid].owner == msg.sender, "Credential does not exist");
        require(
            credentials[msg.sender][_nid].owner == msg.sender,
            "Only credential owner can grant consent"
        );
        require(_requester != address(0), "Invalid requester address");
        require(!consents[msg.sender][_nid][_requester], "Consent already granted");

        consents[msg.sender][_nid][_requester] = true;
        emit ConsentGranted(msg.sender, _nid, _requester);
    }

    /**
     * @dev Revoke consent from a requester
     */
    function revokeConsent(string memory _nid, address _requester) external {
        require(
            credentials[msg.sender][_nid].owner == msg.sender,
            "Only credential owner can revoke consent"
        );
        require(consents[msg.sender][_nid][_requester], "Consent not granted");

        consents[msg.sender][_nid][_requester] = false;
        emit ConsentRevoked(msg.sender, _nid, _requester);
    }

    /**
     * @dev Check if consent is granted
     */
    function hasConsent(
        address _owner,
        string memory _nid,
        address _requester
    ) external view returns (bool) {
        return consents[_owner][_nid][_requester];
    }
}
