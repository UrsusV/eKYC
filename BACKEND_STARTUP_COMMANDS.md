# eKYC Backend - Startup Commands Quick Reference

## 🚀 Quick Start (Copy-Paste Ready)

### Option 1: Full Stack with Blockchain (Recommended for Complete Testing)

Open **4 separate terminals** and run these commands:

#### Terminal 1: Docker Services (MongoDB + Redis)
```bash
cd /home/ursus/projects/eKYC/eKYC
docker-compose up -d
```

**Verify services are running:**
```bash
docker ps
```

**Expected output:** 4 containers running (mongodb, redis, mongo-express, redis-commander)

**Management URLs:**
- MongoDB Express: http://localhost:8081
- Redis Commander: http://localhost:8082

---

#### Terminal 2: Hardhat Blockchain Node (Optional but recommended)
```bash
cd /home/ursus/projects/eKYC/eKYC/blockchain
npm install  # First time only
npm run node
```

**Keep this terminal running**

**Expected output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

**Available test accounts with private keys will be displayed**

---

#### Terminal 3: Deploy Smart Contracts (Run after Terminal 2 starts)
```bash
cd /home/ursus/projects/eKYC/eKYC/blockchain
npm run deploy:local
```

**Expected output:**
```
CredentialRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Important:** Copy the contract address and update `backend/.env`:
```bash
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

---

#### Terminal 4: Backend Server
```bash
cd /home/ursus/projects/eKYC/eKYC/backend
npm install  # First time only

# Copy environment file (first time only)
cp .env.example .env

# Edit .env and ensure CONTRACT_ADDRESS is set (from Terminal 3)
nano .env  # or use your preferred editor

# Start backend
npm run dev
```

**Expected output:**
```
Server running on port 5000
MongoDB connected
Redis connected
```

**Backend will be available at:** http://localhost:5000

---

### Option 2: Backend Only (Without Blockchain)

Use this if you only want to test authentication, KYC submission, and basic features (without credential issuance).

#### Terminal 1: Docker Services
```bash
cd /home/ursus/projects/eKYC/eKYC
docker-compose up -d
```

#### Terminal 2: Backend Server
```bash
cd /home/ursus/projects/eKYC/eKYC/backend
npm install  # First time only
cp .env.example .env  # First time only
npm run dev
```

**Note:** Credential issuance will fail without blockchain, but all other endpoints will work.

---

## 🧪 Testing Commands

### Run Demo Script (Test Complete Flow)

**Prerequisites:** Backend must be running (Terminal 4)

```bash
# New terminal
cd /home/ursus/projects/eKYC/eKYC
npm run demo
```

**What it does:**
1. ✅ Registers a customer
2. ✅ Submits KYC request
3. ✅ Registers a bank officer
4. ✅ Bank officer approves KYC
5. ✅ Issues blockchain credential (if blockchain is running)
6. ✅ Retrieves credential

---

### Run Backend Tests

```bash
cd /home/ursus/projects/eKYC/eKYC/backend

# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests (requires Docker services)
npm run test:e2e

# With coverage report
npm test -- --coverage

# Watch mode (auto-rerun on file changes)
npm run test:watch
```

---

### Run Blockchain Tests

```bash
cd /home/ursus/projects/eKYC/eKYC/blockchain

# All blockchain tests
npm test

# With gas reporting
npm run test:gas

# With coverage
npm run test:coverage
```

---

## 🔍 Verification Commands

### Check Backend Health

```bash
curl http://localhost:5000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-29T...",
  "uptime": 123.456
}
```

---

### Check API Endpoint

```bash
curl http://localhost:5000/api/v1/
```

**Expected response:**
```json
{
  "message": "eKYC Blockchain API",
  "version": "v1",
  "status": "running"
}
```

---

### Test Customer Registration

```bash
curl -X POST http://localhost:5000/api/v1/auth/register/customer \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@12345",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890"
  }'
```

---

### Check Docker Services

```bash
# List running containers
docker ps

# Check MongoDB logs
docker logs ekyc-mongodb

# Check Redis logs
docker logs ekyc-redis

# Check backend logs (if using Docker)
docker logs ekyc-backend
```

---

## 🛠️ Management Commands

### Docker Services

```bash
# Start all services
cd /home/ursus/projects/eKYC/eKYC
docker-compose up -d

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Stop and remove all data (⚠️ Warning: Deletes all data)
docker-compose down -v
```

---

### MongoDB Management

**Via MongoDB Express:** http://localhost:8081
- Username: `admin`
- Password: `eKYC_Admin_2025`

