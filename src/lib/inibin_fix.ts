import type { FixDict, InibinData } from './types';

const COMMENTS = ['%s', "'%s"];

export function ihash(value: string, ret: number = 0): number {
	for (const c of value) {
		ret = (c.toLowerCase().charCodeAt(0) + ((65599 * ret) >>> 0)) >>> 0;
	}
	return ret;
}

export function buildFixDict(sections: string[], names: string[]): FixDict {
	const dict: FixDict = new Map();
	for (const section of sections) {
		const sectionHash = ihash('*', ihash(section));
		for (const rawName of names) {
			for (const com of COMMENTS) {
				const name = com.replace('%s', rawName);
				const hash = ihash(name, sectionHash);
				dict.set(hash, [section, name]);
			}
		}
	}
	return dict;
}

const all_gamemodes = [
	'ARAM',
	'CLASSIC',
	'FIRSTBLOOD',
	'ODIN',
	'ONEFORALL',
	'TUTORIAL',
	'ASCENSION',
	'URF',
	'ASSASSINATE',
	'DARKSTAR',
	'SIEGE',
	'STARGUARDIAN',
	'KingPoro'
];

const all_mutators = [
	...all_gamemodes,
	'Bilgewater',
	'Clarity',
	'Default',
	'NightmareBots',
	'NightmareBotsDebug',
	'TagTeam'
];

const all_stats = [
	'BattleFury',
	'BloodWell',
	'DragonFury',
	'Energy',
	'Ferocity',
	'GnarFury',
	'Heat',
	'MP',
	'Mana',
	'None',
	'Other',
	'Rage',
	'Shield',
	'Wind'
];

function mapVars(...args: string[]): string[] {
	const ret = [...args];
	for (const a of args) {
		for (let x = 0; x < 15; x++) {
			ret.push(`Map${x}_${a}`);
		}
	}
	return ret;
}

