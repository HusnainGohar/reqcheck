# ReqCheck: complete implementation guide
## A two-semester, 6-credit BSSE FYP and accompanying empirical study

**Technology and literature cutoff: strictly before 1 April 2020.**
**Selected application stack: React + FastAPI + MongoDB + Matplotlib.**
**Input: English TXT, DOCX and text-based PDF. CPU execution; no GPU/TPU required.**

## 1. What you will deliver

Build a browser-based decision support application that imports a software requirements document, lets the user correct extracted statements, predicts requirement types, highlights possible duplicates and vague wording, records reviewer decisions, and produces an evidence-linked report. Separately, execute a reproducible experiment on requirements classification and write the results into the accompanying manuscript.

The package supplies the implementation specification, implemented local application, experiment code, pinned Python requirements, annotation templates and a Colab notebook. The core application is verified with bundled models and MongoDB; it is not a production-secured service. The research manuscript includes measured exploratory results from the bundled, documented PROMISE benchmark. It remains a manuscript draft for supervisor review; external validation and application usability evaluation have not been performed.

### Scope and boundaries

Core: project creation; TXT/DOCX/text-PDF upload; extraction preview/edit; functional/non-functional classification; optional NFR subcategory suggestions; duplicate candidates; ambiguity rules; review decisions; immutable analysis runs; charts; CSV/JSON exports and a printable HTML report. A browser can print the HTML report as PDF; PDF report generation is separate from PDF input support.

Excluded from the core: automatic semantic contradiction detection, automatic rewriting, scanned-PDF OCR, multilingual NLP, live model retraining and generative chat. Classical TF-IDF duplicate detection measures lexical overlap, not full semantic equivalence. Mixed FR/NFR statements and vague requirements remain reviewer decisions.

Acceptance: a reviewer can upload each supported format, repair extraction, analyze a document, inspect evidence, override suggestions, refresh the browser and recover their decisions, and export a traceable report. Unsupported or empty documents return a useful error rather than fabricated findings.

## 2. Research question and feasible contribution

Primary RQ: Does adding fixed, interpretable surface-linguistic features to TF-IDF improve functional/non-functional classification on unseen source projects?

Secondary RQs: Does word-plus-character TF-IDF provide a stronger lightweight baseline? Which surface-feature groups contribute? How do results vary by source project, class and CPU cost? NFR subcategory prediction is a secondary exploratory task, reported separately.

Potential contribution: a controlled grouped evaluation and ablation study, accompanied by an integrated review application. Novelty must be checked against literature published before the cutoff; a new combination of standard features alone is not a guaranteed novel algorithm. Negative findings are valid if the study is sound. Never state improved accuracy, significance, user satisfaction or publication acceptance before measuring them.

## 3. Architecture and responsibility boundaries

Browser React interface -> REST API in FastAPI -> synchronous service functions -> MongoDB collections and private file storage. The analysis service calls frozen scikit-learn pipelines and deterministic quality checks. The reporting service uses Matplotlib with the Agg backend to produce PNGs. Offline training runs in the research directory or isolated notebook runtime; the application only performs inference.

Use normal `def` API handlers for blocking PyMongo/parsing/scikit-learn operations. An `async def` handler that directly performs those operations blocks the event loop. Begin with synchronous requests and a 500-requirement document limit. Add durable background workers only if a measured need appears; FastAPI BackgroundTasks alone does not provide restart-safe job execution.

Persist original documents separately from MongoDB, using server-generated UUID names. Store paths, checksums and metadata in MongoDB. Requirements and review events belong in separate collections, not an unbounded embedded document. This avoids MongoDB's document-size limit and makes pagination straightforward.

## 4. Historical environment and version policy

The version register supplied in `Version_Register.md` lists the selected release, date and primary-source URL. `config/release_audit.json` records primary historical availability evidence for every pinned Python package, including indirect dependencies. Most evidence is PyPI upload metadata; atomicwrites uses its historical maintainer tag because current old-version files were reuploaded later. Use Python **3.7.6**, the interpreter shipped with the verified Miniconda 4.8.2 installer used by the notebook. All named project packages must have a release timestamp before 2020-04-01.

The browser application uses React/ReactDOM 16.13.0 with TypeScript 3.8.3 and the matching React type packages. TSX compiles to the checked-in ES5 `frontend/app.js`; React runs from local UMD files, with no Babel, webpack, or remote runtime assets. Node 12.16.1/npm 6.13.4 are pinned build helpers; the compiled frontend itself can be served by Python's standard-library HTTP server. Use the checked-in lockfile with npm 6.13.4. Do not run an unversioned `npx create-react-app`, install Vite, or introduce modern FastAPI/Pydantic APIs.

A current Colab session is a contemporary hosting service, not an April 2020 machine. The notebook explicitly separates that host from the historical Python interpreter that runs every experiment. It cannot freeze Colab's OS, browser, kernel or service implementation to 2020. This is application/library-level historical reproduction, not a claim of a bit-identical 2020 computer.

