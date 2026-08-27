import {
  ProjectKnowledgeModel,
  ArchitectureNode,
  DependencyItem,
  ApiEndpoint,
  ImportantFunction,
  RiskItem,
} from "../types";

export interface RawRepoFile {
  path: string;
  content: string;
  size?: number;
}

/**
 * Static Repository & Code Analyzer Engine
 * Parses files, dependencies, frameworks, APIs, databases, auth patterns, and security risks
 * to construct a high-fidelity ProjectKnowledgeModel for adaptive assessment.
 */
export class ProjectAnalyzer {
  public static analyzeProject(
    projectName: string,
    repositoryUrl: string,
    rawFiles: RawRepoFile[]
  ): ProjectKnowledgeModel {
    // 1. Sanitize & filter relevant files (ignore binaries, huge blobs, locks, sourcemaps)
    const files = rawFiles
      .filter((f) => {
        const p = f.path.toLowerCase();
        if (
          p.includes("node_modules/") ||
          p.includes(".git/") ||
          p.includes(".next/") ||
          p.includes("dist/") ||
          p.includes("build/") ||
          p.includes("coverage/") ||
          p.endsWith(".lock") ||
          p.endsWith("-lock.json") ||
          p.endsWith(".map") ||
          p.endsWith(".png") ||
          p.endsWith(".jpg") ||
          p.endsWith(".jpeg") ||
          p.endsWith(".svg") ||
          p.endsWith(".ico") ||
          p.endsWith(".webp") ||
          p.endsWith(".woff") ||
          p.endsWith(".woff2") ||
          p.endsWith(".ttf")
        ) {
          return false;
        }
        return true;
      })
      .map((f) => ({
        path: f.path,
        content: f.content.length > 50000 ? f.content.slice(0, 50000) : f.content,
        size: f.size || f.content.length,
      }));

    const filePaths = files.map((f) => f.path);
    const languages = this.detectLanguages(files);
    const dependencies = this.extractDependencies(files);
    const frameworks = this.detectFrameworks(filePaths, dependencies);
    const databaseInfo = this.detectDatabase(files, dependencies);
    const authMethod = this.detectAuthentication(files, dependencies);
    const apiEndpoints = this.extractApiEndpoints(files);
    const importantFunctions = this.identifyImportantFunctions(files);
    const risks = this.identifySecurityAndArchitectureRisks(files, dependencies, authMethod);
    const architectureNodes = this.synthesizeArchitectureDAG(
      projectName,
      frameworks,
      databaseInfo,
      authMethod,
      apiEndpoints,
      dependencies
    );

    const importantFiles = files
      .filter((f) => {
        const p = f.path.toLowerCase();
        return (
          p.includes("auth") ||
          p.includes("router") ||
          p.includes("contract") ||
          p.includes("controller") ||
          p.includes("api") ||
          p.includes("service") ||
          p.includes("model") ||
          p.endsWith(".sol") ||
          p.endsWith("app.py") ||
          p.endsWith("server.ts") ||
          p.endsWith("index.ts")
        );
      })
      .slice(0, 10)
      .map((f) => ({
        path: f.path,
        purpose: this.inferFilePurpose(f.path),
        linesOfCode: f.content.split("\n").length,
      }));

    return {
      projectId: `proj-${projectName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`,
      projectName,
      repositoryUrl,
      primaryLanguage: languages[0]?.name || "TypeScript",
      languages,
      frameworks,
      technologies: Array.from(
        new Set([
          ...frameworks,
          databaseInfo.type,
          authMethod,
          ...dependencies.slice(0, 8).map((d) => d.name),
        ])
      ).filter(Boolean),
      dependencies,
      architectureNodes,
      apiEndpoints,
      databaseType: databaseInfo.type,
      databaseSchemaSummary: databaseInfo.summary,
      authMethod,
      externalServices: this.detectExternalServices(files, dependencies),
      aiComponents: this.detectAiComponents(files, dependencies),
      smartContracts: filePaths.filter((p) => p.endsWith(".sol")),
      importantFiles,
      importantFunctions,
      risks,
      analyzedAt: new Date().toISOString(),
    };
  }

