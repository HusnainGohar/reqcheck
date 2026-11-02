import * as React from 'react';
import { useApi } from "../../../api/client";
import { readHealth } from "../../../api/health";
import { useAuth } from "../../../auth/AuthContext";
import { useActiveSection } from '../../../hooks/useActiveSection';
import { useDialogFocus } from '../../../hooks/useDialogFocus';
import { AnalysisRun, Confirmation, DocumentRecord, Page, Project, Requirement, ReviewEvent, ReviewPayload, Session, UploadResult } from "../../../types/domain";
import { validateUpload } from '../../documents/uploadState';
import { useRequirementAutosave } from './useRequirementAutosave';
import { useFindingPages } from '../../analysis/useFindingPages';

export function useWorkspace(props: { session: Session; onNavigate: (id: string) => void }) {
  const auth = useAuth();
  const { request, requestDelete } = useApi();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [projectId, setProjectId] = React.useState('');
  const [documents, setDocuments] = React.useState<DocumentRecord[]>([]);
  const [documentId, setDocumentId] = React.useState('');
  const [requirements, setRequirements] = React.useState<Requirement[]>([]);
  const [inputHash, setInputHash] = React.useState('');
  const [savedTexts, setSavedTexts] = React.useState<Record<string, string>>({});
  const [selectedForMerge, setSelectedForMerge] = React.useState<string[]>([]);
  const [runs, setRuns] = React.useState<AnalysisRun[]>([]);
  const [currentRunId, setCurrentRunId] = React.useState('');
  const [reviewRevision, setReviewRevision] = React.useState(0);
  const [findingPage, setFindingPage] = React.useState(1);
  const [findingKind, setFindingKind] = React.useState<'classification' | 'duplicate' | 'ambiguity'>('classification');
  const [projectName, setProjectName] = React.useState('');
  const [projectDescription, setProjectDescription] = React.useState('');
  const [showCreateProject, setShowCreateProject] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState<Confirmation | null>(null);
  const [deleteDocumentText, setDeleteDocumentText] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [newText, setNewText] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [apiReady, setApiReady] = React.useState(false);
  const [analysisReady, setAnalysisReady] = React.useState(false);
  const [analysisNotice, setAnalysisNotice] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [documentLoading, setDocumentLoading] = React.useState(false);
  const [documentsLoading, setDocumentsLoading] = React.useState(false);
  const [saveStates, setSaveStates] = React.useState<Record<string, 'pending' | 'saving' | 'failed' | 'saved'>>({});
  const inFlight = React.useRef<Record<string, boolean>>({});
  const mounted = React.useRef(true);
  const activeDocument = React.useRef(documentId);
  activeDocument.current = documentId;
  const activeProject = React.useRef(projectId);
  activeProject.current = projectId;
  const draftPrefix = 'reqcheck.draft.' + props.session.owner_id + '.';
  const selectionPrefix = 'reqcheck.' + props.session.owner_id + '.';
  const selectionStorage = props.session.kind === 'account' ? localStorage : sessionStorage;
  const [showManageProject, setShowManageProject] = React.useState(false);
  const [manageName, setManageName] = React.useState('');
  const [manageDescription, setManageDescription] = React.useState('');
  const [confirmProjectName, setConfirmProjectName] = React.useState('');
  const { activeSection, setActiveSection } = useActiveSection();

  const selectedProject = projects.find(function(item) { return item.id === projectId; });
  const selectedDocument = documents.find(function(item) { return item.id === documentId; });
  const currentRun = runs.find(function(item) { return item.id === currentRunId; });
  const {
    findings, findingTotal, runRequirements, findingsLoading, findingsError,
    retryFindings, updateFindingReview
  } = useFindingPages(currentRun && currentRun.status === 'complete' ? currentRunId : '', findingKind, findingPage);
  const unsavedCount = requirements.filter(function(item) {
    return Object.prototype.hasOwnProperty.call(savedTexts, item.id)
      && savedTexts[item.id] !== item.text;
  }).length;
  const visibleRequirements = requirements.filter(function(item) {
    return item.text.toLowerCase().includes(search.trim().toLowerCase());
  });
  const totalFindingPages = Math.max(1, Math.ceil(findingTotal / 50));
  const savingCount = Object.keys(saveStates).filter(function(id) { return saveStates[id] === 'saving'; }).length;

  React.useEffect(function() {
    return function() {
      mounted.current = false;
      activeDocument.current = '';
      activeProject.current = '';
    };
  }, []);

  useRequirementAutosave({ requirements, savedTexts, saveStates, busy, savingCount, unsavedCount, save: saveRequirement });


  const handleDialogKeyDown = useDialogFocus(showCreateProject || Boolean(confirmation), busy, function() { setShowCreateProject(false); setConfirmation(null); });

  function clearNotices() {
    setError('');
    setMessage('');
  }

  async function refreshRequirements(selectedId: string): Promise<void> {
    if (!selectedId) {
      setRequirements([]);
      setSavedTexts({});
      setInputHash('');
      return;
    }
    const first = await request<Page<Requirement>>(
      '/documents/' + encodeURIComponent(selectedId) + '/requirements?page=1&page_size=100'
    );
    const pages: Requirement[][] = [first.items];
    for (let page = 2; (page - 1) * first.page_size < first.total; page += 1) {
      const next = await request<Page<Requirement>>(
        '/documents/' + encodeURIComponent(selectedId) +
        '/requirements?page=' + page + '&page_size=' + first.page_size
      );
      pages.push(next.items);
    }
    const items = ([] as Requirement[]).concat.apply([], pages).map(function(item) { return Object.assign({}, item); });
    if (activeDocument.current !== selectedId) return;
    const nextSaved: Record<string, string> = {};
    items.forEach(function(item) { nextSaved[item.id] = item.text; });
    if (props.session.kind === 'account') {
      items.forEach(function(item) {
        const draft = localStorage.getItem(draftPrefix + item.id);
        if (draft) {
          try {
            const restored = JSON.parse(draft) as { text: string; revision: number };
            if (typeof restored.text !== 'string' || typeof restored.revision !== 'number') throw new Error('Invalid local draft');
            if (restored.text === item.text) localStorage.removeItem(draftPrefix + item.id);
            else {
              item.text = restored.text;
              if (restored.revision !== item.revision) {
                setSaveStates(function(states) { return Object.assign({}, states, { [item.id]: 'failed' }); });
                setError('A saved requirement changed while you were away. Your local draft is preserved. Compare it with the saved version before retrying.');
              }
            }
          } catch (err) {
            setError('A local draft could not be read. Your server-saved text is still available.');
          }
        }
      });
    }
    setRequirements(items);
    setInputHash(first.input_hash || '');
    setRuns(function(current) {
      return current.map(function(run) {
        return Object.assign({}, run, { stale: run.input_revision_hash !== first.input_hash });
      });
    });
    setSavedTexts(nextSaved);
  }

  async function loadDocuments(selectedProjectId: string): Promise<void> {
    if (!selectedProjectId) {
      setDocuments([]);
      setDocumentId('');
      return;
    }
    const result = await request<Page<DocumentRecord>>(
      '/projects/' + encodeURIComponent(selectedProjectId) + '/documents?page=1&page_size=100'
    );
    if (activeProject.current !== selectedProjectId) return;
    setDocuments(result.items);
    const storedId = selectionStorage.getItem(selectionPrefix + 'document') || '';
    const selected = result.items.find(function(item) { return item.id === storedId; })
      || result.items[0];
    setDocumentId(selected ? selected.id : '');
  }

  React.useEffect(function() {
    let active = true;
    async function initialize() {
      try {
        try {
          const health = await readHealth();
          if (!active) return;
          const status = health.status;
          setApiReady(health.ok || status.database === 'ready');
          setAnalysisReady(status.analysis === 'ready' && health.ok);
          if (!health.ok && status.analysis_error) {
            setAnalysisNotice(status.analysis_error);
          }
        } catch (healthError) {
          if (!active) return;
          setApiReady(false);
          setError(healthError instanceof Error ? healthError.message : 'Could not check API health.');
        }
        const result = await request<Page<Project>>('/projects?page=1&page_size=100');
        if (!active) return;
        setProjects(result.items);
        const storedId = selectionStorage.getItem(selectionPrefix + 'project') || '';
        const selected = result.items.find(function(item) { return item.id === storedId; })
          || result.items[0];
        setProjectId(selected ? selected.id : '');
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load the workspace.');
      } finally {
        if (active) setLoading(false);
      }
    }
    initialize();
    return function() { active = false; };
  }, []);

  React.useEffect(function() {
    if (loading) return;
    selectionStorage.setItem(selectionPrefix + 'project', projectId);
    let active = true;
    setDocumentsLoading(Boolean(projectId));
    setDocuments([]);
    loadDocuments(projectId).catch(function(err) {
      if (active) setError(err instanceof Error ? err.message : 'Could not load project documents.');
    }).then(function() { if (active) setDocumentsLoading(false); });
    return function() { active = false; };
  }, [projectId, loading]);

  React.useEffect(function() {
    if (!documentId) {
      setDocumentLoading(false);
      setSaveStates({});
      selectionStorage.removeItem(selectionPrefix + 'document');
      setRequirements([]);
      setSavedTexts({});
      setInputHash('');
      setRuns([]);
      setCurrentRunId('');
      return;
    }
    selectionStorage.setItem(selectionPrefix + 'document', documentId);
    let active = true;
    setDocumentLoading(true);
    async function loadDocumentWorkspace() {
      try {
        await refreshRequirements(documentId);
        const result = await request<Page<AnalysisRun>>(
          '/documents/' + encodeURIComponent(documentId) + '/analysis-runs?page=1&page_size=100'
        );
        if (!active) return;
        setRuns(result.items);
        const recent = result.items.find(function(item) { return item.status === 'complete'; });
        setCurrentRunId(recent ? recent.id : '');
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load document review data.');
      } finally {
        if (active) setDocumentLoading(false);
      }
    }
    loadDocumentWorkspace();
    return function() { active = false; };
  }, [documentId]);

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectName.trim()) return;
    setBusy(true);
    clearNotices();
    try {
      const project = await request<Project>('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDescription.trim(),
        }),
      });
      setProjects(function(items) { return [project].concat(items); });
      setProjectName('');
      setProjectDescription('');
      setShowCreateProject(false);
      setProjectId(project.id);
      setMessage('Project created. Add a requirements document to begin.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the project.');
    } finally {
      setBusy(false);
    }
  }

  function acceptFile(candidate?: File) {
    if (!candidate || busy) return;
    clearNotices();
    const error = validateUpload(candidate);
    if (error) { setFile(null); setError(error); }
    else setFile(candidate);
  }

  async function submitUpload() {
    if (!file || !projectId) return;
    setBusy(true);
    clearNotices();
    try {
      const form = new FormData();
      form.append('file', file);
      const result = await request<UploadResult>(
        '/projects/' + encodeURIComponent(projectId) + '/documents',
        { method: 'POST', body: form }
      );
      setFile(null);
      const documentsResult = await request<Page<DocumentRecord>>(
        '/projects/' + encodeURIComponent(projectId) + '/documents?page=1&page_size=100'
      );
      setDocuments(documentsResult.items);
      setDocumentId(result.id);
      setRequirements(result.requirements);
      setInputHash('');
      setRuns([]);
      setCurrentRunId('');
      setMessage('Document uploaded. Review the extracted statements and save corrections before analysis.');
      props.onNavigate('review-section');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The document could not be uploaded.');
    } finally {
      setBusy(false);
    }
  }

  async function uploadDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !projectId) return;
    if (unsavedCount) {
      setConfirmation({ kind: 'upload-document' });
      return;
    }
    await submitUpload();
  }

  function removeLocalDrafts(project: string, document: string, ids: string[]) {
    if (props.session.kind !== 'account') return;
    try {
      Object.keys(localStorage).filter(function(key) { return key.indexOf(draftPrefix) === 0; }).forEach(function(key) {
        const draft = JSON.parse(localStorage.getItem(key) || '{}');
        if (ids.indexOf(key.slice(draftPrefix.length)) !== -1
          || project && draft.project_id === project || document && draft.document_id === document) {
          localStorage.removeItem(key);
        }
      });
    } catch (err) {
      setError('Server operation completed, but local draft cleanup failed. Remove this account’s browser drafts before using a shared device.');
    }
  }

  function updateRequirementText(id: string, text: string) {
    setSaveStates(function(states) { return Object.assign({}, states, { [id]: states[id] === 'saving' ? 'saving' : 'pending' }); });
    setRequirements(function(items) {
      return items.map(function(item) {
        if (item.id === id && props.session.kind === 'account') {
          try {
            localStorage.setItem(draftPrefix + id, JSON.stringify({ text: text, revision: item.revision, document_id: documentId, project_id: projectId }));
          } catch (err) {
            setError('Local draft storage is unavailable. Keep this page open until the server confirms Saved.');
          }
        }
        return item.id === id ? Object.assign({}, item, { text: text }) : item;
      });
    });
  }

  async function saveRequirement(item: Requirement) {
    if (inFlight.current[item.id]) return;
    inFlight.current[item.id] = true;
    const savingDocument = documentId;
    clearNotices();
    setSaveStates(function(states) { return Object.assign({}, states, { [item.id]: 'saving' }); });
    try {
      const updated = await request<Requirement>('/requirements/' + encodeURIComponent(item.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: item.text, expected_revision: item.revision }),
      });
      if (activeDocument.current !== savingDocument) return;
      setRequirements(function(items) {
        return items.map(function(current) {
          if (current.id !== updated.id) return current;
          const next = Object.assign({}, updated, { text: current.text === item.text ? updated.text : current.text });
          if (props.session.kind === 'account') {
            try {
              if (next.text === updated.text) localStorage.removeItem(draftPrefix + updated.id);
              else localStorage.setItem(draftPrefix + updated.id, JSON.stringify({ text: next.text, revision: updated.revision, document_id: savingDocument, project_id: projectId }));
            } catch (err) {
              setError('Correction saved to the server, but local draft storage could not be updated.');
            }
          }
          return next;
        });
      });
      setSavedTexts(function(current) { return Object.assign({}, current, { [updated.id]: updated.text }); });
      setSaveStates(function(states) { return Object.assign({}, states, { [item.id]: 'saved' }); });
      try {
        const state = await request<Page<Requirement>>(
          '/documents/' + encodeURIComponent(savingDocument) + '/requirements?page=1&page_size=1'
        );
        if (activeDocument.current !== savingDocument) return;
        setInputHash(state.input_hash || '');
        setRuns(function(items) {
          return items.map(function(run) {
            return Object.assign({}, run, {
              stale: run.input_revision_hash !== state.input_hash,
            });
          });
        });
      } catch (err) {
        if (activeDocument.current !== savingDocument) return;
        setInputHash('');
        setError('Correction saved, but analysis-version refresh failed. Reload before analyzing. ' +
          (err instanceof Error ? err.message : 'Could not refresh the document.'));
      }
    } catch (err) {
      if (!mounted.current) return;
      setSaveStates(function(states) { return Object.assign({}, states, { [item.id]: 'failed' }); });
      setError(err instanceof Error ? err.message : 'Could not save this correction.');
    } finally {
      inFlight.current[item.id] = false;
      if (mounted.current) setSaveStates(function(states) {
        const next = Object.assign({}, states);
        if (activeDocument.current !== savingDocument) delete next[item.id];
        return next;
      });
    }
  }

  async function reloadSavedRequirement(item: Requirement) {
    try {
      let pageNumber = 1;
      let saved: Requirement | undefined;
      do {
        const page = await request<Page<Requirement>>('/documents/' + encodeURIComponent(documentId) + '/requirements?page=' + pageNumber + '&page_size=100');
        saved = page.items.find(function(record) { return record.id === item.id; });
        if (saved || pageNumber * page.page_size >= page.total) break;
        pageNumber += 1;
      } while (pageNumber <= 5);
      if (!saved) throw new Error('This requirement is no longer available in the saved document. Your draft remains in the editor.');
      const savedRecord = saved;
      setError('Saved version: ' + saved.text + ' Your draft remains in the editor. Choose Retry save only if you intend to replace this version.');
      setRequirements(function(items) {
        return items.map(function(current) {
          return current.id === savedRecord.id ? Object.assign({}, current, { revision: savedRecord.revision }) : current;
        });
      });
      setSavedTexts(function(texts) { return Object.assign({}, texts, { [savedRecord.id]: savedRecord.text }); });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not retrieve the saved version.');
    }
  }

  async function manageProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const updated = await request<Project>('/projects/' + encodeURIComponent(projectId), {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: manageName, description: manageDescription }),
      });
      setProjects(function(items) { return items.map(function(item) { return item.id === updated.id ? updated : item; }); });
      setMessage('Project details saved to your workspace.');
      setShowManageProject(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Project details could not be saved.');
    } finally { setBusy(false); }
  }

  async function removeProject() {
    if (!selectedProject || confirmProjectName !== selectedProject.name) return;
    setBusy(true);
    try {
      await requestDelete('/projects/' + encodeURIComponent(projectId) + '?confirm_name=' + encodeURIComponent(confirmProjectName));
      removeLocalDrafts(projectId, '', requirements.map(function(item) { return item.id; }));
      setProjects(function(items) { return items.filter(function(item) { return item.id !== projectId; }); });
      setProjectId('');
      setShowManageProject(false);
      setConfirmProjectName('');
      setMessage('Project and its documents, results and reviews deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Project deletion failed.');
    } finally { setBusy(false); }
  }

  async function addRequirement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newText.trim() || !documentId) return;
    setBusy(true);
    clearNotices();
    try {
      await request<Requirement>('/documents/' + encodeURIComponent(documentId) + '/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText.trim() }),
      });
      setNewText('');
      await refreshRequirements(documentId);
      setMessage('Requirement added to the review list.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this requirement.');
    } finally {
      setBusy(false);
    }
  }

  async function splitRequirement(item: Requirement) {
    const parts = item.text.split(/\r?\n/).map(function(part) { return part.trim(); }).filter(Boolean);
    if (parts.length < 2) {
      setError('Add a line break where the statements should split, then choose Split at line breaks.');
      return;
    }
    setBusy(true);
    clearNotices();
    try {
      await request('/requirements/' + encodeURIComponent(item.id) + '/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expected_revision: item.revision, texts: parts }),
      });
      await refreshRequirements(documentId);
      setMessage('Statement split. The new statement retains the original source location.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not split this statement.');
    } finally {
      setBusy(false);
    }
  }

  async function mergeSelectedRequirements() {
    if (selectedForMerge.length !== 2) return;
    if (unsavedCount) {
      setError('Save or discard unsaved edits before merging statements.');
      return;
    }
    const selected = selectedForMerge
      .map(function(id) { return requirements.find(function(item) { return item.id === id; }); })
      .filter(function(item): item is Requirement { return Boolean(item); })
      .sort(function(left, right) { return left.sequence - right.sequence; });
    if (selected.length !== 2) return;
    setBusy(true);
    clearNotices();
    try {
      await request('/requirements/' + encodeURIComponent(selected[0].id) + '/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          other_requirement_id: selected[1].id,
          expected_revision: selected[0].revision,
          other_expected_revision: selected[1].revision,
        }),
      });
      setSelectedForMerge([]);
      await refreshRequirements(documentId);
      setMessage('Statements merged. The original source text remains available in the record.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not merge these statements.');
    } finally {
      setBusy(false);
    }
  }

  function deleteRequirement(item: Requirement) {
    setConfirmation({ kind: 'delete-requirement', requirement: item });
  }

  function deleteDocument() {
    if (!selectedDocument) return;
    setDeleteDocumentText('');
    setConfirmation({ kind: 'delete-document', document: selectedDocument });
  }

  async function confirmAction() {
    if (!confirmation) return;
    if (confirmation.kind === 'switch-document') {
      removeLocalDrafts('', documentId, requirements.map(function(item) { return item.id; }));
      setDocumentId(confirmation.documentId);
      setConfirmation(null);
      return;
    }
    if (confirmation.kind === 'switch-project') {
      removeLocalDrafts('', documentId, requirements.map(function(item) { return item.id; }));
      setProjectId(confirmation.projectId);
      setDocumentId('');
      setConfirmation(null);
      return;
    }
    if (confirmation.kind === 'upload-document') {
      removeLocalDrafts('', documentId, requirements.map(function(item) { return item.id; }));
      setConfirmation(null);
      await submitUpload();
      return;
    }
    if (confirmation.kind === 'delete-document'
      && deleteDocumentText !== confirmation.document.original_name) return;
    setBusy(true);
    clearNotices();
    try {
      if (confirmation.kind === 'delete-requirement') {
        const item = confirmation.requirement;
        await requestDelete('/requirements/' + encodeURIComponent(item.id), {
          expected_revision: item.revision,
        });
        removeLocalDrafts('', '', [item.id]);
        await refreshRequirements(documentId);
        setMessage('Requirement removed from the active list. Previous runs remain traceable.');
      } else {
        const item = confirmation.document;
        await requestDelete(
          '/documents/' + encodeURIComponent(item.id) +
          '?confirm_name=' + encodeURIComponent(deleteDocumentText)
        );
        removeLocalDrafts('', item.id, requirements.map(function(requirement) { return requirement.id; }));
        const remaining = documents.filter(function(document) { return document.id !== item.id; });
        setDocuments(remaining);
        setDocumentId(documentId === item.id && remaining.length ? remaining[0].id : '');
        setMessage('Document and its associated workspace data were deleted.');
        setDeleteDocumentText('');
      }
      setConfirmation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete this action.');
    } finally {
      setBusy(false);
    }
  }

  async function runAnalysis() {
    if (!documentId || !inputHash || unsavedCount) return;
    setBusy(true);
    clearNotices();
    try {
      const run = await request<AnalysisRun>(
        '/documents/' + encodeURIComponent(documentId) + '/analysis-runs',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expected_input_hash: inputHash }),
        }
      );
      setRuns(function(items) { return [run].concat(items.filter(function(item) { return item.id !== run.id; })); });
      setCurrentRunId(run.id);
      setFindingKind('classification');
      setFindingPage(1);
      if (run.status === 'complete') {
        setMessage('Analysis completed. Suggestions are ready for human review.');
      } else {
        setCurrentRunId('');
        setError(run.error || 'Analysis did not complete.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start analysis.');
    } finally {
      setBusy(false);
    }
  }

  async function reviewFinding(findingId: string, payload: ReviewPayload) {
    setBusy(true);
    try {
      const event = await request<ReviewEvent>(
        '/findings/' + encodeURIComponent(findingId) + '/reviews',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      updateFindingReview(findingId, event);
      setMessage('Reviewer decision recorded in the immutable history.');
      setReviewRevision(function(value) { return value + 1; });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record this review decision.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  function toggleMergeSelection(id: string) {
    setSelectedForMerge(function(current) {
      if (current.indexOf(id) !== -1) return current.filter(function(item) { return item !== id; });
      if (current.length >= 2) return [current[1], id];
      return current.concat([id]);
    });
  }

  return {
    auth, projects, projectId, documents,
    documentId, showCreateProject, setShowCreateProject, confirmation,
    busy, loading, apiReady, analysisReady,
    analysisNotice, error, message, activeSection,
    setActiveSection, selectedProject, currentRun, unsavedCount,
    savingCount, requirements, runs, currentRunId,
    setCurrentRunId, findings, runRequirements, reviewRevision,
    findingTotal, findingPage, setFindingPage, findingKind,
    setFindingKind, findingsLoading, findingsError, retryFindings, totalFindingPages, runAnalysis,
    reviewFinding, savedTexts, selectedForMerge, newText,
    setNewText, search, setSearch, documentLoading,
    saveStates, selectedDocument, visibleRequirements, updateRequirementText,
    saveRequirement, reloadSavedRequirement, addRequirement, splitRequirement,
    mergeSelectedRequirements, deleteRequirement, toggleMergeSelection, documentsLoading,
    setProjectId, setDocumentId, setConfirmation, file,
    setFile, showManageProject, setShowManageProject, manageName,
    setManageName, manageDescription, setManageDescription, confirmProjectName,
    setConfirmProjectName, acceptFile, uploadDocument, manageProject,
    removeProject, deleteDocument, projectName, setProjectName,
    projectDescription, setProjectDescription, deleteDocumentText, setDeleteDocumentText,
    handleDialogKeyDown, createProject, confirmAction,
    session: props.session
  };
}

export type WorkspaceModel = ReturnType<typeof useWorkspace>;
