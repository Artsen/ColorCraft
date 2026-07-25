# Screenshot review

Run the deterministic review workflow:

```powershell
cd frontend
corepack pnpm@9.15.9 review:screenshots
```

It creates 16 fixture-driven PNGs under `.tmp/ui-review`: empty Create in both themes, extraction progress, image and manual palettes, selected and modified states, four Review surfaces, Export, Library, two mobile surfaces, and an API error. Network-dependent extraction is mocked; analysis uses fixed palette data.

`.tmp` is intentionally ignored. Review those files locally for clipping, hierarchy, contrast, focus, error placement, and responsive behavior. Temporary test artifacts must not be linked from documentation.

When a screenshot is representative and stable, copy only that file to `docs/assets/screenshots`, give it a semantic name, and reference it from documentation. Curated images are reviewable product documentation; the complete temporary set is disposable diagnostic output.

The current curated set shows light Create, dark Review, dark Library, and mobile Create. Regenerate it only when a deliberate interface change makes the existing image inaccurate.
