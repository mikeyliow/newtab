// rotating greeting lines, bucketed by hour. Rendered as "<line>, <name>." — edit freely.
const LATE = [
	'Up late',
	'Burning the midnight oil',
	'The night shift',
	'Sleep is a suggestion',
	'Still going'
];
const MORNING = [
	'Good morning',
	'Rise and grind',
	'Coffee first',
	'Fresh start',
	'Morning, sunshine — er'
];
const AFTERNOON = [
	'Good afternoon',
	'Back at it',
	'Keep it moving',
	'Midday check-in',
	'Steady on'
];
const EVENING = [
	'Good evening',
	'Home stretch',
	'Winding down',
	'Golden hour',
	'Evening, boss — I mean'
];

export function greeting(now: Date): string {
	const h = now.getHours();
	const pool = h < 5 ? LATE : h < 12 ? MORNING : h < 18 ? AFTERNOON : EVENING;
	return pool[Math.floor(Math.random() * pool.length)];
}
