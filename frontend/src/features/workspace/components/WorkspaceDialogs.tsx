import * as React from 'react';
import { Icon } from "../../../components/ui/Icon";
import { WorkspaceModel } from "../hooks/useWorkspace";

export function WorkspaceDialogs({ model }: { model: WorkspaceModel }) {
  const {
    projectName, setProjectName, projectDescription, setProjectDescription,
    showCreateProject, setShowCreateProject, confirmation, setConfirmation,
    deleteDocumentText, setDeleteDocumentText, busy, handleDialogKeyDown,
    createProject, confirmAction
  } = model;

  return <>{showCreateProject ? (
    <div className="modal-backdrop" onMouseDown={function(event) { if (event.target === event.currentTarget && !busy) setShowCreateProject(false); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="new-project-heading"
        onKeyDown={handleDialogKeyDown}>
        <div className="modal-header"><div><h2 id="new-project-heading">Create a project</h2><p>Keep related documents and analysis runs together.</p></div>
          <button type="button" className="icon-button" disabled={busy} onClick={function() { setShowCreateProject(false); }} aria-label="Close dialog"><Icon name="close" /></button></div>
        <form onSubmit={createProject}>
          <label className="field-label" htmlFor="new-project-name">Project name</label>
          <input id="new-project-name" className="text-input" required maxLength={120} value={projectName}
            onChange={function(event) { setProjectName(event.target.value); }} placeholder="e.g. Mobile banking app" />
          <label className="field-label" htmlFor="new-project-description">Description (optional)</label>
          <textarea id="new-project-description" className="textarea" maxLength={1000} value={projectDescription}
            onChange={function(event) { setProjectDescription(event.target.value); }} />
          <div className="modal-actions"><button type="button" className="secondary-button" disabled={busy} onClick={function() { setShowCreateProject(false); }}>Cancel</button>
            <button type="submit" className="primary-button" disabled={busy || !projectName.trim()}>{busy ? 'Creating…' : 'Create project'}</button></div>
        </form>
      </section>
    </div>
  ) : null}
    {confirmation ? (
      <div className="modal-backdrop" onMouseDown={function(event) {
        if (event.target === event.currentTarget && !busy) setConfirmation(null);
      }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="confirmation-heading"
          onKeyDown={handleDialogKeyDown}>
          <div className="modal-header">
            <div>
              <h2 id="confirmation-heading">
                {confirmation.kind === 'switch-project' ? 'Switch projects?' :
                  confirmation.kind === 'switch-document' ? 'Discard unsaved edits?' :
                    confirmation.kind === 'upload-document' ? 'Upload and discard unsaved edits?' :
                      confirmation.kind === 'delete-requirement' ? 'Remove this requirement?' : 'Delete this document?'}
              </h2>
              <p>
                {confirmation.kind === 'switch-project' ? 'Your unsaved changes will be lost if you switch projects.' :
                  confirmation.kind === 'switch-document' ? 'Your unsaved changes will be lost if you switch documents.' :
                    confirmation.kind === 'upload-document' ? 'Your unsaved changes will be lost when the new document is opened.' :
                      confirmation.kind === 'delete-requirement' ? 'This removes the statement from the active review list. Existing analysis runs remain traceable.' :
                        'This permanently removes the document, extracted statements, analysis runs and review events.'}
              </p>
            </div>
            <button type="button" className="icon-button" disabled={busy}
              onClick={function() { setConfirmation(null); }} aria-label="Close dialog"><Icon name="close" /></button>
          </div>
          {confirmation.kind === 'delete-document' ? (
            <div>
              <p className="confirmation-file-name">{confirmation.document.original_name}</p>
              <label className="field-label" htmlFor="document-delete-confirm">
                Type the filename exactly to confirm
                </label>
              <input id="document-delete-confirm" className="text-input" value={deleteDocumentText}
                onChange={function(event) { setDeleteDocumentText(event.target.value); }}
                autoComplete="off" />
            </div>
          ) : null}
          <div className="modal-actions">
            <button type="button" className="secondary-button" disabled={busy}
              onClick={function() { setConfirmation(null); }}>Cancel</button>
            <button type="button" className={confirmation.kind === 'delete-requirement'
              || confirmation.kind === 'delete-document' ? 'danger-button' : 'primary-button'}
              disabled={busy || (confirmation.kind === 'delete-document'
                && deleteDocumentText !== confirmation.document.original_name)}
              onClick={confirmAction}>
              {busy ? 'Please wait…' :
                confirmation.kind === 'switch-document' ? 'Discard & switch' :
                  confirmation.kind === 'switch-project' ? 'Discard & switch project' :
                    confirmation.kind === 'upload-document' ? 'Discard & upload' :
                      confirmation.kind === 'delete-requirement' ? 'Remove requirement' : 'Delete document'}
            </button>
          </div>
        </section>
      </div>
    ) : null}  </>;
}
