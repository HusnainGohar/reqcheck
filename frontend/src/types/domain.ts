
export type Project = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

export type DocumentRecord = {
  id: string;
  project_id: string;
  original_name: string;
  sha256: string;
  format: string;
  created_at: string;
};

export type RequirementLocation = {
  page?: number | null;
  page_end?: number | null;
  source_id?: string | null;
  paragraph?: number | null;
  table?: number | null;
  row?: number | null;
  cell?: number | null;
};

export type Requirement = {
  id: string;
  sequence: number;
  text: string;
  source_text: string;
  location: RequirementLocation;
  revision: number;
};

export type AnalysisRun = {
  id: string;
  status: 'complete' | 'failed';
  created_at: string;
  source_document_sha256: string;
  input_revision_hash: string;
  model_versions: Record<string, string>;
  rule_version: string;
  duplicate_threshold: number | null;
  duplicate_threshold_status: string;
  findings_count: number;
  summary: Record<string, number | boolean>;
  error?: string | null;
  stale?: boolean;
};

export type UploadResult = {
  id: string;
  requirements: Requirement[];
};

export type ReviewEvent = {
  id: string;
  created_at: string;
  decision: 'accept' | 'dismiss' | 'correct';
  comment: string;
  corrected_text?: string | null;
  corrected_label?: string | null;
};

export type Finding = {
  id: string;
  run_id: string;
  kind: 'classification' | 'ambiguity' | 'duplicate';
  requirement_ids: string[];
  sequence: number;
  payload: {
    rule?: string;
    suggested_label?: string;
    suggested_subtype?: string | null;
    label_is_suggestion?: boolean;
    term?: string;
    start?: number;
    end?: number;
    suggestion?: string;
    similarity?: number;
    threshold?: number;
    threshold_status?: string;
    interpretation?: string;
    constraint_differences?: string[];
  };
  latest_review: ReviewEvent | null;
};

export type Page<T> = {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  input_hash?: string;
};

export type ReviewPayload = {
  decision: 'accept' | 'dismiss' | 'correct';
  comment?: string;
  corrected_text?: string;
  corrected_label?: string;
};

export type Confirmation =
  | { kind: 'switch-document'; documentId: string }
  | { kind: 'switch-project'; projectId: string }
  | { kind: 'upload-document' }
  | { kind: 'delete-requirement'; requirement: Requirement }
  | { kind: 'delete-document'; document: DocumentRecord };

export type Session = {
  authenticated: boolean;
  kind?: 'account' | 'guest';
  owner_id?: string;
  email?: string | null;
  name?: string;
  csrf_token?: string;
  expires_at?: string;
};
