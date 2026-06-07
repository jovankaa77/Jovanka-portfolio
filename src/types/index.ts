export interface AboutData {
  id?: string;
  heading: string;
  paragraph: string;
  updatedAt?: number;
}

export type AchievementType =
  | 'Juara 1'
  | 'Juara 2'
  | 'Juara 3'
  | 'Favorite 1'
  | 'Favorite 2'
  | 'Favorite 3'
  | 'Awardee'
  | 'Participant'
  | 'Sertifikat Kompetensi';

export interface Achievement {
  id?: string;
  type: AchievementType;
  competitionName: string;
  year?: string;
  organizer?: string;
  link?: string;
  createdAt?: number;
}

export const PROJECT_CATEGORIES = [
  'Data Analyst',
  'Software',
  'UI/UX',
  'Quality Assurance',
  'IT Business Analyst',
  'Product Manager',
  'Project Manager',
  'System Analyst',
] as const;

export type ProjectCategory = typeof PROJECT_CATEGORIES[number];

export interface Project {
  id?: string;
  name: string;
  description: string;
  technologies: string;
  images: string[];
  categories: ProjectCategory[];
  priority?: number;
  story?: string;
  link?: string;
  createdAt?: number;
}

export interface BlogPost {
  id?: string;
  title: string;
  content: string;
  coverImage?: string;
  link?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface Organization {
  id?: string;
  name: string;
  position: string;
  from: string;
  until: string;
  createdAt?: number;
}
