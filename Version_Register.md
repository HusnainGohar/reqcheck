# Historical technology version register

Cutoff: every selected project version existed **before 1 April 2020**. Dates below refer to published vendor releases or earliest current PyPI artifact upload, except the explicitly noted atomicwrites tag. A current archive's download timestamp is not its historical release date. OS/browser/Colab hosting are contemporary host services and are not claimed to be frozen to 2020.

## Runtime, frontend and database

| Component | Selected version | Historical date | Primary source |
|---|---|---|---|
| Python | 3.7.6 | 2019-12-18 | https://www.python.org/downloads/release/python-376/ |
| React | 16.13.0 | 2020-02-26 | https://legacy.reactjs.org/blog/2020/02/26/react-v16.13.0.html |
| ReactDOM | 16.13.0 | 2020-02-26 | https://registry.npmjs.org/react-dom (time field) |
| TypeScript | 3.8.3 | 2020-02-28 | https://registry.npmjs.org/typescript (time field) |
| @types/react | 16.9.30 | 2020-03-31 | https://registry.npmjs.org/@types%2freact (time field) |
| @types/react-dom | 16.9.5 | 2020-01-21 | https://registry.npmjs.org/@types%2freact-dom (time field) |
| MongoDB Community | 4.2.3 | 2020-01-27 | https://groups.google.com/g/mongodb-announce/c/msFuQQ7Yc80 |
| Miniconda Linux x86-64 installer | py37_4.8.2 | 2020-03-11 | https://repo.anaconda.com/miniconda/ |
| Node.js (optional host helper) | 12.16.1 | 2020-02-18 | https://nodejs.org/en/blog/release/v12.16.1 |
| npm (bundled with optional Node release) | 6.13.4 | Included in Node 12.16.1 | https://nodejs.org/en/blog/release/v12.16.1 |

### Frontend packages: direct and transitive pins

Account authentication uses Python 3.7's standard-library hashlib, hmac and secrets modules (PBKDF2-HMAC-SHA256, constant-time comparison, and random opaque tokens). No new authentication or animation dependency was added. The existing FastAPI/Starlette/PyMongo/React/TypeScript versions remain unchanged; CSS/SVG provide the Home graphics, empty states and reduced-motion behavior.

The npm v1 lockfile is compatible with the pinned npm 6.13.4. Every locked frontend dependency, including build-time typings and React UMD transitive packages, was available before the cutoff.

| Package | Version | Historical evidence date | Source |
|---|---|---|---|
| @types/prop-types | 15.7.3 | 2019-09-24 | https://registry.npmjs.org/@types%2fprop-types (time field) |
| csstype | 2.6.10 | 2020-03-30 | https://registry.npmjs.org/csstype (time field) |
| prop-types | 15.7.2 | 2019-02-13 | https://registry.npmjs.org/prop-types (time field) |
| react-is | 16.13.1 | 2020-03-19 | https://registry.npmjs.org/react-is (time field) |
| scheduler | 0.19.1 | 2020-03-19 | https://registry.npmjs.org/scheduler (time field) |
| loose-envify | 1.4.0 | 2018-07-10 | https://registry.npmjs.org/loose-envify (time field) |
| object-assign | 4.1.1 | 2017-01-16 | https://registry.npmjs.org/object-assign (time field) |
| js-tokens | 4.0.0 | 2018-01-28 | https://registry.npmjs.org/js-tokens (time field) |
| react-router-dom | 5.1.2 | 2019-09-30 | https://registry.npmjs.org/react-router-dom (time field) |
| react-router | 5.1.2 | 2019-09-30 | https://registry.npmjs.org/react-router (time field) |
| @types/react-router-dom | 5.1.3 | 2019-11-25 | https://registry.npmjs.org/@types%2freact-router-dom (time field) |
| @types/react-router | 5.1.4 | 2020-01-07 | https://registry.npmjs.org/@types%2freact-router (time field) |
| @types/history | 4.7.5 | 2020-01-31 | https://registry.npmjs.org/@types%2fhistory (time field) |
| @babel/runtime | 7.9.2 | 2020-03-21 | https://registry.npmjs.org/@babel%2fruntime (time field) |
| regenerator-runtime | 0.13.5 | 2020-03-12 | https://registry.npmjs.org/regenerator-runtime (time field) |
| history | 4.10.1 | 2019-09-13 | https://registry.npmjs.org/history (time field) |
| hoist-non-react-statics | 3.3.2 | 2020-01-22 | https://registry.npmjs.org/hoist-non-react-statics (time field) |
| mini-create-react-context | 0.3.2 | 2019-04-13 | https://registry.npmjs.org/mini-create-react-context (time field) |
| gud | 1.0.0 | 2018-02-21 | https://registry.npmjs.org/gud (time field) |
| path-to-regexp | 1.7.0 | 2016-11-08 | https://registry.npmjs.org/path-to-regexp (time field) |
| isarray | 0.0.1 | 2013-05-27 | https://registry.npmjs.org/isarray (time field) |
| resolve-pathname | 3.0.0 | 2018-12-02 | https://registry.npmjs.org/resolve-pathname (time field) |
| value-equal | 1.0.1 | 2018-12-03 | https://registry.npmjs.org/value-equal (time field) |
| tiny-invariant | 1.1.0 | 2020-01-30 | https://registry.npmjs.org/tiny-invariant (time field) |
| tiny-warning | 1.0.3 | 2019-07-09 | https://registry.npmjs.org/tiny-warning (time field) |
| react-query | 1.0.36 | 2020-03-24 | https://registry.npmjs.org/react-query (time field) |
| rollup | 2.3.2 | 2020-03-31 | https://registry.npmjs.org/rollup (time field) |
| fsevents (optional macOS build helper) | 2.1.2 | 2019-11-09 | https://registry.npmjs.org/fsevents (time field) |