These old versions are suitable for an isolated academic reproduction. Keep the application on localhost or a private demonstration network. A future public deployment should be upgraded and separately validated.

### Step 1 — Create the repository and folders

Create a private Git repository using a Git release from before the cutoff if the tool itself is included in the historical inventory. Alternatively use a current host Git client solely for transport, recording it as host tooling. Suggested structure:

```text
reqcheck/
  backend/app/{api,services,schemas,repositories,ml}
  backend/tests/
  frontend/{vendor,src}
  storage/{uploads,reports}
  artifacts/{binary,nfr}
  research/
  data/{raw,processed,annotations}
  config/
  docs/
```

Copy supplied `research/` and `config/` files into the repository. Ignore private uploads, personal data, virtual environments, model binaries, caches and results from Git unless deliberately publishing a clean replication package. Record the initial commit hash in the research log.

### Step 2 — Install Python and backend dependencies

On Linux, use the archived installer and SHA-256 given in the notebook. It contains Python 3.7.6. On Windows, install Python 3.7.6 from Python.org and use `py -3.7` instead of `python3.7` below. The notebook is Linux x86-64 specific.

```bash
python3.7 -m venv .venv
source .venv/bin/activate
python -m pip install -r config/requirements-bootstrap-2020.txt
python -m pip install -r config/requirements-2020.txt
python -m pip check
python -m pip freeze > environment-installed.txt
```

Windows activation: `.venv\Scripts\activate`. Never install the historical scientific pins directly into Python 3.12/3.13. If wheels are unavailable for your platform, use a supported x86-64 Linux VM; do not silently change versions. Keep TLS certificate verification enabled. When using an old interpreter on a current host, a current host CA bundle may be passed via SSL_CERT_FILE/PIP_CERT; record this host trust-store dependency.

Check each installed project dependency against the release register. Bootstrap base distributions may contain unrelated bundled tools; they are not experiment dependencies. Archive the installed freeze and successful `pip check` output alongside results.

### Step 3 — Start MongoDB

Use **MongoDB Community Server 4.2.3** and **PyMongo 3.10.1**. MongoDB is fully suitable; PostgreSQL is unnecessary for this design. Install from MongoDB's archived distribution for your OS. Create a local data directory and bind only to loopback:

```bash
mongod --dbpath ./storage/mongo --bind_ip 127.0.0.1 --port 27017
```

Use a second terminal for the API. Configure `MONGO_URI=mongodb://127.0.0.1:27017` and `MONGO_DB=reqcheck`. The application now authenticates account and guest workspaces, but remains a localhost academic prototype; do not expose the local deployment publicly without hardening. Protect the MongoDB service separately. Environment variables are read with `os.environ`; no dotenv package is required.

### Step 4 — Establish data collections and indexes

| Collection | Essential fields | Index |
|---|---|---|
| projects | _id UUID string, name, description, created_at | _id unique |
| documents | _id, project_id, original_name, stored_path, sha256, format, version, extraction_status | project_id + created_at |
| requirements | _id, document_id, document_version, sequence, text, location, revision | document_id + document_version + sequence unique |
| analysis_runs | _id, document_id, input_revision_hash, model_hashes, rule_version, status, created_at | document_id + created_at |
| run_requirements | _id composite run/requirement identity, _run_id, _requirement_id, frozen requirement fields | _run_id |
| findings | _id, run_id, requirement_ids, kind, suggestion, evidence, score | run_id + kind |
| review_events | _id, finding_id, action, corrected_label, reviewer, created_at | finding_id + created_at |

Use UUID strings in JSON and MongoDB, or explicitly convert ObjectId to string at the API boundary. Store timestamps in UTC ISO 8601 or BSON datetime and serialize consistently. Never return raw ObjectId objects through FastAPI.

MongoDB supplies the unique `_id` index automatically; do not recreate it with unsupported options. Each frozen requirement snapshot needs a distinct storage identity for each run, while retaining the original requirement ID for finding references. Serve historical source text through `GET /analysis-runs/{run_id}/requirements` rather than substituting current edits.

Each requirements edit increments `revision`. Compute an input hash over ordered IDs, revisions and text. An analysis run is valid only for that hash. If a requirement changes after analysis, show the run as stale and require reanalysis. Preserve old runs for traceability; do not overwrite historical predictions.

Example index creation using PyMongo:

```python
from pymongo import MongoClient, ASCENDING
client = MongoClient('mongodb://127.0.0.1:27017', serverSelectionTimeoutMS=3000)
db = client.reqcheck
db.requirements.create_index([
    ('document_id', ASCENDING), ('document_version', ASCENDING),
    ('sequence', ASCENDING)], unique=True)
db.findings.create_index([('run_id', ASCENDING), ('kind', ASCENDING)])
```

### Step 5 — Define API contracts before writing screens

