import {
  ProjectKnowledgeModel,
  AssessmentQuestion,
  AdaptiveThreadStep,
  QuestionResponse,
  CompetencyReport,
  AssessmentMode,
} from "../types";

export interface ILLMProvider {
  name: string;
  generateAssessmentQuestions(
    knowledgeModel: ProjectKnowledgeModel,
    count?: number
  ): Promise<AssessmentQuestion[]>;

  generateAdaptiveFollowUp(
    knowledgeModel: ProjectKnowledgeModel,
    question: AssessmentQuestion,
    candidateAnswer: string,
    threadHistory: AdaptiveThreadStep[]
  ): Promise<{ prompt: string; intent: string }>;

  evaluateCompetency(
    knowledgeModel: ProjectKnowledgeModel,
    responses: QuestionResponse[],
    mode: AssessmentMode,
    candidateName: string,
    candidateEmail?: string
  ): Promise<CompetencyReport>;
}
