# Position Evaluation Questionnaire System - Implementation Summary

## Overview
Successfully implemented a decision tree questionnaire system for position evaluations. The system replaces the previous incorrect approach where S1-S7 were treated as selectable levels, with a proper yes/no decision tree that determines the resulting level.

## Key Changes

### 1. **Type Definitions**

#### New Files Created:
- **`lib/types/questions.ts`** - Complete type system for questions, options, and answers
  - `Question` - Decision tree question with translations
  - `QuestionOption` - Answer option with next_question_key or resulting_level
  - `DimensionAnswers` - JSONB type storing the decision tree path (e.g., `{"q1": "yes", "q2": "no"}`)

#### Updated Files:
- **`lib/types/evaluation.ts`**
  - Updated `DimensionAnswer` to include `resultingLevel` and `answers` (JSONB)
  - Updated `DimensionScore` to include `answers` field
  - Updated `Dimension` to use `weight` and `translations` (removed old `max_level` and `questions`)

### 2. **GraphQL Layer**

#### New Files:
- **`lib/nhost/graphql/queries/questions.ts`** - Query to fetch dimension questions with options

#### Updated Files:
- **`lib/nhost/graphql/mutations/evaluations.ts`**
  - Updated `SAVE_DIMENSION_SCORE` mutation to accept `answers` (JSONB)
  - Updated `saveDimensionScore()` function signature to include answers parameter

### 3. **Storage Layer**

#### Updated Files:
- **`lib/localStorage/evaluationStorage.ts`**
  - Updated `saveAnswer()` to accept `resultingLevel` and `answers` (JSONB)
  - Updated `loadAnswer()` to handle new data structure
  - Updated `StoredAnswerData` interface

### 4. **Context Layer**

#### Updated Files:
- **`lib/contexts/EvaluationContext.tsx`**
  - Updated `saveCurrentAnswer()` to accept `resultingLevel` and `answers`
  - Updated mutation to pass answers to GraphQL
  - Updated initialization to handle answers from database

### 5. **UI Components**

#### New Components:
- **`components/evaluation/QuestionnaireCard.tsx`**
  - Handles decision tree navigation
  - Displays questions with yes/no options
  - Tracks answers and determines resulting level
  - Auto-saves on completion

#### Updated Components:
- **`components/evaluation/DimensionQuestionCard.tsx`**
  - Simplified to wrap QuestionnaireCard
  - Shows dimension header with weight
  - Passes callbacks to handle completion

#### Deleted Components:
- **`components/evaluation/LevelSelector.tsx`** - No longer needed

### 6. **Evaluation Page**

#### Updated Files:
- **`app/[locale]/dashboard/[orgId]/evaluation/[evaluationId]/client.tsx`**
  - Added `handleDimensionComplete()` - handles questionnaire completion with resulting level and answers
  - Updated `GET_EVALUATION_DIMENSIONS` query to fetch `weight` and `translations` instead of old structure
  - Updated dimension rendering to use new `DimensionQuestionCard` props
  - Removed old level selection logic

## Data Flow

### Before (Incorrect):
```
User selects "S3" → Save level = 3 → Done
```

### After (Correct):
```
1. User sees Q1: "Does role require training?"
2. User clicks "YES" → Navigate to Q2
3. User sees Q2: "Does role require deep expertise?"
4. User clicks "NO" → Determine level = 2
5. Save:
   - resulting_level = 2
   - answers = {"q1": "yes", "q2": "no"}
   - raw_points (auto-calculated by trigger)
   - weighted_points (auto-calculated by trigger)
6. Navigate to next dimension
```

## Database Structure

### Questions Table
```sql
questions (
  id UUID PRIMARY KEY,
  dimension_id UUID REFERENCES dimensions,
  question_key VARCHAR, -- 'q1', 'q2', etc.
  order_index INT
)
```

### Question Options Table
```sql
question_options (
  id UUID PRIMARY KEY,
  question_id UUID REFERENCES questions,
  option_key VARCHAR, -- 'yes' or 'no'
  next_question_key VARCHAR NULL, -- Next question (if continues)
  resulting_level INT NULL, -- Final level (if terminal)
  order_index INT
)
```

### Dimension Scores Table
```sql
dimension_scores (
  evaluation_id UUID,
  dimension_id UUID,
  resulting_level INT, -- 1-7, determined by questionnaire
  answers JSONB, -- {"q1": "yes", "q2": "no"}
  raw_points DECIMAL, -- Auto-calculated
  weighted_points DECIMAL, -- Auto-calculated
  PRIMARY KEY (evaluation_id, dimension_id)
)
```

## Key Features

### 1. **Decision Tree Navigation**
- Questions have options that either continue to next question or determine final level
- Automatic navigation through the tree
- State preservation for resuming

### 2. **Audit Trail**
- `answers` JSONB field stores complete path through decision tree
- Enables transparency and debugging
- Supports analytics on common paths

### 3. **Auto-Calculation**
- Database triggers automatically calculate `raw_points` and `weighted_points`
- Frontend doesn't need to know scoring logic
- Ensures consistency

### 4. **Progress Tracking**
- Questionnaire shows current question number
- Shows number of questions answered
- Persists state in localStorage

### 5. **Error Handling**
- Loading states for fetching questions
- Error messages for failed queries
- Validation before saving

## Testing Checklist

- [ ] Questions load correctly for each dimension
- [ ] Decision tree navigation works (yes/no buttons)
- [ ] Terminal nodes save resulting level correctly
- [ ] Answers JSONB is saved properly
- [ ] Database triggers calculate points correctly
- [ ] Progress persists in localStorage
- [ ] Can resume from where left off
- [ ] Auto-finalization works after last dimension
- [ ] Results page shows correct scores

## Migration Notes

### For Existing Evaluations:
If there are existing evaluations with the old system (direct level selection), they will need to be migrated:

1. Map old `resulting_level` values to appropriate `answers` JSONB
2. Create a migration script to generate plausible decision paths
3. Or mark old evaluations as legacy and start fresh with new system

### Database Changes Required:
- Add `answers` JSONB column to `dimension_scores` table
- Ensure `dimension_translations` table exists with `language` column
- Ensure `dimensions` table has `weight` column
- Create `questions` and `question_options` tables if they don't exist
- Create translation tables for questions and options
- Update triggers to handle new structure

## Future Enhancements

1. **Question Branching Visualization**
   - Show decision tree diagram
   - Highlight current path

2. **Question History**
   - Allow going back to previous questions
   - Show summary of all answers before finalizing

3. **Conditional Questions**
   - More complex branching logic
   - Skip questions based on previous answers

4. **Question Bank**
   - Reusable questions across dimensions
   - Version control for questions

5. **Analytics**
   - Track most common paths
   - Identify ambiguous questions
   - Measure completion times

## Documentation

- Code is fully commented with JSDoc
- Type definitions include descriptions
- GraphQL queries are documented with usage notes
- Component props are clearly typed

## Conclusion

The questionnaire system is now properly implemented according to the specification. The system uses a decision tree approach where yes/no questions determine the resulting level, rather than allowing users to directly select levels. All data is properly stored including the audit trail of answers, and scoring is automatically calculated by database triggers.
