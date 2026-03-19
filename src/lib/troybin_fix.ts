import type { FixDict, InibinData, InibinValue } from './types';

const RAND_VARS = 10;
const GPART_VARS = 50;
const ROT_VARS = 10;
const FIELD_VARS = 10;
const COMMENTS = ['%s', "'%s"];

function ihash(value: string, ret: number = 0): number {
	for (const c of value) {
		ret = (c.toLowerCase().charCodeAt(0) + Math.imul(65599, ret)) >>> 0;
	}
	return ret >>> 0;
}

function* a_ihash(
	sections: string[],
	names: string[]
): Generator<[section: string, name: string, hash: number]> {
	for (const section of sections) {
		const sectionHash = ihash('*', ihash(section));
		for (const rawName of names) {
			for (const com of COMMENTS) {
				const name = com.replace('%s', rawName);
				const ret = ihash(name, sectionHash);
				yield [section, name, ret];
			}
		}
	}
}

function flex(...args: string[]): string[] {
	return [
		...args,
		...args.map((a) => `${a}_flex`),
		...args.flatMap((a) => Array.from({ length: 4 }, (_, x) => `${a}_flex${x}`))
	];
}

function rand(mods: string[], ...args: string[]): string[] {
	return [
		...args,
		...args.flatMap((a) => Array.from({ length: RAND_VARS }, (_, x) => `${a}${x}`)),
		...args.flatMap((a) => mods.map((m) => `${a}${m}P`)),
		...args.flatMap((a) =>
			mods.flatMap((m) => Array.from({ length: RAND_VARS }, (_, x) => `${a}${m}P${x}`))
		)
	];
}

function rand_float(...args: string[]): string[] {
	return rand(['X', ''], ...args);
}

function rand_vec2(...args: string[]): string[] {
	return rand(['X', 'Y'], ...args);
}

function rand_vec3(...args: string[]): string[] {
	return rand(['X', 'Y', 'Z'], ...args);
}

function rand_color(...args: string[]): string[] {
	return rand(['R', 'G', 'B', 'A'], ...args);
}

function flex_rand_float(...args: string[]): string[] {
	return rand_float(...flex(...args));
}

function flex_rand_vec2(...args: string[]): string[] {
	return rand_vec2(...flex(...args));
}

function flex_rand_vec3(...args: string[]): string[] {
	return rand_vec3(...flex(...args));
}

function flex_rand_color(...args: string[]): string[] {
	return rand_color(...flex(...args));
}

// --- Name lists ---

const material_names: string[] = [
	'MaterialOverrideTransMap',
	'MaterialOverrideTransSource',
	'p-trans-sample',
	...[
		'BlendMode',
		'GlossTexture',
		'EmissiveTexture',
		'FixedAlphaScrolling',
		'Priority',
		'RenderingMode',
		'SubMesh',
		'Texture',
		'UVScroll'
	].flatMap((prop) => Array.from({ length: 5 }, (_, x) => `MaterialOverride${x}${prop}`))
];

const part_group_names: string[] = Array.from({ length: GPART_VARS }, (_, x) => `GroupPart${x}`);

const part_field_names: string[] = [
	'field-accel-',
	'field-attract-',
	'field-drag-',
	'field-noise-',
	'field-orbit-'
].flatMap((prefix) => Array.from({ length: FIELD_VARS - 1 }, (_, x) => `${prefix}${x + 1}`));

const part_fluid_names: string[] = ['fluid-params'];

const system_names: string[] = [
	'AudioFlexValueParameterName',
	'AudioParameterFlexID',
	'build-up-time',
	'group-vis',
	'group-scale-cap',
	...[
		'GroupPart%d',
		'GroupPart%dType',
		'GroupPart%dImportance',
		'Override-Offset%d',
		'Override-Rotation%d',
		'Override-Scale%d'
	].flatMap((tmpl) => Array.from({ length: GPART_VARS }, (_, x) => tmpl.replace('%d', String(x)))),
	'KeepOrientationAfterSpellCast',
	...material_names,
	'PersistThruDeath',
	'PersistThruRevive',
	'SelfIllumination',
	'SimulateEveryFrame',
	'SimulateOncePerFrame',
	'SimulateWhileOffScreen',
	'SoundEndsOnEmitterEnd',
	'SoundOnCreate',
	'SoundPersistent',
	'SoundsPlayWhileOffScreen',
	'VoiceOverOnCreate',
	'VoiceOverPersistent'
];

