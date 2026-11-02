import unittest

from backend.app.reports import render_html, render_csv


class ReportPresentationTests(unittest.TestCase):
    def setUp(self):
        self.payload = {
            'stale': False,
            'document': {'name': '<script>demo</script>$cost.txt', 'sha256': 'abc'},
            'run': {
                '_id': 'run-1', 'created_at': '2026-11-02T00:00:00Z',
                'input_revision_hash': 'revision-1', 'model_versions': {'binary': 'v1'},
                'rule_version': 'v1',
            },
            'requirements_by_id': {
                'r1': {'text': '<b>Source</b>', 'location': {'line': 1}},
            },
        }

    def test_self_contained_report_preserves_evidence_and_escapes_text(self):
        findings = [{
            '_id': 'f1', 'kind': 'classification', 'requirement_ids': ['r1'],
            'payload': {'suggested_label': 'NFR', 'suggested_subtype': 'Security'},
            'review': {'decision': 'correct', 'comment': '<script>note</script>',
                       'corrected_text': 'Hash passwords', 'corrected_label': 'NFR'},
        }]
        result = render_html(self.payload, findings, [{}], 'data:image/png;base64,test')
        for expected in (
            'data:font/ttf;base64,', 'data:image/png;base64,test',
            'Print / Save PDF', '1 findings', '1 reviewed', '0 awaiting review',
            '&lt;script&gt;demo&lt;/script&gt;$cost.txt', '&lt;b&gt;Source&lt;/b&gt;',
            '&lt;script&gt;note&lt;/script&gt;', 'Hash passwords', 'Security',
            'revision-1', 'run-1', 'scope="col"', 'data-label="Requirement text"',
            '@media print', '@media screen and (max-width:1000px)',
        ):
            self.assertIn(expected, result)
        self.assertNotIn('<script>', result)
        self.assertNotIn('fonts.googleapis', result)

    def test_empty_and_stale_states_remain_explicit(self):
        self.payload['stale'] = True
        result = render_html(self.payload, [], [], 'chart')
        self.assertIn('earlier input revision', result)
        self.assertIn('No findings in this analysis run.', result)
        self.assertIn('0 findings', result)
        self.assertIn('0 immutable reviewer event(s)', result)

    def test_duplicate_constraints_remain_visible_in_html_and_csv(self):
        finding = {
            '_id': 'f1', 'kind': 'duplicate', 'requirement_ids': ['r1'],
            'payload': {'similarity': 0.9, 'constraint_differences': ['Numeric constraints differ.']},
        }
        result = render_html(self.payload, [finding], [], 'chart')
        self.assertIn('Lexical similarity: 90.0%', result)
        self.assertIn('Numeric constraints differ.', result)
        self.payload['findings'] = [finding]
        csv = render_csv(self.payload)
        self.assertIn('duplicate_similarity,constraint_differences', csv)
        self.assertIn('Numeric constraints differ.', csv)
