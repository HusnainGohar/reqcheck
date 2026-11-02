import * as React from 'react';
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { Finding, Requirement, ReviewPayload } from "../../types/domain";
import { locationLabel } from "../../utils/workspace";
import { useReviewHistory } from './useReviewHistory';

export function FindingCard(props: {
  finding: Finding;
  requirements: Requirement[];
  onReview: (findingId: string, payload: ReviewPayload) => Promise<boolean>;
  busy: boolean;
}) {
  const [comment, setComment] = React.useState('');
  const [correctedLabel, setCorrectedLabel] = React.useState('F');
  const [correctedText, setCorrectedText] = React.useState('');
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const finding = props.finding;
  const { history, historyError, historyLoading } = useReviewHistory(finding, historyOpen);
  const matched = finding.requirement_ids
    .map(function(id) { return props.requirements.find(function(item) { return item.id === id; }); })
    .filter(function(item): item is Requirement { return Boolean(item); });
  const heading = finding.kind === 'classification'
    ? 'Requirement ' + finding.sequence
    : finding.kind === 'ambiguity'
      ? 'Ambiguity cue · Requirement ' + finding.sequence
      : 'Possible duplicate · ' + matched.map(function(item) { return '#' + item.sequence; }).join(' and ');
  const review = finding.latest_review;

  function decide(decision: 'accept' | 'dismiss' | 'correct') {
    const payload: ReviewPayload = { decision: decision, comment: comment };
    if (decision === 'correct') {
      if (finding.kind === 'classification') payload.corrected_label = correctedLabel;
      else payload.corrected_text = correctedText.trim();
    }
    props.onReview(finding.id, payload).then(function(saved) {
      if (saved) {
        setComment('');
        setCorrectedText('');
      }
    });
  }

  return (
    <article className="finding-card">
      <div className="finding-head">
        <div>
          <div className="finding-kicker">{finding.kind.replace('_', ' ')}</div>
          <h3>{heading}</h3>
        </div>
        <span className={'review-badge ' + (review ? review.decision : 'pending')}>
          {review ? 'Reviewed · ' + review.decision : 'Needs review'}
        </span>
      </div>
      {finding.kind === 'classification' ? (
        <div className="suggestion-block">
          <span>Model suggestion</span>
          <strong>{finding.payload.suggested_label === 'F' ? 'Functional' :
            finding.payload.suggested_label === 'NFR' ? 'Non-functional' : finding.payload.suggested_label}</strong>
          {finding.payload.suggested_subtype ? (
            <span className="subtype-label">{finding.payload.suggested_subtype} · exploratory subtype</span>
          ) : null}
          <p>Suggestion only; this is not a calibrated confidence score or confirmed label.</p>
        </div>
      ) : finding.kind === 'ambiguity' ? (
        <div className="finding-explanation">
          <strong>{finding.payload.rule === 'UNDEFINED_TRIGGER' ? 'Undefined trigger' : 'Vague wording cue'}: “{finding.payload.term}”</strong>
          <p>{finding.payload.suggestion}</p>
          <span>A review prompt, not proof that the requirement is defective.</span>
        </div>
      ) : (
            <div className="finding-explanation">
              <strong>Lexical similarity: {((finding.payload.similarity || 0) * 100).toFixed(1)}%</strong>
              <p>{finding.payload.interpretation}</p>
              <span>Threshold {finding.payload.threshold} is provisional and needs annotated validation.</span>
              {(finding.payload.constraint_differences || []).map(function(warning) {
                return <p className="notice warning" key={warning}>{warning}</p>;
              })}
            </div>
          )}
      <div className="finding-sources">
        {matched.map(function(item) {
          return (
            <div className="finding-source" key={item.id}>
              <span>#{item.sequence} · {locationLabel(item.location)}</span>
              <p>{item.text}</p>
            </div>
          );
        })}
      </div>
      {review ? (
        <div className="review-history-entry">
          <strong>Latest decision: {review.decision}</strong>
          {review.corrected_label ? <span> · corrected label: {review.corrected_label}</span> : null}
          {review.corrected_text ? <p>{review.corrected_text}</p> : null}
          {review.comment ? <p>{review.comment}</p> : null}
        </div>
      ) : null}
      <div className="review-history">
        <button type="button" className="ghost-button" aria-expanded={historyOpen}
          aria-controls={'history-' + finding.id}
          onClick={function() { setHistoryOpen(!historyOpen); }}>
          <Icon name="clock" size={15} />Reviewer decision history
        </button>
        <div id={'history-' + finding.id} hidden={!historyOpen}>
          {historyLoading ? <p role="status">Loading review history…</p> : null}
          {historyError ? <p className="history-error" role="alert">{historyError}</p> : null}
          {!historyLoading && !historyError && historyOpen ? (
            history.length ? history.map(function(event) {
              return <div className="review-history-entry" key={event.id}>
                <strong>{event.decision} · {new Date(event.created_at).toLocaleString()}</strong>
                {event.corrected_label ? <p>Corrected label: {event.corrected_label}</p> : null}
                {event.corrected_text ? <p>{event.corrected_text}</p> : null}
                {event.comment ? <p>{event.comment}</p> : null}
              </div>;
            }) : <EmptyState icon="clock" title="No reviewer decisions yet"
              description="Accept, dismiss or correct this finding to start its traceable review history." />
          ) : null}
        </div>
      </div>
      <div className="finding-review-controls">
        <label className="sr-only" htmlFor={'review-comment-' + finding.id}>Review note</label>
        <input
          id={'review-comment-' + finding.id}
          className="text-input"
          value={comment}
          maxLength={2000}
          onChange={function(event) { setComment(event.target.value); }}
          placeholder="Optional reviewer note"
        />
        {finding.kind === 'classification' ? (
          <select
            className="select-input correction-select"
            value={correctedLabel}
            onChange={function(event) { setCorrectedLabel(event.target.value); }}
            aria-label="Corrected requirement classification"
          >
            <option value="F">Functional</option>
            <option value="NFR">Non-functional</option>
          </select>
        ) : (
            <input
              className="text-input"
              value={correctedText}
              maxLength={10000}
              onChange={function(event) { setCorrectedText(event.target.value); }}
              placeholder="Corrected wording for the review record"
              aria-label="Corrected wording"
            />
          )}
        <div className="finding-actions">
          <button type="button" className="secondary-button" disabled={props.busy}
            onClick={function() { decide('accept'); }}><Icon name="check" />Accept</button>
          <button type="button" className="ghost-button" disabled={props.busy}
            onClick={function() { decide('dismiss'); }}><Icon name="close" />Dismiss</button>
          <button type="button" className="primary-button" disabled={props.busy ||
            (finding.kind === 'classification' ? !correctedLabel : !correctedText.trim())}
            onClick={function() { decide('correct'); }}><Icon name="edit" />Correct</button>
        </div>
      </div>
    </article>
  );
}
