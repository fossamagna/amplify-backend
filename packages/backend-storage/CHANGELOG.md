# @aws-amplify/backend-storage

## 1.4.1

### Patch Changes

- d5a6553: Update aws-cdk-lib to ^2.189.1
- Updated dependencies [edb1896]
- Updated dependencies [d5a6553]
  - @aws-amplify/plugin-types@1.10.1
  - @aws-amplify/backend-output-storage@1.3.1

## 1.4.0

### Minor Changes

- d09014b: integrate with aws cdk toolkit

### Patch Changes

- Updated dependencies [a93aa54]
- Updated dependencies [d09014b]
- Updated dependencies [d50ffb7]
- Updated dependencies [d09014b]
- Updated dependencies [d8a7304]
- Updated dependencies [96fe987]
  - @aws-amplify/plugin-types@1.10.0
  - @aws-amplify/backend-output-storage@1.3.0
  - @aws-amplify/backend-output-schemas@1.6.0

## 1.3.0

### Minor Changes

- 8f59d16: integrate with aws cdk toolkit

### Patch Changes

- Updated dependencies [8f59d16]
- Updated dependencies [9a00a6b]
  - @aws-amplify/plugin-types@1.9.0
  - @aws-amplify/backend-output-storage@1.2.0
  - @aws-amplify/backend-output-schemas@1.5.0

## 1.2.6

### Patch Changes

- 99f5d0b: lint and format with new version of prettier
- 2102071: Upgrade CDK version to 2.180.0
- Updated dependencies [99f5d0b]
- Updated dependencies [2102071]
  - @aws-amplify/backend-output-schemas@1.4.1
  - @aws-amplify/backend-output-storage@1.1.5
  - @aws-amplify/plugin-types@1.8.1

## 1.2.5

### Patch Changes

- 3298c3a: update naming of storage access policies to also use stack

## 1.2.4

### Patch Changes

- 72b2fe0: update aws-cdk lib to ^2.168.0
- Updated dependencies [72b2fe0]
- Updated dependencies [f6ba240]
  - @aws-amplify/backend-output-storage@1.1.4
  - @aws-amplify/plugin-types@1.6.0

## 1.2.3

### Patch Changes

- f1db886: add resourceGroupName prop to function
- Updated dependencies [f1db886]
  - @aws-amplify/plugin-types@1.5.0

## 1.2.2

### Patch Changes

- b56d344: update aws-cdk lib to ^2.158.0
- Updated dependencies [b56d344]
  - @aws-amplify/backend-output-storage@1.1.3
  - @aws-amplify/plugin-types@1.3.1

## 1.2.1

### Patch Changes

- d538ecc: add storage access rules to outputs
- Updated dependencies [d538ecc]
  - @aws-amplify/backend-output-schemas@1.2.1

## 1.2.0

### Minor Changes

- 87dbf41: expose stack property for backend, function resource, storage resource, and auth resource

### Patch Changes

- Updated dependencies [87dbf41]
  - @aws-amplify/plugin-types@1.3.0

## 1.1.3

### Patch Changes

- e648e8e: added main field to package.json so these packages are resolvable
- Updated dependencies [8dd7286]
  - @aws-amplify/backend-output-storage@1.1.2
  - @aws-amplify/plugin-types@1.2.2

## 1.1.2

### Patch Changes

- 775e2bb: Fix InvalidFunctionConfigurationError and InvalidStorageAccessDefinitionError error names.

## 1.1.1

### Patch Changes

- a65371c: upgrade aws-cdk and aws-cdk-lib to ^2.152.0
- Updated dependencies [a65371c]
  - @aws-amplify/backend-output-storage@1.1.1
  - @aws-amplify/plugin-types@1.2.1

## 1.1.0

### Minor Changes

- d9b83a1: support adding more than one bucket

### Patch Changes

- Updated dependencies [d9b83a1]
  - @aws-amplify/backend-output-schemas@1.2.0
  - @aws-amplify/backend-output-storage@1.1.0
  - @aws-amplify/plugin-types@1.2.0

