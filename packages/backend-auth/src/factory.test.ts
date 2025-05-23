import { beforeEach, describe, it, mock } from 'node:test';
import { AmplifyAuthFactory, BackendAuth, defineAuth } from './factory.js';
import { App, Stack, aws_lambda } from 'aws-cdk-lib';
import assert from 'node:assert';
import { Match, Template } from 'aws-cdk-lib/assertions';
import {
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
} from '@aws-amplify/plugin-types';
import { UserPoolSnsOptions, triggerEvents } from '@aws-amplify/auth-construct';
import { StackMetadataBackendOutputStorageStrategy } from '@aws-amplify/backend-output-storage';
import {
  ConstructContainerStub,
  ImportPathVerifierStub,
  ResourceNameValidatorStub,
  StackResolverStub,
} from '@aws-amplify/backend-platform-test-stubs';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { AmplifyUserError } from '@aws-amplify/platform-core';
import { CfnFunction } from 'aws-cdk-lib/aws-lambda';
import { Key } from 'aws-cdk-lib/aws-kms';
import { CustomEmailSender, CustomSmsSender } from './types.js';

const createStackAndSetContext = (): Stack => {
  const app = new App();
  app.node.setContext('amplify-backend-name', 'testEnvName');
  app.node.setContext('amplify-backend-namespace', 'testBackendId');
  app.node.setContext('amplify-backend-type', 'branch');
  const stack = new Stack(app);
  return stack;
};

