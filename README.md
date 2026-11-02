# ReqCheck: FYP implementation and research package

ReqCheck is a local, human-in-the-loop workspace for reviewing software requirements. It combines source-document extraction, requirement editing, explainable classification and quality-review cues, persistent reviewer decisions, immutable analysis runs, and evidence-linked reports. The browser application is written in **React + TypeScript**; the API uses FastAPI and MongoDB.

The application targets the historical, pre-1-April-2020 project stack documented in [Version_Register.md](./Version_Register.md). The compiled React bundle and UMD runtime files are included, so the browser page can be served without rebuilding the frontend. The application is a localhost/private academic prototype, not a production-secured service.

## What is implemented

- Public Home page with workflow illustrations, accessible animations, Start Reviewing, and Continue as Guest.
- A consistent editorial interface across public pages, authentication, workspace, account controls and dialogs: warm white surfaces, navy text and teal actions, responsive layouts, contextual empty states, visible keyboard focus and reduced-motion support. Password fields include accessible show/hide controls and confirmation errors link to the affected field.
- Registration with name, unique email, password and matching confirmation; login/logout, authenticated password changes, securely salted password hashes, and owner-isolated saved projects. Existing ownerless demo records are retained but inaccessible; they are not assigned to new accounts.
- Isolated 24-hour guest workspaces with explicit temporary-work acknowledgement, active-session exports, and deletion on explicit end or server expiry.
- Debounced requirement autosave with saving/saved/failure states, retry, revision-conflict comparison, and account-scoped browser draft recovery. Empty, loading and error states explain the next action instead of displaying fabricated results.
- Create/select projects; upload bounded UTF-8 TXT, DOCX and searchable PDF files; inspect source locations and repair extracted text.
- Edit, add, split, merge and soft-delete requirement statements while preserving provenance and revision checks.
- Run analysis when the bundled models can be loaded by their exact pinned scikit-learn version. The API fails explicitly if the runtime or artifact hash is incompatible.
- Review suggested functional/non-functional labels and NFR subtypes, lexical duplicate candidates, and ambiguity cues; accept, dismiss, or correct findings.
- Preserve immutable analysis runs, source-input snapshots, expandable reviewer-event history, stale-run status, and paginated findings. Historical findings display the source text from their own run.
- Generate classification, NFR subtype, quality-cue and reviewer-decision charts and traceable JSON, CSV, and printable HTML reports. Confirmed document deletion cascades through associated records and stored files.
- Use locally hosted JetBrains Mono for headings and buttons (including button-style report links), and Inter for body text and form fields, SVG icons, subtle interaction/loading animations, reduced-motion preferences, and keyboard-accessible confirmation dialogs with focus trapping and restoration. Both fonts' SIL Open Font Licenses are retained in `frontend/vendor/`.

The duplicate threshold is provisional, and quality cues are not proof of defects. Model suggestions are decision support, not probabilities or ground-truth labels. Automatic contradiction detection, rewriting, OCR, multilingual analysis, deployment hardening, independent external validation, and usability evaluation are not implemented.

The presentation layer uses `frontend/styles.css` for the established component structure and `frontend/editorial.css` for the cohesive theme and responsive refinements. Both are loaded locally; no component framework or external design service is required at runtime. Workspace navigation highlights the section currently being reviewed, while project selection stays inside the document workspace rather than the header.

Project/source documents, extracted-text review and analysis/reviewer decisions can be independently expanded or collapsed using their heading buttons (Enter or Space). All start expanded; closing one does not close the others, unmount editors, discard drafts or stop autosave. Collapsed headings retain context, including statement and unsaved-edit counts. Sidebar navigation opens and focuses its destination; successful uploads also open text review. Expansion choices apply while the workspace remains mounted and reset on reload.

### Frontend structure and state

The frontend uses real TypeScript imports/exports rather than one global TSX file:

