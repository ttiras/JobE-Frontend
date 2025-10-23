import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  overwrite: true,
  schema: [
    {
      [`https://${process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN}.nhost.run/v1/graphql`]: {
        headers: {
          'x-hasura-admin-secret': process.env.NHOST_ADMIN_SECRET || '',
        },
      },
    },
  ],
  documents: ['lib/nhost/graphql/**/*.ts', '!lib/nhost/graphql/generated/**/*'],
  generates: {
    'lib/nhost/graphql/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typed-document-node',
      ],
      config: {
        skipTypename: false,
        withHooks: false,
        withHOC: false,
        withComponent: false,
        scalars: {
          uuid: 'string',
          timestamptz: 'string',
          jsonb: 'Record<string, any>',
          numeric: 'number',
        },
      },
    },
  },
}

export default config
