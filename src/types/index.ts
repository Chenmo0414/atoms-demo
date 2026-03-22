export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  userId: string;
  slug: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  activeVersion?: Version | null;
  versions?: Version[];
  _count?: { versions: number; messages: number };
}

export interface Version {
  id: string;
  projectId: string;
  versionNum: number;
  prompt: string;
  html: string;
  label: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  projectId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export type GenerationMode = "engineer" | "race";
