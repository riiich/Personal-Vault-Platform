import { useState } from "react";
import { useApp } from "../app/context";
import { Icon } from "../components/ui/Icon";
import { FileCard } from "../features/files/FileCard";
import { DropZone } from "../features/files/DropZone";

export function Home() {
  const { library, repository, navigate, showDialog } = useApp();
  const [sort, setSort] = useState("default");
  const visibleFiles = library.files.filter(
    (file) => !file.deletedAt && !repository.lockedAncestor(file.folderId),
  );
  const spaces = [...library.spaces].sort((a, b) =>
    sort === "name" ? a.name.localeCompare(b.name) : 0,
  );
  const recent = [...visibleFiles]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  return (
    <div className="home-page page-enter">
      <div className="page-intro">
        <div>
          <div className="eyebrow">
            <span className="tiny-dot" /> YOUR PERSONAL CORNER OF THE INTERNET
          </div>
          <h1>
            A place for everything<span className="accent-period">.</span>
          </h1>
          <p>
            Big ideas, little moments, and everything in between. All yours.
          </p>
        </div>
        <button
          className="button primary"
          onClick={() => showDialog({ type: "space" })}
        >
          <Icon name="plus" size={18} />
          New space
        </button>
      </div>
      <section aria-labelledby="spaces-title" className="spaces-section">
        <div className="section-heading">
          <div className="heading-with-count">
            <h2 id="spaces-title">Your spaces</h2>
            <span className="count-pill">{spaces.length}</span>
          </div>
          <label className="sort-control">
            <span>Sort by</span>
            <select
              aria-label="Sort Spaces"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="default">Date created</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>
        <div className="space-grid">
          {spaces.map((space) => {
            const count = visibleFiles.filter(
              (file) =>
                library.folders.find((folder) => folder.id === file.folderId)
                  ?.spaceId === space.id,
            ).length;
            const locked = repository.lockedAncestor(space.rootFolderId);
            return (
              <DropZone key={space.id} folderId={space.rootFolderId}>
                <article className="space-card">
                  <button
                    className="space-open"
                    onClick={() =>
                      navigate({ page: "home", folderId: space.rootFolderId })
                    }
                    aria-label={`Open ${space.name} Space`}
                  >
                    <img src={`/covers/${space.cover}.jpg`} alt="" />
                    <div className="space-overlay" />
                    <span className="space-icon">
                      <Icon name={locked ? "lock" : "folder"} size={22} />
                    </span>
                    <div className="space-card-content">
                      <h3>{space.name}</h3>
                      <span>
                        {locked
                          ? "Locked Space"
                          : `${count} ${count === 1 ? "file" : "files"}`}
                        <Icon name="arrow" size={19} />
                      </span>
                    </div>
                  </button>
                  <button
                    className="space-menu"
                    aria-label={`Edit ${space.name} Space`}
                    onClick={() =>
                      showDialog({ type: "space", spaceId: space.id })
                    }
                  >
                    <Icon name="more" />
                  </button>
                </article>
                <p className="space-description">
                  {space.description || "A space to make your own."}
                </p>
              </DropZone>
            );
          })}
        </div>
        <div className="spaces-tip">
          <Icon name="info" size={15} />
          <span>
            Everything has a place. Drop files onto a Space to add them.
          </span>
          <span className="tip-shortcut">Drag & drop</span>
        </div>
      </section>
      <section className="recent-section" aria-labelledby="recent-title">
        <div className="section-heading">
          <div>
            <h2 id="recent-title">Recently added</h2>
            <p>Pick up right where you left off.</p>
          </div>
          <button
            className="text-button"
            onClick={() => navigate({ page: "recent" })}
          >
            View all files
            <Icon name="arrow" size={16} />
          </button>
        </div>
        <div className="recent-grid">
          {recent.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onOpen={() => showDialog({ type: "preview", fileId: file.id })}
              onFavorite={() => repository.favorite(file.id)}
            />
          ))}
        </div>
      </section>
      <footer className="home-footer">
        <span>
          <Icon name="shield" size={15} />A little more organized. A little more
          you.
        </span>
        <span>
          {library.spaces.length} spaces<span className="footer-dot">·</span>
          {visibleFiles.length} files in your library
        </span>
      </footer>
    </div>
  );
}
