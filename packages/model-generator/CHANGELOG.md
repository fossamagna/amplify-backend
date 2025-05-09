# @aws-amplify/model-generator

## 1.2.0

### Minor Changes

- d09014b: integrate with aws cdk toolkit

### Patch Changes

- Updated dependencies [8483297]
- Updated dependencies [baaaba9]
- Updated dependencies [a93aa54]
- Updated dependencies [d09014b]
- Updated dependencies [ece77e7]
- Updated dependencies [d50ffb7]
- Updated dependencies [d09014b]
- Updated dependencies [d09014b]
- Updated dependencies [d09014b]
- Updated dependencies [d8a7304]
- Updated dependencies [96fe987]
  - @aws-amplify/platform-core@1.8.0
  - @aws-amplify/plugin-types@1.10.0
  - @aws-amplify/deployed-backend-client@1.7.0
  - @aws-amplify/backend-output-schemas@1.6.0

## 1.1.0

### Minor Changes

- 8f59d16: integrate with aws cdk toolkit

### Patch Changes

- Updated dependencies [8f59d16]
- Updated dependencies [0cc2de3]
- Updated dependencies [b2f9042]
- Updated dependencies [9a00a6b]
  - @aws-amplify/plugin-types@1.9.0
  - @aws-amplify/deployed-backend-client@1.6.0
  - @aws-amplify/platform-core@1.7.0
  - @aws-amplify/backend-output-schemas@1.5.0

## 1.0.13

### Patch Changes

- 99f5d0b: lint and format with new version of prettier
- Updated dependencies [99f5d0b]
- Updated dependencies [fad46a4]
- Updated dependencies [2102071]
  - @aws-amplify/deployed-backend-client@1.5.2
  - @aws-amplify/backend-output-schemas@1.4.1
  - @aws-amplify/platform-core@1.6.5
  - @aws-amplify/plugin-types@1.8.1

## 1.0.12

### Patch Changes

- a7506f9: wraps no outputs found error from backend output client
- Updated dependencies [a7506f9]
- Updated dependencies [a7506f9]
  - @aws-amplify/platform-core@1.5.0
  - @aws-amplify/plugin-types@1.7.0

## 1.0.11

### Patch Changes

- 107600b: Updated error handling with S3 Client

## 1.0.10

### Patch Changes

- 3cf0738: update detection of BackendOutputClientErrors
- Updated dependencies [95942c5]
- Updated dependencies [3cf0738]
- Updated dependencies [f679cf6]
- Updated dependencies [f193105]
  - @aws-amplify/platform-core@1.4.0
  - @aws-amplify/deployed-backend-client@1.5.0

## 1.0.9

### Patch Changes

- 443e2ff: bump graphql-generator dependency version to 0.5.1
- Updated dependencies [90a7c49]
  - @aws-amplify/plugin-types@1.4.0

## 1.0.8

### Patch Changes

- e325044: Prefer amplify errors in generators
- Updated dependencies [87dbf41]
  - @aws-amplify/plugin-types@1.3.0

## 1.0.7

### Patch Changes

- e648e8e: added main field to package.json so these packages are resolvable
- 8dd7286: fixed errors in plugin-types and cli-core along with any extraneous dependencies in other packages
- e648e8e: added main field to packages known to lack one
- Updated dependencies [e648e8e]
- Updated dependencies [8dd7286]
- Updated dependencies [e648e8e]
  - @aws-amplify/deployed-backend-client@1.4.1
  - @aws-amplify/plugin-types@1.2.2

## 1.0.6

### Patch Changes

- c10f6fc: activated no-amplify-errors, ignored lines with valid violations

## 1.0.5

### Patch Changes

- 4d4c0d5: Use proper error and fault suffixes.

## 1.0.4

### Patch Changes

- 3c698e0: upgrade AWS SDK packages to latest
- eab6ddb: wrap credential related errors for generate commands in AmplifyUserError
- Updated dependencies [3c698e0]
- Updated dependencies [eab6ddb]
- Updated dependencies [320a86d]
  - @aws-amplify/deployed-backend-client@1.3.0
  - @aws-amplify/platform-core@1.0.5

