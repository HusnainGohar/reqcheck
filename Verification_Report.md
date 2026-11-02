# Verification report

Research verification was executed 1 November 2026 on Linux x86-64. Application verification was executed 2 November 2026 on Windows, first on the modern host and then using project-local Python 3.7.6, scikit-learn 0.22.2.post1, and MongoDB 4.2.3. Frontend compilation used Node 22.15.0/npm 10.9.2 with the historically pinned package lock.

- Vendor Miniconda installer checksum verified; actual interpreter Python 3.7.6.
- Full historical Python package set installed successfully; pip check reported no broken requirements.
- All 46 pinned package versions have pre-April-2020 availability evidence. Atomicwrites uses a maintainer-tag date rather than its later reupload timestamp.
- Synthetic binary and NFR smoke paths completed; synthetic scores excluded from the paper.
- Real benchmark experiments executed sequentially on CPU. Code and dataset hashes match archived manifests.
- binary: 10 model variants; 5 outer folds; 620 held-out predictions per variant; no project overlap; notebook predictions match the paper run.
- nfr: 10 model variants; 5 outer folds; 367 held-out predictions per variant; no project overlap; notebook predictions match the paper run.
- Notebook cells were executed locally, including historical installation, synthetic/real experiments, output inspection and archive creation. A missing optional IPython host dependency exposed during testing was handled with a display fallback; remaining cells completed. Hosted Google Colab was not remotely executed.
- Every notebook code cell compiles; repeat-run out-of-fold predictions match the manuscript's archived predictions byte-for-byte.
- Word paper (9 pages) and guide (12 pages) rendered and all pages visually inspected. No clipped content or split table rows found; table headers repeat across pages.

Not completed: independent external validation, annotation agreement study, reviewer usability study, publication submission, and production security hardening. The guide specifies these later research/deployment activities. Benchmark cleaning is disclosed as exploratory, and historical dataset byte identity is not independently established.

## Application implementation update

The core React + TypeScript/FastAPI application workflows are implemented: project/document management, TXT/DOCX/searchable-PDF extraction, provenance-aware requirement editing, splitting/merging/removal, real classification and NFR suggestions, duplicate and ambiguity findings, reviewer decisions, immutable analysis runs, chart/report exports, and confirmed cascading document deletion. Core regression tests use an in-memory repository; the separate integration test exercises actual MongoDB persistence and bundled models.

Verification on Windows:

- `.venv\Scripts\python.exe -m compileall -q backend\app backend\tests` passed.
- All **17 backend tests passed** under Python 3.7.6, including the opt-in real-model MongoDB integration test. Coverage includes CSV formula neutralization, HTML escaping, immutable source snapshots across repeated runs, review validation, model-version mismatch, oversized merge rejection, failed-merge rollback, and document deletion.
- The real integration test completed three analysis runs, checked classification/ambiguity/duplicate findings, preserved corrected review history across repository reconnection, rendered JSON/CSV/inline HTML and all four PNG charts, and verified cascading deletion. Its uniquely generated test database was removed; the demo database was not dropped.
- `npm ci`, `npm run build`, and `npm run vendor` completed; the frontend dependency tree is pinned to pre-cutoff releases in an npm v1 lockfile.
- The historical runtime now loads and smoke-predicts both trusted bundled model artifacts. `pip check` reported no broken requirements. The live API health response reports database and analysis ready.
- Browser checks on the real MongoDB-backed API completed real analysis, accept/dismiss/correct decisions, expandable three-event reviewer history, ambiguity correction, duplicate dismissal, chart URL refresh, and stale-run source isolation after editing and running analysis again. These are functional checks, not an independent usability study.
- An actual API process restart preserved seven active demo requirements, three analysis runs, five reviewer events, and the latest edited text; database/model health remained ready. Browser reload recovered the saved reviewer decisions.
- Printable HTML rendered directly in the browser with its stale-input warning, review notes, and embedded PNG. CSV/JSON links returned successful attachment responses with generated filenames. The embedded browser did not expose a popup event for `target="_blank"`, so HTML rendering was verified by direct navigation rather than claiming popup automation passed.
- Keyboard checks verified initial input focus, focus trapping, Escape dismissal, and restoration to the triggering control. Responsive checks at 390px and 1440px reported no horizontal overflow; all four navigation icons remained available. Reduced-motion styling reduced animation/transition durations to 0.01ms.
- Typography uses locally hosted JetBrains Mono for headings and buttons and Inter for body text and form fields, with both SIL Open Font Licenses retained. Dropdown arrows are inset 14px with 40px text padding, and the upload picker has 18px separation from the saved-document row. Current user-requested font assets are a disclosed presentation exception, not a historical library claim.
- Browser verification after the heading-font replacement confirmed JetBrains Mono and Inter loaded, headings/body used their intended families, and layouts at 390px and 1440px had no horizontal overflow.
- After extending JetBrains Mono to buttons, computed-style checks confirmed all buttons and button-style report links used it, while form fields retained Inter. Layouts at 390px and 1440px remained free of horizontal overflow.

