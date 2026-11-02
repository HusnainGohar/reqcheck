"""Conservative statement boundaries, independent of the extraction format."""
import re
from collections import Counter


IDENTIFIER = re.compile(r'^\s*(?:\[\s*)?((?:[A-Z]{1,12}[-_])+\d+(?:[.-]\d+)*)(?:\s*\])?[.:)]?\s+', re.I)
LIST_ITEM = re.compile(r'^\s*(?:[-*\u2022]|\d+[.)])\s+')
MODAL = re.compile(r'\b(?:shall|must|should|will|may)\b', re.I)
PAGE_NUMBER = re.compile(r'^\s*(?:page\s+)?\d+(?:\s+(?:of|/)\s+\d+)?\s*$', re.I)
HEADING = re.compile(r'^\s*\d+(?:\.\d+)*[.)]?\s+\S')


def _is_heading(line):
    return bool(HEADING.match(line) and not MODAL.search(line) and
                not line.rstrip().endswith(('.', ';', ':')))


def segment_blocks(blocks):
    """Keep ambiguous prose intact; split only explicit IDs, lists or modal lines."""
    page_lines = [
        set(line.strip() for line in block['text'].splitlines()[:3] if line.strip())
        for block in blocks if block.get('page') is not None
    ]
    repeated = Counter(line for lines in page_lines for line in lines)
    furniture = {
        line for line, count in repeated.items()
        if count >= 2 and not IDENTIFIER.match(line) and not MODAL.search(line)
        and not line.endswith(('.', ';', ':'))
    }
    identified = sum(bool(IDENTIFIER.match(line))
                     for block in blocks for line in block['text'].splitlines()) >= 2
    result = []
    current = None
    parts = []

    def finish():
        if current is not None and parts:
            raw = '\n'.join(parts).strip()
            current['source_text'] = raw
            current['text'] = (re.sub(r'\s+', ' ', raw).strip()
                               if identified or LIST_ITEM.match(raw) or MODAL.search(raw) else raw)
            result.append(dict(current))

    for block in blocks:
        lines = block['text'].splitlines()
        if not identified:
            finish()
            current, parts = None, []
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            if block.get('page') is not None and (
                    stripped in furniture or PAGE_NUMBER.fullmatch(stripped)):
                continue
            marker = IDENTIFIER.match(line)
            if identified:
                if marker:
                    finish()
                    current, parts = dict(block), []
                    current['source_id'] = marker.group(1)
                elif _is_heading(stripped):
                    finish()
                    current, parts = None, []
                    continue
                if current is None:
                    continue
            else:
                starts_statement = (LIST_ITEM.match(line) is not None or
                                    (MODAL.search(line) and (not parts or
                                     parts[-1].rstrip().endswith(('.', ';')))))
                if starts_statement:
                    finish()
                    current, parts = dict(block), []
                if current is None:
                    current = dict(block)
            parts.append(line)
            if block.get('page') is not None and current.get('page') != block['page']:
                current['page_end'] = block['page']
        if not identified:
            finish()
            current, parts = None, []
    finish()
    return result
