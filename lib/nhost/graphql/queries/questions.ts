/**
 * GraphQL Queries for Question System
 * 
 * Queries for fetching decision tree questions and options for position evaluations
 */

/**
 * GET_DIMENSION_QUESTIONS
 * 
 * Fetches all questions and their options for a specific dimension.
 * Used to build the decision tree questionnaire for evaluation.
 * 
 * @param dimensionId - UUID of the dimension
 * @param language - Language code (e.g., 'en', 'tr')
 */
export const GET_DIMENSION_QUESTIONS = `
  query GetDimensionQuestions($dimensionId: uuid!, $language: String!) {
    questions(
      where: { dimension_id: { _eq: $dimensionId } }
      order_by: { order_index: asc }
    ) {
      id
      dimension_id
      question_key
      order_index
      translations: question_translations(
        where: { language: { _eq: $language } }
      ) {
        id
        question_id
        language
        text
        help_text
      }
      options: question_options(
        order_by: { order_index: asc }
      ) {
        id
        question_id
        option_key
        next_question_key
        resulting_level
        order_index
        translations: option_translations(
          where: { language: { _eq: $language } }
        ) {
          id
          option_id
          language
          label
        }
      }
    }
  }
`;