## Local runtime provenance

- Python 3.7.6 was installed under `.tools\python37`, without changing system PATH, file associations, or system Python. The official installer had a valid Python Software Foundation Authenticode signature; SHA-256: `a66b5b9ca035e343f55ab2a94e363c4f0d8ab07f036c40a1c464a97840d1538c`.
- Portable MongoDB 4.2.3 was verified against the vendor SHA-256 sidecar; archive SHA-256: `4134be6f2fb566f78f9ba55e3d4378c33703483d3a6305fd963baae20635f72a`. It runs bound to `127.0.0.1`, using `storage\mongo`.
- The former in-memory demo's project, document, five edited requirements, and checksum-verified original upload were migrated to persistent storage before replacing the demo API. Additional benign demo statements exercise ambiguity and duplicate review.
- Python 3.7 compatibility fixes include explicit required defaults in Pydantic 1.4 `Field`, enum-based review decisions serialized as plain strings, and proper Starlette TestClient lifespan management. MongoDB fixes include relying on its automatic `_id` index and assigning distinct storage IDs to each run's requirement snapshots.

## Accounts, guests, autosave and empty-state update

The public Home, registration/login/logout, owner-isolated account projects, temporary guest sessions, requirement autosave and informative empty/loading/error states are now implemented. Account sessions use browser-session cookies and 24-hour server expiry; guest identities have absolute 24-hour lifetimes. Ownerless legacy demo records remain retained but inaccessible.

- **23 backend tests passed** in pinned Python 3.7.6 with actual MongoDB and bundled models enabled. This includes five authentication/ownership/cleanup tests and two real-stack integration tests, alongside the existing 16 core/analysis tests.
- Coverage checks generic credential errors, unique normalized emails, salted password hashing, cookie properties, CSRF including invalid non-ASCII tokens, Origin/CORS, per-IP attempt limits, account expiry without deleting saved work, and cross-owner denial across all nested read/update/export/delete surfaces.
- Guest tests verify acknowledgement, isolation, explicit end, expiry cleanup of files and nested records, and injected upload-deletion failures that preserve the cleanup identity for retry.
- The new MongoDB test resumes an account's session/projects/analysis/review events through a separate application/repository instance, then logs out and back in while retaining account data.
- Real browser checks verified registration, project/upload/analysis, project rename, saved reviewer decisions after logout/login, and saved edited text/session recovery after an actual API process restart.
- An injected autosave 503 preserved the editor draft; Retry save completed and cleared the error. A delayed save while typing newer text produced two saves; reload confirmed the newest text, not the earlier in-flight text.
- A separate 1.6-second document-version refresh delay verified follow-up autosave scheduling after newer typing during metadata refresh; both refreshes completed and reload retained the newest server-saved text.
- All four chart cards have loading/error/retry states. An injected quality-chart 503 displayed its error placeholder; Retry chart recovered the actual PNG.
- Guest browser checks verified acknowledgement gating, project/upload/real analysis, authenticated report GET, absence of guest local drafts, blocked guest-to-account transition until explicit end, and an isolated empty subsequent guest session.
- Populated workspace checks at 390px and 1440px had no horizontal overflow. The mobile header expands for session controls instead of retaining a fixed height. Reduced-motion animation duration was 0.01ms.
- Empty sections explain how to create a project, upload, add requirements, adjust search, run analysis, export and start reviewer history; pre-analysis charts are labelled illustrative, not fabricated output. NFR charts explicitly explain an empty suggestion distribution.

The previous 17-test section records the earlier core verification; it is not the current total. These are functional/regression checks, not an independent usability study or production security audit.

