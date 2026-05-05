# myIO — Interactive D3.js Visualization Library for R

## Commercial Context

- **Product name:** myIO
- **Target:** Data scientists needing interactive R visualizations; also
  serves as a demo asset on the Morton Analytics website
- **Website presence:** Demo gallery + package docs live at
  morton-analytics.com/myio/ (reverse-proxied from droplet). 17 chart
  types with interactive previews.
- **Market context:** Proof point for Morton’s “open-source analytics”
  positioning. Demonstrates the builder identity — we don’t just
  consult, we ship tools.
- **Related:** See
  `../morton-analytics-web/market-research/brand-strategy.md` for how
  myIO fits the content strategy

## Versioning & Compatibility

- myIO follows **strict semver**. Breaking changes are permitted only at
  major version bumps and should be minimized even then.
- All minor and patch releases (e.g., v1.2.0) **must** be fully backward
  compatible.
- Deprecations follow a **~2-year sunset**: introduce a deprecation
  warning in version N, remove no sooner than 2 years later at the next
  major version.
- See `docs/versioning-policy.md` for full policy details.
