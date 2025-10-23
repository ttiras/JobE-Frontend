/**
 * GraphQL Queries
 * 
 * Base queries for fetching data from the GraphQL API.
 * These will be replaced with generated types from graphql-codegen
 * once the backend schema is implemented.
 * 
 * @see specs/002-nhost-integration/contracts/schema.graphql.md
 */

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
        isActive
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
        isActive
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
    positions(where: { organizationId: { _eq: $organizationId } }) {
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
      isActive
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
      isActive
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
    departments(where: { organizationId: { _eq: $organizationId } }) {
      id
      organizationId
      name
      code
      parentDepartmentId
      managerId
      description
      isActive
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