## React Router and account-menu update

- React Router DOM 5.1.2 now handles page navigation using HashRouter, Switch, Link and reusable public/private route guards. Separate Home, authentication, workspace, password-change and guest-end page components replace manual whole-page route conditionals. Hash URLs work with the existing static server; legacy Home hashes redirect, and unknown routes show a not-found page.
- **25 backend tests passed** with pinned Python, MongoDB and actual bundled models. New coverage verifies required signup name/confirmation, rejection of mismatches, current-password verification, CSRF, guest denial and revocation of other sessions after password changes. MongoDB integration verifies display-name persistence and successful login with the changed password.
- TypeScript 3.8.3 compilation and local runtime/license vendoring passed. Router transitive dependencies and typings were pinned to historical releases and deduplicated; newer auto-resolved typings were incompatible with the project compiler and were not retained.
- Browser verification confirmed unauthenticated private-route redirects, permitted destination recovery after login, authenticated users redirected away from signup/login, guest denial of the password route, and an explicit not-found page.
- Signup has Name, Email address, Password and Confirm password. A mismatch displayed an actionable error; matching signup persisted the display name. Password change displayed confirmation errors, completed successfully, survived reload, and allowed subsequent login with the new password.
- Private headers contain no Home link or project dropdown. The workspace project selector still switched between two projects and retained saved document edits. Visiting Change Password and returning to the workspace recovered the selected project/document and saved text.
- The rightmost user icon opens a click-operated popover with name or Guest, Change Password and Logout. Outside click and Escape closed it, Escape restored trigger focus, and guests saw a disabled password action with explanation. Guest Logout completed the explicit end/delete flow.
- Account-menu layout at 390px and 1440px had no horizontal overflow; the popover remained within the viewport. Unsaved edits disabled account actions and produced a router navigation confirmation. Retry save retained and saved the edited text.
- A 112-character unbroken project name also passed both viewport checks after bounding breadcrumb and workspace-summary text; the account popover stayed within the viewport.
- Route-unmount cleanup prevents late health/document responses from updating a discarded workspace.

The npm audit command reports two historical-helper advisories (one moderate, one high); see Version_Register.md for affected helpers, fixed literal route usage and the production caveat. No forced dependency upgrade or production-security claim was made.

## Editorial UI/UX refresh

The approved warm-white, navy and teal direction now covers Home, split-layout login/signup/guest entry, workspace navigation, project/document controls, requirement editors, analysis panels, empty/loading/error states, account popovers, dialogs, password changes, guest termination and the not-found page. Locally hosted JetBrains Mono headings/buttons and Inter body/form text are retained. The favicon and browser theme color match the refreshed interface.

- Design research used the installed UI/UX Pro Max accessibility/layout guidance and 21st.dev component metadata as references. Implementation is original React/CSS in the existing historical stack; no third-party component source, additional runtime dependency or external service is needed to render it.
- TypeScript compilation passed. Real browser checks exercised Home, registration mismatch, login destination guards, guest acknowledgement, workspace, password changes, end-guest and not-found routes.
- Show/hide controls preserved password values. Signup and password-change mismatches focused an error summary, marked confirmation invalid and linked back to the field. Matching registration and a real password change completed successfully.
- Real MongoDB-backed workflow checks created a guest project, uploaded a document, edited text twice, waited for autosave, reloaded and recovered the latest text. Analysis produced findings and all four charts loaded. An accepted finding retained its note and expandable event history. Printable HTML, CSV and JSON report links returned nonempty HTTP 200 responses with their expected content types.
- Home and populated workspace had no horizontal overflow at 375, 390, 768, 1024 and 1440px. Signup and password-change forms were checked at 375, 768, 1024 and 1440px, also without overflow. A long project name stayed within its layout.
- Keyboard Tab produced a visible focus outline. Escape closed the account popover and restored focus to its trigger. Scroll-aware navigation followed the analysis section. Reduced-motion emulation reduced computed animation/transition duration to 0.01ms.
- Sampled contrast ratios: white on primary teal 6.27:1; muted text on canvas 5.16:1; navy on white 13.90:1; warning text 6.24:1; error text 6.10:1; split-auth body copy 8.23:1. These checks are not a comprehensive accessibility certification or a user study.
- The temporary guest workspace was explicitly ended; its test project and analysis run were verified absent. The uniquely identified artificial registration account and its sessions were removed without changing legacy or unrelated records.

