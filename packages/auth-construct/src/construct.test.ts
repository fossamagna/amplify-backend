import { beforeEach, describe, it, mock } from 'node:test';
import { AmplifyAuth } from './construct.js';
import { App, SecretValue, Stack, aws_cognito } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import assert from 'node:assert';
import {
  BackendOutputEntry,
  BackendOutputStorageStrategy,
} from '@aws-amplify/plugin-types';
import { CfnUserPoolClient, ProviderAttribute } from 'aws-cdk-lib/aws-cognito';
import { authOutputKey } from '@aws-amplify/backend-output-schemas';
import { DEFAULTS } from './defaults.js';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

const googleClientId = 'googleClientId';
const googleClientSecret = 'googleClientSecret';
const amazonClientId = 'amazonClientId';
const amazonClientSecret = 'amazonClientSecret';
const appleClientId = 'appleClientId';
const applePrivateKey = 'applePrivateKey';
const appleTeamId = 'team';
const appleKeyId = 'key';
const facebookClientId = 'facebookClientId';
const facebookClientSecret = 'facebookClientSecret';
const oidcClientId = 'oidcClientId';
const oidcClientSecret = 'oidcClientSecret';
const oidcIssuerUrl = 'https://mysampleoidcissuer.com';
const oidcProviderName = 'MyOidcProvider';
const oidcClientId2 = 'oidcClientId2';
const oidcClientSecret2 = 'oidcClientSecret2';
const oidcIssuerUrl2 = 'https://mysampleoidcissuer2.com';
const oidcProviderName2 = 'MyOidcProvider2';
const ExpectedGoogleIDPProperties = {
  ProviderDetails: {
    authorize_scopes: 'profile',
    client_id: googleClientId,
    client_secret: googleClientSecret,
  },
  ProviderName: 'Google',
  ProviderType: 'Google',
};
const ExpectedFacebookIDPProperties = {
  ProviderDetails: {
    authorize_scopes: 'public_profile',
    client_id: facebookClientId,
    client_secret: facebookClientSecret,
  },
  ProviderName: 'Facebook',
  ProviderType: 'Facebook',
};
const ExpectedAppleIDPProperties = {
  ProviderDetails: {
    authorize_scopes: 'name',
    client_id: appleClientId,
    key_id: appleKeyId,
    private_key: applePrivateKey,
    team_id: appleTeamId,
  },
  ProviderName: 'SignInWithApple',
  ProviderType: 'SignInWithApple',
};
const ExpectedAmazonIDPProperties = {
  ProviderDetails: {
    authorize_scopes: 'profile',
    client_id: amazonClientId,
    client_secret: amazonClientSecret,
  },
  ProviderName: 'LoginWithAmazon',
  ProviderType: 'LoginWithAmazon',
};
const ExpectedOidcIDPProperties = {
  ProviderDetails: {
    attributes_request_method: 'GET',
    authorize_scopes: 'openid',
    client_id: oidcClientId,
    client_secret: oidcClientSecret,
    oidc_issuer: oidcIssuerUrl,
  },
  ProviderName: oidcProviderName,
  ProviderType: 'OIDC',
};
const ExpectedOidcIDPProperties2 = {
  ProviderDetails: {
    attributes_request_method: 'GET',
    authorize_scopes: 'openid',
    client_id: oidcClientId2,
    client_secret: oidcClientSecret2,
    oidc_issuer: oidcIssuerUrl2,
  },
  ProviderName: oidcProviderName2,
  ProviderType: 'OIDC',
};
const samlProviderName = 'samlProviderName';
const samlMetadataContent = '<?xml version=".10"?>';
const ExpectedSAMLIDPProperties = {
  ProviderDetails: {
    IDPSignout: false,
    MetadataFile: samlMetadataContent,
  },
  ProviderName: samlProviderName,
  ProviderType: 'SAML',
};
const samlMetadataUrl = 'https://localhost:3000';
const ExpectedSAMLIDPViaURLProperties = {
  ProviderDetails: {
    IDPSignout: false,
    MetadataURL: samlMetadataUrl,
  },
  ProviderName: samlProviderName,
  ProviderType: 'SAML',
};
const defaultPasswordPolicyCharacterRequirements =
  '["REQUIRES_NUMBERS","REQUIRES_LOWERCASE","REQUIRES_UPPERCASE","REQUIRES_SYMBOLS"]';

