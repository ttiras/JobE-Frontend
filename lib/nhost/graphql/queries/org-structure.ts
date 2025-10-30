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
    departments_aggregate(where: { organizationId: { _eq: $organizationId }, isActive: { _eq: true } }) {
      aggregate {
        count
      }
    }
    positions_aggregate(where: { organizationId: { _eq: $organizationId }, isActive: { _eq: true } }) {
      aggregate {
        count
      }
    }
    evaluated_positions: positions_aggregate(
      where: { 
        organizationId: { _eq: $organizationId }, 
        isActive: { _eq: true },
        evaluations: { completedAt: { _is_null: false } }
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
