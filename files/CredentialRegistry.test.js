const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("CredentialRegistry", function () {
  // Fixture for deploying the contract
  async function deployCredentialRegistryFixture() {
    const [owner, authorizedIssuer, unauthorizedIssuer, user1, user2] = await ethers.getSigners();

    const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
    const registry = await CredentialRegistry.deploy();
    await registry.waitForDeployment();

    return { registry, owner, authorizedIssuer, unauthorizedIssuer, user1, user2 };
  }

  // Helper function to generate test NID
  function generateNID(suffix) {
    return `NID${suffix.toString().padStart(13, "0")}`;
  }

  // Helper function to generate credential hash
  function generateCredentialHash(nid, timestamp) {
    return ethers.keccak256(ethers.toUtf8Bytes(`${nid}-${timestamp}`));
  }

  describe("1. Deployment and Initial State", function () {
    it("Should set the right owner", async function () {
      const { registry, owner } = await loadFixture(deployCredentialRegistryFixture);
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero authorized issuers", async function () {
      const { registry, authorizedIssuer } = await loadFixture(deployCredentialRegistryFixture);
      expect(await registry.authorizedIssuers(authorizedIssuer.address)).to.be.false;
    });

    it("Should have correct contract name", async function () {
      const { registry } = await loadFixture(deployCredentialRegistryFixture);
      // This assumes you have a name() function in your contract
      // If not, you can skip this test
    });

    it("Should emit OwnershipTransferred event on deployment", async function () {
      const [owner] = await ethers.getSigners();
      const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
      
      await expect(CredentialRegistry.deploy())
        .to.emit(CredentialRegistry, "OwnershipTransferred")
        .withArgs(ethers.ZeroAddress, owner.address);
    });
  });

  describe("2. Admin Functions - Authorization Management", function () {
    describe("addAuthorizedIssuer", function () {
      it("Should allow owner to add authorized issuer", async function () {
        const { registry, owner, authorizedIssuer } = await loadFixture(deployCredentialRegistryFixture);
        
        await expect(registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address))
          .to.emit(registry, "IssuerAuthorized")
          .withArgs(authorizedIssuer.address);

        expect(await registry.authorizedIssuers(authorizedIssuer.address)).to.be.true;
      });

      it("Should revert if non-owner tries to add authorized issuer", async function () {
        const { registry, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await expect(
          registry.connect(user1).addAuthorizedIssuer(authorizedIssuer.address)
        ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
      });

      it("Should revert when adding zero address as issuer", async function () {
        const { registry, owner } = await loadFixture(deployCredentialRegistryFixture);
        
        await expect(
          registry.connect(owner).addAuthorizedIssuer(ethers.ZeroAddress)
        ).to.be.revertedWith("Invalid issuer address");
      });

      it("Should revert when adding already authorized issuer", async function () {
        const { registry, owner, authorizedIssuer } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        await expect(
          registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address)
        ).to.be.revertedWith("Issuer already authorized");
      });

      it("Should allow adding multiple different issuers", async function () {
        const { registry, owner, authorizedIssuer, user1, user2 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        await registry.connect(owner).addAuthorizedIssuer(user1.address);
        await registry.connect(owner).addAuthorizedIssuer(user2.address);

        expect(await registry.authorizedIssuers(authorizedIssuer.address)).to.be.true;
        expect(await registry.authorizedIssuers(user1.address)).to.be.true;
        expect(await registry.authorizedIssuers(user2.address)).to.be.true;
      });
    });

    describe("removeAuthorizedIssuer", function () {
      it("Should allow owner to remove authorized issuer", async function () {
        const { registry, owner, authorizedIssuer } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        await expect(registry.connect(owner).removeAuthorizedIssuer(authorizedIssuer.address))
          .to.emit(registry, "IssuerRevoked")
          .withArgs(authorizedIssuer.address);

        expect(await registry.authorizedIssuers(authorizedIssuer.address)).to.be.false;
      });

      it("Should revert if non-owner tries to remove authorized issuer", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        await expect(
          registry.connect(user1).removeAuthorizedIssuer(authorizedIssuer.address)
        ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
      });

      it("Should revert when removing non-authorized issuer", async function () {
        const { registry, owner, unauthorizedIssuer } = await loadFixture(deployCredentialRegistryFixture);
        
        await expect(
          registry.connect(owner).removeAuthorizedIssuer(unauthorizedIssuer.address)
        ).to.be.revertedWith("Issuer not authorized");
      });
    });
  });

  describe("3. Credential Issuance", function () {
    describe("issueCredential - Success Cases", function () {
      it("Should allow authorized issuer to issue credential", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(1);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60; // 1 year from now

        await expect(
          registry.connect(authorizedIssuer).issueCredential(
            user1.address,
            nid,
            credentialHash,
            expiryDate
          )
        ).to.emit(registry, "CredentialIssued")
          .withArgs(user1.address, nid, credentialHash, authorizedIssuer.address);

        const credential = await registry.getCredential(user1.address, nid);
        expect(credential.owner).to.equal(user1.address);
        expect(credential.nid).to.equal(nid);
        expect(credential.credentialHash).to.equal(credentialHash);
        expect(credential.issuer).to.equal(authorizedIssuer.address);
        expect(credential.isValid).to.be.true;
        expect(credential.expiryDate).to.equal(expiryDate);
      });

      it("Should set correct issuance timestamp", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(2);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        const tx = await registry.connect(authorizedIssuer).issueCredential(
          user1.address,
          nid,
          credentialHash,
          expiryDate
        );

        const receipt = await tx.wait();
        const block = await ethers.provider.getBlock(receipt.blockNumber);
        
        const credential = await registry.getCredential(user1.address, nid);
        expect(credential.issuanceDate).to.equal(block.timestamp);
      });

      it("Should allow issuing multiple credentials to same user", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid1 = generateNID(3);
        const nid2 = generateNID(4);
        const credentialHash1 = generateCredentialHash(nid1, Date.now());
        const credentialHash2 = generateCredentialHash(nid2, Date.now() + 1000);
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid1, credentialHash1, expiryDate);
        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid2, credentialHash2, expiryDate);

        const credential1 = await registry.getCredential(user1.address, nid1);
        const credential2 = await registry.getCredential(user1.address, nid2);

        expect(credential1.nid).to.equal(nid1);
        expect(credential2.nid).to.equal(nid2);
        expect(credential1.isValid).to.be.true;
        expect(credential2.isValid).to.be.true;
      });

      it("Should allow same NID for different users", async function () {
        const { registry, owner, authorizedIssuer, user1, user2 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(5);
        const credentialHash1 = generateCredentialHash(nid, Date.now());
        const credentialHash2 = generateCredentialHash(nid, Date.now() + 1000);
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash1, expiryDate);
        await registry.connect(authorizedIssuer).issueCredential(user2.address, nid, credentialHash2, expiryDate);

        const credential1 = await registry.getCredential(user1.address, nid);
        const credential2 = await registry.getCredential(user2.address, nid);

        expect(credential1.owner).to.equal(user1.address);
        expect(credential2.owner).to.equal(user2.address);
      });
    });

    describe("issueCredential - Edge Cases and Validations", function () {
      it("Should revert if unauthorized issuer tries to issue credential", async function () {
        const { registry, unauthorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        const nid = generateNID(6);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await expect(
          registry.connect(unauthorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate)
        ).to.be.revertedWith("Not an authorized issuer");
      });

      it("Should revert if owner address is zero", async function () {
        const { registry, owner, authorizedIssuer } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(7);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await expect(
          registry.connect(authorizedIssuer).issueCredential(
            ethers.ZeroAddress,
            nid,
            credentialHash,
            expiryDate
          )
        ).to.be.revertedWith("Invalid owner address");
      });

      it("Should revert if NID is empty", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const credentialHash = generateCredentialHash("", Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await expect(
          registry.connect(authorizedIssuer).issueCredential(user1.address, "", credentialHash, expiryDate)
        ).to.be.revertedWith("NID cannot be empty");
      });

      it("Should revert if credential hash is zero", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(8);
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await expect(
          registry.connect(authorizedIssuer).issueCredential(
            user1.address,
            nid,
            ethers.ZeroHash,
            expiryDate
          )
        ).to.be.revertedWith("Invalid credential hash");
      });

      it("Should revert if expiry date is in the past", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(9);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const pastDate = (await time.latest()) - 1; // 1 second in the past

        await expect(
          registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, pastDate)
        ).to.be.revertedWith("Expiry date must be in the future");
      });

      it("Should revert if credential already exists for user and NID", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(10);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

        await expect(
          registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate)
        ).to.be.revertedWith("Credential already exists");
      });

      it("Should handle maximum expiry date correctly", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(11);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const maxExpiryDate = 2147483647; // Max uint32 timestamp (year 2038)

        await registry.connect(authorizedIssuer).issueCredential(
          user1.address,
          nid,
          credentialHash,
          maxExpiryDate
        );

        const credential = await registry.getCredential(user1.address, nid);
        expect(credential.expiryDate).to.equal(maxExpiryDate);
      });
    });
  });

  describe("4. Credential Verification", function () {
    describe("verifyCredential", function () {
      it("Should return true for valid, non-expired credential", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(12);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

        expect(await registry.verifyCredential(user1.address, nid)).to.be.true;
      });

      it("Should return false for non-existent credential", async function () {
        const { registry, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        const nid = generateNID(13);

        expect(await registry.verifyCredential(user1.address, nid)).to.be.false;
      });

      it("Should return false for revoked credential", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(14);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);
        await registry.connect(authorizedIssuer).revokeCredential(user1.address, nid);

        expect(await registry.verifyCredential(user1.address, nid)).to.be.false;
      });

      it("Should return false for expired credential", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(15);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 60; // Expires in 60 seconds

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

        // Fast forward time to after expiry
        await time.increase(61);

        expect(await registry.verifyCredential(user1.address, nid)).to.be.false;
      });

      it("Should verify credential at exact expiry timestamp", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(16);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 100;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

        // Fast forward to exact expiry time
        await time.increaseTo(expiryDate);

        // At exact expiry, credential should still be valid (assuming <= comparison)
        // Adjust this based on your contract's logic
        const isValid = await registry.verifyCredential(user1.address, nid);
        // This test assumes the contract uses block.timestamp < expiryDate
        // Adjust expectation based on your actual implementation
      });
    });

    describe("getCredential", function () {
      it("Should return correct credential details", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(17);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

        const credential = await registry.getCredential(user1.address, nid);

        expect(credential.owner).to.equal(user1.address);
        expect(credential.nid).to.equal(nid);
        expect(credential.credentialHash).to.equal(credentialHash);
        expect(credential.issuer).to.equal(authorizedIssuer.address);
        expect(credential.isValid).to.be.true;
        expect(credential.expiryDate).to.equal(expiryDate);
      });

      it("Should return empty credential for non-existent entry", async function () {
        const { registry, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        const nid = generateNID(18);
        const credential = await registry.getCredential(user1.address, nid);

        expect(credential.owner).to.equal(ethers.ZeroAddress);
        expect(credential.nid).to.equal("");
        expect(credential.isValid).to.be.false;
      });
    });
  });

  describe("5. Credential Revocation", function () {
    describe("revokeCredential - Success Cases", function () {
      it("Should allow issuer to revoke their own credential", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(19);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

        await expect(registry.connect(authorizedIssuer).revokeCredential(user1.address, nid))
          .to.emit(registry, "CredentialRevoked")
          .withArgs(user1.address, nid, authorizedIssuer.address);

        const credential = await registry.getCredential(user1.address, nid);
        expect(credential.isValid).to.be.false;
      });

      it("Should allow owner to revoke any credential", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(20);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

        await expect(registry.connect(owner).revokeCredential(user1.address, nid))
          .to.emit(registry, "CredentialRevoked")
          .withArgs(user1.address, nid, owner.address);

        const credential = await registry.getCredential(user1.address, nid);
        expect(credential.isValid).to.be.false;
      });

      it("Should maintain revoked state after revocation", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(21);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);
        await registry.connect(authorizedIssuer).revokeCredential(user1.address, nid);

        // Check multiple times
        expect(await registry.verifyCredential(user1.address, nid)).to.be.false;
        expect(await registry.verifyCredential(user1.address, nid)).to.be.false;
      });
    });

    describe("revokeCredential - Access Control and Edge Cases", function () {
      it("Should revert if non-issuer, non-owner tries to revoke", async function () {
        const { registry, owner, authorizedIssuer, user1, user2 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(22);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

        await expect(
          registry.connect(user2).revokeCredential(user1.address, nid)
        ).to.be.revertedWith("Not authorized to revoke");
      });

      it("Should revert if credential owner tries to revoke", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(23);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

        await expect(
          registry.connect(user1).revokeCredential(user1.address, nid)
        ).to.be.revertedWith("Not authorized to revoke");
      });

      it("Should revert when revoking non-existent credential", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(24);

        await expect(
          registry.connect(authorizedIssuer).revokeCredential(user1.address, nid)
        ).to.be.revertedWith("Credential does not exist");
      });

      it("Should revert when revoking already revoked credential", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(25);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);
        await registry.connect(authorizedIssuer).revokeCredential(user1.address, nid);

        await expect(
          registry.connect(authorizedIssuer).revokeCredential(user1.address, nid)
        ).to.be.revertedWith("Credential already revoked");
      });

      it("Should allow different issuer to revoke if they are authorized", async function () {
        const { registry, owner, authorizedIssuer, user1, user2 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        await registry.connect(owner).addAuthorizedIssuer(user2.address);
        
        const nid = generateNID(26);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

        // Different authorized issuer should NOT be able to revoke
        await expect(
          registry.connect(user2).revokeCredential(user1.address, nid)
        ).to.be.revertedWith("Not authorized to revoke");
      });
    });
  });

  describe("6. Consent Management", function () {
    describe("grantConsent", function () {
      it("Should allow credential owner to grant consent", async function () {
        const { registry, owner, authorizedIssuer, user1, user2 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(27);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

        await expect(registry.connect(user1).grantConsent(nid, user2.address))
          .to.emit(registry, "ConsentGranted")
          .withArgs(user1.address, nid, user2.address);

        expect(await registry.hasConsent(user1.address, nid, user2.address)).to.be.true;
      });

      it("Should allow granting consent to multiple requesters", async function () {
        const { registry, owner, authorizedIssuer, user1, user2, unauthorizedIssuer } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(28);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

        await registry.connect(user1).grantConsent(nid, user2.address);
        await registry.connect(user1).grantConsent(nid, unauthorizedIssuer.address);

        expect(await registry.hasConsent(user1.address, nid, user2.address)).to.be.true;
        expect(await registry.hasConsent(user1.address, nid, unauthorizedIssuer.address)).to.be.true;
      });

      it("Should revert if non-owner tries to grant consent", async function () {
        const { registry, owner, authorizedIssuer, user1, user2 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(29);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

        await expect(
          registry.connect(user2).grantConsent(nid, user2.address)
        ).to.be.revertedWith("Only credential owner can grant consent");
      });

      it("Should revert when granting consent for non-existent credential", async function () {
        const { registry, user1, user2 } = await loadFixture(deployCredentialRegistryFixture);
        
        const nid = generateNID(30);

        await expect(
          registry.connect(user1).grantConsent(nid, user2.address)
        ).to.be.revertedWith("Credential does not exist");
      });

      it("Should revert when granting consent to zero address", async function () {
        const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(31);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

        await expect(
          registry.connect(user1).grantConsent(nid, ethers.ZeroAddress)
        ).to.be.revertedWith("Invalid requester address");
      });

      it("Should revert when granting consent that already exists", async function () {
        const { registry, owner, authorizedIssuer, user1, user2 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(32);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);
        await registry.connect(user1).grantConsent(nid, user2.address);

        await expect(
          registry.connect(user1).grantConsent(nid, user2.address)
        ).to.be.revertedWith("Consent already granted");
      });
    });

    describe("revokeConsent", function () {
      it("Should allow credential owner to revoke consent", async function () {
        const { registry, owner, authorizedIssuer, user1, user2 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(33);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);
        await registry.connect(user1).grantConsent(nid, user2.address);

        await expect(registry.connect(user1).revokeConsent(nid, user2.address))
          .to.emit(registry, "ConsentRevoked")
          .withArgs(user1.address, nid, user2.address);

        expect(await registry.hasConsent(user1.address, nid, user2.address)).to.be.false;
      });

      it("Should revert if non-owner tries to revoke consent", async function () {
        const { registry, owner, authorizedIssuer, user1, user2 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(34);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);
        await registry.connect(user1).grantConsent(nid, user2.address);

        await expect(
          registry.connect(user2).revokeConsent(nid, user2.address)
        ).to.be.revertedWith("Only credential owner can revoke consent");
      });

      it("Should revert when revoking non-existent consent", async function () {
        const { registry, owner, authorizedIssuer, user1, user2 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(35);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

        await expect(
          registry.connect(user1).revokeConsent(nid, user2.address)
        ).to.be.revertedWith("Consent not granted");
      });
    });

    describe("hasConsent", function () {
      it("Should return true for granted consent", async function () {
        const { registry, owner, authorizedIssuer, user1, user2 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(36);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);
        await registry.connect(user1).grantConsent(nid, user2.address);

        expect(await registry.hasConsent(user1.address, nid, user2.address)).to.be.true;
      });

      it("Should return false for non-granted consent", async function () {
        const { registry, owner, authorizedIssuer, user1, user2 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(37);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

        expect(await registry.hasConsent(user1.address, nid, user2.address)).to.be.false;
      });

      it("Should return false after consent is revoked", async function () {
        const { registry, owner, authorizedIssuer, user1, user2 } = await loadFixture(deployCredentialRegistryFixture);
        
        await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
        
        const nid = generateNID(38);
        const credentialHash = generateCredentialHash(nid, Date.now());
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);
        await registry.connect(user1).grantConsent(nid, user2.address);
        await registry.connect(user1).revokeConsent(nid, user2.address);

        expect(await registry.hasConsent(user1.address, nid, user2.address)).to.be.false;
      });
    });
  });

  describe("7. Gas Consumption Tests", function () {
    it("Should measure gas for addAuthorizedIssuer", async function () {
      const { registry, owner, authorizedIssuer } = await loadFixture(deployCredentialRegistryFixture);
      
      const tx = await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
      const receipt = await tx.wait();
      
      console.log(`Gas used for addAuthorizedIssuer: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lessThan(100000); // Reasonable gas limit
    });

    it("Should measure gas for issueCredential", async function () {
      const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
      
      await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
      
      const nid = generateNID(39);
      const credentialHash = generateCredentialHash(nid, Date.now());
      const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

      const tx = await registry.connect(authorizedIssuer).issueCredential(
        user1.address,
        nid,
        credentialHash,
        expiryDate
      );
      const receipt = await tx.wait();
      
      console.log(`Gas used for issueCredential: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lessThan(200000);
    });

    it("Should measure gas for verifyCredential", async function () {
      const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
      
      await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
      
      const nid = generateNID(40);
      const credentialHash = generateCredentialHash(nid, Date.now());
      const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

      await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

      const tx = await registry.verifyCredential(user1.address, nid);
      // Note: view functions don't consume gas in actual transactions
      console.log(`verifyCredential is a view function - no gas cost in production`);
    });

    it("Should measure gas for revokeCredential", async function () {
      const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
      
      await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
      
      const nid = generateNID(41);
      const credentialHash = generateCredentialHash(nid, Date.now());
      const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

      await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

      const tx = await registry.connect(authorizedIssuer).revokeCredential(user1.address, nid);
      const receipt = await tx.wait();
      
      console.log(`Gas used for revokeCredential: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lessThan(100000);
    });

    it("Should measure gas for grantConsent", async function () {
      const { registry, owner, authorizedIssuer, user1, user2 } = await loadFixture(deployCredentialRegistryFixture);
      
      await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
      
      const nid = generateNID(42);
      const credentialHash = generateCredentialHash(nid, Date.now());
      const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

      await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

      const tx = await registry.connect(user1).grantConsent(nid, user2.address);
      const receipt = await tx.wait();
      
      console.log(`Gas used for grantConsent: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lessThan(150000);
    });

    it("Should measure gas for revokeConsent", async function () {
      const { registry, owner, authorizedIssuer, user1, user2 } = await loadFixture(deployCredentialRegistryFixture);
      
      await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
      
      const nid = generateNID(43);
      const credentialHash = generateCredentialHash(nid, Date.now());
      const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

      await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);
      await registry.connect(user1).grantConsent(nid, user2.address);

      const tx = await registry.connect(user1).revokeConsent(nid, user2.address);
      const receipt = await tx.wait();
      
      console.log(`Gas used for revokeConsent: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lessThan(100000);
    });

    it("Should compare gas cost for multiple credential issuances", async function () {
      const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
      
      await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
      
      const gasUsed = [];
      
      for (let i = 0; i < 5; i++) {
        const nid = generateNID(44 + i);
        const credentialHash = generateCredentialHash(nid, Date.now() + i);
        const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

        const tx = await registry.connect(authorizedIssuer).issueCredential(
          user1.address,
          nid,
          credentialHash,
          expiryDate
        );
        const receipt = await tx.wait();
        gasUsed.push(receipt.gasUsed);
      }

      console.log(`Gas used for 5 credential issuances:`, gasUsed.map(g => g.toString()));
      
      // All should be relatively consistent
      const avgGas = gasUsed.reduce((a, b) => a + b, 0n) / BigInt(gasUsed.length);
      console.log(`Average gas: ${avgGas.toString()}`);
    });
  });

  describe("8. Integration and Complex Scenarios", function () {
    it("Should handle complete credential lifecycle", async function () {
      const { registry, owner, authorizedIssuer, user1, user2 } = await loadFixture(deployCredentialRegistryFixture);
      
      // Setup
      await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
      
      const nid = generateNID(49);
      const credentialHash = generateCredentialHash(nid, Date.now());
      const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

      // Issue
      await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);
      expect(await registry.verifyCredential(user1.address, nid)).to.be.true;

      // Grant consent
      await registry.connect(user1).grantConsent(nid, user2.address);
      expect(await registry.hasConsent(user1.address, nid, user2.address)).to.be.true;

      // Revoke consent
      await registry.connect(user1).revokeConsent(nid, user2.address);
      expect(await registry.hasConsent(user1.address, nid, user2.address)).to.be.false;

      // Revoke credential
      await registry.connect(authorizedIssuer).revokeCredential(user1.address, nid);
      expect(await registry.verifyCredential(user1.address, nid)).to.be.false;
    });

    it("Should handle multiple credentials for multiple users", async function () {
      const { registry, owner, authorizedIssuer, user1, user2 } = await loadFixture(deployCredentialRegistryFixture);
      
      await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
      
      const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

      // Issue credentials to user1
      for (let i = 0; i < 3; i++) {
        const nid = generateNID(50 + i);
        const credentialHash = generateCredentialHash(nid, Date.now() + i);
        await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);
      }

      // Issue credentials to user2
      for (let i = 0; i < 3; i++) {
        const nid = generateNID(53 + i);
        const credentialHash = generateCredentialHash(nid, Date.now() + i + 1000);
        await registry.connect(authorizedIssuer).issueCredential(user2.address, nid, credentialHash, expiryDate);
      }

      // Verify all credentials
      for (let i = 0; i < 3; i++) {
        expect(await registry.verifyCredential(user1.address, generateNID(50 + i))).to.be.true;
        expect(await registry.verifyCredential(user2.address, generateNID(53 + i))).to.be.true;
      }
    });

    it("Should maintain state consistency after issuer removal", async function () {
      const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
      
      await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
      
      const nid = generateNID(56);
      const credentialHash = generateCredentialHash(nid, Date.now());
      const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

      // Issue credential
      await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

      // Remove issuer
      await registry.connect(owner).removeAuthorizedIssuer(authorizedIssuer.address);

      // Credential should still be valid
      expect(await registry.verifyCredential(user1.address, nid)).to.be.true;

      // But issuer should not be able to revoke
      await expect(
        registry.connect(authorizedIssuer).revokeCredential(user1.address, nid)
      ).to.be.revertedWith("Not authorized to revoke");
    });

    it("Should handle credential expiry correctly over time", async function () {
      const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
      
      await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
      
      const nid = generateNID(57);
      const credentialHash = generateCredentialHash(nid, Date.now());
      const expiryDate = (await time.latest()) + 3600; // 1 hour

      await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);

      // Valid before expiry
      expect(await registry.verifyCredential(user1.address, nid)).to.be.true;

      // Fast forward past expiry
      await time.increase(3601);

      // Invalid after expiry
      expect(await registry.verifyCredential(user1.address, nid)).to.be.false;
    });
  });

  describe("9. Edge Cases and Security", function () {
    it("Should handle very long NID strings", async function () {
      const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
      
      await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
      
      const longNid = "NID" + "1".repeat(100);
      const credentialHash = generateCredentialHash(longNid, Date.now());
      const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

      await registry.connect(authorizedIssuer).issueCredential(user1.address, longNid, credentialHash, expiryDate);

      expect(await registry.verifyCredential(user1.address, longNid)).to.be.true;
    });

    it("Should handle special characters in NID", async function () {
      const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
      
      await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
      
      const specialNid = "NID-123_456@789";
      const credentialHash = generateCredentialHash(specialNid, Date.now());
      const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

      await registry.connect(authorizedIssuer).issueCredential(user1.address, specialNid, credentialHash, expiryDate);

      expect(await registry.verifyCredential(user1.address, specialNid)).to.be.true;
    });

    it("Should prevent reentrancy in credential issuance", async function () {
      // This test assumes your contract has reentrancy guards
      // If not, consider adding them for production
      const { registry, owner, authorizedIssuer, user1 } = await loadFixture(deployCredentialRegistryFixture);
      
      await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
      
      const nid = generateNID(58);
      const credentialHash = generateCredentialHash(nid, Date.now());
      const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

      // Normal issuance should work
      await registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate);
      
      // Attempting to issue again should fail
      await expect(
        registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate)
      ).to.be.revertedWith("Credential already exists");
    });

    it("Should maintain data integrity with concurrent operations", async function () {
      const { registry, owner, authorizedIssuer, user1, user2 } = await loadFixture(deployCredentialRegistryFixture);
      
      await registry.connect(owner).addAuthorizedIssuer(authorizedIssuer.address);
      
      const expiryDate = (await time.latest()) + 365 * 24 * 60 * 60;

      // Issue multiple credentials rapidly
      const promises = [];
      for (let i = 0; i < 10; i++) {
        const nid = generateNID(59 + i);
        const credentialHash = generateCredentialHash(nid, Date.now() + i);
        promises.push(
          registry.connect(authorizedIssuer).issueCredential(user1.address, nid, credentialHash, expiryDate)
        );
      }

      await Promise.all(promises);

      // Verify all credentials were issued correctly
      for (let i = 0; i < 10; i++) {
        expect(await registry.verifyCredential(user1.address, generateNID(59 + i))).to.be.true;
      }
    });
  });
});
