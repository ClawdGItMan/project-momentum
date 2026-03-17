const {
  withEntitlementsPlist,
  withInfoPlist,
} = require('expo/config-plugins');

const SHARE_USAGE =
  'Project Momentum uses Apple Health to bring workouts, sleep, steps, and active energy into your accountability flow.';

function withHealthKit(config) {
  config = withInfoPlist(config, (mod) => {
    mod.modResults.NSHealthShareUsageDescription =
      mod.modResults.NSHealthShareUsageDescription || SHARE_USAGE;
    delete mod.modResults.NSHealthUpdateUsageDescription;
    return mod;
  });

  config = withEntitlementsPlist(config, (mod) => {
    mod.modResults['com.apple.developer.healthkit'] = true;
    return mod;
  });

  return config;
}

module.exports = withHealthKit;