## 1.0.4

### Patch Changes

- 545f61d: update "available action" url under storage
- 0200d11: Bump baseline CDK version to 2.132.0 to support AWS SDK bundling
- Updated dependencies [0200d11]
  - @aws-amplify/backend-output-storage@1.0.2
  - @aws-amplify/plugin-types@1.0.1

## 1.0.3

### Patch Changes

- b1e320e: enforce SSl for storage

## 1.0.2

### Patch Changes

- 530bf2c: chore: disambiguate url imports and import from node:url explicitly

## 1.0.1

### Patch Changes

- Updated dependencies [15c2b7c]
  - @aws-amplify/backend-output-schemas@1.1.0
  - @aws-amplify/backend-output-storage@1.0.1

## 1.0.0

### Major Changes

- 51195e2: Major version bump for all public pacakges.

### Patch Changes

- Updated dependencies [51195e2]
  - @aws-amplify/backend-output-schemas@1.0.0
  - @aws-amplify/backend-output-storage@1.0.0
  - @aws-amplify/plugin-types@1.0.0

## 0.7.1

### Patch Changes

- Updated dependencies [8995e3b]
- Updated dependencies [ce5a5ac]
  - @aws-amplify/plugin-types@0.10.0
  - @aws-amplify/backend-output-storage@0.4.1

## 0.7.0

### Minor Changes

- 067ca74: Enforce mutually exclusive storage access actions in type

## 0.6.0

### Minor Changes

- 95a040b: Change storage access path validation from enforcing leading slash to enforcing no leading slash
- 5969a32: Implement deny-by-default behavior on access rules
- 7cbe58b: adding triggers to storage events
- 6b81a42: Add cfnBucket to storage resource
- 215d65d: Group storage access policies by action rather than prefix
- 82006e5: Add "list" to available storage resource actions
- 4995bda: Introduce initial iteration of access control mechanism between backend resources.
  The APIs and functioality are NOT final and are subject to change without notice.
- f999897: Enable auth group access to storage and change syntax for specifying owner-based access
- 173c4ba: Change group access to allow multiple group names in one rule. Also enforce that there are no duplicate access targets for a single path.

### Patch Changes

- ab7533d: Add output and configuration for customer owned lambdas
- 697d791: Use screaming snake case for SSM entries
- 64e425c: fix cogntio identity placeholder value in IAM policy
- 7cbe58b: bump aws-cdk-lib to 2.127.0
- c760df4: Use array input instead of var args for defining resource access actions
- ef111b4: Add friendly-name tag to resources
- cfc3bc4: Enable CORS on the S3 Bucket
- 916d3f0: clean up s3 buckets when `defineStorage` is removed from the backend definition
- 3adf7df: Add validation for allowed path patterns in storage access definition
- 48ff3bd: Add cfnFunction to function resources
- de311f8: Update defineStorage JSDocs to include prop descriptions
- Updated dependencies [ab7533d]
- Updated dependencies [697d791]
- Updated dependencies [7cbe58b]
- Updated dependencies [1e93535]
- Updated dependencies [109cd1b]
- Updated dependencies [db23a3f]
- Updated dependencies [4995bda]
- Updated dependencies [5e12247]
- Updated dependencies [48ff3bd]
  - @aws-amplify/backend-output-schemas@0.7.0
  - @aws-amplify/backend-output-storage@0.4.0
  - @aws-amplify/plugin-types@0.9.0

## 0.6.0-beta.10

### Minor Changes

- 173c4ba: Change group access to allow multiple group names in one rule. Also enforce that there are no duplicate access targets for a single path.

### Patch Changes

- ef111b4: Add friendly-name tag to resources
- Updated dependencies [db23a3f]
  - @aws-amplify/plugin-types@0.9.0-beta.3
  - @aws-amplify/backend-output-storage@0.4.0-beta.8

## 0.6.0-beta.9

### Patch Changes

- de311f8: Update defineStorage JSDocs to include prop descriptions
  - @aws-amplify/backend-output-storage@0.4.0-beta.7