The backend was unchanged during this refresh; the earlier 25-test backend result remains the baseline, not a newly executed suite.

## Statement-level extraction and analysis correction

The three supplied PDFs were inspected locally. The test specification contains 96 explicitly identified requirements over eight pages. The supplied analysis report recorded only eight classifications, seven ambiguity cues and zero duplicate candidates. Reproducing the deployed extractor confirmed one requirement record per PDF page: multi-requirement pages, headers and section titles were incorrectly fed to a statement classifier.

The corrected extractor segments explicit IDs/lists and separate modal lines, joins PDF wrapping, removes detected repeated header/page furniture and retains source IDs, starting/ending pages, original statement line breaks and existing DOCX locations. It does not split arbitrary prose at every period. Inference and similarity exclude leading requirement IDs while ambiguity offsets remain relative to reviewed evidence. Exact repeats with different IDs now match; high-overlap candidates with differing numeric values/negation include warnings in the UI and exports. Undefined readiness triggers and hyphenated user-friendly wording are covered by versioned ambiguity rules.

Measured on the supplied input with unchanged trusted model artifacts:

| Measure | Previous page-level pipeline | Corrected statement pipeline |
|---|---:|---:|
| PDF pages | 8 | 8 |
| Extracted / classified records | 8 | 96 |
| Ambiguity cues | 7 | 8 |
| Lexical similarity candidates | 0 | 2 |

All IDs RQ-001 through RQ-096 appear exactly once in order, and all 96 normalized texts match an independent installed PDF reader's extraction without lost clauses. The corrected classifier suggests 73 F and 23 NFR labels; these counts are not an accuracy result. The exact RQ-013/RQ-085 repeat scores 1.0; the RQ-051/RQ-090 pair scores 0.837044 and explicitly warns about 10 MiB versus 20 MiB. RQ-093 now flags “when it is ready.” Direct real-model inference plus cues on 96 statements measured approximately 0.021 seconds on this machine, excluding extraction, HTTP, persistence and charts; this is not a load benchmark.

Known limitations remain: the registration paraphrase RQ-086 is not retrieved at the provisional lexical threshold, and the opposing guest-storage statements are not detected by a general contradiction engine. Some F/NFR and subtype suggestions remain questionable; no independently adjudicated label set was supplied, so no accuracy/F1 gain is claimed. Binary artifacts were trained on 620 deduplicated requirements; subtype artifacts on 367 NFR examples, with only one portability example. Neither weights nor training-feature definitions were changed or retrained on this test input. New runtime normalization/rules are recorded in the rule version; existing model manifests remain historical training records.

The full backend suite, explicitly enabling isolated MongoDB integration and real models, passed **39 tests**. Coverage includes 96-statement segmentation, wrapped/cross-page evidence, retained repeated continuation clauses, text/DOCX locations, normalized duplicate matching, exact ambiguity offsets, incomplete prediction rejection, constraint warnings and exports. Frontend strict build and 10 upload assertions passed. Existing documents/runs are not migrated: re-upload for corrected boundaries and analyze anew. Earlier run snapshots and decisions remain untouched.

Live verification created a separate “Corrected PDF analysis - 96 statements” project in the existing guest workspace and uploaded the supplied PDF without editing or deleting the earlier demo project/runs. The UI showed all 96 editors with source IDs/page references, the undefined-trigger label and numeric constraint warning. New run `953134a5-57d5-44fa-a415-189edb5c52ec` contains 96 frozen requirement snapshots and 106 findings under the v2 rule version. HTML/CSV/JSON exports each returned HTTP 200 and retained the numeric warning; the HTML report contains 106 evidence rows. The corrected report was left open for inspection. This guest project remains temporary and must be exported before the session ends/expires.

## Printable report editorial refresh

The HTML export now uses the application palette and embedded Inter/JetBrains Mono fonts, a branded print toolbar, section links, finding/review counts, decision badges, responsive evidence cards and structured provenance. Existing source text, identifiers, corrections/comments, stale warnings, model/rule versions and the embedded chart remain present. A4 landscape print styling preserves table headers and hides screen-only controls. CSV/JSON generation and ownership enforcement were unchanged during this presentation refresh.

