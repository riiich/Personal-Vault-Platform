import type { Cover, Folder, Library, VaultFile } from "./models.ts";
import { seed } from "./seed.ts";

// This adapter owns all demo data. Replace its operations with API calls when
// the backend is ready; browser components never need storage paths or keys.
export function createDemoVault(initial: Library = seed) {
  let state: Library = structuredClone(initial);
  let snapshot: Library = { ...state };
  const listeners = new Set<() => void>();
  const pins = new Map<string, string>();
  const objectUrls = new Set<string>();
  const publish = () => {
    snapshot = { ...state };
    listeners.forEach((listener) => listener());
  };
  const id = () => crypto.randomUUID();
  const name = (value: string) => {
    const result = value.trim();
    if (!result || result.length > 100)
      throw new Error("Use a name between 1 and 100 characters.");
    return result;
  };
  const getFolder = (folderId: string) => {
    const folder = state.folders.find((item) => item.id === folderId);
    if (!folder) throw new Error("This folder could not be found.");
    return folder;
  };
  const lockedAncestor = (folderId: string): Folder | undefined => {
    let folder: Folder | undefined = getFolder(folderId);
    while (folder) {
      if (folder.locked) return folder;
      folder = state.folders.find((item) => item.id === folder?.parentId);
    }
    return undefined;
  };
  const writable = (folderId: string) => {
    if (lockedAncestor(folderId))
      throw new Error("Unlock the destination folder first.");
    return getFolder(folderId);
  };
  const validateCategory = (folderId: string, categoryId: string | null) => {
    if (
      categoryId &&
      !state.categories.some(
        (item) => item.id === categoryId && item.folderId === folderId,
      )
    )
      throw new Error("Choose a category in this folder.");
  };
  const getFiles = (ids: string[]) =>
    ids.map((fileId) => {
      const file = state.files.find((item) => item.id === fileId);
      if (!file) throw new Error("This file could not be found.");
      writable(file.folderId);
      return file;
    });
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    lockedAncestor,
    createSpace(value: string, cover: Cover, description: string) {
      const title = name(value);
      if (
        state.spaces.some(
          (space) => space.name.toLowerCase() === title.toLowerCase(),
        )
      )
        throw new Error("A Space with this name already exists.");
      const spaceId = id(),
        rootFolderId = id();
      state.spaces = [
        ...state.spaces,
        {
          id: spaceId,
          name: title,
          cover,
          description: description.trim(),
          rootFolderId,
        },
      ];
      state.folders = [
        ...state.folders,
        {
          id: rootFolderId,
          spaceId,
          name: title,
          parentId: null,
          pinEnabled: false,
          locked: false,
        },
      ];
      publish();
      return rootFolderId;
    },
    updateSpace(
      spaceId: string,
      value: string,
      cover: Cover,
      description: string,
    ) {
      const title = name(value);
      const space = state.spaces.find((item) => item.id === spaceId);
      if (!space) throw new Error("This Space could not be found.");
      writable(space.rootFolderId);
      if (
        state.spaces.some(
          (item) =>
            item.id !== spaceId &&
            item.name.toLowerCase() === title.toLowerCase(),
        )
      )
        throw new Error("A Space with this name already exists.");
      state.spaces = state.spaces.map((item) =>
        item.id === spaceId
          ? { ...item, name: title, cover, description: description.trim() }
          : item,
      );
      state.folders = state.folders.map((item) =>
        item.id === space.rootFolderId ? { ...item, name: title } : item,
      );
      publish();
    },
    createFolder(parentId: string, value: string) {
      const parent = writable(parentId),
        title = name(value);
      if (
        state.folders.some(
          (folder) =>
            folder.parentId === parentId &&
            folder.name.toLowerCase() === title.toLowerCase(),
        )
      )
        throw new Error("A folder with this name already exists here.");
      const folderId = id();
      state.folders = [
        ...state.folders,
        {
          id: folderId,
          spaceId: parent.spaceId,
          parentId,
          name: title,
          pinEnabled: false,
          locked: false,
        },
      ];
      publish();
      return folderId;
    },
    renameFolder(folderId: string, value: string) {
      const folder = writable(folderId),
        title = name(value);
      if (
        state.folders.some(
          (item) =>
            item.id !== folderId &&
            item.parentId === folder.parentId &&
            item.name.toLowerCase() === title.toLowerCase(),
        )
      )
        throw new Error("A folder with this name already exists here.");
      state.folders = state.folders.map((item) =>
        item.id === folderId ? { ...item, name: title } : item,
      );
      state.spaces = state.spaces.map((item) =>
        item.rootFolderId === folderId ? { ...item, name: title } : item,
      );
      publish();
    },
    saveCategory(folderId: string, value: string, categoryId?: string) {
      writable(folderId);
      const title = name(value);
      if (
        state.categories.some(
          (item) =>
            item.folderId === folderId &&
            item.id !== categoryId &&
            item.name.toLowerCase() === title.toLowerCase(),
        )
      )
        throw new Error("This folder already has that category.");
      if (
        categoryId &&
        !state.categories.some(
          (item) => item.id === categoryId && item.folderId === folderId,
        )
      )
        throw new Error("Category not found.");
      if (categoryId)
        state.categories = state.categories.map((item) =>
          item.id === categoryId ? { ...item, name: title } : item,
        );
      else
        state.categories = [
          ...state.categories,
          {
            id: id(),
            folderId,
            name: title,
            color: ["blue", "green", "amber"][state.categories.length % 3],
          },
        ];
      publish();
    },
    deleteCategory(categoryId: string) {
      const category = state.categories.find((item) => item.id === categoryId);
      if (!category) return;
      writable(category.folderId);
      state.categories = state.categories.filter(
        (item) => item.id !== categoryId,
      );
      state.files = state.files.map((item) =>
        item.categoryId === categoryId ? { ...item, categoryId: null } : item,
      );
      publish();
    },
    categorize(ids: string[], categoryId: string | null) {
      const files = getFiles(ids);
      files.forEach((file) => validateCategory(file.folderId, categoryId));
      state.files = state.files.map((item) =>
        ids.includes(item.id) ? { ...item, categoryId } : item,
      );
      publish();
    },
    favorite(fileId: string) {
      getFiles([fileId]);
      state.files = state.files.map((item) =>
        item.id === fileId ? { ...item, favorite: !item.favorite } : item,
      );
      publish();
    },
    renameFile(fileId: string, value: string) {
      getFiles([fileId]);
      const title = name(value);
      state.files = state.files.map((item) =>
        item.id === fileId ? { ...item, name: title } : item,
      );
      publish();
    },
    moveFiles(ids: string[], folderId: string) {
      writable(folderId);
      getFiles(ids);
      state.files = state.files.map((item) =>
        ids.includes(item.id) && item.folderId !== folderId
          ? { ...item, folderId, categoryId: null }
          : item,
      );
      publish();
    },
    trashFiles(ids: string[], restore = false) {
      getFiles(ids);
      state.files = state.files.map((item) =>
        ids.includes(item.id)
          ? { ...item, deletedAt: restore ? null : new Date().toISOString() }
          : item,
      );
      publish();
    },
    addFiles(files: File[], folderId: string, categoryId: string | null) {
      writable(folderId);
      validateCategory(folderId, categoryId);
      const added: VaultFile[] = files.map((file) => {
        const source = URL.createObjectURL(file);
        objectUrls.add(source);
        return {
          id: id(),
          folderId,
          categoryId,
          name: file.name,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          createdAt: new Date().toISOString(),
          favorite: false,
          deletedAt: null,
          source,
          local: true,
        };
      });
      state.files = [...added, ...state.files];
      publish();
      return added;
    },
    setPin(folderId: string, pin: string, currentPin?: string) {
      writable(folderId);
      if (pins.has(folderId) && pins.get(folderId) !== currentPin)
        throw new Error("The current PIN is incorrect.");
      if (pin && !/^\d{4,8}$/.test(pin))
        throw new Error("Use a numeric PIN with 4 to 8 digits.");
      if (pin) pins.set(folderId, pin);
      else pins.delete(folderId);
      state.folders = state.folders.map((item) =>
        item.id === folderId
          ? { ...item, pinEnabled: !!pin, locked: false }
          : item,
      );
      publish();
    },
    lock(folderId: string) {
      if (!pins.has(folderId))
        throw new Error("Set a PIN in folder settings first.");
      state.folders = state.folders.map((item) =>
        item.id === folderId ? { ...item, locked: true } : item,
      );
      publish();
    },
    unlock(folderId: string, pin: string) {
      if (!pins.has(folderId) || pins.get(folderId) !== pin)
        throw new Error("That PIN is incorrect. Try again.");
      state.folders = state.folders.map((item) =>
        item.id === folderId ? { ...item, locked: false } : item,
      );
      publish();
    },
    reset() {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.clear();
      pins.clear();
      state = structuredClone(initial);
      publish();
    },
  };
}

export type VaultRepository = ReturnType<typeof createDemoVault>;
export const vault = createDemoVault();