## 0.6.0-beta.8

### Patch Changes

- Updated dependencies [1e93535]
  - @aws-amplify/backend-output-schemas@0.7.0-beta.1
  - @aws-amplify/backend-output-storage@0.4.0-beta.6

## 0.6.0-beta.7

### Patch Changes

- 48ff3bd: Add cfnFunction to function resources
- Updated dependencies [48ff3bd]
  - @aws-amplify/plugin-types@0.9.0-beta.2
  - @aws-amplify/backend-output-storage@0.4.0-beta.5

## 0.6.0-beta.6

### Minor Changes

- 95a040b: Change storage access path validation from enforcing leading slash to enforcing no leading slash

### Patch Changes

- @aws-amplify/backend-output-storage@0.4.0-beta.4

## 0.6.0-beta.5

### Patch Changes

- Updated dependencies [5e12247]
  - @aws-amplify/plugin-types@0.9.0-beta.1
  - @aws-amplify/backend-output-storage@0.4.0-beta.3

## 0.6.0-beta.4

### Patch Changes

- @aws-amplify/backend-output-storage@0.4.0-beta.2

## 0.6.0-beta.3

### Minor Changes

- f999897: Enable auth group access to storage and change syntax for specifying owner-based access

## 0.6.0-beta.2

### Minor Changes

- 5969a32: Implement deny-by-default behavior on access rules
- 215d65d: Group storage access policies by action rather than prefix
- 82006e5: Add "list" to available storage resource actions

### Patch Changes

- 64e425c: fix cogntio identity placeholder value in IAM policy
- c760df4: Use array input instead of var args for defining resource access actions
- 916d3f0: clean up s3 buckets when `defineStorage` is removed from the backend definition
- 3adf7df: Add validation for allowed path patterns in storage access definition

## 0.6.0-beta.1

### Minor Changes

- 7cbe58b: adding triggers to storage events
- 4995bda: Introduce initial iteration of access control mechanism between backend resources.
  The APIs and functioality are NOT final and are subject to change without notice.

### Patch Changes

- ab7533d: Add output and configuration for customer owned lambdas
- 7cbe58b: bump aws-cdk-lib to 2.127.0
- cfc3bc4: Enable CORS on the S3 Bucket
- Updated dependencies [ab7533d]
- Updated dependencies [7cbe58b]
- Updated dependencies [109cd1b]
- Updated dependencies [4995bda]
  - @aws-amplify/backend-output-schemas@0.7.0-beta.0
  - @aws-amplify/backend-output-storage@0.4.0-beta.1
  - @aws-amplify/plugin-types@0.9.0-beta.0

## 0.5.1-beta.0

### Patch Changes

- @aws-amplify/backend-output-storage@0.3.1-beta.0

## 0.5.0

### Minor Changes

- 84818e3c1: Require name in defineStorage props

### Patch Changes

- 85ced84f2: Add ability to add custom outputs
- Updated dependencies [85ced84f2]
- Updated dependencies [b73d76a78]
  - @aws-amplify/backend-output-schemas@0.6.0
  - @aws-amplify/backend-output-storage@0.3.0
  - @aws-amplify/plugin-types@0.8.0

## 0.4.4

### Patch Changes

- Updated dependencies [618a2ea71]
  - @aws-amplify/backend-output-schemas@0.5.2
  - @aws-amplify/backend-output-storage@0.2.11

## 0.4.3

### Patch Changes

- Updated dependencies [d087313e9]
  - @aws-amplify/plugin-types@0.7.1
  - @aws-amplify/backend-output-storage@0.2.10

## 0.4.2

### Patch Changes

- 04f067837: Implement consistent dependency declaration check. Bumped dependencies where necessary.
- Updated dependencies [04f067837]
  - @aws-amplify/backend-output-schemas@0.5.1
  - @aws-amplify/backend-output-storage@0.2.9

## 0.4.1

### Patch Changes

