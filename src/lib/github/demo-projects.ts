import { ProjectKnowledgeModel, RepositoryMetadata } from "../types";

export interface DemoProjectDef {
  metadata: RepositoryMetadata;
  knowledgeModel: ProjectKnowledgeModel;
  codeSnippetDemo: string;
}

export const DEMO_PROJECTS: DemoProjectDef[] = [
  {
    metadata: {
      id: "demo-apex-dex",
      name: "apex-dex-protocol",
      owner: "truthlens-labs",
      fullName: "truthlens-labs/apex-dex-protocol",
      description: "Decentralized AMM liquidity router with flash loan protection, dynamic fee hooks, and Chainlink oracle feeds on Polygon.",
      language: "Solidity",
      stars: 412,
      forks: 78,
      isPrivate: false,
      defaultBranch: "main",
      lastUpdated: "2026-08-15T14:30:00Z",
      url: "https://github.com/truthlens-labs/apex-dex-protocol",
      topics: ["defi", "solidity", "amm", "oracles", "polygon", "erc20", "flash-loans"],
    },
    codeSnippetDemo: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract ApexLiquidityRouter is ReentrancyGuard {
    AggregatorV3Interface internal priceFeed;
    uint256 public constant MAX_SLIPPAGE_BPS = 300; // 3%
    mapping(address => uint256) public liquidityShares;

    event SwapExecuted(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);

    constructor(address _oracleFeed) {
        priceFeed = AggregatorV3Interface(_oracleFeed);
    }

    function executeSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 deadline
    ) external nonReentrant returns (uint256 amountOut) {
        require(block.timestamp <= deadline, "Transaction expired");
        require(amountIn > 0, "Invalid input amount");

        // Chainlink Oracle freshness check
        (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();
        require(price > 0 && block.timestamp - updatedAt < 3600, "Stale price feed");

        // Swap execution & invariant check
        amountOut = calculateOutputAmount(tokenIn, tokenOut, amountIn, uint256(price));
        require(amountOut >= minAmountOut, "Slippage limit exceeded");

        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
        return amountOut;
    }
}`,
    knowledgeModel: {
      projectId: "demo-apex-dex",
      projectName: "apex-dex-protocol",
      repositoryUrl: "https://github.com/truthlens-labs/apex-dex-protocol",
      primaryLanguage: "Solidity",
      languages: [
        { name: "Solidity", percentage: 65 },
        { name: "TypeScript", percentage: 30 },
        { name: "Shell", percentage: 5 },
      ],
      frameworks: ["Hardhat", "Next.js", "Ethers.js", "OpenZeppelin"],
      technologies: ["Solidity", "Hardhat", "Chainlink Oracles", "Ethers.js v6", "Polygon", "Tailwind CSS"],
      dependencies: [
        { name: "@openzeppelin/contracts", version: "^5.0.0", category: "BLOCKCHAIN" },
        { name: "@chainlink/contracts", version: "^0.8.0", category: "BLOCKCHAIN" },
        { name: "ethers", version: "^6.13.0", category: "BLOCKCHAIN" },
        { name: "hardhat", version: "^2.22.0", category: "DEV" },
      ],
      architectureNodes: [
        {
          id: "node-frontend",
          name: "Next.js DeFi Swap Terminal",
          type: "FRONTEND",
          description: "Web3 wallet connected interface with real-time slippage & depth charts.",
          technologies: ["Next.js", "Tailwind CSS", "Ethers.js"],
          connections: ["node-blockchain", "node-oracle"],
        },
        {
          id: "node-blockchain",
          name: "ApexLiquidityRouter (Smart Contract)",
          type: "SMART_CONTRACT",
          description: "Reentrancy-guarded liquidity pools, non-custodial swaps, and fee distributions.",
          technologies: ["Solidity 0.8.24", "OpenZeppelin ReentrancyGuard"],
          connections: ["node-oracle"],
        },
        {
          id: "node-oracle",
          name: "Chainlink Decentralized Oracles",
          type: "EXTERNAL_SERVICE",
          description: "Cryptographic tamper-proof real-time price feeds with staleness thresholds.",
          technologies: ["Chainlink AggregatorV3"],
          connections: [],
        },
      ],
      apiEndpoints: [
        { method: "GET", path: "/api/pools/depth", handler: "Pool Liquidity Depth Reader", file: "src/app/api/pools/route.ts", isProtected: false },
        { method: "GET", path: "/api/oracle/price", handler: "Chainlink Aggregator Proxy", file: "src/app/api/oracle/route.ts", isProtected: false },
        { method: "POST", path: "/api/quote", handler: "Off-chain Slippage Simulator", file: "src/app/api/quote/route.ts", isProtected: false },
      ],
      databaseType: "EVM On-Chain State Storage",
      databaseSchemaSummary: "Permanent blockchain storage for LP share balances, pool reserves, and protocol fee parameters",
      authMethod: "Sign-In with Ethereum (SIWE / EIP-4361 Web3 Signature Auth)",
      externalServices: ["Chainlink Price Oracles", "Alchemy Polygon RPC", "PolygonScan Explorer"],
      aiComponents: [],
      smartContracts: ["ApexLiquidityRouter.sol", "DynamicFeeHook.sol", "FlashLoanProtection.sol"],
      importantFiles: [
        { path: "contracts/ApexLiquidityRouter.sol", purpose: "Core routing and swap execution contract", linesOfCode: 180 },
        { path: "contracts/hooks/DynamicFeeHook.sol", purpose: "Volatility-adjusted LP fee calculation hook", linesOfCode: 95 },
        { path: "src/lib/web3/swap-executor.ts", purpose: "Frontend client for transaction gas estimation and signing", linesOfCode: 140 },
      ],
      importantFunctions: [
        { name: "executeSwap", file: "contracts/ApexLiquidityRouter.sol", purpose: "Performs atomic swap with oracle freshness check and slippage guard", complexity: "HIGH", criticalLogic: "Reentrancy protection, oracle staleness validation, and token transfers" },
        { name: "calculateDynamicFee", file: "contracts/hooks/DynamicFeeHook.sol", purpose: "Calculates adaptive fee based on 10-block volatility moving average", complexity: "HIGH", criticalLogic: "Moving average standard deviation computation in integer math" },
      ],
      risks: [
        { severity: "HIGH", category: "SECURITY", title: "Oracle Front-Running / MEV Sandwiches", description: "Unchecked slippage tolerance allows MEV searchers to extract arbitrage value between oracle updates.", affectedComponent: "ApexLiquidityRouter.sol" },
        { severity: "MEDIUM", category: "RELIABILITY", title: "Chainlink L2 Sequencer Uptime Dependency", description: "If Polygon sequencer encounters a soft reorg, transactions may execute on stale tick data if grace period is not enforced.", affectedComponent: "Oracle Layer" },
      ],
      analyzedAt: "2026-08-26T20:00:00Z",
    },
  },
  {
    metadata: {
      id: "demo-neuromed-ai",
      name: "neuromed-agent-orchestrator",
      owner: "truthlens-labs",
      fullName: "truthlens-labs/neuromed-agent-orchestrator",
      description: "Clinical diagnostic assistant orchestrating LangChain multi-agent workflows, Pinecone vector RAG retrieval, and HIPAA-compliant JWT auth.",
      language: "Python",
      stars: 628,
      forks: 114,
      isPrivate: false,
      defaultBranch: "main",
      lastUpdated: "2026-08-22T09:15:00Z",
      url: "https://github.com/truthlens-labs/neuromed-agent-orchestrator",
      topics: ["ai", "python", "fastapi", "rag", "langchain", "pinecone", "medical-ai"],
    },
    codeSnippetDemo: `from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from langchain.chains import RetrievalQA
from langchain_community.vectorstores import Pinecone
import redis.asyncio as aioredis

app = FastAPI(title="NeuroMed Diagnostic Orchestrator")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")
redis_client = aioredis.from_url("redis://localhost:6379", decode_responses=True)

SECRET_KEY = "neuromed-secure-jwt-key"
ALGORITHM = "HS256"

async def verify_doctor_jwt(token: str = Depends(oauth2_scheme)):
    try:
        # Check token revocation in Redis blacklist
        is_revoked = await redis_client.get(f"revoked_token:{token}")
        if is_revoked:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

@app.post("/api/v1/diagnose/reason")
async def run_diagnostic_reasoning(case_data: dict, doctor=Depends(verify_doctor_jwt)):
    # Retrieve relevant clinical literature from Pinecone vector index
    patient_symptoms = case_data.get("symptoms", "")
    literature_context = await query_pinecone_vector_index(patient_symptoms)
    
    # Run multi-step differential diagnosis agent
    diagnostic_plan = await execute_agent_chain(literature_context, case_data)
    return {"status": "SUCCESS", "differential_diagnoses": diagnostic_plan}`,
    knowledgeModel: {
      projectId: "demo-neuromed-ai",
      projectName: "neuromed-agent-orchestrator",
      repositoryUrl: "https://github.com/truthlens-labs/neuromed-agent-orchestrator",
      primaryLanguage: "Python",
      languages: [
        { name: "Python", percentage: 78 },
        { name: "TypeScript (Next.js)", percentage: 18 },
        { name: "Docker", percentage: 4 },
      ],
      frameworks: ["FastAPI", "LangChain", "Next.js", "Pydantic"],
      technologies: ["FastAPI", "Python 3.11", "LangChain", "Pinecone", "Redis", "JWT Auth", "PostgreSQL"],
      dependencies: [
        { name: "fastapi", version: "^0.110.0", category: "BACKEND" },
        { name: "langchain", version: "^0.2.0", category: "AI_ML" },
        { name: "pinecone-client", version: "^3.2.0", category: "DATABASE" },
        { name: "redis", version: "^5.0.0", category: "DATABASE" },
        { name: "pyjwt", version: "^2.8.0", category: "SECURITY" },
      ],
      architectureNodes: [
        {
          id: "node-frontend",
          name: "Next.js Clinician Dashboard",
          type: "FRONTEND",
          description: "Responsive portal for submitting patient telemetry, symptoms, and reviewing differential reasoning.",
          technologies: ["Next.js", "Tailwind CSS", "Lucide React"],
          connections: ["node-auth", "node-api"],
        },
        {
          id: "node-auth",
          name: "JWT Auth & Redis Revocation Cache",
          type: "AUTH",
          description: "OAuth2 Password Flow with instantaneous Redis token revocation blacklisting.",
          technologies: ["PyJWT", "Redis Async"],
          connections: ["node-api"],
        },
        {
          id: "node-api",
          name: "FastAPI Diagnostic Pipeline",
          type: "BACKEND_API",
          description: "Asynchronous task orchestration, input sanitization, and LangChain coordinator.",
          technologies: ["FastAPI", "Pydantic v2", "Uvicorn"],
          connections: ["node-ai", "node-db"],
        },
        {
          id: "node-ai",
          name: "Pinecone RAG & Gemini/Claude Inference",
          type: "AI_MODEL",
          description: "Embeds clinical symptoms into 1536-dim vector space and synthesizes medical literature.",
          technologies: ["Pinecone Vector DB", "LangChain Agents", "LLM APIs"],
          connections: [],
        },
        {
          id: "node-db",
          name: "PostgreSQL Patient Record Database",
          type: "DATABASE",
          description: "Encrypted relational storage for audit logs, patient history, and diagnostic reports.",
          technologies: ["PostgreSQL 16", "SQLAlchemy Async"],
          connections: [],
        },
      ],
      apiEndpoints: [
        { method: "POST", path: "/api/v1/auth/login", handler: "Doctor Authentication & JWT Minting", file: "app/routers/auth.py", isProtected: false },
        { method: "POST", path: "/api/v1/diagnose/reason", handler: "Diagnostic RAG Reasoning Pipeline", file: "app/routers/diagnose.py", isProtected: true },
        { method: "GET", path: "/api/v1/cases/history", handler: "Audit History Retriever", file: "app/routers/cases.py", isProtected: true },
      ],
      databaseType: "Pinecone Vector Index + PostgreSQL",
      databaseSchemaSummary: "Pinecone dense vector space (cosine metric) + relational PostgreSQL schema with ACID encryption",
      authMethod: "JSON Web Tokens (JWT) with Redis Token Revocation & Role Hierarchy",
      externalServices: ["Pinecone Cloud", "Google Gemini API", "PubMed Open Access API"],
      aiComponents: ["LangChain RAG Pipeline", "Pinecone Vector Indexing", "Multi-Turn LLM Reasoning"],
      smartContracts: [],
      importantFiles: [
        { path: "app/routers/diagnose.py", purpose: "Entry point coordinating vector search and reasoning agents", linesOfCode: 210 },
        { path: "app/services/rag_engine.py", purpose: "Document chunking, embedding generation, and cosine similarity query", linesOfCode: 165 },
        { path: "app/core/security.py", purpose: "JWT signing, password hashing, and Redis revocation checks", linesOfCode: 110 },
      ],
      importantFunctions: [
        { name: "verify_doctor_jwt", file: "app/core/security.py", purpose: "Validates bearer token against cryptographic signature and Redis revocation list", complexity: "MEDIUM", criticalLogic: "Signature verification + async Redis cache lookup" },
        { name: "query_pinecone_vector_index", file: "app/services/rag_engine.py", purpose: "Embeds symptoms and queries top-k 5 medical journal contexts", complexity: "HIGH", criticalLogic: "Vector embedding transformation and similarity scoring" },
      ],
      risks: [
        { severity: "HIGH", category: "SECURITY", title: "Vector Hallucination & Prompt Injection Risk", description: "Unsanitized clinical notes could inject adversarial prompts into the LLM context, yielding erroneous differential diagnoses.", affectedComponent: "app/services/rag_engine.py" },
        { severity: "MEDIUM", category: "RELIABILITY", title: "Redis Cache Outage Cascading Latency", description: "If Redis fails, token revocation checks timeout, blocking authenticated doctor API requests.", affectedComponent: "app/core/security.py" },
      ],
      analyzedAt: "2026-08-26T21:00:00Z",
    },
  },
  {
    metadata: {
      id: "demo-sentinel-core",
      name: "sentinel-event-mesh",
      owner: "truthlens-labs",
      fullName: "truthlens-labs/sentinel-event-mesh",
      description: "Distributed real-time financial transaction fraud detection mesh processing 50k events/sec with Go, Kafka, and Redis.",
      language: "Go",
      stars: 340,
      forks: 52,
      isPrivate: false,
      defaultBranch: "main",
      lastUpdated: "2026-08-18T18:45:00Z",
      url: "https://github.com/truthlens-labs/sentinel-event-mesh",
      topics: ["go", "golang", "kafka", "distributed-systems", "concurrency", "fraud-detection"],
    },
    codeSnippetDemo: `package main

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"
	"github.com/segmentio/kafka-go"
	"github.com/redis/go-redis/v9"
)

type TransactionEvent struct {
	ID        string    \`json:"id"\`
	UserID    string    \`json:"user_id"\`
	Amount    float64   \`json:"amount"\`
	Location  string    \`json:"location"\`
	Timestamp time.Time \`json:"timestamp"\`
}

type FraudDetector struct {
	rdb         *redis.Client
	kafkaReader *kafka.Reader
	workerPool  chan struct{}
}

func (fd *FraudDetector) ProcessEvent(ctx context.Context, event TransactionEvent) (bool, string) {
	// Sliding window velocity check in Redis
	userKey := fmt.Sprintf("txn_velocity:%s", event.UserID)
	count, err := fd.rdb.Incr(ctx, userKey).Result()
	if err == nil && count == 1 {
		fd.rdb.Expire(ctx, userKey, 60*time.Second)
	}

	if count > 15 {
		return true, "High transaction velocity exceeding 15 txns/min"
	}
	return false, "Normal"
}`,
    knowledgeModel: {
      projectId: "demo-sentinel-core",
      projectName: "sentinel-event-mesh",
      repositoryUrl: "https://github.com/truthlens-labs/sentinel-event-mesh",
      primaryLanguage: "Go",
      languages: [
        { name: "Go", percentage: 82 },
        { name: "Docker", percentage: 10 },
        { name: "Makefile", percentage: 8 },
      ],
      frameworks: ["Go stdlib", "Kafka-Go", "Chi Router"],
      technologies: ["Go 1.22", "Apache Kafka", "Redis Cluster", "PostgreSQL", "Prometheus", "Docker"],
      dependencies: [
        { name: "github.com/segmentio/kafka-go", version: "v0.4.47", category: "BACKEND" },
        { name: "github.com/redis/go-redis/v9", version: "v9.5.1", category: "DATABASE" },
        { name: "github.com/go-chi/chi/v5", version: "v5.0.12", category: "BACKEND" },
      ],
      architectureNodes: [
        {
          id: "node-producer",
          name: "Payment Gateway Ingestion API",
          type: "BACKEND_API",
          description: "High-concurrency Go HTTP gateway accepting and buffering 50k tx/sec.",
          technologies: ["Go Chi Router", "JSON Streaming"],
          connections: ["node-kafka"],
        },
        {
          id: "node-kafka",
          name: "Kafka Partitioned Event Bus",
          type: "QUEUE",
          description: "Distributed message broker with 12 consumer partitions keyed by UserID.",
          technologies: ["Apache Kafka", "Segmentio Go-Kafka"],
          connections: ["node-worker"],
        },
        {
          id: "node-worker",
          name: "Concurrent Fraud Evaluation Worker Pool",
          type: "BACKEND_API",
          description: "Goroutine worker pool executing sliding-window velocity algorithms.",
          technologies: ["Go Goroutines", "sync.WaitGroup", "Atomic Counters"],
          connections: ["node-redis", "node-db"],
        },
        {
          id: "node-redis",
          name: "Redis Cluster Velocity Cache",
          type: "CACHE",
          description: "In-memory sliding window counters and rapid blacklist lookups.",
          technologies: ["Redis 7.2 Cluster", "Pipelined Commands"],
          connections: [],
        },
        {
          id: "node-db",
          name: "PostgreSQL Fraud Audit Store",
          type: "DATABASE",
          description: "Durable storage for flagged transactions and manual compliance reviews.",
          technologies: ["PostgreSQL 16", "TimescaleDB"],
          connections: [],
        },
      ],
      apiEndpoints: [
        { method: "POST", path: "/v1/transactions/ingest", handler: "Transaction Stream Ingestor", file: "cmd/gateway/main.go", isProtected: true },
        { method: "GET", path: "/v1/fraud/alerts", handler: "Real-Time WebSocket & SSE Alert Feed", file: "cmd/alerts/main.go", isProtected: true },
        { method: "GET", path: "/healthz", handler: "Prometheus Metrics & Health Probe", file: "cmd/gateway/main.go", isProtected: false },
      ],
      databaseType: "Redis Cluster + PostgreSQL / TimescaleDB",
      databaseSchemaSummary: "In-memory key-value velocity windows + time-series transaction partitions",
      authMethod: "mTLS + HMAC-SHA256 Signed Gateway Tokens",
      externalServices: ["Prometheus Metrics Exporter", "PagerDuty Alert Manager"],
      aiComponents: [],
      smartContracts: [],
      importantFiles: [
        { path: "pkg/detector/engine.go", purpose: "Sliding-window velocity and anomaly evaluation logic", linesOfCode: 240 },
        { path: "pkg/consumer/worker_pool.go", purpose: "Kafka partition consumer balancing goroutines with context cancellation", linesOfCode: 195 },
      ],
      importantFunctions: [
        { name: "ProcessEvent", file: "pkg/detector/engine.go", purpose: "Calculates transaction velocity and evaluates fraud thresholds in Redis", complexity: "HIGH", criticalLogic: "Atomic increment with conditional expiration and threshold comparison" },
      ],
      risks: [
        { severity: "HIGH", category: "PERFORMANCE", title: "Kafka Partition Skew & Head-of-Line Blocking", description: "Hot UserIDs publishing thousands of transactions to a single partition can cause worker lag behind other partitions.", affectedComponent: "pkg/consumer/worker_pool.go" },
        { severity: "MEDIUM", category: "RELIABILITY", title: "Redis Atomic Race on Expiration", description: "If connection drops between INCR and EXPIRE, keys could persist indefinitely without eviction.", affectedComponent: "pkg/detector/engine.go" },
      ],
      analyzedAt: "2026-08-26T19:30:00Z",
    },
  },
];