## 1.0.3

### Patch Changes

- 1aef2c2: wrap CloudFormation client stack does not exist errors in AmplifyUserError
- Updated dependencies [2294683]
- Updated dependencies [1aef2c2]
  - @aws-amplify/platform-core@1.0.4
  - @aws-amplify/deployed-backend-client@1.2.0

## 1.0.2

### Patch Changes

- c784e40: Catch and wrap DeploymentInProgress exception while generating artifacts
- Updated dependencies [c784e40]
  - @aws-amplify/deployed-backend-client@1.1.0
  - @aws-amplify/platform-core@1.0.3

## 1.0.1

### Patch Changes

- Updated dependencies [15c2b7c]
  - @aws-amplify/backend-output-schemas@1.1.0
  - @aws-amplify/deployed-backend-client@1.0.1

## 1.0.0

### Major Changes

- 51195e2: Major version bump for all public pacakges.

### Patch Changes

- Updated dependencies [51195e2]
  - @aws-amplify/backend-output-schemas@1.0.0
  - @aws-amplify/deployed-backend-client@1.0.0
  - @aws-amplify/platform-core@1.0.0

## 0.8.0

### Minor Changes

- 820bc5b: respect maxDepth and typenameIntrospection when generating types

## 0.7.1

### Patch Changes

- Updated dependencies [ce5a5ac]
  - @aws-amplify/platform-core@0.5.1
  - @aws-amplify/deployed-backend-client@0.4.2

## 0.7.0

### Minor Changes

- d0f1452: bump codegen and amplify data cdk construct, schema generator dependencies

## 0.6.1

### Patch Changes

- Updated dependencies [c2c8910]
  - @aws-amplify/deployed-backend-client@0.4.1

## 0.6.0

### Minor Changes

- 9ea3c38: bumps the codegen dependencies to use the latest tag

## 0.5.0

### Minor Changes

- 8d73779: refactor model generation from schema uri
- 05c3c9b: Rename target format type and prop in model gen package
- a494aca: refactor: use default directives
- fe46848: Allow passing clients in to client-config from browser context.

### Patch Changes

- 592bd4f: refactor log abstraction in `client-config`, `form-generator`, and `model-generator` packages
- 73dcd6e: fix: update model introspection schema generation packages for references relationships
- Updated dependencies [6c6af9b]
- Updated dependencies [ab7533d]
- Updated dependencies [74cbda0]
- Updated dependencies [1e93535]
- Updated dependencies [aec89f9]
- Updated dependencies [b0112e3]
- Updated dependencies [ef111b4]
- Updated dependencies [fe46848]
- Updated dependencies [937086b]
- Updated dependencies [2a69684]
- Updated dependencies [4995bda]
- Updated dependencies [edee8d7]
- Updated dependencies [5e12247]
- Updated dependencies [415c4c1]
- Updated dependencies [b931980]
- Updated dependencies [b0b4dea]
  - @aws-amplify/platform-core@0.5.0
  - @aws-amplify/deployed-backend-client@0.4.0
  - @aws-amplify/backend-output-schemas@0.7.0

## 0.5.0-beta.12

### Patch Changes

- Updated dependencies [ef111b4]
  - @aws-amplify/platform-core@0.5.0-beta.7
  - @aws-amplify/deployed-backend-client@0.4.0-beta.10

## 0.5.0-beta.11

### Minor Changes

- fe46848: Allow passing clients in to client-config from browser context.

### Patch Changes

- Updated dependencies [fe46848]
  - @aws-amplify/deployed-backend-client@0.4.0-beta.9

## 0.5.0-beta.10

### Patch Changes

- 73dcd6e: fix: update model introspection schema generation packages for references relationships
- Updated dependencies [edee8d7]
  - @aws-amplify/deployed-backend-client@0.4.0-beta.8

## 0.5.0-beta.9

### Patch Changes

- Updated dependencies [1e93535]
  - @aws-amplify/backend-output-schemas@0.7.0-beta.1
  - @aws-amplify/deployed-backend-client@0.4.0-beta.7

