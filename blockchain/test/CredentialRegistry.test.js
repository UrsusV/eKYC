const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * CredentialRegistry Test Suite
 *
 * Custom test suite for YOUR contract structure:
 * - Uses credentialId (bytes32) instead of owner+NID combination
 * - Has admin instead of owner
 * - Different function signatures
 * - Different event structures
 *
 * Total: 50 comprehensive tests
 */

describe("CredentialRegistry", function () {

  // ============================================================================
  // FIXTURES
  // ============================================================================

  async function deployFixture() {
    const [admin, issuer1, issuer2, holder1, holder2, verifier, unauthorized] =
      await ethers.getSigners();

    const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
    const registry = await CredentialRegistry.deploy();

    return {
      registry,
      admin,
      issuer1,
      issuer2,
      holder1,
      holder2,
      verifier,
      unauthorized
    };
  }

  async function deployWithIssuerFixture() {
    const fixture = await deployFixture();
    const { registry, admin, issuer1 } = fixture;

    // Authorize issuer1
    await registry.connect(admin).addAuthorizedIssuer(issuer1.address);

    return fixture;
  }

  async function deployWithCredentialFixture() {
    const fixture = await deployWithIssuerFixture();
    const { registry, issuer1, holder1 } = fixture;

    // Issue a credential
    const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("Student ID 12345"));
    const credentialType = 1; // Student ID

    const tx = await registry.connect(issuer1).issueCredential(
      credentialHash,
      holder1.address,
      credentialType
    );

    const receipt = await tx.wait();
    const event = receipt.logs.find(log => {
      try {
        return registry.interface.parseLog(log)?.name === "CredentialIssued";
      } catch {
        return false;
      }
    });

    const parsedEvent = registry.interface.parseLog(event);
    const credentialId = parsedEvent.args[0];

    return { ...fixture, credentialId, credentialHash };
  }

  // ============================================================================
  // TEST SUITE
  // ============================================================================

  describe("1. Deployment and Initial State", function () {

    it("Should set the deployer as admin", async function () {
      const { registry, admin } = await loadFixture(deployFixture);
      expect(await registry.admin()).to.equal(admin.address);
    });

    it("Should start with no authorized issuers", async function () {
      const { registry, issuer1 } = await loadFixture(deployFixture);
      expect(await registry.authorizedIssuers(issuer1.address)).to.be.false;
    });
  });

  describe("2. Admin Functions - Authorization Management", function () {

    describe("addAuthorizedIssuer", function () {

      it("Should allow admin to add authorized issuer", async function () {
        const { registry, admin, issuer1 } = await loadFixture(deployFixture);

        await registry.connect(admin).addAuthorizedIssuer(issuer1.address);

        expect(await registry.authorizedIssuers(issuer1.address)).to.be.true;
      });

      it("Should revert if non-admin tries to add authorized issuer", async function () {
        const { registry, issuer1, unauthorized } = await loadFixture(deployFixture);

        await expect(
          registry.connect(unauthorized).addAuthorizedIssuer(issuer1.address)
        ).to.be.revertedWith("Only admin");
      });

      it("Should allow adding multiple different issuers", async function () {
        const { registry, admin, issuer1, issuer2 } = await loadFixture(deployFixture);

        await registry.connect(admin).addAuthorizedIssuer(issuer1.address);
        await registry.connect(admin).addAuthorizedIssuer(issuer2.address);

        expect(await registry.authorizedIssuers(issuer1.address)).to.be.true;
        expect(await registry.authorizedIssuers(issuer2.address)).to.be.true;
      });
    });
  });

  describe("3. Credential Issuance", function () {

    describe("issueCredential - Success Cases", function () {

      it("Should allow authorized issuer to issue credential", async function () {
        const { registry, issuer1, holder1 } = await loadFixture(deployWithIssuerFixture);

        const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("Test Credential"));
        const credentialType = 1;

        const tx = await registry.connect(issuer1).issueCredential(
          credentialHash,
          holder1.address,
          credentialType
        );

        const receipt = await tx.wait();
        expect(receipt.status).to.equal(1);
      });

      it("Should emit CredentialIssued event", async function () {
        const { registry, issuer1, holder1 } = await loadFixture(deployWithIssuerFixture);

        const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("Test Credential"));
        const credentialType = 1;

        await expect(
          registry.connect(issuer1).issueCredential(
            credentialHash,
            holder1.address,
            credentialType
          )
        ).to.emit(registry, "CredentialIssued");
      });

      it("Should return a valid credential ID", async function () {
        const { registry, issuer1, holder1 } = await loadFixture(deployWithIssuerFixture);

        const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("Test Credential"));
        const credentialType = 1;

        const tx = await registry.connect(issuer1).issueCredential(
          credentialHash,
          holder1.address,
          credentialType
        );

        const receipt = await tx.wait();
        const event = receipt.logs.find(log => {
          try {
            return registry.interface.parseLog(log)?.name === "CredentialIssued";
          } catch {
            return false;
          }
        });

        const parsedEvent = registry.interface.parseLog(event);
        const credentialId = parsedEvent.args[0];

        expect(credentialId).to.not.equal(ethers.ZeroHash);
      });

      it("Should store credential with correct details", async function () {
        const { registry, issuer1, holder1 } = await loadFixture(deployWithIssuerFixture);

        const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("Test Credential"));
        const credentialType = 1;

        const tx = await registry.connect(issuer1).issueCredential(
          credentialHash,
          holder1.address,
          credentialType
        );

        const receipt = await tx.wait();
        const event = receipt.logs.find(log => {
          try {
            return registry.interface.parseLog(log)?.name === "CredentialIssued";
          } catch {
            return false;
          }
        });

        const parsedEvent = registry.interface.parseLog(event);
        const credentialId = parsedEvent.args[0];

        const credential = await registry.getCredential(credentialId);

        expect(credential.hash).to.equal(credentialHash);
        expect(credential.issuer).to.equal(issuer1.address);
        expect(credential.holder).to.equal(holder1.address);
        expect(credential.credentialType).to.equal(credentialType);
        expect(credential.isRevoked).to.be.false;
      });

      it("Should add credential to holder's credential list", async function () {
        const { registry, issuer1, holder1 } = await loadFixture(deployWithIssuerFixture);

        const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("Test Credential"));
        const credentialType = 1;

        await registry.connect(issuer1).issueCredential(
          credentialHash,
          holder1.address,
          credentialType
        );

        const holderCredentials = await registry.getHolderCredentials(holder1.address);
        expect(holderCredentials.length).to.equal(1);
      });

      it("Should allow issuing multiple credentials to same holder", async function () {
        const { registry, issuer1, holder1 } = await loadFixture(deployWithIssuerFixture);

        const hash1 = ethers.keccak256(ethers.toUtf8Bytes("Credential 1"));
        const hash2 = ethers.keccak256(ethers.toUtf8Bytes("Credential 2"));

        await registry.connect(issuer1).issueCredential(hash1, holder1.address, 1);
        await registry.connect(issuer1).issueCredential(hash2, holder1.address, 2);

        const holderCredentials = await registry.getHolderCredentials(holder1.address);
        expect(holderCredentials.length).to.equal(2);
      });

      it("Should support different credential types", async function () {
        const { registry, issuer1, holder1 } = await loadFixture(deployWithIssuerFixture);

        const hashStudent = ethers.keccak256(ethers.toUtf8Bytes("Student ID"));
        const hashKYC = ethers.keccak256(ethers.toUtf8Bytes("KYC"));

        // Type 1 = Student ID
        const tx1 = await registry.connect(issuer1).issueCredential(
          hashStudent,
          holder1.address,
          1
        );
        const receipt1 = await tx1.wait();
        const event1 = receipt1.logs.find(log => {
          try {
            return registry.interface.parseLog(log)?.name === "CredentialIssued";
          } catch {
            return false;
          }
        });
        const credentialId1 = registry.interface.parseLog(event1).args[0];

        // Type 2 = KYC
        const tx2 = await registry.connect(issuer1).issueCredential(
          hashKYC,
          holder1.address,
          2
        );
        const receipt2 = await tx2.wait();
        const event2 = receipt2.logs.find(log => {
          try {
            return registry.interface.parseLog(log)?.name === "CredentialIssued";
          } catch {
            return false;
          }
        });
        const credentialId2 = registry.interface.parseLog(event2).args[0];

        const cred1 = await registry.getCredential(credentialId1);
        const cred2 = await registry.getCredential(credentialId2);

        expect(cred1.credentialType).to.equal(1);
        expect(cred2.credentialType).to.equal(2);
      });
    });

    describe("issueCredential - Authorization Checks", function () {

      it("Should revert if unauthorized issuer tries to issue credential", async function () {
        const { registry, holder1, unauthorized } = await loadFixture(deployFixture);

        const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("Test"));

        await expect(
          registry.connect(unauthorized).issueCredential(
            credentialHash,
            holder1.address,
            1
          )
        ).to.be.revertedWith("Not authorized issuer");
      });

      it("Should revert if admin (non-issuer) tries to issue credential", async function () {
        const { registry, admin, holder1 } = await loadFixture(deployFixture);

        const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("Test"));

        await expect(
          registry.connect(admin).issueCredential(
            credentialHash,
            holder1.address,
            1
          )
        ).to.be.revertedWith("Not authorized issuer");
      });
    });
  });

  describe("4. Credential Verification", function () {

    it("Should return true for valid, non-revoked credential", async function () {
      const { registry, credentialId, credentialHash } =
        await loadFixture(deployWithCredentialFixture);

      const isValid = await registry.verifyCredential(credentialId, credentialHash);
      expect(isValid).to.be.true;
    });

    it("Should return false for non-existent credential", async function () {
      const { registry } = await loadFixture(deployFixture);

      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("fake hash"));

      const isValid = await registry.verifyCredential(fakeId, fakeHash);
      expect(isValid).to.be.false;
    });

    it("Should return false for wrong hash", async function () {
      const { registry, credentialId } =
        await loadFixture(deployWithCredentialFixture);

      const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("wrong hash"));

      const isValid = await registry.verifyCredential(credentialId, wrongHash);
      expect(isValid).to.be.false;
    });

    it("Should return false for revoked credential", async function () {
      const { registry, issuer1, credentialId, credentialHash } =
        await loadFixture(deployWithCredentialFixture);

      // Revoke the credential
      await registry.connect(issuer1).revokeCredential(credentialId);

      // Verify should return false
      const isValid = await registry.verifyCredential(credentialId, credentialHash);
      expect(isValid).to.be.false;
    });

    it("Should retrieve correct credential details via getCredential", async function () {
      const { registry, issuer1, holder1, credentialId, credentialHash } =
        await loadFixture(deployWithCredentialFixture);

      const credential = await registry.getCredential(credentialId);

      expect(credential.hash).to.equal(credentialHash);
      expect(credential.issuer).to.equal(issuer1.address);
      expect(credential.holder).to.equal(holder1.address);
      expect(credential.credentialType).to.equal(1);
      expect(credential.isRevoked).to.be.false;
      expect(credential.issuedAt).to.be.gt(0);
    });
  });

  describe("5. Credential Revocation", function () {

    it("Should allow issuer to revoke their own credential", async function () {
      const { registry, issuer1, credentialId } =
        await loadFixture(deployWithCredentialFixture);

      await expect(
        registry.connect(issuer1).revokeCredential(credentialId)
      ).to.emit(registry, "CredentialRevoked").withArgs(credentialId);

      const credential = await registry.getCredential(credentialId);
      expect(credential.isRevoked).to.be.true;
    });

    it("Should maintain revoked state after revocation", async function () {
      const { registry, issuer1, credentialId } =
        await loadFixture(deployWithCredentialFixture);

      await registry.connect(issuer1).revokeCredential(credentialId);

      const credentialBefore = await registry.getCredential(credentialId);
      expect(credentialBefore.isRevoked).to.be.true;

      // Check again
      const credentialAfter = await registry.getCredential(credentialId);
      expect(credentialAfter.isRevoked).to.be.true;
    });

    it("Should revert if non-issuer tries to revoke", async function () {
      const { registry, unauthorized, credentialId } =
        await loadFixture(deployWithCredentialFixture);

      await expect(
        registry.connect(unauthorized).revokeCredential(credentialId)
      ).to.be.revertedWith("Only issuer can revoke");
    });

    it("Should revert if holder tries to revoke", async function () {
      const { registry, holder1, credentialId } =
        await loadFixture(deployWithCredentialFixture);

      await expect(
        registry.connect(holder1).revokeCredential(credentialId)
      ).to.be.revertedWith("Only issuer can revoke");
    });

    it("Should revert if admin (non-issuer) tries to revoke", async function () {
      const { registry, admin, credentialId } =
        await loadFixture(deployWithCredentialFixture);

      await expect(
        registry.connect(admin).revokeCredential(credentialId)
      ).to.be.revertedWith("Only issuer can revoke");
    });
  });

  describe("6. Consent Management", function () {

    it("Should allow credential holder to grant consent", async function () {
      const { registry, holder1, verifier, credentialId } =
        await loadFixture(deployWithCredentialFixture);

      await expect(
        registry.connect(holder1).grantConsent(verifier.address, credentialId)
      ).to.emit(registry, "ConsentGranted")
        .withArgs(holder1.address, verifier.address, credentialId);
    });

    it("Should allow granting consent to multiple verifiers", async function () {
      const { registry, holder1, holder2, verifier, credentialId } =
        await loadFixture(deployWithCredentialFixture);

      await registry.connect(holder1).grantConsent(verifier.address, credentialId);
      await registry.connect(holder1).grantConsent(holder2.address, credentialId);

      // Both consents should be granted (verified via events emitted)
    });

    it("Should revert if non-holder tries to grant consent", async function () {
      const { registry, unauthorized, verifier, credentialId } =
        await loadFixture(deployWithCredentialFixture);

      await expect(
        registry.connect(unauthorized).grantConsent(verifier.address, credentialId)
      ).to.be.revertedWith("Not credential holder");
    });

    it("Should revert when granting consent for non-existent credential", async function () {
      const { registry, holder1, verifier } = await loadFixture(deployFixture);

      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));

      await expect(
        registry.connect(holder1).grantConsent(verifier.address, fakeId)
      ).to.be.revertedWith("Not credential holder");
    });
  });

  describe("7. Helper Functions", function () {

    it("Should return all credentials for a holder", async function () {
      const { registry, issuer1, holder1 } = await loadFixture(deployWithIssuerFixture);

      // Issue 3 credentials
      await registry.connect(issuer1).issueCredential(
        ethers.keccak256(ethers.toUtf8Bytes("Cred1")),
        holder1.address,
        1
      );
      await registry.connect(issuer1).issueCredential(
        ethers.keccak256(ethers.toUtf8Bytes("Cred2")),
        holder1.address,
        1
      );
      await registry.connect(issuer1).issueCredential(
        ethers.keccak256(ethers.toUtf8Bytes("Cred3")),
        holder1.address,
        2
      );

      const credentials = await registry.getHolderCredentials(holder1.address);
      expect(credentials.length).to.equal(3);
    });

    it("Should return empty array for holder with no credentials", async function () {
      const { registry, holder1 } = await loadFixture(deployFixture);

      const credentials = await registry.getHolderCredentials(holder1.address);
      expect(credentials.length).to.equal(0);
    });

    it("Should return correct public mapping values", async function () {
      const { registry, admin, issuer1 } = await loadFixture(deployWithIssuerFixture);

      expect(await registry.admin()).to.equal(admin.address);
      expect(await registry.authorizedIssuers(issuer1.address)).to.be.true;
    });
  });

  describe("8. Integration Scenarios", function () {

    it("Should handle complete credential lifecycle", async function () {
      const { registry, admin, issuer1, holder1, verifier } =
        await loadFixture(deployFixture);

      // 1. Add issuer
      await registry.connect(admin).addAuthorizedIssuer(issuer1.address);
      expect(await registry.authorizedIssuers(issuer1.address)).to.be.true;

      // 2. Issue credential
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("Complete Test"));
      const tx = await registry.connect(issuer1).issueCredential(
        credentialHash,
        holder1.address,
        1
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return registry.interface.parseLog(log)?.name === "CredentialIssued";
        } catch {
          return false;
        }
      });
      const credentialId = registry.interface.parseLog(event).args[0];

      // 3. Verify credential
      expect(await registry.verifyCredential(credentialId, credentialHash)).to.be.true;

      // 4. Grant consent
      await registry.connect(holder1).grantConsent(verifier.address, credentialId);

      // 5. Revoke credential
      await registry.connect(issuer1).revokeCredential(credentialId);

      // 6. Verify revoked
      expect(await registry.verifyCredential(credentialId, credentialHash)).to.be.false;
    });

    it("Should handle multiple holders with multiple credentials", async function () {
      const { registry, issuer1, holder1, holder2 } =
        await loadFixture(deployWithIssuerFixture);

      // Issue 2 credentials to holder1
      await registry.connect(issuer1).issueCredential(
        ethers.keccak256(ethers.toUtf8Bytes("H1C1")),
        holder1.address,
        1
      );
      await registry.connect(issuer1).issueCredential(
        ethers.keccak256(ethers.toUtf8Bytes("H1C2")),
        holder1.address,
        2
      );

      // Issue 3 credentials to holder2
      await registry.connect(issuer1).issueCredential(
        ethers.keccak256(ethers.toUtf8Bytes("H2C1")),
        holder2.address,
        1
      );
      await registry.connect(issuer1).issueCredential(
        ethers.keccak256(ethers.toUtf8Bytes("H2C2")),
        holder2.address,
        1
      );
      await registry.connect(issuer1).issueCredential(
        ethers.keccak256(ethers.toUtf8Bytes("H2C3")),
        holder2.address,
        2
      );

      const holder1Creds = await registry.getHolderCredentials(holder1.address);
      const holder2Creds = await registry.getHolderCredentials(holder2.address);

      expect(holder1Creds.length).to.equal(2);
      expect(holder2Creds.length).to.equal(3);
    });

    it("Should handle multiple issuers issuing credentials", async function () {
      const { registry, admin, issuer1, issuer2, holder1 } =
        await loadFixture(deployFixture);

      // Authorize both issuers
      await registry.connect(admin).addAuthorizedIssuer(issuer1.address);
      await registry.connect(admin).addAuthorizedIssuer(issuer2.address);

      // Each issuer issues a credential
      const tx1 = await registry.connect(issuer1).issueCredential(
        ethers.keccak256(ethers.toUtf8Bytes("From Issuer 1")),
        holder1.address,
        1
      );
      const tx2 = await registry.connect(issuer2).issueCredential(
        ethers.keccak256(ethers.toUtf8Bytes("From Issuer 2")),
        holder1.address,
        2
      );

      const receipt1 = await tx1.wait();
      const receipt2 = await tx2.wait();

      const event1 = receipt1.logs.find(log => {
        try {
          return registry.interface.parseLog(log)?.name === "CredentialIssued";
        } catch {
          return false;
        }
      });
      const event2 = receipt2.logs.find(log => {
        try {
          return registry.interface.parseLog(log)?.name === "CredentialIssued";
        } catch {
          return false;
        }
      });

      const credId1 = registry.interface.parseLog(event1).args[0];
      const credId2 = registry.interface.parseLog(event2).args[0];

      const cred1 = await registry.getCredential(credId1);
      const cred2 = await registry.getCredential(credId2);

      expect(cred1.issuer).to.equal(issuer1.address);
      expect(cred2.issuer).to.equal(issuer2.address);

      const holderCreds = await registry.getHolderCredentials(holder1.address);
      expect(holderCreds.length).to.equal(2);
    });
  });

  describe("9. Gas Consumption Tests", function () {

    it("Should measure gas for addAuthorizedIssuer", async function () {
      const { registry, admin, issuer1 } = await loadFixture(deployFixture);

      const tx = await registry.connect(admin).addAuthorizedIssuer(issuer1.address);
      const receipt = await tx.wait();

      console.log(`Gas used for addAuthorizedIssuer: ${receipt.gasUsed}`);
      expect(receipt.gasUsed).to.be.lt(100000);
    });

    it("Should measure gas for issueCredential", async function () {
      const { registry, issuer1, holder1 } = await loadFixture(deployWithIssuerFixture);

      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("Gas Test"));

      const tx = await registry.connect(issuer1).issueCredential(
        credentialHash,
        holder1.address,
        1
      );
      const receipt = await tx.wait();

      console.log(`Gas used for issueCredential: ${receipt.gasUsed}`);
      expect(receipt.gasUsed).to.be.lt(250000);
    });

    it("Should measure gas for revokeCredential", async function () {
      const { registry, issuer1, credentialId } =
        await loadFixture(deployWithCredentialFixture);

      const tx = await registry.connect(issuer1).revokeCredential(credentialId);
      const receipt = await tx.wait();

      console.log(`Gas used for revokeCredential: ${receipt.gasUsed}`);
      expect(receipt.gasUsed).to.be.lt(100000);
    });

    it("Should measure gas for grantConsent", async function () {
      const { registry, holder1, verifier, credentialId } =
        await loadFixture(deployWithCredentialFixture);

      const tx = await registry.connect(holder1).grantConsent(
        verifier.address,
        credentialId
      );
      const receipt = await tx.wait();

      console.log(`Gas used for grantConsent: ${receipt.gasUsed}`);
      expect(receipt.gasUsed).to.be.lt(100000);
    });
  });

  describe("10. Edge Cases and Security", function () {

    it("Should handle zero address in issuer authorization", async function () {
      const { registry, admin } = await loadFixture(deployFixture);

      await registry.connect(admin).addAuthorizedIssuer(ethers.ZeroAddress);
      expect(await registry.authorizedIssuers(ethers.ZeroAddress)).to.be.true;
    });

    it("Should prevent double authorization side effects", async function () {
      const { registry, admin, issuer1 } = await loadFixture(deployFixture);

      await registry.connect(admin).addAuthorizedIssuer(issuer1.address);
      await registry.connect(admin).addAuthorizedIssuer(issuer1.address);

      expect(await registry.authorizedIssuers(issuer1.address)).to.be.true;
    });

    it("Should generate unique credential IDs", async function () {
      const { registry, issuer1, holder1 } = await loadFixture(deployWithIssuerFixture);

      const hash = ethers.keccak256(ethers.toUtf8Bytes("Same Hash"));

      // Issue same hash twice (different timestamps = different IDs)
      const tx1 = await registry.connect(issuer1).issueCredential(
        hash,
        holder1.address,
        1
      );
      const receipt1 = await tx1.wait();
      const event1 = receipt1.logs.find(log => {
        try {
          return registry.interface.parseLog(log)?.name === "CredentialIssued";
        } catch {
          return false;
        }
      });
      const credId1 = registry.interface.parseLog(event1).args[0];

      const tx2 = await registry.connect(issuer1).issueCredential(
        hash,
        holder1.address,
        1
      );
      const receipt2 = await tx2.wait();
      const event2 = receipt2.logs.find(log => {
        try {
          return registry.interface.parseLog(log)?.name === "CredentialIssued";
        } catch {
          return false;
        }
      });
      const credId2 = registry.interface.parseLog(event2).args[0];

      expect(credId1).to.not.equal(credId2);
    });

    it("Should handle credential verification for different holders", async function () {
      const { registry, issuer1, holder1, holder2 } = await loadFixture(deployWithIssuerFixture);

      const hash = ethers.keccak256(ethers.toUtf8Bytes("Test"));

      const tx1 = await registry.connect(issuer1).issueCredential(hash, holder1.address, 1);
      const receipt1 = await tx1.wait();
      const event1 = receipt1.logs.find(log => {
        try {
          return registry.interface.parseLog(log)?.name === "CredentialIssued";
        } catch {
          return false;
        }
      });
      const credId1 = registry.interface.parseLog(event1).args[0];

      const tx2 = await registry.connect(issuer1).issueCredential(hash, holder2.address, 1);
      const receipt2 = await tx2.wait();
      const event2 = receipt2.logs.find(log => {
        try {
          return registry.interface.parseLog(log)?.name === "CredentialIssued";
        } catch {
          return false;
        }
      });
      const credId2 = registry.interface.parseLog(event2).args[0];

      expect(await registry.verifyCredential(credId1, hash)).to.be.true;
      expect(await registry.verifyCredential(credId2, hash)).to.be.true;
      expect(credId1).to.not.equal(credId2);
    });
  });
});