const group_names: string[] = [
	...new Set([
		'ExcludeAttachmentType',
		'KeywordsExcluded',
		'KeywordsIncluded',
		'KeywordsRequired',
		'Particle-ScaleAlongMovementVector',
		'SoundOnCreate',
		'SoundPersistent',
		'VoiceOverOnCreate',
		'VoiceOverPersistent',
		'dont-scroll-alpha-UV',
		'e-active',
		'e-alpharef',
		'e-beam-segments',
		'e-censor-policy',
		'e-disabled',
		'e-life',
		'e-life-scale',
		'e-linger',
		'e-local-orient',
		'e-period',
		'e-shape-name',
		'e-shape-scale',
		'e-shape-use-normal-for-birth',
		'e-soft-in-depth',
		'e-soft-out-depth',
		'e-soft-in-depth-delta',
		'e-soft-out-depth-delta',
		'e-timeoffset',
		'e-trail-cutoff',
		'e-uvscroll',
		'e-uvscroll-mult',
		'flag-brighter-in-fow',
		'flag-disable-z',
		'flag-force-animated-mesh-z-write',
		'flag-projected',
		...material_names,
		'p-alphaslicerange',
		'p-animation',
		'p-backfaceon',
		'p-beammode',
		'p-bindtoemitter',
		'p-coloroffset',
		'p-colorscale',
		'p-colortype',
		'p-distortion-mode',
		'p-distortion-power',
		'p-falloff-texture',
		'p-fixedorbit',
		'p-fixedorbittype',
		'p-flexoffset',
		'p-flexscale',
		'p-followterrain',
		'p-frameRate',
		'p-frameRate-mult',
		'p-fresnel',
		'p-life-scale',
		'p-life-scale-offset',
		'p-life-scale-symX',
		'p-life-scale-symY',
		'p-life-scale-symZ',
		'p-linger',
		'p-local-orient',
		'p-lockedtoemitter',
		'p-mesh',
		'p-meshtex',
		'p-meshtex-mult',
		'p-normal-map',
		'p-numframes',
		'p-numframes-mult',
		'p-offsetbyheight',
		'p-offsetbyradius',
		'p-orientation',
		'p-projection-fading',
		'p-projection-y-range',
		'p-randomstartframe',
		'p-randomstartframe-mult',
		'p-reflection-fresnel',
		'p-reflection-map',
		'p-reflection-opacity-direct',
		'p-reflection-opacity-glancing',
		'p-rgba',
		'p-scalebias',
		'p-scalebyheight',
		'p-scalebyradius',
		'p-scaleupfromorigin',
		'p-shadow',
		'p-simpleorient',
		'p-skeleton',
		'p-skin',
		'p-startframe',
		'p-startframe-mult',
		'p-texdiv',
		'p-texdiv-mult',
		'p-texture',
		'p-texture-mode',
		'p-texture-mult',
		'p-texture-mult-mode',
		'p-texture-pixelate',
		'p-trailmode',
		'p-type',
		'p-uvmode',
		'p-uvparallax-scale',
		'p-uvscroll-alpha-mult',
		'p-uvscroll-no-alpha',
		'p-uvscroll-rgb',
		'p-uvscroll-rgb-clamp',
		'p-uvscroll-rgb-clamp-mult',
		'p-vec-velocity-minscale',
		'p-vec-velocity-scale',
		'p-vecalign',
		'p-xquadrot-on',
		'pass',
		'rendermode',
		'single-particle',
		'submesh-list',
		'teamcolor-correction',
		'uniformscale',

		// flex_float
		...flex('p-scale', 'p-scaleEmitOffset'),

		// flex_rand_float
		...flex_rand_float('e-rate', 'p-life', 'p-rotvel'),

		// flex_rand_vec2
		...flex_rand_vec2('e-uvoffset'),

		// flex_rand_vec3
		...flex_rand_vec3('p-offset', 'p-postoffset', 'p-vel'),

		// rand_color
		...rand_color(
			'e-censor-modulate',
			'e-rgba',
			'p-fresnel-color',
			'p-reflection-fresnel-color',
			'p-xrgba'
		),

		// rand_float
		...rand_float(
			'e-color-modulate',
			'e-framerate',
			'p-bindtoemitter',
			'p-life',
			'p-quadrot',
			'p-rotvel',
			'p-scale',
			'p-xquadrot',
			'p-xscale',
			'e-rate'
		),

		// rand_vec2
		...rand_vec2(
			'e-ratebyvel',
			'e-uvoffset',
			'e-uvoffset-mult',
			'p-uvscroll-rgb',
			'p-uvscroll-rgb-mult'
		),

		// rand_vec3
		...rand_vec3(
			'Emitter-BirthRotationalAcceleration',
			'Particle-Acceleration',
			'Particle-Drag',
			'Particle-Velocity',
			'e-tilesize',
			'p-accel',
			'p-drag',
			'p-offset',
			'p-orbitvel',
			'p-postoffset',
			'p-quadrot',
			'p-rotvel',
			'p-scale',
			'p-vel',
			'p-worldaccel',
			'p-xquadrot',
			'p-xrgba-beam-bind-distance',
			'p-xscale'
		),

		// Child particle names
		'ChildParticleName',
		'ChildSpawnAtBone',
		'ChildEmitOnDeath',
		'p-childProb',
		...['ChildParticleName', 'ChildSpawnAtBone', 'ChildEmitOnDeath'].flatMap((name) =>
			Array.from({ length: 10 }, (_, x) => `${name}${x}`)
		),

		// Rotation variants
		...rand_float(...Array.from({ length: ROT_VARS }, (_, x) => `e-rotation${x}`)),
		...Array.from({ length: ROT_VARS }, (_, x) => `e-rotation${x}-axis`),

		// Include part field and fluid names
		...part_field_names,
		...part_fluid_names
	])
];

