# GraphQL Schema for Nhost Integration

## Overview

This GraphQL schema defines the API contract for querying and mutating data in the Nhost PostgreSQL database via Hasura GraphQL Engine. Auto-generated TypeScript types will be created from this schema using `graphql-codegen`.

---

## Core Types

### User

```graphql
type User {
  id: uuid!
  email: String!
  emailVerified: Boolean!
  displayName: String
  avatarUrl: String
  locale: String!
  defaultRole: String!
  disabled: Boolean!
  createdAt: timestamptz!
  updatedAt: timestamptz!
  
  # Relationships
  roles: [UserRole!]!
  organizations: [Organization!]!
  applications: [Application!]!
  files: [File!]!
}
```

### Role

```graphql
type Role {
  id: uuid!
  name: String!
  description: String
  createdAt: timestamptz!
  
  # Relationships
  userRoles: [UserRole!]!
}
```

### UserRole

```graphql
type UserRole {
  id: uuid!
  userId: uuid!
  roleId: uuid!
  createdAt: timestamptz!
  
  # Relationships
  user: User!
  role: Role!
}
```

### Organization

```graphql
type Organization {
  id: uuid!
  name: String!
  description: String
  industry: String
  website: String
  logoFileId: uuid
  createdBy: uuid!
  createdAt: timestamptz!
  updatedAt: timestamptz!
  
  # Relationships
  creator: User!
  logo: File
  positions: [Position!]!
}
```

### Position

```graphql
type Position {
  id: uuid!
  organizationId: uuid!
  title: String!
  description: String!
  requirements: String
  location: String
  employmentType: String
  salaryMin: Int
  salaryMax: Int
  currency: String!
  status: String!
  questionnaireId: uuid
  createdBy: uuid!
  createdAt: timestamptz!
  updatedAt: timestamptz!
  publishedAt: timestamptz
  closedAt: timestamptz
  
  # Relationships
  organization: Organization!
  creator: User!
  questionnaire: Questionnaire
  applications: [Application!]!
}
```

### Questionnaire

```graphql
type Questionnaire {
  id: uuid!
  title: String!
  description: String
  questions: jsonb!
  scoringRules: jsonb
  createdBy: uuid!
  createdAt: timestamptz!
  updatedAt: timestamptz!
  
  # Relationships
  creator: User!
  positions: [Position!]!
}
```

### Application

```graphql
type Application {
  id: uuid!
  positionId: uuid!
  userId: uuid!
  status: String!
  answers: jsonb
  score: numeric
  resumeFileId: uuid
  coverLetter: String
  notes: String
  submittedAt: timestamptz!
  reviewedAt: timestamptz
  reviewedBy: uuid
  updatedAt: timestamptz!
  
  # Relationships
  position: Position!
  user: User!
  reviewer: User
  resume: File
}
```

### File

```graphql
type File {
  id: uuid!
  bucketId: String!
  name: String!
  size: Int!
  mimeType: String!
  uploadedByUserId: uuid!
  createdAt: timestamptz!
  updatedAt: timestamptz!
  
  # Relationships
  uploader: User!
  metadata: FileMetadata
}
```

### FileMetadata

```graphql
type FileMetadata {
  id: uuid!
  category: String!
  description: String
  malwareScanStatus: String!
  malwareScanAt: timestamptz
  
  # Relationships
  file: File!
}
```

---

## Query Operations

### Authentication Queries

```graphql
type Query {
  # Get current authenticated user
  me: User
  
  # Get user by ID (admin only)
  user(id: uuid!): User
  
  # List users (admin only, paginated)
  users(
    limit: Int = 10
    offset: Int = 0
    where: UserBoolExp
    orderBy: [UserOrderBy!]
  ): [User!]!
}
```

### Organization Queries

```graphql
type Query {
  # Get organization by ID
  organization(id: uuid!): Organization
  
  # List organizations (paginated, filterable)
  organizations(
    limit: Int = 10
    offset: Int = 0
    where: OrganizationBoolExp
    orderBy: [OrganizationOrderBy!]
  ): [Organization!]!
  
  # Get user's organizations
  myOrganizations: [Organization!]!
}
```

### Position Queries

```graphql
type Query {
  # Get position by ID
  position(id: uuid!): Position
  
  # List published positions (public)
  positions(
    limit: Int = 10
    offset: Int = 0
    where: PositionBoolExp
    orderBy: [PositionOrderBy!]
  ): [Position!]!
  
  # Search positions (full-text search)
  searchPositions(
    query: String!
    limit: Int = 10
    offset: Int = 0
  ): [Position!]!
  
  # Get organization's positions
  positionsByOrganization(
    organizationId: uuid!
    status: String
  ): [Position!]!
}
```

