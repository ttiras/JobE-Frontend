/**
 * GraphQL Mutations Index
 * 
 * Exports all GraphQL mutations for departments, positions, and import workflow
 */

// Department mutations
export {
  INSERT_DEPARTMENTS,
  INSERT_DEPARTMENT,
  UPDATE_DEPARTMENTS_BULK,
  UPDATE_DEPARTMENT,
  UPSERT_DEPARTMENTS,
  DELETE_DEPARTMENT,
  DELETE_DEPARTMENTS_BULK,
} from './departments';

// Position mutations
export {
  INSERT_POSITIONS,
  INSERT_POSITION,
  UPDATE_POSITIONS_BULK,
  UPDATE_POSITION,
  UPSERT_POSITIONS,
  DELETE_POSITION,
  DELETE_POSITIONS_BULK,
} from './positions';

// Import workflow (client-side processing utilities)
// Note: The actual import execution now happens via Server Actions (lib/actions/import.ts)
// This exports utility functions like getImportSummary for client-side use
export * from './import';
