import { after, beforeEach, describe, it, mock } from 'node:test';
import { App, Stack } from 'aws-cdk-lib';
import {
  ConstructFactoryGetInstanceProps,
  ResourceNameValidator,
} from '@aws-amplify/plugin-types';
import assert from 'node:assert';
import { StackMetadataBackendOutputStorageStrategy } from '@aws-amplify/backend-output-storage';
import {
  ConstructContainerStub,
  ResourceNameValidatorStub,
  StackResolverStub,
} from '@aws-amplify/backend-platform-test-stubs';
import { defaultLambda } from './test-assets/default-lambda/resource.js';
import { Template } from 'aws-cdk-lib/assertions';
import {
  FunctionArchitecture,
  NodeVersion,
  defineFunction,
} from './factory.js';
import { lambdaWithDependencies } from './test-assets/lambda-with-dependencies/resource.js';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import fsp from 'fs/promises';
import path from 'node:path';
import { AmplifyUserError } from '@aws-amplify/platform-core';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const createStackAndSetContext = (): Stack => {
  const app = new App();
  app.node.setContext('amplify-backend-name', 'testEnvName');
  app.node.setContext('amplify-backend-namespace', 'testBackendId');
  app.node.setContext('amplify-backend-type', 'branch');
  const stack = new Stack(app);
  return stack;
};

