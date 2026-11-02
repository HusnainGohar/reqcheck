# Dataset attribution and license

Original NFR dataset: Jane Cleland-Huang, Sepideh Mazrouee, Huang Liguo, and Dan Port (2007), PROMISE Software Engineering Repository. The included original artifact states copyright 2007 Jane Cleland-Huang and Creative Commons Attribution-ShareAlike 3.0.

License: https://creativecommons.org/licenses/by-sa/3.0/ ; legal code: https://creativecommons.org/licenses/by-sa/3.0/legalcode . Original notices remain in nfr_original.arff. Dataset author endorsement is not implied.

Retrieved from the mirror identified in provenance.json. Original repository starting point: https://openscience.us/repo/requirements/other-requirements/nfr/ . Current mirror availability does not independently prove historical byte identity.

Changes: original CP1252 ARFF converted to UTF-8 CSV; generated stable row IDs; excluded both instances of one statement with conflicting SE/F labels, preserving them in excluded_conflicting_duplicates.csv. These derived dataset files remain under CC BY-SA 3.0. Consistent normalized duplicates are removed by the experiment runner, with retained rows exported in results. Code and project documentation are separate works and are not represented as authored or endorsed by the dataset creators.

The demo_requirements.csv fixture is synthetic and is not a research dataset or performance benchmark.

Additional documented change: removed PROMISE-0402, a cross-project near duplicate of PROMISE-0043 (cosine 0.9563 at an audit threshold of 0.90), preserving it in excluded_near_duplicate.csv. Data cleaning was exploratory after an initial pilot; final results must be described accordingly.
