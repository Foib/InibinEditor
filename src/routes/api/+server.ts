import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Lists the API endpoints */
export const GET: RequestHandler = () =>
	json({
		endpoints: {
			'POST /api/open': 'Open a file and return it as a JSON document. Options: search',
			'POST /api/edit':
				'Apply operations and return the result. Options: operations, format (json | text | binary)',
			'POST /api/export':
				'Export as .ini/.troy or .inibin/.troybin. Options: format (text | binary)'
		},
		input: [
			'multipart/form-data with a "file" field; options as further fields',
			'application/json document as returned by /api/open; options as further properties',
			'raw file bytes with ?fileName=; options in the query string'
		],
		operations: [
			{ op: 'addSection', section: 'string' },
			{ op: 'removeSection', section: 'string' },
			{ op: 'setEntry', section: 'string', name: 'string', value: 'string | number | number[]' },
			{ op: 'removeEntry', section: 'string', name: 'string' },
			{ op: 'setUnknown', hash: 'number | "unkXXXXXXXX"', value: 'string | number | number[]' },
			{ op: 'removeUnknown', hash: 'number | "unkXXXXXXXX"' }
		]
	});
