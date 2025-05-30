import { beforeEach, describe, it, mock } from 'node:test';
import { GenerateOutputsCommand } from './generate_outputs_command.js';
import { ClientConfigFormat } from '@aws-amplify/client-config';
import yargs, { CommandModule } from 'yargs';
import { TestCommandRunner } from '../../../test-utils/command_runner.js';
import assert from 'node:assert';
import { AppBackendIdentifierResolver } from '../../../backend-identifier/backend_identifier_resolver.js';
import { ClientConfigGeneratorAdapter } from '../../../client-config/client_config_generator_adapter.js';
import { BackendIdentifierResolverWithFallback } from '../../../backend-identifier/backend_identifier_with_sandbox_fallback.js';
import { SandboxBackendIdResolver } from '../../sandbox/sandbox_id_resolver.js';
import { S3Client } from '@aws-sdk/client-s3';
import { AmplifyClient } from '@aws-sdk/client-amplify';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';

void describe('generate outputs command', () => {
  const clientConfigGeneratorAdapter = new ClientConfigGeneratorAdapter({
    getS3Client: () => new S3Client(),
    getAmplifyClient: () => new AmplifyClient(),
    getCloudFormationClient: () => new CloudFormationClient(),
  });

  const generateClientConfigMock = mock.method(
    clientConfigGeneratorAdapter,
    'generateClientConfigToFile',
    () => Promise.resolve(),
  );

  const namespaceResolver = {
    resolve: () => Promise.resolve('testAppName'),
  };

  const defaultResolver = new AppBackendIdentifierResolver(namespaceResolver);

  const sandboxIdResolver = new SandboxBackendIdResolver(namespaceResolver);
  const fakeSandboxId = 'my-fake-app-my-fake-username';
  mock.method(sandboxIdResolver, 'resolve', () => fakeSandboxId);

  const backendIdResolver = new BackendIdentifierResolverWithFallback(
    defaultResolver,
    sandboxIdResolver,
  );

  const generateOutputsCommand = new GenerateOutputsCommand(
    clientConfigGeneratorAdapter,
    backendIdResolver,
  );
  const parser = yargs().command(
    generateOutputsCommand as unknown as CommandModule,
  );
  const commandRunner = new TestCommandRunner(parser);

  beforeEach(() => {
    generateClientConfigMock.mock.resetCalls();
  });

  void it('uses the sandbox id by default if stack or branch are not provided', async () => {
    const handlerSpy = mock.method(
      clientConfigGeneratorAdapter,
      'generateClientConfigToFile',
    );
    await commandRunner.runCommand('outputs');

    assert.equal(handlerSpy.mock.calls[0].arguments[0], fakeSandboxId);
  });

  void it('generates and writes config for stack', async () => {
    await commandRunner.runCommand(
      'outputs --stack stack_name --out-dir /foo/bar',
    );
    assert.equal(generateClientConfigMock.mock.callCount(), 1);
    assert.deepEqual(generateClientConfigMock.mock.calls[0].arguments[0], {
      stackName: 'stack_name',
    });
    assert.equal(generateClientConfigMock.mock.callCount(), 1);
    assert.deepEqual(
      generateClientConfigMock.mock.calls[0].arguments[1],
      '1.4', // default version
    );
    assert.deepEqual(
      generateClientConfigMock.mock.calls[0].arguments[2],
      '/foo/bar',
    );
  });

  void it('generates and writes config for appID and branch', async () => {
    await commandRunner.runCommand(
      'outputs --branch branch_name --app-id app_id --out-dir /foo/bar',
    );
    assert.equal(generateClientConfigMock.mock.callCount(), 1);
    assert.deepStrictEqual(
      generateClientConfigMock.mock.calls[0].arguments.splice(0, 4),
      [
        {
          name: 'branch_name',
          namespace: 'app_id',
          type: 'branch',
        },
        '1.4',
        '/foo/bar',
        undefined,
      ],
    );
  });

  void it('can generate to custom absolute path', async () => {
    await commandRunner.runCommand(
      'outputs --stack stack_name --out-dir /foo/bar',
    );
    assert.equal(generateClientConfigMock.mock.callCount(), 1);
    assert.deepStrictEqual(
      generateClientConfigMock.mock.calls[0].arguments.splice(0, 4),
      [
        {
          stackName: 'stack_name',
        },
        '1.4',
        '/foo/bar',
        undefined,
      ],
    );
  });

  void it('can generate to custom relative path', async () => {
    await commandRunner.runCommand(
      'outputs --stack stack_name --out-dir foo/bar',
    );
    assert.equal(generateClientConfigMock.mock.callCount(), 1);
    assert.deepStrictEqual(
      generateClientConfigMock.mock.calls[0].arguments.splice(0, 4),
      [
        {
          stackName: 'stack_name',
        },
        '1.4',
        'foo/bar',
        undefined,
      ],
    );
  });

  void it('can generate outputs in dart format', async () => {
    await commandRunner.runCommand(
      'outputs --stack stack_name --out-dir foo/bar --format dart',
    );
    assert.equal(generateClientConfigMock.mock.callCount(), 1);
    assert.deepStrictEqual(
      generateClientConfigMock.mock.calls[0].arguments.splice(0, 4),
      [
        {
          stackName: 'stack_name',
        },
        '1.4',
        'foo/bar',
        ClientConfigFormat.DART,
      ],
    );
  });

  void it('can generate legacy config in json mobile format', async () => {
    await commandRunner.runCommand(
      'outputs --stack stack_name --outputs-version 0 --out-dir foo/bar --format json-mobile',
    );
    assert.equal(generateClientConfigMock.mock.callCount(), 1);
    assert.deepStrictEqual(
      generateClientConfigMock.mock.calls[0].arguments.splice(0, 4),
      [
        {
          stackName: 'stack_name',
        },
        '0',
        'foo/bar',
        ClientConfigFormat.JSON_MOBILE,
      ],
    );
  });

  void it('can generate legacy config in ts format', async () => {
    await commandRunner.runCommand(
      'outputs --stack stack_name --outputs-version 0 --out-dir foo/bar --format ts',
    );
    assert.equal(generateClientConfigMock.mock.callCount(), 1);
    assert.deepStrictEqual(
      generateClientConfigMock.mock.calls[0].arguments.splice(0, 4),
      [
        {
          stackName: 'stack_name',
        },
        '0',
        'foo/bar',
        ClientConfigFormat.TS,
      ],
    );
  });

  void it('can generate legacy config in mjs format', async () => {
    await commandRunner.runCommand(
      'outputs --stack stack_name --outputs-version 0 --out-dir foo/bar --format mjs',
    );
    assert.equal(generateClientConfigMock.mock.callCount(), 1);
    assert.deepStrictEqual(
      generateClientConfigMock.mock.calls[0].arguments.splice(0, 4),
      [
        {
          stackName: 'stack_name',
        },
        '0',
        'foo/bar',
        ClientConfigFormat.MJS,
      ],
    );
  });

  void it('shows available options in help output', async () => {
    const output = await commandRunner.runCommand('outputs --help');
    assert.match(output, /--stack/);
    assert.match(output, /--app-id/);
    assert.match(output, /--branch/);
    assert.match(output, /--format/);
    assert.match(output, /--out-dir/);
  });

  void it('fails if both stack and branch are present', async () => {
    const output = await commandRunner.runCommand(
      'outputs --stack foo --branch baz',
    );
    assert.match(output, /Arguments .* mutually exclusive/);
  });

  void it('fails if branch is present but not app id', async () => {
    const output = await commandRunner.runCommand('outputs --branch baz');
    assert.match(output, /Missing dependent arguments:/);
    assert.match(output, /branch -> app-id/);
  });
});
