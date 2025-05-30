import { afterEach, describe, test } from 'node:test';
import assert from 'node:assert';
import url from 'node:url';

void describe('getUrl', () => {
  afterEach(() => {
    delete process.env.AMPLIFY_BACKEND_TELEMETRY_TRACKING_ENDPOINT;
    delete require.cache[require.resolve('./get_telemetry_url')];
  });
  void test('that prod URL is returned when the env for beta URL is not set', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const { getUrl } = require('./get_telemetry_url');
    assert.equal(
      url.format(getUrl()),
      'https://telemetry.cli.amplify.aws/metrics',
    );
  });

  void test('that BETA URL is returned when the env for beta URL is set', () => {
    process.env.AMPLIFY_BACKEND_TELEMETRY_TRACKING_ENDPOINT =
      'https://aws.amazon.com/amplify/';
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const { getUrl } = require('./get_telemetry_url');
    assert.equal(url.format(getUrl()), 'https://aws.amazon.com/amplify/');
  });
});
