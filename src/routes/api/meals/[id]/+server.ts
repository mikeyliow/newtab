import type { RequestHandler } from './$types';
import { apiCall } from '$lib/server/api';
import { removeMeal } from '$lib/server/core';

export const DELETE: RequestHandler = ({ params }) => apiCall(() => removeMeal(params.id));
