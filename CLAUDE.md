# myIO — Interactive D3.js Visualization Library for R

## Portfolio Context

- **Role:** OSS engineering infrastructure (part of the IONe + myIO
  stack) that de-risks Morton Analytics’ products (GroundPulse,
  TerraYield, IONe). Not a standalone product or GTM tool.
- **Target:** Data scientists working in R who need best-in-class
  interactive web visualizations. 36 chart types with composable
  statistical transforms.
- **Website presence:** Demo gallery + package docs live at
  morton-analytics.com/myio/ (reverse-proxied from droplet).
- **Related:** See
  `../morton-command-center/market-research/brand-strategy.md` for brand
  context

## Versioning & Compatibility

- myIO follows **strict semver**. Breaking changes are permitted only at
  major version bumps and should be minimized even then.
- All minor and patch releases (e.g., v1.2.0) **must** be fully backward
  compatible.
- Deprecations follow a **~2-year sunset**: introduce a deprecation
  warning in version N, remove no sooner than 2 years later at the next
  major version.
- See `docs/versioning-policy.md` for full policy details.
