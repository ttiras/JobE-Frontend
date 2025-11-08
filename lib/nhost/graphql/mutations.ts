/**
 * GraphQL Mutations
 * 
 * Base mutations for creating, updating, and deleting data via GraphQL API.
 * These will be replaced with generated types from graphql-codegen
 * once the backend schema is implemented.
 * 
 * @see specs/002-nhost-integration/contracts/schema.graphql.md
 */

/**
 * Create a new organization
 */
export const CREATE_ORGANIZATION = `
  mutation CreateOrganization($input: organizations_insert_input!) {
    insert_organizations_one(object: $input) {
      id
      name
      slug
      industry
      employeeCount
      website
      country
      city
      description
      createdAt
    }
  }
`

/**
 * Update an organization
 */
export const UPDATE_ORGANIZATION = `
  mutation UpdateOrganization($id: uuid!, $input: organizations_set_input!) {
    update_organizations_by_pk(pk_columns: { id: $id }, _set: $input) {
      id
      name
      slug
      industry
      employeeCount
      website
      country
      city
      description
      updatedAt
    }
  }
`

/**
 * Delete an organization
 */
export const DELETE_ORGANIZATION = `
  mutation DeleteOrganization($id: uuid!) {
    delete_organizations_by_pk(id: $id) {
      id
    }
  }
`

/**
 * Create a new department
 */
export const CREATE_DEPARTMENT = `
  mutation CreateDepartment($input: departments_insert_input!) {
    insert_departments_one(object: $input) {
      id
      organizationId
      name
      code
      parentDepartmentId
      managerId
      description
      createdAt
    }
  }
`

/**
 * Update a department
 */
export const UPDATE_DEPARTMENT = `
  mutation UpdateDepartment($id: uuid!, $input: departments_set_input!) {
    update_departments_by_pk(pk_columns: { id: $id }, _set: $input) {
      id
      name
      code
      description
      updatedAt
    }
  }
`

/**
 * Delete a department
 */
export const DELETE_DEPARTMENT = `
  mutation DeleteDepartment($id: uuid!) {
    delete_departments_by_pk(id: $id) {
      id
    }
  }
`

/**
 * Create a new position
 */
export const CREATE_POSITION = `
  mutation CreatePosition($input: positions_insert_input!) {
    insert_positions_one(object: $input) {
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
    }
  }
`

/**
 * Update a position
 */
export const UPDATE_POSITION = `
  mutation UpdatePosition($id: uuid!, $input: positions_set_input!) {
    update_positions_by_pk(pk_columns: { id: $id }, _set: $input) {
      id
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
      updatedAt
    }
  }
`

/**
 * Delete a position
 */
export const DELETE_POSITION = `
  mutation DeletePosition($id: uuid!) {
    delete_positions_by_pk(id: $id) {
      id
    }
  }
`

/**
 * Add member to organization
 */
export const ADD_ORGANIZATION_MEMBER = `
  mutation AddOrganizationMember($input: organization_members_insert_input!) {
    insert_organization_members_one(object: $input) {
      id
      organizationId
      userId
      role
      joinedAt
    }
  }
`

/**
 * Update organization member role
 */
export const UPDATE_ORGANIZATION_MEMBER = `
  mutation UpdateOrganizationMember($id: uuid!, $role: String!) {
    update_organization_members_by_pk(pk_columns: { id: $id }, _set: { role: $role }) {
      id
      role
    }
  }
`

/**
 * Remove member from organization
 */
export const REMOVE_ORGANIZATION_MEMBER = `
  mutation RemoveOrganizationMember($id: uuid!) {
    delete_organization_members_by_pk(id: $id) {
      id
    }
  }
`

/**
 * Create position evaluation
 */
export const CREATE_POSITION_EVALUATION = `
  mutation CreatePositionEvaluation($input: position_evaluations_insert_input!) {
    insert_position_evaluations_one(object: $input) {
      id
      positionId
      evaluatedBy
      score
      methodology
      details
      completedAt
      createdAt
    }
  }
`
