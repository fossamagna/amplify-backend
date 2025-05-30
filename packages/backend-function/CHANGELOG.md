# @aws-amplify/backend-function

## 1.14.1

### Patch Changes

- d5a6553: Update aws-cdk-lib to ^2.189.1
- Updated dependencies [edb1896]
- Updated dependencies [d5a6553]
  - @aws-amplify/plugin-types@1.10.1
  - @aws-amplify/backend-output-storage@1.3.1

## 1.14.0

### Minor Changes

- 995c3de: Use Node 20 as default runtime in functions
- d09014b: integrate with aws cdk toolkit
- 119a05f: add addEnvironment for provided functions

### Patch Changes

- 8483297: Bumps [uuid](https://github.com/uuidjs/uuid) from 9.0.1 to 11.1.0.
- d09014b: fix pretty sandbox qa bugs
- 119a05f: update shape of AMPLIFY_SSM_ENV_CONFIG
- Updated dependencies [a93aa54]
- Updated dependencies [d09014b]
- Updated dependencies [d50ffb7]
- Updated dependencies [d09014b]
- Updated dependencies [d8a7304]
- Updated dependencies [96fe987]
  - @aws-amplify/plugin-types@1.10.0
  - @aws-amplify/backend-output-storage@1.3.0
  - @aws-amplify/backend-output-schemas@1.6.0

## 1.13.0

### Minor Changes

- 8f59d16: integrate with aws cdk toolkit

### Patch Changes

- f9f31c7: fix pretty sandbox qa bugs
- Updated dependencies [8f59d16]
- Updated dependencies [9a00a6b]
  - @aws-amplify/plugin-types@1.9.0
  - @aws-amplify/backend-output-storage@1.2.0
  - @aws-amplify/backend-output-schemas@1.5.0

## 1.12.3

### Patch Changes

- 99f5d0b: lint and format with new version of prettier
- 2102071: Upgrade CDK version to 2.180.0
- Updated dependencies [99f5d0b]
- Updated dependencies [2102071]
  - @aws-amplify/backend-output-schemas@1.4.1
  - @aws-amplify/backend-output-storage@1.1.5
  - @aws-amplify/plugin-types@1.8.1

## 1.12.2

### Patch Changes

- 44c3769: paginate getParameter call when there are more than 10 parameters
- bc07307: Update code with Eslint@8 compliant

## 1.12.1

### Patch Changes

- ff2f2ce: fixed violations to cause propagation lint rule
- ff2f2ce: catch errors during secret refreshes
- 501ec56: remove the workaround for no-misused-promises as it broke lambdas execution

## 1.12.0

### Minor Changes

- 3f521c3: add custom provided function support to define function

### Patch Changes

- c5d54c2: Update getAmplifyDataClient to have strict env type and remove narrowing logic

## 1.11.0

### Minor Changes

- a7506f9: added data logging api to defineData
- a7506f9: adds support for architecture property on defineFunction

### Patch Changes

- Updated dependencies [a7506f9]
  - @aws-amplify/plugin-types@1.7.0

## 1.10.0

### Minor Changes

- d32e4cd: Add ephemeralStorageSizeMB option to defineFunction
- 560878f: updates layer to also use layername:version
- f193105: Update getAmplifyDataClientConfig to work with named data backend

## 1.9.0

### Minor Changes

- 5cbe318: Add lambda data client
- 72b2fe0: Add support to `@aws-amplify/backend-function` for Node 22

  Add support to `@aws-amplify/backend-function` for Node 22, which is a [supported Lambda runtime](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html#runtime-deprecation-levels) that was added in [`aws-cdk-lib/aws-lambda` version `2.168.0`](https://github.com/aws/aws-cdk/releases/tag/v2.168.0) on November 20th, 2024

- 65abf6a: Add options to control log settings

### Patch Changes

- 72b2fe0: update aws-cdk lib to ^2.168.0
- d227f96: change errors in FunctionFactory to AmplifyUserError
- f6ba240: Upgrade execa
- d227f96: add validation for environment prop
- Updated dependencies [72b2fe0]
- Updated dependencies [f6ba240]
  - @aws-amplify/backend-output-storage@1.1.4
  - @aws-amplify/plugin-types@1.6.0

## 1.8.0

### Minor Changes

- f1db886: add resourceGroupName prop to function

### Patch Changes

- Updated dependencies [f1db886]
  - @aws-amplify/plugin-types@1.5.0

## 1.7.5

### Patch Changes

- 12cf209: update error mapping to catch when Lambda layer ARN regions do not match function region
- Updated dependencies [90a7c49]
  - @aws-amplify/plugin-types@1.4.0

## 1.7.4

### Patch Changes

- 4e97389: add validation if layer arn region does not match function region

## 1.7.3

### Patch Changes

- b56d344: update aws-cdk lib to ^2.158.0
- Updated dependencies [b56d344]
  - @aws-amplify/backend-output-storage@1.1.3
  - @aws-amplify/plugin-types@1.3.1

## 1.7.2

### Patch Changes

- 601a2c1: dedupe environment variables in amplify env type generator

## 1.7.1

### Patch Changes

- bd4ff4d: Fix jsdocs that incorrectly state default memory settings
- Updated dependencies [5f46d8d]
  - @aws-amplify/backend-output-schemas@1.4.0

## 1.7.0

### Minor Changes

- 4720412: Add minify option to defineFunction

## 1.6.0

### Minor Changes

- f5d0ab4: adds support to reference existing layers in defineFunction

## 1.5.0

### Minor Changes

- 87dbf41: expose stack property for backend, function resource, storage resource, and auth resource

### Patch Changes

- Updated dependencies [87dbf41]
  - @aws-amplify/plugin-types@1.3.0

## 1.4.1

### Patch Changes

- e648e8e: added main field to package.json so these packages are resolvable
- c9c873c: throw ESBuild error with correct messages
- Updated dependencies [8dd7286]
  - @aws-amplify/backend-output-storage@1.1.2
  - @aws-amplify/plugin-types@1.2.2

## 1.4.0

### Minor Changes

- 038b54d: update cron jsdoc example

### Patch Changes

- 99c8b6a: Add new @aws-amplify/ai-constructs and @aws-amplify/backend-ai packages with a conversation handler.

## 1.3.4

### Patch Changes

- 67feca0: update env type cast to cast as unknown first

## 1.3.3

### Patch Changes

- 775e2bb: Fix InvalidFunctionConfigurationError and InvalidStorageAccessDefinitionError error names.

## 1.3.2

### Patch Changes

- a65371c: upgrade aws-cdk and aws-cdk-lib to ^2.152.0
- Updated dependencies [a65371c]
  - @aws-amplify/backend-output-storage@1.1.1
  - @aws-amplify/plugin-types@1.2.1

## 1.3.1

### Patch Changes

- 3c698e0: upgrade AWS SDK packages to latest
- Updated dependencies [3c698e0]
  - @aws-amplify/plugin-types@1.1.1

## 1.3.0

### Minor Changes

- ec12ac8: add support for scheduling functions

### Patch Changes

- Updated dependencies [697bc8a]
  - @aws-amplify/plugin-types@1.1.0

## 1.2.0

### Minor Changes

- 63a881f: Add the ability to add function environment variables after defining the function

### Patch Changes

- 90ac407: Minify lambda function code and add source maps

## 1.1.0

### Minor Changes

- 0200d11: Bundle locally available AWS SDK packages by default

### Patch Changes

- 0200d11: Bump baseline CDK version to 2.132.0 to support AWS SDK bundling
- Updated dependencies [0200d11]
  - @aws-amplify/backend-output-storage@1.0.2
  - @aws-amplify/plugin-types@1.0.1

## 1.0.3

### Patch Changes

- 530bf2c: chore: disambiguate url imports and import from node:url explicitly

## 1.0.2

### Patch Changes

- e008bb3: fix: lazy load ssm client in backend function banner

## 1.0.1

### Patch Changes

- 86b639a: Throw helpful error message when function environment variable is undefined
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

## 0.9.1

### Patch Changes

- Updated dependencies [8995e3b]
- Updated dependencies [ce5a5ac]
  - @aws-amplify/plugin-types@0.10.0
  - @aws-amplify/backend-output-storage@0.4.1

## 0.9.0

### Minor Changes

- 1058383: Standardize name validation across storage, functions, auth, and data

## 0.8.0

### Minor Changes

- ab7533d: Add output and configuration for customer owned lambdas
- cec91d5: Add dynamic environment variables to function type definition files
- b0ba24d: Generate type definition file for static environment variables for functions
- 0d1b00e: Update generated env package location and use the $ symbol
- 62dab44: add support for function dependencies that require .node files
- 4995bda: Introduce initial iteration of access control mechanism between backend resources.
  The APIs and functioality are NOT final and are subject to change without notice.

### Patch Changes

- 6c6af9b: chore: convert errors to AmplifyUserError
- bdbf6e8: Set default function memory to 512
- 7cbe58b: bump aws-cdk-lib to 2.127.0
- aec89f9: chore: correctly handle quotes in the error messages
- ef111b4: Add friendly-name tag to resources
- 75f69ea: store attribution string in funciton stack
- 318335d: Ensure resource access env vars are added to function typed shim files
- 7f5edee: Ensure typed shim files contain only the function name
- a05933c: run tsc after CDK synth but before deploy
- 48ff3bd: Add cfnFunction to function resources
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

## 0.8.0-beta.12

### Patch Changes

- ef111b4: Add friendly-name tag to resources
- Updated dependencies [db23a3f]
  - @aws-amplify/plugin-types@0.9.0-beta.3
  - @aws-amplify/backend-output-storage@0.4.0-beta.8

## 0.8.0-beta.11

### Patch Changes

- @aws-amplify/backend-output-storage@0.4.0-beta.7

## 0.8.0-beta.10

### Patch Changes

- Updated dependencies [1e93535]
  - @aws-amplify/backend-output-schemas@0.7.0-beta.1
  - @aws-amplify/backend-output-storage@0.4.0-beta.6

## 0.8.0-beta.9

### Patch Changes

- 6c6af9b: chore: convert errors to AmplifyUserError
- 48ff3bd: Add cfnFunction to function resources
- Updated dependencies [48ff3bd]
  - @aws-amplify/plugin-types@0.9.0-beta.2
  - @aws-amplify/backend-output-storage@0.4.0-beta.5

## 0.8.0-beta.8

### Minor Changes

- 62dab44: add support for function dependencies that require .node files

### Patch Changes

- aec89f9: chore: correctly handle quotes in the error messages
  - @aws-amplify/backend-output-storage@0.4.0-beta.4

## 0.8.0-beta.7

### Minor Changes

- 0d1b00e: Update generated env package location and use the $ symbol

## 0.8.0-beta.6

### Patch Changes

- Updated dependencies [5e12247]
  - @aws-amplify/plugin-types@0.9.0-beta.1
  - @aws-amplify/backend-output-storage@0.4.0-beta.3

## 0.8.0-beta.5

### Patch Changes

- a05933c: run tsc after CDK synth but before deploy

## 0.8.0-beta.4

### Patch Changes

- 75f69ea: store attribution string in funciton stack
  - @aws-amplify/backend-output-storage@0.4.0-beta.2

## 0.8.0-beta.3

### Patch Changes

- bdbf6e8: Set default function memory to 512
- 7f5edee: Ensure typed shim files contain only the function name

## 0.8.0-beta.2

### Minor Changes

- cec91d5: Add dynamic environment variables to function type definition files
- b0ba24d: Generate type definition file for static environment variables for functions

### Patch Changes

- 318335d: Ensure resource access env vars are added to function typed shim files

## 0.8.0-beta.1

### Minor Changes

- ab7533d: Add output and configuration for customer owned lambdas
- 4995bda: Introduce initial iteration of access control mechanism between backend resources.
  The APIs and functioality are NOT final and are subject to change without notice.

### Patch Changes

- 7cbe58b: bump aws-cdk-lib to 2.127.0
- Updated dependencies [ab7533d]
- Updated dependencies [7cbe58b]
- Updated dependencies [109cd1b]
- Updated dependencies [4995bda]
  - @aws-amplify/backend-output-schemas@0.7.0-beta.0
  - @aws-amplify/backend-output-storage@0.4.0-beta.1
  - @aws-amplify/plugin-types@0.9.0-beta.0

## 0.7.2-beta.0

### Patch Changes

- @aws-amplify/backend-output-storage@0.3.1-beta.0

## 0.7.1

### Patch Changes

- adb50ecb6: Fix cjs/top-level-await/esbuild interoperability issue when bundling lambda functions

## 0.7.0

### Minor Changes

- ccde77a01: Refactor secret fetcher and support node 16 ssm shim

### Patch Changes

- Updated dependencies [85ced84f2]
- Updated dependencies [b73d76a78]
  - @aws-amplify/backend-output-storage@0.3.0
  - @aws-amplify/plugin-types@0.8.0

## 0.6.4

### Patch Changes

- f2d829641: Inject shim for cjs require for functions

## 0.6.3

### Patch Changes

- @aws-amplify/backend-output-storage@0.2.11

## 0.6.2

### Patch Changes

- d087313e9: Enhance functions to fallback to resolve shared secrets
- Updated dependencies [d087313e9]
  - @aws-amplify/plugin-types@0.7.1
  - @aws-amplify/backend-output-storage@0.2.10

## 0.6.1

### Patch Changes

- 04f067837: Implement consistent dependency declaration check. Bumped dependencies where necessary.
- Updated dependencies [04f067837]
  - @aws-amplify/backend-output-storage@0.2.9

## 0.6.0

### Minor Changes

- 5678ab4d4: Consume parameter resolution changes from @aws-amplify/platform-core

### Patch Changes

- @aws-amplify/backend-output-storage@0.2.8

## 0.5.0

### Minor Changes

- e5da97e37: Implement function secret access

### Patch Changes

- c885ff22d: Add unit test to know when oldest Node LTS changes to update default function runtime
- Updated dependencies [e5da97e37]
  - @aws-amplify/plugin-types@0.7.0
  - @aws-amplify/backend-output-storage@0.2.7

## 0.4.0

### Minor Changes

- 2ab4b3149: Add runtime to defineFunction
- b4e0a00a9: Add timeout, memory and environment variables to defineFunction

### Patch Changes

- Updated dependencies [6714cd69c]
- Updated dependencies [fd6516c8b]
  - @aws-amplify/plugin-types@0.6.0

## 0.3.0

### Minor Changes

- c6c39d04c: Initial implementation of new 'defineFunction' entry point

### Patch Changes

- Updated dependencies [c6c39d04c]
  - @aws-amplify/plugin-types@0.5.0

## 0.2.5

### Patch Changes

- 5ed51cbd5: Upgrade aws-cdk to 2.110.1
- Updated dependencies [5ed51cbd5]
  - @aws-amplify/backend-output-storage@0.2.6
  - @aws-amplify/function-construct-alpha@0.2.1
  - @aws-amplify/plugin-types@0.4.2

## 0.2.4

### Patch Changes

- @aws-amplify/backend-output-storage@0.2.5

## 0.2.3

### Patch Changes

- Updated dependencies [cb855dfa5]
  - @aws-amplify/backend-output-storage@0.2.4

## 0.2.2

### Patch Changes

- Updated dependencies [70685f36b]
  - @aws-amplify/backend-output-storage@0.2.3

## 0.2.1

### Patch Changes

- Updated dependencies [65fe3a8fd]
- Updated dependencies [cd5feeed0]
  - @aws-amplify/plugin-types@0.4.1
  - @aws-amplify/backend-output-storage@0.2.2

## 0.2.0

### Minor Changes

- 71a63a16: Change stack naming strategy to include deployment type as a suffix

### Patch Changes

- Updated dependencies [8181509a]
- Updated dependencies [71a63a16]
  - @aws-amplify/plugin-types@0.4.0
  - @aws-amplify/backend-output-storage@0.2.1

## 0.1.4

### Patch Changes

- 68dc91e3: chore: support for JS backend apps

## 0.1.3

### Patch Changes

- 0bd8a3f3: add missing dev deps

## 0.1.2

### Patch Changes

- Updated dependencies [457b1662]
  - @aws-amplify/plugin-types@0.3.0

## 0.1.1

### Patch Changes

- b2b0c2da: force version bump
- baa7a905: Move types package from peer deps to deps
- 7296e9d9: Initial publish
- c5d18967: Re-export category entry points from @aws-amplify/backend and move shared test classes to new private package
- 3bda96ff: update methods to use arrow notation
- 7103735b: cdk lib dependency declaration
- 36d93e46: add license to package.json
- 8f99476e: chore: upgrade aws-cdk to 2.103.0
- dc22fdf4: Integrate secret to Auth
- 407a09ff: Implements backend secret feature, include backend secret resolver and the backend-secret pkg.
- fcc7d389: Enable type checking during deployment
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
- Updated dependencies [f75fa531]
- Updated dependencies [f201c94a]
- Updated dependencies [512f0778]
- Updated dependencies [883d9da7]
- Updated dependencies [59f5ea24]
  - @aws-amplify/backend-output-storage@0.2.0
  - @aws-amplify/function-construct-alpha@0.2.0
  - @aws-amplify/plugin-types@0.2.0

## 0.1.1-alpha.11

### Patch Changes

- Updated dependencies [47456c26]
  - @aws-amplify/backend-output-storage@0.2.0-alpha.6
  - @aws-amplify/function-construct-alpha@0.2.0-alpha.7

## 0.1.1-alpha.10

### Patch Changes

- 8f99476e: chore: upgrade aws-cdk to 2.103.0
- Updated dependencies [8f99476e]
  - @aws-amplify/backend-output-storage@0.2.0-alpha.5
  - @aws-amplify/function-construct-alpha@0.1.1-alpha.6
  - @aws-amplify/plugin-types@0.2.0-alpha.11

## 0.1.1-alpha.9

### Patch Changes

- Updated dependencies [18874854]
- Updated dependencies [883d9da7]
  - @aws-amplify/plugin-types@0.2.0-alpha.10
  - @aws-amplify/backend-output-storage@0.2.0-alpha.4

## 0.1.1-alpha.8

### Patch Changes

- fcc7d389: Enable type checking during deployment

## 0.1.1-alpha.7

### Patch Changes

- 59f5ea24: chore: upgrade aws-cdk to 2.100.0
- Updated dependencies [59f5ea24]
  - @aws-amplify/backend-output-storage@0.1.1-alpha.3
  - @aws-amplify/function-construct-alpha@0.1.1-alpha.5
  - @aws-amplify/plugin-types@0.2.0-alpha.9

## 0.1.1-alpha.6

### Patch Changes

- 7103735b: cdk lib dependency declaration
- Updated dependencies [7103735b]
  - @aws-amplify/function-construct-alpha@0.1.1-alpha.4
  - @aws-amplify/plugin-types@0.2.0-alpha.8

## 0.1.1-alpha.5

### Patch Changes

- 36d93e46: add license to package.json
- Updated dependencies [36d93e46]
  - @aws-amplify/backend-output-storage@0.1.1-alpha.2
  - @aws-amplify/function-construct-alpha@0.1.1-alpha.3
  - @aws-amplify/plugin-types@0.2.0-alpha.7

## 0.1.1-alpha.4

### Patch Changes

- baa7a905: Move types package from peer deps to deps
- dc22fdf4: Integrate secret to Auth
- f6618771: add deployment type to stack outputs
- Updated dependencies [0398b8e1]
- Updated dependencies [dc22fdf4]
- Updated dependencies [512f0778]
  - @aws-amplify/backend-output-storage@0.1.1-alpha.1
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

## 0.1.1-alpha.2

### Patch Changes

- b2b0c2d: force version bump
- Updated dependencies [b2b0c2d]
  - @aws-amplify/function-construct-alpha@0.1.1-alpha.1
  - @aws-amplify/plugin-types@0.1.1-alpha.2

## 0.1.1-alpha.1

### Patch Changes

- 3bda96f: update methods to use arrow notation
- Updated dependencies [2ef006f]
- Updated dependencies [3bda96f]
  - @aws-amplify/plugin-types@0.1.1-alpha.1

## 0.1.1-alpha.0

### Patch Changes

- 7296e9d: Initial publish
- Updated dependencies [7296e9d]
  - @aws-amplify/function-construct-alpha@0.1.1-alpha.0
  - @aws-amplify/plugin-types@0.1.1-alpha.0
