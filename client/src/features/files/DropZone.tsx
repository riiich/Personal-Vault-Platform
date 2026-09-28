import { useState } from "react";
import type { DragEvent, ReactNode } from "react";
import { useApp } from "../../app/context";

export const FILE_DRAG_TYPE = "application/x-vault-file";

export function DropZone({
  folderId,
  categoryId,
  className = "",
  children,
}: {
  folderId: string;
  categoryId?: string;
  className?: string;
  children: ReactNode;
}) {
  const { repository, showDialog, notify } = useApp();
  const [over, setOver] = useState(false);
  const accept = (event: DragEvent) =>
    Array.from(event.dataTransfer.types).some(
      (type) => type === "Files" || type === FILE_DRAG_TYPE,
    );
  function drop(event: DragEvent) {
    if (!accept(event)) return;
    event.preventDefault();
    event.stopPropagation();
    setOver(false);
    if (repository.lockedAncestor(folderId)) {
      notify("Unlock this folder before adding files.");
      return;
    }
    const internal = event.dataTransfer.getData(FILE_DRAG_TYPE);
    try {
      if (internal) {
        const ids: unknown = JSON.parse(internal);
        if (
          !Array.isArray(ids) ||
          !ids.every((value) => typeof value === "string")
        )
          return;
        repository.moveFiles(ids, folderId);
        if (categoryId !== undefined)
          repository.categorize(ids, categoryId || null);
        notify(
          categoryId
            ? "Files added to the category."
            : "Files moved to the folder.",
        );
      } else {
        const entries = Array.from(event.dataTransfer.items).map((item) =>
          item.webkitGetAsEntry?.(),
        );
        if (entries.some((entry) => entry?.isDirectory)) {
          notify(
            "Open the folder on your device and select its files. Folder imports are not supported yet.",
          );
          return;
        }
        const files = Array.from(event.dataTransfer.files);
        if (files.length)
          showDialog({ type: "upload", folderId, categoryId, files });
      }
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Could not move these files.",
      );
    }
  }
  return (
    <div
      className={`drop-zone ${className} ${over ? "is-drag-over" : ""}`}
      onDragOver={(event) => {
        if (accept(event)) {
          event.preventDefault();
          event.stopPropagation();
          event.dataTransfer.dropEffect = event.dataTransfer.types.includes(
            FILE_DRAG_TYPE,
          )
            ? "move"
            : "copy";
          setOver(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setOver(false);
      }}
      onDrop={drop}
    >
      {children}
    </div>
  );
}