```text
frontend/src/
  app.tsx                    Bootstrap and providers only
  api/                       Fetch transport, React Query reads/mutations, health
  auth/                      Authentication context and session lifecycle hook
  routes/                    Route composition, public/private guards, route focus
  pages/                     Home, login/signup/guest, workspace, password, guest end
  components/ui/             Reusable icons, password fields, empty states, charts
  components/layout/         Shared public/private layouts and account menu
  features/documents/        File selection, validation and upload component
  features/workspace/        Workspace panels and editor orchestration/autosave hooks
  features/analysis/         Cached findings, finding cards and review history
  features/home/             Interactive animated workflow SVG
  hooks/                     Shared motion, section navigation and dialog-focus hooks
  types/                     Domain types and historical-library declarations
  utils/                     Source-location and section-navigation helpers
```

React Query **1.0.36** manages API query caching/in-flight deduplication and mutation execution. Read refreshes explicitly request fresh data, errors propagate to the UI, writes do not retry automatically, and window-focus refetching is disabled so it cannot overwrite editing. Cache keys are session-scoped and caches are cleared on identity changes/logout. Editable requirement drafts remain separate from server responses; authentication uses context and local interactions use component state/hooks. Redux is intentionally unnecessary for the current sharing requirements.

Analysis tabs cache findings by run, type and page for 30 seconds; each run's immutable source snapshot is cached separately. Delayed responses cannot replace another tab's results. Initial loads use a stable-height placeholder without showing the previous tab's count, and failures expose Retry findings. Switching types starts at page one; reselecting the active tab preserves its page. Arrow, Home and End keys move tab focus; Enter or Space activates the focused tab. The short opacity transition respects reduced-motion preferences.

An empty project presents one actionable upload area, not separate empty-state and picker boxes: **Add your first document**, a primary Browse files button, supported formats/size, and extraction guidance. Saved projects show **Add another document** alongside the saved-document selector. The uploader appears only after a project is selected and its documents finish loading. Selecting a file shows **Document selected - not uploaded yet** and reveals the Upload document action. Remove clears only the pending file, restores focus to Browse files, and never deletes saved documents. Failed uploads retain the selected file for retry.

The Home workflow SVG lets visitors select Upload, Review, Analyze and Export. Automatic progression has a pause control, pauses on hover/focus or when the tab is hidden, and is disabled by reduced-motion preferences. All stages remain manually accessible.

The printable HTML report follows the same warm-white, navy and teal styling, with embedded Inter/JetBrains Mono fonts and chart imagery so downloaded HTML needs no CDN or live asset requests. It includes a review-status summary, section links, source provenance and responsive finding cards on narrower screens. Print / Save PDF opens the browser print dialog; A4 landscape print styles retain the full evidence table and hide screen-only navigation. The report renderer uses `backend/app/report.html`; restart the API after changing this cached template. CSV and JSON exports are unchanged.

## Research package

**Research_Paper_Draft.docx** is an exploratory empirical manuscript; its Markdown source is [Research_Paper.md](./Research_Paper.md). Author/affiliation and venue-specific details remain to be completed. No paper has been submitted, and no independent external-validation or application-usability study has been performed.

On 620 retained statements from 15 source projects, word-plus-surface SVM achieved binary mean outer-fold macro-F1 0.7194 versus 0.6144 for word-only SVM. The highest observed NFR-subtype mean was 0.4752 for word-plus-character SVM. These are exploratory grouped-validation results, not independent external-validation or statistical-significance claims.

**ReqCheck_Research_2020.ipynb** is a self-contained CPU notebook. In Colab, upload it, select a CPU runtime, and run cells in order. It provisions an isolated Python 3.7.6 environment; do not install the historical pins into the host Python. Hosting is contemporary; the project libraries and methods are historical.

`research/` contains the experiment pipeline, grouped evaluation, ARFF conversion, and optional external evaluation. `data/` contains the mirrored PROMISE artifact, cleaned CSV, exclusions, templates, provenance, and CC BY-SA 3.0 notices. `benchmark_results/` contains benchmark outputs and fitted model artifacts. `examples/frontend.html` is an earlier minimal upload example, not the current application.

Preserve `DATA_LICENSE.md` and the original dataset notices when redistributing data or derived data. Load joblib artifacts only from trusted sources.

## Run locally

