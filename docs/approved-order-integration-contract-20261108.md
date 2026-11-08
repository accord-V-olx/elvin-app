# Approved-order snapshot integration contract (2026-11-08)

Status: **design/checklist only**. No persistence, browser wiring, or authenticated approval is implemented by this document.

## Safe integration boundary

1. Wardrobe Engine produces an order with exact `orderName`, dimensions in millimetres, materials, construction, and image storage IDs (not base64 data).
2. Unresolved factory choices remain explicit questions. In particular: missing plinth type; groove offset for HDF-in-groove; back panel installation; unspecified shelf depth. Do not invent defaults.
3. Before calling `createApprovedOrderSnapshot(order)`, require Engine `status === 'READY'`, `ok === true`, `missing: []`, and `geometryCheck: {ok: true, errors: []}`. The snapshot helper independently rejects missing evidence.
4. Only an authenticated server endpoint may attach the verified technologist identity and approval timestamp. Never trust `review.approvedBy` supplied directly by the browser.
5. A successful snapshot is **not** production authorization: `productionReady` stays `false`. Store snapshots only in an access-controlled store with versioning and an audit trail; this repository module currently does not store anything.
6. 3D and BAZIS must consume the same approved order parts rather than regenerating geometry independently. Keep those integrations separate and test-only until validated.

## Manual acceptance scenarios (not yet executed)

- Two photos of one wardrobe: both image IDs survive into the snapshot, but no raw image data or arbitrary top-level upload fields do.
- HDF in groove without groove offset: an unresolved question blocks approval.
- Plinth absent from drawing: ask the technologist instead of assuming 100 mm.
- Engine returns `geometryCheck.ok: false` with an empty errors list: snapshot must be rejected.
- Browser forges `approvedBy`: future authenticated endpoint must ignore it and use server identity.
- Approved analysis is loaded twice: previously confirmed decisions should be reused only when their semantic field and rules version still match; dimension questions must not be suppressed by construction answers.
- Confirm that parts sent to 3D and BAZIS have matching IDs, sizes, axes (X width, Y height, Z depth), and material assignments.

## Release gates

- Run `node --test` for the snapshot test files and the repository's full supported test command.
- Exercise at least one real wardrobe drawing with a technologist; record actual vs expected results.
- Validate persistence, authorization, audit trail, and browser integration separately.
- No merge to `main` and no production deployment without explicit approval.
