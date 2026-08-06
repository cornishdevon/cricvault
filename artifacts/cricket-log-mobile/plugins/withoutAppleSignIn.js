// Removes the "Sign in with Apple" entitlement that @clerk/expo adds automatically.
// CricVault's mobile app uses email-code sign-in only, so the capability isn't needed
// and the App Store provisioning profile doesn't include it.
const { withEntitlementsPlist } = require("expo/config-plugins");

module.exports = function withoutAppleSignIn(config) {
  return withEntitlementsPlist(config, (mod) => {
    delete mod.modResults["com.apple.developer.applesignin"];
    return mod;
  });
};