### Application Queries

```graphql
type Query {
  # Get application by ID
  application(id: uuid!): Application
  
  # Get user's applications
  myApplications(
    status: String
    limit: Int = 10
    offset: Int = 0
  ): [Application!]!
  
  # Get position's applications (employer only)
  applicationsByPosition(
    positionId: uuid!
    status: String
    limit: Int = 10
    offset: Int = 0
  ): [Application!]!
}
```

### File Queries

```graphql
type Query {
  # Get file by ID
  file(id: uuid!): File
  
  # Get user's files
  myFiles(
    category: String
    limit: Int = 10
    offset: Int = 0
  ): [File!]!
  
  # Get presigned download URL
  getFileDownloadUrl(fileId: uuid!): String!
}
```

---

## Mutation Operations

### Authentication Mutations

Note: Most auth mutations handled by Nhost SDK directly, not GraphQL

### Organization Mutations

```graphql
type Mutation {
  # Create organization
  createOrganization(
    name: String!
    description: String
    industry: String
    website: String
    logoFileId: uuid
  ): Organization!
  
  # Update organization
  updateOrganization(
    id: uuid!
    name: String
    description: String
    industry: String
    website: String
    logoFileId: uuid
  ): Organization!
  
  # Delete organization
  deleteOrganization(id: uuid!): Boolean!
}
```

### Position Mutations

```graphql
type Mutation {
  # Create position
  createPosition(
    organizationId: uuid!
    title: String!
    description: String!
    requirements: String
    location: String
    employmentType: String
    salaryMin: Int
    salaryMax: Int
    currency: String
    questionnaireId: uuid
  ): Position!
  
  # Update position
  updatePosition(
    id: uuid!
    title: String
    description: String
    requirements: String
    location: String
    employmentType: String
    salaryMin: Int
    salaryMax: Int
    currency: String
    status: String
    questionnaireId: uuid
  ): Position!
  
  # Delete position
  deletePosition(id: uuid!): Boolean!
  
  # Publish position
  publishPosition(id: uuid!): Position!
  
  # Close position
  closePosition(id: uuid!): Position!
}
```

### Questionnaire Mutations

```graphql
type Mutation {
  # Create questionnaire
  createQuestionnaire(
    title: String!
    description: String
    questions: jsonb!
    scoringRules: jsonb
  ): Questionnaire!
  
  # Update questionnaire
  updateQuestionnaire(
    id: uuid!
    title: String
    description: String
    questions: jsonb
    scoringRules: jsonb
  ): Questionnaire!
  
  # Delete questionnaire
  deleteQuestionnaire(id: uuid!): Boolean!
}
```

### Application Mutations

```graphql
type Mutation {
  # Submit application
  submitApplication(
    positionId: uuid!
    answers: jsonb
    resumeFileId: uuid
    coverLetter: String
  ): Application!
  
  # Update application (candidate - limited fields)
  updateMyApplication(
    id: uuid!
    answers: jsonb
    resumeFileId: uuid
    coverLetter: String
  ): Application!
  
  # Update application status (employer/admin only)
  updateApplicationStatus(
    id: uuid!
    status: String!
    notes: String
  ): Application!
  
  # Delete application (candidate only, before review)
  deleteMyApplication(id: uuid!): Boolean!
}
```

### File Mutations

Note: File upload/delete handled by Nhost Storage SDK, not GraphQL

```graphql
type Mutation {
  # Update file metadata
  updateFileMetadata(
    id: uuid!
    category: String
    description: String
  ): FileMetadata!
}
```

---

## Subscription Operations

### Real-time Data Subscriptions

```graphql
type Subscription {
  # Subscribe to position updates
  position(id: uuid!): Position!
  
  # Subscribe to new applications for a position
  applicationsByPosition(positionId: uuid!): [Application!]!
  
  # Subscribe to user's application updates
  myApplications: [Application!]!
  
  # Subscribe to organization's positions
  positionsByOrganization(organizationId: uuid!): [Position!]!
}
```

---

## Input Types

### Filter Types (Boolean Expressions)

