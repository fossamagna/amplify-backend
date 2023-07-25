import { describe, it } from 'node:test';
import { getProjectEnvironmentMainStackSSMParameterKey } from './get_project_environment_main_stack_ssm_parameter_key.js';
import assert from 'node:assert';
import { readFileSync } from 'fs';

/**
 * !!!CAUTION!!!
 *
 * You probably shouldn't be changing this naming scheme.
 * This represents the glue between how the backend main stack is created and later identified
 */
describe('getProjectEnvironmentMainStackSSMParameterKey', () => {
  it('returns ssm key', () => {
    const result = getProjectEnvironmentMainStackSSMParameterKey({
      projectName: 'testProject',
      environmentName: 'testEnvironment',
    });

    const expectedKey = readFileSync(
      new URL(
        '../../../../shared-test-assets/expected_main_stack_ssm_parameter_key.txt',
        import.meta.url
      ),
      'utf-8'
    ).trim();

    assert.equal(result, expectedKey);
  });
});