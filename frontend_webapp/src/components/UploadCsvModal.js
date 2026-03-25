import React, { useMemo, useState } from "react";
import Papa from "papaparse";
import { Modal, Pill } from "./ui";
import { uploadClaimsCsv } from "../api/client";

/**
 * PUBLIC_INTERFACE
 * Modal to upload a CSV file of claims to the backend.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onUploaded: (result:any) => void
 */
export default function UploadCsvModal({ isOpen, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const canUpload = useMemo(() => !!file && !uploading, [file, uploading]);

  const parsePreview = async (f) => {
    setError(null);
    setSuccess(null);
    setPreview(null);
    if (!f) return;

    setParsing(true);
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      preview: 5,
      complete: (results) => {
        setPreview({
          fields: results.meta?.fields || [],
          rows: results.data || [],
        });
        setParsing(false);
      },
      error: (err) => {
        setError(err?.message || "Failed to parse CSV");
        setParsing(false);
      },
    });
  };

  const onPickFile = (f) => {
    setFile(f || null);
    setError(null);
    setSuccess(null);
    if (f) parsePreview(f);
  };

  const onSubmit = async () => {
    if (!file) return;
    setError(null);
    setSuccess(null);
    setUploading(true);
    try {
      const result = await uploadClaimsCsv(file);
      setSuccess("Upload complete. Claims are being processed.");
      onUploaded?.(result);
    } catch (e) {
      setError(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload claims CSV"
      footer={
        <>
          <button className="Btn" onClick={onClose}>
            Cancel
          </button>
          <button className="Btn BtnPrimary" onClick={onSubmit} disabled={!canUpload}>
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div className="CardTitle">Choose a file</div>
              <div className="CardSub">CSV format; first row should contain headers.</div>
            </div>
            <Pill variant="primary">Tip: include claim_id if available</Pill>
          </div>

          <div className="Divider" />

          <input
            className="Input"
            style={{ width: "100%" }}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => onPickFile(e.target.files?.[0] || null)}
            aria-label="Select CSV file"
          />

          <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 12 }}>
            {file ? (
              <>
                Selected: <span className="Mono">{file.name}</span> ({Math.round(file.size / 1024)} KB)
              </>
            ) : (
              "No file selected."
            )}
          </div>
        </div>

        {parsing ? (
          <div className="Toast">Parsing preview…</div>
        ) : preview ? (
          <div className="Card">
            <div className="CardHeader">
              <div>
                <div className="CardTitle">Preview (first 5 rows)</div>
                <div className="CardSub">This is only a preview; backend will ingest the full file.</div>
              </div>
              <Pill>{preview.rows.length} rows</Pill>
            </div>

            <div className="TableWrap" style={{ boxShadow: "none" }}>
              <table className="Table" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    {preview.fields.slice(0, 6).map((f) => (
                      <th key={f}>{f}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r, idx) => (
                    <tr key={idx}>
                      {preview.fields.slice(0, 6).map((f) => (
                        <td key={f + idx}>{String(r?.[f] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {error ? <div className="Toast ToastError">{error}</div> : null}
        {success ? <div className="Toast ToastSuccess">{success}</div> : null}
      </div>
    </Modal>
  );
}
