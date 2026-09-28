import type { VaultFile } from "../../data/models";

export function downloadFile(file: VaultFile) {
  const source =
    file.source ??
    (file.text !== undefined
      ? URL.createObjectURL(new Blob([file.text], { type: file.mimeType }))
      : undefined);
  if (!source) return;
  const anchor = document.createElement("a");
  anchor.href = source;
  anchor.download = file.name;
  anchor.click();
  if (!file.source) window.setTimeout(() => URL.revokeObjectURL(source), 1000);
}
