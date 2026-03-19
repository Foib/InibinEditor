# Inibin Editor

A browser-based editor for League of Legends `.inibin`, `.ini`, `.troybin` and `.troy` files

> [!NOTE]
>
> - This project was vibe coded
> - Inibin conversion was ported from [lolpytools](https://github.com/moonshadow565/lolpytools/)

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
