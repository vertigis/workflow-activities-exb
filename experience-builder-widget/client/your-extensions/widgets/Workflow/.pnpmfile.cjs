// Replaces the workspace "overrides" that used to live in pnpm-workspace.yaml. ExB's
// pnpm-bootstrap-extensions.js installs widgets with --ignore-workspace, which drops workspace
// overrides and makes the frozen install fail with ERR_PNPM_LOCKFILE_CONFIG_MISMATCH.
// A .pnpmfile.cjs next to package.json is still honoured in that mode.
const pins = {
  // ExB requires widgets to run against its single host react/emotion instances rather than copies.
  '@arcgis/core': 'link:../../../node_modules/@arcgis/core',
  '@emotion/react': 'link:../../../node_modules/@emotion/react',
  '@emotion/serialize': 'link:../../../node_modules/@emotion/serialize',
  '@emotion/styled': 'link:../../../node_modules/@emotion/styled',
  react: 'link:../../../node_modules/react',
  'react-dom': 'link:../../../node_modules/react-dom',
  // ExB forbids dependencies that resolve to external URLs, so xlsx comes from a vendored tarball.
  xlsx: 'file:vendor/xlsx-0.20.3.tgz'
}

function readPackage(pkg) {
  for (const field of ['dependencies', 'optionalDependencies']) {
    for (const name of Object.keys(pkg[field] || {})) {
      if (pins[name]) {
        pkg[field][name] = pins[name]
      }
    }
  }
  return pkg
}

module.exports = { hooks: { readPackage } }
