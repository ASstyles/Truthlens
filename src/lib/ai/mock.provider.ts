import { ILLMProvider } from "./provider.interface";
import {
  ProjectKnowledgeModel,
  AssessmentQuestion,
  AdaptiveThreadStep,
  QuestionResponse,
  CompetencyReport,
  AssessmentMode,
  EvidenceItem,
} from "../types";

export class MockLLMProvider implements ILLMProvider {
  public name = "TruthLens Local Inference Engine (Demo / Fallback)";

  async generateAssessmentQuestions(
    km: ProjectKnowledgeModel,
    count: number = 4
  ): Promise<AssessmentQuestion[]> {
    const questions: AssessmentQuestion[] = [];
    const tech = km.technologies.slice(0, 4).join(", ");
    const db = km.databaseType || "Database";
    const auth = km.authMethod || "Authentication";
    const risk = km.risks[0]?.title || "concurrency limits";

    // 1. Basic Understanding (EASY)
    questions.push({
      id: `q-arch-1`,
      order: 1,
      category: "ARCHITECTURE",
      title: `Project Architecture`,
      question: `What does ${km.projectName} do, and how does requests flow from the frontend to ${db.split(" ")[0]}?`,
      expectedKeyPoints: [
        `Explanation of ${km.projectName}`,
        `Data access patterns in ${db}`,
      ],
      complexityLevel: "FOUNDATIONAL",
    });

    // 2. Practical Reasoning & Tradeoffs (MEDIUM)
    questions.push({
      id: `q-fail-2`,
      order: 2,
      category: "FAILURE_SCENARIOS",
      title: `Database and Error Handling`,
      question: `If ${db.split(" ")[0]} starts running slowly or times out, what will happen in your app?`,
      expectedKeyPoints: [
        "Handling database errors",
        "Error messaging to users",
      ],
      complexityLevel: "INTERMEDIATE",
    });

    // 3. Security (MEDIUM / HARD)
    questions.push({
      id: `q-sec-3`,
      order: 3,
      category: "SECURITY",
      title: `Authentication & Security`,
      question: `How does ${auth.split(" ")[0]} protect your sensitive API endpoints if someone sends an invalid request?`,
      expectedKeyPoints: [
        "Authentication verification",
        "Protecting sensitive endpoints",
      ],
      complexityLevel: "ADVANCED",
    });

    // 4. Scalability & Debugging (HARD)
    questions.push({
      id: `q-scale-4`,
      order: 4,
      category: "MODIFICATION_ADAPTATION",
      title: `High Traffic Scaling`,
      question: `If your app suddenly received 20 times more traffic tomorrow, what part do you think would fail first, and how would you fix it?`,
      expectedKeyPoints: [
        "Finding the bottleneck",
        "Scaling or caching strategy",
      ],
      complexityLevel: "EXPERT",
    });

    return questions.slice(0, count);
  }

  async generateAdaptiveFollowUp(
    km: ProjectKnowledgeModel,
    question: AssessmentQuestion,
    candidateAnswer: string,
    history: AdaptiveThreadStep[]
  ): Promise<{ prompt: string; intent: string }> {
    const turnCount = history.length + 1;
    const lowerAns = candidateAnswer.toLowerCase();

    if (turnCount === 1) {
      if (lowerAns.includes("cache") || lowerAns.includes("redis")) {
        return {
          prompt: `What exactly are you storing in the cache, and what happens if that cached data disappears?`,
          intent: "Cache usage verification",
        };
      }
      if (lowerAns.includes("token") || lowerAns.includes("jwt") || lowerAns.includes("auth")) {
        return {
          prompt: `If a user logs out or changes their password, how do you make sure their previous login is no longer valid?`,
          intent: "Session invalidation reasoning",
        };
      }
      return {
        prompt: `If two users tried to do this at the exact same second, what would happen?`,
        intent: "Concurrency and race conditions",
      };
    }

    return {
      prompt: `If this feature completely stopped working in production, what is the first thing you would check to find the bug?`,
      intent: "Debugging methodology",
    };
  }

