import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getWorkspaceByUser, initUserWorkspace, listProjectFiles, listWorkspaceDirs } from "@/lib/workspace";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = req.nextUrl.searchParams.get("projectId");

  try {
    let workspace = await getWorkspaceByUser(session.user.id);

    if (!workspace) {
      await initUserWorkspace(session.user.id, session.user.email);
      workspace = await getWorkspaceByUser(session.user.id);
    }

    if (!workspace) {
      return NextResponse.json({ files: [], dirs: [], diskPath: null });
    }

    // List all workspace project directories
    if (!projectId) {
      const dirs = await listWorkspaceDirs(workspace.slug);
      return NextResponse.json({ dirs, diskPath: workspace.diskPath });
    }

    const files = await listProjectFiles(workspace.slug, projectId);
    return NextResponse.json({ files, diskPath: `${workspace.diskPath}/${projectId}` });
  } catch (error) {
    console.error("GET /api/workspaces/files error:", error);
    return NextResponse.json({ files: [], dirs: [], diskPath: null });
  }
}
