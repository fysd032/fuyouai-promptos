export type Category = 'framework' | 'module' | 'industry' | 'tool' | 'guide';

export interface MenuItem {
  id: string;
  type: Category;
  group: string;
  title: string;
  description?: string;
  path: string;
  tags?: string[];
}

export interface ContentItem {
  id: string;
  title: string;
  category: Category;
  description: string;
  content: string; // Markdown content
  isPro: boolean; // Access control
  tags: string[];
}

export interface NavGroup {
  id: string;
  title: string;
  items: ContentItem[];
}

export interface UserState {
  isPro: boolean;
  trialDaysRemaining: number;
}