- Updated dependencies [e5da97e37]
- Updated dependencies [6a1c252e1]
- Updated dependencies [6a1c252e1]
  - @aws-amplify/plugin-types@0.7.0
  - @aws-amplify/backend-output-schemas@0.5.0
  - @aws-amplify/backend-output-storage@0.2.7

## 0.4.0

### Minor Changes

- 6714cd69c: Reinstate accessing all properties on backend construct objects

### Patch Changes

- 3b4fbbdc1: Move storage construct to be internal to backend-storage and modify api types to not expose implementation details
- Updated dependencies [6714cd69c]
- Updated dependencies [fd6516c8b]
  - @aws-amplify/plugin-types@0.6.0

## 0.3.2

### Patch Changes

- Updated dependencies [c6c39d04c]
  - @aws-amplify/plugin-types@0.5.0

## 0.3.1

### Patch Changes

- 5ed51cbd5: Upgrade aws-cdk to 2.110.1
- Updated dependencies [5ed51cbd5]
  - @aws-amplify/backend-output-storage@0.2.6
  - @aws-amplify/storage-construct-alpha@0.2.3
  - @aws-amplify/plugin-types@0.4.2

## 0.3.0

### Minor Changes

- 71a63a16: Change stack naming strategy to include deployment type as a suffix

### Patch Changes

- Updated dependencies [8181509a]
- Updated dependencies [71a63a16]
  - @aws-amplify/plugin-types@0.4.0
  - @aws-amplify/storage-construct-alpha@0.2.1
  - @aws-amplify/backend-output-storage@0.2.1

## 0.2.2

### Patch Changes

- 0bd8a3f3: add missing dev deps

## 0.2.1

### Patch Changes

- Updated dependencies [457b1662]
  - @aws-amplify/plugin-types@0.3.0

## 0.2.0

### Minor Changes

- ae9e9f10: Create factory functions for defining category config

### Patch Changes

- 0398b8e1: Bump graphql construct to 0.9.0 and remove some interface cruft
- b2b0c2da: force version bump
- baa7a905: Move types package from peer deps to deps
- 7296e9d9: Initial publish
- c5d18967: Re-export category entry points from @aws-amplify/backend and move shared test classes to new private package
- 34c3fd38: Update backend definition file path convention
- 3bda96ff: update methods to use arrow notation
- 7103735b: cdk lib dependency declaration
- 36d93e46: add license to package.json
- 8f99476e: chore: upgrade aws-cdk to 2.103.0
- dc22fdf4: Integrate secret to Auth
- 407a09ff: Implements backend secret feature, include backend secret resolver and the backend-secret pkg.
- f75fa531: Refactor OutputStorageStrategy into stateless shared dependency
- f6618771: add deployment type to stack outputs
- 59f5ea24: chore: upgrade aws-cdk to 2.100.0
- Updated dependencies [47456c26]
- Updated dependencies [ac3df080]
- Updated dependencies [0398b8e1]
- Updated dependencies [b2b0c2da]
- Updated dependencies [18874854]
- Updated dependencies [7296e9d9]
- Updated dependencies [2ef006f1]
- Updated dependencies [3bda96ff]
- Updated dependencies [7103735b]
- Updated dependencies [3c36ace9]
- Updated dependencies [36d93e46]
- Updated dependencies [8f99476e]
- Updated dependencies [dc22fdf4]
- Updated dependencies [407a09ff]
- Updated dependencies [47456c26]
- Updated dependencies [f75fa531]
- Updated dependencies [f201c94a]
- Updated dependencies [512f0778]
- Updated dependencies [883d9da7]
- Updated dependencies [59f5ea24]
  - @aws-amplify/backend-output-storage@0.2.0
  - @aws-amplify/storage-construct-alpha@0.2.0
  - @aws-amplify/plugin-types@0.2.0

## 0.2.0-alpha.10

### Patch Changes

- Updated dependencies [47456c26]
- Updated dependencies [47456c26]
  - @aws-amplify/backend-output-storage@0.2.0-alpha.6
  - @aws-amplify/storage-construct-alpha@0.2.0-alpha.11

## 0.2.0-alpha.9

