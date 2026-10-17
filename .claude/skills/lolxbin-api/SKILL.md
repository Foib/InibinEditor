---
name: lolxbin-api
description: Read, edit and convert League of Legends .inibin, .troybin, .ini and .troy files through the LoLxbin Editor's HTTP API (/api/open, /api/edit, /api/export). Use this whenever the user wants to inspect values in one of these files, change, add or remove sections, keys or unknown hashes, convert between binary (.inibin/.troybin) and text (.ini/.troy), or script edits across many files, even if they don't mention the API and just say something like "bump BaseHP in Annie.inibin" or "turn these troybins into troy files".
---

# LoLxbin Editor API

The editor in this repo exposes every UI action over HTTP. The API is **stateless**: each request carries the whole document, and the response returns the result. Nothing is written to disk unless you save the response yourself.

## 1. Make sure the server is running

```bash
curl -s http://localhost:5173/api
```

If that returns the endpoint list, use it. Otherwise start the dev server from the repo root in the background (`bun run dev`, port 5173 by default) and retry once it is up. If the user is already running it on another port, use their port. `GET /api` returns a short machine-readable summary of everything below, which is handy for checking that the server is this app.

## 2. Endpoints

| Endpoint           | Purpose                                             | Options                                                      |
| ------------------ | --------------------------------------------------- | ------------------------------------------------------------ |
| `POST /api/open`   | Parse a file and return a JSON document             | `search`: narrows the returned `sections` list               |
| `POST /api/edit`   | Apply `operations` in order, then return the result | `operations`, `format`: `json` (default), `text` or `binary` |
| `POST /api/export` | Return the file as text (`.ini`/`.troy`) or binary  | `format`: `text` or `binary` (required)                      |

Every endpoint accepts its input in one of three forms. Pick whichever fits the job:

- **Upload a file** (usually easiest): `multipart/form-data` with a `file` field and options as more fields.
- **Send a JSON document**: the exact object `/api/open` returned, with options added as extra properties (`operations`, `format`, `search`). Use this when chaining several requests without touching files.
- **Raw bytes**: the file as the body with `?fileName=Annie.inibin` (plus options) in the query string.

The file extension decides how the input is parsed. `.ini` and `.troy` are read as text, everything else as binary, and `.troybin`/`.troy` use the troybin key dictionary. Keep the original file name when uploading, and set `fileName` explicitly when sending raw bytes.

### The JSON document

```json
{
	"fileName": "Annie.inibin",
	"fileType": "inibin",
	"stats": { "sections": 12, "entries": 340, "unknown": 5 },
	"sections": ["Data", "Meta", "..."],
	"data": {
		"Values": { "Data": { "BaseHP": 500, "Name": "Annie", "Pos": [1, 2, 3] } },
		"UNKNOWN_HASHES": { "43981": 42 }
	}
}
```

- `data.Values` holds the keys that were resolved to a `section → name → value`. Values are numbers, strings or arrays of numbers.
- `data.UNKNOWN_HASHES` holds keys whose hash wasn't in the dictionary. Keys are decimal hashes. In text exports they appear as `unkXXXXXXXX` (8 hex digits).
- `NaN` values come back as `null` and are read back as `NaN`.

## 3. Operations

```json
[
	{ "op": "addSection", "section": "Data" },
	{ "op": "removeSection", "section": "Data" },
	{ "op": "setEntry", "section": "Data", "name": "BaseHP", "value": "600" },
	{ "op": "removeEntry", "section": "Data", "name": "BaseHP" },
	{ "op": "setUnknown", "hash": "unk0000ABCD", "value": 7 },
	{ "op": "removeUnknown", "hash": 43981 }
]
```

- `setEntry` adds the key or overwrites it, creating the section if needed. `addSection` fails if the section already exists, and the remove operations fail if their target is missing.
- **String values are parsed like the editor's input box**: `"600"` becomes the number 600, `"1.5"` a float and `"1 2 3"` a vector. Anything else stays a string. To store a string that looks like a number, wrap it in quotes: `"\"600\""`. JSON numbers and number arrays are used as given.
- `hash` accepts a decimal number, `"unkXXXXXXXX"`, `"0x..."` or a decimal string.
- Operations run in order, and the first failure aborts the whole request with `400 {"error": "Operation 2 (removeEntry): ..."}`. Nothing is half-applied, because nothing persists between requests. Fix the failing operation and resend.

## 4. Recipes

Write the operations to a JSON file and pass them with curl's `<file` syntax. That avoids shell-quoting trouble, which is especially bad in PowerShell. Save results to a **new** path and only replace the original once you've checked the result (and the user wants that).

```bash
# Inspect a file
curl -s -F file=@Annie.inibin http://localhost:5173/api/open

# Edit and save as binary
curl -s -F file=@Annie.inibin -F "operations=<ops.json" -F format=binary \
  -o Annie.edited.inibin http://localhost:5173/api/edit

# Convert binary -> text, or text -> binary
curl -s -F file=@effect.troybin -F format=text -o effect.troy http://localhost:5173/api/export
curl -s -F file=@Annie.ini -F format=binary -o Annie.inibin http://localhost:5173/api/export
```

In PowerShell, call `curl.exe` explicitly, because Windows PowerShell 5.1 aliases `curl` to `Invoke-WebRequest`. Also replace the trailing `\` line continuations with backticks, or put each command on one line.

To look up a value, pipe `/api/open` into `jq` (for example `jq '.data.Values.Data.BaseHP'`) or into Python's `json` module if `jq` isn't installed. Don't scan the raw JSON by eye, because real files have hundreds of entries.

For batch work across many files, loop over them and run one `/api/edit` per file with the same `ops.json`. Check each response's HTTP status, for example with `curl -w '%{http_code}'`: a 400 means a JSON error body was written in place of the file. Report to the user which files failed and why.

## 5. Gotchas worth telling the user about

- **New keys may not survive a binary round trip by name.** Binary files store only `hash(section*name)`. On reopen, a key resolves to a name only if it's in the built-in dictionary (`src/lib/inibin_fix.ts`, `src/lib/troybin_fix.ts`). Otherwise it shows up under `UNKNOWN_HASHES`. The data is still correct. Only the label is lost.
- **Numeric-looking strings come back as numbers** after a binary round trip, because the reader converts them.
- **The text export sorts** sections and keys alphabetically, so a diff against a hand-written `.ini` will show reordering.
- **Status 400 is always `{"error": "..."}`.** Read the message rather than guessing. It names the field or the operation that was wrong.
