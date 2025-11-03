/**
 * Question System Type Definitions
 * 
 * Types for the decision tree questionnaire system used in position evaluations.
 * Questions guide users through a yes/no decision tree that determines the resulting level.
 */

/**
 * Question Translation
 * Localized text and help text for a question
 */
export interface QuestionTranslation {
  id: string;
  question_id: string;
  language: string;
  text: string;
  help_text?: string | null;
}

/**
 * Option Translation
 * Localized text for a question option (typically "Yes" or "No")
 */
export interface OptionTranslation {
  id: string;
  option_id: string;
  language: string;
  label: string;
}

/**
 * Question Option
 * Represents a possible answer to a question in the decision tree.
 * Either navigates to the next question (next_question_key) or determines the final level (resulting_level).
 */
export interface QuestionOption {
  id: string;
  question_id: string;
  option_key: string; // 'yes' or 'no'
  next_question_key: string | null; // Next question to navigate to, or null if terminal
  resulting_level: number | null; // Final level if this is a terminal node, or null if continues
  order_index: number;
  translations: OptionTranslation[];
}

/**
 * Question
 * A single question in the decision tree for a dimension
 */
export interface Question {
  id: string;
  dimension_id: string;
  question_key: string; // e.g., 'q1', 'q2', 'q3'
  order_index: number;
  translations: QuestionTranslation[];
  options: QuestionOption[];
}

/**
 * Dimension Answers
 * Records the path taken through the decision tree.
 * Key: question_key (e.g., 'q1', 'q2')
 * Value: option_key (e.g., 'yes', 'no')
 * 
 * Example: { "q1": "yes", "q2": "no" } means:
 * - Question 1 answered YES
 * - Question 2 answered NO (resulting in a specific level)
 */
export type DimensionAnswers = Record<string, string>;