const all_inibin_fixlist = [
	// TODO: LEVELS/MapX/AtmosphereMutators.inibin (Atmosphere*mutators)
	// LEVELS/MapX/Audio.inibin
	[
		['Default', ...all_gamemodes.map((m) => `GameMode_${m}`)],
		['AmbientEvent', 'DefeatMusic', 'ReverbPreset', 'ThemeMusic', 'VictoryMusic']
	],
	[['SoundBanks'], ['EventLookupTable', 'NumOfSoundBanks']],
	// LEVELS/MapX/clouds.inibin
	[['Clouds'], ['SpeedU', 'SpeedV', 'Texture', 'Tile']],
	// LEVELS/MapX/DeathTimes.inibin
	[['DeathTimeScaling'], ['IncrementTime', 'PercentCap', 'PercentIncrease', 'StartTime']],
	[['DeathTimeSettings'], ['AllowDeathTimeMods', 'StartDeathTimerForZombies']],
	[['DeathWaveRespawn'], ['WaveRespawnInterval']],
	[['ExpGrantedOnDeath'], ['BaseExpMultiple', 'LevelDifferenceExpMultiple', 'MinimumExpMultiple']],
	[
		['TimeDeadPerLevel', 'TimeDeadPerLevelTutorial'],
		[...Array.from({ length: 31 }, (_, x) => `Level${x.toString().padStart(2, '0')}`)]
	],
	// LEVELS/MapX/Items.inibin
	[
		[
			'ItemInclusionList',
			'UnpurchasableItemList',
			'UnpurchasableItemListTutorial',
			...all_mutators.map((x) => `UnpurchasableItemList_${x}`)
		],
		[...Array.from({ length: 200 }, (_, x) => `Item${x}`)]
	],
	// LEVELS/MapX/Gamma.inibin
	[['Gamma'], ['Brightness', 'Contrast', 'Gamma', 'Level']],
	// LEVELS/MapX/Graphics.inibin
	[['TextureQuality'], ['Default', 'Effects', 'Grass', 'Terrain', 'World']],
	[['SimpleEnvironment'], ['HighlightColor']],
	// LEVELS/MapX/Mission.inibin
	[
		['ExtraSummonerItem', 'ExtraSummonerItemTutorial'],
		['Icon', 'ItemID', 'Tooltip']
	],
	[['LoadScreen'], ['ScreenToLoad']],
	[['BehaviorTreeMetaData'], ['BehaviorTreeNodeLibraryCommon', 'BehaviorTreeNodeLibraryClient']],
	[['General'], ['RelativeColorization', 'StringID']],
	// LEVELS/MapX/MonsterDataTableX.inibin
	[
		['AbilityPower', 'AttackDamage', 'Armor', 'Experience', 'Gold', 'Health', 'MagicResist'],
		[...Array.from({ length: 20 }, (_, x) => `Level${x}`)]
	],
	// LEVELS/MapX/NeutralTimers.inibin
	[
		['General'],
		[
			...Array.from({ length: 10 }, (_, x) => `Element${x}`),
			...Array.from({ length: 10 }, (_, x) =>
				['Default', 'Colorblind', 'Spectator'].map((y) => `Element${x}_${y}`)
			).flat(),
			'HudFrameHandle',
			'Colorblind',
			'Spectator',
			'HudFrameHandle',
			'HudGroup',
			'RespawnTime',
			'TimerTooltip',
			'TimerWarningThreshold'
		]
	],
	[
		[...Array.from({ length: 10 }, (_, x) => `Timer${x}`)],
		[
			'HudHandleText',
			'HudHandleIcon',
			...['Default', 'Colorblind', 'Spectator'].map((x) => `HudHandleIcon_${x}`),
			'TimerType',
			'TooltipName',
			'TooltipRespawn',
			'TimerWarningThreshold'
		]
	],
	// LEVELS/MapX/ExpCurve.inibin
	[
		['EXP', 'EXPTutorial'],
		[...Array.from({ length: 31 }, (_, x) => `Level${x.toString().padStart(2, '0')}`)]
	],
	// LEVELS/MapX/ExpCurve.inibin
	[['Experience'], [...Array.from({ length: 5 }, (_, x) => `PlayerMinionSplitXP${x + 1}`)]],
	[
		['BehaviorTreeMetaData'],
		[
			'BehaviorTreeNodeLibraryCommon',
			'BehaviorTreeNodeLibraryClient',
			'BehaviorTreeNodeLibraryServer'
		]
	],
	[['LoadScreen'], ['ScreenToLoad']],
	// LEVELS/MapX/Particles.inibin
	[
		['FootSteps'],
		[
			...Array.from({ length: 4 }, (_, x) => `EffectName${x}`),
			'EmitterBone',
			'EmitterRotation',
			...Array.from({ length: 4 }, (_, x) => `Key${x}`),
			...Array.from({ length: 4 }, (_, x) => `State${x}`)
		]
	],
	// LEVELS/MapX/PerSide.inibin
	[
		['Camera'],
		['ChaosXOffset', 'ChaosYOffset', 'ChaosZOffset', 'OrderXOffset', 'OrderYOffset', 'OrderZOffset']
	],
	// LEVELS/MapX/StatsProgression.inibin
	[['PerLevelStatsFactor'], [...Array.from({ length: 31 }, (_, x) => `Level${x}`)]],
	// LEVELS/MapX/ShadowSettings.inibin
	[['Shadow'], ['ShadowBias', 'ShadowFadeMinY', 'ShadowFadeRange']],
	// LEVELS/MapX/terrain.inibin
	// LEVELS/MapX/envlighting.inibin
	[['AlphaTest'], ['Cut_off']],
	[['ColorMap'], ['Enable']],
	[['HeightBlending'], ['Enable', 'Layer0_scale', 'Layer1_scale', 'Layer2_scale', 'Layer3_scale']],
	[
		['Environment'],
		[
			'CullingDistanceOverride',
			'DevMark',
			'DisablePointLights',
			'Lighting',
			'Renderer',
			'ShadowBlur',
			'ShadowColor',
			'ShadowDynamicOnly',
			'UseAlphaBlend'
		]
	],
	[
		['FoW'],
		[
			'Blend',
			'BlurKernelSigma',
			'Color_red',
			'Color_green',
			'Color_blue',
			'Fade',
			'FadeFinish',
			'FadeStart',
			'EdgeEnhancement',
			'EdgeTintPoint',
			'Upscale'
		]
	],
	[
		['Fog'],
		[
			'Red',
			'Green',
			'Blue',
			'Opacity',
			'Min_height',
			'Max_height',
			'Min_radius',
			'Max_radius',
			'Min_opaque_height',
			'Max_opaque_height',
			'UseOpacityMap',
			'Enable'
		]
	],
	// DATA/Images/UI/GameBar
	[['Animation'], ['AnimationTime', 'FrameCount']],
	[['Frames'], [...Array.from({ length: 25 }, (_, x) => `Frame${x}`)]],
	// DATA/Globals/ABGroups.inibin
	[['Settings'], ['EnabledGroups']],
	[['Control'], ['Weight', 'Features']],
	[['Everything'], ['Weight', 'Features']],
	// DATA/Globals/Critical.inibin
	[['Karma'], [...Array.from({ length: 201 }, (_, c) => `Critical${c}`)]],
	// DATA/Globals/ExcludedItems.inibin
	[
		['ExcludedItems'],
		[
			// TODO: find upper limit
			...Array.from({ length: 199 }, (_, x) => `ExcludedItem${x + 1}`)
		]
	],
	// DATA/Globals/LimitedQuanitityItems.inibin
	[
		['LimitedQuanitityItems'],
		[
			// TODO: find upper limit
			...Array.from({ length: 199 }, (_, x) => `LQItem${x + 1}`)
		]
	],
	// DATA/Globals/Tips.inibin
	[['Global', ...all_gamemodes], ['MaxViewable']],
	[['Global'], ['DialogueClosedSound', 'DialogueOpenedSound', 'MaxViewable', 'TipRecievedSound']],
	// DATA/Globals/GameMutatorExpansions.inibin
	[[...all_mutators], [...Array.from({ length: 13 }, (_, x) => `Mutator${x}`)]],
	// DATA/Globals/Bounty.inibin
	[
		['Global', ...all_gamemodes],
		[
			'AssistDeathstreakReduction',
			'AssistDurationOverride',
			'AssistGoldPerStreak',
			'AssistGoldStreakCap',
			'AssistGoldStreakStart',
			'AssistPoolMax',
			'AssistPoolMaxValueTime',
			'AssistPoolMin',
			'AssistPoolMinValueTime',
			'AssistStreakBonus',
			'AssistStreakMin',
			'BaseGold',
			'BountyRoundDownIncrement',
			'DeathStreakPenalty',
			'FirstBloodBonus',
			'GoldPoolForAssist',
			'KillStreakBonus',
			'MaxKillStreakBonus',
			'MinAssistsForStreak',
			'MinDeathsForStreak',
			'MinDeathStreakPenalty',
			'MinionGoldDeathstreakReductionRatio',
			'MinionGoldValueForBounty',
			'MinKillsForStreak',
			'MinMinionGoldValueForBounty',
			'PercentBountyResetOnDeath',
			'TimeBasedMinValuePercent',
			'TimeToMaxValueInSeconds',
			'TimeToMinValueInSeconds'
		]
	],
	[['DeathStreak'], ['DeathStreakPenalty', 'MinDeathsForStreak', 'MinDeathStreakPenalty']],
	[['KillStreak'], ['KillStreakBonus', 'MaxKillStreakBonus', 'MinKillsForStreak']],
	// DATA/Globals/ColorSettings.inibin
	[
		['ColorChaos', 'ColorOrder'],
		['PlayerColorHighlightBlue', 'PlayerColorHighlightGreen', 'PlayerColorHighlightRed']
	],
	// DATA/Globals/*_Stats.inibin
	[
		['HeroStats'],
		[
			'ID',
			'NAME',
			'SKIN',
			'TEAM',
			'WIN',
			'EXP',
			'LEVEL',
			'GOLD_SPENT',
			'GOLD_EARNED',
			'NUM_DEATHS',
			'CHAMPIONS_KILLED',
			'ASSISTS',
			'BARRACKS_KILLED',
			'TURRETS_KILLED',
			'HQ_KILLED',
			'MINIONS_KILLED',
			'NEUTRAL_MINIONS_KILLED',
			'SUPER_MONSTER_KILLED',
			'LARGEST_KILLING_SPREE',
			'KILLING_SPREES',
			'LARGEST_MULTI_KILL',
			'TOTAL_DAMAGE_DEALT',
			'PHYSICAL_DAMAGE_DEALT_PLAYER',
			'MAGIC_DAMAGE_DEALT_PLAYER',
			'TOTAL_DAMAGE_DEALT_TO_CHAMPIONS',
			'PHYSICAL_DAMAGE_DEALT_TO_CHAMPIONS',
			'MAGIC_DAMAGE_DEALT_TO_CHAMPIONS',
			'TOTAL_DAMAGE_TAKEN',
			'PHYSICAL_DAMAGE_TAKEN',
			'MAGIC_DAMAGE_TAKEN',
			'DOUBLE_KILLS',
			'TRIPLE_KILLS',
			'QUADRA_KILLS',
			'PENTA_KILLS',
			'UNREAL_KILLS',
			'ITEMS_PURCHASED',
			'CONSUMABLES_PURCHASED',
			'SPELL1_CAST',
			'SPELL2_CAST',
			'SPELL3_CAST',
			'SPELL4_CAST',
			'SUMMON_SPELL1_CAST',
			'SUMMON_SPELL2_CAST',
			'LARGEST_CRITICAL_STRIKE',
			'TIME_PLAYED',
			'LONGEST_TIME_SPENT_LIVING',
			'TOTAL_TIME_SPENT_DEAD',
			'TOTAL_HEAL',
			'TOTAL_UNITS_HEALED',
			'FRIENDLY_TURRET_LOST',
			'FRIENDLY_DAMPEN_LOST',
			'FRIENDLY_HQ_LOST',
			'TOOK_FIRST_BLOOD',
			'WAS_AFK',
			'WAS_AFK_AFTER_FAILED_SURRENDER',
			'TIME_OF_FROM_LAST_DISCONNECT',
			'TIME_SPENT_DISCONNECTED',
			'NEVER_ENTERED_GAME',
			'TEAMMATE_NEVER_ENTERED_GAME',
			'ITEM0',
			'ITEM1',
			'ITEM2',
			'ITEM3',
			'ITEM4',
			'ITEM5',
			'ITEM6',
			'SIGHT_WARDS_BOUGHT_IN_GAME',
			'VISION_WARDS_BOUGHT_IN_GAME',
			'NODE_CAPTURE',
			'NODE_NEUTRALIZE',
			'NODE_KILL_OFFENSE',
			'TEAM_OBJECTIVE',
			'DEFEND_POINT_NEUTRALIZE',
			'NODE_KILL_DEFENSE',
			'NODE_TIME_DEFENSE',
			'LAST_STAND',
			'NODE_CAPTURE_ASSIST',
			'NODE_NEUTRALIZE_ASSIST',
			'TOTAL_PLAYER_SCORE',
			'OFFENSE_PLAYER_SCORE',
			'DEFENSE_PLAYER_SCORE',
			'COMBAT_PLAYER_SCORE',
			'OBJECTIVE_PLAYER_SCORE',
			'VICTORY_POINT_TOTAL',
			'TOTAL_SCORE_RANK',
			'PING',
			'TRUE_DAMAGE_DEALT_PLAYER',
			'TRUE_DAMAGE_TAKEN',
			'TRUE_DAMAGE_DEALT_TO_CHAMPIONS',
			'WARD_PLACED',
			'WARD_KILLED',
			'TOTAL_TIME_CROWD_CONTROL_DEALT',
			'NEUTRAL_MINIONS_KILLED',
			'NEUTRAL_MINIONS_KILLED_YOUR_JUNGLE',
			'NEUTRAL_MINIONS_KILLED_ENEMY_JUNGLE'
		]
	],
	[
		['MoveSpeed'],
		[
			'MajorMovePenaltyCoefficient',
			'MajorMovePenaltyThreshold',
			'MinorMovePenaltyCoefficient',
			'MinorMovePenaltyThreshold',
			'SlowMovePenaltyCoefficient',
			'SlowMovePenaltyThreshold',
			'WallPathingFactor'
		]
	],
	// DATA/Globals/Quests.inibin
	[
		['PrimaryQuests', 'SecondaryQuests', 'Objectives'],
		[
			...['RecievedSound', 'CompletedSound', 'FailedSound'].flatMap((x) =>
				['Effect', 'VO_ID', 'VO_Folder'].map((y) => `${x}${y}`)
			),
			'Effect',
			'VO_ID',
			'VO_Folder',
			'CompletedText',
			'FailedText',
			'MaxViewable',
			'RecievedText',
			'TitleText'
		]
	],
	[['Coefficients'], ['MCoefficient', 'NCoefficient']],
	// DATA/Menu_SC4/PARStates.inibin
	[
		[...all_stats],
		[
			'NumStates',
			'ShowPAR',
			'ShowRegen',
			// TODO: GnarFurry has State5 ...
			...Array.from({ length: 3 }, (_, x) => `State${x}Color`),
			...Array.from({ length: 3 }, (_, x) => `State${x}FadeColor`),
			...Array.from({ length: 3 }, (_, x) => `State${x}VideoPrefix`)
		]
	],
	// DATA/Menu_SC4/HUD.inibin
	[
		['Texture'],
		[
			'BaseBorder',
			'ButtonBG',
			'BaseFill',
			'BaseIcon',
			'IndicatorBG',
			'TowerBorder',
			'TowerFill',
			'TowerIcon'
		]
	],
	[
		['Texture', ...Array.from({ length: 4 }, (_, x) => `Texture${x}`)],
		['Bot', 'Mid', 'Top']
	],
	[['Position'], ['BaseOffsetFromEdge', 'LaneOffsetFromTopOfScreen', 'SizeOfTowerDisplay']],
	// DATA/Menu_SC4/GeneralCharacterData.inibin
	// TODO: Do we need this?
	[['AttackData'], ['AttackAutoInterruptPercent']],
	[
		['GeneralDataHero'],
		[
			'DefaultBoundingCylinderHeight',
			'DefaultBoundingCylinderRadius',
			'DefaultBoundingSphereRadius',
			'DefaultChampionCollisionRadius',
			'DefaultHealthPerMegaTick',
			'DefaultHealthPerTick',
			'FadeTimerForHealthBar',
			'FullHealthAlpha',
			'MaxHealthTicks',
			'ZeroHealthAlpha'
		]
	],
	// DATA/LoadingScreen/
	[
		['Data'],
		[
			...Array.from({ length: 4 }, (_, x) => `Badge${x}_ID`),
			...Array.from({ length: 4 }, (_, x) => `Badge${x}TexU`),
			...Array.from({ length: 4 }, (_, x) => `Badge${x}TexV`),
			'BackgroundTexBotU',
			'BackgroundTexBotV',
			'BackgroundTexChaosOffset',
			'BackgroundTexU',
			'BackgroundTexV',
			'BadgeBorderTexHeight',
			'BadgeBorderTexU',
			'BadgeBorderTexV',
			'BadgeBorderTexWidth',
			'BadgeBorderTexU',
			'BadgeBorderTexV',
			'BadgeBorderTexWidth',
			'BadgeTexHeight',
			'BadgeTexWidth',
			...Array.from({ length: 4 }, (_, x) => `BarTextUVs${x}u1`),
			...Array.from({ length: 4 }, (_, x) => `BarTextUVs${x}u2`),
			...Array.from({ length: 4 }, (_, x) => `BarTextUVs${x}v1`),
			...Array.from({ length: 4 }, (_, x) => `BarTextUVs${x}v2`),
			...Array.from({ length: 4 }, (_, x) => `Badge${x}TexU`),
			...Array.from({ length: 4 }, (_, x) => `Badge${x}TexV`),
			...Array.from({ length: 4 }, (_, x) => `Badge${x}_ID`),
			'BlackBoxHeight',
			'BlackBoxWidth',
			'BlackBoxX',
			'BlackBoxY',
			'CardBarHeightFactor',
			'CardBarWidthFactor',
			'CardBarXFactor',
			'CardBarYFactor',
			'CardHeightFixed',
			'CardWidthFixed',
			'ChampionBoxHeight',
			'ChampionBoxWidth',
			'ChampionBoxX',
			'ChampionBoxY',
			'ChampionCardHeightPercentage',
			'ChampionCardHorizontalLayout',
			'ChampionNameHeight',
			'ChampionNameHeightForLongString',
			'ChampionNameHeightHeightForLongString',
			'ChampionNameOffset',
			'ChampionTextBoxHeight',
			'ChampionTextBoxWidth',
			'ChampionTextBoxX',
			'ChampionTextBoxY',
			'ChaosCardHeightPercentage',
			'ChaosCardWidthPercentage',
			'ChaosCardXPercentage',
			'ChaosCardYPercentage',
			'DebugNumberOnChoas',
			'DebugNumberOnOrder',
			'DebugPing',
			'EnableVs',
			'Image',
			'ImageHeight',
			'ImageWidth',
			'LiveUpdate',
			'LongChampionName',
			'MessageOffsetX',
			'MessageOffsetY',
			'OrderCardHeightPercentage',
			'OrderCardWidthPercentage',
			'OrderCardXPercentage',
			'OrderCardYPercentage',
			'PercentageCompleteNoPingTextY',
			'PercentageCompleteTextX',
			'PercentageCompleteTextY',
			'PercentageMarginBetweenCardsX',
			'PercentageOfScreenBottomMargin',
			'PercentageOfScreenMiddleMargin',
			'PercentageOfScreenTopMargin',
			'PingBarMarginX',
			'PingBarMarginY',
			'PingBoxHeightFactor',
			'PingBoxOffsetFactorX',
			'PingBoxOffsetFactorY',
			'PingBoxWidthFactor',
			'ProfileIconHeightFactor',
			'ProfileIconOffsetFactorX',
			'ProfileIconOffsetFactorY',
			'ProfileIconWidthFactor',
			'ProgressbarBorderTexBotU',
			'ProgressbarBorderTexBotV',
			'ProgressbarBorderTexChaosOffset',
			'ProgressbarBorderTexU',
			'ProgressbarBorderTexV',
			'ProgressbarTexBotU',
			'ProgressbarTexBotV',
			'ProgressbarTexChaosOffset',
			'ProgressbarTexU',
			'ProgressbarTexV',
			'ProgressTextX',
			'ProgressTextY',
			'RankingsTextureAtlas',
			'RankingsTextureX',
			'RankingsTextureY',
			'SummonerNameHeight',
			'SummonerNameOffset',
			'SummonorBoxHeight',
			'SummonorBoxWidth',
			'SummonorSpellBox2X',
			'SummonorSpellBoxX',
			'SummonorSpellBoxY',
			'TeamsTextHeight',
			'TextureHeight',
			'TextureName',
			'Textures',
			'TextureWidth',
			'TextWidth',
			'TipsTextHeight',
			'UseSkinNames',
			'VsBorderTexBotU',
			'VsBorderTexBotV',
			'VsBorderTexU',
			'VsBorderTexV',
			'VsHeightFactor',
			'VsWidthFactor'
		]
	],
	[['VS'], ['FontOutlineSize', 'XPosPercentOfScreen', 'YPosPercentOfScreen', 'Scale']],
	[
		['Background'],
		[
			'ActualSizeHeight',
			'ActualSizeWidth',
			'Image',
			'ImageHeight',
			'ImageWidth',
			'LetterBoxBorderPercentage',
			'LoadBarHeightPercent',
			'LoadBarWidthPercent',
			'PercentLoadBarFromBottom',
			'SlowAutoReload'
		]
	],
	[
		[
			'GameMode',
			'Large',
			'ObjectiveText',
			'Ping',
			'Progress',
			'Small',
			'SmallForLongSkinNames',
			'Teams',
			'Title',
			'Tips'
		],
		[
			'Bold',
			'ColorIn',
			'ColorInChaos',
			'ColorInOrder',
			'ColorInGreen',
			'ColorInOrange',
			'ColorInRed',
			'ColorInYellow',
			'ColorOut',
			'ColorOutChaos',
			'ColorOutOrder',
			'Font',
			'FontColorIn',
			'FontColorOut',
			'FontColorShadow',
			'FontOutlineSize',
			'FontResourceFile',
			'FontSize'
		]
	],
	[['FirstBlood'], ['HBuffer', 'HOffset', 'Image', 'ImageHeight', 'ImageWidth', 'VOffset']],
	[['Teams'], ['RegionChaosX', 'RegionChaosY', 'RegionOrderX', 'RegionOrderY']],
	[
		['ObjectiveText'],
		[
			...Array.from({ length: 5 }, (_, x) => `Objective${x + 1}Line1`),
			...Array.from({ length: 5 }, (_, x) => `Objective${x + 1}Line2`),
			'TimeBetweenMessagesSeconds'
		]
	],
	[
		['Ping'],
		['PingThresholdGreen', 'PingThresholdOrange', 'PingThresholdRed', 'PingThresholdYellow']
	],
	[
		['Progress'],
		[
			'ForGroundProgressBarXOffset',
			'TextOffsetX',
			'TextOffsetXShadow',
			'TextOffsetY',
			'TextOffsetYShadow'
		]
	],
	[
		['Title'],
		[
			'Text',
			'TitleOffScreenOffsetXPercent',
			'TitleScreenOffsetXPercent',
			'TitleScreenOffsetYPercent'
		]
	],
	[
		['TipsLeft', 'TipsPBI', 'TipsRight'],
		[
			'RegionHeight',
			'RegionWidth',
			'RegionX',
			'RegionY',
			'TipsListFile',
			'TipsListSection',
			'TipsType'
		]
	],
	[
		[...all_mutators],
		[
			'Image',
			'DifficultyIconImage',
			'BotDifficultyY',
			'BotDifficultyX',
			'BotDifficultyHeight',
			'BotDifficultyWidth',
			'GameModeTextX',
			'BotDifficultySpacing',
			'GameModeTextHeight',
			'GameModeTextY'
		]
	],
	[
		[...Array.from({ length: 6 }, (_, x) => `Texture${x}`)],
		['Name', 'Width', 'Height', 'Left', 'Top']
	],
	// DATA/Levels/
	[['Data'], ['MapID', 'TutorialEnabled', 'TutorialOnly', 'TotalPlayers']],
	// DATA/Particles/ParticlesDefault.inibin
	[
		['GlobalEffects'],
		[
			'ChampionIndicator',
			'ChaosBarrackDeath',
			'ChaosBarracksDamper',
			'ChaosBarracksDamperRespawn',
			'ChaosBarracksPoweredUp',
			'ChaosBarracksSpawn',
			'ChaosBuildingDeath',
			'ChaosHQDeath',
			'ChaosHQDeath2',
			'ChaosSpawnTurretBeam',
			'ComeHere',
			'CommandGround',
			'CommandTarget',
			'CursorCast',
			'CursorEnemyCastConfirm',
			'CursorEnemyCastConfirmLarge',
			'CursorFriendlyCastConfirm',
			'CursorFriendlyCastConfirmLarge',
			'CursorHoverEnemyUnit',
			'CursorHoverEnemyUnitLarge',
			'CursorHoverFriendlyUnit',
			'CursorHoverFriendlyUnitLarge',
			'CursorMoveTo',
			'CursorMoveToRed',
			'CursorSelectedEnemyUnit',
			'CursorSelectedEnemyUnitLarge',
			'CursorSelectedFriendlyUnit',
			'CursorSelectedFriendlyUnitLarge',
			'Danger',
			'Default',
			'DefendTarget',
			...Array.from({ length: 40 }, (_, x) => `EffectName${x}`),
			'EnemyMinionDeath',
			'EnemyTurretDeath',
			'FocusTarget',
			'FountainHeal',
			...Array.from({ length: 40 }, (_, x) => `FileName${x}`),
			'FriendlyMinionDeath',
			'FriendlyTurretDeath',
			'GoldAcquisition',
			'HeroAllyKilled',
			'HeroBlueKilledSpectator',
			'HeroEnemyKilled',
			'HeroKilledAssistedByPlayer',
			'HeroKilledByHero',
			'HeroKilledByNeutral',
			'HeroKilledByPlayer',
			'HeroRedKilledSpectator',
			'HeroRespawn',
			...Array.from({ length: 40 }, (_, x) => `Key${x}`),
			'LaserSightBeam',
			'LevelUp',
			'MIA',
			'MaxIdentifier',
			'MinionDeath',
			'MissingInstant',
			'MissingLingering',
			'OMW',
			'OrderBarrackDeath',
			'OrderBarracksDamper',
			'OrderBarracksDamperRespawn',
			'OrderBarracksPoweredUp',
			'OrderBarracksSpawn',
			'OrderBuildingDeath',
			'OrderHQDeath',
			'OrderHQDeath2',
			'OrderLaserSightBeam',
			'OrderSpawnTurretBeam',
			'Retreat',
			'StartHeroSpawn',
			...Array.from({ length: 40 }, (_, x) => `State${x}`),
			'TurretDeath'
		]
	],
	// DATA/Characters/HeroSpawnOffsets.inibin
	[
		[
			...Array.from({ length: 6 }, (_, x) => `Chaos${x + 1}`),
			...Array.from({ length: 6 }, (_, x) => `Order${x + 1}`)
		],
		[
			...Array.from({ length: 6 }, (_, x) => `Pos${x + 1}`),
			...Array.from({ length: 6 }, (_, x) => `Facing${x + 1}`)
		]
	],
	// spells, items, talents (everything is a buff -.-)
	[
		['BuffData'],
		[
			'AlternateName',
			'ApplyMaterialOnHitSound',
			'DisplayName',
			'Description',
			'DynamicExtended',
			'DynamicTooltip',
			'DeathRecapPriority',
			...Array.from({ length: 9 }, (_, x) =>
				Array.from({ length: 7 }, (_, y) => `Effect${x + 1}Level${y}Amount`)
			).flat(),
			...Array.from({ length: 6 }, (_, x) => `FloatStaticsDecimals${x + 1}`),
			...Array.from({ length: 6 }, (_, x) => `FloatVarsDecimals${x + 1}`),
			'HideDurationInUI',
			'InventoryIcon',
			'ShowInActiveItemDisplay',
			'ShowInTrackerUI',
			'Sound_VOEventCategory'
		]
	],
	// DATA/Items/metadata/categories.inibin
	// DATA/Items/ItemGroups/*.inibin
	// DATA/Items/X.inibin
	[['Attack'], ['AttackSpeed', 'CriticalStrike', 'Damage', 'LifeSteal']],
	[['Builds'], [...Array.from({ length: 17 }, (_, x) => `Item${x + 1}`)]],
	[
		['Categories'],
		[
			'Active',
			'Armor',
			'ArmorPenetration',
			'AttackSpeed',
			'Aura',
			'Boots',
			'Consumable',
			'CooldownReduction',
			'CriticalStrike',
			'Damage',
			'GoldPer',
			'Health',
			'HealthRegen',
			'Jungle',
			'Internal',
			...Array.from({ length: 17 }, (_, x) => `Item${x + 1}`),
			'Lane',
			'LifeSteal',
			'MagicPenetration',
			'Mana',
			'ManaRegen',
			'Movement',
			'NonbootsMovement',
			'OnHit',
			'Slow',
			'SpellBlock',
			'SpellDamage',
			'SpellVamp',
			'Stealth',
			'Tenacity',
			'Trinket',
			'Vision'
		]
	],
	[
		['Data'],
		[
			'AvatarUniqueEffect',
			'BuildDepth',
			'CanBeDropped',
			'CanBeSold',
			'ClearUndoHistoryOnActivate',
			'Clickable',
			'Consumed',
			'CooldownShowDisabledDuration',
			'Description',
			'DisabledDescriptionOverride',
			'DisappersOnDeath',
			'DisplayName',
			'DropsOnDeath',
			'DynamicTooltip',
			...Array.from({ length: 16 }, (_, x) => `Effect${x}Amount`),
			'EffectRadius',
			'Epicness',
			'FlatArmorMod',
			'FlatArmorPenetrationMod',
			'FlatAttackRangeMod',
			'FlatAttackSpeedMod',
			'FlatBlockMod',
			'FlatBubbleRadius',
			'FlatCastRangeMod',
			'FlatCooldownMod',
			'FlatCritChanceMod',
			'FlatCritDamageMod',
			'FlatDodgeMod',
			'FlatEnergyPoolMod',
			'FlatEnergyRegenMod',
			'FlatEXPBonus',
			'FlatHPPoolMod',
			'FlatHPRegenMod',
			'FlatMagicDamageMod',
			'FlatMagicPenetrationMod',
			'FlatMagicPenetrationModPerLevel',
			'FlatMagicReduction',
			'FlatMissChanceMod',
			'FlatMovementSpeedMod',
			'FlatPhysicalDamageMod',
			'FlatPhysicalReduction',
			'FlatSpellBlockMod',
			'ForceLoad',
			'HideFromAll',
			'ImagePath',
			'InStore',
			'InventoryIcon',
			'InventorySlotMax',
			'InventorySlotMin',
			'IsRecipe',
			'ItemCalloutPlayer',
			'ItemCalloutSpectator',
			'ItemClass',
			'ItemGroup',
			'ItemId',
			'ItemType',
			'ItemVOGroup',
			'MaxGroupOwnable',
			'MaxStack',
			'PARStatName',
			'PercentArmorMod',
			'PercentArmorPenetrationMod',
			'PercentAttackRangeMod',
			'PercentAttackSpeedMod',
			'PercentBaseHPRegenMod',
			'PercentBaseMPRegenMod',
			'PercentBlockMod',
			'PercentBonusArmorPenetrationMod',
			'PercentBonusMagicPenetrationMod',
			'PercentBubbleRadius',
			'PercentCastRangeMod',
			'PercentCooldownMod',
			'PercentCritChanceMod',
			'PercentCritDamageMod',
			'PercentDodgeMod',
			'PercentEXPBonus',
			'PercentHardnessMod',
			'PercentHealingAmountMod',
			'PercentHPPoolMod',
			'PercentHPRegenMod',
			'PercentLifeStealMod',
			'PercentMagicDamageMod',
			'PercentMagicPenetrationMod',
			'PercentMagicReduction',
			'PercentMovementSpeedMod',
			'PercentMultiplicativeAttackSpeedMod',
			'PercentMultiplicativeMovementSpeedMod',
			'PercentPhysicalDamageMod',
			'PercentPhysicalReduction',
			'PercentSlowResistMod',
			'PercentSpellBlockMod',
			'PercentSpellEffectivenessMod',
			'PercentSpellVampMod',
			'PercentTenacityCharacterMod',
			'PercentTenacityCleanseMod',
			'PercentTenacityItemMod',
			'PercentTenacityMasteryMod',
			'PercentTenacityRuneMod',
			'PlatformEnabled',
			'Price',
			'PurchaseCooldown',
			...Array.from({ length: 10 }, (_, x) => `RecipeItem${x}`),
			'RequiredChampion',
			...Array.from({ length: 10 }, (_, x) => `RequiredItem${x}`),
			'RequiredLevel',
			'RequiredSpellName',
			'rFlatArmorModPerLevel',
			'rFlatArmorPenetrationMod',
			'rFlatArmorPenetrationModPerLevel',
			'rFlatCritChanceModPerLevel',
			'rFlatCritDamageModPerLevel',
			'rFlatDodgeMod',
			'rFlatDodgeModPerLevel',
			'rFlatEnergyModPerLevel',
			'rFlatEnergyRegenModPerLevel',
			'rFlatGoldPer10Mod',
			'rFlatHPModPerLevel',
			'rFlatHPRegenModPerLevel',
			'rFlatMagicDamageModPerLevel',
			'rFlatMagicPenetrationMod',
			'rFlatMagicPenetrationModPerLevel',
			'rFlatMovementSpeedModPerLevel',
			'rFlatPhysicalDamageModPerLevel',
			'rFlatSpellBlockModPerLevel',
			'rFlatTimeDeadMod',
			'rFlatTimeDeadModPerLevel',
			'rPercentArmorPenetrationMod',
			'rPercentArmorPenetrationModPerLevel',
			'rPercentAttackSpeedModPerLevel',
			'rPercentCooldownMod',
			'rPercentCooldownModPerLevel',
			'rPercentMagicPenetrationMod',
			'rPercentMagicPenetrationModPerLevel',
			'rPercentMovementSpeedModPerLevel',
			'rPercentTimeDeadMod',
			'rPercentTimeDeadModPerLevel',
			...Array.from({ length: 4 }, (_, x) => `Sidegrade${x + 1}`),
			'SidegradeCredit',
			'SellBackModifier',
			'ShowInActiveItemDisplay',
			'SpecialRecipe',
			'SpellName',
			'SpellLevel',
			'SpellCharges',
			'UsableInStore',
			'UseEffect',
			'UseWhenAcquired',
			...all_stats.flatMap((par) => [
				`Flat${par}PoolMod`,
				`Percent${par}PoolMod`,
				`Flat${par}RegenMod`,
				`Percent${par}RegenMod`,
				`rFlat${par}ModPerLevel`,
				`rFlat${par}RegenModPerLevel`
			])
		]
	],
	[['Movement'], ['Boots', 'NonbootsMovement']],
	[['Start'], ['Jungle', 'Lane']],
	[['Defense'], ['Armor', 'Health', 'HealthRegen', 'SpellBlock', 'Tenacity']],
	[['Magic'], ['SpellVamp', 'Mana', 'ManaRegen', 'CooldownReduction', 'SpellDamage']],
	// DATA/Spells/X.inibin,
	// DATA/Shared/Spells/X.inibin,
	// DATA/Characters/Y/Spells/X.inibin,
	// DATA/Talents/X.inibin
	[['SpawningUI'], ['BuffNameFilter', 'MaxNumberOfUnits']],
	[
		['Data'],
		[
			'Cooldown',
			...Array.from({ length: 5 }, (_, x) => `Level${x + 1}Desc`),
			...Array.from({ length: 5 }, (_, x) => `ManaCost${x + 1}`),
			'Range',
			'SpellDelayCastTime',
			'SpellDelayTotalTime'
		]
	],
	[
		['SpellData'],
		[
			'AfterEffectName',
			'AIBlockLevel',
			'AIEndOnly',
			'AILifetime',
			'AIRadius',
			'AIRange',
			'AISendEvent',
			'AISpeed',
			'AllowWhileTaunted',
			'AlternateName',
			'AlwaysSnapFacing',
			'AmmoCountHiddenInUI',
			'AmmoNotAffectedByCDR',
			'AmmoRechargeTime',
			...Array.from({ length: 6 }, (_, x) => `AmmoRechargeTime${x + 1}`),
			'AmmoUsed',
			...Array.from({ length: 6 }, (_, x) => `AmmoUsed${x + 1}`),
			'AnimationLeadOutName',
			'AnimationLoopName',
			'AnimationName',
			'AnimationWinddownName',
			'ApplyAttackDamage',
			'ApplyAttackEffect',
			'ApplyMaterialOnHitSound',
			'AttackDelayCastOffsetPercent',
			'BelongsToAvatar',
			'BounceRadius',
			'CanCastWhileDisabled',
			'CancelChargeOnRecastTime',
			'CanMoveWhileChanneling',
			'CannotBeSuppressed',
			'CanOnlyCastWhileDead',
			'CanOnlyCastWhileDisabled',
			'CantCancelWhileChanneling',
			'CantCancelWhileWindingUp',
			'CantCastWhileRooted',
			'CastConeAngle',
			'CastConeDistance',
			'CastFrame',
			...mapVars('CastRadius'),
			...mapVars(...Array.from({ length: 7 }, (_, x) => `CastRadius${x}`)),
			...mapVars('CastRadiusSecondary'),
			...mapVars(...Array.from({ length: 7 }, (_, x) => `CastRadiusSecondary${x}`)),
			'CastRadiusSecondaryTexture',
			'CastRadiusTexture',
			...mapVars('CastRange'),
			...mapVars(...Array.from({ length: 7 }, (_, x) => `CastRange${x}`)),
			...mapVars('CastRangeDisplayOverride'),
			...mapVars(...Array.from({ length: 7 }, (_, x) => `CastRangeDisplayOverride${x}`)),
			'CastRangeGrowthDuration',
			...Array.from({ length: 7 }, (_, x) => `CastRangeGrowthDuration${x}`),
			'CastRangeGrowthMax',
			...Array.from({ length: 7 }, (_, x) => `CastRangeGrowthMax${x}`),
			'CastRangeTextureOverrideName',
			'CastRangeUseBoundingBoxes',
			'CastRangeUseMapScaling',
			'CastTargetAdditionalUnitsRadius',
			'CastType',
			'ChannelDuration',
			...Array.from({ length: 7 }, (_, x) => `ChannelDuration${x}`),
			'ChargeUpdateInterval',
			'CircleMissileAngularVelocity',
			'CircleMissileRadialVelocity',
			'ClientOnlyMissileTargetBoneName',
			'Coefficient',
			'Coefficient2',
			'ConsideredAsAutoAttack',
			...mapVars('Cooldown'),
			...mapVars(...Array.from({ length: 7 }, (_, x) => `Cooldown${x}`)),
			'CursorChangesInGrass',
			'CursorChangesInTerrain',
			'DeathRecap',
			'DeathRecapPriority',
			'DelayCastOffsetPercent',
			'DelayTotalTimePercent',
			'Description',
			'DisableCastBar',
			'DisplayName',
			'DoesntBreakChannels',
			'DoNotNeedToFaceTarget',
			'DrawSecondaryLineIndicator',
			'DynamicExtended',
			'DynamicTooltip',
			...mapVars(
				...Array.from({ length: 17 }, (_, x) =>
					Array.from({ length: 7 }, (_, y) => `Effect${x}Level${y}Amount`)
				).flat()
			),
			'ExcludedUnitTags',
			'Flags',
			...Array.from({ length: 6 }, (_, x) => `FloatStaticsDecimals${x + 1}`),
			...Array.from({ length: 6 }, (_, x) => `FloatVarsDecimals${x + 1}`),
			'HaveAfterEffect',
			'HaveHitBone',
			'HaveHitEffect',
			'HavePointEffect',
			'HideRangeIndicatorWhenCasting',
			'HitBoneName',
			'HitEffectName',
			'HitEffectOrientType',
			'HitEffectPlayerName',
			'IgnoreAnimContinueUntilCastFrame',
			'IgnoreRangeCheck',
			'InventoryIcon',
			'InventoryIcon1',
			'InventoryIcon2',
			'InventoryIcon3',
			'IsDisabledWhileDead',
			'IsToggleSpell',
			'KeywordWhenAcquired',
			...Array.from({ length: 7 }, (_, x) => `Level${x}Desc`),
			'LineDragLength',
			'LineMissileBounces',
			'LineMissileCollisionFromStartPoint',
			'LineMissileDelayDestroyAtEndSeconds',
			'LineMissileEndsAtTargetPoint',
			'LineMissileFollowsTerrainHeight',
			'LineMissileTargetHeightAugment',
			'LineMissileTimePulseBetweenCollisionSpellHits',
			'LineMissileTrackUnits',
			'LineMissileTrackUnitsAndContinues',
			'LineMissileUsesAccelerationForBounce',
			'LineTargetingBaseTextureOverrideName',
			'LineTargetingTargetTextureOverrideName',
			'LineWidth',
			...Array.from({ length: 8 }, (_, x) => `LocationTargettingLength${x}`),
			...Array.from({ length: 8 }, (_, x) => `LocationTargettingWidth${x}`),
			'LockConeToPlayer',
			'LookAtPolicy',
			'LuaOnMissileUpdateDistanceInterval',
			'ManaCost',
			...Array.from({ length: 7 }, (_, x) => `ManaCost${x + 1}`),
			'MaxAmmo',
			...Array.from({ length: 7 }, (_, x) => `MaxAmmo${x + 1}`),
			'MaxGrowthRangeTextureName',
			'MaxGrowthLineBaseTextureName',
			'MaxGrowthLineTargetTextureName',
			'MaxHighlightTargets',
			'MinimapIcon',
			'MinimapIconDisplayFlag',
			'MinimapIconRotation',
			'MissileAccel',
			'MissileBoneName',
			'MissileBlockTriggersOnDestroy',
			'MissileEffect',
			'MissileEffectEnemy',
			'MissileEffectPlayer',
			'MissileFixedTravelTime',
			'MissileFollowsTerrainHeight',
			'MissileGravity',
			'MissileLifetime',
			'MissileMaxSpeed',
			'MissileMinSpeed',
			'MissileMinTravelTime',
			'MissilePerceptionBubbleRadius',
			'MissilePerceptionBubbleRevealsStealth',
			'MissileSpeed',
			'MissileTargetHeightAugment',
			'MissileUnblockable',
			'Name',
			'NoWinddownIfCancelled',
			'NumSpellTargeters',
			'OrientRadiusTextureFromPlayer',
			'OrientRangeIndicatorToCursor',
			'OrientRangeIndicatorToFacing',
			'OverrideForceSpellAnimation',
			'OverrideForceSpellCancel',
			'OverrideCastTime',
			'ParticleStartOffset',
			'PhysicalDamageRatio',
			'PlatformEnabled',
			'PointEffectName',
			'PreventChargingSecondCast',
			'Ranks',
			'RangeIndicatorTextureName',
			'RequiredUnitTags',
			'ShowInTrackerUI',
			'SelectionPreference',
			'Sound_CastName',
			'Sound_HitName',
			'Sound_VOEventCategory',
			'SpellCastTime',
			'SpellDamageRatio',
			'SpellRevealsChampion',
			'SpellTotalTime',
			'StartCooldown',
			'SubjectToGlobalCooldown',
			'TargeterConstrainedToRange',
			'TargettingType',
			'TextFlags',
			'TriggersGlobalCooldown',
			'UpdateRotationWhenCasting',
			'UseAnimatorFramerate',
			'UseAutoattackCastTime',
			'UseChargeChanneling',
			'UseChargeTargeting',
			'UseGlobalLineIndicator',
			'UseMinimapTargeting',
			'Version',
			'x1',
			'x2',
			'x3',
			'x4',
			'x5'
		]
	],
	[
		['OffsetTargeting'],
		[
			'OT_ArcTextureOverride',
			'OT_ArcThicknessOffset',
			'OT_AreaRadius',
			'OT_AreaRadius1',
			'OT_AreaRadius2',
			'OT_AreaRadius3',
			'OT_AreaRadius4',
			'OT_AreaRadius5',
			'OT_AreaTextureOverride',
			'OT_DisplaysArcTargeter',
			'OT_DisplaysAreaIndicator',
			'OT_DisplaysLineIndicator',
			'OT_IsArcDirectionLeft',
			'OT_LineBaseTextureOverride',
			'OT_LineEndsAtTargetPoint',
			'OT_LineLength',
			'OT_LineLength1',
			'OT_LineLength2',
			'OT_LineLength3',
			'OT_LineLength4',
			'OT_LineLength5',
			'OT_LineNoIndicatorRadiusTextureOverride',
			'OT_LineTargetTextureOverride',
			'OT_LineWidth'
		]
	],
	[
		['SecondaryTargeting'],
		[
			'CastRadius',
			'CastRadiusTexture',
			...mapVars('CastRange'),
			...mapVars(...Array.from({ length: 7 }, (_, x) => `CastRange${x + 1}`)),
			'CastRangeGrowthMax',
			...Array.from({ length: 7 }, (_, x) => `CastRangeGrowthMax${x + 1}`),
			'CastRangeGrowthDuration',
			...Array.from({ length: 7 }, (_, x) => `CastRangeGrowthDuration${x + 1}`),
			'LineTargetingBaseTextureOverrideName',
			'LineTargetingTargetTextureOverrideName',
			'LineWidth',
			...Array.from({ length: 6 }, (_, x) => `LocationTargettingWidth${x + 1}`),
			...Array.from({ length: 6 }, (_, x) => `LocationTargettingLength${x + 1}`),
			'TargettingType'
		]
	],
	[
		[...Array.from({ length: 9 }, (_, x) => `SpellTargeter${x}`)],
		[
			...['ConstraintPos', 'Center', 'End', 'Start'].flatMap((x) =>
				['_AngleOffset', '_BasePosition', '_DistanceOffset', '_OrientationType'].map(
					(y) => `${x}${y}`
				)
			),
			'AlternateName',
			'AlwaysDraw',
			...Array.from({ length: 7 }, (_, x) => `CastRange${x}`),
			'Center',
			'ConeAngle',
			'ConeRange',
			'ConeFollowsEnd',
			'ConstraintPos',
			'ConstraintRange',
			'DrawableType',
			'End',
			'FallbackDirection',
			'HasMaxGrowRangeTexture',
			'HideWithLineIndicator',
			'IsConstrainedToRange',
			'IsClockwiseArc',
			'Length',
			...Array.from({ length: 7 }, (_, x) => `Length${x}`),
			'LineMissileCollisionFromStartPoint',
			'LineMissileDelayDestroyAtEndSeconds',
			'LineMissileEndsAtTargetPoint',
			'LineMissileTimePulseBetweenCollisionSpellHits',
			'LineMissileTrackUnits',
			'LineStopsAtEndPosition',
			'LineTargetingTargetTextureOverrideName',
			'LineTargetingBaseTextureOverrideName',
			'LineWidth',
			'MaxAngle',
			'MaxAngleRangeFactor',
			'MinAngle',
			'MinAngleRangeFactor',
			'MinimumDisplayedRange',
			'MissilePerceptionBubbleRadius',
			'MissilePerceptionBubbleRevealsStealth',
			'OverrideBaseRange',
			...Array.from({ length: 7 }, (_, x) => `OverrideBaseRange${x}`),
			'OverrideForceSpellAnimation',
			'OverrideForceSpellCancel',
			'OverrideRadius',
			...Array.from({ length: 7 }, (_, x) => `OverrideRadius${x}`),
			'Range',
			'RangeGrowthDuration',
			...Array.from({ length: 7 }, (_, x) => `RangeGrowthDuration${x}`),
			'RangeGrowthMax',
			...Array.from({ length: 7 }, (_, x) => `RangeGrowthMax${x}`),
			'RangeIndicatorTextureName',
			'SpellRevealsChampion',
			'Start',
			'TargettingType',
			'TextureBaseMaxGrow',
			'TextureBaseOverride',
			'TextureCone',
			'TextureConeMaxGrow',
			'TextureMaxGrow',
			'TextureOrientation',
			'TextureOverride',
			'TextureTargetMaxGrow',
			'TextureTargetOverride',
			'TextureWall',
			'Thickness',
			...Array.from({ length: 7 }, (_, x) => `Thickness${x}`),
			'ThicknessOffset',
			'UseCasterBoundingBox',
			'UseGlobalLineIndicator',
			'UseMinimapTargeting',
			'WallOrientation',
			'WallRotation'
		]
	],
	// DATA/Characters/X/X.inibin
	// DATA/Characters/Y/Skins/X/X.inibin
	[['System'], ['Enabled']],
	[['HealthBar'], ['ShowTicks']],
	[['ContextualAction'], ['RuleConfigFile', 'UsesSkinVO']],
	[
		['Data'],
		[
			'AbilityPowerIncPerLevel',
			'AcquisitionRange',
			'AllowPetControl',
			'AlwaysVisible',
			...mapVars('Armor'),
			'ArmorMaterial',
			...mapVars('ArmorPerLevel'),
			'AssetCategory',
			'AttackAutoInterruptPercent',
			'AttackCastTime',
			'AttackDelayCastOffsetPercent',
			'AttackDelayCastOffsetPercentAttackSpeedRatio',
			'AttackDelayOffsetPercent',
			'AttackRange',
			'AttackRank',
			'AttackSpeed',
			'AttackSpeedPerLevel',
			'AttackTotalTime',
			'BaseAbilityPower',
			'BaseCritChance',
			'BaseDamage',
			'BaseDodge',
			...mapVars('BaseFactorHPRegen'),
			...mapVars('BaseFactorMPRegen'),
			...mapVars('BaseHP'),
			...mapVars('BaseMP'),
			'BaseMissChance',
			'BaseSpellEffectiveness',
			...mapVars('BaseStaticHPRegen'),
			...mapVars('BaseStaticMPRegen'),
			'BotEnabled',
			'BotEnabledMM',
			'CastShadows',
			'ChampionId',
			'CharAudioNameOverride',
			'ChasingAttackRangePercent',
			'Classification',
			'CritDamageBonus',
			'CritPerLevel',
			'CS_easy',
			'CS_medium',
			'CS_hard',
			'DamagePerLevel',
			'DeathEventListeningRadius',
			'DeathTime',
			'DefenseRank',
			'DelayCastOffsetPercent',
			'DelayTotalTimePercent',
			'Description',
			'DifficultyRank',
			'DisableAggroIndicator',
			'DisableContinuousTargetFacing',
			'DisableGlobalDeathEffect',
			'DisableUltReadySounds',
			'DodgePerLevel',
			'DrawPARLikeHealth',
			'EnemyTooltip',
			'ExperienceRadius',
			'ExpGivenOnDeath',
			...[
				'BaseAttack',
				'BasicAttack',
				'ExtraAttack',
				'CritAttack',
				'ExtraCritAttack',
				'CriticalAttack'
			].flatMap((a) =>
				[
					'%s%s',
					'%s%s_AttackCastTime',
					'%s%s_AttackCastDelayOffsetPercent',
					'%s%s_AttackDelayCastOffsetPercent',
					'%s%s_AttackDelayCastOffsetPercentAttackSpeedRatio',
					'%s%s_AttackDelayOffsetPercent',
					'%s%s_AttackTotalTime',
					'%s%s_Probability'
				].flatMap((v) =>
					Array.from({ length: 10 }, (_, x) => v.replace('%s%s', `${a}${x > 0 ? x : ''}`))
				)
			),
			...Array.from({ length: 17 }, (_, x) => `ExtraSpell${x}`),
			'FireworksEnabled',
			'FriendlyTooltip',
			'GameplayCollisionRadius',
			'GlobalExpGivenOnDeath',
			'GlobalGoldGivenOnDeath',
			'GoldGivenOnDeath',
			'GoldRadius',
			'HitFxScale',
			'HoverIndicatorRadius',
			'HoverIndicatorTextureName',
			'HoverLineIndicatorBaseTextureName',
			'HoverLineIndicatorTargetTextureName',
			'HoverLineIndicatorWidth',
			'HPPerLevel',
			'HPRegenPerLevel',
			'Immobile',
			'IsElite',
			'IsEpic',
			'IsImportantBotTarget',
			'IsMelee',
			'JointForAnimAdjustedSelection',
			'LevelDodge',
			'LevelSpellEffectiveness',
			'LocalExpGivenOnDeath',
			'LocalGoldGivenOnDeath',
			'LocalGoldSplitWithLastHitter',
			'Lore1',
			'Lore2',
			'MagicRank',
			'MaxLevels',
			'Metadata',
			'MonsterDataTableId',
			'MoveSpeed',
			'MPPerLevel',
			'MPRegenPerLevel',
			'Name',
			'NeverRender',
			'NoAutoAttack',
			'NoHealthBar',
			'OccludedUnitSelectableDistance',
			'OutlineBBoxExpansion',
			'PARColor',
			'PARDisplayThroughDeath',
			'PARFadeColor',
			'PARHasRegenText',
			'PARIncrements',
			'PARMaxSegments',
			'PARNameString',
			'PARType',
			...Array.from({ length: 6 }, (_, i) => i + 1).flatMap((x) => [
				`Passive${x}`,
				`Passive${x}Desc`,
				...Array.from({ length: 7 }, (_, y) => `PassLev${x}Desc${y}`),
				`Passive${x}Icon`,
				...Array.from({ length: 7 }, (_, y) => `Passive${x}Level${y}`),
				...Array.from({ length: 7 }, (_, y) => `Passive${x}Effect${y}`),
				`Passive${x}LuaName`,
				`Passive${x}Name`,
				`Passive${x}NumEffects`,
				`Passive${x}Range`
			]),
			'PassiveSpell',
			'PathfindingCollisionRadius',
			'PerceptionBubbleRadius',
			'PlatformEnabled',
			'PostAttackMoveDelay',
			'RecordAsWard',
			'Roles',
			'SearchTags',
			'SelectionHeight',
			'SelectionRadius',
			'SequentialAutoAttacks',
			'ServerOnly',
			'ShouldFaceTarget',
			'Significance',
			'SkipDrawOutline',
			'SkipDrawToonInking',
			'SoulGivenOnDeath',
			...Array.from({ length: 4 }, (_, i) => i + 1).flatMap((x) => [
				`Spell${x}`,
				`Spell${x}Desc`,
				`Spell${x}DisplayName`,
				`SpellsUpLevels${x}`
			]),
			...mapVars('SpellBlock'),
			...mapVars('SpellBlockPerLevel'),
			'SR_easy',
			'SR_medium',
			'SR_hard',
			'Tips1',
			'Tips2',
			'Tips3',
			'TowerTargetingPriorityBoost',
			'TriggersOrderAcknowledgementVO',
			'UnitTags',
			'UseChampionVisibility',
			'UseRingIconForKillCallout',
			'WeaponMaterial',
			'`WeaponMaterial',
			'WeaponMaterial1',
			'WeaponMaterial2',
			'WeaponMaterial3',
			'WeaponMaterial4'
		]
	],
	[
		['DefaultAnimations'],
		[
			...Array.from({ length: 9 }, (_, x) => `Animation${x + 1}`),
			'NumberOfAnimations',
			'Significance'
		]
	],
	[
		['Evolution'],
		[
			'EnabledWhileDead',
			'EvolveTitle',
			'Spell1EvolveDesc',
			'Spell1EvolveIcon',
			'Spell2EvolveDesc',
			'Spell2EvolveIcon',
			'Spell3EvolveDesc',
			'Spell3EvolveIcon',
			'Spell4EvolveDesc',
			'Spell4EvolveIcon'
		]
	],
	[
		['HealthBar'],
		[
			'AttachToBone',
			'HPPerTick',
			'ParallaxOffset',
			'Scale',
			'ShowWhileUntargetable',
			'UnitBarKey',
			'WorldOffset',
			'XOffset',
			'YOffset'
		]
	],
	[
		['IdleParticles'],
		[
			'BeamParticle',
			'BeamShouldAlwayStargetEnemy',
			'BeamTargetParticle',
			'ChampTargetingParticle',
			'GameplayCollisionRadius',
			'NumberOfParticles',
			'SelfIllumination',
			...Array.from({ length: 100 }, (_, x) => `Particle${x}`),
			'TowerTargetingParticle',
			'TowerTargetingParticle2',
			'TowerTargetingParticle2Death'
		]
	],
	[
		['Info', ...Array.from({ length: 7 }, (_, x) => `Info${x + 1}`)],
		['IconCircle', 'IconCircleScale', 'IconMinimap', 'IconSquare']
	],
	[['Interaction'], ['DoubleSided', 'IdleAnim', 'RandomizeIdleAnimPhase']],
	[
		['MeshSkin'],
		[
			...Array.from({ length: 4 }, (_, x) => `Attack${x + 1}`),
			...Array.from({ length: 4 }, (_, x) => `Click${x + 1}`),
			'Death',
			...Array.from({ length: 4 }, (_, x) => `Move${x + 1}`),
			'SkinClassification',
			...Array.from({ length: 4 }, (_, x) => `Special${x + 1}`)
		]
	],
	[
		['MeshSkin', ...Array.from({ length: 29 }, (_, x) => `MeshSkin${x + 1}`)],
		[
			'Animations',
			'ArmorMaterial',
			'AttributeFlags',
			'Body',
			'BrushAlphaOverride',
			'CastShadows',
			'ChampionSkinID',
			'ChampionSkinName',
			'DisablePreload',
			'EmissiveTexture',
			'ExtraCharacterPreloads',
			'Fresnel',
			'FresnelBlue',
			'FresnelGreen',
			'FresnelRed',
			'GameplayCollisionRadius',
			'GlossTexture',
			'GlowFactor',
			'HPPerTick',
			'IconAvatar',
			'IsOpaque',
			...Array.from({ length: 5 }, (_, x) => [
				`MaterialOverride${x}BlendMode`,
				`MaterialOverride${x}GlossTexture`,
				`MaterialOverride${x}EmissiveTexture`,
				`MaterialOverride${x}FixedAlphaScrolling`,
				`MaterialOverride${x}Priority`,
				`MaterialOverride${x}RenderingMode`,
				`MaterialOverride${x}SubMesh`,
				`MaterialOverride${x}Texture`,
				`MaterialOverride${x}UVScroll`
			]).flat(),
			'MaterialOverrideTransMap',
			'MaterialOverrideTransSource',
			'MaterialOverridePriority',
			'MaxNumBlendWeights',
			'Metadata',
			'OverrideBoundingBox',
			'ParallaxOffset',
			'ParticleOverride_ChampionKillDeathParticle',
			'ParticleOverride_DeathParticle',
			'Ready',
			'ReflectionFresnel',
			'ReflectionFresnelBlue',
			'ReflectionFresnelGreen',
			'ReflectionFresnelRed',
			'ReflectionMap',
			'ReflectionOpacityDirect',
			'ReflectionOpacityGlancing',
			'Scale',
			'SelfIllumination',
			'SimpleSkin',
			'Skeleton',
			'SkinScale',
			'SkinAudioNameOverride',
			'SkipVOOverride',
			'SubmeshMouseOversToHide',
			'SubmeshesToHide',
			'SubmeshShadowsToHide',
			'Texture',
			'TextureLow',
			'UseChildAnimationOverride',
			'UsesSkinVO',
			'UnitBarKey',
			'VOOverride',
			'Weight',
			'WorldOffset',
			'XOffset',
			'YOffset'
		]
	],
	[['Minimap'], ['MinimapIconOverride']],
	[['Minion'], ['AlwaysUpdatePAR', 'AlwaysVisible', 'IsTower']],
	[['Package'], ['FallbackPackage', 'FallbackINI']],
	[
		['ItemSet1', 'ItemSet2', 'RecItems', 'TutorialRecItems'],
		['SetName', ...Array.from({ length: 6 }, (_, x) => `RecItem${x + 1}`)]
	],
	[
		['Sounds'],
		[
			'Attack1',
			'Attack2',
			'Attack3',
			'Attack4',
			'Click1',
			'Click2',
			'Click3',
			'Click4',
			'Death',
			'Move1',
			'Move2',
			'Move3',
			'Move4',
			'Ready',
			'Special1',
			'Special2'
		]
	],
	[
		['Useable'],
		[
			'AllyCanUse',
			'CooldownSpellSlot',
			'EnemyCanUse',
			'GoldRedirectTargetUseableOnly',
			'HeroUseSpell',
			'IsUseable',
			'MinionUseable',
			'MinionUseSpell'
		]
	],
	[['Shader'], ['HasTangent', 'Pixel', 'Vertex']]
];

