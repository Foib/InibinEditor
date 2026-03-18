/** A single inibin value: number, string, boolean-as-number, or a tuple of numbers */
export type InibinValue = number | string | number[];

/** Parsed inibin data with resolved section/name pairs and remaining unknown hashes */
export interface InibinData {
	/** Resolved values grouped by section -> name -> value */
	Values: Record<string, Record<string, InibinValue>>;
	/** Unresolved hash -> value pairs (keys are numeric hashes) */
	UNKNOWN_HASHES: Record<number, InibinValue>;
}

/** A fix dictionary entry mapping a hash to its section and name */
export type FixDictEntry = [section: string, name: string];

/** Fix dictionary: hash -> [section, name] */
export type FixDict = Map<number, FixDictEntry>;
