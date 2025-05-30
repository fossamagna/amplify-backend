import { beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { DataFactory, defineData } from './factory.js';
import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import {
  AmplifyFunction,
  AuthResources,
  BackendOutputEntry,
  BackendOutputStorageStrategy,
  ConstructContainer,
  ConstructFactory,
  ConstructFactoryGetInstanceProps,
  FunctionResources,
  ImportPathVerifier,
  ResourceAccessAcceptorFactory,
  ResourceNameValidator,
  ResourceProvider,
  SsmEnvironmentEntry,
} from '@aws-amplify/plugin-types';
import { Policy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import {
  CfnIdentityPool,
  CfnIdentityPoolRoleAttachment,
  CfnUserPool,
  CfnUserPoolClient,
  UserPool,
  UserPoolClient,
} from 'aws-cdk-lib/aws-cognito';
import { CfnFunction, Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { StackMetadataBackendOutputStorageStrategy } from '@aws-amplify/backend-output-storage';
import {
  ConstructContainerStub,
  ImportPathVerifierStub,
  ResourceNameValidatorStub,
  StackResolverStub,
} from '@aws-amplify/backend-platform-test-stubs';
import { AmplifyDataResources } from '@aws-amplify/data-construct';
import { AmplifyUserError } from '@aws-amplify/platform-core';
import { a } from '@aws-amplify/data-schema';
import { AmplifyDataError, DataLoggingOptions } from './types.js';
import { CDKLoggingOptions } from './logging_options_parser.js';
import { CfnGraphQLApi, FieldLogLevel } from 'aws-cdk-lib/aws-appsync';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

const CUSTOM_DDB_CFN_TYPE = 'Custom::AmplifyDynamoDBTable';
const CUSTOM_IMPORTED_DDB_CFN_TYPE = 'Custom::ImportedAmplifyDynamoDBTable';

const testSchema = /* GraphQL */ `
  type Todo @model {
    id: ID!
    name: String!
    description: String
  }
`;

const createStackAndSetContext = (settings: {
  isSandboxMode: boolean;
  amplifyEnvironmentName?: string;
}): Stack => {
  const app = new App();
  app.node.setContext('amplify-backend-name', 'testEnvName');
  app.node.setContext('amplify-backend-namespace', 'testBackendId');
  app.node.setContext(
    'amplify-backend-type',
    settings.isSandboxMode ? 'sandbox' : 'branch',
  );
  app.node.setContext(
    'amplifyEnvironmentName',
    settings.amplifyEnvironmentName,
  );
  const stack = new Stack(app);
  return stack;
};

const createConstructContainerWithUserPoolAuthRegistered = (
  stack: Stack,
): ConstructContainer => {
  const constructContainer = new ConstructContainerStub(
    new StackResolverStub(stack),
  );
  const sampleUserPool = new UserPool(stack, 'UserPool');
  constructContainer.registerConstructFactory('AuthResources', {
    provides: 'AuthResources',
    getInstance: (): ResourceProvider<AuthResources> => ({
      resources: {
        userPool: sampleUserPool,
        userPoolClient: new UserPoolClient(stack, 'UserPoolClient', {
          userPool: sampleUserPool,
        }),
        unauthenticatedUserIamRole: new Role(stack, 'testUnauthRole', {
          assumedBy: new ServicePrincipal('test.amazon.com'),
        }),
        authenticatedUserIamRole: new Role(stack, 'testAuthRole', {
          assumedBy: new ServicePrincipal('test.amazon.com'),
        }),
        cfnResources: {
          cfnUserPool: new CfnUserPool(stack, 'CfnUserPool', {}),
          cfnUserPoolClient: new CfnUserPoolClient(stack, 'CfnUserPoolClient', {
            userPoolId: 'userPool',
          }),
          cfnIdentityPool: new CfnIdentityPool(stack, 'identityPool', {
            allowUnauthenticatedIdentities: true,
          }),
          cfnIdentityPoolRoleAttachment: new CfnIdentityPoolRoleAttachment(
            stack,
            'identityPoolRoleAttachment',
            { identityPoolId: 'identityPool' },
          ),
        },
        groups: {},
        identityPoolId: 'identityPool',
      },
    }),
  });
  return constructContainer;
};

const createInstancePropsBySetupCDKApp = (settings: {
  isSandboxMode: boolean;
  amplifyEnvironmentName?: string;
}): ConstructFactoryGetInstanceProps => {
  const stack: Stack = createStackAndSetContext({
    isSandboxMode: settings.isSandboxMode,
    amplifyEnvironmentName: settings.amplifyEnvironmentName,
  });
  const constructContainer: ConstructContainer =
    createConstructContainerWithUserPoolAuthRegistered(stack);
  const outputStorageStrategy: BackendOutputStorageStrategy<BackendOutputEntry> =
    new StackMetadataBackendOutputStorageStrategy(stack);
  const importPathVerifier: ImportPathVerifier = new ImportPathVerifierStub();

  return {
    constructContainer,
    outputStorageStrategy,
    importPathVerifier,
  };
};

void describe('DataFactory', () => {
  let stack: Stack;
  let constructContainer: ConstructContainer;
  let outputStorageStrategy: BackendOutputStorageStrategy<BackendOutputEntry>;
  let importPathVerifier: ImportPathVerifier;
  let dataFactory: ConstructFactory<ResourceProvider<AmplifyDataResources>>;
  let getInstanceProps: ConstructFactoryGetInstanceProps;
  let resourceNameValidator: ResourceNameValidator;

  beforeEach(() => {
    resetFactoryCount();
    dataFactory = defineData({ schema: testSchema });
    stack = createStackAndSetContext({ isSandboxMode: false });

    constructContainer =
      createConstructContainerWithUserPoolAuthRegistered(stack);
    outputStorageStrategy = new StackMetadataBackendOutputStorageStrategy(
      stack,
    );
    importPathVerifier = new ImportPathVerifierStub();

    resourceNameValidator = new ResourceNameValidatorStub();

    getInstanceProps = {
      constructContainer,
      outputStorageStrategy,
      importPathVerifier,
      resourceNameValidator,
    };
  });

  void it('returns singleton instance', () => {
    const instance1 = dataFactory.getInstance(getInstanceProps);
    const instance2 = dataFactory.getInstance(getInstanceProps);

    assert.strictEqual(instance1, instance2);
  });

  void it('adds construct to stack', () => {
    const dataConstruct = dataFactory.getInstance(getInstanceProps);
    const template = Template.fromStack(
      Stack.of(dataConstruct.resources.graphqlApi),
    );
    template.resourceCountIs('AWS::AppSync::GraphQLApi', 1);
  });

  void it('tags api with friendly name', () => {
    resetFactoryCount();
    const dataFactory = defineData({ schema: testSchema, name: 'testNameFoo' });
    const dataConstruct = dataFactory.getInstance(getInstanceProps);
    const template = Template.fromStack(
      Stack.of(dataConstruct.resources.graphqlApi),
    );
    template.resourceCountIs('AWS::AppSync::GraphQLApi', 1);
    template.hasResourceProperties('AWS::AppSync::GraphQLApi', {
      Tags: [{ Key: 'amplify:friendly-name', Value: 'testNameFoo' }],
    });
  });

  void it('throws on invalid name', () => {
    mock
      .method(resourceNameValidator, 'validate')
      .mock.mockImplementationOnce(() => {
        throw new Error('test validation error');
      });
    resetFactoryCount();
    const dataFactory = defineData({
      schema: testSchema,
      name: 'this!is@wrong$',
    });
    assert.throws(() => dataFactory.getInstance(getInstanceProps), {
      message: 'test validation error',
    });
  });

  void it('sets output using storage strategy', () => {
    dataFactory.getInstance(getInstanceProps);

    const template = Template.fromStack(stack);
    template.hasOutput('awsAppsyncApiEndpoint', {});
  });

  void it('verifies constructor import path', () => {
    const importPathVerifier = {
      verify: mock.fn(),
    };

    dataFactory.getInstance({
      ...getInstanceProps,
      importPathVerifier,
    });

    assert.ok(
      (importPathVerifier.verify.mock.calls[0].arguments[0] as string).includes(
        'defineData',
      ),
    );
  });

  void it('sets a default api name if none is specified', () => {
    const dataConstruct = dataFactory.getInstance(getInstanceProps);
    const template = Template.fromStack(
      Stack.of(dataConstruct.resources.graphqlApi),
    );
    template.resourceCountIs('AWS::AppSync::GraphQLApi', 1);
    template.hasResourceProperties('AWS::AppSync::GraphQLApi', {
      Name: 'amplifyData',
    });
  });

  void it('sets the api name if a name property is specified', () => {
    resetFactoryCount();
    dataFactory = defineData({
      schema: testSchema,
      name: 'MyTestApiName',
    });
    const dataConstruct = dataFactory.getInstance(getInstanceProps);
    const template = Template.fromStack(
      Stack.of(dataConstruct.resources.graphqlApi),
    );
    template.resourceCountIs('AWS::AppSync::GraphQLApi', 1);
    template.hasResourceProperties('AWS::AppSync::GraphQLApi', {
      Name: 'MyTestApiName',
    });
  });

  void it('sets the api name to default name if a name property is not specified', () => {
    resetFactoryCount();
    dataFactory = defineData({
      schema: testSchema,
    });
    const dataConstruct = dataFactory.getInstance(getInstanceProps);

    const template = Template.fromStack(
      Stack.of(dataConstruct.resources.graphqlApi),
    );
    template.resourceCountIs('AWS::AppSync::GraphQLApi', 1);
    template.hasResourceProperties('AWS::AppSync::GraphQLApi', {
      Name: 'amplifyData',
    });
  });

  void it('does not throw if no auth resources are registered and only api key is provided', () => {
    resetFactoryCount();
    dataFactory = defineData({
      schema: testSchema,
      authorizationModes: {
        apiKeyAuthorizationMode: {
          expiresInDays: 7,
        },
      },
    });

    constructContainer = new ConstructContainerStub(
      new StackResolverStub(stack),
    );
    getInstanceProps = {
      constructContainer,
      outputStorageStrategy,
      importPathVerifier,
    };
    dataFactory.getInstance(getInstanceProps);
  });

  void it('does not throw if no auth resources are registered and only lambda is provided', () => {
    const myEchoFn = new Function(stack, 'MyEchoFn', {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromInline(
        'module.handler = async () => console.log("Hello");',
      ),
      handler: 'index.handler',
    });
    resetFactoryCount();
    const echo: ConstructFactory<AmplifyFunction> = {
      getInstance: () => ({
        resources: {
          lambda: myEchoFn,
          cfnResources: {
            cfnFunction: myEchoFn.node.findChild('Resource') as CfnFunction,
          },
        },
      }),
    };
    dataFactory = defineData({
      schema: testSchema,
      authorizationModes: {
        lambdaAuthorizationMode: {
          function: echo,
        },
      },
    });

    constructContainer = new ConstructContainerStub(
      new StackResolverStub(stack),
    );
    getInstanceProps = {
      constructContainer,
      outputStorageStrategy,
      importPathVerifier,
    };
    dataFactory.getInstance(getInstanceProps);
  });

  void it('does not throw if no auth resources are registered and only oidc is provided', () => {
    resetFactoryCount();
    dataFactory = defineData({
      schema: testSchema,
      authorizationModes: {
        oidcAuthorizationMode: {
          oidcProviderName: 'test',
          oidcIssuerUrl: 'https://localhost/',
          tokenExpireFromIssueInSeconds: 1,
          tokenExpiryFromAuthInSeconds: 1,
        },
      },
    });

    constructContainer = new ConstructContainerStub(
      new StackResolverStub(stack),
    );
    getInstanceProps = {
      constructContainer,
      outputStorageStrategy,
      importPathVerifier,
    };
    dataFactory.getInstance(getInstanceProps);
  });

  void it('does not throw if no auth resources and no auth mode is specified', () => {
    resetFactoryCount();
    dataFactory = defineData({
      schema: testSchema,
    });

    constructContainer = new ConstructContainerStub(
      new StackResolverStub(stack),
    );
    getInstanceProps = {
      constructContainer,
      outputStorageStrategy,
      importPathVerifier,
    };
    dataFactory.getInstance(getInstanceProps);
  });

  void it('throws if multiple authorization modes are provided but no default', () => {
    resetFactoryCount();
    dataFactory = defineData({
      schema: testSchema,
      authorizationModes: {
        apiKeyAuthorizationMode: {},
        oidcAuthorizationMode: {
          oidcProviderName: 'test',
          oidcIssuerUrl: 'https://localhost/',
          tokenExpireFromIssueInSeconds: 1,
          tokenExpiryFromAuthInSeconds: 1,
        },
      },
    });

    constructContainer = new ConstructContainerStub(
      new StackResolverStub(stack),
    );
    getInstanceProps = {
      constructContainer,
      outputStorageStrategy,
      importPathVerifier,
    };
    assert.throws(
      () => dataFactory.getInstance(getInstanceProps),
      (err: AmplifyUserError<AmplifyDataError>) => {
        assert.strictEqual(err.name, 'DefineDataConfigurationError');
        assert.strictEqual(
          err.message,
          'A defaultAuthorizationMode is required if multiple authorization modes are configured',
        );
        assert.strictEqual(
          err.resolution,
          "When calling 'defineData' specify 'authorizationModes.defaultAuthorizationMode'",
        );
        return true;
      },
    );
  });

  void it('accepts functions as inputs to the defineData call', () => {
    resetFactoryCount();
    const myEchoFn = new Function(stack, 'MyEchoFn', {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromInline(
        'module.handler = async () => console.log("Hello");',
      ),
      handler: 'index.handler',
    });
    const echo: ConstructFactory<AmplifyFunction> = {
      getInstance: () => ({
        resources: {
          lambda: myEchoFn,
          cfnResources: {
            cfnFunction: myEchoFn.node.findChild('Resource') as CfnFunction,
          },
        },
      }),
    };
    dataFactory = defineData({
      schema: /* GraphQL */ `
        type Query {
          echo(message: String!): String! @function(name: "echo")
        }
      `,
      functions: {
        echo,
      },
    });

    const dataConstruct = dataFactory.getInstance(getInstanceProps);

    // Validate that the api resources are created for the function
    assert('FunctionDirectiveStack' in dataConstruct.resources.nestedStacks);
    const functionDirectiveStackTemplate = Template.fromStack(
      dataConstruct.resources.nestedStacks.FunctionDirectiveStack,
    );
    functionDirectiveStackTemplate.hasResourceProperties(
      'AWS::AppSync::DataSource',
      {
        Name: 'EchoLambdaDataSource',
        Type: 'AWS_LAMBDA',
      },
    );
  });

  void it('should throw TooManyDataFactoryError when defineData is called multiple times', () => {
    assert.throws(
      () => {
        dataFactory = defineData({ schema: testSchema });
        dataFactory = defineData({ schema: testSchema });
      },
      new AmplifyUserError('MultipleSingletonResourcesError', {
        message:
          'Multiple `defineData` calls are not allowed within an Amplify backend',
        resolution: 'Remove all but one `defineData` call',
      }),
    );
  });

  void describe('function access', () => {
    beforeEach(() => {
      resetFactoryCount();
    });

    void it('should attach expected policy to function role when schema access is defined', () => {
      const lambda = new Function(stack, 'testFunc', {
        code: Code.fromInline('test code'),
        runtime: Runtime.NODEJS_LATEST,
        handler: 'index.handler',
      });
      const acceptResourceAccessMock = mock.fn<
        (policy: Policy, ssmEnvironmentEntries: SsmEnvironmentEntry[]) => void
      >((policy) => {
        policy.attachToRole(lambda.role!);
      });
      const myFunc: ConstructFactory<
        ResourceProvider<FunctionResources> & ResourceAccessAcceptorFactory
      > = {
        getInstance: () => ({
          resources: {
            lambda,
            cfnResources: {
              cfnFunction: lambda.node.findChild('Resource') as CfnFunction,
            },
          },
          getResourceAccessAcceptor: () => ({
            identifier: 'testId',
            acceptResourceAccess: acceptResourceAccessMock,
          }),
        }),
      };
      const schema = a
        .schema({
          Todo: a.model({
            content: a.string(),
          }),
        })
        .authorization((allow) => [
          allow.authenticated().to(['read']),
          allow.resource(myFunc),
        ]);

      const dataFactory = defineData({
        schema,
      });

      const dataConstruct = dataFactory.getInstance(getInstanceProps);

      const template = Template.fromStack(Stack.of(dataConstruct));

      // expect 2 policies in the template
      // 1 is for a custom resource created by data and the other is the policy for the access config above
      template.resourceCountIs('AWS::IAM::Policy', 2);

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Action: 'appsync:GraphQL',
              Resource: [
                {
                  'Fn::Join': [
                    '',
                    [
                      {
                        'Fn::GetAtt': ['amplifyDataGraphQLAPI42A6FA33', 'Arn'],
                      },
                      '/types/Query/*',
                    ],
                  ],
                },
                {
                  'Fn::Join': [
                    '',
                    [
                      {
                        'Fn::GetAtt': ['amplifyDataGraphQLAPI42A6FA33', 'Arn'],
                      },
                      '/types/Mutation/*',
                    ],
                  ],
                },
                {
                  'Fn::Join': [
                    '',
                    [
                      {
                        'Fn::GetAtt': ['amplifyDataGraphQLAPI42A6FA33', 'Arn'],
                      },
                      '/types/Subscription/*',
                    ],
                  ],
                },
              ],
            },
            {
              Action: 's3:GetObject',
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        'modelIntrospectionSchemaBucketF566B665',
                        'Arn',
                      ],
                    },
                    '/modelIntrospectionSchema.json',
                  ],
                ],
              },
            },
          ],
        },
        Roles: [
          {
            // eslint-disable-next-line spellcheck/spell-checker
            Ref: 'referencetotestFuncServiceRole67735AD9Ref',
          },
        ],
      });
    });

    void it('should attach expected policy to multiple function roles', () => {
      // create lambda1 stub
      const lambda1 = new Function(stack, 'testFunc1', {
        code: Code.fromInline('test code'),
        runtime: Runtime.NODEJS_LATEST,
        handler: 'index.handler',
      });
      const acceptResourceAccessMock1 = mock.fn<
        (policy: Policy, ssmEnvironmentEntries: SsmEnvironmentEntry[]) => void
      >((policy) => {
        policy.attachToRole(lambda1.role!);
      });
      const myFunc1: ConstructFactory<
        ResourceProvider<FunctionResources> & ResourceAccessAcceptorFactory
      > = {
        getInstance: () => ({
          resources: {
            lambda: lambda1,
            cfnResources: {
              cfnFunction: lambda1.node.findChild('Resource') as CfnFunction,
            },
          },
          getResourceAccessAcceptor: () => ({
            identifier: 'testId1',
            acceptResourceAccess: acceptResourceAccessMock1,
          }),
        }),
      };

      // create lambda1 stub
      const lambda2 = new Function(stack, 'testFunc2', {
        code: Code.fromInline('test code'),
        runtime: Runtime.NODEJS_LATEST,
        handler: 'index.handler',
      });
      const acceptResourceAccessMock2 = mock.fn<
        (policy: Policy, ssmEnvironmentEntries: SsmEnvironmentEntry[]) => void
      >((policy) => {
        policy.attachToRole(lambda2.role!);
      });
      const myFunc2: ConstructFactory<
        ResourceProvider<FunctionResources> & ResourceAccessAcceptorFactory
      > = {
        getInstance: () => ({
          resources: {
            lambda: lambda2,
            cfnResources: {
              cfnFunction: lambda2.node.findChild('Resource') as CfnFunction,
            },
          },
          getResourceAccessAcceptor: () => ({
            identifier: 'testId2',
            acceptResourceAccess: acceptResourceAccessMock2,
          }),
        }),
      };
      const schema = a
        .schema({
          Todo: a.model({
            content: a.string(),
          }),
        })
        .authorization((allow) => [
          allow.authenticated().to(['read']),
          allow.resource(myFunc1).to(['mutate']),
          allow.resource(myFunc2).to(['query']),
        ]);

      const dataFactory = defineData({
        schema,
      });

      const dataConstruct = dataFactory.getInstance(getInstanceProps);

      const template = Template.fromStack(Stack.of(dataConstruct));

      // expect 3 policies in the template
      // 1 is for a custom resource created by data and the other two are for the two function access definition above
      template.resourceCountIs('AWS::IAM::Policy', 3);

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Action: 'appsync:GraphQL',
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': ['amplifyDataGraphQLAPI42A6FA33', 'Arn'],
                    },
                    '/types/Mutation/*',
                  ],
                ],
              },
            },
            {
              Action: 's3:GetObject',
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        'modelIntrospectionSchemaBucketF566B665',
                        'Arn',
                      ],
                    },
                    '/modelIntrospectionSchema.json',
                  ],
                ],
              },
            },
          ],
        },
        Roles: [
          {
            // eslint-disable-next-line spellcheck/spell-checker
            Ref: 'referencetotestFunc1ServiceRoleBD09EB83Ref',
          },
        ],
      });
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Action: 'appsync:GraphQL',
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': ['amplifyDataGraphQLAPI42A6FA33', 'Arn'],
                    },
                    '/types/Query/*',
                  ],
                ],
              },
            },
            {
              Action: 's3:GetObject',
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        'modelIntrospectionSchemaBucketF566B665',
                        'Arn',
                      ],
                    },
                    '/modelIntrospectionSchema.json',
                  ],
                ],
              },
            },
          ],
        },
        Roles: [
          {
            // eslint-disable-next-line spellcheck/spell-checker
            Ref: 'referencetotestFunc2ServiceRole9C59B5B3Ref',
          },
        ],
      });
    });
  });
});

