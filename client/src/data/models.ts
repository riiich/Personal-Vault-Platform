export type Cover = "mountains" | "architecture" | "coast" | "journal";
export type Page =
  "home" | "all" | "recent" | "favorites" | "trash" | "settings";
export type Location = { page: Page; folderId?: string };

export interface Space {
  id: string;
  name: string;
  description: string;
  cover: Cover;
  rootFolderId: string;
}

export interface Folder {
  id: string;
  name: string;
  spaceId: string;
  parentId: string | null;
  pinEnabled: boolean;
  locked: boolean;
}

export interface Category {
  id: string;
  folderId: string;
  name: string;
  color: string;
}

export interface VaultFile {
  id: string;
  folderId: string;
  categoryId: string | null;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
  favorite: boolean;
  deletedAt: string | null;
  source?: string;
  text?: string;
  local?: boolean;
}

export interface Library {
  spaces: Space[];
  folders: Folder[];
  categories: Category[];
  files: VaultFile[];
}

export const covers: { id: Cover; label: string }[] = [
  { id: "mountains", label: "Mountains" },
  { id: "architecture", label: "Architecture" },
  { id: "coast", label: "Coast" },
  { id: "journal", label: "Journal" },
];

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

export function extension(name: string) {
  const index = name.lastIndexOf(".");
  return index > 0 ? name.slice(index + 1).toUpperCase() : "FILE";
}

export function fileKind(file: VaultFile) {
  if (file.mimeType.startsWith("image/")) return "image";
  if (file.mimeType.startsWith("video/")) return "video";
  if (file.mimeType.startsWith("audio/")) return "audio";
  if (file.mimeType === "application/pdf") return "pdf";
  if (["CSV", "XLSX", "XLS"].includes(extension(file.name))) return "sheet";
  if (["ZIP", "7Z", "RAR", "TAR", "GZ"].includes(extension(file.name)))
    return "archive";
  if (["BLEND", "OBJ", "STL", "GLB"].includes(extension(file.name)))
    return "model";
  return "document";
}