| Method and route | Request | Response / behavior |
|---|---|---|
| GET /health | none | API/model readiness; 503 if a required dependency fails |
| GET /auth/session | session cookie, if present | Public session check; identity, expiry and CSRF token |
| POST /auth/register | name (1-120 chars), unique email, password (12-128 chars), confirm_password | 201 account browser-session cookie; matching passwords required |
| POST /auth/login | email, password | 201 new session; generic invalid-credential error |
| POST /auth/guest | acknowledge_temporary=true | 201 isolated 24-hour guest identity |
| POST /auth/logout | JSON; cookie and CSRF token | Invalidate account session or delete guest data |
| POST /auth/change-password | current_password, password, confirm_password; cookie and CSRF | Account only; verify current password, change hash, revoke other sessions |
| POST /projects | JSON name, description | 201 with project ID |
| GET /projects | page, page_size | Paginated projects |
| PATCH /projects/{id} | name, description | Save owner project details |
| DELETE /projects/{id} | confirm_name query | Exact-name-confirmed project/file cascade |
| GET /projects/{id}/documents | page, page_size | Paginated project documents |
| POST /projects/{id}/documents | multipart file | 201 document, extraction status and preview |
| GET /documents/{id}/requirements | pagination | Statements and source locations |
| PATCH /requirements/{id} | text, expected_revision | Updated record; 409 on revision conflict |
| POST /documents/{id}/requirements | text, location | Manual insertion/split result |
| DELETE /requirements/{id} | expected revision | Soft delete, preserving traceability |
| POST /documents/{id}/analysis-runs | expected_input_hash | Completed run, or persisted failed status |
| GET /analysis-runs/{id}/findings | kind, page | Paginated findings |
| POST /findings/{id}/reviews | accept/dismiss/correct + comment | Immutable review event |
| GET /analysis-runs/{id}/charts/{kind}.png | none | Matplotlib PNG |
| GET /analysis-runs/{id}/report | format=html/csv/json | Export with version and provenance |
| DELETE /documents/{id} | confirmation handled in UI | Delete document/files per retention policy |

Use Pydantic 1.4 BaseModel, `.dict()` and `@validator` if needed. Avoid `.model_dump()`, pydantic-settings and newer FastAPI Annotated examples. Use 400 for invalid extraction, 404 for missing records, 413 for oversized input, 415 for unsupported formats, 409 for stale revisions and 422 for schema validation. Show actionable frontend errors.

Except health/session checks and registration/login/guest entry, routes require an active session. Every resource operation resolves its project and checks the authenticated owner, including nested charts, reviews and exports. Existing ownerless demo data remains inaccessible and is not auto-assigned. Protected mutations require X-CSRF-Token; authentication mutations require JSON and a permitted Origin. Passwords use salted PBKDF2-HMAC-SHA256 (600,000 iterations), and session tokens are stored only as hashes.

Both identity types expire after 24 hours; account cookies are browser-session cookies. Account data survives logout and expiry. Guest end deletes uploads and nested records; a startup/background cleanup checks abandoned sessions every 60 seconds. Failed cleanup is logged and retried with the identity retained. Closing the browser cannot guarantee immediate server deletion; disclose this and provide explicit End guest session. Require temporary-work acknowledgement, and block switching to another identity until the guest downloads needed reports and ends its session.

The public Home explains upload, text review, analysis and exports through graphics and reduced-motion-aware animations. Account requirement edits autosave after a 700 ms pause; saving/saved/failure states, retry, revision-conflict comparison and owner-scoped local draft recovery preserve newer typing. Guest drafts are not persisted in browser storage. Empty/loading/error states cover projects, documents, requirements/search, analysis, reports, charts and reviewer history; chart illustrations are explicitly not results.

Navigation uses React Router DOM 5.1.2 with HashRouter/ Switch/ Link rather than whole-page conditional dispatch or hashchange listeners. PublicRoute permits Home and restricts signup/login/guest-entry to anonymous users. PrivateRoute redirects missing sessions to login, preserves a permitted destination, and guards account-only password changes against guests. Unknown addresses have a not-found page. HashRouter supports direct links/refresh on the existing static server. Session/ownership checks in the backend still enforce data access; frontend guards are not authorization.

The private header ends with a click-operated user-icon popover displaying the account name or Guest, Change Password and Logout. Guest password changes are disabled; guest Logout opens the explicit end/delete confirmation. Outside click, Escape and focus leaving dismiss the popover; Escape restores focus. No Home navigation link or project dropdown remains in the header. Multi-project selection is retained in the workspace project section. Router Prompt protects unsaved edits during page navigation.

Signup requires name, email, password and confirmation on both frontend/backend. Names are stored with the account; older nameless accounts use the email local part without reassigning any data. Change Password verifies the current password, enforces a different new password and matching confirmation, replaces the hash with a guarded update, and invalidates other account sessions. This is authenticated password change, not email-based forgotten-password recovery.

### Step 6 — Implement file validation and extraction