void describe('Destructive Schema Updates & Replace tables upon GSI updates', () => {
  let dataFactory: ConstructFactory<ResourceProvider<AmplifyDataResources>>;
  let getInstanceProps: ConstructFactoryGetInstanceProps;

  beforeEach(() => {
    resetFactoryCount();
    dataFactory = defineData({ schema: testSchema });
  });

  void it('should allow destructive updates and disable GSI update replacing tables in non-sandbox mode', () => {
    getInstanceProps = createInstancePropsBySetupCDKApp({
      isSandboxMode: false,
    });
    const dataConstruct = dataFactory.getInstance(getInstanceProps);
    const amplifyTableStackTemplate = Template.fromStack(
      Stack.of(dataConstruct.resources.nestedStacks['Todo']),
    );
    amplifyTableStackTemplate.hasResourceProperties(CUSTOM_DDB_CFN_TYPE, {
      allowDestructiveGraphqlSchemaUpdates: true,
      replaceTableUponGsiUpdate: false,
    });
  });
  void it('should allow destructive updates and enable GSI update replacing tables in sandbox mode', () => {
    getInstanceProps = createInstancePropsBySetupCDKApp({
      isSandboxMode: true,
    });
    const dataConstruct = dataFactory.getInstance(getInstanceProps);
    const amplifyTableStackTemplate = Template.fromStack(
      Stack.of(dataConstruct.resources.nestedStacks['Todo']),
    );
    amplifyTableStackTemplate.hasResourceProperties(CUSTOM_DDB_CFN_TYPE, {
      allowDestructiveGraphqlSchemaUpdates: true,
      replaceTableUponGsiUpdate: true,
    });
  });
});