HTML5, CSS and browser Fetch are web-platform features, not independently installed package versions. The TypeScript build runs before deployment and emits the checked-in ES5 bundle; the browser executes local React UMD files with no Babel/webpack/CRA or remote assets. MongoDB is selected; PostgreSQL is not a dependency. NLP uses fixed surface heuristics and optional NLTK utilities; no downloaded language-model corpus is needed by the supplied experiment runner.

React Router DOM and React Query's self-contained UMD bundles are hosted locally with retained license notices. Router typings/helpers are pinned to historical versions compatible with TypeScript 3.8.3; the npm v1 lockfile is deduplicated onto the pinned Babel runtime. Babel is not used as a build tool. Rollup combines the application's TypeScript-emitted ES modules into one locally served IIFE; it does not fetch packages or transform application source at runtime. The optional macOS fsevents helper is explicitly pinned to prevent a later release from entering the lockfile. React Query 1.0.36 has no runtime dependency beyond React; its small local declaration file describes the historical APIs used by this app.

Current npm audit reports three affected packages (one moderate, two high): `@babel/runtime` named-capture replacement complexity (GHSA-968p-4wvh-cqc8), `path-to-regexp` regex backtracking (GHSA-9wv6-86v2-598j), and Rollup advisories including DOM-clobbering output (GHSA-gcx4-mw62-g8wm) and path traversal (GHSA-mw96-cpmx-2vgc). The app uses fixed literal client-side route paths, not generated/custom patterns, and does not use the named-capture replacement helper. Its Rollup configuration uses a fixed local input/output and no dynamic imports or `import.meta.url`. These observations are not a security audit or a claim that historical packages are production-safe. Patches require post-baseline versions; no automatic audit upgrade was applied. Revisit the historical constraint before production deployment.

**User-requested typography exception:** the UI uses locally hosted JetBrains Mono for headings and buttons and Inter for body text and form fields, from the Google Fonts repository, with both SIL Open Font Licenses retained. The current font assets are requested separately from the historical project stack and are not claimed to meet the 2020 cutoff. They add no JavaScript or Python dependency and require no browser request to a third-party font service.

## Python packages: direct and indirect pins

Install bootstrap and project requirements with Python 3.7.6. The full package set was installed and checked on Linux x86-64; applicable Windows pins were also installed and checked in the project-local Python 3.7.6 environment, with real-model inference and MongoDB integration passing. macOS remains unverified. Linux-only uvicorn dependencies have environment markers.