The configured Windows workspace has project-local Python 3.7.6 in `.tools\python37`, an isolated `.venv`, and portable MongoDB 4.2.3. System Python is unchanged. Start these services from the workspace root in separate terminals; do not start another copy if they are already running:

```powershell
New-Item -ItemType Directory -Force .\storage\mongo | Out-Null
& .\.tools\mongodb42\mongodb-win32-x86_64-2012plus-4.2.3\bin\mongod.exe --dbpath .\storage\mongo --bind_ip 127.0.0.1 --port 27017
```

```powershell
$env:PYTHONNOUSERSITE = '1'
& .\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

```powershell
& .\.venv\Scripts\python.exe -m http.server 3000 --bind 127.0.0.1 --directory frontend
```

On another machine, install the exact versions in [Version_Register.md](./Version_Register.md), create `.venv` using Python 3.7.6, and install both `config\requirements-bootstrap-2020.txt` and `config\requirements-2020.txt`. The ignored `.tools` runtimes are local installations, not redistributable project dependencies.

Open `http://127.0.0.1:3000`. To rebuild the frontend with the pinned Node/npm toolchain, run `npm ci`, `npm run build`, and (if refreshing the local UMD copies) `npm run vendor` in `frontend/`. TypeScript compiles modules into ignored `.build/`; pinned Rollup 2.3.2 bundles them into `app.js`. React, ReactDOM, Router and React Query are local UMD runtimes with retained licenses. Run `npm test` for the dependency-free upload-state regression assertions.

The API limits uploads to 10 MiB, 100 PDF pages, and 500 extracted statements. Extraction separates explicitly identified requirements (for example `RQ-001`), numbered/bulleted lists and separate modal requirement lines; it joins wrapped statement lines and removes detected repeated PDF header lines/page numbers. Ambiguous prose remains reviewable rather than being split at every period. Original statement formatting is retained in `source_text`, while source IDs, page ranges and DOCX paragraph/table references remain in location metadata. Preview the extraction: unusual layouts and unnumbered prose still need human correction.

Classifier and duplicate inputs exclude leading document requirement IDs and normalize whitespace; persisted evidence and ambiguity offsets use the original reviewed text. Exact repeats with different IDs can therefore match. Similarity candidates with differing numbers or negation have explicit constraint warnings in the UI and HTML/CSV/JSON exports. These are warnings on lexical candidates, not general contradiction detection or semantic paraphrase matching. Ambiguity rules include hyphenated user-friendly wording and undefined readiness triggers.

Original files are stored under `storage/uploads/`; MongoDB holds project/document metadata, requirement records, immutable run snapshots, findings, and reviewer events. `/health` distinguishes database readiness from model-analysis availability. If the required historical Python/scikit-learn environment is unavailable, project and text-review workflows remain available, while analysis reports its runtime mismatch rather than substituting an incompatible model.

**Existing documents/runs are not silently migrated.** Re-upload a document to apply new extraction boundaries, then start a new analysis. Existing immutable reports retain their original snapshots and rule versions. The current model artifacts remain unchanged: binary training used 620 deduplicated requirements, and subtype training used 367 NFR requirements with very uneven class support. Better segmentation does not establish label accuracy; improving classification requires an agreed F/NFR labeling rubric and independently annotated domain examples, followed by project-grouped validation. Do not retrain on guessed labels from a test specification or claim an accuracy gain from finding counts.

## Accounts, guests and saving

Start at the public Home page. Create an account with a name, unique email, 12-128-character password and matching password confirmation to keep projects, documents, review events and analysis runs. Passwords use PBKDF2-HMAC-SHA256 with 600,000 iterations and random salts. Session tokens are opaque; MongoDB stores only their hashes. Account login uses an HttpOnly, SameSite=strict browser-session cookie with a fixed 24-hour server expiry. Logout/expiry removes the session, not saved account work.

Continue as Guest requires acknowledgement before creating an isolated temporary identity. Guests can use the same review/analysis/export workflow, but cannot retrieve work after ending or expiring the session. Explicit end deletes uploads and all associated records. Abandoned sessions are cleaned after their absolute 24-hour expiry, checked every 60 seconds while the API runs, and on API startup. Cleanup failures are logged and retried without losing the guest identity. Browser closure is not a reliable server notification; restored session cookies may resume an unexpired guest session. End the session explicitly for immediate deletion. Download reports before switching a guest to an account; guest work is not transferred.