Targeted report/export API validation passed 15 tests, including new renderer checks for embedded assets, escaped document/source/comment text, literal dollar signs, empty findings, stale revision notices and reviewed/pending counts. Live browser checks confirmed the supplied report loads after API restart, both embedded fonts load, all eight findings remain present, and desktop/mobile layouts avoid page-level overflow. Print-media emulation verified the toolbar is hidden and evidence returns to a table with repeating headers. Physical printer output and an independent accessibility audit were not performed.

## Reviewer history hover spacing

The history button's zero horizontal padding left its icon and label against the hover background edges. Restored 13px horizontal padding in all interaction states and versioned the base stylesheet URL. A temporary browser fixture using the real button classes verified identical 222.1px widths and 8px/13px padding before hover, on hover and on focus at 1440px and 375px; the button fit both viewports. The fixture was removed after testing. No application behavior changed.

## Consolidated document upload empty state

Replaced the duplicate no-documents box and file picker with one actionable upload area. It introduces the first document, exposes Browse files as the initial primary action, and includes format/size limits and extraction guidance. The upload action appears only after selection; saved documents retain their selector and the upload area changes to Add another document. No-project and loading states no longer show an unusable uploader.

Strict build and all 10 upload-state assertions passed. A real temporary guest project showed exactly one upload zone, no redundant empty box or premature Upload document button, and no horizontal overflow at 375, 768 and 1440px. Browser checks verified selection, removal with focus restoration, successful upload and the saved-document/Add another document state. The temporary guest workspace was explicitly ended after verification.

## Modular frontend, upload state and interactive workflow

- The user confirmed retaining the pre-April-2020 frontend baseline. React Query 1.0.36 (24 March 2020), Rollup 2.3.2 (31 March 2020), and optional fsevents 2.1.2 (9 November 2019) were checked against npm registry publication timestamps and pinned in the npm v1 lockfile. React 16.13.0 and TypeScript 3.8.3 remain unchanged.
- The previous global TSX implementation is now real import/export modules: bootstrap, pages, route composition/guards, auth context/session hook, shared UI/layout components, domain types, API transport/query/mutation modules, document upload, analysis history, workspace panels, autosave/navigation/dialog hooks and the Home workflow illustration.
- React Query performs fresh reads with in-flight deduplication and mutation execution. Mutations do not retry automatically; window-focus refetching is disabled. Requirement drafts are cloned away from server-response cache objects before local recovery. Cache scopes change with authentication identity and caches are cleared on login/logout/expiry. No Redux store was needed.
- Strict compilation, including unused-local/parameter checks, and Rollup bundling passed. `npm test` passed **10 upload-state assertions**, including pending-vs-saved/loading states, uppercase extensions, empty/unsupported files, the exact 10 MiB limit and one byte over the limit.
- Browser verification reproduced the supplied screenshot state. Selecting a file removed the no-saved-documents placeholder and displayed an explicit not-uploaded notice; Upload document became enabled. Remove rendered as a horizontal icon/label control measuring **100 x 44px**, cleared the pending file, disabled upload, restored the genuine empty state and focused Browse files.
- An injected upload HTTP 503 displayed its actual error and retained the pending file/notice without showing an empty-document message. Retrying uploaded successfully, showed the saved-document selector and removed the pending-file UI. Editing twice and reloading recovered the latest autosaved text.
- Real analysis loaded four charts; accepted and dismissed decisions appeared in expandable query-backed history. All three report formats returned nonempty HTTP 200 responses. Switching between populated and empty projects preserved the saved editor state.
- An injected autosave HTTP 503 produced a Retry save control, preserved typed text and made exactly one mutation attempt before explicit retry. Retry saved successfully. A real account password change succeeded; logging out and logging in with the changed password recovered the account's saved project/document/text.
- Home SVG autoplay advanced stages; selecting Export updated both illustration and explanatory copy and stopped autoplay. Reduced-motion emulation paused its SVG animation and exposed the disabled Reduced motion control. The illustration has named SVG title/description, native step buttons, pause/play, hover/focus pausing and hidden-tab handling.
- Settled Home layouts at 375, 390, 768, 1024 and 1440px and populated workspace layouts at 375, 768, 1024 and 1440px had no horizontal overflow. Mobile upload layout was visually inspected. New-project dialogs retained initial field focus, and unauthenticated password-route navigation still preserved its login destination.
- Explicit guest termination removed both artificial projects and their run; the artificial account project was deleted through the UI. Database checks confirmed test projects/documents/run were absent before removing the exact test account and its sessions. Cache inspection after logout showed no remaining queries.

