'use client';

/**
 * useImportWorkflow Hook
 * 
 * State management for Excel import workflow (Client-side processing)
 * States: IDLE → UPLOADING → PARSING → PREVIEW → CONFIRMING → SUCCESS/ERROR
 * 
 * Features:
 * - File upload handling
 * - Client-side Excel parsing and validation
 * - GraphQL mutation execution for import
 * - Error handling and recovery
 * - State transitions with validation
 */

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ImportWorkflowContext, ImportWorkflowState } from '@/lib/types/import';
import { parseExcelImport } from '@/lib/utils/excel/parser';
import { validateDepartments, validatePositions } from '@/lib/utils/excel/validator';
import { detectDepartmentOperations, detectPositionOperations } from '@/lib/utils/excel/upsert-detector';
import { getImportSummary } from '@/lib/nhost/graphql/mutations/import-workflow';
import { ValidationContext, ValidationStatus } from '@/lib/types/import';
import { executeServerImport } from '@/lib/actions/import';

export interface UseImportWorkflowReturn {
  // State
  context: ImportWorkflowContext;
  
  // Actions
  uploadFile: (fileBuffer: ArrayBuffer, fileName: string) => void;
  parseFile: (importType?: 'departments' | 'positions') => Promise<void>;
  confirmImport: () => Promise<void>;
  cancel: () => void;
  reset: () => void;
  
  // Computed
  canParse: boolean;
  canConfirm: boolean;
  hasErrors: boolean;
  isLoading: boolean;
}

const initialContext: ImportWorkflowContext = {
  state: ImportWorkflowState.IDLE,
  errors: [],
};

