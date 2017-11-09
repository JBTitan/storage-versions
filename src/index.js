import browser from 'webextension-polyfill';
import _ from 'lodash';

async function storageVersion(area = 'local') {
  const {storageVersion} = await browser.storage[area].get('storageVersion');
  return storageVersion;
}

async function getVersions(context, area) {
  return context(`./${area}/versions.json`).versions;
}

async function upgrade(context, area) {
  const versions = await getVersions(context, area);
  const fromVer = await storageVersion(area);
  const toVer = _.last(versions);

  if (fromVer === toVer) {
    return;
  }

  const migrationPath = _.slice(
    versions,
    _.indexOf(versions, fromVer) + 1,
    _.indexOf(versions, toVer) + 1
  );

  console.log(`Migrating storage (${area}): ${fromVer} => ${toVer}`);

  for (const revisionId of migrationPath) {
    const revision = context(`./${area}/${revisionId}.js`);
    console.log(
      `Applying revision (${area}): ${revision.revision} - ${revision.message}`
    );
    await revision.upgrade();
  }
}

async function reconcile({context, area = 'local'}) {
  return upgrade(context, area);
}

module.exports = {
  reconcile
};
