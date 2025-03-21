import { afterEach, describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { AmplifySandboxExecutor } from './sandbox_executor.js';
import {
  BackendDeployerFactory,
  BackendDeployerOutputFormatter,
} from '@aws-amplify/backend-deployer';
import {
  LogLevel,
  PackageManagerControllerFactory,
  Printer,
} from '@aws-amplify/cli-core';
import {
  SecretListItem,
  getSecretClientWithAmplifyErrorHandling,
} from '@aws-amplify/backend-secret';

const logMock = mock.fn();
const mockedPrinter = {
  log: mock.fn(),
};
const packageManagerControllerFactory = new PackageManagerControllerFactory(
  process.cwd(),
  new Printer(LogLevel.DEBUG),
);

const formatterStub: BackendDeployerOutputFormatter = {
  normalizeAmpxCommand: () => 'test command',
};

const backendDeployerFactory = new BackendDeployerFactory(
  packageManagerControllerFactory.getPackageManagerController(),
  formatterStub,
);
const backendDeployer = backendDeployerFactory.getInstance();
const secretClient = getSecretClientWithAmplifyErrorHandling();
const sandboxExecutor = new AmplifySandboxExecutor(
  backendDeployer,
  secretClient,
  mockedPrinter as never,
);

const newlyUpdatedSecretItem: SecretListItem = {
  name: 'C',
  lastUpdated: new Date(1234567),
};

const listSecretMock = mock.method(secretClient, 'listSecrets', () =>
  Promise.resolve([
    {
      name: 'A',
      lastUpdated: new Date(1234),
    },
    {
      name: 'B',
    },
    newlyUpdatedSecretItem,
  ]),
);

const backendDeployerDeployMock = mock.method(backendDeployer, 'deploy', () =>
  Promise.resolve(),
);

const validateAppSourcesProvider = mock.fn(() => true);

void describe('Sandbox executor', () => {
  afterEach(() => {
    backendDeployerDeployMock.mock.resetCalls();
    validateAppSourcesProvider.mock.resetCalls();
    listSecretMock.mock.resetCalls();
    logMock.mock.resetCalls();
  });

  void it('retrieves file change summary once (debounce)', async () => {
    const firstDeployPromise = sandboxExecutor.deploy(
      {
        namespace: 'testSandboxId',
        name: 'testSandboxName',
        type: 'sandbox',
      },
      validateAppSourcesProvider,
      undefined,
    );

    const secondDeployPromise = sandboxExecutor.deploy(
      {
        namespace: 'testSandboxId',
        name: 'testSandboxName',
        type: 'sandbox',
      },
      validateAppSourcesProvider,
      undefined,
    );

    await Promise.all([firstDeployPromise, secondDeployPromise]);

    // Assert debounce worked as expected
    assert.strictEqual(backendDeployerDeployMock.mock.callCount(), 1);
    assert.strictEqual(validateAppSourcesProvider.mock.callCount(), 1);
  });

  [true, false].forEach((shouldValidateSources) => {
    void it(`calls deployer with correct validateSources=${shouldValidateSources.toString()} setting`, async () => {
      validateAppSourcesProvider.mock.mockImplementationOnce(
        () => shouldValidateSources,
      );

      await sandboxExecutor.deploy(
        {
          namespace: 'testSandboxId',
          name: 'testSandboxName',
          type: 'sandbox',
        },
        validateAppSourcesProvider,
        undefined,
      );

      assert.strictEqual(backendDeployerDeployMock.mock.callCount(), 1);
      // BackendDeployer should be called with the right params
      assert.deepStrictEqual(
        backendDeployerDeployMock.mock.calls[0].arguments,
        [
          {
            name: 'testSandboxName',
            namespace: 'testSandboxId',
            type: 'sandbox',
          },
          {
            profile: undefined,
            secretLastUpdated: newlyUpdatedSecretItem.lastUpdated,
            validateAppSources: shouldValidateSources,
          },
        ],
      );
    });
  });

  ['test_profile', undefined].forEach((profile) => {
    void it(`calls deployer with correct profile=${
      profile ?? 'undefined'
    } setting`, async () => {
      await sandboxExecutor.deploy(
        {
          namespace: 'testSandboxId',
          name: 'testSandboxName',
          type: 'sandbox',
        },
        validateAppSourcesProvider,
        profile,
      );

      assert.strictEqual(backendDeployerDeployMock.mock.callCount(), 1);
      // BackendDeployer should be called with the right params
      assert.deepStrictEqual(
        backendDeployerDeployMock.mock.calls[0].arguments,
        [
          {
            name: 'testSandboxName',
            namespace: 'testSandboxId',
            type: 'sandbox',
          },
          {
            profile: profile,
            secretLastUpdated: newlyUpdatedSecretItem.lastUpdated,
            validateAppSources: true,
          },
        ],
      );
    });
  });
});
