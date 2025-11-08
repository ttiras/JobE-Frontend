/**
 * Unit Tests for Excel Validator (Focus on Circular References)
 * 
 * Tests: T019 [US1]
 * Following TDD: These tests should FAIL initially until full implementation
 */

import {
  validateCircularReferences,
  validateDepartmentRequiredFields,
  validatePositionRequiredFields,
  validateDuplicateDepartmentCodes,
  validateDuplicatePositionCodes,
  validateDepartmentReferences,
  validatePositionReferences,
  validateDepartments,
  validatePositions,
} from '@/lib/utils/excel/validator';
import {
  DepartmentRow,
  PositionRow,
  SheetType,
  ErrorType,
  ValidationContext,
} from '@/lib/types/import';

describe('Excel Validator', () => {
  describe('validateCircularReferences (DFS Algorithm)', () => {
    it('should detect simple circular reference in departments (A -> B -> A)', () => {
      const departments: DepartmentRow[] = [
        { dept_code: 'A', name: 'Dept A', parent_dept_code: 'B', excelRow: 2 },
        { dept_code: 'B', name: 'Dept B', parent_dept_code: 'A', excelRow: 3 },
      ];

      const errors = validateCircularReferences(
        departments,
        (d) => d.dept_code,
        (d) => d.parent_dept_code,
        SheetType.DEPARTMENTS
      );

      expect(errors).toHaveLength(2);
      expect(errors[0].type).toBe(ErrorType.CIRCULAR_REFERENCE);
      expect(errors[0].affectedCodes).toContain('A');
      expect(errors[0].affectedCodes).toContain('B');
    });

    it('should detect longer circular reference (A -> B -> C -> A)', () => {
      const departments: DepartmentRow[] = [
        { dept_code: 'A', name: 'Dept A', parent_dept_code: 'B', excelRow: 2 },
        { dept_code: 'B', name: 'Dept B', parent_dept_code: 'C', excelRow: 3 },
        { dept_code: 'C', name: 'Dept C', parent_dept_code: 'A', excelRow: 4 },
      ];

      const errors = validateCircularReferences(
        departments,
        (d) => d.dept_code,
        (d) => d.parent_dept_code,
        SheetType.DEPARTMENTS
      );

      expect(errors.length).toBeGreaterThan(0);
      const cycleError = errors[0];
      expect(cycleError.type).toBe(ErrorType.CIRCULAR_REFERENCE);
      expect(cycleError.message).toContain('→');
    });

    it('should detect self-reference (A -> A)', () => {
      const departments: DepartmentRow[] = [
        { dept_code: 'A', name: 'Dept A', parent_dept_code: 'A', excelRow: 2 },
      ];

      const errors = validateCircularReferences(
        departments,
        (d) => d.dept_code,
        (d) => d.parent_dept_code,
        SheetType.DEPARTMENTS
      );

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(ErrorType.CIRCULAR_REFERENCE);
      expect(errors[0].affectedCodes).toContain('A');
    });

    it('should NOT report error for valid hierarchy (no cycles)', () => {
      const departments: DepartmentRow[] = [
        { dept_code: 'ROOT', name: 'Root', parent_dept_code: null, excelRow: 2 },
        { dept_code: 'A', name: 'Dept A', parent_dept_code: 'ROOT', excelRow: 3 },
        { dept_code: 'B', name: 'Dept B', parent_dept_code: 'ROOT', excelRow: 4 },
        { dept_code: 'A1', name: 'Dept A1', parent_dept_code: 'A', excelRow: 5 },
      ];

      const errors = validateCircularReferences(
        departments,
        (d) => d.dept_code,
        (d) => d.parent_dept_code,
        SheetType.DEPARTMENTS
      );

      expect(errors).toHaveLength(0);
    });

    it('should detect circular reference in positions reporting structure', () => {
      const positions: PositionRow[] = [
        { pos_code: 'P1', title: 'Pos 1', dept_code: 'D1', reports_to_pos_code: 'P2', is_manager: true, incumbents_count: 1, excelRow: 2 },
        { pos_code: 'P2', title: 'Pos 2', dept_code: 'D1', reports_to_pos_code: 'P1', is_manager: true, incumbents_count: 1, excelRow: 3 },
      ];

      const errors = validateCircularReferences(
        positions,
        (p) => p.pos_code,
        (p) => p.reports_to_pos_code,
        SheetType.POSITIONS
      );

      expect(errors).toHaveLength(2);
      expect(errors[0].type).toBe(ErrorType.CIRCULAR_REFERENCE);
    });

    it('should handle complex graph with multiple disconnected components', () => {
      const departments: DepartmentRow[] = [
        // Component 1: Valid tree
        { dept_code: 'A', name: 'Dept A', parent_dept_code: null, excelRow: 2 },
        { dept_code: 'A1', name: 'Dept A1', parent_dept_code: 'A', excelRow: 3 },
        // Component 2: Circular
        { dept_code: 'B', name: 'Dept B', parent_dept_code: 'C', excelRow: 4 },
        { dept_code: 'C', name: 'Dept C', parent_dept_code: 'B', excelRow: 5 },
      ];

      const errors = validateCircularReferences(
        departments,
        (d) => d.dept_code,
        (d) => d.parent_dept_code,
        SheetType.DEPARTMENTS
      );

      expect(errors.length).toBeGreaterThan(0);
      // Should only report cycle in Component 2
      const affectedCodes = errors.flatMap(e => e.affectedCodes || []);
      expect(affectedCodes).toContain('B');
      expect(affectedCodes).toContain('C');
    });
  });

  describe('validateDepartmentRequiredFields', () => {
    it('should detect missing dept_code', () => {
      const departments: DepartmentRow[] = [
        { dept_code: '', name: 'Valid Dept', excelRow: 2 },
      ];

      const errors = validateDepartmentRequiredFields(departments);

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(ErrorType.MISSING_REQUIRED_FIELD);
      expect(errors[0].column).toBe('dept_code');
    });

    it('should detect missing name', () => {
      const departments: DepartmentRow[] = [
        { dept_code: 'D1', name: '', excelRow: 2 },
      ];

      const errors = validateDepartmentRequiredFields(departments);

      expect(errors).toHaveLength(1);
      expect(errors[0].column).toBe('name');
    });

    it('should detect invalid JSON in metadata', () => {
      const departments: DepartmentRow[] = [
        { dept_code: 'D1', name: 'Dept 1', metadata: '{invalid json', excelRow: 2 },
      ];

      const errors = validateDepartmentRequiredFields(departments);

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(ErrorType.INVALID_JSON);
    });

    it('should pass for valid departments', () => {
      const departments: DepartmentRow[] = [
        { dept_code: 'D1', name: 'Dept 1', excelRow: 2 },
        { dept_code: 'D2', name: 'Dept 2', metadata: '{"key": "value"}', excelRow: 3 },
      ];

      const errors = validateDepartmentRequiredFields(departments);

      expect(errors).toHaveLength(0);
    });
  });

  describe('validatePositionRequiredFields', () => {
    it('should detect missing pos_code', () => {
      const positions: PositionRow[] = [
        { pos_code: '', title: 'Valid Title', dept_code: 'D1', is_manager: false, incumbents_count: 1, excelRow: 2 },
      ];

      const errors = validatePositionRequiredFields(positions);

      expect(errors).toHaveLength(1);
      expect(errors[0].column).toBe('pos_code');
    });

    it('should detect missing title', () => {
      const positions: PositionRow[] = [
        { pos_code: 'P1', title: '', dept_code: 'D1', is_manager: false, incumbents_count: 1, excelRow: 2 },
      ];

      const errors = validatePositionRequiredFields(positions);

      expect(errors).toHaveLength(1);
      expect(errors[0].column).toBe('title');
    });

    it('should detect missing dept_code', () => {
      const positions: PositionRow[] = [
        { pos_code: 'P1', title: 'Title', dept_code: '', is_manager: false, incumbents_count: 1, excelRow: 2 },
      ];

      const errors = validatePositionRequiredFields(positions);

      expect(errors).toHaveLength(1);
      expect(errors[0].column).toBe('dept_code');
    });
  });

  describe('validateDuplicateDepartmentCodes', () => {
    it('should detect duplicate codes', () => {
      const departments: DepartmentRow[] = [
        { dept_code: 'D1', name: 'Dept 1', excelRow: 2 },
        { dept_code: 'D1', name: 'Dept 1 Duplicate', excelRow: 5 },
      ];

      const errors = validateDuplicateDepartmentCodes(departments);

      expect(errors).toHaveLength(2);
      expect(errors[0].type).toBe(ErrorType.DUPLICATE_CODE_IN_FILE);
      expect(errors[0].affectedCodes).toContain('D1');
    });

    it('should pass for unique codes', () => {
      const departments: DepartmentRow[] = [
        { dept_code: 'D1', name: 'Dept 1', excelRow: 2 },
        { dept_code: 'D2', name: 'Dept 2', excelRow: 3 },
      ];

      const errors = validateDuplicateDepartmentCodes(departments);

      expect(errors).toHaveLength(0);
    });
  });

  describe('validateDuplicatePositionCodes', () => {
    it('should detect duplicate codes', () => {
      const positions: PositionRow[] = [
        { pos_code: 'P1', title: 'Pos 1', dept_code: 'D1', is_manager: false, incumbents_count: 1, excelRow: 2 },
        { pos_code: 'P1', title: 'Pos 1 Duplicate', dept_code: 'D1', is_manager: false, incumbents_count: 1, excelRow: 5 },
      ];

      const errors = validateDuplicatePositionCodes(positions);

      expect(errors).toHaveLength(2);
      expect(errors[0].type).toBe(ErrorType.DUPLICATE_CODE_IN_FILE);
    });
  });

  describe('validateDepartmentReferences', () => {
    it('should detect invalid parent reference', () => {
      const departments: DepartmentRow[] = [
        { dept_code: 'D1', name: 'Dept 1', parent_dept_code: 'NON_EXISTENT', excelRow: 2 },
      ];
      const validCodes = new Set(['D1']);

      const errors = validateDepartmentReferences(departments, validCodes);

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(ErrorType.INVALID_REFERENCE);
      expect(errors[0].affectedCodes).toContain('NON_EXISTENT');
    });

    it('should pass for valid references', () => {
      const departments: DepartmentRow[] = [
        { dept_code: 'D1', name: 'Dept 1', parent_dept_code: null, excelRow: 2 },
        { dept_code: 'D2', name: 'Dept 2', parent_dept_code: 'D1', excelRow: 3 },
      ];
      const validCodes = new Set(['D1', 'D2']);

      const errors = validateDepartmentReferences(departments, validCodes);

      expect(errors).toHaveLength(0);
    });
  });

  describe('validatePositionReferences', () => {
    it('should detect invalid department reference', () => {
      const positions: PositionRow[] = [
        { pos_code: 'P1', title: 'Pos 1', dept_code: 'NON_EXISTENT', is_manager: false, incumbents_count: 1, excelRow: 2 },
      ];
      const validDeptCodes = new Set<string>();
      const validPosCodes = new Set(['P1']);

      const errors = validatePositionReferences(positions, validDeptCodes, validPosCodes);

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(ErrorType.INVALID_REFERENCE);
      expect(errors[0].column).toBe('dept_code');
    });

    it('should detect invalid reporting_to reference', () => {
      const positions: PositionRow[] = [
        { pos_code: 'P1', title: 'Pos 1', dept_code: 'D1', reports_to_pos_code: 'NON_EXISTENT', is_manager: false, incumbents_count: 1, excelRow: 2 },
      ];
      const validDeptCodes = new Set(['D1']);
      const validPosCodes = new Set(['P1']);

      const errors = validatePositionReferences(positions, validDeptCodes, validPosCodes);

      expect(errors).toHaveLength(1);
      expect(errors[0].column).toBe('reports_to_pos_code');
    });
  });

  describe('validateDepartments (Complete Workflow)', () => {
    it('should run all department validations', () => {
      const context: ValidationContext = {
        departments: [
          { dept_code: '', name: 'Missing Code', excelRow: 2 },
          { dept_code: 'D1', name: 'Valid', parent_dept_code: 'NON_EXISTENT', excelRow: 3 },
        ],
        positions: [],
        validDepartmentCodes: new Set(['D1']),
        validPositionCodes: new Set(),
        existingDepartmentCodes: new Set(),
        existingPositionCodes: new Set(),
      };

      const errors = validateDepartments(context);

      expect(errors.length).toBeGreaterThan(0);
      const errorTypes = errors.map(e => e.type);
      expect(errorTypes).toContain(ErrorType.MISSING_REQUIRED_FIELD);
      expect(errorTypes).toContain(ErrorType.INVALID_REFERENCE);
    });
  });

  describe('validatePositions (Complete Workflow)', () => {
    it('should run all position validations', () => {
      const context: ValidationContext = {
        departments: [],
        positions: [
          { pos_code: '', title: 'Missing Code', dept_code: 'D1', is_manager: false, incumbents_count: 1, excelRow: 2 },
        ],
        validDepartmentCodes: new Set(['D1']),
        validPositionCodes: new Set(),
        existingDepartmentCodes: new Set(),
        existingPositionCodes: new Set(),
      };

      const errors = validatePositions(context);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].type).toBe(ErrorType.MISSING_REQUIRED_FIELD);
    });
  });
});
