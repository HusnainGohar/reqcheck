import * as React from 'react';
import { EmptyState } from "../../../components/ui/EmptyState";
import { CollapsibleSection, SectionDisclosure } from "../../../components/ui/CollapsibleSection";
import { Icon } from "../../../components/ui/Icon";
import { DocumentUpload } from '../../documents/DocumentUpload';
import { showEmptyDocuments } from '../../documents/uploadState';
import { WorkspaceModel } from "../hooks/useWorkspace";

export function SourceDocuments({ model, expanded, onToggle }: { model: WorkspaceModel } & SectionDisclosure) {
  const {
    documentsLoading, projects, projectId, setProjectId,
    documents, documentId, setDocumentId, setShowCreateProject,
    setConfirmation, file, setFile, busy,
    showManageProject, setShowManageProject, manageName, setManageName,
    manageDescription, setManageDescription, confirmProjectName, setConfirmProjectName,
    selectedProject, unsavedCount, savingCount, acceptFile,
    uploadDocument, manageProject, removeProject, deleteDocument
  } = model;
  const projectOptions = projects.map(function(project) { return <option key={project.id} value={project.id}>{project.name}</option>; });
  return <CollapsibleSection id="upload-section" headingId="upload-heading" title="Project & source document"
    description="Supported input: UTF-8 TXT, DOCX and searchable PDF · Maximum 10 MiB"
    expanded={expanded} onToggle={onToggle}
    actions={<button type="button" className="secondary-button" disabled={busy || unsavedCount > 0 || savingCount > 0} onClick={function() { setShowCreateProject(true); }}><Icon name="plus" />Create project</button>}>
    {projects.length ? <div className="workspace-project-picker">
      <label className="field-label" htmlFor="project-switcher">Review project</label>
      <select id="project-switcher" className="select-input" value={projectId} disabled={busy || savingCount > 0}
        onChange={function(event) {
          if (unsavedCount) setConfirmation({ kind: 'switch-project', projectId: event.target.value });
          else { setProjectId(event.target.value); setDocumentId(''); }
        }}>
        <option value="">Select a project</option>{projectOptions}
      </select>
    </div> : null}
    {!selectedProject ? <EmptyState icon="folder" title="Create your first project"
      description="A project keeps your documents, review decisions and analysis results together.">
      <button type="button" className="primary-button" onClick={function() { setShowCreateProject(true); }}><Icon name="plus" />Create project</button>
    </EmptyState> : <div className="project-management">
        <button type="button" className="ghost-button" aria-expanded={showManageProject} onClick={function() {
          setManageName(selectedProject.name); setManageDescription(selectedProject.description);
          setShowManageProject(!showManageProject);
        }}><Icon name="folder" />Manage project</button>
        {showManageProject ? <form className="manage-project-form" onSubmit={manageProject}>
          <label className="field-label" htmlFor="manage-project-name">Project name</label>
          <input id="manage-project-name" className="text-input" value={manageName} required maxLength={120} onChange={function(event) { setManageName(event.target.value); }} />
          <label className="field-label" htmlFor="manage-project-description">Description</label>
          <textarea id="manage-project-description" className="textarea" value={manageDescription} maxLength={1000} onChange={function(event) { setManageDescription(event.target.value); }} />
          <button type="submit" className="secondary-button" disabled={busy || !manageName.trim()}>Save project details</button>
          <label className="field-label" htmlFor="delete-project-confirm">To delete this project and all its data, type {selectedProject.name}</label>
          <input id="delete-project-confirm" className="text-input" value={confirmProjectName} onChange={function(event) { setConfirmProjectName(event.target.value); }} />
          <button type="button" className="danger-button" disabled={busy || unsavedCount > 0 || savingCount > 0 || confirmProjectName !== selectedProject.name} onClick={removeProject}>Delete project and all data</button>
        </form> : null}
      </div>}
    {documentsLoading ? <p className="loading" role="status"><span className="spinner" />Loading saved documents...</p> : null}
    {!documentsLoading && documents.length > 0 ? (
      <div className="document-select-wrap">
        <label className="field-label" htmlFor="document-switcher">Open a saved document</label>
        <div className="document-row">
          <select id="document-switcher" className="select-input" value={documentId} disabled={busy || savingCount > 0}
            onChange={function(event) {
              if (unsavedCount) {
                setConfirmation({ kind: 'switch-document', documentId: event.target.value });
              } else {
                setDocumentId(event.target.value);
              }
            }}>
            {documents.map(function(item) { return <option key={item.id} value={item.id}>{item.original_name}</option>; })}
          </select>
          <button type="button" className="danger-button" disabled={busy || savingCount > 0} onClick={deleteDocument}><Icon name="trash" size={15} />Delete document</button>
        </div>
      </div>
    ) : null}
    {selectedProject && !documentsLoading ? <DocumentUpload file={file} busy={busy} disabled={savingCount > 0 || !projectId}
      firstDocument={showEmptyDocuments(true, documents.length, Boolean(file), false)}
      onSelect={acceptFile} onRemove={function() { setFile(null); }} onUpload={uploadDocument} /> : null}
  </CollapsibleSection>;
}
