import * as React from 'react';
import { EmptyState } from "../../../components/ui/EmptyState";
import { CollapsibleSection, SectionDisclosure } from "../../../components/ui/CollapsibleSection";
import { Icon } from "../../../components/ui/Icon";
import { locationLabel } from "../../../utils/workspace";
import { WorkspaceModel } from "../hooks/useWorkspace";

export function RequirementReview({ model, expanded, onToggle }: { model: WorkspaceModel } & SectionDisclosure) {
  const {
    documentId, requirements, savedTexts, selectedForMerge,
    newText, setNewText, search, setSearch,
    busy, documentLoading, saveStates, selectedDocument,
    unsavedCount, visibleRequirements, savingCount, updateRequirementText,
    saveRequirement, reloadSavedRequirement, addRequirement, splitRequirement,
    mergeSelectedRequirements, deleteRequirement, toggleMergeSelection
  } = model;

  return <CollapsibleSection id="review-section" headingId="review-heading" title="Review extracted requirements"
    description={selectedDocument ? requirements.length + ' statements · ' + unsavedCount + ' unsaved. Review source text before analysis.' : 'Upload a source document to begin.'}
    expanded={expanded} onToggle={onToggle}>
    {documentLoading ? <div className="loading-placeholder" role="status"><span className="spinner" />Loading saved requirements…<div className="skeleton-lines" aria-hidden="true"><span /><span /><span /></div></div> : !documentId ? (
      <EmptyState icon="edit" title="Your review starts here" description="Create or select a project, then upload a TXT, DOCX or searchable PDF." />
    ) : (
        <>
          <div className="review-toolbar">
            <div className="review-count">{requirements.length} active · {unsavedCount} unsaved</div>
            <div className="search-wrap"><Icon name="search" size={15} /><input className="search-input" type="search" value={search}
              onChange={function(event) { setSearch(event.target.value); }} placeholder="Find in extracted text" aria-label="Search requirements" /></div>
          </div>
          {selectedForMerge.length ? (
            <div className="merge-toolbar">
              <span>{selectedForMerge.length} selected · select two adjacent statements to merge</span>
              <button type="button" className="secondary-button" disabled={busy || savingCount > 0 || unsavedCount > 0 || selectedForMerge.length !== 2} onClick={mergeSelectedRequirements}><Icon name="merge" />Merge selected</button>
            </div>
          ) : null}
          <div className="review-list">
            {visibleRequirements.length ? visibleRequirements.map(function(item) {
              const unsaved = savedTexts[item.id] !== item.text;
              return (
                <article className={'requirement-card' + (unsaved ? ' has-unsaved-edits' : '')} key={item.id}>
                  <div className="requirement-top">
                    <div className="item-label">
                      <input type="checkbox" checked={selectedForMerge.indexOf(item.id) !== -1}
                        onChange={function() { toggleMergeSelection(item.id); }}
                        aria-label={'Select requirement ' + item.sequence + ' to merge'} />
                      <span className="item-index">{item.sequence}</span> Requirement
                                </div>
                    <span role="status" className={'saved-state' + (unsaved ? '' : ' is-saved') + (saveStates[item.id] === 'failed' ? ' save-failed' : '')}>
                      {saveStates[item.id] === 'saving' ? <span className="spinner" /> : <Icon name={saveStates[item.id] === 'failed' ? 'close' : unsaved ? 'edit' : 'check'} size={13} />}
                      {saveStates[item.id] === 'saving' ? 'Saving…' : saveStates[item.id] === 'failed' ? 'Save failed — draft kept' : unsaved ? item.text.trim() ? 'Waiting to save…' : 'Enter text to save' : 'Saved'}
                    </span>
                  </div>
                  <label className="sr-only" htmlFor={'req-' + item.id}>Edit requirement {item.sequence}</label>
                  <textarea id={'req-' + item.id} className="textarea" maxLength={10000}
                    value={item.text} onChange={function(event) { updateRequirementText(item.id, event.target.value); }} />
                  <div className="requirement-bottom">
                    <span className="source-meta">{locationLabel(item.location)}</span>
                    <div className="requirement-actions">
                      <button type="button" className="ghost-button" disabled={busy || savingCount > 0 || unsavedCount > 0 || item.text.indexOf('\n') === -1}
                        title="Add a line break between statements first"
                        onClick={function() { splitRequirement(item); }}><Icon name="split" size={15} />Split at line breaks</button>
                      <button type="button" className="danger-button" disabled={busy || savingCount > 0 || unsavedCount > 0}
                        onClick={function() { deleteRequirement(item); }}><Icon name="trash" size={15} />Remove</button>
                      {saveStates[item.id] === 'failed' ? <button type="button" className="ghost-button" onClick={function() { reloadSavedRequirement(item); }}>Compare saved version</button> : null}
                      <button type="button" className="primary-button save-button" disabled={busy || saveStates[item.id] === 'saving' || !unsaved || !item.text.trim()}
                        onClick={function() { saveRequirement(item); }}><Icon name="save" size={15} />{saveStates[item.id] === 'failed' ? 'Retry save' : 'Save correction'}</button>
                    </div>
                  </div>
                </article>
              );
            }) : <EmptyState icon={requirements.length ? 'search' : 'edit'} title={requirements.length ? 'No matches' : 'No active requirements'}
              description={requirements.length ? 'Change the search text to find your requirements.' : 'Add a missed statement below or upload a different document.'} />}
          </div>
          <form className="add-form" onSubmit={addRequirement}>
            <label className="field-label" htmlFor="new-requirement">Add a missing requirement</label>
            <textarea id="new-requirement" className="textarea" maxLength={10000} value={newText}
              onChange={function(event) { setNewText(event.target.value); }}
              placeholder="Write one complete requirement statement…" />
            <div className="add-form-footer"><span className="add-hint">Preserves this as a manually added statement.</span>
              <button type="submit" className="secondary-button" disabled={busy || savingCount > 0 || unsavedCount > 0 || !newText.trim()}><Icon name="plus" />Add requirement</button></div>
          </form>
        </>
      )}
  </CollapsibleSection>;
}
