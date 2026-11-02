import unittest

from backend.app.extraction import extract_document
from backend.app.segmentation import segment_blocks


class SegmentationTests(unittest.TestCase):
    def test_eight_pages_with_twelve_ids_each_produce_96_complete_statements(self):
        blocks = []
        for page in range(1, 9):
            lines = ['SPECIFICATION', 'Page {}'.format(page), '{}. Section'.format(page)]
            for number in range((page - 1) * 12 + 1, page * 12 + 1):
                lines.extend(['RQ-{:03} The system shall retain'.format(number), 'the original record.'])
            blocks.append({'page': page, 'text': '\n'.join(lines)})
        result = segment_blocks(blocks)
        self.assertEqual(len(result), 96)
        for number, item in enumerate(result, 1):
            self.assertEqual(item['source_id'], 'RQ-{:03}'.format(number))
            self.assertEqual(item['page'], (number - 1) // 12 + 1)
            self.assertEqual(item['text'], 'RQ-{:03} The system shall retain the original record.'.format(number))

    def test_identified_wrapped_pdf_statements_preserve_source_and_page(self):
        blocks = [
            {'page': 1, 'text': 'SPECIFICATION\nPage 1\n1. Accounts\n'
             'RQ-001 The system shall register\nusers.\nRQ-002 The session shall be\nexpired.'},
            {'page': 2, 'text': 'SPECIFICATION\nPage 2\n2. Sessions\n'
             'RQ-003 The system shall reject sessions that have\nexpired.\n'
             'RQ-004 The system shall preserve\naccount storage.'},
        ]
        result = segment_blocks(blocks)
        self.assertEqual(len(result), 4)
        self.assertEqual(result[0]['text'], 'RQ-001 The system shall register users.')
        self.assertEqual(result[0]['source_text'], 'RQ-001 The system shall register\nusers.')
        self.assertTrue(result[1]['text'].endswith('expired.'))
        self.assertTrue(result[2]['text'].endswith('expired.'))
        self.assertEqual(result[2]['page'], 2)
        self.assertEqual(result[2]['source_id'], 'RQ-003')
        self.assertNotIn('SPECIFICATION', ' '.join(x['text'] for x in result))

    def test_identified_statement_can_continue_across_pages(self):
        result = segment_blocks([
            {'page': 1, 'text': 'REQ-001 The service shall retain\nrecords'},
            {'page': 2, 'text': 'for seven years.\nREQ-002 The service shall encrypt records.'},
        ])
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]['text'], 'REQ-001 The service shall retain records for seven years.')
        self.assertEqual(result[0]['page'], 1)
        self.assertEqual(result[0]['page_end'], 2)

    def test_text_splits_explicit_lines_without_splitting_wrapped_clause(self):
        result, _ = extract_document('input.txt', (
            'The system shall save a record.\nThe system shall open a document\n'
            'within two seconds.\nThe user may export results.'
        ).encode('utf-8'))
        self.assertEqual(len(result), 3)
        self.assertEqual(result[1]['text'], 'The system shall open a document within two seconds.')

    def test_numbered_lists_split_and_unstructured_prose_is_retained(self):
        result = segment_blocks([{'text': '1. Store the file.\n2. Restore the file.', 'page': None}])
        self.assertEqual(len(result), 2)
        prose = segment_blocks([{'text': 'Unstructured description\ncontinued here.', 'page': None}])
        self.assertEqual(len(prose), 1)
        self.assertEqual(prose[0]['text'], 'Unstructured description\ncontinued here.')

    def test_docx_location_survives_segmentation(self):
        result = segment_blocks([{
            'text': 'ABC-001 A service shall save.\nABC-002 A service shall restore.',
            'page': None, 'paragraph': None, 'table': 2, 'row': 3, 'cell': 1,
        }])
        self.assertEqual(len(result), 2)
        self.assertEqual(result[1]['table'], 2)
        self.assertEqual(result[1]['row'], 3)
