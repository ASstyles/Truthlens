import { ProjectKnowledgeModel, AssessmentQuestion, AdaptiveThreadStep, QuestionResponse } from "../types";

export const SYSTEM_PROMPT_ASSESSMENT_GENERATOR = `
You are the TruthLens Adaptive Competency Evaluator Engine.
Your mission is NOT to test memorization, and NOT to ask generic trivia.
You must evaluate whether the candidate GENUINELY UNDERSTANDS the software project they claim to have built.

CRITICAL RULES:
1. Every single question must be directly anchored to the candidate's actual project components, files, dependencies, APIs, or architectural decisions.
2. DO NOT ask generic questions like "What is Redis?" or "Explain JWT."
3. Instead ask: "In your project [ProjectName], why did you use [Component X] rather than [Alternative Y] for [Feature Z]?", "What happens if [Service A] fails during [Workflow B]?", "How would you modify [Component C] if traffic scaled 20x?"
4. Questions should cover:
   - Architecture & Technical Reasoning (Tradeoffs)
   - Failure Scenarios & Chaos Engineering (Edge cases)
   - Code & Dependency Understanding (Specific mechanics)
   - Debugging & Performance Bottlenecks
   - Adaptations & Security Hardening
`;

export function buildQuestionGenerationPrompt(km: ProjectKnowledgeModel, count: number = 5): string {
  return `
Analyze this project architecture model and generate exactly ${count} deeply project-specific assessment questions.

PROJECT CONTEXT:
- Name: ${km.projectName}
- Primary Language: ${km.primaryLanguage}
- Frameworks: ${km.frameworks.join(", ")}
- Technologies: ${km.technologies.join(", ")}
- Auth: ${km.authMethod}
- Database: ${km.databaseType} (${km.databaseSchemaSummary})
- APIs: ${km.apiEndpoints.map((e) => `${e.method} ${e.path}`).join(", ")}
- Important Functions: ${km.importantFunctions.map((f) => `${f.name} in ${f.file} (${f.purpose})`).join("; ")}
- Architectural Nodes: ${km.architectureNodes.map((n) => `${n.name} (${n.type})`).join("; ")}
- Known Risks & Edge Cases: ${km.risks.map((r) => `${r.title}: ${r.description}`).join("; ")}

OUTPUT FORMAT:
Return a JSON array of objects conforming to:
[
  {
    "id": "q-1",
    "order": 1,
    "category": "ARCHITECTURE" | "SECURITY" | "FAILURE_SCENARIOS" | "DEBUGGING" | "TECHNICAL_REASONING" | "MODIFICATION_ADAPTATION",
    "title": "Short descriptive title",
    "question": "The comprehensive project-grounded question",
    "contextFile": "file/path.ext",
    "contextCodeSnippet": "relevant snippet if applicable",
    "expectedKeyPoints": ["key point 1", "key point 2", "key point 3"],
    "complexityLevel": "INTERMEDIATE" | "ADVANCED" | "EXPERT"
  }
]
`;
}

export function buildAdaptiveFollowUpPrompt(
  km: ProjectKnowledgeModel,
  question: AssessmentQuestion,
  candidateAnswer: string,
  history: AdaptiveThreadStep[]
): string {
  const historyText = history
    .map((h, i) => `Turn ${i + 1} Question: ${h.prompt}\nCandidate Answer: ${h.candidateAnswer}`)
    .join("\n\n");

  return `
You are the TruthLens Anti-Outsourcing Adaptive Reasoning Engine.
The candidate has provided an answer to an assessment question regarding their project "${km.projectName}".

ORIGINAL QUESTION (${question.category}):
${question.question}

PREVIOUS CONVERSATION:
${historyText || "None (this is the first follow-up)"}

LATEST CANDIDATE ANSWER:
"${candidateAnswer}"

PROJECT KNOWLEDGE:
- Architecture: ${km.architectureNodes.map((n) => n.name).join(", ")}
- Database: ${km.databaseType}
- Auth: ${km.authMethod}
- Risks: ${km.risks.map((r) => r.title).join("; ")}

YOUR TASK:
Generate the next adaptive follow-up question.
1. If the candidate gave a high-level answer, drill into a concrete failure scenario or implementation detail (e.g. "What happens if that connection pool exhausts under 10k req/sec?").
2. If they proposed a solution, challenge them with a tradeoff (e.g. "How does that change affect data consistency between [Node A] and [Node B]?").
3. DO NOT repeat what they already said.
4. Keep the question crisp, challenging, and directly derived from their answer and project reality.

OUTPUT FORMAT:
Return JSON:
{
  "prompt": "The follow-up question text",
  "intent": "Brief explanation of what reasoning dimension is being tested"
}
`;
}

