import * as React from 'react';
import { Icon } from '../../components/ui/Icon';

type DocumentUploadProps = {
  file: File | null;
  busy: boolean;
  disabled: boolean;
  firstDocument: boolean;
  onSelect: (candidate?: File) => void;
  onRemove: () => void;
  onUpload: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function DocumentUpload(props: DocumentUploadProps) {
  const [dragging, setDragging] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  const browseButton = React.useRef<HTMLButtonElement>(null);
  const restoreBrowseFocus = React.useRef(false);
  React.useEffect(function() {
    if (!props.file && restoreBrowseFocus.current) {
      browseButton.current?.focus();
      restoreBrowseFocus.current = false;
    }
  }, [props.file]);
  function browse() { if (!props.busy) input.current?.click(); }
  return <form onSubmit={props.onUpload} className="document-upload">
    {props.file ? <div className="notice upload-pending" role="status"><Icon name="document" />
      <span><strong>Document selected - not uploaded yet.</strong> Choose Upload document to save it to this project and extract requirements.</span>
    </div> : null}
    <div className={'upload-zone' + (dragging ? ' dragging' : '') + (props.file ? ' has-file' : '')}
      onDragOver={function(event) { event.preventDefault(); if (!props.busy) setDragging(true); }}
      onDragLeave={function(event) { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
      onDrop={function(event) { event.preventDefault(); setDragging(false); if (!props.busy) props.onSelect(event.dataTransfer.files[0]); }}
      role="region" aria-label="Choose or drop a TXT, DOCX or searchable PDF">
      <input ref={input} id="document-file" className="file-input-hidden" type="file" accept=".txt,.docx,.pdf" disabled={props.busy}
        onChange={function(event) { props.onSelect(event.target.files ? event.target.files[0] : undefined); event.target.value = ''; }} />
      {props.file ? <div className="file-chip">
        <div className="file-type"><Icon name="document" size={23} /></div>
        <div className="file-info"><strong title={props.file.name}>{props.file.name}</strong><span>{Math.max(1, Math.ceil(props.file.size / 1024))} KB · ready to upload</span></div>
        <button type="button" className="remove-file" disabled={props.busy} aria-label={'Remove selected file ' + props.file.name}
          onClick={function() { restoreBrowseFocus.current = true; props.onRemove(); }}><Icon name="close" size={16} /><span>Remove</span></button>
      </div> : <><div className="upload-icon"><Icon name="upload" size={27} /></div>
          <h3 className="upload-title">{dragging ? 'Drop the file to select it' : props.firstDocument ? 'Add your first document' : 'Add another document'}</h3>
          <p className="upload-help">Drag a document here or choose a file to get started.</p>
          <button ref={browseButton} type="button" className="primary-button browse-button" disabled={props.busy} onClick={browse}><Icon name="folder" />Browse files</button>
          <p className="upload-formats">TXT, DOCX or searchable PDF <span aria-hidden="true">·</span> Up to 10 MiB</p>
          <p className="upload-next-step"><Icon name="check" size={15} />Review and repair extracted text before analysis.</p></>}
    </div>
    {props.file ? <div className="upload-footer">
      <span className="format-hint">Selected locally. Requirements appear after upload.</span>
      <button type="submit" className="primary-button" disabled={props.disabled || props.busy || !props.file}>
        {props.busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="upload" />}{props.busy ? 'Please wait…' : 'Upload document'}
      </button>
    </div> : null}
  </form>;
}
