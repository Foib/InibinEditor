import type { RequestHandler } from './$types';
import { fileResponse, handle, readApiRequest, readFormat } from '$lib/server/api';

/** Exports a file or JSON document as `.ini`/`.troy` (`format=text`) or `.inibin`/`.troybin` (`format=binary`) */
export const POST: RequestHandler = ({ request, url }) =>
	handle(async () => {
		const req = await readApiRequest(request, url);
		return fileResponse(req.doc, readFormat(req, ['text', 'binary']));
	});
