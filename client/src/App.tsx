import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AppContext } from "./app/context";
import type { DialogState, Theme } from "./app/context";
import { Dialogs } from "./app/Dialogs";
import { Icon } from "./components/ui/Icon";
import type { IconName } from "./components/ui/Icon";
import { vault } from "./data/vault";
import type { Location, Page, VaultFile } from "./data/models";
import { Home } from "./pages/Home";
import { LibraryBrowser } from "./pages/LibraryBrowser";
import "./App.css";

const navigation: { page: Page; label: string; icon: IconName }[] = [
  { page: "home", label: "Home", icon: "home" },
  { page: "all", label: "All files", icon: "folder" },
  { page: "recent", label: "Recent", icon: "clock" },
  { page: "favorites", label: "Favorites", icon: "star" },
];

function readLocation(): Location {
  const parts = window.location.hash.slice(1).split("/").filter(Boolean);
  if (parts[0] === "folder" && parts[1])
    return { page: "home", folderId: parts[1] };
  if (["all", "recent", "favorites", "trash", "settings"].includes(parts[0]))
    return { page: parts[0] as Page };
  return { page: "home" };
}
const locationKey = () => window.location.hash;
const subscribeLocation = (callback: () => void) => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};

function App() {
  const library = useSyncExternalStore(vault.subscribe, vault.getSnapshot);
  const routeKey = useSyncExternalStore(subscribeLocation, locationKey);
  const location = readLocation();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem("vault-theme");
      return saved === "light" || saved === "dark" ? saved : "system";
    } catch {
      return "system";
    }
  });
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [toast, setToast] = useState(""),
    [search, setSearch] = useState("");
  const [uploads, setUploads] = useState<VaultFile[]>([]),
    [showUploads, setShowUploads] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = (next: Location) => {
    setSearch("");
    window.location.hash = next.folderId
      ? `/folder/${next.folderId}`
      : `/${next.page}`;
  };
  const notify = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(""), 6000);
  };
  const activeFolder = library.folders.find(
    (folder) => folder.id === location.folderId,
  );
  const visibleFileCount = library.files.filter(
    (file) => !file.deletedAt && !vault.lockedAncestor(file.folderId),
  ).length;
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const value =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.theme = value;
      setResolvedTheme(value);
    };
    apply();
    media.addEventListener("change", apply);
    try {
      localStorage.setItem("vault-theme", theme);
    } catch {
      /* Preferences are optional when storage is blocked. */
    }
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = `${activeFolder?.name ?? (location.page === "home" ? "Your spaces" : (navigation.find((item) => item.page === location.page)?.label ?? location.page))} · Vault`;
  }, [routeKey, activeFolder?.name, location.page]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    const preventFileNavigation = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
    };
    window.addEventListener("keydown", handler);
    window.addEventListener("dragover", preventFileNavigation);
    window.addEventListener("drop", preventFileNavigation);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("dragover", preventFileNavigation);
      window.removeEventListener("drop", preventFileNavigation);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);
  const globalFiles = search.trim().length > 0;
  return (
    <AppContext.Provider
      value={{
        library,
        repository: vault,
        location: globalFiles ? { page: "all" } : location,
        navigate,
        showDialog: setDialog,
        notify,
        theme,
        setTheme,
        uploads,
        onUploaded: (files) => {
          setUploads((value) => [...files, ...value]);
          setShowUploads(true);
        },
      }}
    >
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Skip to content
      </a>
      <div className="app-shell">
        <aside className="sidebar">
          <button className="brand" onClick={() => navigate({ page: "home" })}>
            <span className="brand-mark">
              <Icon name="folder" size={25} />
            </span>
            <span>
              vault<span className="brand-period">.</span>
            </span>
          </button>
          <div className="workspace-label">PERSONAL WORKSPACE</div>
          <nav className="primary-nav" aria-label="Main navigation">
            {navigation.map((item) => (
              <button
                key={item.page}
                className={
                  location.page === item.page &&
                  !location.folderId &&
                  !globalFiles
                    ? "active"
                    : ""
                }
                onClick={() => navigate({ page: item.page })}
              >
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
                {item.page === "all" && <small>{visibleFileCount}</small>}
              </button>
            ))}
          </nav>
          <div className="sidebar-section-label">
            <span>YOUR SPACES</span>
            <button
              className="icon-button"
              aria-label="Create a new Space"
              onClick={() => setDialog({ type: "space" })}
            >
              <Icon name="plus" size={16} />
            </button>
          </div>
          <nav className="space-nav" aria-label="Spaces">
            {library.spaces.map((space) => (
              <button
                key={space.id}
                className={
                  activeFolder?.spaceId === space.id && !globalFiles
                    ? "active"
                    : ""
                }
                onClick={() =>
                  navigate({ page: "home", folderId: space.rootFolderId })
                }
              >
                <span className={`space-nav-dot cover-${space.cover}`} />
                <span>{space.name}</span>
                {activeFolder?.spaceId === space.id && (
                  <Icon name="chevron" size={13} />
                )}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="preview-notice">
              <span className="preview-notice-icon">
                <Icon name="spark" size={18} />
              </span>
              <div>
                <strong>Your Vault, taking shape</strong>
                <p>Local preview · Changes reset on refresh.</p>
              </div>
            </div>
            <nav className="utility-nav" aria-label="Utilities">
              <button
                className={location.page === "trash" ? "active" : ""}
                onClick={() => navigate({ page: "trash" })}
              >
                <Icon name="trash" size={18} />
                <span>Trash</span>
              </button>
              <button
                className={location.page === "settings" ? "active" : ""}
                onClick={() => navigate({ page: "settings" })}
              >
                <Icon name="settings" size={18} />
                <span>Settings</span>
              </button>
            </nav>
            <div className="sidebar-footer">
              <div className="avatar">Y</div>
              <div>
                <strong>Your personal vault</strong>
                <small>A space of your own</small>
              </div>
              <button
                className="icon-button theme-button"
                aria-label={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} theme`}
                onClick={() =>
                  setTheme(resolvedTheme === "light" ? "dark" : "light")
                }
              >
                <Icon
                  name={resolvedTheme === "light" ? "moon" : "sun"}
                  size={18}
                />
              </button>
            </div>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <button
              className="mobile-brand"
              onClick={() => navigate({ page: "home" })}
            >
              <span className="brand-mark">
                <Icon name="folder" size={20} />
              </span>
              vault.
            </button>
            <div className="topbar-context">
              <Icon name={activeFolder ? "folder" : "home"} size={17} />
              <span>
                {activeFolder?.name ??
                  (location.page === "home"
                    ? "Overview"
                    : (navigation.find((item) => item.page === location.page)
                        ?.label ??
                      (location.page === "trash" ? "Trash" : "Settings")))}
              </span>
            </div>
            <label className="global-search">
              <Icon name="search" size={17} />
              <input
                ref={searchRef}
                placeholder="Search your vault…"
                aria-label="Search your vault"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search ? (
                <button
                  className="icon-button"
                  aria-label="Clear global search"
                  onClick={() => setSearch("")}
                >
                  <Icon name="close" size={15} />
                </button>
              ) : (
                <kbd>Ctrl K</kbd>
              )}
            </label>
            <div className="topbar-actions">
              <span className="preview-badge">
                <span />
                Local preview
              </span>
              <button
                className="icon-button mobile-theme"
                aria-label={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} theme`}
                onClick={() =>
                  setTheme(resolvedTheme === "light" ? "dark" : "light")
                }
              >
                <Icon
                  name={resolvedTheme === "light" ? "moon" : "sun"}
                  size={19}
                />
              </button>
              <div className="topbar-divider" />
              <button
                className="icon-button"
                aria-label="Upload files"
                onClick={() =>
                  setDialog({
                    type: "upload",
                    folderId:
                      activeFolder?.id ?? library.spaces[0].rootFolderId,
                  })
                }
              >
                <Icon name="upload" size={19} />
              </button>
              <span className="avatar small">Y</span>
            </div>
          </header>
          <main
            className="main-content"
            ref={mainRef}
            id="main-content"
            tabIndex={-1}
          >
            {globalFiles ? (
              <LibraryBrowser key="global-search" globalSearch={search} />
            ) : location.folderId ||
              ["all", "recent", "favorites", "trash"].includes(
                location.page,
              ) ? (
              <LibraryBrowser key={routeKey} />
            ) : location.page === "settings" ? (
              <div className="settings-page page-enter">
                <div className="page-intro">
                  <div className="eyebrow">MAKE YOURSELF AT HOME</div>
                  <h1>
                    Your preferences<span className="accent-period">.</span>
                  </h1>
                  <p>The little things that make Vault feel like yours.</p>
                </div>
                <section className="settings-card">
                  <div className="setting-heading">
                    <span className="setting-icon">
                      <Icon name="sun" />
                    </span>
                    <div>
                      <h2>Appearance</h2>
                      <p>A different mood. The same familiar space.</p>
                    </div>
                  </div>
                  <div className="theme-options">
                    {(["light", "dark", "system"] as Theme[]).map((option) => (
                      <button
                        className={`theme-option ${theme === option ? "active" : ""}`}
                        key={option}
                        onClick={() => setTheme(option)}
                        aria-pressed={theme === option}
                      >
                        <span className={`theme-swatch ${option}`}>
                          <i />
                          <b />
                          <em />
                        </span>
                        <span>
                          <Icon
                            name={
                              option === "light"
                                ? "sun"
                                : option === "dark"
                                  ? "moon"
                                  : "monitor"
                            }
                            size={17}
                          />
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                          {theme === option && <Icon name="check" size={17} />}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
                <section className="settings-card">
                  <div className="setting-heading">
                    <span className="setting-icon">
                      <Icon name="info" />
                    </span>
                    <div>
                      <h2>About this preview</h2>
                      <p>A working frontend, ready for your backend.</p>
                    </div>
                    <span className="badge">Demo</span>
                  </div>
                  <p className="settings-copy">
                    Try organizing files, creating Spaces, and adding files from
                    your device. Changes and file contents stay in this browser
                    tab and are cleared on refresh. Your theme preference is
                    saved on this device.
                  </p>
                  <p className="settings-copy">
                    Uploads to the Raspberry Pi, durable storage,
                    server-enforced PINs, and real upload progress will be
                    connected through the backend later.
                  </p>
                  <button
                    className="button"
                    onClick={() => setDialog({ type: "reset" })}
                  >
                    <Icon name="restore" size={17} />
                    Reset sample library
                  </button>
                </section>
              </div>
            ) : (
              <Home />
            )}
          </main>
        </div>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {(
            [
              { page: "home", label: "Spaces", icon: "grid" },
              { page: "all", label: "Files", icon: "folder" },
              { page: "recent", label: "Recent", icon: "clock" },
              { page: "settings", label: "Settings", icon: "settings" },
            ] as const
          ).map((item) => (
            <button
              key={item.page}
              className={
                location.page === item.page && !globalFiles ? "active" : ""
              }
              onClick={() => navigate({ page: item.page })}
            >
              <Icon name={item.icon} size={21} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {showUploads &&
        uploads.some((file) =>
          library.files.some((item) => item.id === file.id),
        ) && (
          <aside className="upload-tray" aria-label="Files added to preview">
            <header>
              <span>
                <Icon name="check" size={18} />
                Added to this preview
              </span>
              <button
                className="icon-button"
                aria-label="Close upload tray"
                onClick={() => setShowUploads(false)}
              >
                <Icon name="close" size={17} />
              </button>
            </header>
            <div>
              {uploads
                .filter((file) =>
                  library.files.some((item) => item.id === file.id),
                )
                .slice(0, 4)
                .map((file) => (
                  <p key={file.id}>
                    <Icon name="file" size={17} />
                    <span>{file.name}</span>
                    <Icon name="check" size={15} />
                  </p>
                ))}
            </div>
            <footer>Local files · Available until refresh</footer>
          </aside>
        )}
      {dialog && (
        <Dialogs
          key={JSON.stringify({ ...dialog, files: undefined })}
          dialog={dialog}
        />
      )}
    </AppContext.Provider>
  );
}

export default App;
