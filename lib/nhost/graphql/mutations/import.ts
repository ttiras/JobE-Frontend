/**
 * GraphQL mutations for Excel Import feature
 * 
 * NOTE: This module exports client-side import workflow functions.
 * Backend GraphQL mutations (parseImportFile, confirmImport) would need to be
 * implemented in Hasura/Nhost for a full backend solution.
 * 
 * Current implementation uses direct GraphQL mutations from:
 * - departments.ts (CRUD operations)
 * - positions.ts (CRUD operations)
 * - import-workflow.ts (orchestration)
 */

// Export the client-side import workflow
export * from './import-workflow';