void describe('AmplifyAuthFactory', () => {
  let authFactory: ConstructFactory<BackendAuth>;
  let constructContainer: ConstructContainer;
  let outputStorageStrategy: BackendOutputStorageStrategy<BackendOutputEntry>;
  let importPathVerifier: ImportPathVerifier;
  let getInstanceProps: ConstructFactoryGetInstanceProps;
  let resourceNameValidator: ResourceNameValidator;
  let stack: Stack;
  beforeEach(() => {
    resetFactoryCount();
    authFactory = defineAuth({
      loginWith: { email: true },
    });

    stack = createStackAndSetContext();

    constructContainer = new ConstructContainerStub(
      new StackResolverStub(stack),
    );

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
    const instance1 = authFactory.getInstance(getInstanceProps);
    const instance2 = authFactory.getInstance(getInstanceProps);

    assert.strictEqual(instance1, instance2);
  });

  void it('verifies stack property exists and is equivalent to auth stack', () => {
    const backendAuth = authFactory.getInstance(getInstanceProps);
    assert.equal(backendAuth.stack, Stack.of(backendAuth.resources.userPool));
  });

  void it('adds construct to stack', () => {
    const backendAuth = authFactory.getInstance(getInstanceProps);

    const template = Template.fromStack(backendAuth.stack);

    template.resourceCountIs('AWS::Cognito::UserPool', 1);
  });

  void it('tags resources with friendly name', () => {
    resetFactoryCount();
    const authFactory = defineAuth({
      loginWith: { email: true },
      name: 'testNameFoo',
    });

    const backendAuth = authFactory.getInstance(getInstanceProps);

    const template = Template.fromStack(backendAuth.stack);

    template.resourceCountIs('AWS::Cognito::UserPool', 1);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UserPoolTags: { 'amplify:friendly-name': 'testNameFoo' },
    });
  });

  void it('throws on invalid name', () => {
    mock
      .method(resourceNameValidator, 'validate')
      .mock.mockImplementationOnce(() => {
        throw new Error('test validation error');
      });
    resetFactoryCount();
    const authFactory = defineAuth({
      loginWith: { email: true },
      name: 'this!is@wrong$',
    });
    assert.throws(() => authFactory.getInstance(getInstanceProps), {
      message: 'test validation error',
    });
  });

  void it('verifies constructor import path', () => {
    const importPathVerifier = {
      verify: mock.fn(),
    };

    authFactory.getInstance({ ...getInstanceProps, importPathVerifier });

    assert.ok(
      (importPathVerifier.verify.mock.calls[0].arguments[0] as string).includes(
        'defineAuth',
      ),
    );
  });

  void it('should throw TooManyAmplifyAuthFactoryError when defineAuth is called multiple times', () => {
    assert.throws(
      () => {
        defineAuth({
          loginWith: { email: true },
        });
        defineAuth({
          loginWith: { email: true },
        });
      },
      new AmplifyUserError('MultipleSingletonResourcesError', {
        message:
          'Multiple `defineAuth` or `referenceAuth` calls are not allowed within an Amplify backend',
        resolution: 'Remove all but one `defineAuth` or `referenceAuth` call',
      }),
    );
  });

  void it('if access is defined, it should attach valid policy to the resource', () => {
    const mockAcceptResourceAccess = mock.fn();
    const lambdaResourceStub = {
      getInstance: () => ({
        getResourceAccessAcceptor: () => ({
          acceptResourceAccess: mockAcceptResourceAccess,
        }),
      }),
    } as unknown as ConstructFactory<
      ResourceProvider & ResourceAccessAcceptorFactory
    >;

    resetFactoryCount();

    authFactory = defineAuth({
      loginWith: { email: true },
      access: (allow) => [
        allow.resource(lambdaResourceStub).to(['managePasswordRecovery']),
        allow.resource(lambdaResourceStub).to(['createUser']),
      ],
    });

    const backendAuth = authFactory.getInstance(getInstanceProps);

    assert.equal(mockAcceptResourceAccess.mock.callCount(), 2);
    assert.ok(
      mockAcceptResourceAccess.mock.calls[0].arguments[0] instanceof Policy,
    );
    assert.deepStrictEqual(
      mockAcceptResourceAccess.mock.calls[0].arguments[0].document.toJSON(),
      {
        Statement: [
          {
            Action: [
              'cognito-idp:AdminResetUserPassword',
              'cognito-idp:AdminSetUserPassword',
            ],
            Effect: 'Allow',
            Resource: backendAuth.resources.userPool.userPoolArn,
          },
        ],
        Version: '2012-10-17',
      },
    );
    assert.ok(
      mockAcceptResourceAccess.mock.calls[1].arguments[0] instanceof Policy,
    );
    assert.deepStrictEqual(
      mockAcceptResourceAccess.mock.calls[1].arguments[0].document.toJSON(),
      {
        Statement: [
          {
            Action: 'cognito-idp:AdminCreateUser',
            Effect: 'Allow',
            Resource: backendAuth.resources.userPool.userPoolArn,
          },
        ],
        Version: '2012-10-17',
      },
    );
  });

  triggerEvents.forEach((event) => {
    void it(`resolves ${event} trigger and attaches handler to auth construct`, () => {
      const testFunc = new aws_lambda.Function(stack, 'testFunc', {
        code: aws_lambda.Code.fromInline('test placeholder'),
        runtime: aws_lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
      });
      const funcStub: ConstructFactory<ResourceProvider<FunctionResources>> = {
        getInstance: () => {
          return {
            resources: {
              lambda: testFunc,
              cfnResources: {
                cfnFunction: testFunc.node.findChild('Resource') as CfnFunction,
              },
            },
          };
        },
      };

      resetFactoryCount();

      const authWithTriggerFactory = defineAuth({
        loginWith: { email: true },
        triggers: { [event]: funcStub },
      });

      const backendAuth = authWithTriggerFactory.getInstance(getInstanceProps);

      const template = Template.fromStack(backendAuth.stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        LambdaConfig: {
          // The key in the CFN template is the trigger event name with the first character uppercase
          [upperCaseFirstChar(event)]: {
            Ref: Match.stringLikeRegexp('testFunc'),
          },
        },
      });
    });
  });

  void describe('getResourceAccessAcceptor', () => {
    void it('attaches policies to the authenticated role', () => {
      const backendAuth = authFactory.getInstance(getInstanceProps);
      const testPolicy = new Policy(stack, 'testPolicy', {
        statements: [
          new PolicyStatement({
            actions: ['s3:GetObject'],
            resources: ['testBucket/testObject/*'],
          }),
        ],
      });
      const resourceAccessAcceptor = backendAuth.getResourceAccessAcceptor(
        'authenticatedUserIamRole',
      );

      assert.equal(
        resourceAccessAcceptor.identifier,
        'authenticatedUserIamRoleResourceAccessAcceptor',
      );

      resourceAccessAcceptor.acceptResourceAccess(testPolicy, [
        { name: 'test', path: 'test' },
      ]);
      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::IAM::Policy', 1);
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Action: 's3:GetObject',
              Effect: 'Allow',
              Resource: 'testBucket/testObject/*',
            },
          ],
        },
        Roles: [
          {
            'Fn::GetAtt': [
              // eslint-disable-next-line spellcheck/spell-checker
              'authNestedStackauthNestedStackResource179371D7',
              // eslint-disable-next-line spellcheck/spell-checker
              'Outputs.authamplifyAuthauthenticatedUserRoleF3353E83Ref',
            ],
          },
        ],
      });
    });

    void it('attaches policies to the unauthenticated role', () => {
      const backendAuth = authFactory.getInstance(getInstanceProps);
      const testPolicy = new Policy(stack, 'testPolicy', {
        statements: [
          new PolicyStatement({
            actions: ['s3:GetObject'],
            resources: ['testBucket/testObject/*'],
          }),
        ],
      });
      const resourceAccessAcceptor = backendAuth.getResourceAccessAcceptor(
        'unauthenticatedUserIamRole',
      );

      assert.equal(
        resourceAccessAcceptor.identifier,
        'unauthenticatedUserIamRoleResourceAccessAcceptor',
      );

      resourceAccessAcceptor.acceptResourceAccess(testPolicy, [
        { name: 'test', path: 'test' },
      ]);
      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::IAM::Policy', 1);
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Action: 's3:GetObject',
              Effect: 'Allow',
              Resource: 'testBucket/testObject/*',
            },
          ],
        },
        Roles: [
          {
            'Fn::GetAtt': [
              // eslint-disable-next-line spellcheck/spell-checker
              'authNestedStackauthNestedStackResource179371D7',
              // eslint-disable-next-line spellcheck/spell-checker
              'Outputs.authamplifyAuthunauthenticatedUserRoleE350B280Ref',
            ],
          },
        ],
      });
    });
  });

  void it('sets customEmailSender when function is provided as email sender', () => {
    const testFunc = new aws_lambda.Function(stack, 'testFunc', {
      code: aws_lambda.Code.fromInline('test placeholder'),
      runtime: aws_lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
    });
    const funcStub: ConstructFactory<ResourceProvider<FunctionResources>> = {
      getInstance: () => {
        return {
          resources: {
            lambda: testFunc,
            cfnResources: {
              cfnFunction: testFunc.node.findChild('Resource') as CfnFunction,
            },
          },
        };
      },
    };
    const customEmailSender: CustomEmailSender = {
      handler: funcStub,
    };
    resetFactoryCount();

    const authWithTriggerFactory = defineAuth({
      loginWith: { email: true },
      senders: { email: customEmailSender },
    });

    const backendAuth = authWithTriggerFactory.getInstance(getInstanceProps);

    const template = Template.fromStack(backendAuth.stack);

    template.hasResourceProperties('AWS::Cognito::UserPool', {
      LambdaConfig: {
        CustomEmailSender: {
          LambdaArn: {
            Ref: Match.stringLikeRegexp('testFunc'),
          },
        },
        KMSKeyID: {
          Ref: Match.stringLikeRegexp('CustomSenderKey'),
        },
      },
    });
  });

  void it('sets Sms sender configuration when provided', () => {
    const snsSmsSettings: UserPoolSnsOptions = {
      externalId: 'fake-external-id',
      snsCallerArn: 'arn:aws:iam::123456789012:role/myRole',
      snsRegion: 'fake-region',
    };
    resetFactoryCount();

    const authWithTriggerFactory = defineAuth({
      loginWith: { email: true },
      senders: { sms: snsSmsSettings },
    });

    const backendAuth = authWithTriggerFactory.getInstance(getInstanceProps);

    const template = Template.fromStack(backendAuth.stack);

    template.hasResourceProperties('AWS::Cognito::UserPool', {
      SmsConfiguration: {
        ExternalId: snsSmsSettings.externalId,
        SnsCallerArn: snsSmsSettings.snsCallerArn,
        SnsRegion: snsSmsSettings.snsRegion,
      },
    });
  });

  void it('sets customSmsSender when function is provided as sms sender', () => {
    const testFunc = new aws_lambda.Function(stack, 'testFunc', {
      code: aws_lambda.Code.fromInline('test placeholder'),
      runtime: aws_lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
    });
    const funcStub: ConstructFactory<ResourceProvider<FunctionResources>> = {
      getInstance: () => {
        return {
          resources: {
            lambda: testFunc,
            cfnResources: {
              cfnFunction: testFunc.node.findChild('Resource') as CfnFunction,
            },
          },
        };
      },
    };
    const customSmsSender: CustomSmsSender = {
      handler: funcStub,
    };
    resetFactoryCount();

    const authWithTriggerFactory = defineAuth({
      loginWith: { email: true },
      senders: { sms: customSmsSender },
    });

    const backendAuth = authWithTriggerFactory.getInstance(getInstanceProps);

    const template = Template.fromStack(backendAuth.stack);

    template.hasResourceProperties('AWS::Cognito::UserPool', {
      LambdaConfig: {
        CustomSMSSender: {
          LambdaArn: {
            Ref: Match.stringLikeRegexp('testFunc'),
          },
        },
        KMSKeyID: {
          Ref: Match.stringLikeRegexp('CustomSenderKey'),
        },
      },
    });
  });

  void it('sets custom senders when functions are provided for both sms and email', () => {
    const testFunc = new aws_lambda.Function(stack, 'testFunc', {
      code: aws_lambda.Code.fromInline('test placeholder'),
      runtime: aws_lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
    });
    const funcStub: ConstructFactory<ResourceProvider<FunctionResources>> = {
      getInstance: () => {
        return {
          resources: {
            lambda: testFunc,
            cfnResources: {
              cfnFunction: testFunc.node.findChild('Resource') as CfnFunction,
            },
          },
        };
      },
    };
    const customEmailSender: CustomEmailSender = {
      handler: funcStub,
    };
    const customSmsSender: CustomSmsSender = {
      handler: funcStub,
    };
    resetFactoryCount();

    const authWithTriggerFactory = defineAuth({
      loginWith: { email: true },
      senders: { sms: customSmsSender, email: customEmailSender },
    });

    const backendAuth = authWithTriggerFactory.getInstance(getInstanceProps);

    const template = Template.fromStack(backendAuth.stack);

    template.hasResourceProperties('AWS::Cognito::UserPool', {
      LambdaConfig: {
        CustomSMSSender: {
          LambdaArn: {
            Ref: Match.stringLikeRegexp('testFunc'),
          },
        },
        CustomEmailSender: {
          LambdaArn: {
            Ref: Match.stringLikeRegexp('testFunc'),
          },
        },
        KMSKeyID: {
          Ref: Match.stringLikeRegexp('CustomSenderKey'),
        },
      },
    });
  });

  void it('ensures empty lambdaTriggers do not remove triggers added elsewhere', () => {
    const testFunc = new aws_lambda.Function(stack, 'testFunc', {
      code: aws_lambda.Code.fromInline('test placeholder'),
      runtime: aws_lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
    });
    const funcStub: ConstructFactory<ResourceProvider<FunctionResources>> = {
      getInstance: () => {
        return {
          resources: {
            lambda: testFunc,
            cfnResources: {
              cfnFunction: testFunc.node.findChild('Resource') as CfnFunction,
            },
          },
        };
      },
    };
    const customEmailSender: CustomEmailSender = {
      handler: funcStub,
    };
    resetFactoryCount();

    const authWithTriggerFactory = defineAuth({
      loginWith: { email: true },
      senders: { email: customEmailSender },
      triggers: { preSignUp: funcStub },
    });

    const backendAuth = authWithTriggerFactory.getInstance(getInstanceProps);

    const template = Template.fromStack(backendAuth.stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      LambdaConfig: {
        PreSignUp: {
          Ref: Match.stringLikeRegexp('testFunc'),
        },
        CustomEmailSender: {
          LambdaArn: {
            Ref: Match.stringLikeRegexp('testFunc'),
          },
        },
        KMSKeyID: {
          Ref: Match.stringLikeRegexp('CustomSenderKey'),
        },
      },
    });
  });
  void it('uses provided KMS key ARN and sets up custom email sender', () => {
    const customKmsKeyArn = new Key(stack, `CustomSenderKey`, {
      enableKeyRotation: true,
    });
    const testFunc = new aws_lambda.Function(stack, 'testFunc', {
      code: aws_lambda.Code.fromInline('test placeholder'),
      runtime: aws_lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
    });
    const funcStub: ConstructFactory<ResourceProvider<FunctionResources>> = {
      getInstance: () => ({
        resources: {
          lambda: testFunc,
          cfnResources: {
            cfnFunction: testFunc.node.findChild('Resource') as CfnFunction,
          },
        },
      }),
    };
    const customEmailSender: CustomEmailSender = {
      handler: funcStub,
      kmsKeyArn: customKmsKeyArn.keyArn,
    };
    resetFactoryCount();

    const authWithTriggerFactory = defineAuth({
      loginWith: { email: true },
      senders: {
        email: customEmailSender,
      },
      triggers: { preSignUp: funcStub },
    });

    const backendAuth = authWithTriggerFactory.getInstance(getInstanceProps);
    const template = Template.fromStack(backendAuth.stack);

    template.hasResourceProperties('AWS::Cognito::UserPool', {
      LambdaConfig: {
        KMSKeyID: {
          Ref: Match.stringLikeRegexp('CustomSenderKey'),
        },
      },
    });
  });
});

const upperCaseFirstChar = (str: string) => {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
};

const resetFactoryCount = () => {
  AmplifyAuthFactory.factoryCount = 0;
};