export function useImportWorkflow(importType: 'departments' | 'positions' = 'departments'): UseImportWorkflowReturn {
  const params = useParams();
  const organizationId = params.orgId as string;
  const [context, setContext] = useState<ImportWorkflowContext>(initialContext);

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Step 1: Set uploaded file buffer
   */
  const uploadFile = useCallback((fileBuffer: ArrayBuffer, fileName: string) => {
    setContext({
      state: ImportWorkflowState.UPLOADING,
      fileBuffer,
      fileName,
      errors: [],
    });
  }, []);

  /**
   * Step 2: Parse and validate uploaded file
   */
  const parseFile = useCallback(async (type: 'departments' | 'positions' = importType) => {
    console.log('parseFile called with type:', type)
    console.log('context.fileBuffer exists:', !!context.fileBuffer)
    
    if (!context.fileBuffer) {
      console.error('No fileBuffer found')
      setContext(prev => ({
        ...prev,
        state: ImportWorkflowState.ERROR,
        errorMessage: 'No file uploaded',
      }));
      return;
    }

    console.log('Setting state to PARSING')
    setContext(prev => ({
      ...prev,
      state: ImportWorkflowState.PARSING,
    }));

    try {
      console.log('Calling parseExcelImport with type:', type)
      // Parse Excel file with import type
      const excelData = await parseExcelImport(context.fileBuffer, type);
      console.log('Parsed data:', {
        departments: excelData.departments.length,
        positions: excelData.positions.length
      })
      
      // Create validation context
      // TODO: Query existing codes from database for UPDATE detection
      const validDepartmentCodes = new Set(excelData.departments.map(d => d.dept_code));
      const validPositionCodes = new Set(excelData.positions.map(p => p.pos_code));
      
      const validationContext: ValidationContext = {
        departments: excelData.departments,
        positions: excelData.positions,
        validDepartmentCodes,
        validPositionCodes,
        existingDepartmentCodes: new Set(), // TODO: Query from database
        existingPositionCodes: new Set(), // TODO: Query from database
      };
      
      // Validate departments and positions
      const departmentErrors = validateDepartments(validationContext);
      const positionErrors = validatePositions(validationContext);
      const allErrors = [...departmentErrors, ...positionErrors];
      
      // Determine validation status
      const validationStatus = allErrors.length === 0 
        ? ValidationStatus.VALID 
        : ValidationStatus.ERRORS;
      
      // Detect CREATE/UPDATE operations
      // For now, assume all are CREATE operations (no existing codes)
      const departmentsWithOps = detectDepartmentOperations(excelData.departments, new Set());
      const positionsWithOps = detectPositionOperations(excelData.positions, new Set());
      
      // Generate summary
      const summary = getImportSummary(departmentsWithOps, positionsWithOps);
      
      console.log('Setting PREVIEW state with summary:', summary)
      console.log('Validation status:', validationStatus)
      console.log('Errors count:', allErrors.length)
      
      setContext(prev => ({
        ...prev,
        state: ImportWorkflowState.PREVIEW,
        preview: {
          departments: departmentsWithOps,
          positions: positionsWithOps,
          summary,
          validationStatus,
        },
        errors: allErrors,
        parsedData: excelData,
      }));
      
      console.log('PREVIEW state set successfully')
    } catch (error) {
      console.error('Parse exception:', error);
      setContext(prev => ({
        ...prev,
        state: ImportWorkflowState.ERROR,
        errorMessage: error instanceof Error ? error.message : 'Failed to parse file',
      }));
    }
  }, [context.fileBuffer]); // organizationId is from params, not needed in deps

  /**
   * Step 3: Confirm and execute import
   */
  const confirmImport = useCallback(async () => {
    console.log('=== confirmImport called ===')
    console.log('context.preview:', context.preview)
    console.log('organizationId:', organizationId)
    
    if (!context.preview || !organizationId) {
      console.error('Missing preview or organizationId')
      setContext(prev => ({
        ...prev,
        state: ImportWorkflowState.ERROR,
        errorMessage: 'No preview data available or organization not set',
      }));
      return;
    }

    console.log('Setting state to CONFIRMING')
    setContext(prev => ({
      ...prev,
      state: ImportWorkflowState.CONFIRMING,
    }));

    try {
      console.log('Executing server import...')
      console.log('Departments to import:', context.preview.departments.length)
      console.log('Positions to import:', context.preview.positions.length)
      
      // Execute import workflow on server with automatic authentication
      const result = await executeServerImport(
        organizationId,
        context.preview.departments,
        context.preview.positions
      );
      
      console.log('Import workflow result:', result)
      
      // Check if any operations succeeded
      const totalOperations = 
        result.departmentsCreated + result.departmentsUpdated +
        result.positionsCreated + result.positionsUpdated;
      
      console.log('Total operations:', totalOperations)
      
      if (totalOperations > 0) {
        console.log('Setting state to SUCCESS')
        setContext(prev => ({
          ...prev,
          state: ImportWorkflowState.SUCCESS,
          result,
        }));
      } else {
        console.error('No operations completed')
        setContext(prev => ({
          ...prev,
          state: ImportWorkflowState.ERROR,
          errorMessage: 'Import failed - no records were created or updated',
        }));
      }
    } catch (error) {
      console.error('Confirm exception:', error);
      setContext(prev => ({
        ...prev,
        state: ImportWorkflowState.ERROR,
        errorMessage: error instanceof Error ? error.message : 'Failed to import data',
      }));
    }
  }, [context.preview, organizationId]);

  /**
   * Cancel current operation and return to IDLE
   */
  const cancel = useCallback(() => {
    setContext(initialContext);
  }, []);

  /**
   * Reset workflow to initial state
   */
  const reset = useCallback(() => {
    setContext(initialContext);
  }, []);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const canParse = 
    context.state === ImportWorkflowState.UPLOADING && 
    Boolean(context.fileBuffer);

  const canConfirm = 
    context.state === ImportWorkflowState.PREVIEW && 
    context.errors.length === 0 &&
    Boolean(context.preview);

  const hasErrors = 
    context.errors.length > 0 || 
    Boolean(context.errorMessage);

  const isLoading = 
    context.state === ImportWorkflowState.UPLOADING ||
    context.state === ImportWorkflowState.PARSING ||
    context.state === ImportWorkflowState.CONFIRMING;

  return {
    context,
    uploadFile,
    parseFile,
    confirmImport,
    cancel,
    reset,
    canParse,
    canConfirm,
    hasErrors,
    isLoading,
  };
}
