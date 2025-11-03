# Questionnaire System - Quick Reference

## For Frontend Developers

### Using the Questionnaire Component

```tsx
import { DimensionQuestionCard } from '@/components/evaluation/DimensionQuestionCard';
import type { DimensionAnswers } from '@/lib/types/questions';
import type { Dimension } from '@/lib/types/evaluation';

function MyEvaluationPage() {
  const handleComplete = (
    dimensionId: string,
    resultingLevel: number,
    answers: DimensionAnswers
  ) => {
    console.log('Dimension completed!');
    console.log('Resulting Level:', resultingLevel); // e.g., 3
    console.log('Answers:', answers); // e.g., {"q1": "yes", "q2": "no"}
    
    // Save to database
    saveDimensionScore(evaluationId, dimensionId, resultingLevel, answers);
  };

  return (
    <DimensionQuestionCard
      dimension={currentDimension}
      language="en"
      onComplete={handleComplete}
      initialAnswers={existingAnswers} // Optional - for resuming
    />
  );
}
```

### Decision Tree Structure

```
Q1: "Does role require training?"
  → YES → Q2: "Deep expertise required?"
      → YES → Level 3
      → NO  → Level 2
  → NO  → Level 1
```

### Data Types

```typescript
// Stored in database
interface DimensionScore {
  dimension_id: string;
  evaluation_id: string;
  resulting_level: number;        // 1-7
  answers: DimensionAnswers;      // {"q1": "yes", "q2": "no"}
  raw_points: number;             // Auto-calculated
  weighted_points: number;        // Auto-calculated
}

// Answer path type
type DimensionAnswers = Record<string, string>;
// Example: { "q1": "yes", "q2": "no", "q3": "yes" }
```

### Saving Answers

```typescript
import { saveDimensionScore } from '@/lib/nhost/graphql/mutations/evaluations';

// Save with questionnaire results
await saveDimensionScore(
  evaluationId,      // uuid
  dimensionId,       // uuid
  resultingLevel,    // 1-7 (determined by questionnaire)
  answers           // {"q1": "yes", "q2": "no"}
);

// Database trigger automatically calculates:
// - raw_points (from score_levels table)
// - weighted_points (raw_points × dimension.weight)
```

### GraphQL Query

```graphql
query GetDimensionQuestions($dimensionId: uuid!, $language: String!) {
  questions(
    where: { dimension_id: { _eq: $dimensionId } }
    order_by: { order_index: asc }
  ) {
    id
    question_key
    translations: question_translations(where: { language: { _eq: $language } }) {
      text
      description
    }
    options: question_options(order_by: { order_index: asc }) {
      id
      option_key                 # 'yes' or 'no'
      next_question_key          # 'q2' or null
      resulting_level            # 3 or null
      translations: option_translations(where: { language: { _eq: $language } }) {
        text
      }
    }
  }
}
```

## For Backend Developers

### Database Schema

```sql
-- Questions
CREATE TABLE questions (
  id UUID PRIMARY KEY,
  dimension_id UUID REFERENCES dimensions(id),
  question_key VARCHAR NOT NULL,  -- 'q1', 'q2', 'q3'
  order_index INT NOT NULL
);

-- Question Options
CREATE TABLE question_options (
  id UUID PRIMARY KEY,
  question_id UUID REFERENCES questions(id),
  option_key VARCHAR NOT NULL,           -- 'yes' or 'no'
  next_question_key VARCHAR NULL,        -- Next question or null if terminal
  resulting_level INT NULL,              -- Final level or null if continues
  order_index INT NOT NULL
);

-- Dimension Scores (updated)
CREATE TABLE dimension_scores (
  evaluation_id UUID REFERENCES position_evaluations(id),
  dimension_id UUID REFERENCES dimensions(id),
  resulting_level INT NOT NULL,
  answers JSONB NOT NULL,                -- {"q1": "yes", "q2": "no"}
  raw_points DECIMAL,
  weighted_points DECIMAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (evaluation_id, dimension_id)
);
```

### Database Triggers

```sql
-- Auto-calculate points when dimension_score is inserted/updated
CREATE OR REPLACE FUNCTION auto_calculate_dimension_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Lookup raw_points from score_levels table
  SELECT points INTO NEW.raw_points
  FROM score_levels
  WHERE level = NEW.resulting_level;
  
  -- Calculate weighted_points
  SELECT NEW.raw_points * d.weight INTO NEW.weighted_points
  FROM dimensions d
  WHERE d.id = NEW.dimension_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_dimension_points
  BEFORE INSERT OR UPDATE ON dimension_scores
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_dimension_points();
```

### Sample Question Data