const fluid_names: string[] = [
	'f-accel',
	'f-buoyancy',
	'f-denseforce',
	'f-diffusion',
	'f-dissipation',
	'f-life',
	'f-initdensity',
	'f-movement-x',
	'f-movement-y',
	'f-viscosity',
	'f-startkick',
	'f-rate',
	'f-rendersize',
	...['f-jetdir', 'f-jetdirdiff', 'f-jetpos', 'f-jetspeed'].flatMap((prefix) =>
		Array.from({ length: 4 }, (_, x) => `${prefix}${x}`)
	)
];

const field_names: string[] = [
	'f-axisfrac',
	'f-localspace',
	...rand_float('f-accel', 'f-drag', 'f-period', 'f-radius', 'f-veldelta'),
	...rand_vec3('f-accel', 'f-direction', 'f-pos')
];

function getValues(tbin: InibinData, sections: string[], names: string[]): string[] {
	const vals = tbin.Values;
	const unks = tbin.UNKNOWN_HASHES;
	const result: string[] = [];

	for (const [section, name, h] of a_ihash(sections, names)) {
		if (h in unks) {
			const v = unks[h];
			if (typeof v === 'string') {
				result.push(v);
			}
		} else if (section in vals && name in vals[section]) {
			const v = vals[section][name];
			if (typeof v === 'string') {
				result.push(v);
			}
		}
	}

	return result;
}

export function getTroybinFixdict(tbin: InibinData): FixDict {
	if (!tbin.Values) tbin.Values = {};
	if (!tbin.UNKNOWN_HASHES) tbin.UNKNOWN_HASHES = {};

	const groups = getValues(tbin, ['System'], part_group_names);
	const fields = getValues(tbin, groups, part_field_names);
	const fluids = getValues(tbin, groups, part_fluid_names);
	const dict: FixDict = new Map();

	const mappings: [string[], string[]][] = [
		[groups, group_names],
		[fields, field_names],
		[fluids, fluid_names],
		[['System'], system_names]
	];

	for (const [sections, names] of mappings) {
		for (const [section, name, hash] of a_ihash(sections, names)) {
			dict.set(hash, [section, name]);
		}
	}

	return dict;
}

export function troybinFix(tbin: InibinData, fixd?: FixDict): void {
	if (!fixd) {
		fixd = getTroybinFixdict(tbin);
	}
	if (!tbin.Values) {
		tbin.Values = {};
	}
	if (!tbin.UNKNOWN_HASHES) {
		tbin.UNKNOWN_HASHES = {};
	}
	const values = tbin.Values;
	const unk = tbin.UNKNOWN_HASHES;

	for (const [h, [s, n]] of fixd) {
		if (h in unk) {
			if (!(s in values)) {
				values[s] = {};
			}
			values[s][n] = unk[h];
			delete unk[h];
		}
	}
}