### Patch Changes

- 8f99476e: chore: upgrade aws-cdk to 2.103.0
- Updated dependencies [8f99476e]
  - @aws-amplify/backend-output-storage@0.2.0-alpha.5
  - @aws-amplify/storage-construct-alpha@0.1.1-alpha.10
  - @aws-amplify/plugin-types@0.2.0-alpha.11

## 0.2.0-alpha.8

### Patch Changes

- Updated dependencies [18874854]
- Updated dependencies [883d9da7]
  - @aws-amplify/plugin-types@0.2.0-alpha.10
  - @aws-amplify/backend-output-storage@0.2.0-alpha.4
  - @aws-amplify/storage-construct-alpha@0.1.1-alpha.9

## 0.2.0-alpha.7

### Patch Changes

- 59f5ea24: chore: upgrade aws-cdk to 2.100.0
- Updated dependencies [59f5ea24]
  - @aws-amplify/backend-output-storage@0.1.1-alpha.3
  - @aws-amplify/storage-construct-alpha@0.1.1-alpha.8
  - @aws-amplify/plugin-types@0.2.0-alpha.9

## 0.2.0-alpha.6

### Patch Changes

- 7103735b: cdk lib dependency declaration
- Updated dependencies [7103735b]
  - @aws-amplify/storage-construct-alpha@0.1.1-alpha.7
  - @aws-amplify/plugin-types@0.2.0-alpha.8

## 0.2.0-alpha.5

### Patch Changes

- 36d93e46: add license to package.json
- Updated dependencies [36d93e46]
  - @aws-amplify/backend-output-storage@0.1.1-alpha.2
  - @aws-amplify/storage-construct-alpha@0.1.1-alpha.6
  - @aws-amplify/plugin-types@0.2.0-alpha.7

## 0.2.0-alpha.4

### Minor Changes

- ae9e9f10: Create factory functions for defining category config

### Patch Changes

- 0398b8e1: Bump graphql construct to 0.9.0 and remove some interface cruft
- baa7a905: Move types package from peer deps to deps
- 34c3fd38: Update backend definition file path convention
- dc22fdf4: Integrate secret to Auth
- f6618771: add deployment type to stack outputs
- Updated dependencies [0398b8e1]
- Updated dependencies [dc22fdf4]
- Updated dependencies [512f0778]
  - @aws-amplify/backend-output-storage@0.1.1-alpha.1
  - @aws-amplify/storage-construct-alpha@0.1.1-alpha.5
  - @aws-amplify/plugin-types@0.2.0-alpha.6

## 0.1.1-alpha.3

### Patch Changes

- 407a09ff: Implements backend secret feature, include backend secret resolver and the backend-secret pkg.
- f75fa531: Refactor OutputStorageStrategy into stateless shared dependency
- Updated dependencies [ac3df080]
- Updated dependencies [407a09ff]
- Updated dependencies [f75fa531]
  - @aws-amplify/backend-output-storage@0.1.1-alpha.0
  - @aws-amplify/plugin-types@0.1.1-alpha.5
  - @aws-amplify/storage-construct-alpha@0.1.1-alpha.4

## 0.1.1-alpha.2

### Patch Changes

- b2b0c2d: force version bump
- Updated dependencies [b2b0c2d]
  - @aws-amplify/plugin-types@0.1.1-alpha.2
  - @aws-amplify/storage-construct-alpha@0.1.1-alpha.2

## 0.1.1-alpha.1

### Patch Changes

- 3bda96f: update methods to use arrow notation
- Updated dependencies [2ef006f]
- Updated dependencies [3bda96f]
  - @aws-amplify/plugin-types@0.1.1-alpha.1
  - @aws-amplify/storage-construct-alpha@0.1.1-alpha.1

## 0.1.1-alpha.0

### Patch Changes

- 7296e9d: Initial publish
- Updated dependencies [7296e9d]
  - @aws-amplify/plugin-types@0.1.1-alpha.0
  - @aws-amplify/storage-construct-alpha@0.1.1-alpha.0