Limits: 10 MiB upload, 100 PDF pages, 500 candidate requirements per document and a bounded DOCX uncompressed-size total. Validate extension and inspect signatures where possible. TXT has no universal magic signature; attempt UTF-8/UTF-8-SIG decoding and otherwise ask the user to resave as UTF-8. Reject binary/NUL-heavy content. Never use the uploaded filename as a filesystem path. Parse in a timeout-limited worker process if untrusted documents are accepted.

Extraction functions should return structured blocks: `{text, page, paragraph, table, row, cell}` with absent fields set to null. Keep source text and cleaned text separately.

```python
from pathlib import Path
from docx import Document
from PyPDF2 import PdfFileReader

def extract_txt(path):
    return [{'text': Path(path).read_text(encoding='utf-8-sig'),
             'page': None, 'paragraph': None}]

def extract_docx(path):
    d = Document(path)
    blocks = [{'text': p.text, 'paragraph': i + 1, 'page': None}
              for i, p in enumerate(d.paragraphs) if p.text.strip()]
    for ti, table in enumerate(d.tables):
        for ri, row in enumerate(table.rows):
            for ci, cell in enumerate(row.cells):
                if cell.text.strip():
                    blocks.append({'text': cell.text, 'table': ti + 1,
                                   'row': ri + 1, 'cell': ci + 1, 'page': None})
    return blocks

def extract_pdf(path):
    blocks = []
    with open(path, 'rb') as stream:
        reader = PdfFileReader(stream, strict=False)
        if reader.isEncrypted:
            raise ValueError('Please provide an unencrypted PDF.')
        if reader.getNumPages() > 100:
            raise ValueError('Maximum 100 pages.')
        for i in range(reader.getNumPages()):
            blocks.append({'text': reader.getPage(i).extractText(), 'page': i + 1})
    if not any(b['text'].strip() for b in blocks):
        raise ValueError('No usable text found. Upload TXT/DOCX or a searchable PDF.')
    return blocks
```

The DOCX example appends tables after paragraphs; production extraction should walk the document XML body in order if exact paragraph/table ordering matters. DOCX page numbers cannot be reliably inferred without layout rendering. PyPDF2 1.26.0 extraction may scramble columns and tables. Require a preview and allow corrections before analysis. Scanned PDFs need OCR and are outside the committed core scope.

### Step 7 — Segment and curate requirement statements

Begin with numbered items, bullets and paragraphs. Preserve multi-line items and do not split decimal numbers or abbreviations blindly on every period. Use a small rule-based segmenter and a preview screen; a human can split, merge, remove headings and insert a missed statement. The model accepts one reviewed requirement at a time. Do not train on document headings or IDs as features.

For every statement retain document version, source location, original text, cleaned text, sequence number and reviewer edits. Add unit tests for numbered lists, wrapped lines, bullets, paragraph-only documents and tables. A prediction about a wrongly segmented fragment is not a reliable requirements finding.

### Step 8 — Prepare research data independently from application uploads

Acquire the original pre-cutoff PROMISE NFR dataset and retain its attribution/license notices. Its historic citation is Cleland-Huang, Mazrouee, Liguo and Port (2007), NFR dataset. Published work describes 625 requirements; verify your actual file rather than forcing that count. Use the original 2007 version rather than later expanded/relabelled datasets. A current mirror is a retrieval location, not proof of an unchanged historical snapshot. Record source URL, retrieved date, original publication date, file SHA-256 and any known provenance gaps.

Source starting point: https://openscience.us/repo/requirements/other-requirements/nfr/ . A retrieval mirror with original notices is https://github.com/AleksandarMitrevski/se-requirements-classification/tree/master/0-datasets/tera-PROMISE%20NFR . The mirror is not an original-author publication. Check terms before redistribution; this package includes the original mirrored artifact and derived CSV under their stated CC BY-SA 3.0 terms, with original notices and a separate DATA_LICENSE.md.

Input CSV must have exactly these required columns, with optional provenance columns allowed:

```csv
requirement_id,project_id,text,label
REQ-0001,PROJECT-01,The system shall let a user cancel a reservation.,F
REQ-0002,PROJECT-01,The service shall respond within two seconds.,PE
```

Use F for functional; original NFR codes include A availability, L legal, LF look-and-feel, MN maintainability, O operational, PE performance, SC scalability, SE security, US usability, FT fault tolerance and PO portability. Confirm mappings against the dataset documentation. Do not substitute NFR for subcategory labels in the input. Binary conversion is performed by the experiment runner.

The bundled raw ARFF is CP1252, not UTF-8. For ARFF conversion (create data/processed first):

```bash
python research/convert_promise.py data/nfr_original.arff data/processed/requirements.csv --encoding cp1252
```

Review class counts and malformed rows. The converter stops on unsupported records instead of skipping them. The original label ontology is preserved. Very rare classes should be reported and interpreted cautiously, not silently merged to inflate scores.


### Included benchmark and cleaning decisions