void describe('AmplifyFunctionFactory', () => {
  let rootStack: Stack;
  let getInstanceProps: ConstructFactoryGetInstanceProps;
  let resourceNameValidator: ResourceNameValidator;

  beforeEach(() => {
    rootStack = createStackAndSetContext();

    const constructContainer = new ConstructContainerStub(
      new StackResolverStub(rootStack),
    );

    const outputStorageStrategy = new StackMetadataBackendOutputStorageStrategy(
      rootStack,
    );

    resourceNameValidator = new ResourceNameValidatorStub();

    getInstanceProps = {
      constructContainer,
      outputStorageStrategy,
      resourceNameValidator,
    };
  });

  after(async () => {
    // clean up generated env files
    await fsp.rm(path.join(process.cwd(), '.amplify'), {
      recursive: true,
      force: true,
      maxRetries: 3,
    });
  });

  void it('creates singleton function instance', () => {
    const functionFactory = defaultLambda;
    const instance1 = functionFactory.getInstance(getInstanceProps);
    const instance2 = functionFactory.getInstance(getInstanceProps);
    assert.strictEqual(instance1, instance2);
  });

  void it('verifies stack property exists and is equal to function stack', () => {
    const functionFactory = defaultLambda;
    const lambda = functionFactory.getInstance(getInstanceProps);
    assert.equal(lambda.stack, Stack.of(lambda.resources.lambda));
  });

  void it('resolves default name and entry when no args specified', () => {
    const functionFactory = defaultLambda;
    const lambda = functionFactory.getInstance(getInstanceProps);
    const template = Template.fromStack(lambda.stack);
    template.resourceCountIs('AWS::Lambda::Function', 1);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.handler',
    });
    const lambdaLogicalId = Object.keys(
      template.findResources('AWS::Lambda::Function'),
    )[0];
    // eslint-disable-next-line spellcheck/spell-checker
    assert.ok(lambdaLogicalId.includes('defaultlambda'));
  });

  void it('resolves default name when entry specified', () => {
    const functionFactory = defineFunction({
      entry: './test-assets/default-lambda/handler.ts',
    });
    const lambda = functionFactory.getInstance(getInstanceProps);
    const template = Template.fromStack(lambda.stack);
    template.resourceCountIs('AWS::Lambda::Function', 1);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.handler',
    });
    const lambdaLogicalId = Object.keys(
      template.findResources('AWS::Lambda::Function'),
    )[0];
    assert.ok(lambdaLogicalId.includes('handler'));
  });

  void it('uses name and entry that is explicitly specified', () => {
    const functionFactory = defineFunction({
      entry: './test-assets/default-lambda/handler.ts',
      name: 'myCoolLambda',
    });
    const lambda = functionFactory.getInstance(getInstanceProps);
    const template = Template.fromStack(lambda.stack);
    template.resourceCountIs('AWS::Lambda::Function', 1);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.handler',
    });
    const lambdaLogicalId = Object.keys(
      template.findResources('AWS::Lambda::Function'),
    )[0];
    assert.ok(lambdaLogicalId.includes('myCoolLambda'));
  });

  void it('sets friendly-name tag', () => {
    const functionFactory = defineFunction({
      entry: './test-assets/default-lambda/handler.ts',
      name: 'myCoolLambda',
    });
    const lambda = functionFactory.getInstance(getInstanceProps);
    const template = Template.fromStack(lambda.stack);
    template.resourceCountIs('AWS::Lambda::Function', 1);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Tags: [{ Key: 'amplify:friendly-name', Value: 'myCoolLambda' }],
    });
  });

  void it('throws on invalid name', () => {
    mock
      .method(resourceNameValidator, 'validate')
      .mock.mockImplementationOnce(() => {
        throw new Error('test validation error');
      });
    const functionFactory = defineFunction({
      entry: './test-assets/default-lambda/handler.ts',
      name: 'this!is@wrong',
    });
    assert.throws(() => functionFactory.getInstance(getInstanceProps), {
      message: 'test validation error',
    });
  });

  void it('builds lambda with local and 3p dependencies', () => {
    const lambda = lambdaWithDependencies.getInstance(getInstanceProps);
    const template = Template.fromStack(lambda.stack);
    // There isn't a way to check the contents of the bundled lambda using the CDK Template utility
    // So we just check that the lambda was created properly in the CFN template.
    // There is an e2e test that validates proper lambda bundling
    template.resourceCountIs('AWS::Lambda::Function', 1);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.handler',
    });
    const lambdaLogicalId = Object.keys(
      template.findResources('AWS::Lambda::Function'),
    )[0];
    // eslint-disable-next-line spellcheck/spell-checker
    assert.ok(lambdaLogicalId.includes('lambdawithdependencies'));
  });

  void it('allows adding environment variables after defining the function', () => {
    const functionFactory = defineFunction({
      entry: './test-assets/default-lambda/handler.ts',
      name: 'myCoolLambda',
    });
    const lambda = functionFactory.getInstance(getInstanceProps);
    lambda.addEnvironment('key1', 'value1');
    const stack = lambda.stack;
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Lambda::Function', 1);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          key1: 'value1',
        },
      },
    });
  });

  void describe('timeout property', () => {
    void it('sets valid timeout', () => {
      const lambda = defineFunction({
        entry: './test-assets/default-lambda/handler.ts',
        timeoutSeconds: 10,
      }).getInstance(getInstanceProps);
      const template = Template.fromStack(lambda.stack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 10,
      });
    });

    void it('throws on timeout below 1 second', () => {
      assert.throws(
        () =>
          defineFunction({
            entry: './test-assets/default-lambda/handler.ts',
            timeoutSeconds: 0,
          }).getInstance(getInstanceProps),
        new AmplifyUserError('InvalidTimeoutError', {
          message: `Invalid function timeout of 0`,
          resolution: `timeoutSeconds must be a whole number between 1 and 900 inclusive`,
        }),
      );
    });

    void it('throws on timeout above 15 minutes', () => {
      assert.throws(
        () =>
          defineFunction({
            entry: './test-assets/default-lambda/handler.ts',
            timeoutSeconds: 901,
          }).getInstance(getInstanceProps),
        new AmplifyUserError('InvalidTimeoutError', {
          message: `Invalid function timeout of 901`,
          resolution: `timeoutSeconds must be a whole number between 1 and 900 inclusive`,
        }),
      );
    });

    void it('throws on fractional timeout', () => {
      assert.throws(
        () =>
          defineFunction({
            entry: './test-assets/default-lambda/handler.ts',
            timeoutSeconds: 10.5,
          }).getInstance(getInstanceProps),
        new AmplifyUserError('InvalidTimeoutError', {
          message: `Invalid function timeout of 10.5`,
          resolution: `timeoutSeconds must be a whole number between 1 and 900 inclusive`,
        }),
      );
    });
  });

  void describe('memory property', () => {
    void it('sets valid memory', () => {
      const lambda = defineFunction({
        entry: './test-assets/default-lambda/handler.ts',
        memoryMB: 234,
      }).getInstance(getInstanceProps);
      const template = Template.fromStack(lambda.stack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 234,
      });
    });

    void it('sets default memory', () => {
      const lambda = defineFunction({
        entry: './test-assets/default-lambda/handler.ts',
      }).getInstance(getInstanceProps);
      const template = Template.fromStack(lambda.stack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 512,
      });
    });

    void it('throws on memory below 128 MB', () => {
      assert.throws(
        () =>
          defineFunction({
            entry: './test-assets/default-lambda/handler.ts',
            memoryMB: 127,
          }).getInstance(getInstanceProps),
        new AmplifyUserError('InvalidMemoryMBError', {
          message: `Invalid function memoryMB of 127`,
          resolution: `memoryMB must be a whole number between 128 and 10240 inclusive`,
        }),
      );
    });

    void it('throws on memory above 10240 MB', () => {
      assert.throws(
        () =>
          defineFunction({
            entry: './test-assets/default-lambda/handler.ts',
            memoryMB: 10241,
          }).getInstance(getInstanceProps),
        new AmplifyUserError('InvalidMemoryMBError', {
          message: `Invalid function memoryMB of 10241`,
          resolution: `memoryMB must be a whole number between 128 and 10240 inclusive`,
        }),
      );
    });

    void it('throws on fractional memory', () => {
      assert.throws(
        () =>
          defineFunction({
            entry: './test-assets/default-lambda/handler.ts',
            memoryMB: 256.2,
          }).getInstance(getInstanceProps),
        new AmplifyUserError('InvalidMemoryMBError', {
          message: `Invalid function memoryMB of 256.2`,
          resolution: `memoryMB must be a whole number between 128 and 10240 inclusive`,
        }),
      );
    });
  });

  void describe('environment property', () => {
    void it('sets valid environment', () => {
      const functionFactory = defineFunction({
        entry: './test-assets/default-lambda/handler.ts',
        name: 'myCoolLambda',
        environment: {
          TEST_ENV: 'testValue',
        },
      });
      const lambda = functionFactory.getInstance(getInstanceProps);
      const stack = lambda.stack;
      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            TEST_ENV: 'testValue',
          },
        },
      });
    });

    void it('sets default environment', () => {
      const functionFactory = defineFunction({
        entry: './test-assets/default-lambda/handler.ts',
        name: 'myCoolLambda',
      });
      const lambda = functionFactory.getInstance(getInstanceProps);
      const stack = lambda.stack;
      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {},
      });
    });

    void it('throws when adding environment variables with invalid key', () => {
      assert.throws(
        () =>
          defineFunction({
            entry: './test-assets/default-lambda/handler.ts',
            name: 'myCoolLambda',
            environment: {
              'this.is.wrong': 'testValue',
            },
          }).getInstance(getInstanceProps),
        new AmplifyUserError('InvalidEnvironmentKeyError', {
          message: `Invalid function environment key(s): this.is.wrong`,
          resolution:
            'Environment keys must match [a-zA-Z]([a-zA-Z0-9_])+ and be at least 2 characters',
        }),
      );
    });

    void it('throws when adding environment variables with key less than 2 characters', () => {
      assert.throws(
        () =>
          defineFunction({
            entry: './test-assets/default-lambda/handler.ts',
            name: 'myCoolLambda',
            environment: {
              A: 'testValue',
            },
          }).getInstance(getInstanceProps),
        new AmplifyUserError('InvalidEnvironmentKeyError', {
          message: `Invalid function environment key(s): A`,
          resolution:
            'Environment keys must match [a-zA-Z]([a-zA-Z0-9_])+ and be at least 2 characters',
        }),
      );
    });

    void it('throws when multiple environment variables are invalid', () => {
      assert.throws(
        () =>
          defineFunction({
            entry: './test-assets/default-lambda/handler.ts',
            name: 'lambdaWithMultipleEnvVars',
            environment: {
              A: 'testValueA',
              TEST_ENV: 'envValue',
              'this.is.wrong': 'testValue',
            },
          }).getInstance(getInstanceProps),
        new AmplifyUserError('InvalidEnvironmentKeyError', {
          message: `Invalid function environment key(s): A, this.is.wrong`,
          resolution:
            'Environment keys must match [a-zA-Z]([a-zA-Z0-9_])+ and be at least 2 characters',
        }),
      );
    });
  });

  void describe('runtime property', () => {
    void it('sets valid runtime', () => {
      const lambda = defineFunction({
        entry: './test-assets/default-lambda/handler.ts',
        runtime: 22,
      }).getInstance(getInstanceProps);
      const template = Template.fromStack(lambda.stack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: Runtime.NODEJS_22_X.name,
      });
    });

    void it('defaults to oldest LTS runtime', () => {
      const lambda = defineFunction({
        entry: './test-assets/default-lambda/handler.ts',
      }).getInstance(getInstanceProps);
      const template = Template.fromStack(lambda.stack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: Runtime.NODEJS_20_X.name,
      });
    });

    void it('throws on invalid runtime', () => {
      assert.throws(
        () =>
          defineFunction({
            entry: './test-assets/default-lambda/handler.ts',
            runtime: 14 as NodeVersion,
          }).getInstance(getInstanceProps),
        new AmplifyUserError('InvalidRuntimeError', {
          message: `Invalid function runtime of 14`,
          resolution: 'runtime must be one of the following: 16, 18, 20, 22',
        }),
      );
    });

    void it('throws when the oldest maintained Node LTS reaches end of life', () => {
      // A month before the date when the oldest Node LTS maintenance ends according to https://github.com/nodejs/release#release-schedule.
      // Once this test fails, update endDate to a month before the end date of the next Node LTS version.
      // After updating the date, next would be updating the default function runtime in factory.ts.
      const endDate = new Date('2026-03-30');
      const currentDate = new Date();

      assert.ok(endDate > currentDate);
    });
  });

  void describe('architecture property', () => {
    void it('sets valid architecture', () => {
      const lambda = defineFunction({
        entry: './test-assets/default-lambda/handler.ts',
        architecture: 'arm64',
      }).getInstance(getInstanceProps);
      const template = Template.fromStack(lambda.stack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        Architectures: [Architecture.ARM_64.name],
      });
    });
  });

  void it('throws on invalid architecture', () => {
    assert.throws(
      () =>
        defineFunction({
          entry: './test-assets/default-lambda/handler.ts',
          architecture: 'invalid' as FunctionArchitecture,
        }).getInstance(getInstanceProps),
      new AmplifyUserError('InvalidArchitectureError', {
        message: `Invalid function architecture of invalid`,
        resolution: 'architecture must be one of the following: arm64, x86_64',
      }),
    );
  });

  void describe('schedule property', () => {
    void it('sets valid schedule - rate', () => {
      const lambda = defineFunction({
        entry: './test-assets/default-lambda/handler.ts',
        schedule: 'every 5m',
      }).getInstance(getInstanceProps);
      const template = Template.fromStack(lambda.stack);

      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'cron(*/5 * * * ? *)',
        Targets: [
          {
            Arn: {
              // eslint-disable-next-line spellcheck/spell-checker
              'Fn::GetAtt': ['handlerlambdaE29D1580', 'Arn'],
            },
            Id: 'Target0',
          },
        ],
      });
    });

    void it('sets valid schedule - cron', () => {
      const lambda = defineFunction({
        entry: './test-assets/default-lambda/handler.ts',
        schedule: '0 1 * * ?',
      }).getInstance(getInstanceProps);
      const template = Template.fromStack(lambda.stack);

      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'cron(0 1 * * ? *)',
        Targets: [
          {
            Arn: {
              // eslint-disable-next-line spellcheck/spell-checker
              'Fn::GetAtt': ['handlerlambdaE29D1580', 'Arn'],
            },
            Id: 'Target0',
          },
        ],
      });
    });

    void it('sets valid schedule array', () => {
      const lambda = defineFunction({
        entry: './test-assets/default-lambda/handler.ts',
        schedule: ['0 1 * * ?', 'every 5m'],
      }).getInstance(getInstanceProps);
      const template = Template.fromStack(lambda.stack);

      template.resourceCountIs('AWS::Events::Rule', 2);

      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'cron(0 1 * * ? *)',
      });

      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'cron(*/5 * * * ? *)',
      });
    });

    void it('defaults to no event rule created', () => {
      const lambda = defineFunction({
        entry: './test-assets/default-lambda/handler.ts',
      }).getInstance(getInstanceProps);
      const template = Template.fromStack(lambda.stack);

      template.resourceCountIs('AWS::Events::Rule', 0);
    });
  });

  void describe('minify property', () => {
    void it('sets minify to false', () => {
      const lambda = defineFunction({
        entry: './test-assets/default-lambda/handler.ts',
        bundling: {
          minify: false,
        },
      }).getInstance(getInstanceProps);
      const template = Template.fromStack(lambda.stack);
      // There isn't a way to check the contents of the bundled lambda using the CDK Template utility
      // So we just check that the lambda was created properly in the CFN template.
      // There is an e2e test that validates proper lambda bundling
      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
      });
    });
  });

  void describe('logging options', () => {
    void it('sets logging options', () => {
      const lambda = defineFunction({
        entry: './test-assets/default-lambda/handler.ts',
        bundling: {
          minify: false,
        },
        logging: {
          format: 'json',
          level: 'warn',
          retention: '13 months',
        },
      }).getInstance(getInstanceProps);
      const template = Template.fromStack(lambda.stack);
      // Enabling log retention adds extra lambda.
      template.resourceCountIs('AWS::Lambda::Function', 2);
      const lambdas = template.findResources('AWS::Lambda::Function');
      assert.ok(
        Object.keys(lambdas).some((key) => key.startsWith('LogRetention')),
      );
      template.hasResourceProperties('Custom::LogRetention', {
        RetentionInDays: 400,
      });
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
        LoggingConfig: {
          ApplicationLogLevel: 'WARN',
          LogFormat: 'JSON',
        },
      });
    });
  });

  void describe('resourceAccessAcceptor', () => {
    void it('attaches policy to execution role and configures ssm environment context', () => {
      const functionFactory = defineFunction({
        entry: './test-assets/default-lambda/handler.ts',
        name: 'myCoolLambda',
      });
      const lambda = functionFactory.getInstance(getInstanceProps);
      const stack = lambda.stack;
      const policy = new Policy(stack, 'testPolicy', {
        statements: [
          new PolicyStatement({
            actions: ['s3:GetObject'],
            resources: ['testBucket/testPath'],
          }),
        ],
      });
      lambda
        .getResourceAccessAcceptor()
        .acceptResourceAccess(policy, [
          { name: 'testContext', path: 'testPath' },
        ]);
      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            AMPLIFY_SSM_ENV_CONFIG: '{"testContext":{"path":"testPath"}}',
            testContext: '<value will be resolved during runtime>',
          },
        },
      });
      template.hasResourceProperties('AWS::IAM::Policy', {
        // eslint-disable-next-line spellcheck/spell-checker
        Roles: [{ Ref: 'myCoolLambdalambdaServiceRoleC9BABDE6' }],
      });
    });
  });

  void describe('storeOutput', () => {
    void it('stores output using the provided strategy', () => {
      const functionFactory = defineFunction({
        entry: './test-assets/default-lambda/handler.ts',
        name: 'testLambdaName',
      });
      functionFactory.getInstance(getInstanceProps);
      const template = Template.fromStack(rootStack);
      // Getting output value is messy due to usage of Lazy to defer output value
      const outputValue =
        template.findOutputs('definedFunctions').definedFunctions.Value;
      assert.deepStrictEqual(outputValue, {
        ['Fn::Join']: [
          '',
          [
            '["',
            {
              ['Fn::GetAtt']: [
                /* eslint-disable spellcheck/spell-checker */
                'functionNestedStackfunctionNestedStackResource1351588B',
                'Outputs.functiontestLambdaNamelambda36106226Ref',
                /* eslint-enable spellcheck/spell-checker */
              ],
            },
            '"]',
          ],
        ],
      });
    });
  });

  void describe('function overrides', () => {
    void it('can override function properties', () => {
      const lambda = defineFunction({
        entry: './test-assets/default-lambda/handler.ts',
        name: 'myCoolLambda',
        memoryMB: 512,
      }).getInstance(getInstanceProps);
      lambda.resources.cfnResources.cfnFunction.addPropertyOverride(
        'MemorySize',
        256,
      );
      const template = Template.fromStack(
        Stack.of(lambda.resources.cfnResources.cfnFunction),
      );
      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 256,
      });
    });
  });

  void it('stores single attribution data value in stack with multiple functions', () => {
    const functionFactory = defineFunction({
      entry: './test-assets/default-lambda/handler.ts',
      name: 'testLambdaName',
    });
    const anotherFunction = defineFunction({
      entry: './test-assets/default-lambda/handler.ts',
      name: 'anotherName',
    });
    const functionStack = functionFactory.getInstance(getInstanceProps).stack;
    anotherFunction.getInstance(getInstanceProps);
    const template = Template.fromStack(functionStack);
    assert.equal(
      JSON.parse(template.toJSON().Description).stackType,
      'function-Lambda',
    );
  });

  void describe('ephemeralStorageSizeMB property', () => {
    void it('sets valid ephemeralStorageSize', () => {
      const lambda = defineFunction({
        entry: './test-assets/default-lambda/handler.ts',
        ephemeralStorageSizeMB: 1024,
      }).getInstance(getInstanceProps);
      const template = Template.fromStack(lambda.stack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        EphemeralStorage: { Size: 1024 },
      });
    });

    void it('sets default ephemeralStorageSizeMB', () => {
      const lambda = defineFunction({
        entry: './test-assets/default-lambda/handler.ts',
      }).getInstance(getInstanceProps);
      const template = Template.fromStack(lambda.stack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        EphemeralStorage: { Size: 512 },
      });
    });

    void it('throws on ephemeralStorageSizeMB below 512 MB', () => {
      assert.throws(
        () =>
          defineFunction({
            entry: './test-assets/default-lambda/handler.ts',
            ephemeralStorageSizeMB: 511,
          }).getInstance(getInstanceProps),
        new AmplifyUserError('InvalidEphemeralStorageSizeMBError', {
          message: `Invalid function ephemeralStorageSizeMB of 511`,
          resolution: `ephemeralStorageSizeMB must be a whole number between 512 and 10240 inclusive`,
        }),
      );
    });

    void it('throws on ephemeralStorageSizeMB above 10240 MB', () => {
      assert.throws(
        () =>
          defineFunction({
            entry: './test-assets/default-lambda/handler.ts',
            ephemeralStorageSizeMB: 10241,
          }).getInstance(getInstanceProps),
        new AmplifyUserError('InvalidEphemeralStorageSizeMBError', {
          message: `Invalid function ephemeralStorageSizeMB of 10241`,
          resolution: `ephemeralStorageSizeMB must be a whole number between 512 and 10240 inclusive`,
        }),
      );
    });

    void it('throws on fractional ephemeralStorageSizeMB', () => {
      assert.throws(
        () =>
          defineFunction({
            entry: './test-assets/default-lambda/handler.ts',
            ephemeralStorageSizeMB: 512.5,
          }).getInstance(getInstanceProps),
        new AmplifyUserError('InvalidEphemeralStorageSizeMBError', {
          message: `Invalid function ephemeralStorageSizeMB of 512.5`,
          resolution: `ephemeralStorageSizeMB must be a whole number between 512 and 10240 inclusive`,
        }),
      );
    });
  });

  void describe('provided function runtime property', () => {
    void it('sets valid runtime', () => {
      const lambda = defineFunction((scope) => {
        return new NodejsFunction(scope, 'nodejs-provided', {
          entry:
            './packages/backend-function/src/test-assets/default-lambda/handler.ts',
          runtime: Runtime.NODEJS_22_X,
        });
      }).getInstance(getInstanceProps);
      const template = Template.fromStack(lambda.stack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: Runtime.NODEJS_22_X.name,
      });
    });

    void it('provided function defaults to oldest runtime', () => {
      const lambda = defineFunction((scope) => {
        return new NodejsFunction(scope, 'nodejs-provided', {
          entry:
            './packages/backend-function/src/test-assets/default-lambda/handler.ts',
        });
      }).getInstance(getInstanceProps);
      const template = Template.fromStack(lambda.stack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: Runtime.NODEJS_16_X.name,
      });
    });
  });
});