void describe('Auth construct', () => {
  void it('creates phone number login mechanism', () => {
    const app = new App();
    const stack = new Stack(app);
    new AmplifyAuth(stack, 'test', { loginWith: { phone: true } });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UsernameAttributes: ['phone_number'],
      AutoVerifiedAttributes: ['phone_number'],
    });
  });

  void it('creates email login mechanism', () => {
    const app = new App();
    const stack = new Stack(app);
    new AmplifyAuth(stack, 'test', { loginWith: { email: true } });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UsernameAttributes: ['email'],
      AutoVerifiedAttributes: ['email'],
    });
  });

  void it('creates user groups and group roles', () => {
    const app = new App();
    const stack = new Stack(app);
    const auth = new AmplifyAuth(stack, 'test', {
      loginWith: { email: true },
      groups: ['admins', 'managers'],
    });
    // validate the generated resources
    assert.equal(Object.keys(auth.resources.groups).length, 2);
    assert.equal(
      auth.resources.groups['admins'].cfnUserGroup.groupName,
      'admins',
    );
    assert.equal(
      auth.resources.groups['managers'].cfnUserGroup.groupName,
      'managers',
    );
    // validate generated template
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UsernameAttributes: ['email'],
      AutoVerifiedAttributes: ['email'],
    });
    template.hasResourceProperties('AWS::Cognito::UserPoolGroup', {
      GroupName: 'admins',
      Precedence: 0,
    });
    template.hasResourceProperties('AWS::Cognito::UserPoolGroup', {
      GroupName: 'managers',
      Precedence: 1,
    });
    // validate the generated policies
    const outputs = template.findOutputs('*');
    const idpRef = outputs['identityPoolId']['Value'];
    // There should be 3 matching roles, one for the auth role,
    // and one for each of the 'admins' and 'managers' roles
    const matchingRoleCount = 3;
    template.resourcePropertiesCountIs(
      'AWS::IAM::Role',
      {
        AssumeRolePolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRoleWithWebIdentity',
              Effect: 'Allow',
              Principal: {
                Federated: 'cognito-identity.amazonaws.com',
              },
              Condition: {
                'ForAnyValue:StringLike': {
                  'cognito-identity.amazonaws.com:amr': 'authenticated',
                },
                StringEquals: {
                  'cognito-identity.amazonaws.com:aud': idpRef,
                },
              },
            },
          ],
        },
      },
      matchingRoleCount,
    );
  });

  void it('creates email login mechanism if settings is empty object', () => {
    const app = new App();
    const stack = new Stack(app);
    new AmplifyAuth(stack, 'test', { loginWith: { email: {} } });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UsernameAttributes: ['email'],
      AutoVerifiedAttributes: ['email'],
    });
  });

  void it('creates phone login mechanism if settings is empty object', () => {
    const app = new App();
    const stack = new Stack(app);
    new AmplifyAuth(stack, 'test', { loginWith: { phone: {} } });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UsernameAttributes: ['phone_number'],
      AutoVerifiedAttributes: ['phone_number'],
    });
  });

  void it('throws error login settings do not include at least phone or email', () => {
    const app = new App();
    const stack = new Stack(app);
    assert.throws(
      () =>
        new AmplifyAuth(stack, 'test', {
          loginWith: {},
        }),
      {
        message: 'At least one of email or phone must be enabled.',
      },
    );
  });

  void it('creates email login mechanism with specific settings', () => {
    const app = new App();
    const stack = new Stack(app);
    const emailBodyFunction = (createCode: () => string) =>
      `custom email body ${createCode()}`;
    const expectedEmailMessage = 'custom email body {####}';
    const customEmailVerificationSubject = 'custom subject';
    new AmplifyAuth(stack, 'test', {
      loginWith: {
        email: {
          verificationEmailBody: emailBodyFunction,
          verificationEmailStyle: 'CODE',
          verificationEmailSubject: customEmailVerificationSubject,
        },
      },
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      EmailVerificationMessage: expectedEmailMessage,
      EmailVerificationSubject: customEmailVerificationSubject,
      VerificationMessageTemplate: {
        DefaultEmailOption: 'CONFIRM_WITH_CODE',
        EmailMessage: expectedEmailMessage,
        EmailSubject: customEmailVerificationSubject,
        SmsMessage: 'The verification code to your new account is {####}',
      },
    });
  });

  void it('creates email login mechanism with custom invitation settings', () => {
    const app = new App();
    const stack = new Stack(app);
    const userInvitationSettings = {
      emailSubject: 'invited by admin',
      emailBody: (username: () => string, code: () => string) =>
        `EMAIL: your username is ${username()} and invitation code is ${code()}`,
      smsMessage: (username: () => string, code: () => string) =>
        `SMS: your username is ${username()} and invitation code is ${code()}`,
    };
    const expectedEmailBody =
      'EMAIL: your username is {username} and invitation code is {####}';
    const expectedSMSMessage =
      'SMS: your username is {username} and invitation code is {####}';
    new AmplifyAuth(stack, 'test', {
      loginWith: {
        email: {
          userInvitation: userInvitationSettings,
        },
      },
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      AdminCreateUserConfig: {
        AllowAdminCreateUserOnly: false,
        InviteMessageTemplate: {
          EmailMessage: expectedEmailBody,
          EmailSubject: userInvitationSettings.emailSubject,
          SMSMessage: expectedSMSMessage,
        },
      },
    });
  });

  void it('creates email login mechanism with MFA', () => {
    const app = new App();
    const stack = new Stack(app);
    const emailBodyFunction = (createCode: () => string) =>
      `custom email body ${createCode()}`;
    const expectedEmailMessage = 'custom email body {####}';
    const customEmailVerificationSubject = 'custom subject';
    const smsVerificationMessageFunction = (createCode: () => string) =>
      `the verification code is ${createCode()}`;
    const expectedSMSVerificationMessage = 'the verification code is {####}';
    const smsMFAMessageFunction = (createCode: () => string) =>
      `SMS MFA code is ${createCode()}`;
    const expectedSMSMFAMessage = 'SMS MFA code is {####}';
    new AmplifyAuth(stack, 'test', {
      loginWith: {
        email: {
          verificationEmailBody: emailBodyFunction,
          verificationEmailStyle: 'CODE',
          verificationEmailSubject: customEmailVerificationSubject,
        },
        phone: {
          verificationMessage: smsVerificationMessageFunction,
        },
      },
      multifactor: {
        mode: 'OPTIONAL',
        sms: {
          smsMessage: smsMFAMessageFunction,
        },
      },
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      EmailVerificationMessage: expectedEmailMessage,
      EmailVerificationSubject: customEmailVerificationSubject,
      VerificationMessageTemplate: {
        DefaultEmailOption: 'CONFIRM_WITH_CODE',
        EmailMessage: expectedEmailMessage,
        EmailSubject: customEmailVerificationSubject,
        SmsMessage: expectedSMSVerificationMessage,
      },
      MfaConfiguration: 'OPTIONAL',
      EnabledMfas: ['SMS_MFA'],
      SmsAuthenticationMessage: expectedSMSMFAMessage,
      SmsVerificationMessage: expectedSMSVerificationMessage,
    });
  });

  void it('throws error if invalid email verification message for CODE', () => {
    const app = new App();
    const stack = new Stack(app);
    const emailBodyFunction = () => 'invalid message without code';
    const customEmailVerificationSubject = 'custom subject';
    assert.throws(
      () =>
        new AmplifyAuth(stack, 'test', {
          loginWith: {
            email: {
              verificationEmailBody: emailBodyFunction,
              verificationEmailStyle: 'CODE',
              verificationEmailSubject: customEmailVerificationSubject,
            },
          },
        }),
      {
        message:
          "Invalid email settings. Property 'verificationEmailBody' must utilize the 'code' parameter at least once as a placeholder for the verification code.",
      },
    );
  });

  void it('throws error if invalid email verification message for LINK', () => {
    const app = new App();
    const stack = new Stack(app);
    const emailBodyFunction = () => 'invalid message without link';
    const customEmailVerificationSubject = 'custom subject';
    assert.throws(
      () =>
        new AmplifyAuth(stack, 'test', {
          loginWith: {
            email: {
              verificationEmailBody: emailBodyFunction,
              verificationEmailStyle: 'LINK',
              verificationEmailSubject: customEmailVerificationSubject,
            },
          },
        }),
      {
        message:
          "Invalid email settings. Property 'verificationEmailBody' must utilize the 'link' parameter at least once as a placeholder for the verification link.",
      },
    );
  });

  void it('does not throw if valid email verification message for LINK', () => {
    const app = new App();
    const stack = new Stack(app);
    const emailBodyFunction = (createLink: (text?: string) => string) =>
      `valid message ${createLink()} with link`;
    const customEmailVerificationSubject = 'custom subject';
    assert.doesNotThrow(
      () =>
        new AmplifyAuth(stack, 'test', {
          loginWith: {
            email: {
              verificationEmailBody: emailBodyFunction,
              verificationEmailStyle: 'LINK',
              verificationEmailSubject: customEmailVerificationSubject,
            },
          },
        }),
    );
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      VerificationMessageTemplate: {
        DefaultEmailOption: 'CONFIRM_WITH_LINK',
        EmailMessageByLink: 'valid message {##Verify Email##} with link',
      },
    });
  });

  void it('correctly formats email verification message for LINK with custom link text', () => {
    const app = new App();
    const stack = new Stack(app);
    const emailBodyFunction = (createLink: (text?: string) => string) =>
      `valid message ${createLink('my custom link')} with link`;
    const customEmailVerificationSubject = 'custom subject';
    new AmplifyAuth(stack, 'test', {
      loginWith: {
        email: {
          verificationEmailBody: emailBodyFunction,
          verificationEmailStyle: 'LINK',
          verificationEmailSubject: customEmailVerificationSubject,
        },
      },
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      VerificationMessageTemplate: {
        DefaultEmailOption: 'CONFIRM_WITH_LINK',
        EmailMessageByLink: 'valid message {##my custom link##} with link',
      },
    });
  });

  void it('throws error if invalid sms verification message', () => {
    const app = new App();
    const stack = new Stack(app);
    const smsVerificationMessageFunction = () => 'invalid message without code';
    assert.throws(
      () =>
        new AmplifyAuth(stack, 'test', {
          loginWith: {
            phone: {
              verificationMessage: smsVerificationMessageFunction,
            },
          },
        }),
      {
        message:
          "Invalid phone settings. Property 'verificationMessage' must utilize the 'code' parameter at least once as a placeholder for the verification code.",
      },
    );
  });

  void it('does not throw error if valid MFA message', () => {
    const app = new App();
    const stack = new Stack(app);
    const validMFAMessage = (createCode: () => string) =>
      `valid MFA message with ${createCode()}`;
    assert.doesNotThrow(
      () =>
        new AmplifyAuth(stack, 'test', {
          loginWith: {
            email: true,
          },
          multifactor: {
            mode: 'OPTIONAL',
            sms: {
              smsMessage: validMFAMessage,
            },
            totp: false,
          },
        }),
    );
  });

  void it('throws error if invalid MFA message', () => {
    const app = new App();
    const stack = new Stack(app);
    const invalidMFAMessage = () => 'invalid MFA message without code';
    assert.throws(
      () =>
        new AmplifyAuth(stack, 'test', {
          loginWith: {
            email: true,
          },
          multifactor: {
            mode: 'OPTIONAL',
            sms: {
              smsMessage: invalidMFAMessage,
            },
            totp: false,
          },
        }),
      {
        message:
          "Invalid MFA settings. Property 'smsMessage' must utilize the 'code' parameter at least once as a placeholder for the verification code.",
      },
    );
  });

  void it('throws error if sms MFA is not enabled with phone login', () => {
    assert.throws(
      () =>
        new AmplifyAuth(new Stack(new App()), 'test', {
          loginWith: {
            phone: true,
          },
          multifactor: {
            mode: 'OPTIONAL',
            totp: true,
          },
        }),
      {
        message:
          'Invalid MFA settings. SMS must be enabled in multiFactor if loginWith phone is enabled',
      },
    );
    assert.throws(
      () =>
        new AmplifyAuth(new Stack(new App()), 'test', {
          loginWith: {
            phone: true,
          },
          multifactor: {
            mode: 'REQUIRED',
            totp: true,
          },
        }),
      {
        message:
          'Invalid MFA settings. SMS must be enabled in multiFactor if loginWith phone is enabled',
      },
    );
  });

  void it('configures Cognito to send emails with SES when email senders field is populated', () => {
    const app = new App();
    const stack = new Stack(app);
    const expectedNameAndEmail = 'Example.com <noreply@example.com>';
    const expectedReply = 'support@example.com';
    const sesEmailSettings = {
      fromEmail: 'noreply@example.com',
      fromName: 'Example.com',
      replyTo: 'support@example.com',
    };
    new AmplifyAuth(stack, 'test', {
      loginWith: {
        email: true,
      },
      senders: {
        email: sesEmailSettings,
      },
    });

    const template = Template.fromStack(stack);
    template.allResourcesProperties('AWS::Cognito::UserPool', {
      EmailConfiguration: {
        From: expectedNameAndEmail,
        ReplyToEmailAddress: expectedReply,
      },
    });
  });

  void it('configures Cognito to send sms with SNS when sms senders field is populated', () => {
    const app = new App();
    const stack = new Stack(app);
    const snsSmsSettings = {
      externalId: 'fake-external-id',
      snsCallerArn: 'arn:aws:iam::123456789012:role/fake-role',
      snsRegion: 'fake-region',
    };
    new AmplifyAuth(stack, 'test', {
      loginWith: {
        email: true,
      },
      senders: {
        sms: snsSmsSettings,
      },
    });

    const template = Template.fromStack(stack);
    template.allResourcesProperties('AWS::Cognito::UserPool', {
      SmsConfiguration: {
        ExternalId: snsSmsSettings.externalId,
        SnsCallerArn: snsSmsSettings.snsCallerArn,
        SnsRegion: snsSmsSettings.snsRegion,
      },
    });
  });

  void it('configures Cognito to send sms with SNS and auto-generate IAM Role when customer does not provide snsCallerArn', () => {
    const app = new App();
    const stack = new Stack(app);
    const snsSmsSettings = {
      //externalId: 'fake-external-id',
      //snsCallerArn: 'arn:aws:iam::123456789012:role/fake-role',
      snsRegion: 'fake-region',
    };
    new AmplifyAuth(stack, 'test', {
      loginWith: {
        email: true,
      },
      senders: {
        sms: snsSmsSettings,
      },
    });

    const template = Template.fromStack(stack);
    template.allResourcesProperties('AWS::Cognito::UserPool', {
      SmsConfiguration: {
        ExternalId: 'testUserPoolDB38E22C',
        SnsCallerArn: {
          // eslint-disable-next-line spellcheck/spell-checker
          'Fn::GetAtt': ['testUserPoolsmsRole80ED7545', 'Arn'],
        },
        SnsRegion: snsSmsSettings.snsRegion,
      },
    });
  });

  void it('configures Cognito to send sms with SNS and auto-generate IAM Role when customer provides an empty sms configuration', () => {
    const app = new App();
    const stack = new Stack(app);
    new AmplifyAuth(stack, 'test', {
      loginWith: {
        email: true,
      },
      senders: {
        sms: {},
      },
    });

    const template = Template.fromStack(stack);
    template.allResourcesProperties('AWS::Cognito::UserPool', {
      SmsConfiguration: {
        ExternalId: 'testUserPoolDB38E22C',
        SnsCallerArn: {
          // eslint-disable-next-line spellcheck/spell-checker
          'Fn::GetAtt': ['testUserPoolsmsRole80ED7545', 'Arn'],
        },
      },
    });
  });

  void it('throws error when customer configures sms configuration with only one of external Id and role arn', () => {
    const app = new App();
    const stack = new Stack(app);

    assert.throws(
      () =>
        new AmplifyAuth(stack, 'test', {
          loginWith: {
            email: true,
          },
          senders: {
            sms: {
              externalId: 'fake-external-id',
            },
          },
        }),
      {
        message:
          'Both externalId and snsCallerArn are required when providing a custom IAM role. Ensure that your IAM role trust policy have an sts:ExternalId condition and is equal to the externalId value',
      },
    );
  });

  void it('configures Cognito to send sms with custom sender with no kms key provided by customer', () => {
    const app = new App();
    const stack = new Stack(app);
    const customFunction = new NodejsFunction(
      stack,
      'customSenderNodeJsFunction',
      {
        entry: `${__dirname}/test-assets/lambda/handler.js`,
        handler: 'handler',
        runtime: Runtime.NODEJS_20_X,
      },
    );
    new AmplifyAuth(stack, 'test', {
      loginWith: {
        email: true,
      },
      senders: {
        sms: {
          handler: customFunction,
        },
      },
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      LambdaConfig: {
        CustomSMSSender: {
          LambdaArn: {
            'Fn::GetAtt': ['customSenderNodeJsFunctionB7630500', 'Arn'],
          },
          LambdaVersion: 'V1_0',
        },
        KMSKeyID: { 'Fn::GetAtt': ['CustomSenderKey297023AD', 'Arn'] },
      },
    });
  });

  void it('configures Cognito to send sms with custom sender with kms key provided by customer', () => {
    const app = new App();
    const stack = new Stack(app);
    const customFunction = new NodejsFunction(
      stack,
      'customSenderNodeJsFunction',
      {
        entry: `${__dirname}/test-assets/lambda/handler.js`,
        handler: 'handler',
        runtime: Runtime.NODEJS_20_X,
      },
    );
    new AmplifyAuth(stack, 'test', {
      loginWith: {
        email: true,
      },
      senders: {
        sms: {
          handler: customFunction,
          kmsKeyArn: 'arn:aws:kms:us-west-2:012345678912:key/key1',
        },
      },
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      LambdaConfig: {
        CustomSMSSender: {
          LambdaArn: {
            'Fn::GetAtt': ['customSenderNodeJsFunctionB7630500', 'Arn'],
          },
          LambdaVersion: 'V1_0',
        },
        KMSKeyID: 'arn:aws:kms:us-west-2:012345678912:key/key1',
      },
    });
  });

  void it('throws if different KMS keys are used in sms and email senders', () => {
    const app = new App();
    const stack = new Stack(app);
    const customFunction = new NodejsFunction(
      stack,
      'customSenderNodeJsFunction',
      {
        entry: `${__dirname}/test-assets/lambda/handler.js`,
        handler: 'handler',
        runtime: Runtime.NODEJS_20_X,
      },
    );
    assert.throws(
      () =>
        new AmplifyAuth(stack, 'test', {
          loginWith: {
            email: true,
          },
          senders: {
            sms: {
              handler: customFunction,
              kmsKeyArn: 'arn:aws:kms:us-west-2:012345678912:key/key1',
            },
            email: {
              handler: customFunction,
              kmsKeyArn: 'arn:aws:kms:us-west-2:012345678912:key/key2',
            },
          },
        }),
      {
        message: 'KMS key ARN must be the same for both email and sms senders',
      },
    );
  });

  void it('uses the KMS key provided in both the custom senders', () => {
    const app = new App();
    const stack = new Stack(app);
    const customFunction = new NodejsFunction(
      stack,
      'customSenderNodeJsFunction',
      {
        entry: `${__dirname}/test-assets/lambda/handler.js`,
        handler: 'handler',
        runtime: Runtime.NODEJS_20_X,
      },
    );

    new AmplifyAuth(stack, 'test', {
      loginWith: {
        email: true,
      },
      senders: {
        sms: {
          handler: customFunction,
          kmsKeyArn: 'arn:aws:kms:us-west-2:012345678912:key/key1',
        },
        email: {
          handler: customFunction,
          kmsKeyArn: 'arn:aws:kms:us-west-2:012345678912:key/key1',
        },
      },
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      LambdaConfig: {
        CustomSMSSender: {
          LambdaArn: {
            'Fn::GetAtt': ['customSenderNodeJsFunctionB7630500', 'Arn'],
          },
          LambdaVersion: 'V1_0',
        },
        CustomEmailSender: {
          LambdaArn: {
            'Fn::GetAtt': ['customSenderNodeJsFunctionB7630500', 'Arn'],
          },
          LambdaVersion: 'V1_0',
        },
        KMSKeyID: 'arn:aws:kms:us-west-2:012345678912:key/key1',
      },
    });
  });

  void it('configures one custom sms sender and one regular email sender', () => {
    const app = new App();
    const stack = new Stack(app);
    const expectedNameAndEmail = 'Example.com <noreply@example.com>';
    const expectedReply = 'support@example.com';
    const sesEmailSettings = {
      fromEmail: 'noreply@example.com',
      fromName: 'Example.com',
      replyTo: 'support@example.com',
    };
    const customFunction = new NodejsFunction(
      stack,
      'customSenderNodeJsFunction',
      {
        entry: `${__dirname}/test-assets/lambda/handler.js`,
        handler: 'handler',
        runtime: Runtime.NODEJS_20_X,
      },
    );
    new AmplifyAuth(stack, 'test', {
      loginWith: {
        email: true,
      },
      senders: {
        sms: {
          handler: customFunction,
          kmsKeyArn: 'arn:aws:kms:us-west-2:012345678912:key/key1',
        },
        email: sesEmailSettings,
      },
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      LambdaConfig: {
        CustomSMSSender: {
          LambdaArn: {
            'Fn::GetAtt': ['customSenderNodeJsFunctionB7630500', 'Arn'],
          },
          LambdaVersion: 'V1_0',
        },
        KMSKeyID: 'arn:aws:kms:us-west-2:012345678912:key/key1',
      },
      EmailConfiguration: {
        From: expectedNameAndEmail,
        ReplyToEmailAddress: expectedReply,
      },
    });
  });

  void it('requires email attribute if email is enabled', () => {
    const app = new App();
    const stack = new Stack(app);
    new AmplifyAuth(stack, 'test', { loginWith: { email: true } });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UsernameAttributes: ['email'],
      AutoVerifiedAttributes: ['email'],
    });
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      Schema: [
        {
          Mutable: true,
          Name: 'email',
          Required: true,
        },
      ],
    });
  });

  void it('sets account recovery settings ', () => {
    const app = new App();
    const stack = new Stack(app);
    new AmplifyAuth(stack, 'test', {
      loginWith: { phone: true, email: true },
      accountRecovery: 'EMAIL_AND_PHONE_WITHOUT_MFA',
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      AccountRecoverySetting: {
        RecoveryMechanisms: [
          {
            Name: 'verified_email',
            Priority: 1,
          },
          {
            Name: 'verified_phone_number',
            Priority: 2,
          },
        ],
      },
    });
  });

  void it('creates user attributes', () => {
    const app = new App();
    const stack = new Stack(app);
    new AmplifyAuth(stack, 'test', {
      loginWith: { email: true },
      userAttributes: {
        address: {
          mutable: false,
        },
        familyName: {
          required: true,
        },
        'custom:display_name': {
          dataType: 'String',
          mutable: true,
          maxLen: 100,
          minLen: 0,
        },
        'custom:tenant_id': {
          dataType: 'Number',
          mutable: false,
          max: 66,
          min: 1,
        },
        'custom:register_date': {
          dataType: 'DateTime',
          mutable: true,
        },
        'custom:is_member': {
          dataType: 'Boolean',
          mutable: false,
        },
        'custom:year_as_member': {
          dataType: 'Number',
          max: 90,
          min: 0,
        },
        'custom:favorite_song': {
          dataType: 'String',
          mutable: true,
        },
      },
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      Schema: [
        {
          Mutable: true,
          Name: 'email',
          Required: true,
        },
        {
          Mutable: false,
          Name: 'address',
          Required: false,
        },
        {
          Mutable: true,
          Name: 'family_name',
          Required: true,
        },
        {
          AttributeDataType: 'String',
          Name: 'display_name',
          Mutable: true,
          StringAttributeConstraints: {
            MaxLength: '100',
            MinLength: '0',
          },
        },
        {
          AttributeDataType: 'Number',
          Name: 'tenant_id',
          Mutable: false,
          NumberAttributeConstraints: {
            MaxValue: '66',
            MinValue: '1',
          },
        },
        {
          AttributeDataType: 'DateTime',
          Name: 'register_date',
          Mutable: true,
        },
        {
          AttributeDataType: 'Boolean',
          Name: 'is_member',
          Mutable: false,
        },
        {
          AttributeDataType: 'Number',
          Name: 'year_as_member',
          Mutable: true,
          NumberAttributeConstraints: {
            MaxValue: '90',
            MinValue: '0',
          },
        },
        {
          AttributeDataType: 'String',
          Name: 'favorite_song',
          Mutable: true,
        },
      ],
    });
  });

  void describe('storeOutput in synthesized template', () => {
    let app: App;
    let stack: Stack;
    void beforeEach(() => {
      app = new App();
      stack = new Stack(app);
    });

    void it('outputs defaults for minimal email config', () => {
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
        },
      });
      const template = Template.fromStack(stack);
      const outputs = template.findOutputs('*');
      assert.equal(
        outputs['allowUnauthenticatedIdentities']['Value'],
        DEFAULTS.ALLOW_UNAUTHENTICATED_IDENTITIES === true ? 'true' : 'false',
      );
      assert.equal(outputs['mfaTypes']['Value'], '[]');

      assert.equal(outputs['mfaConfiguration']['Value'], 'OFF');
      assert.equal(
        outputs['passwordPolicyMinLength']['Value'],
        DEFAULTS.PASSWORD_POLICY.minLength.toString(),
      );
      assert.equal(
        outputs['passwordPolicyRequirements']['Value'],
        defaultPasswordPolicyCharacterRequirements,
      );
      assert.equal(outputs['signupAttributes']['Value'], '["email"]');
      assert.equal(outputs['usernameAttributes']['Value'], '["email"]');
      assert.equal(outputs['verificationMechanisms']['Value'], '["email"]');
    });

    void it('updates signupAttributes when userAttributes prop is used', () => {
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
        },
        userAttributes: {
          address: { required: true },
          birthdate: { required: true },
          gender: { required: true },
          locale: { required: true },
          middleName: { required: true },
          nickname: { required: true },
          phoneNumber: { required: true },
          profilePicture: { required: true },
          fullname: { required: true },
          givenName: { required: true },
          familyName: { required: true },
          lastUpdateTime: { required: true },
          preferredUsername: { required: true },
          profilePage: { required: true },
          timezone: { required: true },
          website: { required: true },
          email: { required: true, mutable: false },
        },
      });
      const template = Template.fromStack(stack);
      const outputs = template.findOutputs('*');
      assert.equal(
        outputs['signupAttributes']['Value'],
        '["email","phone_number","address","birthdate","gender","locale","middle_name","nickname","picture","name","given_name","family_name","updated_at","preferred_username","profile","zoneinfo","website"]',
      );
    });

    void it('updates usernameAttributes & verificationMechanisms when both email and phone number login methods are used', () => {
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
          phone: true,
        },
      });
      const template = Template.fromStack(stack);
      const outputs = template.findOutputs('*');
      assert.equal(
        outputs['usernameAttributes']['Value'],
        '["email","phone_number"]',
      );
      assert.equal(
        outputs['verificationMechanisms']['Value'],
        '["email","phone_number"]',
      );
    });

    void it('updates usernameAttributes & verificationMechanisms for phone number only login method', () => {
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          phone: true,
        },
      });
      const template = Template.fromStack(stack);
      const outputs = template.findOutputs('*');
      assert.equal(outputs['usernameAttributes']['Value'], '["phone_number"]');
      assert.equal(
        outputs['verificationMechanisms']['Value'],
        '["phone_number"]',
      );
    });

    void it('updates mfaConfiguration & mfaTypes when MFA is set to OPTIONAL', () => {
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
        },
        multifactor: { mode: 'OPTIONAL', sms: true, totp: true },
      });

      const template = Template.fromStack(stack);
      const outputs = template.findOutputs('*');
      assert.equal(outputs['mfaTypes']['Value'], '["SMS","TOTP"]');
      assert.equal(outputs['mfaConfiguration']['Value'], 'OPTIONAL');
    });

    void it('updates mfaConfiguration & mfaTypes when MFA is set to REQUIRED with only TOTP enabled', () => {
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
        },
        multifactor: { mode: 'REQUIRED', sms: false, totp: true },
      });

      const template = Template.fromStack(stack);
      const outputs = template.findOutputs('*');
      assert.equal(outputs['mfaTypes']['Value'], '["TOTP"]');
      assert.equal(outputs['mfaConfiguration']['Value'], 'ON');
    });

    void it('updates socialProviders and oauth outputs when external providers are present', () => {
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
          externalProviders: {
            google: {
              clientId: googleClientId,
              clientSecret: SecretValue.unsafePlainText(googleClientSecret),
            },
            facebook: {
              clientId: facebookClientId,
              clientSecret: facebookClientSecret,
            },
            signInWithApple: {
              clientId: appleClientId,
              keyId: appleKeyId,
              privateKey: applePrivateKey,
              teamId: appleTeamId,
            },
            loginWithAmazon: {
              clientId: amazonClientId,
              clientSecret: amazonClientSecret,
            },
            oidc: [
              {
                name: 'provider1',
                clientId: oidcClientId,
                clientSecret: oidcClientSecret,
                issuerUrl: oidcIssuerUrl,
              },
              {
                name: 'provider2',
                clientId: oidcClientId2,
                clientSecret: oidcClientSecret2,
                issuerUrl: oidcIssuerUrl2,
              },
              {
                clientId: 'clientId3',
                clientSecret: 'oidcClientSecret3',
                issuerUrl: 'oidcIssuerUrl3',
              },
            ],
            domainPrefix: 'test-prefix',
            scopes: ['EMAIL', 'PROFILE'],
            callbackUrls: ['http://callback.com'],
            logoutUrls: ['http://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      const resources = template.findResources(
        'AWS::Cognito::UserPoolIdentityProvider',
      );
      const outputs = template.findOutputs('*');
      let unnamedOidcProviderName = '';
      for (const resourceKey of Object.keys(resources)) {
        const resource = resources[resourceKey];
        if (
          resource['Properties'] &&
          resource['Properties']['ProviderDetails'] &&
          resource['Properties']['ProviderDetails']['client_id'] === 'clientId3'
        ) {
          unnamedOidcProviderName = resource['Properties']['ProviderName'];
          continue;
        }
      }
      assert.equal(
        outputs['socialProviders']['Value'],
        `["GOOGLE","FACEBOOK","LOGIN_WITH_AMAZON","SIGN_IN_WITH_APPLE","provider1","provider2","${unnamedOidcProviderName}"]`,
      );
      // domain name requires us to find the generated UserPoolDomain,
      // and then use that to produce the ref which we will match to the output
      // since the generated domain name won't be known until after deployment
      template.hasResourceProperties('AWS::Cognito::UserPoolDomain', {
        Domain: 'test-prefix',
      });
      const userPoolDomains = template.findResources(
        'AWS::Cognito::UserPoolDomain',
        {
          Properties: {
            Domain: 'test-prefix',
          },
        },
      );
      let userPoolDomainRefValue = '';
      for (const [key] of Object.entries(userPoolDomains)) {
        userPoolDomainRefValue = key;
      }
      assert.deepEqual(outputs['oauthCognitoDomain']['Value'], {
        'Fn::Join': [
          '',
          [
            {
              Ref: userPoolDomainRefValue,
            },
            '.auth.',
            {
              Ref: 'AWS::Region',
            },
            '.amazoncognito.com',
          ],
        ],
      });
      assert.equal(
        outputs['oauthScope']['Value'],
        '["email","profile","openid"]',
      );
      assert.equal(
        outputs['oauthRedirectSignIn']['Value'],
        'http://callback.com',
      );
      assert.equal(
        outputs['oauthRedirectSignOut']['Value'],
        'http://logout.com',
      );
    });

    void it('updates oauth domain when name is present', () => {
      new AmplifyAuth(stack, 'test', {
        name: 'test_name',
        loginWith: {
          email: true,
          externalProviders: {
            google: {
              clientId: googleClientId,
              clientSecret: SecretValue.unsafePlainText(googleClientSecret),
            },
            domainPrefix: 'test-prefix',
            scopes: ['EMAIL', 'PROFILE'],
            callbackUrls: ['http://callback.com'],
            logoutUrls: ['http://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      const outputs = template.findOutputs('*');
      const userPoolDomains = template.findResources(
        'AWS::Cognito::UserPoolDomain',
        {
          Properties: {
            Domain: 'test-prefix',
          },
        },
      );
      let userPoolDomainRefValue = '';
      for (const [key] of Object.entries(userPoolDomains)) {
        userPoolDomainRefValue = key;
      }
      assert.deepEqual(outputs['oauthCognitoDomain']['Value'], {
        'Fn::Join': [
          '',
          [
            {
              Ref: userPoolDomainRefValue,
            },
            '.auth.',
            {
              Ref: 'AWS::Region',
            },
            '.amazoncognito.com',
          ],
        ],
      });
    });
  });

  void describe('storeOutput strategy', () => {
    let app: App;
    let stack: Stack;
    const storeOutputMock = mock.fn();
    const stubBackendOutputStorageStrategy: BackendOutputStorageStrategy<BackendOutputEntry> =
      {
        addBackendOutputEntry: storeOutputMock,
        appendToBackendOutputList: storeOutputMock,
      };

    void beforeEach(() => {
      app = new App();
      stack = new Stack(app);
      storeOutputMock.mock.resetCalls();
    });

    void it('stores output using custom strategy and basic props', () => {
      const authConstruct = new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
        },
        outputStorageStrategy: stubBackendOutputStorageStrategy,
      });

      const expectedUserPoolId = authConstruct.resources.userPool.userPoolId;
      const expectedIdentityPoolId =
        authConstruct.resources.cfnResources.cfnIdentityPool.ref;
      const expectedWebClientId =
        authConstruct.resources.userPoolClient.userPoolClientId;
      const expectedRegion = Stack.of(authConstruct).region;

      const storeOutputArgs = storeOutputMock.mock.calls[0].arguments;
      assert.equal(storeOutputArgs.length, 2);
      assert.equal(storeOutputArgs[0], authOutputKey);
      assert.equal(storeOutputArgs[1]['version'], '1');
      const payload = storeOutputArgs[1]['payload'];
      assert.equal(payload['userPoolId'], expectedUserPoolId);
      assert.equal(payload['identityPoolId'], expectedIdentityPoolId);
      assert.equal(payload['webClientId'], expectedWebClientId);
      assert.equal(payload['authRegion'], expectedRegion);
    });

    void it('stores output when no storage strategy is injected', () => {
      const app = new App();
      const stack = new Stack(app);

      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
        },
      });

      const template = Template.fromStack(stack);
      template.templateMatches({
        Metadata: {
          [authOutputKey]: {
            version: '1',
            stackOutputs: [
              'userPoolId',
              'webClientId',
              'identityPoolId',
              'authRegion',
              'allowUnauthenticatedIdentities',
              'signupAttributes',
              'usernameAttributes',
              'verificationMechanisms',
              'passwordPolicyMinLength',
              'passwordPolicyRequirements',
              'mfaConfiguration',
              'mfaTypes',
              'socialProviders',
              'oauthCognitoDomain',
              'oauthScope',
              'oauthRedirectSignIn',
              'oauthRedirectSignOut',
              'oauthResponseType',
              'oauthClientId',
              'groups',
            ],
          },
        },
      });
    });
  });

  void describe('defaults', () => {
    void it('creates email login by default', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test');
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['email'],
        AutoVerifiedAttributes: ['email'],
      });
    });

    void it('creates the correct number of default resources', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test');
      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::Cognito::UserPool', 1);
      template.resourceCountIs('AWS::Cognito::UserPoolClient', 1);
      template.resourceCountIs('AWS::Cognito::IdentityPool', 1);
      template.resourceCountIs('AWS::Cognito::IdentityPoolRoleAttachment', 1);
      template.resourceCountIs('AWS::IAM::Role', 2);
    });

    void it('sets the case sensitivity to false', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test');
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameConfiguration: {
          CaseSensitive: false,
        },
      });
    });

    void it('enables self signup', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test');
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        AdminCreateUserConfig: {
          AllowAdminCreateUserOnly: false,
        },
      });
    });

    void it('allows unauthenticated identities to the identity pool', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test');
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::IdentityPool', {
        AllowUnauthenticatedIdentities: true,
      });
    });

    void it('prevents user existence errors', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test');
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        PreventUserExistenceErrors: 'ENABLED',
      });
    });

    void it('sets the default password policy', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test');
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        Policies: {
          PasswordPolicy: {
            MinimumLength: 8,
            RequireLowercase: true,
            RequireNumbers: true,
            RequireSymbols: true,
            RequireUppercase: true,
          },
        },
      });
    });

    void it('sets default account recovery settings', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test');
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        AccountRecoverySetting: {
          RecoveryMechanisms: [
            {
              Name: 'verified_email',
              Priority: 1,
            },
          ],
        },
      });
    });

    void it('sets account recovery settings to phone if phone is the only login type', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', { loginWith: { phone: true } });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        AccountRecoverySetting: {
          RecoveryMechanisms: [
            {
              Name: 'verified_phone_number',
              Priority: 1,
            },
          ],
        },
      });
    });

    void it('sets account recovery settings to email if both phone and email enabled', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: { phone: true, email: true },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        AccountRecoverySetting: {
          RecoveryMechanisms: [
            {
              Name: 'verified_email',
              Priority: 1,
            },
          ],
        },
      });
    });

    void it('require verification of email before updating email', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test');
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UserAttributeUpdateSettings: {
          AttributesRequireVerificationBeforeUpdate: ['email'],
        },
      });
    });

    void it('sets deletion policy to destroy on user pool', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test');
      const template = Template.fromStack(stack);

      template.hasResource('AWS::Cognito::UserPool', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    void it('enables SRP and Custom auth flows', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test');
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        ExplicitAuthFlows: [
          'ALLOW_CUSTOM_AUTH',
          'ALLOW_USER_SRP_AUTH',
          'ALLOW_REFRESH_TOKEN_AUTH',
        ],
      });
    });

    void it('ensure that authorizationCodeGrant is the only OAUTH flow by default', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test');
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        AllowedOAuthFlows: ['code'],
      });
    });

    void it('ensure that authorizationCodeGrant is the only OAUTH flow by default when oauth providers are used', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
          externalProviders: {
            google: {
              clientId: googleClientId,
              clientSecret: new SecretValue(googleClientSecret),
            },
            callbackUrls: ['https://callback.com'],
            logoutUrls: ['https://logout.com'],
            domainPrefix: 'test',
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        AllowedOAuthFlows: ['code'],
      });
    });

    void it('creates a default client with cognito provider', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test');
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        SupportedIdentityProviders: ['COGNITO'],
      });
    });
  });

  void describe('Auth overrides', () => {
    void it('can override case sensitivity', () => {
      const app = new App();
      const stack = new Stack(app);
      const auth = new AmplifyAuth(stack, 'test');
      auth.resources.cfnResources.cfnUserPool.usernameConfiguration = {
        caseSensitive: true,
      };
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameConfiguration: {
          CaseSensitive: true,
        },
      });
    });
    void it('can override setting to keep original attributes until verified', () => {
      const app = new App();
      const stack = new Stack(app);
      const auth = new AmplifyAuth(stack, 'test', {
        loginWith: { email: true },
      });
      auth.resources.cfnResources.cfnUserPool.userAttributeUpdateSettings = {
        attributesRequireVerificationBeforeUpdate: [],
      };
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UserAttributeUpdateSettings: {
          AttributesRequireVerificationBeforeUpdate: [],
        },
      });
    });
    void it('can override settings for device configuration', () => {
      const app = new App();
      const stack = new Stack(app);
      const auth = new AmplifyAuth(stack, 'test', {
        loginWith: { email: true },
      });
      const userPoolResource = auth.resources.cfnResources.cfnUserPool;
      userPoolResource.deviceConfiguration = {
        challengeRequiredOnNewDevice: true,
        deviceOnlyRememberedOnUserPrompt: true,
      };
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        DeviceConfiguration: {
          ChallengeRequiredOnNewDevice: true,
          DeviceOnlyRememberedOnUserPrompt: true,
        },
      });
    });
    void it('can override password policy and correctly updates stored output', () => {
      const app = new App();
      const stack = new Stack(app);
      const auth = new AmplifyAuth(stack, 'test');
      const userPoolResource = auth.resources.cfnResources.cfnUserPool;
      userPoolResource.policies = {
        passwordPolicy: {
          minimumLength: 10,
          requireLowercase: false,
          requireNumbers: false,
          requireSymbols: true,
          requireUppercase: false,
        },
      };
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        Policies: {
          PasswordPolicy: {
            MinimumLength: 10,
            RequireLowercase: false,
            RequireNumbers: false,
            RequireSymbols: true,
            RequireUppercase: false,
          },
        },
      });
      const outputs = template.findOutputs('*');
      assert.equal(outputs['passwordPolicyMinLength']['Value'], '10');
      assert.equal(
        outputs['passwordPolicyRequirements']['Value'],
        '["REQUIRES_SYMBOLS"]',
      );
    });
    void it('can override user existence errors', () => {
      const app = new App();
      const stack = new Stack(app);
      const auth = new AmplifyAuth(stack, 'test');
      auth.resources.cfnResources.cfnUserPoolClient.preventUserExistenceErrors =
        'LEGACY';
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        PreventUserExistenceErrors: 'LEGACY',
      });
    });
    void it('can override guest access setting and correctly updates stored output', () => {
      const app = new App();
      const stack = new Stack(app);
      const auth = new AmplifyAuth(stack, 'test');
      auth.resources.cfnResources.cfnIdentityPool.allowUnauthenticatedIdentities =
        false;
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::IdentityPool', {
        AllowUnauthenticatedIdentities: false,
      });
      const outputs = template.findOutputs('*');
      assert.equal(outputs['allowUnauthenticatedIdentities']['Value'], 'false');
    });
    void it('can override token validity period', () => {
      const app = new App();
      const stack = new Stack(app);
      const auth = new AmplifyAuth(stack, 'test');
      const userPoolClientResource =
        auth.resources.userPoolClient.node.findChild(
          'Resource',
        ) as CfnUserPoolClient;
      userPoolClientResource.accessTokenValidity = 1;
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        AccessTokenValidity: 1,
      });
    });
    void it('can add social providers afterwards and correctly updates stored output', () => {
      const app = new App();
      const stack = new Stack(app);
      const auth = new AmplifyAuth(stack, 'test');
      new aws_cognito.UserPoolIdentityProviderGoogle(
        stack,
        `${stack.stackName}MyGoogleIdP`,
        {
          userPool: auth.resources.userPool,
          clientId: googleClientId,
          clientSecretValue: SecretValue.unsafePlainText(googleClientSecret),
          attributeMapping: {
            email: ProviderAttribute.GOOGLE_EMAIL,
          },
          scopes: ['profile'],
        },
      );
      auth.resources.cfnResources.cfnIdentityPool.supportedLoginProviders[
        'accounts.google.com'
      ] = googleClientId;
      const template = Template.fromStack(stack);
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedGoogleIDPProperties,
      );
      template.hasResourceProperties('AWS::Cognito::IdentityPool', {
        SupportedLoginProviders: {
          'accounts.google.com': googleClientId,
        },
      });
      const outputs = template.findOutputs('*');
      assert.equal(outputs['socialProviders']['Value'], `["GOOGLE"]`);
    });
    void it('can override group precedence and correctly updates stored output', () => {
      const app = new App();
      const stack = new Stack(app);
      const auth = new AmplifyAuth(stack, 'test', {
        loginWith: { email: true },
        groups: ['admins', 'managers'],
      });
      auth.resources.groups['admins'].cfnUserGroup.precedence = 2;
      const expectedGroups = [
        {
          admins: {
            precedence: 2,
          },
        },
        {
          managers: {
            precedence: 1,
          },
        },
      ];
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPoolGroup', {
        GroupName: 'admins',
        Precedence: 2,
      });
      const outputs = template.findOutputs('*');
      assert.equal(outputs['groups']['Value'], JSON.stringify(expectedGroups));
    });
  });

  void describe('Auth external login', () => {
    void it('supports google idp and email', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
          externalProviders: {
            google: {
              clientId: googleClientId,
              clientSecret: SecretValue.unsafePlainText(googleClientSecret),
            },
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['email'],
        AutoVerifiedAttributes: ['email'],
      });
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedGoogleIDPProperties,
      );
      template.hasResourceProperties('AWS::Cognito::IdentityPool', {
        SupportedLoginProviders: {
          'accounts.google.com': googleClientId,
        },
      });
    });
    void it('supports google idp and phone', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          phone: true,
          externalProviders: {
            google: {
              clientId: googleClientId,
              clientSecret: SecretValue.unsafePlainText(googleClientSecret),
            },
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['phone_number'],
        AutoVerifiedAttributes: ['phone_number'],
      });
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedGoogleIDPProperties,
      );
      template.hasResourceProperties('AWS::Cognito::IdentityPool', {
        SupportedLoginProviders: {
          'accounts.google.com': googleClientId,
        },
      });
    });
    void it('supports facebook idp and email', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
          externalProviders: {
            facebook: {
              clientId: facebookClientId,
              clientSecret: facebookClientSecret,
            },
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['email'],
        AutoVerifiedAttributes: ['email'],
      });
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedFacebookIDPProperties,
      );
      template.hasResourceProperties('AWS::Cognito::IdentityPool', {
        SupportedLoginProviders: {
          'graph.facebook.com': facebookClientId,
        },
      });
    });
    void it('supports facebook idp and phone', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          phone: true,
          externalProviders: {
            facebook: {
              clientId: facebookClientId,
              clientSecret: facebookClientSecret,
            },
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['phone_number'],
        AutoVerifiedAttributes: ['phone_number'],
      });
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedFacebookIDPProperties,
      );
      template.hasResourceProperties('AWS::Cognito::IdentityPool', {
        SupportedLoginProviders: {
          'graph.facebook.com': facebookClientId,
        },
      });
    });
    void it('supports apple idp and email', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
          externalProviders: {
            signInWithApple: {
              clientId: appleClientId,
              keyId: appleKeyId,
              privateKey: applePrivateKey,
              teamId: appleTeamId,
            },
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['email'],
        AutoVerifiedAttributes: ['email'],
      });
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedAppleIDPProperties,
      );
      template.hasResourceProperties('AWS::Cognito::IdentityPool', {
        SupportedLoginProviders: {
          'appleid.apple.com': appleClientId,
        },
      });
    });
    void it('supports apple idp and phone', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          phone: true,
          externalProviders: {
            signInWithApple: {
              clientId: appleClientId,
              keyId: appleKeyId,
              privateKey: applePrivateKey,
              teamId: appleTeamId,
            },
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['phone_number'],
        AutoVerifiedAttributes: ['phone_number'],
      });
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedAppleIDPProperties,
      );
      template.hasResourceProperties('AWS::Cognito::IdentityPool', {
        SupportedLoginProviders: {
          'appleid.apple.com': appleClientId,
        },
      });
    });
    void it('supports amazon idp and email', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
          externalProviders: {
            loginWithAmazon: {
              clientId: amazonClientId,
              clientSecret: amazonClientSecret,
            },
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['email'],
        AutoVerifiedAttributes: ['email'],
      });
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedAmazonIDPProperties,
      );
      template.hasResourceProperties('AWS::Cognito::IdentityPool', {
        SupportedLoginProviders: {
          'www.amazon.com': amazonClientId,
        },
      });
    });
    void it('supports amazon idp and phone', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          phone: true,
          externalProviders: {
            loginWithAmazon: {
              clientId: amazonClientId,
              clientSecret: amazonClientSecret,
            },
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['phone_number'],
        AutoVerifiedAttributes: ['phone_number'],
      });
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedAmazonIDPProperties,
      );
      template.hasResourceProperties('AWS::Cognito::IdentityPool', {
        SupportedLoginProviders: {
          'www.amazon.com': amazonClientId,
        },
      });
    });
    void it('supports oidc and email', () => {
      const app = new App();
      const stack = new Stack(app);
      const authorizationURL = 'http://localhost:3000/authorization';
      const jwksURI = 'https://localhost:3000/jwksuri';
      const tokensURL = 'http://localhost:3000/token';
      const userInfoURL = 'http://localhost:3000/userinfo';
      const mockIdentifiers = ['one', 'two'];
      const mockScopes = ['scope1', 'scope2'];
      const attributeRequestMethod = 'POST';
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
          externalProviders: {
            oidc: [
              {
                clientId: oidcClientId,
                clientSecret: oidcClientSecret,
                issuerUrl: oidcIssuerUrl,
                name: oidcProviderName,
                attributeMapping: {
                  email: 'email',
                },
                attributeRequestMethod: attributeRequestMethod,
                endpoints: {
                  authorization: authorizationURL,
                  jwksUri: jwksURI,
                  token: tokensURL,
                  userInfo: userInfoURL,
                },
                identifiers: mockIdentifiers,
                scopes: mockScopes,
              },
            ],
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['email'],
        AutoVerifiedAttributes: ['email'],
      });
      template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
        AttributeMapping: {
          email: 'email',
        },
        IdpIdentifiers: mockIdentifiers,
        ProviderDetails: {
          attributes_request_method: attributeRequestMethod,
          attributes_url: userInfoURL,
          authorize_scopes: mockScopes.join(' '),
          authorize_url: authorizationURL,
          client_id: oidcClientId,
          client_secret: oidcClientSecret,
          jwks_uri: jwksURI,
          oidc_issuer: oidcIssuerUrl,
          token_url: tokensURL,
        },
        ProviderName: oidcProviderName,
        ProviderType: 'OIDC',
      });
    });
    void it('oidc defaults to GET for oidc method', () => {
      const app = new App();
      const stack = new Stack(app);
      const authorizationURL = 'http://localhost:3000/authorization';
      const jwksURI = 'https://localhost:3000/jwksuri';
      const tokensURL = 'http://localhost:3000/token';
      const userInfoURL = 'http://localhost:3000/userinfo';
      const mockIdentifiers = ['one', 'two'];
      const mockScopes = ['scope1', 'scope2'];
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
          externalProviders: {
            oidc: [
              {
                clientId: oidcClientId,
                clientSecret: oidcClientSecret,
                issuerUrl: oidcIssuerUrl,
                name: oidcProviderName,
                attributeMapping: {
                  email: 'email',
                },
                endpoints: {
                  authorization: authorizationURL,
                  jwksUri: jwksURI,
                  token: tokensURL,
                  userInfo: userInfoURL,
                },
                identifiers: mockIdentifiers,
                scopes: mockScopes,
              },
            ],
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['email'],
        AutoVerifiedAttributes: ['email'],
      });
      template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
        AttributeMapping: {
          email: 'email',
        },
        IdpIdentifiers: mockIdentifiers,
        ProviderDetails: {
          attributes_request_method: 'GET',
          attributes_url: userInfoURL,
          authorize_scopes: mockScopes.join(' '),
          authorize_url: authorizationURL,
          client_id: oidcClientId,
          client_secret: oidcClientSecret,
          jwks_uri: jwksURI,
          oidc_issuer: oidcIssuerUrl,
          token_url: tokensURL,
        },
        ProviderName: oidcProviderName,
        ProviderType: 'OIDC',
      });
    });
    void it('supports oidc and phone', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          phone: true,
          externalProviders: {
            oidc: [
              {
                clientId: oidcClientId,
                clientSecret: oidcClientSecret,
                issuerUrl: oidcIssuerUrl,
                name: oidcProviderName,
              },
            ],
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['phone_number'],
        AutoVerifiedAttributes: ['phone_number'],
      });
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedOidcIDPProperties,
      );
    });
    void it('supports multiple oidc providers', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
          externalProviders: {
            oidc: [
              {
                clientId: oidcClientId,
                clientSecret: oidcClientSecret,
                issuerUrl: oidcIssuerUrl,
                name: oidcProviderName,
              },
              {
                clientId: oidcClientId2,
                clientSecret: oidcClientSecret2,
                issuerUrl: oidcIssuerUrl2,
                name: oidcProviderName2,
              },
            ],
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['email'],
        AutoVerifiedAttributes: ['email'],
      });
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedOidcIDPProperties,
      );
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedOidcIDPProperties2,
      );
    });
    void it('supports saml and email', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
          externalProviders: {
            saml: {
              name: samlProviderName,
              metadata: {
                metadataContent: samlMetadataContent,
                metadataType: 'FILE',
              },
            },
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['email'],
        AutoVerifiedAttributes: ['email'],
      });
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedSAMLIDPProperties,
      );
    });
    void it('supports saml and phone', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          phone: true,
          externalProviders: {
            saml: {
              name: samlProviderName,
              metadata: {
                metadataContent: samlMetadataContent,
                metadataType: 'FILE',
              },
            },
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['phone_number'],
        AutoVerifiedAttributes: ['phone_number'],
      });
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedSAMLIDPProperties,
      );
    });
    void it('supports saml via URL and email', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
          externalProviders: {
            saml: {
              name: samlProviderName,
              metadata: {
                metadataContent: samlMetadataUrl,
                metadataType: 'URL',
              },
            },
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['email'],
        AutoVerifiedAttributes: ['email'],
      });
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedSAMLIDPViaURLProperties,
      );
    });

    void it('supports additional oauth settings', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
          externalProviders: {
            google: {
              clientId: googleClientId,
              clientSecret: SecretValue.unsafePlainText(googleClientSecret),
            },
            domainPrefix: 'test-prefix',
            scopes: ['EMAIL', 'PROFILE'],
            callbackUrls: ['http://localhost'],
            logoutUrls: ['http://localhost'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['email'],
        AutoVerifiedAttributes: ['email'],
      });
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedGoogleIDPProperties,
      );
      template.hasResourceProperties('AWS::Cognito::IdentityPool', {
        SupportedLoginProviders: {
          'accounts.google.com': googleClientId,
        },
      });
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        PreventUserExistenceErrors: 'ENABLED',
        CallbackURLs: ['http://localhost'],
        LogoutURLs: ['http://localhost'],
        AllowedOAuthScopes: ['email', 'profile', 'openid'],
      });
    });

    void it('throws an error if callbackUrls are not specified with external login providers', () => {
      const app = new App();
      const stack = new Stack(app);
      assert.throws(
        () =>
          new AmplifyAuth(stack, 'test', {
            loginWith: {
              email: true,
              externalProviders: {
                google: {
                  clientId: googleClientId,
                  clientSecret: SecretValue.unsafePlainText(googleClientSecret),
                },
                domainPrefix: 'test-prefix',
                scopes: ['EMAIL', 'PROFILE'],
                callbackUrls: [],
                logoutUrls: ['http://localhost'],
              },
            },
          }),
        {
          message:
            'You must define callbackUrls when configuring external login providers.',
        },
      );
    });

    void it('throws an error if domainPrefix is not specified with external login providers', () => {
      const app = new App();
      const stack = new Stack(app);
      assert.throws(
        () =>
          new AmplifyAuth(stack, 'test', {
            loginWith: {
              email: true,
              externalProviders: {
                google: {
                  clientId: googleClientId,
                  clientSecret: SecretValue.unsafePlainText(googleClientSecret),
                },
                scopes: ['EMAIL', 'PROFILE'],
                callbackUrls: ['http://redirect.com'],
                logoutUrls: ['http://localhost'],
              },
            },
          }),
        {
          message:
            'Cognito Domain Prefix is missing when external providers are configured.',
        },
      );
    });

    void it('throws an error if logoutUrls are not specified with external login providers', () => {
      const app = new App();
      const stack = new Stack(app);
      assert.throws(
        () =>
          new AmplifyAuth(stack, 'test', {
            loginWith: {
              email: true,
              externalProviders: {
                google: {
                  clientId: googleClientId,
                  clientSecret: SecretValue.unsafePlainText(googleClientSecret),
                },
                domainPrefix: 'test-prefix',
                scopes: ['EMAIL', 'PROFILE'],
                callbackUrls: ['http://redirect.com'],
                logoutUrls: [],
              },
            },
          }),
        {
          message:
            'You must define logoutUrls when configuring external login providers.',
        },
      );
    });

    void it('supports all idps and login methods', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
          phone: true,
          externalProviders: {
            google: {
              clientId: googleClientId,
              clientSecret: SecretValue.unsafePlainText(googleClientSecret),
            },
            facebook: {
              clientId: facebookClientId,
              clientSecret: facebookClientSecret,
            },
            signInWithApple: {
              clientId: appleClientId,
              keyId: appleKeyId,
              privateKey: applePrivateKey,
              teamId: appleTeamId,
            },
            loginWithAmazon: {
              clientId: amazonClientId,
              clientSecret: amazonClientSecret,
            },
            oidc: [
              {
                clientId: oidcClientId,
                clientSecret: oidcClientSecret,
                issuerUrl: oidcIssuerUrl,
                name: oidcProviderName,
              },
            ],
            saml: {
              name: samlProviderName,
              metadata: {
                metadataContent: samlMetadataContent,
                metadataType: 'FILE',
              },
            },
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['email', 'phone_number'],
        AutoVerifiedAttributes: ['email', 'phone_number'],
      });
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedAmazonIDPProperties,
      );
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedAppleIDPProperties,
      );
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedFacebookIDPProperties,
      );
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedGoogleIDPProperties,
      );
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedOidcIDPProperties,
      );
      template.hasResourceProperties(
        'AWS::Cognito::UserPoolIdentityProvider',
        ExpectedSAMLIDPProperties,
      );
      template.hasResourceProperties('AWS::Cognito::IdentityPool', {
        SupportedLoginProviders: {
          'www.amazon.com': amazonClientId,
          'accounts.google.com': googleClientId,
          'appleid.apple.com': appleClientId,
          'graph.facebook.com': facebookClientId,
        },
      });
    });

    void it('automatically maps email attributes for external providers excluding SAML', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
          externalProviders: {
            google: {
              clientId: googleClientId,
              clientSecret: SecretValue.unsafePlainText(googleClientSecret),
            },
            facebook: {
              clientId: facebookClientId,
              clientSecret: facebookClientSecret,
            },
            signInWithApple: {
              clientId: appleClientId,
              keyId: appleKeyId,
              privateKey: applePrivateKey,
              teamId: appleTeamId,
            },
            loginWithAmazon: {
              clientId: amazonClientId,
              clientSecret: amazonClientSecret,
            },
            oidc: [
              {
                clientId: oidcClientId,
                clientSecret: oidcClientSecret,
                issuerUrl: oidcIssuerUrl,
                name: oidcProviderName,
              },
            ],
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['email'],
        AutoVerifiedAttributes: ['email'],
      });
      const expectedAutoMappedAttributes = {
        AttributeMapping: {
          // 'email' is a standardized claim for oauth and oidc IDPS
          // so we can map it to cognito's 'email' claim
          email: 'email',
        },
      };
      template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
        ...ExpectedAmazonIDPProperties,
        ...expectedAutoMappedAttributes,
      });
      template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
        ...ExpectedAppleIDPProperties,
        ...expectedAutoMappedAttributes,
      });
      template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
        ...ExpectedFacebookIDPProperties,
        ...expectedAutoMappedAttributes,
      });
      template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
        ...ExpectedGoogleIDPProperties,
        ...expectedAutoMappedAttributes,
      });
      template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
        ...ExpectedOidcIDPProperties,
        ...expectedAutoMappedAttributes,
      });
      template.hasResourceProperties('AWS::Cognito::IdentityPool', {
        SupportedLoginProviders: {
          'www.amazon.com': amazonClientId,
          'accounts.google.com': googleClientId,
          'appleid.apple.com': appleClientId,
          'graph.facebook.com': facebookClientId,
        },
      });
    });

    void it('does not automatically map email attributes if phone is also enabled', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
          phone: true, // this makes phone_number a required attribute
          externalProviders: {
            google: {
              clientId: googleClientId,
              clientSecret: SecretValue.unsafePlainText(googleClientSecret),
            },
            facebook: {
              clientId: facebookClientId,
              clientSecret: facebookClientSecret,
            },
            signInWithApple: {
              clientId: appleClientId,
              keyId: appleKeyId,
              privateKey: applePrivateKey,
              teamId: appleTeamId,
            },
            loginWithAmazon: {
              clientId: amazonClientId,
              clientSecret: amazonClientSecret,
            },
            oidc: [
              {
                clientId: oidcClientId,
                clientSecret: oidcClientSecret,
                issuerUrl: oidcIssuerUrl,
                name: oidcProviderName,
              },
            ],
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['email', 'phone_number'],
        AutoVerifiedAttributes: ['email', 'phone_number'],
      });
      const mappingThatShouldNotExist = {
        AttributeMapping: {
          email: 'email',
        },
      };
      assert.throws(() => {
        template.hasResourceProperties(
          'AWS::Cognito::UserPoolIdentityProvider',
          {
            ...ExpectedAmazonIDPProperties,
            ...mappingThatShouldNotExist,
          },
        );
      });
      assert.throws(() => {
        template.hasResourceProperties(
          'AWS::Cognito::UserPoolIdentityProvider',
          {
            ...ExpectedAppleIDPProperties,
            ...mappingThatShouldNotExist,
          },
        );
      });
      assert.throws(() => {
        template.hasResourceProperties(
          'AWS::Cognito::UserPoolIdentityProvider',
          {
            ...ExpectedFacebookIDPProperties,
            ...mappingThatShouldNotExist,
          },
        );
      });
      assert.throws(() => {
        template.hasResourceProperties(
          'AWS::Cognito::UserPoolIdentityProvider',
          {
            ...ExpectedGoogleIDPProperties,
            ...mappingThatShouldNotExist,
          },
        );
      });
      assert.throws(() => {
        template.hasResourceProperties(
          'AWS::Cognito::UserPoolIdentityProvider',
          {
            ...ExpectedOidcIDPProperties,
            ...mappingThatShouldNotExist,
          },
        );
      });
    });

    void it('automatically maps email attributes for external providers and keeps existing configuration', () => {
      const app = new App();
      const stack = new Stack(app);
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
          externalProviders: {
            google: {
              clientId: googleClientId,
              clientSecret: SecretValue.unsafePlainText(googleClientSecret),
              attributeMapping: {
                fullname: ProviderAttribute.GOOGLE_NAME.attributeName,
              },
            },
            facebook: {
              clientId: facebookClientId,
              clientSecret: facebookClientSecret,
              attributeMapping: {
                fullname: ProviderAttribute.FACEBOOK_NAME.attributeName,
              },
            },
            signInWithApple: {
              clientId: appleClientId,
              keyId: appleKeyId,
              privateKey: applePrivateKey,
              teamId: appleTeamId,
              attributeMapping: {
                fullname: ProviderAttribute.APPLE_NAME.attributeName,
              },
            },
            loginWithAmazon: {
              clientId: amazonClientId,
              clientSecret: amazonClientSecret,
              attributeMapping: {
                fullname: ProviderAttribute.AMAZON_NAME.attributeName,
              },
            },
            oidc: [
              {
                clientId: oidcClientId,
                clientSecret: oidcClientSecret,
                issuerUrl: oidcIssuerUrl,
                name: oidcProviderName,
                attributeMapping: {
                  fullname: 'name',
                },
              },
            ],
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['email'],
        AutoVerifiedAttributes: ['email'],
      });
      const expectedAutoMappedAttributes = {
        AttributeMapping: {
          // 'email' is a standardized claim for oauth and oidc IDPS
          // so we can map it to cognito's 'email' claim
          email: 'email',
        },
      };
      template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
        ...ExpectedAmazonIDPProperties,
        ...{
          AttributeMapping: {
            ...expectedAutoMappedAttributes.AttributeMapping,
            name: ProviderAttribute.AMAZON_NAME.attributeName,
          },
        },
      });
      template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
        ...ExpectedAppleIDPProperties,
        ...{
          AttributeMapping: {
            ...expectedAutoMappedAttributes.AttributeMapping,
            name: ProviderAttribute.APPLE_NAME.attributeName,
          },
        },
      });
      template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
        ...ExpectedFacebookIDPProperties,
        ...{
          AttributeMapping: {
            ...expectedAutoMappedAttributes.AttributeMapping,
            name: ProviderAttribute.FACEBOOK_NAME.attributeName,
          },
        },
      });
      template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
        ...ExpectedGoogleIDPProperties,
        ...{
          AttributeMapping: {
            ...expectedAutoMappedAttributes.AttributeMapping,
            name: ProviderAttribute.GOOGLE_NAME.attributeName,
          },
        },
      });
      template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
        ...ExpectedOidcIDPProperties,
        AttributeMapping: {
          ...expectedAutoMappedAttributes.AttributeMapping,
          name: 'name',
        },
      });
      template.hasResourceProperties('AWS::Cognito::IdentityPool', {
        SupportedLoginProviders: {
          'www.amazon.com': amazonClientId,
          'accounts.google.com': googleClientId,
          'appleid.apple.com': appleClientId,
          'graph.facebook.com': facebookClientId,
        },
      });
    });

    void it('should not override email attribute mapping if customer providers their own mapping', () => {
      const app = new App();
      const stack = new Stack(app);
      const customEmailMapping = 'customMapping';
      new AmplifyAuth(stack, 'test', {
        loginWith: {
          email: true,
          externalProviders: {
            google: {
              clientId: googleClientId,
              clientSecret: SecretValue.unsafePlainText(googleClientSecret),
              attributeMapping: {
                email: customEmailMapping,
                fullname: ProviderAttribute.GOOGLE_NAME.attributeName,
              },
            },
            facebook: {
              clientId: facebookClientId,
              clientSecret: facebookClientSecret,
              attributeMapping: {
                email: customEmailMapping,
                fullname: ProviderAttribute.FACEBOOK_NAME.attributeName,
              },
            },
            signInWithApple: {
              clientId: appleClientId,
              keyId: appleKeyId,
              privateKey: applePrivateKey,
              teamId: appleTeamId,
              attributeMapping: {
                email: customEmailMapping,
                fullname: ProviderAttribute.APPLE_NAME.attributeName,
              },
            },
            loginWithAmazon: {
              clientId: amazonClientId,
              clientSecret: amazonClientSecret,
              attributeMapping: {
                email: customEmailMapping,
                fullname: ProviderAttribute.AMAZON_NAME.attributeName,
              },
            },
            oidc: [
              {
                clientId: oidcClientId,
                clientSecret: oidcClientSecret,
                issuerUrl: oidcIssuerUrl,
                name: oidcProviderName,
                attributeMapping: {
                  email: customEmailMapping,
                  fullname: 'name',
                },
              },
            ],
            domainPrefix: 'test-prefix',
            callbackUrls: ['https://redirect.com'],
            logoutUrls: ['https://logout.com'],
          },
        },
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['email'],
        AutoVerifiedAttributes: ['email'],
      });
      const expectedAutoMappedAttributes = {
        AttributeMapping: {
          email: customEmailMapping,
        },
      };
      template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
        ...ExpectedAmazonIDPProperties,
        ...{
          AttributeMapping: {
            ...expectedAutoMappedAttributes.AttributeMapping,
            name: ProviderAttribute.AMAZON_NAME.attributeName,
          },
        },
      });
      template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
        ...ExpectedAppleIDPProperties,
        ...{
          AttributeMapping: {
            ...expectedAutoMappedAttributes.AttributeMapping,
            name: ProviderAttribute.APPLE_NAME.attributeName,
          },
        },
      });
      template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
        ...ExpectedFacebookIDPProperties,
        ...{
          AttributeMapping: {
            ...expectedAutoMappedAttributes.AttributeMapping,
            name: ProviderAttribute.FACEBOOK_NAME.attributeName,
          },
        },
      });
      template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
        ...ExpectedGoogleIDPProperties,
        ...{
          AttributeMapping: {
            ...expectedAutoMappedAttributes.AttributeMapping,
            name: ProviderAttribute.GOOGLE_NAME.attributeName,
          },
        },
      });
      template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
        ...ExpectedOidcIDPProperties,
        AttributeMapping: {
          ...expectedAutoMappedAttributes.AttributeMapping,
          name: 'name',
        },
      });
      template.hasResourceProperties('AWS::Cognito::IdentityPool', {
        SupportedLoginProviders: {
          'www.amazon.com': amazonClientId,
          'accounts.google.com': googleClientId,
          'appleid.apple.com': appleClientId,
          'graph.facebook.com': facebookClientId,
        },
      });
    });
  });

  void it('sets resource names based on id and name property', () => {
    const app = new App();
    const stack = new Stack(app);
    const stackId = 'test';
    const name = 'name';
    const expectedPrefix = stackId + name;
    new AmplifyAuth(stack, 'test', {
      name: name,
      loginWith: {
        email: true,
        phone: true,
        externalProviders: {
          google: {
            clientId: googleClientId,
            clientSecret: SecretValue.unsafePlainText(googleClientSecret),
          },
          facebook: {
            clientId: facebookClientId,
            clientSecret: facebookClientSecret,
          },
          signInWithApple: {
            clientId: appleClientId,
            keyId: appleKeyId,
            privateKey: applePrivateKey,
            teamId: appleTeamId,
          },
          loginWithAmazon: {
            clientId: amazonClientId,
            clientSecret: amazonClientSecret,
          },
          oidc: [
            {
              clientId: oidcClientId,
              clientSecret: oidcClientSecret,
              issuerUrl: oidcIssuerUrl,
              name: oidcProviderName,
            },
          ],
          saml: {
            name: samlProviderName,
            metadata: {
              metadataContent: samlMetadataContent,
              metadataType: 'FILE',
            },
          },
          domainPrefix: 'test-prefix',
          callbackUrls: ['https://redirect.com'],
          logoutUrls: ['https://logout.com'],
        },
      },
    });
    const template = Template.fromStack(stack);
    const resources = template['template']['Resources'];
    const resourceNames = Object.keys(resources);
    resourceNames.map((name) => {
      assert.equal(name.startsWith(expectedPrefix), true);
    });
  });

  void it('sets the correct userPoolName when name is provided', () => {
    const app = new App();
    const stack = new Stack(app);
    const customAuthName = 'CustomAuthName';
    new AmplifyAuth(stack, 'test', {
      loginWith: { email: true },
      name: customAuthName,
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UserPoolName: customAuthName,
    });
  });

  void it('uses empty string as userPoolName when name is not provided', () => {
    const app = new App();
    const stack = new Stack(app);
    new AmplifyAuth(stack, 'test', {
      loginWith: { email: true },
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UserPoolName: Match.absent(),
    });
  });
});
