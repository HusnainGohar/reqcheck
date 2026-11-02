import * as React from 'react';
import { API } from "../../../api/http";
import { ChartCard } from "../../../components/ui/ChartCard";
import { EmptyState } from "../../../components/ui/EmptyState";
import { CollapsibleSection, SectionDisclosure } from "../../../components/ui/CollapsibleSection";
import { Icon } from "../../../components/ui/Icon";
import { FindingCard } from "../../analysis/FindingCard";
import { WorkspaceModel } from "../hooks/useWorkspace";

export function AnalysisPanel({ model, expanded, onToggle }: { model: WorkspaceModel } & SectionDisclosure) {
  const {
    documentId, requirements, runs, currentRunId,
    setCurrentRunId, findings, runRequirements, reviewRevision,
    findingTotal, findingPage, setFindingPage, findingKind,
    setFindingKind, busy, analysisReady, findingsLoading, findingsError, retryFindings,
    currentRun, unsavedCount, totalFindingPages, runAnalysis,
    reviewFinding
  } = model;

  return <><CollapsibleSection id="analysis-section" headingId="analysis-heading" title="Analysis & reviewer decisions"
    description="Classification suggestions, lexical duplicate candidates and ambiguity review cues."
    expanded={expanded} onToggle={onToggle}
    actions={<button type="button" className="primary-button" disabled={!documentId || !requirements.length || unsavedCount > 0 || busy || !analysisReady}
      onClick={runAnalysis}>{busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="play" />}{busy ? 'Working…' : 'Run analysis'}</button>}>
    {unsavedCount ? <div className="notice warning">Corrections save automatically after typing pauses. Resolve save failures before analysis; each run uses an exact saved revision.</div> : null}
    {!currentRun ? (
      <div>
        <EmptyState icon="chart" title="Your analysis will appear here" description={documentId ? 'Review extracted statements, then choose Run analysis to see suggestions, quality cues and reviewer controls.' : 'Create a project and upload a document to unlock analysis. No predictions have been generated yet.'} />
        <div className="chart-grid">
          <ChartCard title="Classification suggestions" alt="Classification chart placeholder" />
          <ChartCard title="NFR subtype suggestions" alt="NFR chart placeholder" />
          <ChartCard title="Reviewer decisions" alt="Reviewer chart placeholder" />
          <ChartCard title="Quality review cues" alt="Quality chart placeholder" />
        </div>
        <EmptyState icon="download" title="No reports to download yet" description="After analysis, export CSV or JSON, or open a printable report. Account users can retrieve previous runs from Analysis history." />
      </div>
    ) : (
        <>
          {currentRun.stale ? <div className="notice warning">This analysis is based on an earlier input revision. Run analysis again to include recent edits.</div> : null}
          <div className="run-summary">
            <div><span>Run</span><strong>{new Date(currentRun.created_at).toLocaleString()}</strong></div>
            <div><span>Findings</span><strong>{currentRun.findings_count}</strong></div>
            <div><span>Input SHA-256</span><strong className="hash-text">{currentRun.input_revision_hash.slice(0, 16)}…</strong></div>
            <label className="field-label" htmlFor="run-history">Analysis history</label>
            <select id="run-history" className="select-input" value={currentRunId}
              onChange={function(event) { setCurrentRunId(event.target.value); }}>
              {runs.filter(function(run) { return run.status === 'complete'; }).map(function(run) {
                return <option value={run.id} key={run.id}>{new Date(run.created_at).toLocaleString()}{run.stale ? ' · stale' : ''}</option>;
              })}
            </select>
          </div>
          <div className="report-actions">
            <a className="secondary-button" href={API + '/analysis-runs/' + encodeURIComponent(currentRunId) + '/report?format=html'} target="_blank" rel="noreferrer"><Icon name="document" />Open printable report</a>
            <a className="secondary-button" href={API + '/analysis-runs/' + encodeURIComponent(currentRunId) + '/report?format=csv'}><Icon name="download" />Download CSV</a>
            <a className="secondary-button" href={API + '/analysis-runs/' + encodeURIComponent(currentRunId) + '/report?format=json'}><Icon name="download" />Download JSON</a>
          </div>
          <div className="chart-grid">
            <ChartCard title="Suggested functional / non-functional distribution" src={API + '/analysis-runs/' + encodeURIComponent(currentRunId) + '/charts/classification.png'} alt="Suggested requirement classification chart" />
            <ChartCard title="NFR subtype suggestions · exploratory" src={API + '/analysis-runs/' + encodeURIComponent(currentRunId) + '/charts/nfr.png'} alt="Exploratory suggested NFR subtype chart" />
            <ChartCard title="Reviewer decisions" src={API + '/analysis-runs/' + encodeURIComponent(currentRunId) + '/charts/review.png?revision=' + reviewRevision} alt="Reviewer decision chart" />
            <ChartCard title="Quality cues · not confirmed defects" src={API + '/analysis-runs/' + encodeURIComponent(currentRunId) + '/charts/flags.png'} alt="Ambiguity and duplicate review cue counts" />
          </div>
          <div className="finding-tabs" role="tablist" aria-label="Finding type">
            {(['classification', 'duplicate', 'ambiguity'] as const).map(function(kind) {
              return <button type="button" role="tab" aria-selected={findingKind === kind}
                id={'finding-tab-' + kind} aria-controls="finding-results"
                tabIndex={findingKind === kind ? 0 : -1}
                className={findingKind === kind ? 'finding-tab active' : 'finding-tab'}
                key={kind} onKeyDown={function(event) {
                  const tabs = Array.from(event.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
                  const index = tabs.indexOf(event.currentTarget);
                  const target = event.key === 'ArrowRight' ? (index + 1) % tabs.length :
                    event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length :
                    event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
                  if (target >= 0) { event.preventDefault(); tabs[target].focus(); }
                }}
                onClick={function() { if (findingKind !== kind) { setFindingKind(kind); setFindingPage(1); } }}>
                {kind === 'classification' ? 'Classification' : kind === 'duplicate' ? 'Possible duplicates' : 'Ambiguity cues'}
              </button>;
            })}
          </div>
          <div id="finding-results" role="tabpanel" aria-labelledby={'finding-tab-' + findingKind}
            tabIndex={0} aria-busy={findingsLoading} className="finding-results">
          <div className="findings-meta" role="status">{findingsLoading ? 'Loading ' + findingKind + ' findings…' :
            findingsError ? 'Findings could not be refreshed.' :
            findingTotal + ' ' + findingKind + ' finding(s) · reviewer decisions are append-only'}</div>
          {findingsError ? <div className="notice error" role="alert">
            <span>{findingsError}</span><button type="button" className="secondary-button" onClick={retryFindings}>Retry findings</button>
          </div> : null}
          <div className="finding-results-body">
          {findingsLoading ? <div className="finding-skeleton" aria-hidden="true"><div /><div /><div /></div> : findings.length ? <div className="finding-page-content" key={currentRunId + findingKind + findingPage}>{findings.map(function(finding) {
            return <FindingCard key={finding.id} finding={finding} requirements={runRequirements}
              busy={busy} onReview={reviewFinding} />;
          })}</div> : !findingsError ? <EmptyState icon="check" title={findingKind === 'duplicate' ? 'No duplicate candidates' : findingKind === 'ambiguity' ? 'No ambiguity cues' : 'No classification findings'}
            description="No items of this type were returned for this page. This is not proof of defect-free requirements; you can still review the text or select another finding type." /> : null}
          </div>
          <div className="pagination">
            <button className="secondary-button" type="button" disabled={findingsLoading || Boolean(findingsError) || findingPage <= 1}
              onClick={function() { setFindingPage(findingPage - 1); }}><span className="previous-icon"><Icon name="arrow" /></span>Previous</button>
            <span>{findingsLoading ? 'Loading page ' + findingPage : findingsError ? 'Page unavailable' : 'Page ' + findingPage + ' of ' + totalFindingPages}</span>
            <button className="secondary-button" type="button" disabled={findingsLoading || Boolean(findingsError) || findingPage >= totalFindingPages}
              onClick={function() { setFindingPage(findingPage + 1); }}>Next<Icon name="arrow" /></button>
          </div>
          </div>
          <p className="caveat-copy">Duplicate threshold is provisional; lexical overlap does not establish semantic equivalence. Classification scores are suggestions and not calibrated probabilities. Do not treat exploratory subtype output as validated performance.</p>
        </>
      )}
  </CollapsibleSection>  </>;
}