const all_inibin_fixdict: FixDict = (() => {
	const dict: FixDict = new Map();
	for (const [sections, names] of all_inibin_fixlist) {
		for (const section of sections) {
			const sectionHash = ihash('*', ihash(section));
			for (const rawName of names) {
				for (const com of COMMENTS) {
					const name = com.replace('%s', rawName);
					const h = ihash(name, sectionHash);
					dict.set(h, [section, name]);
				}
			}
		}
	}
	return dict;
})();

export function verifyFixdict(): void {
	const results = new Map<number, [string, string]>();
	for (const [sections, names] of all_inibin_fixlist) {
		for (const section of sections) {
			const sectionHash = ihash('*', ihash(section));
			for (const rawName of names) {
				for (const com of COMMENTS) {
					const name = com.replace('%s', rawName);
					const h = ihash(name, sectionHash);
					if (results.has(h)) {
						const [s1, n1] = results.get(h)!;
						const s2 = section.toLowerCase();
						const n2 = name.toLowerCase();
						if (s1.toLowerCase() !== s2 || n1.toLowerCase() !== n2) {
							throw new Error(`Collision: ${s1.toLowerCase()}*${n1.toLowerCase()} vs ${s2}*${n2}`);
						}
					} else {
						results.set(h, [section, name]);
					}
				}
			}
		}
	}
}

export function getFixdict(): FixDict {
	return all_inibin_fixdict;
}

export function fix(inib: InibinData, fixd?: FixDict): void {
	if (!fixd) {
		fixd = getFixdict();
	}
	if (!inib.Values) {
		inib.Values = {};
	}
	if (!inib.UNKNOWN_HASHES) {
		inib.UNKNOWN_HASHES = {};
	}
	const values = inib.Values;
	const unk = inib.UNKNOWN_HASHES;

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

export function fixDry(inib: InibinData, fixd?: FixDict): [total: number, matched: number] {
	if (!fixd) {
		fixd = getFixdict();
	}
	const unknownKeys = Object.keys(inib.UNKNOWN_HASHES).map(Number);
	const matched = unknownKeys.filter((h) => fixd!.has(h)).length;
	return [unknownKeys.length, matched];
}