The original mirrored artifact contains 625 requirements. Two rows (PROMISE-0426 and PROMISE-0460) contain the same statement with conflicting SE/F labels; both were excluded without adjudicating either label. A word-(1,2)-gram TF-IDF audit at cosine >= 0.90 found one cross-project high-overlap pair. PROMISE-0402 was excluded as a near duplicate of PROMISE-0043 (cosine 0.9563). The reviewed CSV therefore has 622 rows; the experiment runner removes two further consistent normalized duplicates, leaving 620 requirements for binary evaluation. Read the final manifests for subtype counts. This cleaning was exploratory after an initial pilot run, and the paper discloses that sequence. No broad claim that every paraphrase has been removed is made.

The included notebook defaults to this reviewed dataset, retains original notices and raw bytes, and can optionally accept another research CSV/ARFF. The application document-upload workflow is separate from research-data ingestion. Benchmark result folders are included for inspection and reproduction.

### Step 9 — Freeze the research protocol before final experiments

Primary outcome: macro-F1 over a fixed global label set for each task. Primary comparison: hybrid features with linear SVM versus word TF-IDF with linear SVM. Secondary baselines: Multinomial Naive Bayes, logistic regression, and word+character TF-IDF. Ablations remove structure, modality or constraint features from the hybrid SVM.

Use up to five outer GroupKFold splits and three inner GroupKFold splits, with source project as the group. In scikit-learn 0.22 GroupKFold has no shuffle/random_state support: sort rows deterministically and persist all memberships. Use the identical outer splits for every approach. All vectorizers are fitted inside each inner training partition through Pipeline/FeatureUnion. Hyperparameters are selected in the inner loop only.

Remove normalized exact duplicates once before splitting, keeping a deterministic representative, and stop for conflicting duplicate labels. Inspect near duplicates using a predefined procedure before labels/results are analyzed; document removals or group connected projects together where cross-project near duplicates remain. The supplied runner removes exact normalized duplicates but does not automatically identify near duplicates. Do not interpret it as eliminating every leakage risk.

If a class is absent from a fold's test set, the fixed-label macro-F1 implementation counts it as zero; if absent from training, the model cannot learn it. Both cases are recorded. Report these support issues, pooled out-of-fold F1 and per-class results. Do not claim a single mean F1 completely describes rare-class performance. Binary classification is the primary feasible task; NFR subtyping is exploratory.

Hyperparameters: NB alpha {0.5,1}; logistic/SVM C {0.1,1,10}; class_weight balanced for logistic/SVM; maximum word vocabulary 15,000 and character vocabulary 20,000; word n-grams 1–2, character-within-word n-grams 3–5. These are fixed study settings. A later feature or grid change after seeing outer scores must be disclosed as exploratory.

### Step 10 — Run the supplied experiments

First check the environment using the small synthetic fixture. This fixture tests code execution only; its scores are not research evidence.

```bash
python research/run_experiments.py --data data/demo_requirements.csv --output results/demo --quick --demo
```

Reproduce the included exploratory benchmark with the reviewed bundled dataset:

```bash
python research/run_experiments.py --data data/promise_reviewed.csv --task binary --output results/binary
python research/run_experiments.py --data data/promise_reviewed.csv --task nfr --output results/nfr
```

The Colab notebook packages this workflow and uses CPU only. Expected cost is many short sparse-classifier fits; measure runtime on the actual dataset and record CPU/RAM, rather than promising a fixed duration. `--quick` uses only two model variants and is for smoke tests, not the complete paper.

Outputs: cleaned_data.csv; fold_metrics.csv; summary.csv; pooled_metrics.csv; oof_predictions.csv; paired_fold_differences.csv; splits.json; class reports; confusion PNGs; comparison.png; manifest.json; environment_freeze.txt; model.joblib. A final deployment model is selected using CV and refitted on all development data. That selected model's maximum CV score is not an independent final-test estimate.

To make a final generalization claim, freeze the model and evaluate an untouched, independently annotated project collection once with `evaluate_external.py`. Check for text overlap against development data before evaluation. Do not tune on the external set after inspecting results.

```bash
python research/evaluate_external.py --model results/binary/model.joblib --data data/processed/external.csv --task binary --output results/external
```

### Step 11 — Understand and audit the feature implementation

`reqcheck_ml.py` implements nine fixed features in three groups: structure (word count, character count, punctuation count); modality (modal-verb frequency, negation frequency, -ing word suffix frequency); constraints (numeric-token frequency, unit presence, vague-term indicators). Length/count caps are fixed in code. The -ing suffix feature is a surface proxy, not POS tagging. No claim of a full linguistic parser is made. Feature names and definitions must match the paper.

Word TF-IDF + surface features is the primary proposed model. Word+character TF-IDF is a separate baseline. This prevents attributing character-model improvements to linguistic features. All features are nonnegative; only the word-only configuration is used with Naive Bayes. No embeddings, transformers or generative APIs are required.

### Step 12 — Export models and implement inference

Copy model.joblib and its manifest into `artifacts/binary/` and `artifacts/nfr/`. Add hashes and a version string. Load once at startup using the identical scikit-learn version and the same `reqcheck_ml` module import path. Joblib/pickle artifacts must come only from your trusted training process.

