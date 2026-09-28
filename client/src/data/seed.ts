import type { Library, VaultFile } from "./models.ts";

const file = (
  id: string,
  name: string,
  folderId: string,
  mimeType: string,
  size: number,
  extra: Partial<VaultFile> = {},
): VaultFile => ({
  id,
  name,
  folderId,
  mimeType,
  size,
  categoryId: null,
  favorite: false,
  deletedAt: null,
  createdAt: `2026-09-${id.endsWith("1") ? "26" : "24"}T14:30:00Z`,
  ...extra,
});

export const seed: Library = {
  spaces: [
    {
      id: "personal",
      name: "Personal",
      description: "A little bit of everything you.",
      cover: "mountains",
      rootFolderId: "personal-root",
    },
    {
      id: "projects",
      name: "Projects",
      description: "Ideas, experiments, and works in progress.",
      cover: "architecture",
      rootFolderId: "projects-root",
    },
    {
      id: "photos",
      name: "Photos",
      description: "The moments worth keeping.",
      cover: "coast",
      rootFolderId: "photos-root",
    },
    {
      id: "documents",
      name: "Documents",
      description: "The important things, all together.",
      cover: "journal",
      rootFolderId: "documents-root",
    },
  ],
  folders: [
    ...["personal", "projects", "photos", "documents"].map((id) => ({
      id: `${id}-root`,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      spaceId: id,
      parentId: null,
      pinEnabled: false,
      locked: false,
    })),
    {
      id: "workshop",
      name: "Workshop",
      spaceId: "projects",
      parentId: "projects-root",
      pinEnabled: false,
      locked: false,
    },
    {
      id: "inspiration",
      name: "Inspiration",
      spaceId: "projects",
      parentId: "projects-root",
      pinEnabled: false,
      locked: false,
    },
    {
      id: "trips",
      name: "Summer escapes",
      spaceId: "photos",
      parentId: "photos-root",
      pinEnabled: false,
      locked: false,
    },
    {
      id: "records",
      name: "Records",
      spaceId: "documents",
      parentId: "documents-root",
      pinEnabled: false,
      locked: false,
    },
  ],
  categories: [
    {
      id: "reference",
      folderId: "workshop",
      name: "Reference material",
      color: "blue",
    },
    {
      id: "working",
      folderId: "workshop",
      name: "Working files",
      color: "amber",
    },
    {
      id: "ideas",
      folderId: "projects-root",
      name: "Ideas & inspiration",
      color: "blue",
    },
    {
      id: "memories",
      folderId: "personal-root",
      name: "Favorite moments",
      color: "green",
    },
    {
      id: "landscapes",
      folderId: "photos-root",
      name: "Landscapes",
      color: "green",
    },
    {
      id: "planning",
      folderId: "documents-root",
      name: "Planning",
      color: "amber",
    },
  ],
  files: [
    file("p1", "Mountain mornings.jpg", "personal-root", "image/jpeg", 269593, {
      source: "/covers/mountains.jpg",
      categoryId: "memories",
      favorite: true,
    }),
    file("p2", "Little reminders.txt", "personal-root", "text/plain", 112, {
      text: "A place for the things you want to keep.\n\nTake a walk. Finish a small project. Call home.\n",
      favorite: true,
    }),
    file("p3", "Weekend playlist.wav", "personal-root", "audio/wav", 12450000),
    file(
      "j1",
      "A different perspective.jpg",
      "projects-root",
      "image/jpeg",
      371345,
      {
        source: "/covers/architecture.jpg",
        categoryId: "ideas",
        favorite: true,
      },
    ),
    file("j2", "Project notes.md", "projects-root", "text/markdown", 96, {
      text: "# Project notes\n\nBuild something useful. Start small, and make it yours.\n",
      categoryId: "ideas",
    }),
    file("j3", "Assets.zip", "projects-root", "application/zip", 8421000),
    file("w1", "Workshop reference.jpg", "workshop", "image/jpeg", 371345, {
      source: "/covers/architecture.jpg",
      categoryId: "reference",
    }),
    file("w2", "Getting started.pdf", "workshop", "application/pdf", 2465000, {
      categoryId: "reference",
    }),
    file("w3", "Dimensions.csv", "workshop", "text/csv", 64, {
      text: "Part,Width,Height\nBase,120,20\nSupport,30,80\nCover,120,5\n",
      categoryId: "reference",
    }),
    file(
      "w4",
      "Assembly.blend",
      "workshop",
      "application/octet-stream",
      24560000,
      { categoryId: "working", favorite: true },
    ),
    file("w5", "Parts list.csv", "workshop", "text/csv", 78, {
      text: "Part,Quantity,Material\nBase,1,Aluminum\nBolt,8,Steel\nBracket,4,Steel\n",
      categoryId: "working",
    }),
    file("w6", "First look.mp4", "workshop", "video/mp4", 18300000, {
      categoryId: "working",
    }),
    file("w7", "Notes.txt", "workshop", "text/plain", 58, {
      text: "Next steps\n- Check dimensions\n- Assemble prototype\n- Review fit\n",
    }),
    file(
      "w8",
      "Reference archive.7z",
      "workshop",
      "application/octet-stream",
      4200000,
    ),
    file("f1", "Along the coast.jpg", "photos-root", "image/jpeg", 234896, {
      source: "/covers/coast.jpg",
      categoryId: "landscapes",
      favorite: true,
    }),
    file("f2", "Above the clouds.jpg", "photos-root", "image/jpeg", 269593, {
      source: "/covers/mountains.jpg",
      categoryId: "landscapes",
    }),
    file("f3", "Slow mornings.jpg", "trips", "image/jpeg", 234896, {
      source: "/covers/coast.jpg",
    }),
    file("d1", "A fresh page.jpg", "documents-root", "image/jpeg", 107696, {
      source: "/covers/journal.jpg",
      categoryId: "planning",
    }),
    file("d2", "Household budget.csv", "documents-root", "text/csv", 83, {
      text: "Category,Planned\nGroceries,400\nUtilities,150\nProjects,100\n",
      categoryId: "planning",
    }),
    file("d3", "Home inventory.pdf", "records", "application/pdf", 1540000),
  ],
};
