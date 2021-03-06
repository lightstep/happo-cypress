const assert = require('assert');
const resolveEnvironment = require('../src/resolveEnvironment');

function testDevEnv() {
  const result = resolveEnvironment({});
  assert.equal(result.beforeSha, undefined);
  assert.ok(/^dev-[a-z0-9]+$/.test(result.afterSha));
  assert.equal(result.link, undefined);
  assert.equal(result.message, undefined);
}

function testCircleCIEnv() {
  const circleEnv = {
    CI_PULL_REQUEST: 'https://ghe.com/foo/bar/pull/12',
    CIRCLE_PROJECT_USERNAME: 'happo',
    CIRCLE_PROJECT_REPONAME: 'happo-view',
    CIRCLE_SHA1: 'abcdef',
  };
  let result = resolveEnvironment(circleEnv);
  assert.equal(result.beforeSha, undefined);
  assert.equal(result.afterSha, 'abcdef');
  assert.equal(result.link, 'https://ghe.com/foo/bar/pull/12');
  assert.ok(result.message !== undefined);

  // Try with a real commit sha in the repo
  result = resolveEnvironment({
    ...circleEnv,
    CIRCLE_SHA1: '4521c1411c5c0ad19fd72fa31b12363ab54d5eab',
  });

  assert.equal(result.beforeSha, '62aa0e29b68d0d2e812ad21064b22bf627400ab8');
  assert.equal(result.afterSha, '4521c1411c5c0ad19fd72fa31b12363ab54d5eab');
  assert.equal(result.link, 'https://ghe.com/foo/bar/pull/12');
  assert.ok(result.message !== undefined);

  // Try with a non-pr env
  result = resolveEnvironment({
    ...circleEnv,
    CI_PULL_REQUEST: undefined,
  });

  assert.equal(result.beforeSha, undefined);
  assert.equal(result.afterSha, 'abcdef');
  assert.equal(result.link, 'https://github.com/happo/happo-view/commit/abcdef');
  assert.ok(result.message !== undefined);
}

function testTravisEnv() {
  const travisEnv = {
    HAPPO_GITHUB_BASE: 'http://git.hub',
    TRAVIS_REPO_SLUG: 'owner/repo',
    TRAVIS_PULL_REQUEST: 12,
    TRAVIS_PULL_REQUEST_SHA: 'abcdef',
    TRAVIS_COMMIT_RANGE: 'ttvvb...abcdef',
    TRAVIS_COMMIT: 'xyz',
  };

  let result = resolveEnvironment(travisEnv);
  assert.equal(result.beforeSha, 'ttvvb');
  assert.equal(result.afterSha, 'abcdef');
  assert.equal(result.link, 'http://git.hub/owner/repo/pull/12');
  assert.ok(result.message !== undefined);

  // Try with a real commit sha in the repo
  result = resolveEnvironment({
    ...travisEnv,
    TRAVIS_PULL_REQUEST_SHA: undefined,
    TRAVIS_PULL_REQUEST: undefined,
    TRAVIS_COMMIT_RANGE: undefined,
    TRAVIS_COMMIT: '4521c1411c5c0ad19fd72fa31b12363ab54d5eab',
  });

  assert.equal(result.beforeSha, '62aa0e29b68d0d2e812ad21064b22bf627400ab8');
  assert.equal(result.afterSha, '4521c1411c5c0ad19fd72fa31b12363ab54d5eab');
  assert.equal(
    result.link,
    'http://git.hub/owner/repo/commit/4521c1411c5c0ad19fd72fa31b12363ab54d5eab',
  );
  assert.ok(result.message !== undefined);
}

function testHappoEnv() {
  const happoEnv = {
    HAPPO_CURRENT_SHA: 'bdac2595db20ad2a6bf335b59510aa771125526a',
    HAPPO_PREVIOUS_SHA: 'hhhggg',
    HAPPO_CHANGE_URL: 'link://link',
  };

  let result = resolveEnvironment(happoEnv);
  assert.equal(result.beforeSha, 'hhhggg');
  assert.equal(result.afterSha, 'bdac2595db20ad2a6bf335b59510aa771125526a');
  assert.equal(result.link, 'link://link');
  assert.ok(result.message !== undefined);

  // Try with legacy overrides
  result = resolveEnvironment({
    CURRENT_SHA: 'foobar',
    PREVIOUS_SHA: 'barfo',
    CHANGE_URL: 'url://link',
  });

  assert.equal(result.beforeSha, 'barfo');
  assert.equal(result.afterSha, 'foobar');
  assert.equal(result.link, 'url://link');
  assert.ok(result.message !== undefined);

  // Try overriding base branch
  result = resolveEnvironment({
    ...happoEnv,
    HAPPO_BASE_BRANCH: 'non-existing',
    HAPPO_PREVIOUS_SHA: undefined,
  });

  assert.ok(result.beforeSha === undefined);
  assert.equal(result.afterSha, 'bdac2595db20ad2a6bf335b59510aa771125526a');
  assert.equal(result.link, 'link://link');
  assert.ok(result.message !== undefined);
}

function runTest() {
  testDevEnv();
  testCircleCIEnv();
  testTravisEnv();
  testHappoEnv();
}
runTest();
console.log('All tests passed');