```python
import joblib
from reqcheck_ml import SurfaceFeatures  # module must be importable when unpickling
binary_model = joblib.load('artifacts/binary/model.joblib')
labels = binary_model.predict(['The service shall respond within two seconds.'])
```

Predict binary labels for all reviewed statements. Apply the NFR subtype model only to those predicted NFR, and permit a reviewer to request subtype analysis for a corrected label. Report both oracle NFR-only evaluation and end-to-end subtype evaluation if making a claim about the complete cascade; the supplied secondary experiment measures oracle NFR-only classification.

Do not pass whole PDF pages to a sentence-level classifier. `backend/app/segmentation.py` separates explicit requirement IDs/lists and unambiguous modal-line boundaries after extraction, retaining original statement text and source location metadata. Wrapped lines are joined; detected repeated PDF headers and page numbers are excluded from identified statements. Inspect extraction before analysis. Leading source identifiers and whitespace are normalized for inference/similarity only, not removed from evidence. Re-upload previously imported documents to use updated segmentation; do not mutate old run snapshots.

LinearSVC decision_function values are margins, not probabilities or confidence percentages. Display “suggested label” and optional margin with an explanation. A “needs review” threshold must be tuned on development data. Do not invent a calibrated confidence score.

### Step 13 — Implement duplicate candidates and ambiguity checks

For each document, fit a separate TF-IDF vectorizer on its reviewed requirements and compute cosine similarities. Return only pairs i < j with score >= a validation-selected threshold. This within-document representation is an application feature and is independent of the classification research pipeline. Cap document size at 500 statements so the similarity matrix remains manageable.

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def candidates(texts, threshold):
    if len(texts) < 2:
        return []
    v = TfidfVectorizer(ngram_range=(1,2))
    try:
        m = cosine_similarity(v.fit_transform(texts))
    except ValueError:  # e.g. an empty vocabulary after token filtering
        return []
    return [{'left':i, 'right':j, 'similarity':float(m[i,j])}
            for i in range(len(texts)) for j in range(i+1,len(texts))
            if m[i,j] >= threshold]
```

Start development with threshold 0.75 only as a provisional UI setting. Select the final threshold using annotated validation pairs, for example searching 0.50–0.95 in increments of 0.05 and maximizing F1 or a predefined precision target. Never report provisional threshold performance as a validated result. Include high-overlap contradictory pairs in the annotation set; overlap does not imply equivalence.

Use `ambiguity_flags()` from reqcheck_ml.py for a deterministic first version with character offsets and review prompts. Explain that a flagged term is a review cue, not proof that a statement is defective. Measure precision/recall against independently annotated statements before making accuracy claims. Automatic conflict detection is deferred.

The current v2 rules recognize multiword/hyphenated vague expressions and undefined readiness triggers, retaining offsets into reviewed text. Lexical duplicate candidates carry explicit warnings when numeric values or negation differ; export those warnings with the score. This is not a semantic contradiction detector. The 0.75 threshold is still provisional and paraphrases can be missed. Artifact weights and training features were not changed by this runtime preprocessing/rules correction; rule versions record the changed analysis behavior.

### Step 14 — Build the React + TypeScript frontend

Use React/ReactDOM **16.13.0**, TypeScript **3.8.3**, `@types/react` **16.9.30**, and `@types/react-dom` **16.9.5**, all selected before the cutoff. The npm v1 lockfile also records the exact pre-cutoff transitive packages. React executes from its local UMD distributions; strict TypeScript modules live in `frontend/src/`, and `app.tsx` only bootstraps providers and routing. Build with the pinned Node/npm toolchain:

```powershell
Set-Location frontend
npm ci
npm run build
npm run vendor
```

`npm run build` checks strict TypeScript, including unused declarations, emits ES5 modules to ignored `.build/`, and bundles them into `frontend/app.js` with Rollup 2.3.2. `frontend/index.html` loads this bundle. `npm run vendor` copies React, Router and React Query UMD distributions and license notices into `frontend/vendor/`; these files are already included. No Babel, webpack, remote font, or runtime CDN is needed. Run `npm test` for upload-validation and empty-state regression assertions. Serve frontend from its folder:

```bash
python -m http.server 3000 --bind 127.0.0.1 --directory frontend
```

Feature modules provide project creation/selection; bounded TXT/DOCX/PDF upload; extraction review and correction; requirement add/split/merge/remove workflows; analysis history; classification, duplicate and ambiguity finding review; reviewer decisions; chart and report links; and confirmed document deletion. Pages, route guards, reusable UI/layout components, domain types, API services and hooks have separate folders; see README for the tree. React Query 1.0.36 handles fresh server reads, deduplication and non-retrying mutations, with session-scoped cache keys and cache clearing on identity changes. Keep editable drafts separate from cached server responses and do not automatically refetch them on window focus. Auth belongs in context; local UI/editor state belongs in hooks. Redux is not required by the present state-sharing needs.

Preserve loading, empty, unavailable, stale-input, and error states. A selected file is pending, not yet saved: show the upload-next-step notice instead of the no-saved-documents placeholder. Remove affects only the pending file and restores Browse files focus; upload failures preserve the selection. Use semantic HTML, keyboard-accessible controls, labeled uploads and paginated findings.

Controls use local inline SVG icons with readable labels. The Home workflow SVG has four selectable stages, automatic progression and a pause control; hover/focus and hidden tabs pause it, and reduced-motion preferences disable autoplay while preserving manual exploration. Subtle loading, upload, card-entry and dialog animations also honor reduced motion, as does section navigation. Confirmation dialogs trap keyboard focus, close on Escape when idle, and restore focus to the triggering control. Reviewer history expands within each finding, and historical findings use frozen source snapshots.

The user-requested typography uses locally hosted JetBrains Mono for headings and buttons, including button-style report links, and Inter for body text and form fields; retain both SIL Open Font Licenses. The current font assets are a presentation exception to the historical baseline. Dropdown arrows are consistently inset, with reserved text padding, and the upload picker is separated from the saved-document row. See README for the configured Windows runtime commands and Verification_Report.md for actual test evidence.

`examples/frontend.html` remains the earlier minimal upload example. The browser's native Fetch API avoids an additional HTTP client dependency. Do not set the multipart Content-Type header manually; FormData supplies the boundary.

### Step 15 — Connect React and FastAPI

Run the API with the historical command, not the newer `fastapi dev` command:

```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