- After the final health-service extraction, the build and all 10 assertions passed again. A fresh guest workspace reached API connected through the query-managed health read; keyboard activation of the SVG Export stage worked. The guest session was explicitly ended, normal motion restored, temporary browser interceptions removed, and an ordinary Home reload confirmed the final versioned JS/CSS assets.

The current npm audit reports three affected historical packages (one moderate, two high), now including Rollup; see Version_Register.md. These functional checks are not a production audit or independent usability/accessibility study. No backend code changed and the earlier 25-test backend baseline was not rerun for this frontend-only change.

**The requested local software workflows are implemented and verified; the complete academic/production lifecycle is not.** Independent external data, annotated duplicate-threshold validation, annotation agreement, consented usability evaluation, supervisor review, author/affiliation details, publication submission, and deployment hardening remain separate gates. No such outcomes are fabricated by these application tests.

## Calm, query-backed finding tabs

- Findings are keyed by identity, run, kind and page, with a 30-second freshness window. The immutable source snapshot uses a separate run-scoped cache rather than refetching on every tab/page change. Reviewer decisions update the current cached findings page.
- Loading no longer displays the previous type's count or cards. A static, stable-height scaffold replaces the collapsing spinner; settled content uses a 140ms opacity-only entrance. Errors have an explicit Retry findings action, not an empty-results message.
- Controlled browser latency verified zero previous-type cards while loading, a 575px loading panel, and no active-tab overwrite after releasing an older duplicate request while ambiguity was selected. Returning to cached classification immediately showed 50 cards with `aria-busy=false`. The tab bar's vertical shift measured 0px.
- An injected findings HTTP 503 showed inline retry with zero stale cards; retry recovered both duplicate candidates. There were no additional source-snapshot requests during subsequent tab and pagination checks.
- ArrowRight moved focus without activation; Enter activated the focused tab. Home/End focus navigation, one selected tab stop and tab/tabpanel label relationships passed. Classification page two contained 46 cards and reselecting Classification preserved page two.
- A browser-only mocked review response survived switching away and back through the query cache. Reloading confirmed the real server finding remained unchanged; no reviewer decision was written by this check.
- At 375, 768 and 1440px, populated tabs had no horizontal page overflow and tab targets were at least 44px tall. Reduced motion changed the content animation duration to 0.01ms. Temporary fetch overrides were removed and normal motion restored.
- Frontend strict compilation/bundling and all 10 existing upload-state assertions passed. No dependencies or backend behavior changed; these targeted browser checks are not an independent usability/accessibility study.
- Removed the tab strip's 3px bottom padding so tabs meet the divider directly. Live browser measurements at 375, 768 and 1440px confirmed a zero gap (within subpixel rounding) and no horizontal overflow.

## Independent collapsible workspace sections

- Added one reusable disclosure component to project/source documents, extracted-text review and analysis/reviewer decisions. Heading buttons expose `aria-expanded` and `aria-controls`; hidden content and header actions are excluded from keyboard/accessibility navigation without unmounting their state. All sections start expanded and can be closed independently.
- Sidebar destinations expand before scrolling and focus the destination heading, above the sticky-header clearance. The successful-upload path uses the same navigation handler to reveal text review. Collapsing does not stop autosave; global save errors and the workspace unsaved count remain available.
- Browser Enter/Space checks expanded and collapsed the sections. All three could be closed together. A typed, unsent add-requirement draft, requirement search, and selected ambiguity tab survived collapse/reopen. The temporary draft/search were cleared without creating a requirement or changing saved source text.
- On the 96-statement workspace, collapsing all three reduced measured page height from 56,054px to 1,156px. Sidebar text-review navigation reopened only its destination and focused its heading at approximately 133px from the viewport top.
- Expanded and collapsed layouts at 375, 768 and 1440px had no horizontal page overflow or clipped disclosure buttons; buttons were at least 44px tall and every controls reference resolved. Narrow-screen header actions wrap below the disclosure. Navigation was also checked with reduced motion enabled, then normal motion restored.
- Strict TypeScript compilation, Rollup bundling and all 10 existing upload-state assertions passed. No dependencies or backend changes were required. Expansion state resets on workspace reload.