```graphql
input UserBoolExp {
  id: UuidComparisonExp
  email: StringComparisonExp
  displayName: StringComparisonExp
  disabled: BooleanComparisonExp
  createdAt: TimestamptzComparisonExp
  _and: [UserBoolExp!]
  _or: [UserBoolExp!]
  _not: UserBoolExp
}

input OrganizationBoolExp {
  id: UuidComparisonExp
  name: StringComparisonExp
  industry: StringComparisonExp
  createdBy: UuidComparisonExp
  createdAt: TimestamptzComparisonExp
  _and: [OrganizationBoolExp!]
  _or: [OrganizationBoolExp!]
  _not: OrganizationBoolExp
}

input PositionBoolExp {
  id: UuidComparisonExp
  title: StringComparisonExp
  description: StringComparisonExp
  status: StringComparisonExp
  organizationId: UuidComparisonExp
  createdAt: TimestamptzComparisonExp
  _and: [PositionBoolExp!]
  _or: [PositionBoolExp!]
  _not: PositionBoolExp
}

input ApplicationBoolExp {
  id: UuidComparisonExp
  positionId: UuidComparisonExp
  userId: UuidComparisonExp
  status: StringComparisonExp
  submittedAt: TimestamptzComparisonExp
  _and: [ApplicationBoolExp!]
  _or: [ApplicationBoolExp!]
  _not: ApplicationBoolExp
}
```

### Comparison Operators

```graphql
input UuidComparisonExp {
  _eq: uuid
  _neq: uuid
  _in: [uuid!]
  _nin: [uuid!]
  _is_null: Boolean
}

input StringComparisonExp {
  _eq: String
  _neq: String
  _in: [String!]
  _nin: [String!]
  _like: String
  _ilike: String
  _is_null: Boolean
}

input BooleanComparisonExp {
  _eq: Boolean
  _neq: Boolean
  _is_null: Boolean
}

input TimestamptzComparisonExp {
  _eq: timestamptz
  _neq: timestamptz
  _gt: timestamptz
  _gte: timestamptz
  _lt: timestamptz
  _lte: timestamptz
  _is_null: Boolean
}

input IntComparisonExp {
  _eq: Int
  _neq: Int
  _gt: Int
  _gte: Int
  _lt: Int
  _lte: Int
  _is_null: Boolean
}
```

### Order By Types

```graphql
input UserOrderBy {
  createdAt: OrderBy
  displayName: OrderBy
  email: OrderBy
}

input OrganizationOrderBy {
  createdAt: OrderBy
  name: OrderBy
  updatedAt: OrderBy
}

input PositionOrderBy {
  createdAt: OrderBy
  title: OrderBy
  publishedAt: OrderBy
  updatedAt: OrderBy
}

input ApplicationOrderBy {
  submittedAt: OrderBy
  updatedAt: OrderBy
  score: OrderBy
}

enum OrderBy {
  ASC
  DESC
  ASC_NULLS_FIRST
  ASC_NULLS_LAST
  DESC_NULLS_FIRST
  DESC_NULLS_LAST
}
```

---

## Scalar Types

```graphql
scalar uuid
scalar timestamptz
scalar jsonb
scalar numeric
```

---

## Error Handling

GraphQL errors follow Hasura standard format:

```json
{
  "errors": [
    {
      "message": "permission denied",
      "extensions": {
        "code": "access-denied",
        "path": "$.selectionSet.application"
      }
    }
  ]
}
```

Common error codes:
- `access-denied`: Permission/authorization error
- `validation-failed`: Input validation error
- `constraint-violation`: Database constraint violation
- `not-found`: Resource not found

---

## TypeScript Code Generation

Configuration in `codegen.yml`:

```yaml
overwrite: true
schema: ${NHOST_GRAPHQL_URL}
documents: 'lib/nhost/graphql/**/*.ts'
generates:
  lib/nhost/graphql/generated/graphql.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-apollo
    config:
      withHooks: true
      withComponent: false
      withHOC: false
```

Generated types example:

```typescript
export type User = {
  __typename?: 'User';
  id: Scalars['uuid'];
  email: Scalars['String'];
  displayName?: Maybe<Scalars['String']>;
  // ...
};

export type OrganizationsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<OrganizationBoolExp>;
}>;

export type OrganizationsQuery = {
  __typename?: 'Query';
  organizations: Array<{
    __typename?: 'Organization';
    id: string;
    name: string;
    // ...
  }>;
};

export function useOrganizationsQuery(
  baseOptions?: Apollo.QueryHookOptions<OrganizationsQuery, OrganizationsQueryVariables>
) {
  // ...
}
```

---

## Next Steps

1. Deploy schema to Hasura on Nhost
2. Configure permissions and RLS policies
3. Run `graphql-codegen` to generate TypeScript types
4. Implement GraphQL queries/mutations in `lib/nhost/graphql/`
