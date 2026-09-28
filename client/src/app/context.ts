import { createContext, useContext } from "react";
import type { Library, Location, VaultFile } from "../data/models";
import type { VaultRepository } from "../data/vault";

export type DialogState =
  | { type: "space"; spaceId?: string }
  | { type: "folder"; folderId: string }
  | { type: "category"; folderId: string; categoryId?: string }
  | { type: "folder-settings"; folderId: string }
  | { type: "upload"; folderId: string; categoryId?: string; files?: File[] }
  | { type: "rename"; fileId: string }
  | { type: "move"; fileIds: string[] }
  | { type: "preview"; fileId: string }
  | { type: "reset" };

export type Theme = "light" | "dark" | "system";
export interface AppContextValue {
  library: Library;
  repository: VaultRepository;
  location: Location;
  navigate: (location: Location) => void;
  showDialog: (dialog: DialogState | null) => void;
  notify: (message: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  uploads: VaultFile[];
  onUploaded: (files: VaultFile[]) => void;
}
export const AppContext = createContext<AppContextValue | null>(null);
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("App context is missing");
  return value;
}
