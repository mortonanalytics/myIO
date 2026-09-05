FROM ghcr.io/r-wasm/webr:v0.6.0

# R is already installed in this pinned image. Its unused rig apt repository
# has a stale signing key that prevents pak from installing Ubuntu dependencies.
RUN rm /etc/apt/sources.list.d/rig.list

# webR 0.6.0 currently ships pkgdepends 0.9.1, which is affected by
# r-lib/pkgdepends#462 and cannot resolve local package references. This is the
# upstream-provided patched commit referenced by r-wasm/rwasm#56. Remove this
# pin after the fix is included in a released pkgdepends version and WebR image.
RUN R -q -e 'pak::pak("r-lib/pkgdepends@fa3730e67dc3efe72949740079d50188b2ef79aa", lib = .Library)'
