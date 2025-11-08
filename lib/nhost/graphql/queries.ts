/**
 * GraphQL Queries
 * 
 * Base queries for fetching data from the GraphQL API.
 * These will be replaced with generated types from graphql-codegen
 * once the backend schema is implemented.
 * 
 * @see specs/002-nhost-integration/contracts/schema.graphql.md
 */

// Re-export organized queries
export * from './queries/org-structure'

/**
 * Get current user profile
 */
export const GET_USER_PROFILE = `
  query GetUserProfile {
    user {
      id
      email
      displayName
      avatarUrl
      emailVerified
      phoneNumber
      phoneNumberVerified
      defaultRole
      roles
      locale
      createdAt
      metadata
    }
  }
`

/**
 * Get user organizations
 */
export const GET_USER_ORGANIZATIONS = `
  query GetUserOrganizations($userId: uuid!) {
    organizations(where: { members: { userId: { _eq: $userId } } }) {
      id
      name
      slug
      industry
      employeeCount
      website
      country
      city
      createdAt
      updatedAt
      members(where: { userId: { _eq: $userId } }) {
        role
        is_active
      }
    }
  }
`

/**
 * Get organization by ID
 */
export const GET_ORGANIZATION = `
  query GetOrganization($id: uuid!) {
    organization: organizations_by_pk(id: $id) {
      id
      name
      slug
      industry
      employeeCount
      website
      country
      city
      description
      logoFileId
      createdAt
      updatedAt
      members {
        id
        userId
        role
        is_active
        joinedAt
        user {
          id
          displayName
          email
          avatarUrl
        }
      }
    }
  }
`

/**
 * Get organization positions
 */
export const GET_ORGANIZATION_POSITIONS = `
  query GetOrganizationPositions($organizationId: uuid!) {
    positions(where: { organization_id: { _eq: $organizationId } }) {
      id
      organizationId
      departmentId
      title
      code
      description
      employmentType
      location
      salaryMin
      salaryMax
      salaryCurrency
      requiredEducation
      requiredExperience
      requiredSkills
      responsibilities
      benefits
      is_active
      createdAt
      updatedAt
      department {
        id
        name
      }
    }
  }
`

/**
 * Get position by ID
 */
export const GET_POSITION = `
  query GetPosition($id: uuid!) {
    position: positions_by_pk(id: $id) {
      id
      organizationId
      departmentId
      title
      code
      description
      employmentType
      location
      salaryMin
      salaryMax
      salaryCurrency
      requiredEducation
      requiredExperience
      requiredSkills
      responsibilities
      benefits
      is_active
      createdAt
      updatedAt
      department {
        id
        name
      }
      evaluations {
        id
        evaluatedBy
        score
        methodology
        completedAt
      }
    }
  }
`

/**
 * Get organization departments
 */
export const GET_ORGANIZATION_DEPARTMENTS = `
  query GetOrganizationDepartments($organizationId: uuid!) {
    departments(where: { organization_id: { _eq: $organizationId } }) {
      id
      organizationId
      name
      code
      parentDepartmentId
      managerId
      description
      is_active
      createdAt
      updatedAt
      positions_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`