Whitelist only `http://127.0.0.1:3000` and `http://localhost:3000` in CORSMiddleware. Use the same hostname for frontend and API, credentials='include', and the active session's X-CSRF-Token for mutations. Install CORS outside authentication middleware so authentication errors retain CORS headers. HttpOnly browser-session cookies use SameSite=strict; REQCHECK_SECURE_COOKIE=1 adds Secure for a separately configured HTTPS deployment.

```python
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
app = FastAPI(title='ReqCheck', version='0.1.0')
app.add_middleware(CORSMiddleware,
    allow_origins=['http://127.0.0.1:3000','http://localhost:3000'],
    allow_credentials=True,
    allow_methods=['GET','POST','PATCH','DELETE'], allow_headers=['Content-Type','X-CSRF-Token'])
```

Project version 0.1.0 is your own application label, not an external technology release. A health endpoint distinguishes application liveness from model/database readiness. `/docs` requires an active session; use the frontend or a cookie/CSRF-aware HTTP client for mutation checks rather than assuming Swagger supplies CSRF headers.

### Step 16 — Generate charts and reports

Set `matplotlib.use('Agg')` before importing pyplot. Use Figure objects per request and close them after rendering. Avoid shared mutable pyplot state in concurrent routes. Reviewer decisions are append-only but change after analysis: reports and reviewer charts must not reuse a cache keyed only by immutable run ID. The local application serves these responses with `Cache-Control: no-store` and refreshes chart URLs after decisions.

Application charts: suggested FR/NFR distribution; NFR subtype distribution; flags by type; reviewer decisions. Label these as model suggestions or reviewer-confirmed counts, as appropriate. Application distributions are not accuracy estimates.

Research charts: algorithm comparison with outer-fold variability; confusion matrices; class support; fit/predict runtime; ablation comparison. Outer-fold SD is descriptive variability, not a confidence interval. Explain missing classes and compare pooled OOF metrics as well.

Every report includes source document hash, run ID, input revision hash, model/rule versions, extraction warnings, suggestions, review decisions and source locations. Escape user text in HTML; render requirement text as text nodes in React rather than injecting HTML. CSV exports should neutralize spreadsheet formula-leading text where necessary.

Serve printable HTML inline so it opens in a browser; keep CSV/JSON as downloadable attachments. The browser print dialog can save the report as PDF.

### Step 17 — Verification and evaluation gates

| Area | Required checks | Pass condition |
|---|---|---|
| Extraction | TXT Unicode/BOM, DOCX paragraphs/tables, PDF text/empty/encrypted, oversize | Correct text or explicit supported error |
| Segmentation | Wrapped bullets, decimals, abbreviations, headings | Reviewer can repair without losing provenance |
| API/DB | Missing IDs, stale revisions, restart/reload, invalid schema | Correct status codes and persistent decisions |
| Identity | Duplicate email, hashing, logout, expiry, nested ownership | No cross-owner access; account progress persists |
| Guests | Acknowledgement, end/expiry, cleanup failure/retry | Isolated work; files and records deleted reliably |
| ML | No group overlap, vectorizer fit inside CV, repeat run | Same splits and stable predictions within stated environment |
| Quality checks | Negation pairs, lexical duplicates, benign vague words | Explainable candidates, human override |
| UI | Keyboard use, slow requests, server errors, pagination | Complete review workflow without lost edits |
| Autosave/empty states | Failed save/retry, typing during save, empty charts/history | Draft preserved; next actions clear; no invented results |
| Reports | Counts match run, stale-input warning, file download | Traceable report with correct labels and hashes |

