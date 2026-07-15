export type ItemKind = 'do' | 'think' | 'queue';
export type ItemMedium = 'read' | 'listen' | 'watch';
export type ItemContext = 'work' | 'heirlight' | 'content' | 'personal';
export type ItemStatus = 'open' | 'done';

export const KINDS: ItemKind[] = ['do', 'think', 'queue'];
export const MEDIUMS: ItemMedium[] = ['read', 'listen', 'watch'];
export const CONTEXTS: ItemContext[] = ['work', 'heirlight', 'content', 'personal'];

export interface Item {
	id: string;
	kind: ItemKind;
	medium: ItemMedium | null;
	context: ItemContext | null;
	title: string;
	url: string | null;
	source: string | null;
	status: ItemStatus;
	flagged: boolean;
	created_at: string;
	updated_at: string;
	completed_at: string | null;
}

export interface Meal {
	id: string;
	date: string;
	name: string;
	kcal: number;
	p: number;
	c: number;
	f: number;
	created_at: string;
}

export interface Spend {
	id: string;
	date: string;
	amount: number;
	currency: string;
	category: string;
	note: string | null;
	created_at: string;
}

export interface Shortcut {
	id: string;
	label: string;
	url: string;
	icon?: string;
}

export interface QuickLink {
	label: string;
	url: string;
	icon?: string;
}

export interface Widget {
	id: string;
	visible: boolean;
	order: number;
	sensitive: boolean;
}

export interface Config {
	focus: string;
	focus_icon: string;
	name: string;
	wallpaper: string;
	calorie_target: number | null;
	budget_month: number | null;
	shortcuts: Shortcut[];
	quick_links: QuickLink[];
	widgets: Widget[];
}

export interface RaptorsLast {
	date: string;
	opponent: string;
	home: boolean;
	win: boolean;
	score: string;
	top: { name: string; pts: number; reb: number; ast: number } | null;
}

export interface RaptorsInfo {
	next: { date: string; opponent: string; home: boolean } | null;
	last: RaptorsLast | null;
}

export interface Dashboard {
	date: string;
	config: Config;
	items: Item[];
	done_today: Item[];
	done_week: number[];
	meals: Meal[];
	meal_totals: { kcal: number; p: number; c: number; f: number };
}