void describe('Logging Options', () => {
  let stack: Stack;
  let constructContainer: ConstructContainer;
  let outputStorageStrategy: BackendOutputStorageStrategy<BackendOutputEntry>;
  let importPathVerifier: ImportPathVerifierStub;
  let resourceNameValidator: ResourceNameValidatorStub;
  let getInstanceProps: ConstructFactoryGetInstanceProps;

  const DEFAULT_LOGGING_OPTIONS: CDKLoggingOptions = {
    excludeVerboseContent: true,
    fieldLogLevel: FieldLogLevel.NONE,
    retention: RetentionDays.ONE_WEEK,
  };

  const testCases: {
    description: string;
    input: DataLoggingOptions | undefined;
    expectedOutput: CDKLoggingOptions | undefined;
  }[] = [
    {
      description: 'no logging options provided',
      input: undefined,
      expectedOutput: undefined,
    },
    {
      description: 'default - logging: true',
      input: true,
      expectedOutput: DEFAULT_LOGGING_OPTIONS,
    },
    {
      description: 'default - logging: {}',
      input: {},
      expectedOutput: DEFAULT_LOGGING_OPTIONS,
    },
    {
      description: 'custom - excludeVerboseContent: false',
      input: { excludeVerboseContent: false },
      expectedOutput: {
        ...DEFAULT_LOGGING_OPTIONS,
        excludeVerboseContent: false,
      },
    },
    {
      description: 'custom - fieldLogLevel: error',
      input: { fieldLogLevel: 'error' },
      expectedOutput: {
        ...DEFAULT_LOGGING_OPTIONS,
        fieldLogLevel: FieldLogLevel.ERROR,
      },
    },
    {
      description: 'custom - fieldLogLevel: info, retention: 1 month',
      input: { fieldLogLevel: 'info', retention: '1 month' },
      expectedOutput: {
        ...DEFAULT_LOGGING_OPTIONS,
        fieldLogLevel: FieldLogLevel.INFO,
        retention: RetentionDays.ONE_MONTH,
      },
    },
    {
      description:
        'custom - excludeVerboseContent: false, level: debug, retention: 13 months',
      input: {
        excludeVerboseContent: false,
        fieldLogLevel: 'debug',
        retention: '13 months',
      },
      expectedOutput: {
        excludeVerboseContent: false,
        fieldLogLevel: FieldLogLevel.DEBUG,
        retention: RetentionDays.THIRTEEN_MONTHS,
      },
    },
  ];

  beforeEach(() => {
    resetFactoryCount();
    stack = createStackAndSetContext({ isSandboxMode: true });

    constructContainer =
      createConstructContainerWithUserPoolAuthRegistered(stack);
    outputStorageStrategy = new StackMetadataBackendOutputStorageStrategy(
      stack,
    );
    importPathVerifier = new ImportPathVerifierStub();
    resourceNameValidator = new ResourceNameValidatorStub();

    getInstanceProps = {
      constructContainer,
      outputStorageStrategy,
      importPathVerifier,
      resourceNameValidator,
    };
  });

  testCases.forEach((testCase) => {
    void it(`${testCase.description}`, () => {
      const dataFactory = defineData({
        schema: testSchema,
        name: 'testLoggingOptions',
        logging: testCase.input,
      });
      const dataConstruct = dataFactory.getInstance(getInstanceProps);
      const template = Template.fromStack(
        Stack.of(dataConstruct.resources.graphqlApi),
      );

      if (testCase.expectedOutput) {
        const createdLogConfig = dataConstruct.resources.cfnResources
          .cfnGraphqlApi.logConfig as CfnGraphQLApi.LogConfigProperty;
        assert.ok(createdLogConfig, 'logConfig should be defined');
        assert.strictEqual(
          createdLogConfig.fieldLogLevel,
          testCase.expectedOutput.fieldLogLevel,
        );
        assert.strictEqual(
          createdLogConfig.excludeVerboseContent,
          testCase.expectedOutput.excludeVerboseContent,
        );

        template.hasResourceProperties('Custom::LogRetention', {
          RetentionInDays: testCase.expectedOutput.retention,
        });
      } else {
        const createdLogConfig = dataConstruct.resources.cfnResources
          .cfnGraphqlApi.logConfig as CfnGraphQLApi.LogConfigProperty;
        assert.strictEqual(createdLogConfig, undefined);

        template.resourcePropertiesCountIs(
          'Custom::LogRetention',
          'LogRetention',
          0,
        );
      }
    });
  });
});

