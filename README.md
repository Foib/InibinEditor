# LoLxbin Editor

A browser-based editor for League of Legends `.inibin`, `.ini`, `.troybin` and `.troy` files

> [!NOTE]
>
> - This project was vibe coded
> - Inibin and Troybin conversion was ported from [lolpytools](https://github.com/moonshadow565/lolpytools/)

## Features

- **Open files**
- **Automatic hash resolution**
  - hashed keys are mapped back to human readable `section -> name` pairs using a built-in fix dictionary. Unresolved hashes are shown separately
- **View and search**
  - values are grouped into collapsible sections with text filtering
- **Edit**
  - modify existing values or add new entries and sections
- **Export**
  - save changes back to `.inibin`, `.ini`, `.troybin` or `.troy` format

## Getting Started

```bash
# Install dependencies
bun install

# Start the dev server
bun run dev
```

## HTTP API

The dev server (and any server deployment) exposes the editor's actions under `/api`. The API is stateless: every request carries the document, and the response returns the result. `GET /api` lists the endpoints.

| Endpoint           | Does                                                                  | Options                                                    |
| ------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| `POST /api/open`   | Opens a file and returns it as a JSON document                        | `search`: filters the returned `sections`                  |
| `POST /api/edit`   | Applies `operations` in order and returns the result                  | `operations`, `format`: `json` (default), `text`, `binary` |
| `POST /api/export` | Exports as `.ini`/`.troy` (`text`) or `.inibin`/`.troybin` (`binary`) | `format` (required)                                        |

Each endpoint accepts the document in any of three forms:

- `multipart/form-data` with a `file` field, with options as further form fields
- `application/json`: a document as returned by `/api/open`, with options as further properties
- raw file bytes with `?fileName=` in the query string, with options in the query string as well

### Operations

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

String values are parsed the same way as in the editor's input fields, so `"600"` becomes a number and `"1 2 3"` a vector. Wrap a string in quotes (`"\"600\""`) to keep it a string. `setEntry` creates the section if it does not exist. If an operation fails, the response is `400 { "error": "..." }` and names the failing operation.

### Examples

```bash
# Read a file as JSON
curl -F file=@Annie.inibin http://localhost:5173/api/open

# Change a value and save the result as .inibin
curl -F file=@Annie.inibin \
  -F 'operations=[{"op":"setEntry","section":"Data","name":"BaseHP","value":"600"}]' \
  -F format=binary -o Annie.inibin http://localhost:5173/api/edit

# Convert .troybin to .troy
curl -F file=@effect.troybin -F format=text -o effect.troy http://localhost:5173/api/export
```
