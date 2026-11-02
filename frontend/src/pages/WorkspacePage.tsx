import * as React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from "../auth/AuthContext";
import { AccountMenu } from "../components/layout/AccountMenu";
import { Icon, iconPaths } from "../components/ui/Icon";
import { AnalysisPanel } from "../features/workspace/components/AnalysisPanel";
import { RequirementReview } from "../features/workspace/components/RequirementReview";
import { SourceDocuments } from "../features/workspace/components/SourceDocuments";
import { WorkspaceDialogs } from "../features/workspace/components/WorkspaceDialogs";
import { WorkspaceSummary } from "../features/workspace/components/WorkspaceSummary";
import { useWorkspace } from "../features/workspace/hooks/useWorkspace";
import { Session } from "../types/domain";
import { scrollToSection } from "../utils/workspace";

export function WorkspacePage() {
  const { session } = useAuth();
  if (!session) throw new Error("Workspace rendered without a session.");
  return <Workspace key={session.owner_id} session={session} />;
}

export function Workspace(props: { session: Session }) {
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    'upload-section': true, 'review-section': true, 'analysis-section': true
  });
  const [navigationTarget, setNavigationTarget] = React.useState('');
  function navigateSection(id: string) {
    if (id !== 'overview') setExpandedSections(function(previous) { return { ...previous, [id]: true }; });
    setNavigationTarget(id);
  }
  function toggleSection(id: string) {
    setExpandedSections(function(previous) { return { ...previous, [id]: !previous[id] }; });
  }
  const model = useWorkspace({ session: props.session, onNavigate: navigateSection });
  const {
    session, auth, projectId, documentId,
    showCreateProject, setShowCreateProject, confirmation, busy,
    loading, apiReady, analysisReady, analysisNotice,
    error, message, activeSection, setActiveSection,
    selectedProject, currentRun, unsavedCount, savingCount
  } = model;
  React.useEffect(function() {
    if (!navigationTarget || loading) return;
    setActiveSection(navigationTarget);
    if (navigationTarget !== 'overview') {
      const heading = document.querySelector<HTMLButtonElement>('#' + navigationTarget + ' .section-toggle');
      if (heading) heading.focus({ preventScroll: true });
    }
    scrollToSection(navigationTarget === 'overview' ? undefined : navigationTarget);
    setNavigationTarget('');
  }, [navigationTarget, loading, setActiveSection]);
  return <div className="app-shell">
    <ReactRouterDOM.Prompt when={busy || unsavedCount > 0 || savingCount > 0}
      message={function() {
        return busy ? false : 'Changes are not fully saved. Leave this page? Account drafts can be recovered; guest unsaved edits will be lost.';
      }} />
    <aside className="sidebar" aria-hidden={showCreateProject || Boolean(confirmation)}>
      <div className="brand">
        <div className="brand-mark"><Icon name="shield" size={23} /></div>
        <div className="brand-copy">
          <div className="brand-name">ReqCheck</div>
          <div className="brand-caption">Requirements workspace</div>
        </div>
      </div>
      <div className="nav-label">Workspace</div>
      <nav className="side-nav" aria-label="Workspace navigation">
        {([
          { id: 'overview', label: 'Overview', icon: 'overview' },
          { id: 'upload-section', label: 'Documents', icon: 'document' },
          { id: 'review-section', label: 'Text review', icon: 'edit' },
          { id: 'analysis-section', label: 'Analysis & reports', icon: 'chart' },
        ] as { id: string; label: string; icon: keyof typeof iconPaths }[]).map(function(item) {
          return <button key={item.id} type="button" className={'nav-item' + (activeSection === item.id ? ' active' : '')}
            aria-label={item.label} aria-current={activeSection === item.id ? 'location' : undefined}
            title={item.label} onClick={function() { navigateSection(item.id); }}>
            <Icon name={item.icon} /><span>{item.label}</span>
          </button>;
        })}
      </nav>
      <div className="sidebar-spacer"></div>
      <div className="sidebar-note">
        <div className="note-icon"><Icon name="shield" /></div>
        <strong>A human-first workflow</strong>
        <p>Suggestions support review. You remain responsible for requirement decisions.</p>
      </div>
      <div className="sidebar-footer">
        <div className="avatar"><Icon name="user" size={17} /></div>
        <div className="user-copy"><strong>{session.name || 'Guest'}</strong><div>{session.email || 'Not saved to an account'}</div></div>
      </div>
    </aside>
    <div className="workspace" aria-hidden={showCreateProject || Boolean(confirmation)}>
      <header className="topbar">
        <div className="breadcrumbs">Workspace <span>/</span> <strong>{selectedProject ? selectedProject.name : 'Overview'}</strong></div>
        <div className="topbar-right">
          <div className={'connection' + (apiReady ? ' ready' : '')}>
            <span className="connection-dot"></span>
            {apiReady ? 'API connected' : loading ? 'Connecting…' : 'API unavailable'}
          </div>
          <AccountMenu disabled={busy || unsavedCount > 0 || savingCount > 0} />
        </div>
      </header>
      <main className="page-content">
        {auth.error ? <div className="notice error" role="alert">{auth.error}</div> : null}
        <div className={'notice workspace-persistence ' + (session.kind === 'guest' ? 'warning' : '')} role="status">
          <Icon name="shield" />
          <span>{session.kind === 'guest'
            ? 'Guest workspace: temporary and isolated. Download results before ending this session. Work is deleted on explicit end or expiry within 24 hours; it cannot be retrieved from an account.'
            : 'Your projects, documents, edits and results are saved to your account. Sign in again to resume them.'}</span>
        </div>
        <div className="page-heading">
          <div>
            <div className="eyebrow">Requirements workspace</div>
            <h1>Review, analyze, and decide.</h1>
            <p className="page-subtitle">Import a specification, repair extracted statements, explore explainable suggestions, and keep an evidence-linked review record.</p>
          </div>
          <button type="button" className="primary-button" disabled={busy || unsavedCount > 0 || savingCount > 0} onClick={function() { setShowCreateProject(true); }}><Icon name="plus" />New project</button>
        </div>
        <div className="steps-card" aria-label="Workflow progress">
          <div className={'step' + (projectId ? ' complete' : ' current')}><div className="step-number"><Icon name={projectId ? 'check' : 'folder'} size={17} /></div><div className="step-copy"><strong>Project</strong><span>Organize your work</span></div></div>
          <div className={'step' + (documentId ? ' complete' : projectId ? ' current' : '')}><div className="step-number"><Icon name={documentId ? 'check' : 'document'} size={17} /></div><div className="step-copy"><strong>Document</strong><span>Extract and correct</span></div></div>
          <div className={'step' + (currentRun ? ' complete' : documentId ? ' current' : '')}><div className="step-number"><Icon name={currentRun ? 'check' : 'chart'} size={17} /></div><div className="step-copy"><strong>Analyze & review</strong><span>Decide and export</span></div></div>
        </div>
        {!analysisReady && apiReady ? (
          <div className="notice warning" role="status">
            <Icon name="warning" />
            <strong>Analysis is unavailable in this runtime.</strong>
            <span>{analysisNotice || 'Start the API with the project-pinned Python and scikit-learn versions to load its verified models. Upload and text review remain available.'}</span>
          </div>
        ) : null}
        {error ? <div className="notice error" role="alert"><Icon name="warning" /><span>{error}</span></div> : null}
        {message ? <div className="notice success" role="status" key={message}><Icon name="check" /><span>{message}</span></div> : null}
        {loading ? <div className="card card-pad loading" role="status"><span className="spinner" aria-hidden="true" />Loading your workspace…</div> : (
          <div className="content-grid">
            <div className="main-column">
              <SourceDocuments model={model} expanded={expandedSections['upload-section']} onToggle={function() { toggleSection('upload-section'); }} />
              <RequirementReview model={model} expanded={expandedSections['review-section']} onToggle={function() { toggleSection('review-section'); }} />
              <AnalysisPanel model={model} expanded={expandedSections['analysis-section']} onToggle={function() { toggleSection('analysis-section'); }} />

            </div>
            <WorkspaceSummary model={model} />

          </div>
        )}
      </main>
    </div>
    <WorkspaceDialogs model={model} />

  </div>
    ;
}