  private static detectLanguages(files: RawRepoFile[]): { name: string; percentage: number }[] {
    const extCounts: Record<string, number> = {};
    let totalBytes = 0;

    for (const f of files) {
      const ext = f.path.split(".").pop()?.toLowerCase() || "unknown";
      const size = f.content.length;
      extCounts[ext] = (extCounts[ext] || 0) + size;
      totalBytes += size;
    }

    const extToLang: Record<string, string> = {
      ts: "TypeScript",
      tsx: "TypeScript (React)",
      js: "JavaScript",
      jsx: "JavaScript (React)",
      sol: "Solidity",
      py: "Python",
      go: "Go",
      rs: "Rust",
      java: "Java",
      cpp: "C++",
      json: "JSON",
      yaml: "YAML",
      yml: "YAML",
      sql: "SQL",
    };

    const langBytes: Record<string, number> = {};
    for (const [ext, bytes] of Object.entries(extCounts)) {
      const lang = extToLang[ext];
      if (lang) {
        langBytes[lang] = (langBytes[lang] || 0) + bytes;
      }
    }

    const totalLangBytes = Object.values(langBytes).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(langBytes)
      .map(([name, bytes]) => ({
        name,
        percentage: Math.round((bytes / totalLangBytes) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }

  private static extractDependencies(files: RawRepoFile[]): DependencyItem[] {
    const deps: DependencyItem[] = [];

    // 1. package.json
    const packageJsonFile = files.find((f) => f.path.endsWith("package.json"));
    if (packageJsonFile) {
      try {
        const pkg = JSON.parse(packageJsonFile.content);
        const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        for (const [name, version] of Object.entries(allDeps)) {
          deps.push({
            name,
            version: String(version),
            category: this.categorizeNpmDependency(name),
          });
        }
      } catch {
        // ignore parse error
      }
    }

    // 2. requirements.txt / pyproject.toml
    const reqFile = files.find((f) => f.path.endsWith("requirements.txt"));
    if (reqFile) {
      const lines = reqFile.content.split("\n");
      for (const line of lines) {
        const cleaned = line.trim().split(/[=><~]/)[0].trim();
        if (cleaned && !cleaned.startsWith("#")) {
          deps.push({
            name: cleaned,
            version: "latest",
            category: this.categorizePythonDependency(cleaned),
          });
        }
      }
    }

    return deps;
  }

  private static categorizeNpmDependency(name: string): DependencyItem["category"] {
    if (name.includes("react") || name.includes("next") || name.includes("vue") || name.includes("tailwind") || name.includes("lucide") || name.includes("framer")) {
      return "FRONTEND";
    }
    if (name.includes("prisma") || name.includes("mongoose") || name.includes("pg") || name.includes("redis") || name.includes("mysql") || name.includes("typeorm")) {
      return "DATABASE";
    }
    if (name.includes("ethers") || name.includes("web3") || name.includes("hardhat") || name.includes("openzeppelin") || name.includes("viem") || name.includes("wagmi")) {
      return "BLOCKCHAIN";
    }
    if (name.includes("openai") || name.includes("langchain") || name.includes("google/generative-ai") || name.includes("transformers") || name.includes("pinecone")) {
      return "AI_ML";
    }
    if (name.includes("bcrypt") || name.includes("jsonwebtoken") || name.includes("jose") || name.includes("helmet") || name.includes("cors")) {
      return "SECURITY";
    }
    if (name.includes("express") || name.includes("fastify") || name.includes("koa") || name.includes("trpc") || name.includes("socket.io")) {
      return "BACKEND";
    }
    return "DEV";
  }

  private static categorizePythonDependency(name: string): DependencyItem["category"] {
    const n = name.toLowerCase();
    if (n.includes("fastapi") || n.includes("flask") || n.includes("django") || n.includes("uvicorn") || n.includes("celery")) return "BACKEND";
    if (n.includes("torch") || n.includes("tensorflow") || n.includes("transformers") || n.includes("langchain") || n.includes("openai") || n.includes("numpy") || n.includes("pandas")) return "AI_ML";
    if (n.includes("sqlalchemy") || n.includes("psycopg2") || n.includes("redis") || n.includes("pymongo") || n.includes("pinecone")) return "DATABASE";
    if (n.includes("jwt") || n.includes("passlib") || n.includes("cryptography")) return "SECURITY";
    return "DEV";
  }

  private static detectFrameworks(filePaths: string[], dependencies: DependencyItem[]): string[] {
    const frameworks: string[] = [];
    const depNames = new Set(dependencies.map((d) => d.name.toLowerCase()));

    if (depNames.has("next") || filePaths.some((p) => p.includes("app/") || p.includes("pages/"))) frameworks.push("Next.js");
    if (depNames.has("react")) frameworks.push("React");
    if (depNames.has("express")) frameworks.push("Express.js");
    if (depNames.has("fastapi")) frameworks.push("FastAPI");
    if (depNames.has("django")) frameworks.push("Django");
    if (depNames.has("hardhat") || filePaths.some((p) => p.includes("hardhat.config"))) frameworks.push("Hardhat");
    if (depNames.has("foundry") || filePaths.some((p) => p.includes("foundry.toml"))) frameworks.push("Foundry");
    if (depNames.has("tailwindcss")) frameworks.push("Tailwind CSS");
    if (depNames.has("langchain") || depNames.has("langchain-core")) frameworks.push("LangChain");

    return Array.from(new Set(frameworks));
  }

  private static detectDatabase(files: RawRepoFile[], dependencies: DependencyItem[]): { type: string; summary: string } {
    const depNames = new Set(dependencies.map((d) => d.name.toLowerCase()));
    const allContent = files.map((f) => f.content).join("\n").toLowerCase();

    if (depNames.has("@prisma/client") || files.some((f) => f.path.endsWith("schema.prisma"))) {
      return { type: "Prisma ORM (PostgreSQL/MySQL)", summary: "Type-safe relational schema with migrations and relational models" };
    }
    if (depNames.has("mongoose") || allContent.includes("mongoose.schema")) {
      return { type: "MongoDB (Mongoose ODM)", summary: "Document store with schematized collections and indexing" };
    }
    if (depNames.has("redis") || depNames.has("ioredis") || allContent.includes("redis.createclient")) {
      return { type: "Redis Cache & Key-Value Store", summary: "In-memory caching, rate-limiting, and ephemeral pub/sub" };
    }
    if (depNames.has("pinecone") || depNames.has("@pinecone-database/pinecone") || allContent.includes("pinecone")) {
      return { type: "Pinecone Vector Database", summary: "High-dimensional embedding index for semantic search & RAG retrieval" };
    }
    if (depNames.has("pg") || depNames.has("psycopg2") || depNames.has("sqlalchemy")) {
      return { type: "PostgreSQL (SQLAlchemy / pg)", summary: "ACID-compliant relational database with connection pooling" };
    }
    return { type: "In-Memory / External API", summary: "Stateless persistence or external API data stores" };
  }

  private static detectAuthentication(files: RawRepoFile[], dependencies: DependencyItem[]): string {
    const depNames = new Set(dependencies.map((d) => d.name.toLowerCase()));
    const allContent = files.map((f) => f.content).join("\n").toLowerCase();

    if (depNames.has("jsonwebtoken") || depNames.has("jose") || depNames.has("pyjwt") || allContent.includes("jwt.sign") || allContent.includes("jwt.verify")) {
      return "JSON Web Tokens (JWT) with Bearer Authentication & Refresh Rotation";
    }
    if (depNames.has("next-auth") || depNames.has("@auth/core")) {
      return "NextAuth.js / Auth.js (OAuth2 + Session Management)";
    }
    if (depNames.has("firebase-admin") || depNames.has("firebase") || allContent.includes("firebase.auth")) {
      return "Firebase Authentication (OAuth, Email/Password, Token Verification)";
    }
    if (allContent.includes("siwe") || allContent.includes("verifyMessage") || allContent.includes("eth_sign")) {
      return "Sign-In with Ethereum (SIWE / EIP-4361 Web3 Signature Auth)";
    }
    return "Custom Session / API Key Authentication";
  }

  private static extractApiEndpoints(files: RawRepoFile[]): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];

    for (const f of files) {
      const content = f.content;
      // Express / Next.js route patterns
      const expressMatches = content.matchAll(/(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi);
      for (const m of expressMatches) {
        endpoints.push({
          method: m[1].toUpperCase() as any,
          path: m[2],
          handler: `Handler in ${f.path.split("/").pop()}`,
          file: f.path,
          isProtected: content.includes("authMiddleware") || content.includes("verifyToken") || content.includes("requireAuth"),
        });
      }

      // Next.js App Router export async function GET / POST
      if (f.path.includes("api/") && (f.path.endsWith("route.ts") || f.path.endsWith("route.js"))) {
        const httpMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
        for (const method of httpMethods) {
          if (content.includes(`export async function ${method}`) || content.includes(`export function ${method}`)) {
            const apiPath = "/" + f.path.replace(/\\/g, "/").replace(/^.*src\/app\//, "").replace(/\/route\.(ts|js)$/, "");
            endpoints.push({
              method: method as any,
              path: apiPath,
              handler: `${method} Route Handler`,
              file: f.path,
              isProtected: content.includes("auth") || content.includes("session") || content.includes("verify"),
            });
          }
        }
      }

      // FastAPI @app.get / @router.post
      const fastApiMatches = content.matchAll(/@(app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi);
      for (const m of fastApiMatches) {
        endpoints.push({
          method: m[2].toUpperCase() as any,
          path: m[3],
          handler: `FastAPI endpoint in ${f.path.split("/").pop()}`,
          file: f.path,
          isProtected: content.includes("Depends(get_current_user)") || content.includes("Depends(auth)"),
        });
      }
    }

    return endpoints.slice(0, 12);
  }

  private static identifyImportantFunctions(files: RawRepoFile[]): ImportantFunction[] {
    const functions: ImportantFunction[] = [];

    for (const f of files) {
      const content = f.content;
      // Match TS/JS/Solidity functions
      const fnMatches = content.matchAll(/(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g);
      for (const m of fnMatches) {
        const name = m[1];
        if (name.length > 3 && !name.startsWith("test") && !name.startsWith("handle")) {
          functions.push({
            name,
            file: f.path,
            purpose: `Core business logic executing ${name.replace(/([A-Z])/g, " $1").toLowerCase()}`,
            complexity: content.length > 2000 || content.includes("try") ? "HIGH" : "MEDIUM",
            criticalLogic: `Executes critical workflow in ${f.path.split("/").pop()}`,
          });
        }
      }

      // Match Solidity external/public functions
      if (f.path.endsWith(".sol")) {
        const solMatches = content.matchAll(/function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*(?:external|public)/g);
        for (const m of solMatches) {
          functions.push({
            name: m[1],
            file: f.path,
            purpose: `On-chain smart contract entry point: ${m[1]}`,
            complexity: "HIGH",
            criticalLogic: `State mutation or transaction execution on-chain`,
          });
        }
      }
    }

    return functions.slice(0, 8);
  }

  private static identifySecurityAndArchitectureRisks(
    files: RawRepoFile[],
    dependencies: DependencyItem[],
    authMethod: string
  ): RiskItem[] {
    const risks: RiskItem[] = [];
    const allContent = files.map((f) => f.content).join("\n");

    if (authMethod.includes("JWT")) {
      risks.push({
        severity: "HIGH",
        category: "SECURITY",
        title: "JWT Secret Exposure & Token Revocation Complexity",
        description: "Stateless JWT tokens cannot be immediately invalidated without an active blacklist/Redis revocation registry if client storage is compromised.",
        affectedComponent: "Authentication & Session Layer",
      });
    }

    if (allContent.includes("redis") && !allContent.includes("fallback")) {
      risks.push({
        severity: "MEDIUM",
        category: "RELIABILITY",
        title: "In-Memory Cache Single Point of Failure (SPOF)",
        description: "If Redis cluster connectivity drops or reaches memory eviction limits, API response latency may cascade into downstream database spikes.",
        affectedComponent: "Caching & Rate Limiting Infrastructure",
      });
    }

    if (files.some((f) => f.path.endsWith(".sol"))) {
      risks.push({
        severity: "HIGH",
        category: "SECURITY",
        title: "Smart Contract State Reentrancy & Access Control",
        description: "External calls prior to internal state mutations can enable reentrancy attacks or unauthorized administrative parameter manipulation.",
        affectedComponent: "Smart Contract Execution Layer",
      });
    }

    if (dependencies.some((d) => d.category === "AI_ML")) {
      risks.push({
        severity: "MEDIUM",
        category: "PERFORMANCE",
        title: "LLM Rate Limiting & Non-Deterministic Latency",
        description: "Upstream LLM provider throttling and variable inference latency directly impact end-user request timeout budgets without asynchronous worker queues.",
        affectedComponent: "AI Orchestration Layer",
      });
    }

    return risks;
  }

  private static synthesizeArchitectureDAG(
    projectName: string,
    frameworks: string[],
    databaseInfo: { type: string; summary: string },
    authMethod: string,
    apiEndpoints: ApiEndpoint[],
    dependencies: DependencyItem[]
  ): ArchitectureNode[] {
    const nodes: ArchitectureNode[] = [];

    // 1. Frontend Client Node
    nodes.push({
      id: "node-frontend",
      name: `${frameworks.includes("Next.js") ? "Next.js" : "Client"} UI & State Layer`,
      type: "FRONTEND",
      description: "Interactive reactive user interface with state management and API client hooks.",
      technologies: frameworks.filter((f) => f.includes("React") || f.includes("Next") || f.includes("Tailwind")),
      connections: ["node-api", "node-auth"],
    });

    // 2. Auth Gateway Node
    nodes.push({
      id: "node-auth",
      name: "Authentication & Authorization Gateway",
      type: "AUTH",
      description: authMethod,
      technologies: [authMethod.split("(")[0].trim()],
      connections: ["node-api"],
    });

    // 3. Backend API Node
    nodes.push({
      id: "node-api",
      name: `${frameworks.includes("FastAPI") ? "FastAPI" : "REST / Route"} Service Layer`,
      type: "BACKEND_API",
      description: `Dispatches ${apiEndpoints.length} registered endpoints and coordinates business workflows.`,
      technologies: frameworks.filter((f) => f.includes("Express") || f.includes("FastAPI") || f.includes("Next")),
      connections: ["node-db"],
    });

    // 4. Database Node
    nodes.push({
      id: "node-db",
      name: databaseInfo.type,
      type: "DATABASE",
      description: databaseInfo.summary,
      technologies: [databaseInfo.type.split("(")[0].trim()],
      connections: [],
    });

    // 5. Blockchain / Smart Contract or AI if detected
    if (dependencies.some((d) => d.category === "BLOCKCHAIN")) {
      nodes.push({
        id: "node-blockchain",
        name: "EVM Smart Contract & Web3 Anchor",
        type: "SMART_CONTRACT",
        description: "On-chain state registry, soulbound token minting, and cryptographic verification.",
        technologies: ["Solidity", "Ethers.js", "OpenZeppelin", "ERC-5192"],
        connections: [],
      });
      nodes.find((n) => n.id === "node-api")?.connections.push("node-blockchain");
    }

    if (dependencies.some((d) => d.category === "AI_ML")) {
      nodes.push({
        id: "node-ai",
        name: "AI Inference & Vector Retrieval Engine",
        type: "AI_MODEL",
        description: "Embedding generation, RAG document retrieval, and LLM reasoning pipeline.",
        technologies: dependencies.filter((d) => d.category === "AI_ML").map((d) => d.name),
        connections: [],
      });
      nodes.find((n) => n.id === "node-api")?.connections.push("node-ai");
    }

    return nodes;
  }

  private static detectExternalServices(files: RawRepoFile[], dependencies: DependencyItem[]): string[] {
    const services: string[] = [];
    const content = files.map((f) => f.content).join("\n").toLowerCase();
    if (content.includes("pinata") || content.includes("ipfs")) services.push("Pinata IPFS");
    if (content.includes("alchemy") || content.includes("infura")) services.push("Alchemy / Infura RPC");
    if (content.includes("stripe")) services.push("Stripe Payments API");
    if (content.includes("sendgrid") || content.includes("resend")) services.push("Email Delivery API");
    if (content.includes("github.com/api")) services.push("GitHub REST API");
    return Array.from(new Set(services));
  }

  private static detectAiComponents(files: RawRepoFile[], dependencies: DependencyItem[]): string[] {
    const ai: string[] = [];
    const depNames = dependencies.map((d) => d.name.toLowerCase());
    if (depNames.some((d) => d.includes("langchain"))) ai.push("LangChain RAG Pipeline");
    if (depNames.some((d) => d.includes("pinecone"))) ai.push("Pinecone Vector Indexing");
    if (depNames.some((d) => d.includes("openai") || d.includes("generative-ai"))) ai.push("Multi-Turn LLM Reasoning");
    return ai;
  }

  private static inferFilePurpose(filePath: string): string {
    const p = filePath.toLowerCase();
    if (p.endsWith(".sol")) return "Smart contract defining state, access controls, and token rules";
    if (p.includes("auth")) return "Token signing, validation, and session security middleware";
    if (p.includes("router") || p.includes("api")) return "API endpoint routing and parameter validation";
    if (p.includes("controller") || p.includes("service")) return "Business orchestration and database operations";
    if (p.includes("model") || p.includes("schema")) return "Data model, relational schema, and indexing rules";
    return "Core application module";
  }
}
