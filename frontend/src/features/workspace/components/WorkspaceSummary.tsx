import * as React from 'react';
import { WorkspaceModel } from "../hooks/useWorkspace";

export function WorkspaceSummary({ model }: { model: WorkspaceModel }) {
  const {
    session, requirements, runs, selectedProject,
    selectedDocument, unsavedCount
  } = model;

  return <><aside className="right-column" aria-label="Workspace status">
    <section className="card summary-card">
      <div className="summary-top"><h3>Workspace snapshot</h3></div>
      <div className="summary-number">{requirements.length}</div>
      <div className="summary-label">active requirement statements</div>
      <div className="summary-divider"></div>
      <div className="summary-line"><span>Project</span><strong title={selectedProject ? selectedProject.name : ''}>{selectedProject ? selectedProject.name : 'Not selected'}</strong></div>
      <div className="summary-line"><span>Document</span><strong title={selectedDocument ? selectedDocument.original_name : ''}>{selectedDocument ? selectedDocument.original_name : 'Not uploaded'}</strong></div>
      <div className="summary-line"><span>Unsaved edits</span><strong>{unsavedCount ? unsavedCount : 'All saved'}</strong></div>
      <div className="summary-line"><span>Analysis runs</span><strong>{runs.length}</strong></div>
    </section>
    <div className="tip-card"><div className="tip-heading">Review tip</div><p>PDF line and column layout may affect extraction. Check text carefully, then save corrections before running an analysis.</p></div>
    <div className="security-line">{session.kind === 'guest' ? 'Temporary uploads and processing records are deleted on session end or expiry. Download any reports you need before leaving.' : 'Only your signed-in account can access your projects and results. This local prototype is not a substitute for a production deployment security assessment.'}</div>
  </aside>  </>;
}
