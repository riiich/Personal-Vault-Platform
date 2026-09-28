import { useApp } from "../../app/context";
import type { VaultFile } from "../../data/models";
import { extension, formatBytes } from "../../data/models";
import { Icon } from "../../components/ui/Icon";
import { FileArtwork } from "./FileCard";
import { downloadFile } from "./download";

export function FileDetails({
  file,
  onClose,
}: {
  file: VaultFile;
  onClose: () => void;
}) {
  const { library, repository, showDialog, notify } = useApp();
  const folder = library.folders.find((item) => item.id === file.folderId);
  const categories = library.categories.filter(
    (item) => item.folderId === file.folderId,
  );
  return (
    <aside className="file-details" aria-label={`Details for ${file.name}`}>
      <header>
        <h3>File details</h3>
        <button
          className="icon-button"
          aria-label="Close file details"
          onClick={onClose}
        >
          <Icon name="close" size={18} />
        </button>
      </header>
      <button
        className="details-art"
        onClick={() => showDialog({ type: "preview", fileId: file.id })}
        aria-label={`Preview ${file.name}`}
      >
        <FileArtwork file={file} large />
      </button>
      <h3 className="details-filename">{file.name}</h3>
      <p>
        {extension(file.name)} file<span className="footer-dot">·</span>
        {formatBytes(file.size)}
      </p>
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
      <dl className="file-meta">
        <div>
          <dt>Folder</dt>
          <dd>{folder?.name}</dd>
        </div>
        <div>
          <dt>Added</dt>
          <dd>
            {new Date(file.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </dd>
        </div>
        <div>
          <dt>Size</dt>
          <dd>{formatBytes(file.size)}</dd>
        </div>
      </dl>
      <div className="details-actions">
        <button
          className="button primary"
          onClick={() => showDialog({ type: "preview", fileId: file.id })}
        >
          <Icon name="image" size={17} />
          Open preview
        </button>
        <button
          className="button"
          disabled={!file.source && file.text === undefined}
          onClick={() => downloadFile(file)}
        >
          <Icon name="download" size={17} />
          Download
        </button>
        {!file.source && file.text === undefined && (
          <p className="helper">
            This sample has metadata only. Add a local file to try previews and
            downloads.
          </p>
        )}
        {!file.deletedAt && (
          <>
            <button
              className="detail-action"
              onClick={() => showDialog({ type: "rename", fileId: file.id })}
            >
              <Icon name="edit" size={17} />
              Rename file
            </button>
            <button
              className="detail-action"
              onClick={() => showDialog({ type: "move", fileIds: [file.id] })}
            >
              <Icon name="move" size={17} />
              Move to folder
            </button>
          </>
        )}
        <button
          className={`detail-action ${file.deletedAt ? "" : "danger-text"}`}
          onClick={() => {
            repository.trashFiles([file.id], !!file.deletedAt);
            notify(file.deletedAt ? "File restored." : "File moved to Trash.");
            onClose();
          }}
        >
          <Icon name={file.deletedAt ? "restore" : "trash"} size={17} />
          {file.deletedAt ? "Restore file" : "Move to Trash"}
        </button>
      </div>
    </aside>
  );
}
