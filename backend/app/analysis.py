import hashlib
import json
import re
import sys
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import sklearn


PROJECT_ROOT = Path(__file__).resolve().parents[2]
RESEARCH_DIR = PROJECT_ROOT / 'research'
if str(RESEARCH_DIR) not in sys.path:
    sys.path.insert(0, str(RESEARCH_DIR))

import reqcheck_ml
from .segmentation import IDENTIFIER, LIST_ITEM


def analysis_text(text):
    text = IDENTIFIER.sub('', text, count=1)
    text = LIST_ITEM.sub('', text, count=1)
    return re.sub(r'\s+', ' ', text).strip()


class AnalysisUnavailable(Exception):
    pass


class AnalysisEngine:
    RULE_VERSION = 'ambiguity-v2;duplicate-tfidf-word-1-2-v2;statement-input-v2'
    DUPLICATE_THRESHOLD = 0.75
    MAX_DUPLICATE_FINDINGS = 10000

    def __init__(self, binary_model, nfr_model, model_versions=None):
        self.binary_model = binary_model
        self.nfr_model = nfr_model
        self.model_versions = model_versions or {
            'binary': 'test-injected',
            'nfr': 'test-injected',
        }

    @classmethod
    def from_artifacts(cls, project_root=None):
        root = Path(project_root or PROJECT_ROOT)
        config_path = root / 'config' / 'deployment_models.json'
        try:
            config = json.loads(config_path.read_text(encoding='utf-8'))
        except (OSError, ValueError) as exc:
            raise AnalysisUnavailable('Model configuration could not be read: {}'.format(exc))

        if sklearn.__version__ != config['scikit_learn_version']:
            raise AnalysisUnavailable(
                'Analysis requires scikit-learn {}; this runtime has {}. '
                'Use the project-pinned Python environment.'.format(
                    config['scikit_learn_version'], sklearn.__version__
                )
            )

        artifacts = {}
        for task in ('binary', 'nfr'):
            model_path = root / config[task]['path']
            try:
                model_bytes = model_path.read_bytes()
            except OSError as exc:
                raise AnalysisUnavailable(
                    'The trusted {} model could not be read: {}'.format(task, exc)
                )
            digest = hashlib.sha256(model_bytes).hexdigest()
            if digest != config[task]['sha256']:
                raise AnalysisUnavailable(
                    'The bundled {} model failed its SHA-256 integrity check.'.format(task)
                )

            import joblib

            try:
                artifacts[task] = joblib.load(str(model_path))
            except (AttributeError, EOFError, ImportError, OSError, ValueError) as exc:
                raise AnalysisUnavailable(
                    'The {} model could not be loaded in the pinned environment: {}'.format(
                        task, exc
                    )
                )

        for task in ('binary', 'nfr'):
            try:
                artifacts[task].predict(['The system shall respond within two seconds.'])
            except (AttributeError, TypeError, ValueError, IndexError) as exc:
                raise AnalysisUnavailable(
                    'The {} model failed its startup prediction check: {}'.format(task, exc)
                )
        return cls(
            artifacts['binary'],
            artifacts['nfr'],
            {
                'binary': config['binary']['version'],
                'nfr': config['nfr']['version'],
            },
        )

    @property
    def metadata(self):
        return {
            'models': dict(self.model_versions),
            'rules': self.RULE_VERSION,
            'duplicate_threshold': self.DUPLICATE_THRESHOLD,
            'duplicate_threshold_status': 'provisional; requires annotated validation pairs',
        }

    def analyze(self, requirements):
        texts = [analysis_text(item['text']) for item in requirements]
        binary_labels = list(self.binary_model.predict(texts))
        if len(binary_labels) != len(requirements):
            raise ValueError('Binary model returned an incomplete prediction batch.')
        nfr_indexes = [
            index for index, label in enumerate(binary_labels)
            if str(label).upper() in ('NFR', 'NON-FUNCTIONAL', 'NONFUNCTIONAL')
        ]
        subtype_labels = {}
        if nfr_indexes:
            subtype_predictions = list(self.nfr_model.predict([texts[index] for index in nfr_indexes]))
            if len(subtype_predictions) != len(nfr_indexes):
                raise ValueError('NFR model returned an incomplete prediction batch.')
            subtype_labels = {
                index: str(label) for index, label in zip(nfr_indexes, subtype_predictions)
            }

        findings = []
        for index, requirement in enumerate(requirements):
            label = str(binary_labels[index]).upper()
            if label not in ('F', 'NFR', 'NON-FUNCTIONAL', 'NONFUNCTIONAL'):
                raise ValueError('Binary model returned unsupported label {!r}'.format(label))
            payload = {
                'suggested_label': 'NFR' if label in ('NFR', 'NON-FUNCTIONAL', 'NONFUNCTIONAL') else 'F',
                'suggested_subtype': subtype_labels.get(index),
                'label_is_suggestion': True,
            }
            findings.append({
                'kind': 'classification',
                'requirement_ids': [requirement['_id']],
                'sequence': requirement['sequence'],
                'payload': payload,
            })

            for flag in reqcheck_ml.ambiguity_flags(requirement['text']):
                findings.append({
                    'kind': 'ambiguity',
                    'requirement_ids': [requirement['_id']],
                    'sequence': requirement['sequence'],
                    'payload': flag,
                })

        duplicate_findings, duplicates_truncated = self._duplicate_findings(requirements)
        findings.extend(duplicate_findings)
        return findings, {
            'duplicate_candidate_count': len(duplicate_findings),
            'duplicate_candidates_truncated': duplicates_truncated,
            'classification_count': len(requirements),
            'ambiguity_count': sum(item['kind'] == 'ambiguity' for item in findings),
        }

    def _duplicate_findings(self, requirements):
        if len(requirements) < 2:
            return [], False
        vectorizer = TfidfVectorizer(ngram_range=(1, 2))
        try:
            texts = [analysis_text(item['text']) for item in requirements]
            matrix = vectorizer.fit_transform(texts)
        except ValueError as exc:
            if 'empty vocabulary' in str(exc):
                return [], False
            raise

        similarities = cosine_similarity(matrix, dense_output=True)
        findings = []
        truncated = False
        for left in range(len(requirements)):
            for right in range(left + 1, len(requirements)):
                score = float(similarities[left, right])
                if score < self.DUPLICATE_THRESHOLD:
                    continue
                if len(findings) >= self.MAX_DUPLICATE_FINDINGS:
                    truncated = True
                    return findings, truncated
                findings.append({
                    'kind': 'duplicate',
                    'requirement_ids': [
                        requirements[left]['_id'],
                        requirements[right]['_id'],
                    ],
                    'sequence': requirements[left]['sequence'],
                    'payload': {
                        'left_sequence': requirements[left]['sequence'],
                        'right_sequence': requirements[right]['sequence'],
                        'similarity': round(score, 6),
                        'threshold': self.DUPLICATE_THRESHOLD,
                        'threshold_status': 'provisional',
                        'interpretation': 'Lexical overlap is a review cue, not proof of equivalence.',
                        'constraint_differences': self._constraint_differences(texts[left], texts[right]),
                    },
                })
        return findings, truncated

    @staticmethod
    def _constraint_differences(left, right):
        differences = []
        number_pattern = r'\b\d+(?:\.\d+)?\b'
        if set(re.findall(number_pattern, left)) != set(re.findall(number_pattern, right)):
            differences.append('Numeric constraints differ; these statements may conflict rather than duplicate.')
        negation = r"\b(?:not|never|no|cannot|without)\b|n't\b"
        if bool(re.search(negation, left, re.I)) != bool(re.search(negation, right, re.I)):
            differences.append('Negation differs; verify that the intended behavior is not opposite.')
        return differences


def input_revision_hash(requirements):
    snapshot = [
        {
            'id': item['_id'],
            'sequence': item['sequence'],
            'revision': item['revision'],
            'text': item['text'],
        }
        for item in sorted(requirements, key=lambda value: (value['sequence'], value['_id']))
    ]
    encoded = json.dumps(snapshot, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(encoded.encode('utf-8')).hexdigest()
