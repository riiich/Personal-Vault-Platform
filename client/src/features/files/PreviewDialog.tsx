import { useEffect, useState } from "react";
import { useApp } from "../../app/context";
import { Modal } from "../../components/ui/Modal";
import { Icon } from "../../components/ui/Icon";
import { extension, fileKind, formatBytes } from "../../data/models";
import type { VaultFile } from "../../data/models";
import { FileArtwork } from "./FileCard";
import { downloadFile } from "./download";

function TextPreview({ file }: { file: VaultFile }) {
  const [text, setText] = useState(file.text ?? "Loading preview…");
  useEffect(() => {
    if (file.text !== undefined || !file.source) return;
    const controller = new AbortController();
    fetch(file.source, { signal: controller.signal })
      .then((response) => response.text())
      .then((value) => setText(value))
      .catch((error) => {
        if (error.name !== "AbortError")
          setText("This preview could not be loaded.");
      });
    return () => controller.abort();
  }, [file]);
  return <pre className="text-preview">{text}</pre>;
}

export function PreviewDialog({ fileId }: { fileId: string }) {
  const { library, repository, showDialog, notify } = useApp();
  const [failed, setFailed] = useState(false);
  const file = library.files.find((item) => item.id === fileId);
  if (!file || repository.lockedAncestor(file.folderId))
    return (
      <Modal title="File unavailable" onClose={() => showDialog(null)}>
        <p className="dialog-message">
          The file is unavailable or its folder is locked.
        </p>
      </Modal>
    );
  const kind = fileKind(file);
  const categories = library.categories.filter(
    (item) => item.folderId === file.folderId,
  );
  const hasContent = !!file.source || file.text !== undefined;
  const isText =
    file.text !== undefined ||
    (file.size < 1024 * 1024 &&
      (file.mimeType.startsWith("text/") ||
        ["JSON", "MD", "CSV", "TXT", "LOG", "XML"].includes(
          extension(file.name),
        )));
  let preview;
  if (isText && hasContent) preview = <TextPreview file={file} />;
  else if (kind === "image" && file.source && !failed)
    preview = (
      <img
        className="full-image"
        src={file.source}
        alt={file.name}
        onError={() => setFailed(true)}
      />
    );
  else if (kind === "video" && file.source && !failed)
    preview = (
      <video controls src={file.source} onError={() => setFailed(true)} />
    );
  else if (kind === "audio" && file.source && !failed)
    preview = (
      <div className="audio-preview">
        <FileArtwork file={file} large />
        <audio controls src={file.source} onError={() => setFailed(true)} />
      </div>
    );
  else if (kind === "pdf" && file.source)
    preview = (
      <iframe
        title={`Preview of ${file.name}`}
        src={file.source}
        className="pdf-preview"
      />
    );
  else
    preview = (
      <div className="unsupported-preview">
        <FileArtwork file={file} large />
        <h3>
          {hasContent
            ? "Ready to download"
            : "A sample from your future library"}
        </h3>
        <p>
          {hasContent
            ? "This file doesn’t have a browser preview. Download it to open on your device."
            : "This sample contains metadata only. Add a file from your device to try a real preview."}
        </p>
      </div>
    );
  return (
    <Modal
      title={file.name}
      subtitle={`${extension(file.name)} · ${formatBytes(file.size)}`}
      wide
      onClose={() => showDialog(null)}
    >
      <div className="preview-content">{preview}</div>
      <div className="preview-options">
        {!file.deletedAt && (
          <label className="field-label">
            Category
            <select
              value={file.categoryId ?? ""}
              onChange={(event) =>
                repository.categorize([file.id], event.target.value || null)
              }
            >
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="preview-buttons">
          <button
            className={`icon-button bordered ${file.favorite ? "favorite-active" : ""}`}
            aria-label={
              file.favorite ? "Remove from favorites" : "Add to favorites"
            }
            aria-pressed={file.favorite}
            onClick={() => repository.favorite(file.id)}
          >
            <Icon name="star" size={18} />
          </button>
          {file.deletedAt ? (
            <button
              className="button"
              onClick={() => {
                repository.trashFiles([file.id], true);
                notify("File restored.");
                showDialog(null);
              }}
            >
              <Icon name="restore" size={17} />
              Restore
            </button>
          ) : (
            <button
              className="button"
              onClick={() => showDialog({ type: "rename", fileId: file.id })}
            >
              <Icon name="edit" size={17} />
              Rename
            </button>
          )}
          <button
            className="button primary"
            disabled={!hasContent}
            onClick={() => downloadFile(file)}
          >
            <Icon name="download" size={17} />
            Download
          </button>
        </div>
      </div>
    </Modal>
  );
}
