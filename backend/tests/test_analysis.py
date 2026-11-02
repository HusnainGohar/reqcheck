import unittest
from pathlib import Path
from unittest.mock import patch


from backend.app.analysis import (
    AnalysisEngine,
    AnalysisUnavailable,
    input_revision_hash,
    analysis_text,
)


class FixedModel:
    def __init__(self, labels):
        self.labels = labels

    def predict(self, texts):
        return self.labels[:len(texts)]


class AnalysisEngineTests(unittest.TestCase):
    def setUp(self):
        self.requirements = [
            {
                '_id': 'r1',
                'sequence': 1,
                'revision': 1,
                'text': 'The service shall respond quickly.',
            },
            {
                '_id': 'r2',
                'sequence': 2,
                'revision': 1,
                'text': 'The service shall respond quickly.',
            },
        ]
        self.engine = AnalysisEngine(
            FixedModel(['NFR', 'F']),
            FixedModel(['PE']),
        )

    def test_analysis_returns_type_subtype_ambiguity_and_duplicate_cues(self):
        findings, summary = self.engine.analyze(self.requirements)
        classifications = [item for item in findings if item['kind'] == 'classification']
        ambiguities = [item for item in findings if item['kind'] == 'ambiguity']
        duplicates = [item for item in findings if item['kind'] == 'duplicate']

        self.assertEqual(classifications[0]['payload']['suggested_label'], 'NFR')
        self.assertEqual(classifications[0]['payload']['suggested_subtype'], 'PE')
        self.assertTrue(classifications[0]['payload']['label_is_suggestion'])
        self.assertEqual(ambiguities[0]['payload']['term'], 'quickly')
        self.assertEqual(
            self.requirements[0]['text'][ambiguities[0]['payload']['start']:ambiguities[0]['payload']['end']],
            'quickly',
        )
        self.assertEqual(duplicates[0]['payload']['similarity'], 1.0)
        self.assertEqual(summary['duplicate_candidate_count'], 1)

    def test_input_hash_is_order_independent_and_revision_sensitive(self):
        expected = input_revision_hash(self.requirements)
        self.assertEqual(input_revision_hash(list(reversed(self.requirements))), expected)
        changed = [dict(item) for item in self.requirements]
        changed[0]['revision'] = 2
        self.assertNotEqual(input_revision_hash(changed), expected)
        changed[0]['revision'] = 1
        changed[0]['text'] += ' Revised.'
        self.assertNotEqual(input_revision_hash(changed), expected)

    def test_model_loader_refuses_runtime_version_mismatch_before_deserialization(self):
        with patch('backend.app.analysis.sklearn.__version__', 'incompatible-test-runtime'):
            with self.assertRaisesRegex(AnalysisUnavailable, 'scikit-learn 0.22.2.post1'):
                AnalysisEngine.from_artifacts(Path(__file__).resolve().parents[2])

    def test_document_identifiers_do_not_distort_model_or_duplicate_input(self):
        self.assertEqual(analysis_text('RQ-123 The system\nshall save.'), 'The system shall save.')
        self.requirements[0]['text'] = 'RQ-001 The service shall respond quickly.'
        self.requirements[1]['text'] = 'RQ-085 The service shall respond quickly.'
        with patch.object(self.engine.binary_model, 'predict', wraps=self.engine.binary_model.predict) as predict:
            findings, _ = self.engine.analyze(self.requirements)
        self.assertEqual(predict.call_args[0][0][0], 'The service shall respond quickly.')
        duplicate = next(item for item in findings if item['kind'] == 'duplicate')
        self.assertEqual(duplicate['payload']['similarity'], 1.0)
        flag = next(item for item in findings if item['kind'] == 'ambiguity')
        self.assertEqual(self.requirements[0]['text'][flag['payload']['start']:flag['payload']['end']], 'quickly')

    def test_similar_statements_with_different_constraints_are_not_equated(self):
        self.requirements[0]['text'] = 'The system shall reject an uploaded file larger than 10 MiB before running analysis.'
        self.requirements[1]['text'] = 'The system shall reject an uploaded file larger than 20 MiB before running analysis.'
        findings, _ = self.engine.analyze(self.requirements)
        duplicate = next(item for item in findings if item['kind'] == 'duplicate')
        self.assertIn('Numeric constraints differ', duplicate['payload']['constraint_differences'][0])
        self.assertTrue(self.engine._constraint_differences('The service shall store data.', 'The service shall not store data.'))

    def test_ambiguity_supports_hyphenated_phrases_and_exact_original_offsets(self):
        self.requirements[0]['text'] = 'The workspace shall be user-friendly and easy to use when it is ready.'
        findings, _ = self.engine.analyze(self.requirements)
        flags = [f['payload'] for f in findings if f['kind'] == 'ambiguity' and f['sequence'] == 1]
        self.assertEqual([f['term'] for f in flags], ['user-friendly', 'easy to use', 'when it is ready'])
        for flag in flags:
            self.assertEqual(self.requirements[0]['text'][flag['start']:flag['end']], flag['term'])

    def test_incomplete_predictions_are_rejected_instead_of_truncated(self):
        self.engine.binary_model = FixedModel(['F'])
        with self.assertRaisesRegex(ValueError, 'incomplete prediction'):
            self.engine.analyze(self.requirements)
        self.engine.binary_model = FixedModel(['NFR', 'NFR'])
        with self.assertRaisesRegex(ValueError, 'incomplete prediction'):
            self.engine.analyze(self.requirements)


if __name__ == '__main__':
    unittest.main()
