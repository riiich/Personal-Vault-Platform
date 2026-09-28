import { useState } from "react";
import { useApp } from "../app/context";
import { Icon } from "../components/ui/Icon";
import type { Folder } from "../data/models";
import { FileCard } from "../features/files/FileCard";
import { FileDetails } from "../features/files/FileDetails";
import { DropZone } from "../features/files/DropZone";

function LockedFolder({ folder }: { folder: Folder }) {
  const { repository } = useApp();
  const [pin, setPin] = useState(""),
    [error, setError] = useState("");
  return (
    <div className="locked-view">
      <div className="empty-icon">
        <Icon name="lock" size={32} />
      </div>
      <h2>{folder.name} is locked</h2>
      <p>Enter this folder’s PIN to see what’s inside.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          try {
            repository.unlock(folder.id, pin);
            setPin("");
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <label className="sr-only" htmlFor="unlock-pin">
          Folder PIN
        </label>
        <input
          id="unlock-pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]{4,8}"
          minLength={4}
          maxLength={8}
          placeholder="Enter PIN"
          value={pin}
          onChange={(event) => {
            setPin(event.target.value.replace(/\D/g, ""));
            setError("");
          }}
          autoComplete="off"
          required
        />
        <button className="button primary" type="submit">
          <Icon name="unlock" size={17} />
          Unlock folder
        </button>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </form>
      <p className="helper">
        PIN locking is a visual demo until backend protection is connected.
      </p>
    </div>
  );
}

export function LibraryBrowser({
  globalSearch = "",
}: {
  globalSearch?: string;
}) {
  const { library, repository, location, navigate, showDialog, notify } =
    useApp();
  const [query, setQuery] = useState(""),
    [sort, setSort] = useState("newest"),
    [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<string[]>([]),
    [detailId, setDetailId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const folder = library.folders.find((item) => item.id === location.folderId);
  const space = library.spaces.find((item) => item.id === folder?.spaceId);
  const locked = folder ? repository.lockedAncestor(folder.id) : undefined;
  const title =
    folder?.name ??
    {
      all: "All files",
      recent: "Recently added",
      favorites: "Favorites",
      trash: "Trash",
      home: "Your files",
      settings: "Settings",
    }[location.page];
  const search = query.trim().toLowerCase();
  const globalQuery = globalSearch.trim().toLowerCase();
  const files = library.files
    .filter((file) => {
      if (repository.lockedAncestor(file.folderId)) return false;
      if (location.page === "trash" ? !file.deletedAt : !!file.deletedAt)
        return false;
      if (folder && file.folderId !== folder.id) return false;
      if (location.page === "favorites" && !file.favorite) return false;
      return file.name.toLowerCase().includes(search) && file.name.toLowerCase().includes(globalQuery);
    })
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "size"
          ? b.size - a.size
          : b.createdAt.localeCompare(a.createdAt),
    );
  const children = locked
    ? []
    : library.folders.filter(
        (item) =>
          item.parentId === folder?.id &&
          item.name.toLowerCase().includes(search),
      );
  const categories =
    folder && !locked
      ? library.categories.filter((item) => item.folderId === folder.id)
      : [];
  const groups = folder
    ? [
        ...categories.map((item) => ({
          ...item,
          files: files.filter((file) => file.categoryId === item.id),
        })),
        {
          id: "",
          name: "Uncategorized",
          color: "gray",
          files: files.filter((file) => !file.categoryId),
        },
      ]
    : [
        {
          id: "all",
          name: location.page === "trash" ? "Deleted files" : "Your files",
          color: "blue",
          files,
        },
      ];
  const activeSelection = selected.filter((id) =>
    files.some((file) => file.id === id),
  );
  const detail = files.find((file) => file.id === detailId);
  const breadcrumbs: Folder[] = [];
  let ancestor = folder;
  while (ancestor) {
    breadcrumbs.unshift(ancestor);
    ancestor = library.folders.find((item) => item.id === ancestor?.parentId);
  }
  if (location.folderId && !folder)
    return (
      <div className="empty-state">
        <Icon name="folder" size={40} />
        <h2>Folder not found</h2>
        <p>This preview may have been reset. Head back to your Spaces.</p>
        <button className="button" onClick={() => navigate({ page: "home" })}>
          Back to Spaces
        </button>
      </div>
    );
  const toggle = (id: string) =>
    setSelected((value) =>
      value.includes(id) ? value.filter((item) => item !== id) : [...value, id],
    );
  const content = (
    <>
      <div className="browser-header">
        {!folder && <nav className="collection-tabs" aria-label="File collections">
          {([['all', 'All files'], ['recent', 'Recent'], ['favorites', 'Favorites'], ['trash', 'Trash']] as const).map(([page, label]) => <button key={page} className={location.page === page ? 'active' : ''} onClick={() => navigate({ page })}>{label}</button>)}
        </nav>}
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <button onClick={() => navigate({ page: "home" })}>Spaces</button>
          {breadcrumbs.map((item) => (
            <span key={item.id}>
              <Icon name="chevron" size={13} />
              <button
                onClick={() => navigate({ page: "home", folderId: item.id })}
                aria-current={item.id === folder?.id ? "page" : undefined}
              >
                {item.name}
              </button>
            </span>
          ))}
        </nav>
        <div className="page-intro compact-intro">
          <div className="folder-title">
            {space && (
              <img
                className="folder-cover"
                src={`/covers/${space.cover}.jpg`}
                alt=""
              />
            )}
            <div>
              <h1>
                {title}
                {folder?.pinEnabled && (
                  <Icon name={locked ? "lock" : "unlock"} size={21} />
                )}
              </h1>
              <p>
                {locked
                  ? "Enter your PIN to continue."
                  : `${files.length} ${files.length === 1 ? "file" : "files"}${children.length ? ` · ${children.length} folders` : ""}`}
                {location.page === "trash"
                  ? " · Restore files whenever you need them."
                  : folder
                    ? " · Everything in its place."
                    : " · All your things, together."}
              </p>
            </div>
          </div>
          {folder && !locked && (
            <div className="heading-actions">
              <button
                className="button new-folder-button"
                onClick={() =>
                  showDialog({ type: "folder", folderId: folder.id })
                }
              >
                <Icon name="plus" size={17} />
                New folder
              </button>
              <button
                className="button primary"
                onClick={() =>
                  showDialog({ type: "upload", folderId: folder.id })
                }
              >
                <Icon name="upload" size={17} />
                Upload
              </button>
              <button
                className="icon-button bordered"
                aria-label="Folder settings"
                onClick={() =>
                  showDialog({ type: "folder-settings", folderId: folder.id })
                }
              >
                <Icon name="more" />
              </button>
            </div>
          )}
        </div>
      </div>
      {locked ? (
        <LockedFolder folder={locked} />
      ) : (
        <div className={`browser-layout ${detail ? "with-details" : ""}`}>
          <div className="browser-main">
            <div className="file-toolbar">
              <label className="search-field">
                <Icon name="search" size={18} />
                <input
                  aria-label="Search files in this view"
                  placeholder={
                    folder ? "Search in this folder…" : "Search your files…"
                  }
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {query && (
                  <button
                    className="icon-button"
                    aria-label="Clear file search"
                    onClick={() => setQuery("")}
                  >
                    <Icon name="close" size={14} />
                  </button>
                )}
              </label>
              <select
                className="sort-select"
                aria-label="Sort files"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="name">Name A–Z</option>
                <option value="size">Largest first</option>
              </select>
              <div className="view-toggle" aria-label="File view">
                <button
                  className={view === "grid" ? "active" : ""}
                  aria-label="Grid view"
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}
                >
                  <Icon name="grid" size={17} />
                </button>
                <button
                  className={view === "list" ? "active" : ""}
                  aria-label="List view"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                >
                  <Icon name="list" size={18} />
                </button>
              </div>
            </div>
            {activeSelection.length > 0 && (
              <div className="selection-bar">
                <span>{activeSelection.length} selected</span>
                {folder && location.page !== "trash" && (
                  <select
                    aria-label="Assign category to selected files"
                    value=""
                    onChange={(event) => {
                      repository.categorize(
                        activeSelection,
                        event.target.value === "__none"
                          ? null
                          : event.target.value,
                      );
                      notify("Category updated.");
                      setSelected([]);
                    }}
                  >
                    <option value="" disabled>
                      Set category…
                    </option>
                    <option value="__none">Uncategorized</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                )}
                {location.page !== "trash" && (
                  <button
                    className="text-button"
                    onClick={() =>
                      showDialog({ type: "move", fileIds: activeSelection })
                    }
                  >
                    <Icon name="move" size={16} />
                    Move
                  </button>
                )}
                <button
                  className="icon-button"
                  aria-label={
                    location.page === "trash"
                      ? "Restore selected files"
                      : "Move selected files to Trash"
                  }
                  onClick={() => {
                    repository.trashFiles(
                      activeSelection,
                      location.page === "trash",
                    );
                    setSelected([]);
                    notify(
                      location.page === "trash"
                        ? "Files restored."
                        : "Files moved to Trash.",
                    );
                  }}
                >
                  <Icon
                    name={location.page === "trash" ? "restore" : "trash"}
                    size={17}
                  />
                </button>
                <button
                  className="icon-button"
                  aria-label="Clear selection"
                  onClick={() => setSelected([])}
                >
                  <Icon name="close" size={17} />
                </button>
              </div>
            )}
            {children.length > 0 && (
              <section className="subfolders">
                <h2 className="small-section-title">
                  Folders<span>{children.length}</span>
                </h2>
                <div className="folder-grid">
                  {children.map((child) => (
                    <DropZone key={child.id} folderId={child.id}>
                      <button
                        className="folder-tile"
                        onClick={() =>
                          navigate({ page: "home", folderId: child.id })
                        }
                      >
                        <span className="folder-tile-icon">
                          <Icon
                            name={
                              repository.lockedAncestor(child.id)
                                ? "lock"
                                : "folder"
                            }
                            size={24}
                          />
                        </span>
                        <span>
                          <strong>{child.name}</strong>
                          <small>
                            {repository.lockedAncestor(child.id)
                              ? "Locked"
                              : `${library.files.filter((file) => file.folderId === child.id && !file.deletedAt).length} files`}
                          </small>
                        </span>
                        <Icon name="chevron" size={16} />
                      </button>
                    </DropZone>
                  ))}
                </div>
              </section>
            )}
            <div className="grouping-heading">
              <span>
                {folder
                  ? "GROUPED BY CATEGORY"
                  : globalSearch
                    ? `RESULTS FOR “${globalSearch}”`
                    : location.page === "recent"
                      ? "LATEST UPLOADS"
                      : "YOUR LIBRARY"}
              </span>
              {folder && (
                <button
                  className="text-button"
                  onClick={() =>
                    showDialog({ type: "category", folderId: folder.id })
                  }
                >
                  <Icon name="plus" size={15} />
                  New category
                </button>
              )}
            </div>
      {(search || globalQuery) && !files.length && !children.length ? (
              <div className="empty-state">
                <Icon name="search" size={32} />
                <h3>No matches found</h3>
                <p>Try a different filename.</p>
              </div>
            ) : (
              groups
                .filter((group) => !search || group.files.length)
                .map((group) => {
                  const section = (
                    <section className="category-section">
                      <div className="category-heading">
                        <button
                          className="category-collapse"
                          aria-expanded={!collapsed.includes(group.id)}
                          onClick={() =>
                            setCollapsed((value) =>
                              value.includes(group.id)
                                ? value.filter((id) => id !== group.id)
                                : [...value, group.id],
                            )
                          }
                        >
                          <Icon
                            name={
                              collapsed.includes(group.id) ? "chevron" : "down"
                            }
                            size={15}
                          />
                          <span className={`category-dot ${group.color}`} />
                          <h2>{group.name}</h2>
                          <span className="category-count">
                            {group.files.length}
                          </span>
                        </button>
                        {folder && group.id && (
                          <button
                            className="icon-button"
                            aria-label={`Edit ${group.name} category`}
                            onClick={() =>
                              showDialog({
                                type: "category",
                                folderId: folder.id,
                                categoryId: group.id,
                              })
                            }
                          >
                            <Icon name="more" size={18} />
                          </button>
                        )}
                      </div>
                      {!collapsed.includes(group.id) &&
                        (group.files.length ? (
                          <div
                            className={`file-grid ${view === "list" ? "list-view" : ""}`}
                          >
                            {group.files.map((file) => (
                              <FileCard
                                key={file.id}
                                file={file}
                                selected={activeSelection.includes(file.id)}
                                onSelect={() => toggle(file.id)}
                                onOpen={() => {
                                  setDetailId(file.id);
                                  if (
                                    window.matchMedia("(max-width: 760px)")
                                      .matches
                                  )
                                    showDialog({
                                      type: "preview",
                                      fileId: file.id,
                                    });
                                }}
                                onFavorite={() => repository.favorite(file.id)}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="empty-category">
                            <Icon
                              name={
                                location.page === "trash" ? "trash" : "folder"
                              }
                              size={24}
                            />
                            <span>
                              {location.page === "trash"
                                ? "Trash is empty. A fresh start."
                                : location.page === "favorites"
                                  ? "Favorite a file to keep it close."
                                  : "A little room for something new."}
                            </span>
                            {folder && (
                              <button
                                className="text-button"
                                onClick={() =>
                                  showDialog({
                                    type: "upload",
                                    folderId: folder.id,
                                    categoryId: group.id,
                                  })
                                }
                              >
                                Add files
                                <Icon name="plus" size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                    </section>
                  );
                  return folder ? (
                    <DropZone
                      key={group.id}
                      folderId={folder.id}
                      categoryId={group.id}
                    >
                      {section}
                    </DropZone>
                  ) : (
                    <div key={group.id}>{section}</div>
                  );
                })
            )}
            {folder && (
              <p className="folder-drop-hint">
                <Icon name="upload" size={15} />
                Drop files into a category, or use Upload to choose from your
                device.
              </p>
            )}
          </div>
          {detail && (
            <FileDetails file={detail} onClose={() => setDetailId(null)} />
          )}
        </div>
      )}
    </>
  );
  return (
    <div className="library-page page-enter">
      {folder && !locked ? (
        <DropZone folderId={folder.id}>{content}</DropZone>
      ) : (
        content
      )}
    </div>
  );
}
