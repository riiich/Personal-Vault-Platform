import type { VaultFile } from "../../data/models";
import { extension, fileKind, formatBytes } from "../../data/models";
import { Icon } from "../../components/ui/Icon";
import type { IconName } from "../../components/ui/Icon";
import { FILE_DRAG_TYPE } from "./DropZone";

const kindIcons: Record<string, IconName> = {
  image: "image",
  video: "video",
  audio: "music",
  pdf: "file",
  sheet: "sheet",
  archive: "archive",
  model: "cube",
  document: "file",
};

export function FileArtwork({
  file,
  large = false,
}: {
  file: VaultFile;
  large?: boolean;
}) {
  const kind = fileKind(file);
  if (kind === "image" && file.source)
    return (
      <img
        className="file-image"
        src={file.source}
        alt=""
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.visibility = "hidden";
        }}
      />
    );
  return (
    <div className={`file-artwork kind-${kind} ${large ? "large" : ""}`}>
      <div className="paper-icon">
        <Icon name={kindIcons[kind]} size={large ? 42 : 32} />
        <span>{extension(file.name).slice(0, 7)}</span>
      </div>
      {kind === "video" && <span className="video-label">VIDEO</span>}
    </div>
  );
}

export function FileCard({
  file,
  selected = false,
  onSelect,
  onOpen,
  onFavorite,
  compact = false,
}: {
  file: VaultFile;
  selected?: boolean;
  onSelect?: () => void;
  onOpen: () => void;
  onFavorite: () => void;
  compact?: boolean;
}) {
  return (
    <article
      className={`file-card ${selected ? "selected" : ""} ${compact ? "compact" : ""}`}
      draggable={!file.deletedAt}
      onDragStart={(event) => {
        event.dataTransfer.setData(FILE_DRAG_TYPE, JSON.stringify([file.id]));
        event.dataTransfer.effectAllowed = "move";
      }}
    >
      <button
        className="file-open"
        onClick={onOpen}
        aria-label={`Open ${file.name}`}
      >
        <div className="file-thumbnail">
          <FileArtwork file={file} />
        </div>
        <div className="file-caption">
          <strong title={file.name}>{file.name}</strong>
          <span>
            {extension(file.name)}
            <i />
            {formatBytes(file.size)}
          </span>
        </div>
      </button>
      {onSelect && (
        <label className={`file-select ${selected ? "visible" : ""}`}>
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            aria-label={`Select ${file.name}`}
          />
        </label>
      )}
      <button
        className={`file-favorite icon-button ${file.favorite ? "active" : ""}`}
        aria-label={`${file.favorite ? "Unfavorite" : "Favorite"} ${file.name}`}
        aria-pressed={file.favorite}
        onClick={onFavorite}
      >
        <Icon name="star" size={15} />
      </button>
    </article>
  );
}
