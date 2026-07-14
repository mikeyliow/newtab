import type { RequestHandler } from './$types';
import { apiCall } from '$lib/server/api';
import { exportAll } from '$lib/server/core';

export const GET: RequestHandler = () => apiCall(() => exportAll());