**Via Command Line:**
```bash
# Connect to MongoDB
docker exec -it ekyc-mongodb mongosh -u admin -p eKYC_Admin_2025 --authenticationDatabase admin

# Inside MongoDB shell:
show dbs
use ekyc_db
show collections
db.users.find().pretty()
exit
```

---

### Redis Management

**Via Redis Commander:** http://localhost:8082

**Via Command Line:**
```bash
# Connect to Redis
docker exec -it ekyc-redis redis-cli

# Authenticate
AUTH eKYC_Redis_2025

# Redis commands:
KEYS *
GET user:123
DEL user:123
FLUSHALL  # ⚠️ Warning: Clears all data
exit
```

---

### Backend Server Management

#### Development Mode (Auto-restart on changes)
```bash
cd /home/ursus/projects/eKYC/eKYC/backend
npm run dev
```

#### Production Mode
```bash
cd /home/ursus/projects/eKYC/eKYC/backend
npm start
```

#### Using PM2 (Process Manager)
```bash
# Install PM2 globally (first time only)
npm install -g pm2

# Start backend with PM2
cd /home/ursus/projects/eKYC/eKYC/backend
pm2 start src/server.js --name ekyc-backend

# View status
pm2 status

# Monitor logs in real-time
pm2 logs ekyc-backend

# Monitor CPU/Memory
pm2 monit

# Restart
pm2 restart ekyc-backend

# Stop
pm2 stop ekyc-backend

# Delete from PM2
pm2 delete ekyc-backend

# Save PM2 process list (survives reboot)
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

---

### Hardhat Blockchain Management

```bash
cd /home/ursus/projects/eKYC/eKYC/blockchain

# Start local node
npm run node

# Deploy contracts (in new terminal)
npm run deploy:local

# Run Hardhat console
npm run console:local

# Clean compiled contracts
npm run clean

# Compile contracts
npm run compile

# Flatten contract (for verification)
npm run flatten
```

---

## 🗄️ Database Seeding & Migration

### Seed Database with Test Data

```bash
cd /home/ursus/projects/eKYC/eKYC/backend
npm run seed
```

### Run Database Migrations

```bash
cd /home/ursus/projects/eKYC/eKYC/backend
npm run migrate
```

---

## 🧹 Cleanup Commands

### Stop Everything

```bash
# Stop Docker services
cd /home/ursus/projects/eKYC/eKYC
docker-compose down

# Stop PM2 (if using)
pm2 stop all

# Stop Hardhat node (Ctrl+C in Terminal 2)
```

---

### Clear All Data (⚠️ Warning: Destructive)

```bash
# Remove Docker volumes (deletes MongoDB and Redis data)
cd /home/ursus/projects/eKYC/eKYC
docker-compose down -v