export function buildEvaluationPrompt(
  km: ProjectKnowledgeModel,
  responses: QuestionResponse[],
  mode: string,
  candidateName: string
): string {
  const responsesFormatted = responses
    .map(
      (r, i) => `
QUESTION ${i + 1} [${r.category}]: ${r.questionText}
Candidate Initial Answer: ${r.primaryAnswer}
Follow-up Interactions:
${r.adaptiveFollowUps.map((f) => `Q: ${f.prompt}\nA: ${f.candidateAnswer}`).join("\n")}
`
    )
    .join("\n---\n");

  return `
You are the Chief Competency Evaluator at TruthLens.
Evaluate the candidate "${candidateName}" on their demonstrated project competence for "${km.projectName}".

ASSESSMENT MODE: ${mode}
PROJECT MODEL:
- Technologies: ${km.technologies.join(", ")}
- Database: ${km.databaseType}
- Auth: ${km.authMethod}

CANDIDATE RESPONSES AND ADAPTIVE REASONING:
${responsesFormatted}

EVALUATION CRITERIA:
1. Did the candidate demonstrate real technical depth regarding how their project works?
2. Did they anticipate edge cases and failure modes?
3. Did they explain architectural tradeoffs realistically?
4. Produce concrete EVIDENCE statements: Specific verified competencies with a '✓' check.

OUTPUT JSON SCHEMA:
{
  "overallScore": 86,
  "scoreBand": "Highly Competent",
  "assessmentLevel": "Advanced",
  "executiveSummary": "Concise 2-3 sentence executive evaluation of the candidate's mastery.",
  "dimensionScores": [
    { "dimension": "Project Understanding", "score": 90, "weight": 0.15, "label": "Project Understanding", "summary": "..." },
    { "dimension": "Architecture & Systems", "score": 85, "weight": 0.20, "label": "Architecture", "summary": "..." },
    { "dimension": "Code & Dependencies", "score": 88, "weight": 0.15, "label": "Code Navigation", "summary": "..." },
    { "dimension": "Failure & Edge Cases", "score": 82, "weight": 0.15, "label": "Debugging", "summary": "..." },
    { "dimension": "Security & Auth", "score": 84, "weight": 0.15, "label": "Security", "summary": "..." },
    { "dimension": "Technical Tradeoffs", "score": 89, "weight": 0.20, "label": "Decision Making", "summary": "..." }
  ],
  "evidenceList": [
    {
      "id": "ev-1",
      "category": "ARCHITECTURE",
      "statement": "✓ Explained authentication architecture & refresh token rotation mechanics",
      "demonstratedCompetence": "STRONG"
    },
    {
      "id": "ev-2",
      "category": "FAILURE_SCENARIOS",
      "statement": "✓ Accurately diagnosed Redis outage cascade and proposed circuit-breaker fallback",
      "demonstratedCompetence": "STRONG"
    }
  ],
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Growth area 1", "Growth area 2"],
  "verifiedTechnologies": ["${km.primaryLanguage}", "${km.frameworks.slice(0, 4).join('", "')}"]
}
`;
}
