'use client';

import React, { useRef, useState } from 'react';

/**
 * Props:
 * - fieldKey?: string        // preferred
 * - id?: string              // fallback if fieldKey not provided
 * - value: string | null
 * - onChange: (newValue: string | null) => void
 * - mediaType: 'PDF' | 'MSW' | 'ANY'
 * - sizeLimitMB: number
 * - disabled?: boolean
 */
export default function MediaUploader({
  fieldKey,
  id,
  value,
  onChange,
  mediaType = 'PDF',
  sizeLimitMB = 12,
  disabled = false,
}) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const key = fieldKey || id; // tolerate either prop name
  const acceptMap = {
    PDF: '.pdf,application/pdf',
    MSW: '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ANY: '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  const accept = acceptMap[mediaType] || acceptMap.PDF;

  const pick = () => !disabled && inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !key) return;

    // size check
    const max = sizeLimitMB * 1024 * 1024;
    if (file.size > max) {
      alert(`File exceeds ${sizeLimitMB}MB`);
      e.target.value = '';
      return;
    }

    // basic type/extension hint
    const ok = accept
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .some((mask) => (mask.startsWith('.') ? file.name.toLowerCase().endsWith(mask) : (file.type || '').toLowerCase() === mask));
    if (!ok) {
      alert(`Invalid file type. Allowed: ${mediaType === 'ANY' ? 'PDF, DOC, DOCX' : mediaType}`);
      e.target.value = '';
      return;
    }

    try {
      setBusy(true);
      const fd = new FormData();
      fd.append('file', file, file.name);

      // POST to our Next API proxy → backend; requires fieldKey query
      const resp = await fetch(`/api/media/upload?fieldKey=${encodeURIComponent(key)}`, {
        method: 'POST',
        body: fd,
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(t || `Upload failed (${resp.status})`);
      }

      const json = await resp.json(); // { path, url }
      // IMPORTANT: persist PATH (server-side storage path), not URL
      if (!json.path) throw new Error('Upload response missing file path');
      onChange?.(json.path);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const removeFile = async () => {
    if (!key) return;
    try {
      setBusy(true);
      const resp = await fetch(`/api/media?fieldKey=${encodeURIComponent(key)}`, { method: 'DELETE' });
      if (resp.status !== 204 && !resp.ok) {
        const t = await resp.text();
        throw new Error(t || `Delete failed (${resp.status})`);
      }
      onChange?.(null);
    } catch (e) {
      console.error(e);
      alert('Remove failed');
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!key) return;
    // open the authenticated download proxy
    window.open(`/api/media/download?fieldKey=${encodeURIComponent(key)}`, '_blank');
  };

  return (
    <div className="w-full">
      <div className="w-full rounded-md border border-gray-300 bg-white p-3 shadow-sm">
        <p className="text-sm text-gray-700">{value ? value : 'No file uploaded.'}</p>
        <p className="mt-1 text-xs text-gray-500">
          Allowed: {mediaType === 'ANY' ? 'PDF, DOC, DOCX' : mediaType}, up to {sizeLimitMB}MB
        </p>

        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={pick}
            disabled={disabled || busy}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm hover:border-blue-600 hover:text-blue-700 disabled:opacity-60"
          >
            {busy ? 'Uploading…' : 'Upload'}
          </button>

          {value && (
            <>
              <button
                type="button"
                onClick={download}
                disabled={disabled || busy}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm hover:border-blue-600 hover:text-blue-700 disabled:opacity-60"
              >
                Download
              </button>
              <button
                type="button"
                onClick={removeFile}
                disabled={disabled || busy}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm hover:border-red-600 hover:text-red-700 disabled:opacity-60"
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>

      <input ref={inputRef} type="file" accept={accept} hidden onChange={handleFile} />
    </div>
  );
}