# Clear backend logs
cd backend
rm -rf logs/*

# Clear uploaded files
rm -rf uploads/*

# Clear node_modules (to reinstall fresh)
rm -rf node_modules
rm -rf blockchain/node_modules
npm install
cd blockchain && npm install
```

---

## 📋 Environment Setup Checklist

### First-Time Setup

- [ ] Install Node.js (v18.0.0+)
- [ ] Install Docker & Docker Compose
- [ ] Install npm (v9.0.0+)
- [ ] Clone repository
- [ ] Install backend dependencies: `cd backend && npm install`
- [ ] Install blockchain dependencies: `cd blockchain && npm install`
- [ ] Copy environment file: `cp backend/.env.example backend/.env`
- [ ] Edit `backend/.env` with your configuration
- [ ] Start Docker services: `docker-compose up -d`
- [ ] Verify Docker services: `docker ps`

### Before Each Development Session

- [ ] Start Docker services: `docker-compose up -d`
- [ ] (Optional) Start Hardhat node: `cd blockchain && npm run node`
- [ ] (Optional) Deploy contracts: `cd blockchain && npm run deploy:local`
- [ ] Start backend: `cd backend && npm run dev`
- [ ] Verify backend health: `curl http://localhost:5000/health`

---

## 🔧 Troubleshooting Commands

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000
# or
netstat -tuln | grep 5000

# Kill process
kill -9 <PID>
```

---

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
docker ps | grep mongo

# Check MongoDB logs
docker logs ekyc-mongodb

# Restart MongoDB
docker restart ekyc-mongodb

# Connect manually to test
docker exec -it ekyc-mongodb mongosh -u admin -p eKYC_Admin_2025 --authenticationDatabase admin
```

---

### Redis Connection Issues

```bash
# Check if Redis is running
docker ps | grep redis

# Check Redis logs
docker logs ekyc-redis

# Restart Redis
docker restart ekyc-redis

# Test connection
docker exec -it ekyc-redis redis-cli
AUTH eKYC_Redis_2025
PING
```

---

### Blockchain Connection Issues

```bash
# Check if Hardhat node is running
curl http://localhost:8545
# or
nc -zv localhost 8545

# Check if contract is deployed
cd blockchain
npx hardhat console --network localhost
# In console:
const contract = await ethers.getContractAt("CredentialRegistry", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
await contract.admin();
```

---

### Clear Node Modules and Reinstall

```bash
# Backend
cd /home/ursus/projects/eKYC/eKYC/backend
rm -rf node_modules package-lock.json
npm install

# Blockchain
cd /home/ursus/projects/eKYC/eKYC/blockchain
rm -rf node_modules package-lock.json
npm install

# Root (for demo script)
cd /home/ursus/projects/eKYC/eKYC
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Monitoring Commands

### View Backend Logs

```bash
# Real-time logs (development mode)
cd /home/ursus/projects/eKYC/eKYC/backend
npm run dev

# View log files
tail -f logs/combined.log
tail -f logs/error.log

# PM2 logs (if using PM2)
pm2 logs ekyc-backend
pm2 logs ekyc-backend --lines 100
```

---

### Monitor System Resources

```bash
# Docker container stats
docker stats

# PM2 monitoring (if using PM2)
pm2 monit

# System resources
top
htop  # if installed
```

---

## 🎯 Quick Reference Card

### Most Common Commands

```bash
# Start everything
docker-compose up -d                    # Terminal 1
cd blockchain && npm run node           # Terminal 2
cd blockchain && npm run deploy:local   # Terminal 3
cd backend && npm run dev               # Terminal 4

# Test
npm run demo                            # From root directory
cd backend && npm test                  # All backend tests
cd blockchain && npm test               # All blockchain tests

# Check health
curl http://localhost:5000/health       # Backend health
docker ps                               # Docker services status

# Stop everything
docker-compose down                     # Stop Docker
pm2 stop all                           # Stop PM2 (if using)
# Ctrl+C in each terminal               # Stop node processes

# View logs
docker logs ekyc-mongodb               # MongoDB logs
docker logs ekyc-redis                 # Redis logs
pm2 logs ekyc-backend                  # Backend logs (PM2)
tail -f backend/logs/combined.log      # Backend logs (file)
```

---

## 🌐 Service URLs Reference

| Service | URL | Credentials |
|---------|-----|-------------|
| Backend API | http://localhost:5000 | - |
| API Docs | http://localhost:5000/api-docs | - |
| Health Check | http://localhost:5000/health | - |
| MongoDB Express | http://localhost:8081 | admin / eKYC_Admin_2025 |
| Redis Commander | http://localhost:8082 | - |
| Hardhat Node | http://localhost:8545 | - |

---

## 📝 Default Test Credentials

After running `npm run demo`, these test accounts are created:

**Customer:**
- Email: From demo script
- Password: From demo script

**Bank Officer:**
- Email: From demo script
- Password: From demo script

Create your own via API:
```bash
curl -X POST http://localhost:5000/api/v1/auth/register/customer \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"YourPass@123","firstName":"Your","lastName":"Name","phoneNumber":"+1234567890"}'
```

---

## 🆘 Support & Resources

**Documentation:**
- API Documentation: `backend/API_DOCUMENTATION.md`
- Frontend Guide: `FRONTEND_INTEGRATION_GUIDE.md`
- Technical Docs: `BACKEND_TECHNICAL_DOCUMENTATION.md`
- Testing Guide: `backend/E2E_TESTING_GUIDE.md`

**Quick Help:**
```bash
# View available npm scripts
cd backend && npm run

# View Hardhat tasks
cd blockchain && npx hardhat
```

---

**Last Updated:** November 29, 2024
**Version:** 1.0.0

---

## 💡 Pro Tips

1. **Keep Docker running** - It's easier than starting/stopping repeatedly
2. **Use PM2 for production** - Better process management and monitoring
3. **Monitor logs** - Watch for errors in real-time during development
4. **Use the demo script** - Fastest way to verify everything works
5. **Save your .env** - Don't commit it, but keep a secure backup
6. **Check health endpoint** - First thing to verify when troubleshooting
7. **Use separate terminals** - Easier to monitor each service
8. **Run tests regularly** - Catch issues early

---

## 🔐 Security Reminders

- ✅ **Never commit** `.env` file
- ✅ **Change default passwords** in production
- ✅ **Use strong JWT secrets** in production
- ✅ **Enable HTTPS** in production
- ✅ **Update CORS origins** for production
- ✅ **Rotate encryption keys** regularly
- ✅ **Backup MongoDB** before migrations
- ✅ **Monitor failed login attempts**

---

**Happy Coding! 🚀**