## 0.5.0-beta.8

### Minor Changes

- a494aca: refactor: use default directives

### Patch Changes

- @aws-amplify/deployed-backend-client@0.4.0-beta.6

## 0.5.0-beta.7

### Patch Changes

- 592bd4f: refactor log abstraction in `client-config`, `form-generator`, and `model-generator` packages

## 0.5.0-beta.6

### Patch Changes

- @aws-amplify/deployed-backend-client@0.4.0-beta.5

## 0.5.0-beta.5

### Minor Changes

- 8d73779: refactor model generation from schema uri

## 0.5.0-beta.4

### Patch Changes

- Updated dependencies [b0112e3]
  - @aws-amplify/deployed-backend-client@0.4.0-beta.4

## 0.5.0-beta.3

### Minor Changes

- 05c3c9b: Rename target format type and prop in model gen package

### Patch Changes

- Updated dependencies [b931980]
  - @aws-amplify/deployed-backend-client@0.4.0-beta.3

## 0.4.1-beta.2

### Patch Changes

- Updated dependencies [415c4c1]
  - @aws-amplify/deployed-backend-client@0.4.0-beta.2

## 0.4.1-beta.1

### Patch Changes

- Updated dependencies [ab7533d]
  - @aws-amplify/deployed-backend-client@0.4.0-beta.1
  - @aws-amplify/backend-output-schemas@0.7.0-beta.0

## 0.4.1-beta.0

### Patch Changes

- @aws-amplify/deployed-backend-client@0.3.11-beta.0

## 0.4.0

### Minor Changes

- 1814f1a69: Bumped graphql-generator to generate model introspection schema with custom queries/mutations/subscriptions

### Patch Changes

- Updated dependencies [85ced84f2]
  - @aws-amplify/backend-output-schemas@0.6.0
  - @aws-amplify/deployed-backend-client@0.3.10

## 0.3.0

### Minor Changes

- 4c1485aa4: print out file written for amplify generate commands

## 0.2.7

### Patch Changes

- Updated dependencies [618a2ea71]
  - @aws-amplify/backend-output-schemas@0.5.2
  - @aws-amplify/deployed-backend-client@0.3.9

## 0.2.6

### Patch Changes

- @aws-amplify/deployed-backend-client@0.3.8

## 0.2.5

### Patch Changes

- 04f067837: Implement consistent dependency declaration check. Bumped dependencies where necessary.
- Updated dependencies [04f067837]
  - @aws-amplify/deployed-backend-client@0.3.7
  - @aws-amplify/backend-output-schemas@0.5.1

## 0.2.4

### Patch Changes

- Updated dependencies [6a1c252e1]
- Updated dependencies [6a1c252e1]
  - @aws-amplify/backend-output-schemas@0.5.0
  - @aws-amplify/deployed-backend-client@0.3.5

## 0.2.3

### Patch Changes

- 8258926a0: Fix creating android model files that have path embedded in it
  - @aws-amplify/deployed-backend-client@0.3.3

## 0.2.2

### Patch Changes

- Updated dependencies [07b0dfc9f]
  - @aws-amplify/backend-output-schemas@0.4.0
  - @aws-amplify/deployed-backend-client@0.3.1

## 0.2.1

### Patch Changes

- Updated dependencies [71a63a16]
  - @aws-amplify/deployed-backend-client@0.3.0
  - @aws-amplify/backend-output-schemas@0.3.0

## 0.2.0

### Minor Changes

- 92950f99: Return a DocumentGenerationResult that has a writeToDirectory method
- 1a87500d: Generate model introspection schema when producing client config.
- b48dae80: Add wrapper to around types, documents, and model generation (`generateAPICode`).

  Change `createGraphqlDocumentGenerator` and `createGraphqlTypesGenerator` to use backendIdentifier and credentialProvider.

- 56fbcc5f: Generated typescript codegen by default, and add type defaults as well
- 1cefbdd4: feat: add model generation to @aws-amplify/model-generator
- ce008a2c: Add model generation package.
- 5c1d9de8: feat: add types generation

### Patch Changes

