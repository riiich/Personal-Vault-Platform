import { useRef, useState } from "react";
import { useApp } from "../../app/context";
import type { DialogState } from "../../app/context";
import { Modal } from "../../components/ui/Modal";
import { Icon } from "../../components/ui/Icon";
import { formatBytes } from "../../data/models";

export function UploadDialog({
  dialog,
}: {
  dialog: Extract<DialogState, { type: "upload" }>;
}) {
  const { library, repository, showDialog, onUploaded, notify } = useApp();
  const [files, setFiles] = useState<File[]>(dialog.files ?? []);
  const [folderId, setFolderId] = useState(dialog.folderId);
  const [categoryId, setCategoryId] = useState(dialog.categoryId ?? "");
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const categories = library.categories.filter(
    (category) => category.folderId === folderId,
  );
  function path(id: string) {
    const parts: string[] = [];
    let folder = library.folders.find((item) => item.id === id);
    while (folder) {
      parts.unshift(folder.name);
      folder = library.folders.find((item) => item.id === folder?.parentId);
    }
    return parts.join(" / ");
  }
  return (
    <Modal
      title="A little more, all in one place."
      subtitle="Choose your files and we’ll keep them together."
      onClose={() => showDialog(null)}
    >
      <form
        className="dialog-form"
        onSubmit={(event) => {
          event.preventDefault();
          try {
            if (!files.length) throw new Error("Choose at least one file.");
            const added = repository.addFiles(
              files,
              folderId,
              categoryId || null,
            );
            onUploaded(added);
            notify(
              `${added.length} ${added.length === 1 ? "file" : "files"} added to the local preview.`,
            );
            showDialog(null);
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <label className="field-label">
          Destination folder
          <select
            value={folderId}
            onChange={(event) => {
              setFolderId(event.target.value);
              setCategoryId("");
            }}
          >
            {library.folders.map((folder) => (
              <option
                key={folder.id}
                value={folder.id}
                disabled={!!repository.lockedAncestor(folder.id)}
              >
                {path(folder.id)}
                {repository.lockedAncestor(folder.id) ? " (locked)" : ""}
              </option>
            ))}
          </select>
        </label>
        <div
          className="upload-drop"
          onDragOver={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const entries = Array.from(event.dataTransfer.items).map((item) =>
              item.webkitGetAsEntry?.(),
            );
            if (entries.some((entry) => entry?.isDirectory)) {
              setError(
                "Select individual files. Folder imports are not supported yet.",
              );
              return;
            }
            setFiles((value) => [
              ...value,
              ...Array.from(event.dataTransfer.files),
            ]);
            setError("");
          }}
        >
          <span className="upload-emblem">
            <Icon name="upload" size={25} />
          </span>
          <strong><span className="desktop-upload-label">Drop your files here</span><span className="mobile-upload-label">Choose files from your device</span></strong>
          <span>Photos, documents, videos. Anything you want to keep.</span>
          <button
            className="button"
            type="button"
            onClick={() => input.current?.click()}
          >
            <Icon name="plus" size={17} />
            Choose files
          </button>
          <input
            ref={input}
            type="file"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-label="Choose files to upload"
            onChange={(event) => {
              setFiles((value) => [
                ...value,
                ...Array.from(event.target.files ?? []),
              ]);
              event.target.value = "";
              setError("");
            }}
          />
        </div>
        <label className="field-label">
          Category <span className="optional">optional</span>
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        {files.length > 0 && (
          <div className="upload-selection">
            <div className="small-section-title">
              Selected files<span>{files.length}</span>
            </div>
            <div className="upload-file-list">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`}>
                  <Icon name="file" size={18} />
                  <span title={file.name}>{file.name}</span>
                  <small>{formatBytes(file.size)}</small>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() =>
                      setFiles((value) => value.filter((_, i) => i !== index))
                    }
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="demo-note">
          <Icon name="info" size={16} />
          <span>
            Local preview: files stay in this tab and reset on refresh. Nothing
            is uploaded to your Pi yet.
          </span>
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <footer className="modal-footer">
          <button
            className="button"
            type="button"
            onClick={() => showDialog(null)}
          >
            Cancel
          </button>
          <button
            className="button primary"
            type="submit"
            disabled={!files.length}
          >
            <Icon name="upload" size={17} />
            Add {files.length || ""} {files.length === 1 ? "file" : "files"} to
            preview
          </button>
        </footer>
      </form>
    </Modal>
  );
}
