import { AppSyncClient } from '@aws-sdk/client-appsync';
import {
  BackendOutputClientFactory,
  DeployedBackendIdentifier,
} from '@aws-amplify/deployed-backend-client';
import { graphqlOutputKey } from '@aws-amplify/backend-output-schemas';
import { AppsyncGraphqlGenerationResult } from './appsync_graphql_generation_result.js';
import { AppSyncIntrospectionSchemaFetcher } from './appsync_schema_fetcher.js';
import { AppSyncGraphqlDocumentGenerator } from './graphql_document_generator.js';
import { GraphqlDocumentGenerator } from './model_generator.js';
import { AWSClientProvider } from '@aws-amplify/plugin-types';
import { AmplifyClient } from '@aws-sdk/client-amplify';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { getBackendOutputWithErrorHandling } from './get_backend_output_with_error_handling.js';

export type GraphqlDocumentGeneratorFactoryParams = {
  backendIdentifier: DeployedBackendIdentifier;
  awsClientProvider: AWSClientProvider<{
    getAmplifyClient: AmplifyClient;
    getCloudFormationClient: CloudFormationClient;
  }>;
};

/**
 * Factory function to compose a model generator
 */
export const createGraphqlDocumentGenerator = ({
  backendIdentifier,
  awsClientProvider,
}: GraphqlDocumentGeneratorFactoryParams): GraphqlDocumentGenerator => {
  if (!backendIdentifier) {
    // eslint-disable-next-line @aws-amplify/amplify-backend-rules/prefer-amplify-errors
    throw new Error('`backendIdentifier` must be defined');
  }
  if (!awsClientProvider) {
    // eslint-disable-next-line @aws-amplify/amplify-backend-rules/prefer-amplify-errors
    throw new Error('`awsClientProvider` must be defined');
  }

  const fetchSchema = async () => {
    const backendOutputClient =
      BackendOutputClientFactory.getInstance(awsClientProvider);
    const output = await getBackendOutputWithErrorHandling(
      backendOutputClient,
      backendIdentifier,
    );
    const apiId = output[graphqlOutputKey]?.payload.awsAppsyncApiId;
    if (!apiId) {
      // eslint-disable-next-line @aws-amplify/amplify-backend-rules/prefer-amplify-errors
      throw new Error(`Unable to determine AppSync API ID.`);
    }

    return new AppSyncIntrospectionSchemaFetcher(new AppSyncClient()).fetch(
      apiId,
    );
  };
  return new AppSyncGraphqlDocumentGenerator(
    fetchSchema,
    (fileMap) => new AppsyncGraphqlGenerationResult(fileMap),
  );
};