- 23fc5b13: Lint fixes
- 47bfb317: fix: generate multiple swift files
- b2b0c2da: force version bump
- c5d18967: Re-export category entry points from @aws-amplify/backend and move shared test classes to new private package
- 36d93e46: add license to package.json
- bb3bf89a: add backend metadata manager
- 1a6dd467: refactor: use @aws-amplify/graphql-generator in model-generator
- Updated dependencies [f0ef7c6a]
- Updated dependencies [e9c0c9b5]
- Updated dependencies [ac3df080]
- Updated dependencies [b2b0c2da]
- Updated dependencies [a351b261]
- Updated dependencies [7296e9d9]
- Updated dependencies [53779253]
- Updated dependencies [5585f473]
- Updated dependencies [b40d2d7b]
- Updated dependencies [c5d18967]
- Updated dependencies [b40d2d7b]
- Updated dependencies [395c8f0d]
- Updated dependencies [ce008a2c]
- Updated dependencies [36d93e46]
- Updated dependencies [4d411b67]
- Updated dependencies [f46f69fb]
- Updated dependencies [bb3bf89a]
- Updated dependencies [47456c26]
- Updated dependencies [0b029cb5]
- Updated dependencies [b4f82717]
- Updated dependencies [5b9aac15]
- Updated dependencies [05f97b26]
- Updated dependencies [d925b097]
- Updated dependencies [2525b582]
- Updated dependencies [f75fa531]
- Updated dependencies [f6618771]
- Updated dependencies [f201c94a]
- Updated dependencies [512f0778]
- Updated dependencies [883d9da7]
  - @aws-amplify/deployed-backend-client@0.2.0
  - @aws-amplify/backend-output-schemas@0.2.0

## 0.2.0-alpha.7

### Patch Changes

- 47bfb317: fix: generate multiple swift files
- Updated dependencies [f0ef7c6a]
  - @aws-amplify/deployed-backend-client@0.2.0-alpha.11

## 0.2.0-alpha.6

### Minor Changes

- 56fbcc5f: Generated typescript codegen by default, and add type defaults as well

## 0.2.0-alpha.5

### Minor Changes

- 1a87500d: Generate model introspection schema when producing client config.

## 0.2.0-alpha.4

### Patch Changes

- 36d93e46: add license to package.json
- Updated dependencies [36d93e46]
  - @aws-amplify/deployed-backend-client@0.2.0-alpha.2
  - @aws-amplify/backend-output-schemas@0.2.0-alpha.5

## 0.2.0-alpha.3

### Patch Changes

- 23fc5b13: Lint fixes
- bb3bf89a: add backend metadata manager
- Updated dependencies [bb3bf89a]
- Updated dependencies [f6618771]
- Updated dependencies [512f0778]
  - @aws-amplify/deployed-backend-client@0.2.0-alpha.1
  - @aws-amplify/backend-output-schemas@0.2.0-alpha.4

## 0.2.0-alpha.2

### Minor Changes

- 92950f99: Return a DocumentGenerationResult that has a writeToDirectory method
- b48dae80: Add wrapper to around types, documents, and model generation (`generateAPICode`).

  Change `createGraphqlDocumentGenerator` and `createGraphqlTypesGenerator` to use backendIdentifier and credentialProvider.

- 1cefbdd4: feat: add model generation to @aws-amplify/model-generator
- 5c1d9de8: feat: add types generation

### Patch Changes

- 1dada824: chore: Update eslint config to new flat config type
- 1a6dd467: refactor: use @aws-amplify/graphql-generator in model-generator
- Updated dependencies [ac3df080]
- Updated dependencies [53779253]
- Updated dependencies [1dada824]
- Updated dependencies [b4f82717]
- Updated dependencies [05f97b26]
- Updated dependencies [f75fa531]
  - @aws-amplify/backend-output-schemas@0.2.0-alpha.3
  - @aws-amplify/deployed-backend-client@0.2.0-alpha.0

## 0.2.0-alpha.1

### Minor Changes

- ce008a2: Add model generation package.

## 0.1.1-alpha.0

### Patch Changes

- b2b0c2d: force version bump
