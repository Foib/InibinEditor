import type { RequestHandler } from './$types';
import { documentResponse, handle, readApiRequest } from '$lib/server/api';

/** Opens a file and returns its contents as JSON (optionally with `search` to filter `sections`) */
export const POST: RequestHandler = ({ request, url }) =>
	handle(async () => documentResponse(await readApiRequest(request, url)));
