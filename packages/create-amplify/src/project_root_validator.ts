import { existsSync } from 'fs';
import * as path from 'path';

const amplifyLearnMoreUrl = 'https://docs.amplify.aws/gen2/how-amplify-works/';

/**
 * ProjectRootValidator is responsible for validating that the given projectRoot path is a valid target for a new Amplify project
 */
export class ProjectRootValidator {
  /**
   * Validates that the given projectRoot path is a valid target for a new Amplify project
   */
  constructor(
    private readonly projectRoot: string,
    private readonly exists = existsSync,
  ) {}

  /**
   * Throws if a file or directory named 'amplify' already exists in the projectRoot
   * No-op if it doesn't exist
   */
  validate = async (): Promise<void> => {
    const testPath = path.resolve(this.projectRoot, 'amplify');
    if (this.exists(testPath)) {
      // eslint-disable-next-line @aws-amplify/amplify-backend-rules/prefer-amplify-errors
      throw new Error(
        `An amplify directory already exists at ${testPath}. If you are trying to run an Amplify Gen 2 command inside an Amplify Gen 1 project we recommend creating the project in another directory. Learn more about AWS Amplify Gen 2: ${amplifyLearnMoreUrl}`,
      );
    }
  };
}