void describe('Table Import', () => {
  beforeEach(() => {
    resetFactoryCount();
  });

  void it('split imported models from non-imported models', () => {
    const schema = /* GraphQL */ `
      type Blog @model {
        title: String
        content: String
        authors: [String]
      }

      type ImportedModel @model {
        description: String
      }
    `;
    const dataFactory = defineData({
      schema,
      migratedAmplifyGen1DynamoDbTableMappings: [
        {
          branchName: 'testEnvName',
          modelNameToTableNameMapping: {
            ImportedModel: 'ImportedModel-1234-dev',
          },
        },
      ],
    });
    const getInstanceProps = createInstancePropsBySetupCDKApp({
      isSandboxMode: false,
    });
    const instance = dataFactory.getInstance(getInstanceProps);
    const blogStack = Template.fromStack(
      Stack.of(instance.resources.nestedStacks['Blog']),
    );
    const importedModelStack = Template.fromStack(
      Stack.of(instance.resources.nestedStacks['ImportedModel']),
    );
    importedModelStack.hasResourceProperties(CUSTOM_IMPORTED_DDB_CFN_TYPE, {
      isImported: true,
      tableName: 'ImportedModel-1234-dev',
    });
    blogStack.hasResource(CUSTOM_DDB_CFN_TYPE, {});
  });

  void it('allows only imported models', () => {
    const schema = /* GraphQL */ `
      type ImportedModel @model {
        description: String
      }
    `;
    const dataFactory = defineData({
      schema,
      migratedAmplifyGen1DynamoDbTableMappings: [
        {
          branchName: 'testEnvName',
          modelNameToTableNameMapping: {
            ImportedModel: 'ImportedModel-1234-dev',
          },
        },
      ],
    });
    const getInstanceProps = createInstancePropsBySetupCDKApp({
      isSandboxMode: false,
    });
    const instance = dataFactory.getInstance(getInstanceProps);
    const importedModelStack = Template.fromStack(
      Stack.of(instance.resources.nestedStacks['ImportedModel']),
    );
    importedModelStack.hasResourceProperties(CUSTOM_IMPORTED_DDB_CFN_TYPE, {
      isImported: true,
      tableName: 'ImportedModel-1234-dev',
    });
  });

  void it('fails when imported model is missing from the schema', () => {
    const schema = /* GraphQL */ `
      type Blog @model {
        title: String
        content: String
        authors: [String]
      }
    `;
    const dataFactory = defineData({
      schema,
      migratedAmplifyGen1DynamoDbTableMappings: [
        {
          branchName: 'testEnvName',
          modelNameToTableNameMapping: {
            ImportedModel: 'ImportedModel-1234-dev',
          },
        },
      ],
    });
    const getInstanceProps = createInstancePropsBySetupCDKApp({
      isSandboxMode: false,
    });
    assert.throws(() => dataFactory.getInstance(getInstanceProps), {
      message: 'Imported model not found in schema: ImportedModel',
    });
  });

  void it('ignores other branches', () => {
    const schema = /* GraphQL */ `
      type ImportedModel @model {
        description: String
      }
    `;
    const dataFactory = defineData({
      schema,
      migratedAmplifyGen1DynamoDbTableMappings: [
        {
          branchName: 'testEnvName',
          modelNameToTableNameMapping: {
            ImportedModel: 'ImportedModel-1234-dev',
          },
        },
        {
          branchName: 'prod',
          modelNameToTableNameMapping: {
            ImportedModel: 'ImportedModel-1234-prod',
          },
        },
      ],
    });
    const getInstanceProps = createInstancePropsBySetupCDKApp({
      isSandboxMode: false,
    });
    const instance = dataFactory.getInstance(getInstanceProps);
    const importedModelStack = Template.fromStack(
      Stack.of(instance.resources.nestedStacks['ImportedModel']),
    );
    importedModelStack.hasResourceProperties(CUSTOM_IMPORTED_DDB_CFN_TYPE, {
      isImported: true,
      tableName: 'ImportedModel-1234-dev',
    });
    importedModelStack.hasResourceProperties(CUSTOM_IMPORTED_DDB_CFN_TYPE, {
      tableName: Match.not('ImportedModel-1234-prod'),
    });
  });

  void it('uses sandbox key for sandbox mode', () => {
    const schema = /* GraphQL */ `
      type ImportedModel @model {
        description: String
      }
    `;
    const dataFactory = defineData({
      schema,
      migratedAmplifyGen1DynamoDbTableMappings: [
        {
          branchName: 'testEnvName',
          modelNameToTableNameMapping: {
            ImportedModel: 'ImportedModel-1234-dev',
          },
        },
        {
          branchName: 'sandbox',
          modelNameToTableNameMapping: {
            ImportedModel: 'ImportedModel-1234-sandbox',
          },
        },
      ],
    });
    const getInstanceProps = createInstancePropsBySetupCDKApp({
      isSandboxMode: true,
    });
    const instance = dataFactory.getInstance(getInstanceProps);
    const importedModelStack = Template.fromStack(
      Stack.of(instance.resources.nestedStacks['ImportedModel']),
    );
    importedModelStack.hasResourceProperties(CUSTOM_IMPORTED_DDB_CFN_TYPE, {
      isImported: true,
      tableName: 'ImportedModel-1234-sandbox',
    });
    importedModelStack.hasResourceProperties(CUSTOM_IMPORTED_DDB_CFN_TYPE, {
      tableName: Match.not('ImportedModel-1234-dev'),
    });
  });

  void it('ignores undefined branches', () => {
    const schema = /* GraphQL */ `
      type ImportedModel @model {
        description: String
      }
    `;
    const dataFactory = defineData({
      schema,
      migratedAmplifyGen1DynamoDbTableMappings: [
        {
          branchName: 'testEnvName',
          modelNameToTableNameMapping: {
            ImportedModel: 'ImportedModel-1234-dev',
          },
        },
        {
          branchName: 'prod',
          modelNameToTableNameMapping: undefined,
        },
      ],
    });
    const getInstanceProps = createInstancePropsBySetupCDKApp({
      isSandboxMode: false,
    });
    const instance = dataFactory.getInstance(getInstanceProps);
    const importedModelStack = Template.fromStack(
      Stack.of(instance.resources.nestedStacks['ImportedModel']),
    );
    importedModelStack.hasResourceProperties(CUSTOM_IMPORTED_DDB_CFN_TYPE, {
      isImported: true,
      tableName: 'ImportedModel-1234-dev',
    });
  });

  void it('does not allow duplicate branch names', () => {
    const schema = /* GraphQL */ `
      type ImportedModel @model {
        description: String
      }
    `;
    const dataFactory = defineData({
      schema,
      migratedAmplifyGen1DynamoDbTableMappings: [
        {
          branchName: 'testEnvName',
          modelNameToTableNameMapping: {
            ImportedModel: 'ImportedModel-1234-dev1',
          },
        },
        {
          branchName: 'testEnvName',
          modelNameToTableNameMapping: {
            ImportedModel: 'ImportedModel-1234-dev2',
          },
        },
      ],
    });

    const getInstanceProps = createInstancePropsBySetupCDKApp({
      isSandboxMode: false,
    });
    assert.throws(() => dataFactory.getInstance(getInstanceProps), {
      message:
        'Branch names must be unique in the migratedAmplifyGen1DynamoDbTableMappings',
    });
  });
});

const resetFactoryCount = () => {
  DataFactory.factoryCount = 0;
};