Requirement text autosaves 700 ms after typing pauses. Saving, Saved, and Save failed states are visible. Failed saves keep the editor text and expose retry; revision conflicts can be compared with the saved version. Newer edits typed during a request are retained and saved next. Account-only unsaved drafts are kept in owner-scoped browser storage and recovered after login/reload; guest drafts are not stored there. Browser drafts contain document text: avoid shared browser profiles, and keep the page open until Saved. Confirmed discards and deletion remove corresponding drafts.

The backend enforces project ownership for nested document, requirement, analysis, review, chart, export and deletion routes. Another owner's or an ownerless legacy resource returns 404. Missing/expired sessions return 401. `GET /auth/session` is public and returns the active session's CSRF token; POST/PATCH/DELETE requests with a session must send `X-CSRF-Token`. Auth mutations require JSON. CORS permits the two local frontend origins with credentials; use the same hostname for frontend and API. Registration/login/guest starts are limited to 10 attempts per minute per client IP per API process.

The rightmost user icon opens a click-operated account popover (also keyboard/touch accessible). It shows the account name or Guest, Change Password and Logout. Guests cannot change a password; their Logout action opens the explicit temporary-work deletion confirmation. Password changes require the current password, a different new password and matching confirmation; other sessions are revoked, while the current session and saved work remain. Existing accounts without a stored name use their email's local part as the display name.

React Router DOM 5.1.2 provides a HashRouter, Switch, Link navigation and reusable PublicRoute/PrivateRoute guards. Hash URLs keep deep links and refresh working with the existing static HTTP server; no server rewrite or manual hashchange navigation is required. Routes are `#/` (Home), `#/login`, `#/register`, `#/guest`, `#/workspace`, `#/account/password` and `#/end-guest`. Home is public; authentication pages are anonymous-only; workspace/guest end require an active identity; password changes require an account. Guests visiting account-only pages return to the workspace without discarding work. Unauthenticated private visits redirect to login and preserve a permitted destination in the query string. Unknown URLs show a not-found page; old `#home` links normalize and redirect to Home. Backend ownership/session checks remain authoritative.

Header Home links and the header project dropdown are removed. Project selection remains in the workspace's Project & source document section because accounts may manage several projects. Account popovers close on outside click, Escape or focus leaving; Escape restores trigger focus. Unsaved workspace navigation uses a router prompt, and account actions are disabled until saves complete.

For an HTTPS deployment, set `REQCHECK_SECURE_COOKIE=1` and configure trusted origins deliberately; do not expose the localhost configuration directly. Authentication does not establish production security. HTTPS deployment, multi-worker/distributed rate limiting, operational backup/recovery, email verification, password reset and an independent security assessment remain outside this local implementation.

## Verification

Run backend workflow and analysis tests from the repository root:

```powershell
$env:PYTHONNOUSERSITE = '1'
& .\.venv\Scripts\python.exe -m unittest backend.tests.test_auth_api backend.tests.test_upload_api backend.tests.test_analysis -v
```

With the local MongoDB server running, explicitly enable the real-model integration test:

```powershell
$env:PYTHONNOUSERSITE = '1'
$env:REQCHECK_MONGO_TEST_URI = 'mongodb://127.0.0.1:27017'
& .\.venv\Scripts\python.exe -m unittest backend.tests.test_mongo_integration -v
```

Build the TypeScript frontend:

```powershell
Set-Location frontend
npm run build
```

Core API tests use an in-memory repository and temporary file storage. The opt-in integration test uses the actual bundled models and a uniquely named temporary MongoDB database; it checks repeated runs, immutable snapshots, reviews, exports, charts, reconnection, and cascading deletion, and removes only its own test database. These checks do not establish production security or replace human research evaluation. See [Verification_Report.md](./Verification_Report.md) for the recorded verification outcomes and remaining gates.
