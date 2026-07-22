import { useRef, useState } from "react";
import { Download, FolderClosed, FolderOpen, Trash2, Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  useDeleteDocument,
  useDocuments,
  useUploadDocument,
} from "@/hooks/useFinancialData";
import { getDocumentBlob } from "@/services/dataService";
import { DOCUMENT_FOLDERS, DocumentFolder, DocumentRecord } from "@/types";
import { isDemoMode } from "@/services/supabase";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsPage() {
  const { data: documents } = useDocuments();
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const [activeFolder, setActiveFolder] = useState<DocumentFolder | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingFolder, setPendingFolder] = useState<DocumentFolder | null>(
    null,
  );

  const byFolder = new Map<string, DocumentRecord[]>();
  for (const document of documents ?? []) {
    const list = byFolder.get(document.folder) ?? [];
    list.push(document);
    byFolder.set(document.folder, list);
  }

  function startUpload(folder: DocumentFolder) {
    setPendingFolder(folder);
    fileInput.current?.click();
  }

  async function handleDownload(document_: DocumentRecord) {
    const blob = await getDocumentBlob(document_);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = document_.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  const folderDocs = activeFolder ? (byFolder.get(activeFolder) ?? []) : [];

  return (
    <>
      <PageHeader
        title="Documents"
        description="The household financial filing cabinet — statements, policies, receipts, and records."
      />
      {isDemoMode && (
        <div className="demo-banner">
          Demo mode stores files privately in this browser (IndexedDB). With
          Supabase connected, files live in household-scoped cloud storage.
        </div>
      )}
      <input
        ref={fileInput}
        type="file"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file && pendingFolder) {
            uploadDocument.mutate({ folder: pendingFolder, file });
          }
          event.target.value = "";
        }}
      />
      {activeFolder ? (
        <Card
          title={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <FolderOpen size={18} /> {activeFolder}
            </span>
          }
          action={
            <span style={{ display: "inline-flex", gap: 8 }}>
              <Button
                variant="secondary"
                onClick={() => setActiveFolder(null)}
                style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem" }}
              >
                All folders
              </Button>
              <Button
                onClick={() => startUpload(activeFolder)}
                disabled={uploadDocument.isPending}
                style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem" }}
              >
                <Upload size={14} /> Upload
              </Button>
            </span>
          }
        >
          {folderDocs.length === 0 ? (
            <EmptyState
              title="Folder is empty"
              detail="Upload statements, bills, or records to keep them with your finances."
            />
          ) : (
            <div className="data-list">
              {folderDocs.map((document_) => (
                <div className="data-list__row" key={document_.id}>
                  <div className="data-list__main">
                    <div className="data-list__title">{document_.name}</div>
                    <div className="data-list__subtitle">
                      {formatSize(document_.sizeBytes)} ·{" "}
                      {new Date(document_.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Button
                      variant="secondary"
                      onClick={() => void handleDownload(document_)}
                      aria-label={`Download ${document_.name}`}
                      style={{ padding: "0.35rem 0.6rem" }}
                    >
                      <Download size={14} />
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => deleteDocument.mutate(document_)}
                      aria-label={`Delete ${document_.name}`}
                      style={{ padding: "0.35rem 0.6rem" }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <div className="three-col">
          {DOCUMENT_FOLDERS.map((folder) => {
            const count = byFolder.get(folder)?.length ?? 0;
            return (
              <Card key={folder}>
                <button
                  onClick={() => setActiveFolder(folder)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: 0,
                  }}
                >
                  <span className="empty-state__icon" style={{ marginBottom: 0 }}>
                    <FolderClosed size={20} />
                  </span>
                  <span>
                    <span style={{ fontWeight: 600, display: "block" }}>
                      {folder}
                    </span>
                    <StatusBadge tone={count > 0 ? "blue" : "gray"}>
                      {count} file{count === 1 ? "" : "s"}
                    </StatusBadge>
                  </span>
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
