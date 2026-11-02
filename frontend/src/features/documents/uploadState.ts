export function validateUpload(candidate: Pick<File, 'name' | 'size'>): string | null {
  const extension = candidate.name.split('.').pop()!.toLowerCase();
  if (['txt', 'docx', 'pdf'].indexOf(extension) === -1) return 'That file type is not supported. Choose a TXT, DOCX or searchable PDF.';
  if (candidate.size === 0) return 'This file is empty. Choose a document that contains text.';
  if (candidate.size > 10 * 1024 * 1024) return 'This file is larger than 10 MB. Choose a smaller document to continue.';
  return null;
}

export function showEmptyDocuments(hasProject: boolean, savedCount: number, hasSelectedFile: boolean, loading: boolean) {
  return hasProject && savedCount === 0 && !hasSelectedFile && !loading;
}
