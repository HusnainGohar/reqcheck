import csv
import base64
import html
import io
import json
import re
from collections import Counter
from functools import lru_cache
from pathlib import Path
from string import Template


@lru_cache(maxsize=1)
def _report_template():
    assets = Path(__file__).resolve().parents[2] / 'frontend' / 'vendor'
    template = Path(__file__).with_name('report.html').read_text(encoding='utf-8')
    return Template(template).safe_substitute(
        inter=base64.b64encode((assets / 'inter.ttf').read_bytes()).decode('ascii'),
        mono=base64.b64encode((assets / 'jetbrains-mono.ttf').read_bytes()).decode('ascii'),
    )


def _formula_safe(value):
    text = '' if value is None else str(value)
    if re.match(r'^\s*[=+\-@]', text):
        return "'" + text
    return text


def report_payload(run, findings, reviews, document, requirements, stale):
    latest_reviews = {}
    for event in reviews:
        latest_reviews[event['finding_id']] = event
    enriched = []
    for finding in findings:
        item = dict(finding)
        item['review'] = latest_reviews.get(finding['_id'])
        enriched.append(item)
    return {
        'run': run,
        'document': {
            'id': document['_id'],
            'name': document['original_name'],
            'sha256': document['sha256'],
        },
        'stale': stale,
        'findings': enriched,
        'requirements_by_id': {
            item['_id']: {
                'sequence': item['sequence'],
                'text': item['text'],
                'source_text': item.get('source_text', item['text']),
                'location': item.get('location'),
            }
            for item in requirements
        },
    }


def render_json(payload):
    return json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True)


def render_csv(payload):
    output = io.StringIO(newline='')
    writer = csv.writer(output)
    writer.writerow([
        'finding_id', 'kind', 'requirement_ids', 'sequences', 'suggestion',
        'subtype', 'review_decision', 'corrected_label', 'corrected_text', 'comment',
        'source_texts', 'source_locations', 'source_document', 'document_sha256',
        'analysis_run_id', 'input_revision_hash', 'stale',
        'duplicate_similarity', 'constraint_differences',
    ])
    findings = payload['findings']
    requirement_by_id = payload.get('requirements_by_id', {})
    for finding in findings:
        ids = finding['requirement_ids']
        requirements = [requirement_by_id.get(identifier, {}) for identifier in ids]
        details = finding.get('payload', {})
        review = finding.get('review') or {}
        row = [
            finding['_id'],
            finding['kind'],
            ';'.join(ids),
            ';'.join(str(item.get('sequence', '')) for item in requirements),
            details.get('suggested_label', details.get('term', '')),
            details.get('suggested_subtype', ''),
            review.get('decision', ''),
            review.get('corrected_label', ''),
            review.get('corrected_text', ''),
            review.get('comment', ''),
            '; '.join(item.get('text', '') for item in requirements),
            '; '.join(json.dumps(item.get('location') or {}, sort_keys=True) for item in requirements),
            payload['document']['name'],
            payload['document']['sha256'],
            payload['run']['_id'],
            payload['run']['input_revision_hash'],
            payload['stale'],
            details.get('similarity', ''),
            '; '.join(details.get('constraint_differences', [])),
        ]
        writer.writerow([_formula_safe(value) for value in row])
    return output.getvalue()


def render_html(payload, findings, reviews, chart_url):
    counts = Counter(item['kind'] for item in findings)
    rows = []
    for finding in findings:
        details = finding.get('payload', {})
        review = finding.get('review') or {}
        review_detail = ' · '.join(
            value for value in (
                review.get('corrected_label') or '',
                review.get('corrected_text') or '',
                review.get('comment') or '',
            ) if value
        )
        source_items = [
            payload['requirements_by_id'].get(identifier, {})
            for identifier in finding['requirement_ids']
        ]
        source_text = ' | '.join(item.get('text', '') for item in source_items)
        locations = ' | '.join(
            json.dumps(item.get('location') or {}, sort_keys=True) for item in source_items
        )
        suggestion = str(details.get('suggested_label', details.get('term', '')))
        if finding['kind'] == 'duplicate':
            suggestion = 'Lexical similarity: {:.1%}'.format(details.get('similarity', 0))
        warnings = ''.join(
            '<p class="warning">{}</p>'.format(html.escape(value))
            for value in details.get('constraint_differences', [])
        )
        rows.append(
            '<tr><td data-label="Kind">{}</td><td data-label="Requirement IDs">{}</td>'
            '<td data-label="Suggestion / cue">{}</td><td data-label="Requirement text">{}</td>'
            '<td data-label="Source locations">{}</td><td data-label="Decision"><span class="badge">{}</span></td>'
            '<td data-label="Review detail">{}</td></tr>'.format(
                html.escape(finding['kind'].replace('_', ' ').title()),
                html.escape(', '.join(str(value) for value in finding['requirement_ids'])),
                html.escape(suggestion) + warnings +
                ('<br><span class="muted">{}</span>'.format(html.escape(str(details['suggested_subtype'])))
                 if details.get('suggested_subtype') else ''),
                html.escape(source_text),
                html.escape(locations),
                html.escape(str(review.get('decision', 'Not reviewed'))),
                html.escape(review_detail) if review_detail else '<span class="muted">No review detail recorded.</span>',
            )
        )
    warning = (
        '<p class="warning"><strong>Earlier input revision.</strong> This report is based on an earlier input revision. '
        'Re-run the analysis to include current edits.</p>'
        if payload['stale'] else ''
    )
    run = payload['run']
    document = payload['document']
    reviews_count = len(reviews)
    return Template(_report_template()).substitute(
        warning=warning,
        document=html.escape(document['name']),
        sha=html.escape(document['sha256']),
        run_id=html.escape(run['_id']),
        created=html.escape(run['created_at']),
        input_hash=html.escape(run['input_revision_hash']),
        models=html.escape(json.dumps(run['model_versions'], sort_keys=True)),
        rules=html.escape(run['rule_version']),
        stats=''.join(
            '<div class="stat"><strong>{}</strong><span>{}</span></div>'.format(
                int(counts.get(kind, 0)), html.escape(kind.replace('_', ' ').title())
            )
            for kind in ('classification', 'ambiguity', 'duplicate')
        ),
        review_count=reviews_count,
        finding_count=len(findings),
        reviewed_count=sum(1 for finding in findings if finding.get('review')),
        pending_count=sum(1 for finding in findings if not finding.get('review')),
        threshold=html.escape(str(run.get('duplicate_threshold', 'not recorded'))),
        threshold_status=html.escape(str(run.get('duplicate_threshold_status', ''))),
        chart=html.escape(chart_url),
        rows=''.join(rows) if rows else '<tr><td colspan="7">No findings in this analysis run. Source revision details remain available above.</td></tr>',
    )
