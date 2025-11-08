/**
 * Organization Structure Queries
 * 
 * Queries for fetching organization structure statistics and counts
 */

/**
 * Get organization structure statistics
 * Returns counts of departments, positions, and evaluated positions
 */
export const GET_ORG_STRUCTURE_STATS = `
  query GetOrgStructureStats($organizationId: uuid!) {
    departments_aggregate(where: { organization_id: { _eq: $organizationId }, is_active: { _eq: true } }) {
      aggregate {
        count
      }
    }
    positions_aggregate(where: { organization_id: { _eq: $organizationId }, is_active: { _eq: true } }) {
      aggregate {
        count
      }
    }
    evaluated_positions: positions_aggregate(
      where: { 
        organization_id: { _eq: $organizationId }, 
        is_active: { _eq: true },
        position_evaluations: { completed_at: { _is_null: false } }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`

/**
 * Type for org structure stats response
 */
export interface OrgStructureStats {
  departments_aggregate: {
    aggregate: {
      count: number
    }
  }
  positions_aggregate: {
    aggregate: {
      count: number
    }
  }
  evaluated_positions: {
    aggregate: {
      count: number
    }
  }
}

/**
 * Helper to extract counts from the query response
 */
export function extractOrgStructureCounts(data: OrgStructureStats) {
  return {
    departmentCount: data.departments_aggregate.aggregate.count,
    positionCount: data.positions_aggregate.aggregate.count,
    evaluatedCount: data.evaluated_positions.aggregate.count,
  }
}

/**
 * Get existing department codes for validation
 * Used during import to check which departments exist in DB
 */
export const GET_EXISTING_DEPT_CODES = `
  query GetExistingDeptCodes($organization_id: uuid!) {
    departments(where: { organization_id: { _eq: $organization_id } }) {
      id
      dept_code
    }
  }
`;

/**
 * Get existing position codes for validation
 * Used during import to check which positions exist in DB
 */
export const GET_EXISTING_POS_CODES = `
  query GetExistingPosCodes($organization_id: uuid!) {
    positions(where: { organization_id: { _eq: $organization_id } }) {
      id
      pos_code
    }
  }
`;

/**
 * Type for existing codes response
 */
export interface ExistingCodesResponse {
  departments?: { id: string; dept_code: string }[];
  positions?: { id: string; pos_code: string }[];
}

/**
 * Helper to extract code sets from query response
 */
export function extractExistingCodes(data: ExistingCodesResponse) {
  const deptCodes = new Set<string>();
  const posCodes = new Set<string>();
  
  if (data.departments) {
    data.departments.forEach(d => deptCodes.add(d.dept_code));
  }
  
  if (data.positions) {
    data.positions.forEach(p => posCodes.add(p.pos_code));
  }
  
  return { deptCodes, posCodes };
}
