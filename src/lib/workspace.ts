import fs from "fs/promises";
import path from "path";
import { prisma } from "./db";
import { WorkspaceRole } from "@prisma/client";
import { parseHtmlToFiles } from "./parseHtmlFiles";

/** Root of all on-disk workspaces, sibling to src/ at the repo root. */
const WORKSPACE_ROOT = path.join(process.cwd(), "workspaces");

/** Convert an email to a safe directory slug, e.g. user@example.com → user_at_example_com */
function emailToSlug(email: string): string {
  return email.toLowerCase().replace("@", "_at_").replace(/[^a-z0-9._-]/g, "_");
}

// ---------------------------------------------------------------------------
// Workspace init / lookup
// ---------------------------------------------------------------------------

/**
 * Create a Workspace record + disk directory for a newly registered user.
 * Safe to call multiple times — returns existing workspace if already created.
 */
export async function initUserWorkspace(userId: string, email: string) {
  const existing = await prisma.workspace.findUnique({ where: { ownerId: userId } });
  if (existing) return existing;

  const slug = emailToSlug(email);
  const diskPath = path.join("workspaces", slug);

  const workspace = await prisma.workspace.create({
    data: {
      name: `${email}'s workspace`,
      slug,
      ownerId: userId,
      diskPath,
    },
  });

  // Ensure the directory exists on disk
  await fs.mkdir(path.join(process.cwd(), diskPath), { recursive: true });

  return workspace;
}

/** Return the workspace (with members) for a given user. */
export async function getWorkspaceByUser(userId: string) {
  return prisma.workspace.findUnique({
    where: { ownerId: userId },
    include: {
      members: {
        include: { user: { select: { id: true, email: true, name: true } } },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------

const ROLE_RANK: Record<WorkspaceRole, number> = {
  OWNER: 3,
  EDITOR: 2,
  VIEWER: 1,
};

/**
 * Returns true if `userId` has at least `minRole` access to `workspaceId`.
 * The workspace owner always passes.
 */
export async function checkWorkspaceAccess(
  userId: string,
  workspaceId: string,
  minRole: WorkspaceRole
): Promise<boolean> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });
  if (!workspace) return false;
  if (workspace.ownerId === userId) return true;

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  });
  if (!member) return false;

  return ROLE_RANK[member.role] >= ROLE_RANK[minRole];
}

// ---------------------------------------------------------------------------
// Member management
// ---------------------------------------------------------------------------

/**
 * Invite a user (by email) to a workspace.
 * Only the workspace OWNER may invite.
 */
export async function addWorkspaceMember(
  workspaceId: string,
  inviterUserId: string,
  targetEmail: string,
  role: WorkspaceRole
) {
  const hasAccess = await checkWorkspaceAccess(inviterUserId, workspaceId, WorkspaceRole.OWNER);
  if (!hasAccess) throw new Error("Only the workspace owner can invite members");

  const target = await prisma.user.findUnique({ where: { email: targetEmail } });
  if (!target) throw new Error("No user found with that email");

  return prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId, userId: target.id } },
    create: { workspaceId, userId: target.id, role },
    update: { role },
  });
}

/**
 * Remove a member from a workspace.
 * Only the workspace OWNER may remove members.
 */
export async function removeWorkspaceMember(
  workspaceId: string,
  ownerId: string,
  memberId: string
) {
  const hasAccess = await checkWorkspaceAccess(ownerId, workspaceId, WorkspaceRole.OWNER);
  if (!hasAccess) throw new Error("Only the workspace owner can remove members");

  return prisma.workspaceMember.delete({ where: { id: memberId } });
}

// ---------------------------------------------------------------------------
// File listing
// ---------------------------------------------------------------------------

export interface WorkspaceVersionFiles {
  version: string; // "v1", "v2", …
  files: string[]; // ["index.html", "styles.css", "script.js"]
}

export interface WorkspaceProjectDir {
  projectId: string;
  versions: WorkspaceVersionFiles[];
}

/**
 * List all project directories and their version files for a workspace.
 */
export async function listWorkspaceDirs(workspaceSlug: string): Promise<WorkspaceProjectDir[]> {
  const wsDir = path.join(WORKSPACE_ROOT, workspaceSlug);
  try {
    const entries = await fs.readdir(wsDir);
    const result: WorkspaceProjectDir[] = [];
    for (const entry of entries.sort()) {
      const entryPath = path.join(wsDir, entry);
      const stat = await fs.stat(entryPath);
      if (stat.isDirectory()) {
        const versions = await listProjectFiles(workspaceSlug, entry);
        result.push({ projectId: entry, versions });
      }
    }
    return result;
  } catch {
    return [];
  }
}

/**
 * List every version folder and its files for a project on disk.
 * Returns an empty array if the directory doesn't exist yet.
 */
export async function listProjectFiles(
  workspaceSlug: string,
  projectId: string
): Promise<WorkspaceVersionFiles[]> {
  const projectDir = path.join(WORKSPACE_ROOT, workspaceSlug, projectId);
  try {
    const entries = await fs.readdir(projectDir);
    const result: WorkspaceVersionFiles[] = [];
    for (const entry of entries.sort()) {
      const entryPath = path.join(projectDir, entry);
      const stat = await fs.stat(entryPath);
      if (stat.isDirectory()) {
        const files = await fs.readdir(entryPath);
        result.push({ version: entry, files: files.sort() });
      }
    }
    return result;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// File writing
// ---------------------------------------------------------------------------

/**
 * Write a version's files to disk.
 *
 * workspaces/{slug}/{projectId}/v{versionNum}/
 *   index.html
 *   styles.css   (when present)
 *   script.js    (when present)
 */
export async function writeVersionFiles(
  userEmail: string,
  projectId: string,
  versionNum: number,
  html: string
): Promise<void> {
  const slug = emailToSlug(userEmail);
  const dir = path.join(WORKSPACE_ROOT, slug, projectId, `v${versionNum}`);

  await fs.mkdir(dir, { recursive: true });

  const files = parseHtmlToFiles(html);
  await Promise.all(
    Object.entries(files).map(([filename, content]) =>
      fs.writeFile(path.join(dir, filename), content, "utf8")
    )
  );
}
