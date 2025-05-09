import { BackendIdentifierConversions } from '@aws-amplify/platform-core';
import { BackendIdentifier } from '@aws-amplify/plugin-types';
import {
  ClientConfigFileBaseName,
  ClientConfigFormat,
  getClientConfigPath,
} from '@aws-amplify/client-config';
import { ampxCli } from '../process-controller/process_controller.js';
import {
  confirmDeleteSandbox,
  interruptSandbox,
  waitForSandboxDeploymentToPrintTotalTime,
} from '../process-controller/predicated_action_macros.js';

import {
  CloudFormationClient,
  CloudFormationServiceException,
  DeleteStackCommand,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import fsp from 'fs/promises';
import assert from 'node:assert';
import { CopyDefinition } from '../process-controller/types.js';
import { BackendOutputClientFactory as CurrentCodebaseBackendOutputClientFactory } from '@aws-amplify/deployed-backend-client';
import path from 'path';
import { AmplifyClient } from '@aws-sdk/client-amplify';
import { pathToFileURL } from 'url';
import isMatch from 'lodash.ismatch';
import { setupDirAsEsmModule } from './setup_dir_as_esm_module.js';
import { Validator } from 'jsonschema';

export type PlatformDeploymentThresholds = {
  onWindows: number;
  onOther: number;
};

/**
 * Keeps test project update info.
 */
export type TestProjectUpdate = {
  /**
   * An array of source and destination objects. All replacements will be part of the update operation
   */
  replacements: CopyDefinition[];
  /**
   * Define a threshold for the hotswap deployment time
   * Windows has a separate threshold because it is consistently slower than other platforms
   * https://github.com/microsoft/Windows-Dev-Performance/issues/17
   */
  deployThresholdSec?: PlatformDeploymentThresholds;
};

/**
 * The base abstract class for test project.
 */
export abstract class TestProjectBase {
  abstract readonly sourceProjectAmplifyDirURL: URL;

  /**
   * The base test project class constructor.
   */
  constructor(
    readonly name: string,
    readonly projectDirPath: string,
    readonly projectAmplifyDirPath: string,
    protected readonly cfnClient: CloudFormationClient,
    protected readonly amplifyClient: AmplifyClient,
  ) {}

  /**
   * Deploy the project.
   */
  async deploy(
    backendIdentifier: BackendIdentifier,
    environment?: Record<string, string>,
  ) {
    if (backendIdentifier.type === 'sandbox') {
      await ampxCli(['sandbox'], this.projectDirPath, {
        env: environment,
      })
        .do(waitForSandboxDeploymentToPrintTotalTime())
        .do(interruptSandbox())
        .run();
    } else {
      await ampxCli(
        [
          'pipeline-deploy',
          '--branch',
          backendIdentifier.name,
          '--appId',
          backendIdentifier.namespace,
        ],
        this.projectDirPath,
        {
          env: {
            CI: 'true',
            ...environment,
          },
        },
      ).run();
    }
  }

  /**
   * Tear down the project.
   */
  async tearDown(
    backendIdentifier: BackendIdentifier,
    waitForStackDeletion: boolean = false,
  ) {
    if (backendIdentifier.type === 'sandbox') {
      await ampxCli(['sandbox', 'delete'], this.projectDirPath)
        .do(confirmDeleteSandbox())
        .run();
    } else {
      const stackName =
        BackendIdentifierConversions.toStackName(backendIdentifier);
      await this.cfnClient.send(
        new DeleteStackCommand({
          StackName: stackName,
        }),
      );
      if (waitForStackDeletion) {
        await this.waitForStackDeletion(stackName);
      }
    }
  }

  /**
   * Wait for a stack to be deleted, returns true if deleted within allotted time.
   * @param stackName name of the stack
   * @returns true if delete completes within allotted time (3 minutes)
   */
  async waitForStackDeletion(
    stackName: string,
    timeoutInMS: number = 3 * 60 * 1000,
  ): Promise<boolean> {
    let attempts = 0;
    let totalTimeWaitedMs = 0;
    const maxIntervalMs = 32 * 1000;
    while (totalTimeWaitedMs < timeoutInMS) {
      attempts++;
      const intervalMs = Math.min(Math.pow(2, attempts) * 1000, maxIntervalMs);
      console.log(`waiting: ${intervalMs} milliseconds`);
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      totalTimeWaitedMs += intervalMs;
      try {
        const status = await this.cfnClient.send(
          new DescribeStacksCommand({
            StackName: stackName,
          }),
        );
        console.log(
          JSON.stringify(status.Stacks?.map((s) => s.StackName) ?? []),
        );
        if (!status.Stacks || status.Stacks.length == 0) {
          console.log(`Stack ${stackName} was deleted successfully.`);
          return true;
        }
      } catch (e) {
        if (
          e instanceof CloudFormationServiceException &&
          e.message.includes('does not exist')
        ) {
          console.log(`Stack ${stackName} was deleted successfully.`);
          return true;
        }
        console.error(
          `Could not describe stack ${stackName} while waiting for deletion.`,
          e,
        );
        throw e;
      }
    }
    console.error(
      `Stack ${stackName} did not delete within ${
        timeoutInMS / 1000
      } seconds, continuing.`,
    );
    return false;
  }

  /**
   * Gets all project update cases. Override this method if the update (hotswap) test is relevant.
   */
  async getUpdates(): Promise<TestProjectUpdate[]> {
    return [];
  }

  /**
   * Verify the project after deployment.
   */
  // suppressing because subclass implementations can use backendId
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async assertPostDeployment(backendId: BackendIdentifier): Promise<void> {
    await this.assertClientConfigExists(
      this.projectDirPath,
      ClientConfigFormat.JSON,
    );

    await this.assertClientConfigWithExpectedTyping(
      this.projectDirPath,
      ClientConfigFormat.JSON,
    );
  }

  /**
   * Verify client config file is generated with the provided directory and format.
   */
  async assertClientConfigExists(dir?: string, format?: ClientConfigFormat) {
    const clientConfigStats = await fsp.stat(
      await getClientConfigPath(
        ClientConfigFileBaseName.DEFAULT,
        dir ?? this.projectDirPath,
        format,
      ),
    );

    assert.ok(clientConfigStats.isFile());
  }

  /**
   * Verify client config file is generated with the expected typing
   */
  async assertClientConfigWithExpectedTyping(
    dir?: string,
    format?: ClientConfigFormat,
  ) {
    const outputFile = await getClientConfigPath(
      ClientConfigFileBaseName.DEFAULT,
      dir ?? this.projectAmplifyDirPath,
      format,
    );
    const outputs = JSON.parse(await fsp.readFile(outputFile, 'utf-8'));

    const schema = JSON.parse(
      await fsp.readFile(
        './packages/client-config/src/client-config-schema/schema_v1.4.json',
        'utf-8',
      ),
    );

    const validator = new Validator();

    const validSchema = validator.validate(outputs, schema, {
      preValidateProperty: (object, key) => {
        const value = object[key];

        if (key === 'buckets') {
          for (const bucket of value) {
            // check if we have storage paths, if we do check that each path's properties match what we expect to see
            if ('paths' in bucket) {
              for (const path in bucket['paths']) {
                let resourceCounter = 0;
                let authCounter = 0;
                let guestCounter = 0;
                for (const k in object[path]) {
                  if (k === 'resource' && resourceCounter === 0) {
                    resourceCounter = 1;
                  } else if (k === 'authenticated' && authCounter === 0) {
                    authCounter = 1;
                  } else if (k === 'guest' && guestCounter === 0) {
                    guestCounter = 1;
                    // ensure that if we see groups and entity in a property, they appear at the front of the property name
                    // and ensure that the property name is longer than 'groups' or 'entity' (which is where the 6 comes from)
                  } else if (
                    (k.indexOf('groups') == 0 || k.indexOf('entity') == 0) &&
                    k.length > 6
                  ) {
                    continue;
                  } else {
                    assert.fail(`Unexpected key ${k} in ${path}`);
                  }
                }
              }
            }
          }
        }
      },
    });
    assert.ok(validSchema.valid);
  }

  /**
   * Verify deployed client outputs
   */
  async assertDeployedClientOutputs(backendId: BackendIdentifier) {
    const { BackendOutputClientFactory: npmBackendOutputClientFactory } =
      await import(
        pathToFileURL(
          path.join(
            this.projectDirPath,
            'node_modules',
            '@aws-amplify',
            'deployed-backend-client',
            'lib',
            'backend_output_client_factory.js',
          ),
        ).toString()
      );

    const currentCodebaseBackendOutputClient =
      CurrentCodebaseBackendOutputClientFactory.getInstance({
        getAmplifyClient: () => this.amplifyClient,
        getCloudFormationClient: () => this.cfnClient,
      });

    const npmBackendOutputClient = npmBackendOutputClientFactory.getInstance({
      getAmplifyClient: () => this.amplifyClient,
      getCloudFormationClient: () => this.cfnClient,
    });

    const currentCodebaseOutputs =
      await currentCodebaseBackendOutputClient.getOutput(backendId);
    const npmOutputs = await npmBackendOutputClient.getOutput(backendId);

    assert.ok(isMatch(currentCodebaseOutputs, npmOutputs));
  }

  /**
   * Resets the project to its initial state
   */
  async reset() {
    await fsp.rm(this.projectAmplifyDirPath, { recursive: true, force: true });
    await fsp.cp(this.sourceProjectAmplifyDirURL, this.projectAmplifyDirPath, {
      recursive: true,
    });
    await setupDirAsEsmModule(this.projectAmplifyDirPath);
  }
}