  async evaluateCompetency(
    km: ProjectKnowledgeModel,
    responses: QuestionResponse[],
    mode: AssessmentMode,
    candidateName: string,
    candidateEmail: string = "developer@truthlens.io"
  ): Promise<CompetencyReport> {
    // Compute heuristic score based on response depth, word count, technical vocabulary, and follow-up turns
    let totalScoreAccumulator = 0;
    const evidenceList: EvidenceItem[] = [];

    responses.forEach((resp, idx) => {
      const fullText = resp.primaryAnswer + " " + resp.adaptiveFollowUps.map((f) => f.candidateAnswer).join(" ");
      const wordCount = fullText.split(/\s+/).filter(Boolean).length;
      const hasKeywords =
        fullText.includes("cache") ||
        fullText.includes("auth") ||
        fullText.includes("token") ||
        fullText.includes("concurrency") ||
        fullText.includes("scale") ||
        fullText.includes("timeout") ||
        fullText.includes("latency") ||
        fullText.includes("fail") ||
        fullText.includes("async") ||
        fullText.includes("pool") ||
        fullText.includes("transaction");

      let itemScore = Math.min(95, Math.max(72, 70 + (wordCount > 40 ? 12 : 6) + (hasKeywords ? 10 : 0) + (resp.adaptiveFollowUps.length * 3)));
      totalScoreAccumulator += itemScore;

      // Extract specific evidence items
      if (resp.category === "ARCHITECTURE") {
        evidenceList.push({
          id: `ev-arch-${idx}`,
          category: "ARCHITECTURE",
          statement: `✓ Articulated architectural tradeoffs and system boundaries in ${km.projectName}`,
          demonstratedCompetence: "STRONG",
        });
      } else if (resp.category === "FAILURE_SCENARIOS") {
        evidenceList.push({
          id: `ev-fail-${idx}`,
          category: "FAILURE_SCENARIOS",
          statement: `✓ Accurately diagnosed cascading outage risks and proposed resilient failover logic`,
          demonstratedCompetence: "STRONG",
        });
      } else if (resp.category === "SECURITY") {
        evidenceList.push({
          id: `ev-sec-${idx}`,
          category: "SECURITY",
          statement: `✓ Demonstrated deep comprehension of ${km.authMethod.split("(")[0].trim()} security invariants`,
          demonstratedCompetence: "STRONG",
        });
      } else {
        evidenceList.push({
          id: `ev-scale-${idx}`,
          category: "MODIFICATION_ADAPTATION",
          statement: `✓ Formulated viable horizontal scaling & bottleneck mitigation strategy`,
          demonstratedCompetence: "STRONG",
        });
      }
    });

    const averageScore = responses.length > 0 ? Math.round(totalScoreAccumulator / responses.length) : 86;
    const finalScore = Math.min(96, Math.max(68, averageScore));

    const dimensionScores = [
      {
        dimension: "Project Understanding",
        score: Math.min(98, finalScore + 4),
        weight: 0.15,
        label: "Project Understanding",
        summary: "Demonstrated clear grasp of codebase topology and purpose.",
        evidenceStatements: [
          `✓ Identified exact role and data boundaries of ${km.frameworks[0] || km.primaryLanguage}`,
          `✓ Articulated business domain requirements and component relationships`,
        ],
      },
      {
        dimension: "Architecture & Systems",
        score: Math.min(96, finalScore - 1),
        weight: 0.20,
        label: "Architecture",
        summary: "Strong reasoning regarding service boundaries and protocols.",
        evidenceStatements: [
          `✓ Explained service dependency and stateless routing decisions`,
          `✓ Justified database choice (${km.databaseType.split("(")[0].trim()}) over alternative paradigms`,
        ],
      },
      {
        dimension: "Code & Dependencies",
        score: Math.min(97, finalScore + 2),
        weight: 0.15,
        label: "Code Navigation",
        summary: "Deep comprehension of third-party libraries and runtime logic.",
        evidenceStatements: [
          `✓ Accurately referenced critical functions in ${km.importantFiles[0]?.path || "source files"}`,
          `✓ Demonstrated fluent understanding of runtime concurrency & async operations`,
        ],
      },
      {
        dimension: "Failure & Edge Cases",
        score: Math.min(94, finalScore - 3),
        weight: 0.15,
        label: "Debugging",
        summary: "Anticipated failure modes and latency cascade scenarios.",
        evidenceStatements: [
          `✓ Correctly predicted failure propagation during database connection drops`,
          `✓ Formulated graceful degradation and circuit-breaker backoff strategy`,
        ],
      },
      {
        dimension: "Security & Auth",
        score: Math.min(95, finalScore + 1),
        weight: 0.15,
        label: "Security",
        summary: "Clear understanding of token mechanics and access controls.",
        evidenceStatements: [
          `✓ Explained ${km.authMethod.split("(")[0].trim()} cryptographic validation rules`,
          `✓ Identified token revocation tradeoffs and secret isolation invariants`,
        ],
      },
      {
        dimension: "Technical Tradeoffs",
        score: Math.min(97, finalScore + 3),
        weight: 0.20,
        label: "Decision Making",
        summary: "Pragmatic engineering judgement under scaling constraints.",
        evidenceStatements: [
          `✓ Identified likely primary bottleneck under 20x concurrent traffic surge`,
          `✓ Proposed viable horizontal partitioning and distributed cache strategy`,
        ],
      },
    ];

    let scoreBand: CompetencyReport["scoreBand"] = "Highly Competent";
    if (finalScore >= 90) scoreBand = "Exceptional (Top 1%)";
    else if (finalScore >= 80) scoreBand = "Highly Competent";
    else if (finalScore >= 70) scoreBand = "Proficient";
    else scoreBand = "Developing";

    return {
      assessmentId: `eval-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      projectId: km.projectId,
      projectName: km.projectName,
      candidateUid: `uid-${Date.now().toString(36)}`,
      candidateName,
      candidateEmail,
      assessmentMode: mode,
      overallScore: finalScore,
      scoreBand,
      assessmentLevel: finalScore > 85 ? "Advanced" : "Intermediate",
      dimensionScores,
      evidenceList,
      strengths: [
        `Clear conceptual model of ${km.primaryLanguage} concurrency and asynchronous event loops.`,
        `Thorough reasoning around ${km.databaseType.split("(")[0].trim()} data persistence and latency tradeoffs.`,
        `Pragmatic approach to defensive coding against external service degradations.`,
      ],
      weaknesses: [
        `Could explore automated canary rollback metrics in continuous deployment pipelines.`,
        `Opportunity to tighten fine-grained rate-limiting windows under distributed denial conditions.`,
      ],
      executiveSummary: `${candidateName} demonstrated robust, evidence-backed mastery of ${km.projectName}, successfully navigating multi-turn architectural challenges, failure scenarios, and scaling tradeoffs.`,
      verifiedTechnologies: km.technologies.slice(0, 5),
      assessedAt: new Date().toISOString(),
      version: "v1",
    };
  }
}
