export type SourceOption = { text: string; isCorrect: boolean; image: string | null };
export type SourceQuestion = { sourcePages: number[]; title: string; description: string; questionImages: string[]; options: SourceOption[]; microTopics: string[]; difficulty: Array<'easy' | 'medium' | 'hard'>; hashTags: string[]; references: string[]; chapter?: string; questionType?: string[]; solution: string };
export type SourceSubject = { subjectName: string; questions: SourceQuestion[] };
export type SourceBatch = { year: number; set: number | null; subjects: SourceSubject[] };