| Package | Version | Historical evidence date | Source |
|---|---|---|---|
| fastapi | 0.52.0 | 2020-03-01 | https://pypi.org/project/fastapi/0.52.0/ |
| starlette | 0.13.2 | 2020-02-20 | https://pypi.org/project/starlette/0.13.2/ |
| pydantic | 1.4 | 2020-01-24 | https://pypi.org/project/pydantic/1.4/ |
| uvicorn | 0.11.3 | 2020-02-17 | https://pypi.org/project/uvicorn/0.11.3/ |
| pymongo | 3.10.1 | 2020-01-08 | https://pypi.org/project/pymongo/3.10.1/ |
| python-multipart | 0.0.5 | 2018-10-12 | https://pypi.org/project/python-multipart/0.0.5/ |
| numpy | 1.18.2 | 2020-03-17 | https://pypi.org/project/numpy/1.18.2/ |
| scipy | 1.4.1 | 2019-12-19 | https://pypi.org/project/scipy/1.4.1/ |
| pandas | 1.0.3 | 2020-03-18 | https://pypi.org/project/pandas/1.0.3/ |
| scikit-learn | 0.22.2.post1 | 2020-03-04 | https://pypi.org/project/scikit-learn/0.22.2.post1/ |
| matplotlib | 3.2.1 | 2020-03-18 | https://pypi.org/project/matplotlib/3.2.1/ |
| nltk | 3.4.5 | 2019-08-20 | https://pypi.org/project/nltk/3.4.5/ |
| python-docx | 0.8.10 | 2019-01-09 | https://pypi.org/project/python-docx/0.8.10/ |
| PyPDF2 | 1.26.0 | 2016-05-18 | https://pypi.org/project/PyPDF2/1.26.0/ |
| joblib | 0.14.1 | 2019-12-10 | https://pypi.org/project/joblib/0.14.1/ |
| pytest | 5.3.5 | 2020-01-29 | https://pypi.org/project/pytest/5.3.5/ |
| requests | 2.23.0 | 2020-02-19 | https://pypi.org/project/requests/2.23.0/ |
| pip | 20.0.2 | 2020-01-24 | https://pypi.org/project/pip/20.0.2/ |
| setuptools | 46.0.0 | 2020-03-08 | https://pypi.org/project/setuptools/46.0.0/ |
| wheel | 0.34.2 | 2020-01-30 | https://pypi.org/project/wheel/0.34.2/ |
| six | 1.14.0 | 2020-01-15 | https://pypi.org/project/six/1.14.0/ |
| python-dateutil | 2.8.1 | 2019-11-03 | https://pypi.org/project/python-dateutil/2.8.1/ |
| pytz | 2019.3 | 2019-10-07 | https://pypi.org/project/pytz/2019.3/ |
| cycler | 0.10.0 | 2016-02-16 | https://pypi.org/project/cycler/0.10.0/ |
| kiwisolver | 1.1.0 | 2019-04-24 | https://pypi.org/project/kiwisolver/1.1.0/ |
| pyparsing | 2.4.6 | 2019-12-25 | https://pypi.org/project/pyparsing/2.4.6/ |
| lxml | 4.5.0 | 2020-01-29 | https://pypi.org/project/lxml/4.5.0/ |
| click | 7.1.1 | 2020-03-09 | https://pypi.org/project/click/7.1.1/ |
| h11 | 0.9.0 | 2019-05-15 | https://pypi.org/project/h11/0.9.0/ |
| websockets | 8.1 | 2019-11-01 | https://pypi.org/project/websockets/8.1/ |
| httptools | 0.1.1 | 2020-02-08 | https://pypi.org/project/httptools/0.1.1/ |
| uvloop | 0.14.0 | 2019-11-05 | https://pypi.org/project/uvloop/0.14.0/ |
| attrs | 19.3.0 | 2019-10-15 | https://pypi.org/project/attrs/19.3.0/ |
| packaging | 20.3 | 2020-03-05 | https://pypi.org/project/packaging/20.3/ |
| more-itertools | 8.2.0 | 2020-01-29 | https://pypi.org/project/more-itertools/8.2.0/ |
| pluggy | 0.13.1 | 2019-11-21 | https://pypi.org/project/pluggy/0.13.1/ |
| wcwidth | 0.1.9 | 2020-03-23 | https://pypi.org/project/wcwidth/0.1.9/ |
| py | 1.8.1 | 2019-12-27 | https://pypi.org/project/py/1.8.1/ |
| importlib-metadata | 1.5.0 | 2020-01-29 | https://pypi.org/project/importlib-metadata/1.5.0/ |
| zipp | 3.1.0 | 2020-03-03 | https://pypi.org/project/zipp/3.1.0/ |
| atomicwrites | 1.3.0 | 2019-02-01 | https://github.com/untitaker/python-atomicwrites/tree/1.3.0 |
| colorama | 0.4.3 | 2019-12-06 | https://pypi.org/project/colorama/0.4.3/ |
| certifi | 2019.11.28 | 2019-11-28 | https://pypi.org/project/certifi/2019.11.28/ |
| chardet | 3.0.4 | 2017-06-08 | https://pypi.org/project/chardet/3.0.4/ |
| idna | 2.9 | 2020-02-17 | https://pypi.org/project/idna/2.9/ |
| urllib3 | 1.25.8 | 2020-01-21 | https://pypi.org/project/urllib3/1.25.8/ |

**Atomicwrites provenance exception:** version 1.3.0 has a maintainer-repository tag whose commit is dated 1 February 2019. Current PyPI artifacts for old versions were reuploaded in July 2022, so their upload times cannot establish the original release date. The audit preserves the current-upload timestamp separately and uses the historical tag as version-availability evidence. Source: https://github.com/untitaker/python-atomicwrites/tree/1.3.0 . This distinction concerns version availability versus byte-for-byte historical artifact identity.

## Reproduction levels

1. Historical algorithm/API compatibility: implemented using pre-cutoff methods.
2. Historical project libraries: pinned and actually exercised in Python 3.7.6.
3. Historical machine image: not claimed; modern Linux and Colab are host infrastructure.

Keep TLS verification enabled. The host CA trust store may be supplied to historical Python for current download endpoints. No GPU/TPU or pretrained neural model is required. Package download and isolated interpreter setup are separate from model-training runtime.
