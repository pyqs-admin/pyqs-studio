import { create } from "zustand";
import type { ProjectDetails, ProjectListItem, QuestionRow } from "@/lib/api/projects";

type QuestionPage = { rows: QuestionRow[]; fetchedAt: number };

type ProjectStore = {
  projects: ProjectListItem[];
  projectDetails: Record<string, ProjectDetails>;
  subjectNames: Record<string, string>;
  questionPages: Record<string, QuestionPage>;
  setProjects: (projects: ProjectListItem[]) => void;
  setProjectDetails: (projectId: string, details: ProjectDetails) => void;
  setSubjectName: (subjectId: string, name: string) => void;
  setQuestionPage: (key: string, rows: QuestionRow[]) => void;
};

// In-memory navigation cache. React Query remains the source of truth for
// refetching and invalidation; this keeps useful project data alive between routes.
export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  projectDetails: {},
  subjectNames: {},
  questionPages: {},
  setProjects: (projects) => set({ projects }),
  setProjectDetails: (projectId, details) => set((state) => ({ projectDetails: { ...state.projectDetails, [projectId]: details } })),
  setSubjectName: (subjectId, name) => set((state) => ({ subjectNames: { ...state.subjectNames, [subjectId]: name } })),
  setQuestionPage: (key, rows) => set((state) => ({ questionPages: { ...state.questionPages, [key]: { rows, fetchedAt: Date.now() } } })),
}));

export function questionPageKey(projectId: string, subjectId: string, query: string, status: string, page: number) {
  return [projectId, subjectId, query, status, page].join("|");
}
