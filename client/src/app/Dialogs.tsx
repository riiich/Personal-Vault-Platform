import { useState } from "react";
import { useApp } from "./context";
import type { DialogState } from "./context";
import { covers } from "../data/models";
import type { Cover } from "../data/models";
import { Modal } from "../components/ui/Modal";
import { Icon } from "../components/ui/Icon";
import { UploadDialog } from "../features/uploads/UploadDialog";
import { PreviewDialog } from "../features/files/PreviewDialog";

function SpaceDialog({ spaceId }: { spaceId?: string }) {
  const { library, repository, showDialog, navigate, notify } = useApp();
  const space = library.spaces.find((item) => item.id === spaceId);
  const [name, setName] = useState(space?.name ?? ""),
    [description, setDescription] = useState(space?.description ?? "");
  const [cover, setCover] = useState<Cover>(space?.cover ?? "mountains"),
    [error, setError] = useState("");
  return (
    <Modal
      title={space ? "Make this Space yours." : "Room for something new."}
      subtitle={
        space
          ? "A name, a cover, a little personality."
          : "Give your files a place to call home."
      }
      onClose={() => showDialog(null)}
    >
      <form
        className="dialog-form"
        onSubmit={(event) => {
          event.preventDefault();
          try {
            if (space)
              repository.updateSpace(space.id, name, cover, description);
            else {
              const folderId = repository.createSpace(name, cover, description);
              navigate({ page: "home", folderId });
            }
            showDialog(null);
            notify(space ? "Space updated." : "Your new Space is ready.");
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <label className="field-label">
          Space name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Weekend projects"
            maxLength={100}
            autoFocus
            required
          />
        </label>
        <label className="field-label">
          Description<span className="optional">optional</span>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What will you keep here?"
            maxLength={160}
          />
        </label>
        <fieldset className="cover-fieldset">
          <legend>Choose a cover</legend>
          <div className="cover-options">
            {covers.map((option) => (
              <label
                key={option.id}
                className={cover === option.id ? "active" : ""}
              >
                <input
                  type="radio"
                  name="cover"
                  value={option.id}
                  checked={cover === option.id}
                  onChange={() => setCover(option.id)}
                />
                <img src={`/covers/${option.id}.jpg`} alt="" />
                <span>{option.label}</span>
                {cover === option.id && <Icon name="check" size={17} />}
              </label>
            ))}
          </div>
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <footer className="modal-footer">
          <button
            type="button"
            className="button"
            onClick={() => showDialog(null)}
          >
            Cancel
          </button>
          <button type="submit" className="button primary">
            {space ? "Save changes" : "Create Space"}
            <Icon name="arrow" size={16} />
          </button>
        </footer>
      </form>
    </Modal>
  );
}

function NameDialog({
  dialog,
}: {
  dialog: Extract<DialogState, { type: "folder" | "category" | "rename" }>;
}) {
  const { library, repository, showDialog, notify } = useApp();
  const category =
    dialog.type === "category"
      ? library.categories.find((item) => item.id === dialog.categoryId)
      : undefined;
  const file =
    dialog.type === "rename"
      ? library.files.find((item) => item.id === dialog.fileId)
      : undefined;
  const [name, setName] = useState(category?.name ?? file?.name ?? ""),
    [error, setError] = useState("");
  const title =
    dialog.type === "folder"
      ? "Create a folder"
      : dialog.type === "rename"
        ? "Rename file"
        : category
          ? "Edit category"
          : "Create a category";
  return (
    <Modal
      title={title}
      subtitle={
        dialog.type === "category"
          ? "Group the things that belong together in this folder."
          : undefined
      }
      onClose={() => showDialog(null)}
    >
      <form
        className="dialog-form"
        onSubmit={(event) => {
          event.preventDefault();
          try {
            if (dialog.type === "folder")
              repository.createFolder(dialog.folderId, name);
            else if (dialog.type === "category")
              repository.saveCategory(dialog.folderId, name, dialog.categoryId);
            else repository.renameFile(dialog.fileId, name);
            showDialog(null);
            notify(
              dialog.type === "folder"
                ? "Folder created."
                : dialog.type === "category"
                  ? "Category saved."
                  : "File renamed.",
            );
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <label className="field-label">
          Name
          <input
            value={name}
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
            required
            autoFocus
            placeholder={
              dialog.type === "category" ? "e.g. Inspiration" : "Give it a name"
            }
          />
        </label>
        {category && (
          <p className="helper">
            Removing this category keeps its files and moves them to
            Uncategorized.
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <footer className="modal-footer">
          {category && (
            <button
              type="button"
              className="text-button danger-text"
              onClick={() => {
                repository.deleteCategory(category.id);
                showDialog(null);
                notify("Category removed. Your files are in Uncategorized.");
              }}
            >
              Remove category
            </button>
          )}
          <button
            type="button"
            className="button"
            onClick={() => showDialog(null)}
          >
            Cancel
          </button>
          <button className="button primary" type="submit">
            {category || file ? "Save changes" : "Create"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

function FolderSettings({ folderId }: { folderId: string }) {
  const { library, repository, showDialog, notify } = useApp();
  const folder = library.folders.find((item) => item.id === folderId)!;
  const [name, setName] = useState(folder.name),
    [pin, setPin] = useState(""),
    [confirm, setConfirm] = useState(""),
    [current, setCurrent] = useState(""),
    [error, setError] = useState("");
  function savePin(remove = false) {
    try {
      if (!remove && !pin) throw new Error("Enter a new PIN first.");
      if (!remove && pin !== confirm)
        throw new Error("The new PINs don’t match.");
      repository.setPin(folderId, remove ? "" : pin, current);
      showDialog(null);
      notify(
        remove
          ? "Folder PIN removed."
          : "PIN saved. Use Lock now to lock this folder.",
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <Modal
      title="Folder settings"
      subtitle={folder.name}
      onClose={() => showDialog(null)}
    >
      <div className="dialog-form">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            try {
              repository.renameFolder(folderId, name);
              notify("Folder renamed.");
              showDialog(null);
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <label className="field-label">
            Folder name
            <div className="inline-form">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={100}
              />
              <button className="button" type="submit">
                Save
              </button>
            </div>
          </label>
        </form>
        <div className="settings-divider" />
        <div className="setting-heading">
          <span className="setting-icon">
            <Icon name="lock" />
          </span>
          <div>
            <h3>Folder lock</h3>
            <p>An optional numeric PIN for this folder.</p>
          </div>
          <span className="badge">Preview</span>
        </div>
        <p className="demo-note">
          <Icon name="info" size={16} />
          <span>
            This PIN only demonstrates the interface. It does not secure files;
            backend enforcement will be needed.
          </span>
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            savePin();
          }}
        >
          {folder.pinEnabled && (
            <label className="field-label">
              Current PIN
              <input
                type="password"
                inputMode="numeric"
                value={current}
                onChange={(event) =>
                  setCurrent(event.target.value.replace(/\D/g, ""))
                }
                maxLength={8}
                autoComplete="off"
              />
            </label>
          )}
          <div className="two-fields">
            <label className="field-label">
              {folder.pinEnabled ? "New PIN" : "Set PIN"}
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4,8}"
                minLength={4}
                maxLength={8}
                value={pin}
                onChange={(event) =>
                  setPin(event.target.value.replace(/\D/g, ""))
                }
                placeholder="4–8 digits"
                autoComplete="new-password"
                required
              />
            </label>
            <label className="field-label">
              Confirm PIN
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4,8}"
                minLength={4}
                maxLength={8}
                value={confirm}
                onChange={(event) =>
                  setConfirm(event.target.value.replace(/\D/g, ""))
                }
                placeholder="Re-enter PIN"
                autoComplete="new-password"
                required
              />
            </label>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-footer">
            {folder.pinEnabled && (
              <>
                <button
                  type="button"
                  className="text-button danger-text"
                  onClick={() => savePin(true)}
                >
                  Remove PIN
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    repository.lock(folderId);
                    showDialog(null);
                    notify("Folder locked.");
                  }}
                >
                  Lock now
                </button>
              </>
            )}
            <button className="button primary" type="submit">
              {folder.pinEnabled ? "Change PIN" : "Set PIN"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function MoveDialog({ fileIds }: { fileIds: string[] }) {
  const { library, repository, showDialog, notify } = useApp();
  const [destination, setDestination] = useState(""),
    [error, setError] = useState("");
  return (
    <Modal
      title="A new place for your files."
      subtitle="Choose a destination folder. Moved files become Uncategorized."
      onClose={() => showDialog(null)}
    >
      <form
        className="dialog-form"
        onSubmit={(event) => {
          event.preventDefault();
          try {
            repository.moveFiles(fileIds, destination);
            showDialog(null);
            notify("Files moved.");
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <label className="field-label">
          Move {fileIds.length} {fileIds.length === 1 ? "file" : "files"} to
          <select
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            required
          >
            <option value="" disabled>
              Choose a folder
            </option>
            {library.folders.map((folder) => {
              const path = [folder.name];
              let parent = library.folders.find(
                (item) => item.id === folder.parentId,
              );
              while (parent) {
                path.unshift(parent.name);
                parent = library.folders.find(
                  (item) => item.id === parent?.parentId,
                );
              }
              return (
                <option
                  key={folder.id}
                  value={folder.id}
                  disabled={!!repository.lockedAncestor(folder.id)}
                >
                  {path.join(" / ")}
                  {repository.lockedAncestor(folder.id) ? " (locked)" : ""}
                </option>
              );
            })}
          </select>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <footer className="modal-footer">
          <button
            type="button"
            className="button"
            onClick={() => showDialog(null)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button primary"
            disabled={!destination}
          >
            Move files
            <Icon name="arrow" size={17} />
          </button>
        </footer>
      </form>
    </Modal>
  );
}

export function Dialogs({ dialog }: { dialog: DialogState }) {
  const { repository, showDialog, navigate, notify } = useApp();
  switch (dialog.type) {
    case "space":
      return <SpaceDialog spaceId={dialog.spaceId} />;
    case "folder":
    case "category":
    case "rename":
      return <NameDialog dialog={dialog} />;
    case "upload":
      return <UploadDialog dialog={dialog} />;
    case "folder-settings":
      return <FolderSettings folderId={dialog.folderId} />;
    case "preview":
      return <PreviewDialog fileId={dialog.fileId} />;
    case "move":
      return <MoveDialog fileIds={dialog.fileIds} />;
    case "reset":
      return (
        <Modal
          title="Start fresh?"
          subtitle="This removes your preview changes and locally added files, then restores the sample library."
          onClose={() => showDialog(null)}
        >
          <div className="dialog-form">
            <footer className="modal-footer">
              <button className="button" onClick={() => showDialog(null)}>
                Keep my changes
              </button>
              <button
                className="button primary"
                onClick={() => {
                  repository.reset();
                  navigate({ page: "home" });
                  showDialog(null);
                  notify("Sample library restored.");
                }}
              >
                Reset preview
              </button>
            </footer>
          </div>
        </Modal>
      );
  }
}
