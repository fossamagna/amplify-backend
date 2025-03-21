import { graphqlOutputKey } from '@aws-amplify/backend-output-schemas';
import {
  BackendOutputClientError,
  BackendOutputClientErrorType,
  BackendOutputClientFactory,
} from '@aws-amplify/deployed-backend-client';
import assert from 'node:assert';
import path from 'node:path';
import { describe, it, mock } from 'node:test';
import yargs, { CommandModule } from 'yargs';
import {
  AppBackendIdentifierResolver,
  BackendIdentifierResolver,
} from '../../../backend-identifier/backend_identifier_resolver.js';
import { BackendIdentifierResolverWithFallback } from '../../../backend-identifier/backend_identifier_with_sandbox_fallback.js';
import { FormGenerationHandler } from '../../../form-generation/form_generation_handler.js';
import {
  TestCommandError,
  TestCommandRunner,
} from '../../../test-utils/command_runner.js';
import { SandboxBackendIdResolver } from '../../sandbox/sandbox_id_resolver.js';
import { GenerateFormsCommand } from './generate_forms_command.js';
import { S3Client } from '@aws-sdk/client-s3';
import { AmplifyClient } from '@aws-sdk/client-amplify';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';

const awsClientProvider = {
  getS3Client: () => new S3Client(),
  getAmplifyClient: () => new AmplifyClient(),
  getCloudFormationClient: () => new CloudFormationClient(),
};
void describe('generate forms command', () => {
  void describe('form generation validation', () => {
    void it('models are generated in ${out-dir}/graphql', async () => {
      const backendIdResolver = new AppBackendIdentifierResolver({
        resolve: () => Promise.resolve('testAppName'),
      });
      const formGenerationHandler = new FormGenerationHandler({
        awsClientProvider,
      });

      const fakedBackendOutputClient =
        BackendOutputClientFactory.getInstance(awsClientProvider);

      const generateFormsCommand = new GenerateFormsCommand(
        backendIdResolver,
        () => fakedBackendOutputClient,
        formGenerationHandler,
      );

      const generationMock = mock.method(formGenerationHandler, 'generate');
      generationMock.mock.mockImplementation(async () => undefined);
      mock
        .method(fakedBackendOutputClient, 'getOutput')
        .mock.mockImplementation(async () => ({
          [graphqlOutputKey]: {
            version: '1',
            payload: {
              awsAppsyncRegion: 'us-west-1',
              awsAppsyncApiEndpoint: 'test_endpoint',
              awsAppsyncAuthenticationType: 'API_KEY',
              awsAppsyncApiId: 'test_api_id',
              amplifyApiModelSchemaS3Uri: 'test_schema',
            },
          },
        }));
      const parser = yargs().command(
        generateFormsCommand as unknown as CommandModule,
      );

      const outPath = 'my-fake-models-path';
      const commandRunner = new TestCommandRunner(parser);
      await commandRunner.runCommand(
        `forms --stack my_stack --out-dir ${outPath}`,
      );
      assert.equal(
        path.join(generationMock.mock.calls[0].arguments[0].modelsOutDir),
        path.join(`${outPath}/graphql`),
      );
    });
    void it('out-dir path can be customized', async () => {
      const backendIdResolver = new AppBackendIdentifierResolver({
        resolve: () => Promise.resolve('testAppName'),
      });
      const formGenerationHandler = new FormGenerationHandler({
        awsClientProvider,
      });

      const fakedBackendOutputClient =
        BackendOutputClientFactory.getInstance(awsClientProvider);

      const generateFormsCommand = new GenerateFormsCommand(
        backendIdResolver,
        () => fakedBackendOutputClient,
        formGenerationHandler,
      );

      const generationMock = mock.method(formGenerationHandler, 'generate');
      generationMock.mock.mockImplementation(async () => undefined);
      mock
        .method(fakedBackendOutputClient, 'getOutput')
        .mock.mockImplementation(async () => ({
          [graphqlOutputKey]: {
            version: '1',
            payload: {
              awsAppsyncRegion: 'us-west-1',
              awsAppsyncApiEndpoint: 'test_endpoint',
              awsAppsyncAuthenticationType: 'API_KEY',
              awsAppsyncApiId: 'test_api_id',
              amplifyApiModelSchemaS3Uri: 'test_schema',
            },
          },
        }));
      const parser = yargs().command(
        generateFormsCommand as unknown as CommandModule,
      );

      const uiOutPath = './my-fake-ui-path';
      const commandRunner = new TestCommandRunner(parser);
      await commandRunner.runCommand(
        `forms --stack my_stack --out-dir ${uiOutPath}`,
      );
      assert.equal(
        generationMock.mock.calls[0].arguments[0].uiOutDir,
        uiOutPath,
      );
    });
    void it('./ui-components is the default graphql model generation path', async () => {
      const backendIdResolver = new AppBackendIdentifierResolver({
        resolve: () => Promise.resolve('testAppName'),
      });
      const formGenerationHandler = new FormGenerationHandler({
        awsClientProvider,
      });

      const fakedBackendOutputClient =
        BackendOutputClientFactory.getInstance(awsClientProvider);

      const generateFormsCommand = new GenerateFormsCommand(
        backendIdResolver,
        () => fakedBackendOutputClient,
        formGenerationHandler,
      );

      const generationMock = mock.method(formGenerationHandler, 'generate');
      generationMock.mock.mockImplementation(async () => undefined);
      mock
        .method(fakedBackendOutputClient, 'getOutput')
        .mock.mockImplementation(async () => ({
          [graphqlOutputKey]: {
            version: '1',
            payload: {
              awsAppsyncRegion: 'us-west-1',
              awsAppsyncApiEndpoint: 'test_endpoint',
              awsAppsyncAuthenticationType: 'API_KEY',
              awsAppsyncApiId: 'test_api_id',
              amplifyApiModelSchemaS3Uri: 'test_schema',
            },
          },
        }));
      const parser = yargs().command(
        generateFormsCommand as unknown as CommandModule,
      );
      const commandRunner = new TestCommandRunner(parser);
      await commandRunner.runCommand('forms --stack my_stack');
      assert.equal(
        generationMock.mock.calls[0].arguments[0].uiOutDir,
        './ui-components',
      );
    });
  });
  void it('if neither branch nor stack are provided, the sandbox id is used by default', async () => {
    const appNameResolver = {
      resolve: () => Promise.resolve('testAppName'),
    };

    const defaultResolver = new AppBackendIdentifierResolver(appNameResolver);

    const mockedSandboxIdResolver = new SandboxBackendIdResolver(
      appNameResolver,
    );

    const fakeSandboxId = 'my-fake-app-my-fake-username';

    const sandboxIdResolver = mock.method(mockedSandboxIdResolver, 'resolve');
    sandboxIdResolver.mock.mockImplementation(() =>
      Promise.resolve({
        namespace: fakeSandboxId,
        name: fakeSandboxId,
        type: 'sandbox',
      }),
    );

    const backendIdResolver = new BackendIdentifierResolverWithFallback(
      defaultResolver,
      mockedSandboxIdResolver,
    );
    const formGenerationHandler = new FormGenerationHandler({
      awsClientProvider,
    });

    const fakedBackendOutputClient =
      BackendOutputClientFactory.getInstance(awsClientProvider);

    const generateFormsCommand = new GenerateFormsCommand(
      backendIdResolver,
      () => fakedBackendOutputClient,
      formGenerationHandler,
    );

    const generationMock = mock.method(formGenerationHandler, 'generate');
    generationMock.mock.mockImplementation(async () => undefined);
    mock
      .method(fakedBackendOutputClient, 'getOutput')
      .mock.mockImplementation(async () => ({
        [graphqlOutputKey]: {
          version: '1',
          payload: {
            awsAppsyncRegion: 'us-west-1',
            awsAppsyncApiEndpoint: 'test_endpoint',
            awsAppsyncAuthenticationType: 'API_KEY',
            awsAppsyncApiId: 'test_api_id',
            amplifyApiModelSchemaS3Uri: 'test_schema',
          },
        },
      }));
    const parser = yargs().command(
      generateFormsCommand as unknown as CommandModule,
    );
    const commandRunner = new TestCommandRunner(parser);
    await commandRunner.runCommand('forms');
    assert.deepEqual(
      generationMock.mock.calls[0].arguments[0].backendIdentifier,
      {
        namespace: fakeSandboxId,
        name: fakeSandboxId,
        type: 'sandbox',
      },
    );
  });

  void it('throws user error if the stack deployment is currently in progress', async () => {
    const fakeSandboxId = 'my-fake-app-my-fake-username';
    const backendIdResolver = {
      resolveDeployedBackendIdentifier: mock.fn(() =>
        Promise.resolve({
          namespace: fakeSandboxId,
          name: fakeSandboxId,
          type: 'sandbox',
        }),
      ),
      resolveBackendIdentifier: mock.fn(() =>
        Promise.resolve({
          namespace: fakeSandboxId,
          name: fakeSandboxId,
          type: 'sandbox',
        }),
      ),
    } as BackendIdentifierResolver;
    const formGenerationHandler = new FormGenerationHandler({
      awsClientProvider,
    });

    const fakedBackendOutputClient = {
      getOutput: mock.fn(() => {
        throw new BackendOutputClientError(
          BackendOutputClientErrorType.DEPLOYMENT_IN_PROGRESS,
          'deployment in progress',
        );
      }),
    };

    const generateFormsCommand = new GenerateFormsCommand(
      backendIdResolver,
      () => fakedBackendOutputClient,
      formGenerationHandler,
    );

    const parser = yargs().command(
      generateFormsCommand as unknown as CommandModule,
    );
    const commandRunner = new TestCommandRunner(parser);
    await assert.rejects(
      () => commandRunner.runCommand('forms'),
      (error: TestCommandError) => {
        assert.strictEqual(error.error.name, 'DeploymentInProgressError');
        assert.strictEqual(
          error.error.message,
          'Deployment is currently in progress.',
        );
        return true;
      },
    );
  });

  void it('throws user error if the stack does not exist', async () => {
    const fakeSandboxId = 'my-fake-app-my-fake-username';
    const backendIdResolver = {
      resolveDeployedBackendIdentifier: mock.fn(() =>
        Promise.resolve({
          namespace: fakeSandboxId,
          name: fakeSandboxId,
          type: 'sandbox',
        }),
      ),
      resolveBackendIdentifier: mock.fn(() =>
        Promise.resolve({
          namespace: fakeSandboxId,
          name: fakeSandboxId,
          type: 'sandbox',
        }),
      ),
    } as BackendIdentifierResolver;
    const formGenerationHandler = new FormGenerationHandler({
      awsClientProvider,
    });

    const fakedBackendOutputClient = {
      getOutput: mock.fn(() => {
        throw new BackendOutputClientError(
          BackendOutputClientErrorType.NO_STACK_FOUND,
          'Stack does not exist.',
        );
      }),
    };

    const generateFormsCommand = new GenerateFormsCommand(
      backendIdResolver,
      () => fakedBackendOutputClient,
      formGenerationHandler,
    );

    const parser = yargs().command(
      generateFormsCommand as unknown as CommandModule,
    );
    const commandRunner = new TestCommandRunner(parser);
    await assert.rejects(
      () => commandRunner.runCommand('forms'),
      (error: TestCommandError) => {
        assert.strictEqual(error.error.name, 'StackDoesNotExistError');
        assert.strictEqual(error.error.message, 'Stack does not exist.');
        return true;
      },
    );
  });

  void it('throws user error if the stack outputs are undefined', async () => {
    const fakeSandboxId = 'my-fake-app-my-fake-username';
    const backendIdResolver = {
      resolveDeployedBackendIdentifier: mock.fn(() =>
        Promise.resolve({
          namespace: fakeSandboxId,
          name: fakeSandboxId,
          type: 'sandbox',
        }),
      ),
      resolveBackendIdentifier: mock.fn(() =>
        Promise.resolve({
          namespace: fakeSandboxId,
          name: fakeSandboxId,
          type: 'sandbox',
        }),
      ),
    } as BackendIdentifierResolver;
    const formGenerationHandler = new FormGenerationHandler({
      awsClientProvider,
    });

    const fakedBackendOutputClient = {
      getOutput: mock.fn(() => {
        throw new BackendOutputClientError(
          BackendOutputClientErrorType.NO_OUTPUTS_FOUND,
          'stack outputs are undefined',
        );
      }),
    };

    const generateFormsCommand = new GenerateFormsCommand(
      backendIdResolver,
      () => fakedBackendOutputClient,
      formGenerationHandler,
    );

    const parser = yargs().command(
      generateFormsCommand as unknown as CommandModule,
    );
    const commandRunner = new TestCommandRunner(parser);
    await assert.rejects(
      () => commandRunner.runCommand('forms'),
      (error: TestCommandError) => {
        assert.strictEqual(error.error.name, 'AmplifyOutputsNotFoundError');
        assert.strictEqual(
          error.error.message,
          'Amplify outputs not found in stack metadata',
        );
        return true;
      },
    );
  });

  void it('throws user error if credentials are expired when getting backend outputs', async () => {
    const fakeSandboxId = 'my-fake-app-my-fake-username';
    const backendIdResolver = {
      resolveDeployedBackendIdentifier: mock.fn(() =>
        Promise.resolve({
          namespace: fakeSandboxId,
          name: fakeSandboxId,
          type: 'sandbox',
        }),
      ),
      resolveBackendIdentifier: mock.fn(() =>
        Promise.resolve({
          namespace: fakeSandboxId,
          name: fakeSandboxId,
          type: 'sandbox',
        }),
      ),
    } as BackendIdentifierResolver;
    const formGenerationHandler = new FormGenerationHandler({
      awsClientProvider,
    });

    const fakedBackendOutputClient = {
      getOutput: mock.fn(() => {
        throw new BackendOutputClientError(
          BackendOutputClientErrorType.CREDENTIALS_ERROR,
          'token is expired',
        );
      }),
    };

    const generateFormsCommand = new GenerateFormsCommand(
      backendIdResolver,
      () => fakedBackendOutputClient,
      formGenerationHandler,
    );

    const parser = yargs().command(
      generateFormsCommand as unknown as CommandModule,
    );
    const commandRunner = new TestCommandRunner(parser);
    await assert.rejects(
      () => commandRunner.runCommand('forms'),
      (error: TestCommandError) => {
        assert.strictEqual(error.error.name, 'CredentialsError');
        assert.strictEqual(
          error.error.message,
          'Unable to get backend outputs due to invalid credentials.',
        );
        return true;
      },
    );
  });

  void it('throws user error if access is denied when getting backend outputs', async () => {
    const fakeSandboxId = 'my-fake-app-my-fake-username';
    const backendIdResolver = {
      resolveDeployedBackendIdentifier: mock.fn(() =>
        Promise.resolve({
          namespace: fakeSandboxId,
          name: fakeSandboxId,
          type: 'sandbox',
        }),
      ),
      resolveBackendIdentifier: mock.fn(() =>
        Promise.resolve({
          namespace: fakeSandboxId,
          name: fakeSandboxId,
          type: 'sandbox',
        }),
      ),
    } as BackendIdentifierResolver;
    const formGenerationHandler = new FormGenerationHandler({
      awsClientProvider,
    });

    const fakedBackendOutputClient = {
      getOutput: mock.fn(() => {
        throw new BackendOutputClientError(
          BackendOutputClientErrorType.ACCESS_DENIED,
          'access is denied',
        );
      }),
    };

    const generateFormsCommand = new GenerateFormsCommand(
      backendIdResolver,
      () => fakedBackendOutputClient,
      formGenerationHandler,
    );

    const parser = yargs().command(
      generateFormsCommand as unknown as CommandModule,
    );
    const commandRunner = new TestCommandRunner(parser);
    await assert.rejects(
      () => commandRunner.runCommand('forms'),
      (error: TestCommandError) => {
        assert.strictEqual(error.error.name, 'AccessDeniedError');
        assert.strictEqual(
          error.error.message,
          'Unable to get backend outputs due to insufficient permissions.',
        );
        return true;
      },
    );
  });

  void it('throws user error if both stack and branch are present', async () => {
    const appNameResolver = {
      resolve: () => Promise.resolve('testAppName'),
    };

    const defaultResolver = new AppBackendIdentifierResolver(appNameResolver);

    const mockedSandboxIdResolver = new SandboxBackendIdResolver(
      appNameResolver,
    );

    const backendIdResolver = new BackendIdentifierResolverWithFallback(
      defaultResolver,
      mockedSandboxIdResolver,
    );
    const formGenerationHandler = new FormGenerationHandler({
      awsClientProvider,
    });

    const fakedBackendOutputClient =
      BackendOutputClientFactory.getInstance(awsClientProvider);

    const generateFormsCommand = new GenerateFormsCommand(
      backendIdResolver,
      () => fakedBackendOutputClient,
      formGenerationHandler,
    );
    const parser = yargs().command(
      generateFormsCommand as unknown as CommandModule,
    );
    const commandRunner = new TestCommandRunner(parser);
    const output = await commandRunner.runCommand(
      'forms --stack foo --branch baz',
    );
    assert.match(output, /Arguments .* are mutually exclusive/);
  });

  void it('throws user error if branch is present but not app id', async () => {
    const appNameResolver = {
      resolve: () => Promise.resolve('testAppName'),
    };

    const defaultResolver = new AppBackendIdentifierResolver(appNameResolver);

    const mockedSandboxIdResolver = new SandboxBackendIdResolver(
      appNameResolver,
    );

    const backendIdResolver = new BackendIdentifierResolverWithFallback(
      defaultResolver,
      mockedSandboxIdResolver,
    );
    const formGenerationHandler = new FormGenerationHandler({
      awsClientProvider,
    });

    const fakedBackendOutputClient =
      BackendOutputClientFactory.getInstance(awsClientProvider);

    const generateFormsCommand = new GenerateFormsCommand(
      backendIdResolver,
      () => fakedBackendOutputClient,
      formGenerationHandler,
    );
    const parser = yargs().command(
      generateFormsCommand as unknown as CommandModule,
    );
    const commandRunner = new TestCommandRunner(parser);
    const output = await commandRunner.runCommand('forms --branch baz');
    assert.match(output, /Missing dependent arguments:/);
    assert.match(output, /branch -> app-id/);
  });
});