Use the pinned testing dependencies and Starlette TestClient with requests 2.23.0 for backend integration tests. The implemented tests run through Python's unittest runner. Set `REQCHECK_MONGO_TEST_URI` to explicitly enable `backend.tests.test_mongo_integration`, which uses the bundled models and a unique temporary database name and cleans only that database. Never point destructive fixtures at the main database. The supplied research smoke test validates experiment execution separately from the application tests.

Suggested application evaluation: 3–5 independent source documents and a small supervised reviewer session with consent. This is formative usability feedback, not a large-sample clinical-style efficacy claim. Record tasks, time, completion and feedback. If estimating time saved, use a predefined counterbalanced manual-versus-assisted procedure and report sample limitations.

### Step 18 — Complete the research paper

The manuscript supplied in this package contains an abstract, related work, methods, measured benchmark results, discussion and threats to validity. The bundled result files substantiate the tables. It is an exploratory retrospective study: the data cleaning followed an initial pilot, and no independent external test or usability study was performed.

1. Confirm supervisor approval of RQs and historical cutoff.
2. Search pre-April-2020 literature and maintain a comparison matrix: task, data, split strategy, features, algorithm, limitations.
3. Freeze and archive dataset provenance, annotation protocol, code version and evaluation settings.
4. Execute full binary experiments, then exploratory NFR experiments.
5. Inspect all failures, class support and OOF prediction errors before interpreting averages.
6. Populate tables from summary.csv, pooled_metrics.csv and fold_metrics.csv, naming their different aggregation meanings.
7. Discuss paired fold differences descriptively. Five overlapping training folds are not five independent trials; do not apply a naive significance test to claim superiority.
8. Add external evaluation only if untouched data actually exist. The current package supplies a tool for external evaluation, but no independent external dataset or external results.
9. Update abstract and conclusion to match measured findings, including negative results.
10. Add author/affiliation, complete bibliography, artifact access and venue formatting; remove pending-results markers only when replaced with evidence.

Do not cite the October 2020 requirements-classification study discussed earlier in the conversation: it is outside this project's cutoff. All literature listed in the manuscript is pre-cutoff. A study created now using historical methods should be described honestly as a retrospective replication; do not backdate authorship or submission.

## 5. Semester plan: 32 teaching weeks

Assumption: two 16-week semesters; adapt week labels to your department. Three credits per semester does not by itself define your university's required weekly hours.

| Weeks | Work | Reviewable milestone |
|---|---|---|
| S1 1–2 | Scope, proposal, background, supervisor review | Approved problem and RQs |
| S1 3–4 | Literature matrix and historical version audit | Pre-cutoff sources and environment |
| S1 5–6 | Data provenance, annotation rules, exploratory counts | Dataset card and protocol draft |
| S1 7–8 | Architecture, schema, API contract, UI wireframes | SRS and design review |
| S1 9–10 | Upload/extraction and MongoDB persistence | TXT/DOCX/PDF preview demo |
| S1 11–12 | Baseline experiments and prototype inference | Reproducible baseline |
| S1 13–14 | Requirement editing and classification UI | End-to-end vertical slice |
| S1 15–16 | Protocol freeze, interim report, defense | FYP-I submission |
| S2 1–3 | Review workflows, immutable analysis runs | Core application complete |
| S2 4–5 | Duplicate and ambiguity modules | Evaluated candidate features |
| S2 6–7 | Matplotlib charts and exports | Traceable analysis report |
| S2 8–10 | Full nested CV, ablations, external test if available | Frozen results package |
| S2 11–12 | Integration tests and usability feedback | Validation report |
| S2 13–14 | Paper results/discussion and dissertation | Supervisor-review drafts |
| S2 15–16 | Corrections, demo, reproducibility archive, submission | Final FYP and paper manuscript |

## 6. Risks and practical fallbacks

Historical package wheels unavailable: use the pinned Linux x86-64 environment, preserve an approved wheelhouse and document the host. PDF text poor: keep preview/correction mandatory, ask for DOCX/TXT. Sparse NFR classes: keep binary classification primary and report exploratory subtypes honestly. No measurable hybrid gain: publish the careful comparison and explanation if a suitable venue accepts it. Dataset provenance uncertain: obtain a verified original or label the provenance limitation; do not claim a historically pristine dataset without evidence. No independent data: omit external-generalization claims.

## 7. Final completion checklist

Application: all input types handled, human correction, classification, explainable findings, review persistence, reports, documented local setup. Research: source data permissions/provenance, frozen protocol, grouped nested CV, leakage review, baselines/ablations, per-class and runtime metrics, honest conclusions. Reproducibility: environment freeze, pre-cutoff release register, hashes, split IDs, scripts, output charts and README. Academic: proposal, SRS, design, tests, dissertation, manuscript and defense slides required by your department.