```sql
-- Example: Education dimension
INSERT INTO questions (id, dimension_id, question_key, order_index) VALUES
  ('q1-uuid', 'education-dim-uuid', 'q1', 1),
  ('q2-uuid', 'education-dim-uuid', 'q2', 2),
  ('q3-uuid', 'education-dim-uuid', 'q3', 3);

-- Q1 options
INSERT INTO question_options (id, question_id, option_key, next_question_key, resulting_level, order_index) VALUES
  ('opt1-yes', 'q1-uuid', 'yes', 'q2', NULL, 1),  -- Continue to Q2
  ('opt1-no', 'q1-uuid', 'no', NULL, 1, 2);       -- Terminal: Level 1

-- Q2 options  
INSERT INTO question_options (id, question_id, option_key, next_question_key, resulting_level, order_index) VALUES
  ('opt2-yes', 'q2-uuid', 'yes', 'q3', NULL, 1),  -- Continue to Q3
  ('opt2-no', 'q2-uuid', 'no', NULL, 2, 2);       -- Terminal: Level 2

-- Q3 options
INSERT INTO question_options (id, question_id, option_key, next_question_key, resulting_level, order_index) VALUES
  ('opt3-yes', 'q3-uuid', 'yes', NULL, 4, 1),     -- Terminal: Level 4
  ('opt3-no', 'q3-uuid', 'no', NULL, 3, 2);       -- Terminal: Level 3
```

### API Endpoints

```typescript
// Hasura GraphQL endpoint
POST /v1/graphql

// Save dimension score with answers
mutation SaveDimensionScore(
  $evaluationId: uuid!
  $dimensionId: uuid!
  $resultingLevel: Int!
  $answers: jsonb!
) {
  insert_dimension_scores_one(
    object: {
      evaluation_id: $evaluationId
      dimension_id: $dimensionId
      resulting_level: $resultingLevel
      answers: $answers
    }
    on_conflict: {
      constraint: dimension_scores_evaluation_id_dimension_id_key
      update_columns: [resulting_level, answers, updated_at]
    }
  ) {
    id
    resulting_level
    answers
    raw_points
    weighted_points
  }
}
```

## Key Concepts

### 1. Decision Tree Navigation
- Each question has 2+ options (typically yes/no)
- Options either lead to next question OR determine final level
- Navigation is automatic based on user selections

### 2. Audit Trail
- `answers` JSONB stores complete path: `{"q1": "yes", "q2": "no"}`
- Enables:
  - Transparency (how was level determined?)
  - Debugging (trace decision path)
  - Analytics (common patterns)
  - Re-evaluation (if logic changes)

### 3. Scoring
- `resulting_level` (1-7) is determined by decision tree
- `raw_points` looked up from `score_levels` table
- `weighted_points` = `raw_points × dimension.weight`
- All calculation done by database triggers

### 4. Translations
- Questions have translations in multiple languages
- Options have translations for button text
- Query fetches translations based on user's locale

## Common Tasks

### Add a New Question Branch

```sql
-- Add new question
INSERT INTO questions (dimension_id, question_key, order_index) 
VALUES ('dim-uuid', 'q4', 4);

-- Add options
INSERT INTO question_options (question_id, option_key, next_question_key, resulting_level, order_index)
VALUES 
  ('q4-uuid', 'yes', 'q5', NULL, 1),  -- Continue to Q5
  ('q4-uuid', 'no', NULL, 5, 2);      -- Terminal: Level 5
```

### Debug Answer Path

```sql
-- Check saved answers
SELECT 
  e.id as evaluation_id,
  d.code as dimension_code,
  ds.resulting_level,
  ds.answers,
  ds.raw_points,
  ds.weighted_points
FROM dimension_scores ds
JOIN dimensions d ON d.id = ds.dimension_id
JOIN position_evaluations e ON e.id = ds.evaluation_id
WHERE e.id = 'your-evaluation-uuid';
```

### Analyze Common Paths

```sql
-- Find most common answer patterns
SELECT 
  d.code as dimension,
  ds.answers,
  COUNT(*) as frequency
FROM dimension_scores ds
JOIN dimensions d ON d.id = ds.dimension_id
GROUP BY d.code, ds.answers
ORDER BY frequency DESC;
```

## Troubleshooting

### Question doesn't appear
- Check `order_index` is set
- Verify translations exist for user's language
- Check dimension_id references correct dimension

### Navigation doesn't work
- Verify options have either `next_question_key` OR `resulting_level`
- Check `next_question_key` matches existing question's `question_key`
- Ensure `option_key` is consistent ('yes'/'no')

### Points not calculated
- Verify trigger `calculate_dimension_points` is active
- Check `score_levels` table has entry for the resulting level
- Verify `dimension.weight` is set correctly

### Cannot save to database
- Check Hasura permissions for `dimension_scores` table
- Verify user is authenticated
- Check `evaluation_id` and `dimension_id` exist
- Ensure `answers` is valid JSON

## Resources

- [Full Implementation Summary](./questionnaire-system-implementation.md)
- [Database Schema](./database-schema.sql)
- [API Documentation](./api-docs.md)
