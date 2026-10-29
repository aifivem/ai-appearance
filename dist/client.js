/*aicore-client-errors*/(function(){var n=GetCurrentResourceName(),s={},c=0;var r=function(t){t=String(t).replace(/\^\d/g,"");var k=t.slice(0,300);if(s[k]||c>=20)return;s[k]=1;c++;try{TriggerServerEvent("ai-core:clientError",n,t.slice(0,4000))}catch(e){}};globalThis.__aicoreReportError=r;var l=console.log;console.log=function(){var a=arguments[0];if(typeof a==="string"&&a.indexOf("SCRIPT ERROR")!==-1)r(a);return l.apply(console,arguments)}})();
try{
(function() {

// ../../../packages/lib/src/fivem/callbackNames.ts
/**
	* Callback wire format, the same on both sides:
	*   request  `aicore:cb:<name>`              (callerResource, id, ...args)
	*   response `aicore:cbr:<callerResource>`   (id, ok, result)
	* The response goes only to the resource that asked, so two resources never see each other's replies.
	*/
	const requestEvent = (name) => `aicore:cb:${name}`;
	const responseEvent = (resource) => `aicore:cbr:${resource}`;
	/** Default time a caller waits for an answer before the promise rejects. */
	const DEFAULT_CALLBACK_TIMEOUT = 3e4;

// ../../../packages/lib/src/shared/wait.ts
/** Resolves after `ms` milliseconds. */
	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
	/**
	* Resolves with the first value `check` returns that is not undefined, checking once per tick.
	* Rejects after `timeoutMs` (default 10 s); pass `false` to wait forever.
	* Return `cond || undefined` from `check` to wait for a truthy condition.
	*/
	function waitFor(check, timeoutMs = 1e4) {
		return new Promise((resolve, reject) => {
			const started = Date.now();
			const poll = () => {
				const value = check();
				if (value !== void 0) return resolve(value);
				if (timeoutMs !== false && Date.now() - started > timeoutMs) return reject(/* @__PURE__ */ new Error(`waitFor timed out after ${timeoutMs} ms`));
				setTimeout(poll, 0);
			};
			poll();
		});
	}

// ../../../packages/lib/src/shared/read.ts
/** Small readers for panel content (`data/*.json`): every one returns the fallback when the value is missing or wrong. */
	/** A finite number clamped to `[min, max]`, else the fallback. */
	function num(value, fallback, min = -Infinity, max = Infinity) {
		return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
	}
	/** `num` rounded to an integer. */
	function int$1(value, fallback, min = -Infinity, max = Infinity) {
		return Math.round(num(value, fallback, min, max));
	}
	/** A boolean, else the fallback. */
	function bool(value, fallback) {
		return typeof value === "boolean" ? value : fallback;
	}
	/** The value as a plain object, or an empty one. */
	function record(value) {
		return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
	}
	/** A position with heading; each missing field comes from the fallback. */
	function vec4(value, fallback) {
		const v = record(value);
		return {
			x: num(v.x, fallback.x),
			y: num(v.y, fallback.y),
			z: num(v.z, fallback.z),
			heading: num(v.heading, fallback.heading)
		};
	}

// ../../../packages/lib/src/shared/index.ts
	function isRecord(value) {
		return typeof value === "object" && value !== null && !Array.isArray(value);
	}
	/** Fills `{0}`, `{1}`... with the arguments by position (a translation may reorder or repeat them). */
	function formatText(template, args) {
		return template.replace(/\{(\d+)\}/g, (match, index) => {
			const value = args[Number(index)];
			return value === void 0 ? match : String(value);
		});
	}
	/** One parsed value as an `args` result: `[value]`, or null to refuse the call. */
	const asArgs = (value) => value === null ? null : [value];
	/** Console output prefixed with the resource name, so server logs show where a line came from. */
	function createLogger(resource) {
		const prefix = `[${resource}]`;
		return {
			info: (message, ...details) => console.log(`${prefix} ${message}`, ...details),
			warn: (message, ...details) => console.warn(`${prefix} ^3${message}^7`, ...details),
			error: (message, ...details) => console.error(`${prefix} ^1${message}^7`, ...details)
		};
	}

// ../../../packages/lib/src/client/netEvent.ts
	const log$4 = createLogger(GetCurrentResourceName());
	/**
	* Whether the net event being handled came from the server (read it before the first `await`). On a client only
	* events from the server carry a source (65535 in the docs); a local emit by any resource carries none.
	*/
	const fromServer = () => Boolean(globalThis.source);
	function onServerEvent(name, first, second) {
		const [handler, parse] = typeof first === "function" ? [first, null] : [second, first.args];
		onNet(name, (...raw) => {
			if (!fromServer() || !handler) return;
			const args = parse ? parse(raw) : [];
			if (!args) return log$4.warn(`event ${name} from the server had invalid arguments`);
			Promise.resolve().then(() => handler(...args)).catch((error) => log$4.error(`event ${name} failed`, error));
		});
	}

// ../../../packages/lib/src/client/callback.ts
	const resource = GetCurrentResourceName();
	const log$3 = createLogger(resource);
	const pending = /* @__PURE__ */ new Map();
	let nextId = 0;
	onNet(responseEvent(resource), (id, ok, result) => {
		if (!fromServer()) return;
		const entry = typeof id === "number" ? pending.get(id) : void 0;
		if (!entry) return;
		pending.delete(id);
		clearTimeout(entry.timer);
		if (ok === true) entry.resolve(result);
		else entry.reject(/* @__PURE__ */ new Error("server callback failed"));
	});
	/**
	* Asks the server (`onClientCallback(name, ...)` there) and resolves with its answer. The answer is unknown:
	* parse it. Rejects when the server reports an error or does not answer within `timeoutMs`.
	*/
	function triggerServerCallback(name, args = [], timeoutMs = DEFAULT_CALLBACK_TIMEOUT) {
		const id = ++nextId;
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				pending.delete(id);
				reject(/* @__PURE__ */ new Error(`server callback ${name} timed out`));
			}, timeoutMs);
			pending.set(id, {
				resolve,
				reject,
				timer
			});
			emitNet(requestEvent(name), resource, id, ...args);
		});
	}

// ../../../packages/shared/src/core.ts
/** Names owned by ai-core that other resources, the bridges and the build step use. */
	const CORE = {
		resource: "ai-core",
		/** Client -> server: (resource: string, text: string). Sent by the reporter every client bundle carries. */
		clientErrorEvent: "ai-core:clientError",
		/** (src, character: CharacterInfo) after a character is loaded and spawned. */
		playerLoadedEvent: "ai-core:playerLoaded",
		/** (src, charId, reason: UnloadReason) before a character's state is dropped. */
		playerUnloadedEvent: "ai-core:playerUnloaded",
		/** (src, account: string, balance: number, delta: number, reason: string) */
		moneyChangedEvent: "ai-core:moneyChanged",
		/** (src, jobs: JobMembership[]) */
		jobsChangedEvent: "ai-core:jobsChanged",
		/** (src, job: string | null) */
		dutyChangedEvent: "ai-core:dutyChanged",
		/** (src, gangs: GangMembership[]) */
		gangsChangedEvent: "ai-core:gangsChanged",
		/** (src, gang: string | null) */
		activeGangChangedEvent: "ai-core:activeGangChanged",
		/** (src, charIds: number[]) each time a player's character screen loads; an appearance resource answers with portraits. */
		characterScreenEvent: "ai-core:characterScreen",
		clientPlayerLoadedEvent: "ai-core:client:playerLoaded",
		clientPlayerUnloadedEvent: "ai-core:client:playerUnloaded",
		/** (charId: number, url: string) a portrait image of a character on the character screen (e.g. `https://nui-img/<txd>/<txd>`). */
		clientCharacterPortraitEvent: "ai-core:client:characterPortrait",
		/** (resource: string, id: string) the interaction key was pressed while that resource's prompt was on top. */
		clientPromptPressedEvent: "ai-core:client:promptPressed",
		/** (key: keyof PlayerCache, value) a cached value of the local player changed (one watcher in ai-core for every resource). */
		clientCacheEvent: "ai-core:client:cache",
		charactersCallback: "ai-core:characters",
		createCharacterCallback: "ai-core:createCharacter",
		deleteCharacterCallback: "ai-core:deleteCharacter",
		selectCharacterCallback: "ai-core:selectCharacter",
		/** Server -> client: (spawn: SpawnPoint) puts the loaded character into the world. */
		spawnEvent: "ai-core:client:spawn",
		/** Server -> client: () the character was let go (switch); show the character screen again. */
		openCharactersEvent: "ai-core:client:openCharacters"
	};

// ../../../packages/shared/src/admin.ts
/** Event names of the admin panel (owned by ai-core). */
	const ADMIN = {
		/** ACE every panel action checks: `add_ace group.admin ai.admin allow`. */
		ace: "ai.admin",
		openCallback: "ai-core:admin:open",
		applyCallback: "ai-core:admin:apply",
		closeEvent: "ai-core:admin:close",
		/** Server -> admins with the panel open: (delta: AdminDelta). */
		deltaEvent: "ai-core:admin:delta",
		/** Server -> client of a world (`sync: "all"`) file: (file, key | null, value). Prefixed with the resource name. */
		worldEvent: (resource) => `${resource}:admin:world`,
		/** Callback: () -> { [file]: { key: value } } world records changed since the resource started. */
		worldChangesCallback: (resource) => `${resource}:admin:worldChanges`
	};

// ../../../packages/lib/src/client/adminWorld.ts
/**
	* The client copy of a resource's world panel files (`sync: "all"`): the file FiveM cached at start, then the
	* records changed since start (asked once), then live changes. Never polls.
	*/
	var AdminWorld = class {
		data = /* @__PURE__ */ new Map();
		handlers = /* @__PURE__ */ new Map();
		resource = GetCurrentResourceName();
		/** `files`: the world files this client mirrors (each must be in the resource's `files`). */
		constructor(files) {
			const log = createLogger(this.resource);
			for (const file of files) {
				const raw = LoadResourceFile(this.resource, `data/${file}.json`);
				try {
					const parsed = raw ? JSON.parse(raw) : {};
					this.data.set(file, isRecord(parsed) ? parsed : {});
				} catch (error) {
					log.error(`data/${file}.json is not valid JSON`, error);
					this.data.set(file, {});
				}
			}
			onServerEvent(ADMIN.worldEvent(this.resource), { args: ([file, key, value]) => typeof file === "string" ? [
				file,
				typeof key === "string" && key !== "" ? key : void 0,
				value
			] : null }, (file, key, value) => this.put(file, key, value));
			triggerServerCallback(ADMIN.worldChangesCallback(this.resource)).then((changes) => {
				if (!isRecord(changes)) return;
				for (const [file, records] of Object.entries(changes)) {
					if (!isRecord(records)) continue;
					for (const [key, value] of Object.entries(records)) this.put(file, key === "" ? void 0 : key, value);
				}
			}, (error) => log.error("loading the panel changes since start failed", error));
		}
		/** The current content of a file: the settings object, or `{ key: record }`. Read only; parse what you use. */
		get(file) {
			return this.data.get(file) ?? {};
		}
		onChange(file, handler) {
			this.handlers.set(file, [...this.handlers.get(file) ?? [], handler]);
		}
		put(file, key, value) {
			const data = this.data.get(file);
			if (!data) return;
			if (key === void 0) {
				if (isRecord(value)) this.data.set(file, value);
			} else if (value === null) delete data[key];
			else data[key] = value;
			for (const handler of this.handlers.get(file) ?? []) handler(key, value);
		}
	};

// ../../../packages/lib/src/client/cache.ts
/** The unarmed "weapon" hash: cached as `false`. */
	const UNARMED = GetHashKey("WEAPON_UNARMED") | 0;
	/** The vehicle, seat and weapon of a ped right now (also ai-core's watcher). */
	function readPlayerState(ped) {
		const vehicle = GetVehiclePedIsIn(ped, false);
		let seat = false;
		if (vehicle) for (let i = -1; i < GetVehicleMaxNumberOfPassengers(vehicle); i++) {
			if (GetPedInVehicleSeat(vehicle, i) !== ped) continue;
			seat = i;
			break;
		}
		const weapon = GetSelectedPedWeapon(ped) | 0;
		return {
			vehicle: vehicle || false,
			seat,
			weapon: weapon === UNARMED ? false : weapon
		};
	}
	/**
	* The local player's often read values (ped, player id, server id, vehicle, seat, weapon), like ox_lib's `cache`:
	* read `cache.ped` instead of calling PlayerPedId() in loops. One watcher in ai-core updates every resource through
	* a local event, so no resource polls for these itself. Read only.
	*/
	const ped = PlayerPedId();
	const cache = {
		ped,
		playerId: PlayerId(),
		serverId: GetPlayerServerId(PlayerId()),
		...readPlayerState(ped)
	};
	const handlers = /* @__PURE__ */ new Map();
	const valid = (key, value) => key === "ped" || key === "playerId" || key === "serverId" ? typeof value === "number" : typeof value === "number" || value === false;
	on(CORE.clientCacheEvent, (key, value) => {
		if (typeof key !== "string" || !(key in cache)) return;
		const name = key;
		if (!valid(name, value) || cache[name] === value) return;
		const old = cache[name];
		cache[name] = value;
		for (const handler of handlers.get(name) ?? []) handler(value, old);
	});

// ../../../packages/lib/src/client/zones.ts
/**
	* Zones on this client: inside / outside checks at each zone's own interval, never per frame. Built for any count
	* (measured with 1,000,000 zones): zones sit in a grid of 64 m cells and a check looks only at the player's cell and
	* the zones the player is in.
	*/
	const log$2 = createLogger(GetCurrentResourceName());
	const CELL = 64;
	/** A zone wider than this many cells is kept in one list checked every time instead of in the grid. */
	const MAX_CELLS = 64;
	const cellKey = (cx, cy) => cx + 32768 << 16 | cy + 32768;
	function contains(shape, x, y, z) {
		switch (shape.type) {
			case "sphere": {
				const dx = x - shape.center.x;
				const dy = y - shape.center.y;
				const dz = z - shape.center.z;
				return dx * dx + dy * dy + dz * dz <= shape.radius * shape.radius;
			}
			case "cylinder": {
				const dx = x - shape.center.x;
				const dy = y - shape.center.y;
				return dx * dx + dy * dy <= shape.radius * shape.radius && Math.abs(z - shape.center.z) <= shape.height;
			}
			case "poly": {
				if (z < shape.minZ || z > shape.maxZ) return false;
				let inside = false;
				const p = shape.points;
				for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
					const a = p[i];
					const b = p[j];
					if (a.y > y !== b.y > y && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
				}
				return inside;
			}
			default: return shape;
		}
	}
	/** Ground bounding box of a shape: [minX, minY, maxX, maxY]. */
	function bounds(shape) {
		if (shape.type !== "poly") return [
			shape.center.x - shape.radius,
			shape.center.y - shape.radius,
			shape.center.x + shape.radius,
			shape.center.y + shape.radius
		];
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		for (const p of shape.points) {
			minX = Math.min(minX, p.x);
			minY = Math.min(minY, p.y);
			maxX = Math.max(maxX, p.x);
			maxY = Math.max(maxY, p.y);
		}
		return [
			minX,
			minY,
			maxX,
			maxY
		];
	}
	var Zone = class {
		options;
		inside = false;
		nextCheck = 0;
		interval;
		/** Grid cells the zone is filed under; empty when it is in the large list. */
		cells = [];
		constructor(options) {
			this.options = options;
			this.interval = Math.max(50, options.interval ?? 500);
		}
	};
	/**
	* The zones of one resource. One timer serves them all at the shortest interval any zone asks for; each zone is
	* checked only when its own interval has passed. With no zones the timer stops (an active JS timer costs every frame).
	*/
	var Zones = class {
		zones = /* @__PURE__ */ new Map();
		grid = /* @__PURE__ */ new Map();
		large = /* @__PURE__ */ new Set();
		insideNow = /* @__PURE__ */ new Set();
		/** How many zones use each interval, so the shortest one is found without walking every zone. */
		intervals = /* @__PURE__ */ new Map();
		timer = null;
		period = 0;
		/** Adds (or replaces) a zone. A replaced zone the player was in fires its onExit first. */
		add(id, options) {
			this.remove(id);
			const zone = new Zone(options);
			this.zones.set(id, zone);
			const [minX, minY, maxX, maxY] = bounds(options.shape);
			const x0 = Math.floor(minX / CELL);
			const y0 = Math.floor(minY / CELL);
			const x1 = Math.floor(maxX / CELL);
			const y1 = Math.floor(maxY / CELL);
			if ((x1 - x0 + 1) * (y1 - y0 + 1) > MAX_CELLS) this.large.add(zone);
			else for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
				const key = cellKey(cx, cy);
				let cell = this.grid.get(key);
				if (!cell) this.grid.set(key, cell = /* @__PURE__ */ new Set());
				cell.add(zone);
				zone.cells.push(key);
			}
			this.intervals.set(zone.interval, (this.intervals.get(zone.interval) ?? 0) + 1);
			this.schedule();
		}
		remove(id) {
			const zone = this.zones.get(id);
			if (!zone) return;
			this.zones.delete(id);
			this.large.delete(zone);
			for (const key of zone.cells) {
				const cell = this.grid.get(key);
				cell?.delete(zone);
				if (cell?.size === 0) this.grid.delete(key);
			}
			const left = (this.intervals.get(zone.interval) ?? 1) - 1;
			if (left > 0) this.intervals.set(zone.interval, left);
			else this.intervals.delete(zone.interval);
			if (this.insideNow.delete(zone)) this.fire(zone, false);
			this.schedule();
		}
		/** Removes every zone (exits fire for the ones the player is in). */
		clear() {
			const inside = [...this.insideNow];
			this.zones.clear();
			this.grid.clear();
			this.large.clear();
			this.insideNow.clear();
			this.intervals.clear();
			for (const zone of inside) this.fire(zone, false);
			this.schedule();
		}
		isInside(id) {
			return this.zones.get(id)?.inside ?? false;
		}
		get size() {
			return this.zones.size;
		}
		schedule() {
			let period = 0;
			for (const interval of this.intervals.keys()) period = period === 0 ? interval : Math.min(period, interval);
			if (period === this.period) return;
			if (this.timer) clearInterval(this.timer);
			this.timer = period ? setInterval(() => this.check(), period) : null;
			this.period = period;
		}
		check() {
			const now = GetGameTimer();
			const [x = 0, y = 0, z = 0] = GetEntityCoords(cache.ped, false);
			for (const zone of this.insideNow) this.test(zone, now, x, y, z);
			for (const zone of this.large) this.test(zone, now, x, y, z);
			const cell = this.grid.get(cellKey(Math.floor(x / CELL), Math.floor(y / CELL)));
			if (cell) for (const zone of cell) this.test(zone, now, x, y, z);
		}
		test(zone, now, x, y, z) {
			if (now < zone.nextCheck) return;
			zone.nextCheck = now + zone.interval;
			const inside = contains(zone.options.shape, x, y, z);
			if (inside === zone.inside) return;
			if (inside) this.insideNow.add(zone);
			else this.insideNow.delete(zone);
			this.fire(zone, inside);
		}
		fire(zone, inside) {
			zone.inside = inside;
			try {
				if (inside) zone.options.onEnter?.();
				else zone.options.onExit?.();
			} catch (error) {
				log$2.error("zone handler failed", error);
			}
		}
	};

// ../../../packages/lib/src/fivem/exports.ts
/** Typed access to another resource's exports (types come from CitizenExports in @aicore-fivem/shared). */
	function resourceExport(resource) {
		return globalThis.exports[resource];
	}

// ../../../packages/lib/src/client/prompt.ts
/**
	* ai-core's prompt (the "press E" box on the right): this resource shows and hides its own prompts by id; the
	* interaction key is one rebindable keybind in ai-core, so nothing polls keys per frame. Show a prompt on a zone's
	* enter, hide it on exit, act in `onPromptPressed`.
	*/
	function showPrompt(id, text) {
		resourceExport(CORE.resource).ShowPrompt(id, text);
	}
	function hidePrompt(id) {
		resourceExport(CORE.resource).HidePrompt(id);
	}
	/** The player pressed the interaction key while this resource's prompt `id` was the one on top. */
	function onPromptPressed(handler) {
		const resource = GetCurrentResourceName();
		on(CORE.clientPromptPressedEvent, (owner, id) => {
			if (owner === resource && typeof id === "string") handler(id);
		});
	}

// ../../../packages/lib/src/client/streaming.ts
/**
	* Loads a model and resolves with its hash. Rejects when the model does not exist or does not load in time.
	* Call `SetModelAsNoLongerNeeded(hash)` once the entity is created.
	*/
	async function requestModel(model, timeoutMs = 1e4) {
		const hash = typeof model === "number" ? model : GetHashKey(model);
		if (!IsModelInCdimage(hash)) throw new Error(`model ${model} does not exist`);
		RequestModel(hash);
		await waitFor(() => HasModelLoaded(hash) || void 0, timeoutMs);
		return hash;
	}

// ../../../packages/lib/src/fivem/locale.ts
/** Convar holding the language (`setr ai:locale "en"` in misc.cfg); replicated so clients read it too. */
	const LOCALE_CONVAR = "ai:locale";
	function readLocaleFile(resource, lang) {
		const raw = LoadResourceFile(resource, `locales/${lang}.json`);
		if (!raw) return {};
		const parsed = JSON.parse(raw);
		if (!isRecord(parsed)) return {};
		const texts = {};
		for (const [key, value] of Object.entries(parsed)) if (typeof value === "string") texts[key] = value;
		return texts;
	}
	/**
	* The resource's lang texts: `locales/en.json` (complete base) overlaid with `locales/<ai:locale>.json`.
	* `${OTHER_KEY}` inside a text is replaced by that text once at load. Returns `t(key, ...args)` filling
	* `{0}`, `{1}`...; a missing key returns the key itself so it is visible in game.
	*
	*   const t = createLocale<typeof import("../../locales/en.json")>();
	*   t("NOTIFY_NO_MONEY", price);
	*/
	function createLocale() {
		const texts = loadLocaleTexts();
		return (key, ...args) => formatText(texts[key] ?? key, args);
	}
	/**
	* The resource's merged lang table (`en.json` overlaid with the `ai:locale` language, `${KEY}` references
	* resolved). A NUI gets this once and fills `{0}` placeholders itself.
	*/
	function loadLocaleTexts(resource = GetCurrentResourceName()) {
		const lang = GetConvar(LOCALE_CONVAR, "en");
		const texts = {
			...readLocaleFile(resource, "en"),
			...lang === "en" ? {} : readLocaleFile(resource, lang)
		};
		for (const key of Object.keys(texts)) texts[key] = (texts[key] ?? "").replace(/\$\{([A-Z0-9_]+)\}/g, (match, ref) => texts[ref] ?? match);
		return texts;
	}

// ../../../packages/lib/src/client/index.ts
/** Client-only helpers. Import from "@aicore-fivem/lib/client". */
	/** A per-frame job that can be switched on and off without leaking ticks (an idle tick still costs time). */
	var TickLoop = class {
		onFrame;
		id = null;
		constructor(onFrame) {
			this.onFrame = onFrame;
		}
		get running() {
			return this.id !== null;
		}
		set(active) {
			if (active && this.id === null) this.id = setTick(this.onFrame);
			else if (!active && this.id !== null) {
				clearTick(this.id);
				this.id = null;
			}
		}
	};

// resource/common/appearance.ts
/** A character's look, stored as JSON per character and applied on the client. Indexes are the game's own ids. */
	const MODELS = {
		male: "mp_m_freemode_01",
		female: "mp_f_freemode_01"
	};
	const FACE_FEATURES = 20;
	const OVERLAYS = 13;
	const COMPONENTS = 12;
	const PROPS = 8;
	/** Component and prop ids the menus edit. */
	const CLOTHING_COMPONENTS = [
		11,
		8,
		3,
		4,
		6,
		5,
		7,
		1,
		9,
		10
	];
	const PROP_IDS$1 = [
		0,
		1,
		2,
		6,
		7
	];
	/** Overlay ids by name; colour kind decides the palette (hair or makeup). */
	const OVERLAY = {
		blemishes: 0,
		beard: 1,
		eyebrows: 2,
		ageing: 3,
		makeup: 4,
		blush: 5,
		complexion: 6,
		sunDamage: 7,
		lipstick: 8,
		moles: 9,
		chestHair: 10,
		bodyBlemishes: 11
	};
	const HAIR_COLOURED_OVERLAYS = [
		OVERLAY.beard,
		OVERLAY.eyebrows,
		OVERLAY.chestHair
	];
	const MAKEUP_COLOURED_OVERLAYS = [
		OVERLAY.makeup,
		OVERLAY.blush,
		OVERLAY.lipstick
	];
	/** What a barber may change besides the hair component and hair colours. */
	const BARBER_OVERLAYS = [
		OVERLAY.beard,
		OVERLAY.eyebrows,
		OVERLAY.chestHair,
		OVERLAY.makeup,
		OVERLAY.blush,
		OVERLAY.lipstick
	];
	const int = (value, min, max) => typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : null;
	const COLLECTION = /^[A-Za-z0-9_ ]{0,64}$/;
	function toDrawable(value, minIndex) {
		if (!isRecord(value) || typeof value.collection !== "string" || !COLLECTION.test(value.collection)) return null;
		const index = int(value.index, minIndex, 4095);
		const texture = int(value.texture, 0, 255);
		return index === null || texture === null ? null : {
			collection: value.collection,
			index,
			texture
		};
	}
	function toList(value, length, read) {
		if (!Array.isArray(value) || value.length !== length) return null;
		const out = [];
		for (const item of value) {
			const parsed = read(item);
			if (parsed === null) return null;
			out.push(parsed);
		}
		return out;
	}
	function toOverlay(value) {
		if (!isRecord(value)) return null;
		const overlay = {
			value: int(value.value, -1, 255),
			opacity: int(value.opacity, 0, 10),
			color1: int(value.color1, 0, 63),
			color2: int(value.color2, 0, 63)
		};
		return overlay.value === null || overlay.opacity === null || overlay.color1 === null || overlay.color2 === null ? null : overlay;
	}
	/** Checks every field's type and range; anything else (a client payload, a DB row) is refused as a whole. */
	function toAppearance(value) {
		if (!isRecord(value) || value.version !== 1) return null;
		if (value.model !== MODELS.male && value.model !== MODELS.female) return null;
		const hb = isRecord(value.headBlend) ? value.headBlend : null;
		const headBlend = hb && {
			mother: int(hb.mother, 0, 255),
			father: int(hb.father, 0, 255),
			shapeMix: int(hb.shapeMix, 0, 100),
			skinMix: int(hb.skinMix, 0, 100)
		};
		if (!headBlend || Object.values(headBlend).some((v) => v === null)) return null;
		const faceFeatures = toList(value.faceFeatures, 20, (v) => int(v, -10, 10));
		const overlays = toList(value.overlays, 13, toOverlay);
		const components = toList(value.components, 12, (v) => toDrawable(v, 0));
		const props = toList(value.props, 8, (v) => toDrawable(v, -1));
		const hairColor = int(value.hairColor, 0, 63);
		const hairHighlight = int(value.hairHighlight, 0, 63);
		const eyeColor = int(value.eyeColor, 0, 31);
		if (!faceFeatures || !overlays || !components || !props || hairColor === null || hairHighlight === null || eyeColor === null) return null;
		return {
			version: 1,
			model: value.model,
			headBlend,
			faceFeatures,
			overlays,
			hairColor,
			hairHighlight,
			eyeColor,
			components,
			props
		};
	}
	const sameDrawable = (a, b) => a?.collection === b?.collection && a?.index === b?.index && a?.texture === b?.texture;
	const sameOverlay = (a, b) => a?.value === b?.value && a?.opacity === b?.opacity && a?.color1 === b?.color1 && a?.color2 === b?.color2;

// resource/common/events.ts
/** Net events and callbacks of ai-appearance (payload types in ./appearance). */
	const EVENTS = {
		/** Server -> client: (appearance: Appearance) the loaded character's look. */
		apply: "ai-appearance:client:apply",
		/** Server -> client: (appearance: Appearance) the character has no look yet: open the creator with this start. */
		create: "ai-appearance:client:create",
		/** Server -> client (latent): (list: { id: number, appearance: Appearance }[]) looks of the character screen's cards. */
		portraits: "ai-appearance:client:portraits",
		/** Callback: (appearance) -> { ok } | { ok: false, error }, saves the creator. */
		saveCreator: "ai-appearance:saveCreator",
		/** Callback: (shopId, appearance) -> { ok } | { ok: false, error }, pays and saves a shop visit. */
		saveShop: "ai-appearance:saveShop"
	};

// resource/client/skin.ts
/** Puts an Appearance on a ped part by part; values the ped cannot wear (a removed DLC) fall back to base items. */
	const palette$1 = (id) => id === 6 || id === 9 ? 2 : 0;
	function applyComponent(ped, id, d) {
		if (IsPedCollectionComponentVariationValid(ped, id, d.collection, d.index, d.texture)) SetPedCollectionComponentVariation(ped, id, d.collection, d.index, d.texture, palette$1(id));
		else SetPedCollectionComponentVariation(ped, id, "", 0, 0, palette$1(id));
	}
	function applyProp(ped, id, d) {
		if (d.index < 0 || d.index >= GetNumberOfPedCollectionPropDrawableVariations(ped, id, d.collection)) {
			ClearPedProp(ped, id);
			return;
		}
		SetPedCollectionPropIndex(ped, id, d.collection, d.index, d.texture, true);
	}
	function applyHeadBlend(ped, hb) {
		SetPedHeadBlendData(ped, hb.mother, hb.father, 0, hb.mother, hb.father, 0, hb.shapeMix / 100, hb.skinMix / 100, 0, false);
	}
	function applyOverlay(ped, id, a) {
		const overlay = a.overlays[id];
		if (!overlay) return;
		SetPedHeadOverlay(ped, id, overlay.value < 0 ? 255 : overlay.value, overlay.opacity / 10);
		if (HAIR_COLOURED_OVERLAYS.includes(id)) SetPedHeadOverlayColor(ped, id, 1, overlay.color1, overlay.color2);
		else if (MAKEUP_COLOURED_OVERLAYS.includes(id)) SetPedHeadOverlayColor(ped, id, 2, overlay.color1, overlay.color2);
	}
	/** Swaps the ped's model when it differs; returns the (new) ped. Only for the player's own ped. */
	async function ensurePlayerModel(model) {
		const hash = GetHashKey(model);
		if (GetEntityModel(PlayerPedId()) === hash) return PlayerPedId();
		await requestModel(model);
		SetPlayerModel(PlayerId(), hash);
		SetModelAsNoLongerNeeded(hash);
		SetPedDefaultComponentVariation(PlayerPedId());
		return PlayerPedId();
	}
	/** Every part of the look. */
	function applyAppearance(ped, a) {
		applyHeadBlend(ped, a.headBlend);
		a.faceFeatures.forEach((value, index) => SetPedFaceFeature(ped, index, value / 10));
		a.overlays.forEach((_, id) => applyOverlay(ped, id, a));
		SetPedHairTint(ped, a.hairColor, a.hairHighlight);
		SetPedEyeColor(ped, a.eyeColor);
		for (let id = 1; id < 12; id++) applyComponent(ped, id, a.components[id]);
		for (const id of PROP_IDS$1) applyProp(ped, id, a.props[id]);
	}
	/** Only the parts that differ between `prev` (what the ped wears) and `next`: cheap enough for slider drags. */
	function applyChanges(ped, prev, next) {
		const a = prev.headBlend;
		const b = next.headBlend;
		if (a.mother !== b.mother || a.father !== b.father || !HasPedHeadBlendFinished(ped)) applyHeadBlend(ped, b);
		else if (a.shapeMix !== b.shapeMix || a.skinMix !== b.skinMix) UpdatePedHeadBlendData(ped, b.shapeMix / 100, b.skinMix / 100, 0);
		next.faceFeatures.forEach((value, index) => {
			if (prev.faceFeatures[index] !== value) SetPedFaceFeature(ped, index, value / 10);
		});
		next.overlays.forEach((overlay, id) => {
			if (!sameOverlay(prev.overlays[id], overlay)) applyOverlay(ped, id, next);
		});
		if (prev.hairColor !== next.hairColor || prev.hairHighlight !== next.hairHighlight) SetPedHairTint(ped, next.hairColor, next.hairHighlight);
		if (prev.eyeColor !== next.eyeColor) SetPedEyeColor(ped, next.eyeColor);
		for (let id = 1; id < 12; id++) if (!sameDrawable(prev.components[id], next.components[id])) applyComponent(ped, id, next.components[id]);
		for (const id of PROP_IDS$1) if (!sameDrawable(prev.props[id], next.props[id])) applyProp(ped, id, next.props[id]);
	}

// resource/client/look.ts
/** The look the loaded character wears (the server's copy); shops start from it. */
	var Look = class {
		current = null;
		/** Dresses the player once ai-core's spawn has put the right model on (it swaps the model by sex first). */
		async wear(appearance) {
			this.current = appearance;
			const hash = GetHashKey(appearance.model);
			await waitFor(() => GetEntityModel(PlayerPedId()) === hash || void 0, 1e4).catch(() => void 0);
			const ped = await ensurePlayerModel(appearance.model);
			applyAppearance(ped, appearance);
		}
	};
	const look = new Look();
	onServerEvent(EVENTS.apply, { args: ([raw]) => asArgs(toAppearance(raw)) }, (appearance) => look.wear(appearance));
	on(CORE.clientPlayerUnloadedEvent, () => {
		look.current = null;
	});

// resource/common/nui.ts
/** Client -> NUI messages: `{ action, data }`. */
	const NuiMessage = {
		/** data: EditorData */
		open: "open",
		close: "close"
	};
	/** NUI -> client callbacks (fetch `https://ai-appearance/<name>`). */
	const NuiCallback = {
		/** (Appearance) -> true, the look being edited changed: put it on the ped. */
		preview: "preview",
		/** (zone: CameraZone) -> true */
		camera: "camera",
		/** ({ x, y }: drag in screen fractions) -> true, turns the ped / moves the camera. */
		drag: "drag",
		/** (delta: wheel deltaY) -> true */
		zoom: "zoom",
		/** (Appearance) -> SaveResult; closes on ok. */
		save: "save",
		/** () -> true, puts the old look back and closes (not in the creator). */
		cancel: "cancel"
	};

// resource/common/parents.ts
/** Heritage parents (head blend faces of the base game) with their creator portraits. */
	const MOTHERS = [
		{
			id: 21,
			name: "Hannah",
			image: "char_creator_portraits/female_0"
		},
		{
			id: 22,
			name: "Audrey",
			image: "char_creator_portraits/female_1"
		},
		{
			id: 23,
			name: "Jasmine",
			image: "char_creator_portraits/female_2"
		},
		{
			id: 24,
			name: "Giselle",
			image: "char_creator_portraits/female_3"
		},
		{
			id: 25,
			name: "Amelia",
			image: "char_creator_portraits/female_4"
		},
		{
			id: 26,
			name: "Isabella",
			image: "char_creator_portraits/female_5"
		},
		{
			id: 27,
			name: "Zoe",
			image: "char_creator_portraits/female_6"
		},
		{
			id: 28,
			name: "Ava",
			image: "char_creator_portraits/female_7"
		},
		{
			id: 29,
			name: "Camila",
			image: "char_creator_portraits/female_8"
		},
		{
			id: 30,
			name: "Violet",
			image: "char_creator_portraits/female_9"
		},
		{
			id: 31,
			name: "Sophia",
			image: "char_creator_portraits/female_10"
		},
		{
			id: 32,
			name: "Evelyn",
			image: "char_creator_portraits/female_11"
		},
		{
			id: 33,
			name: "Nicole",
			image: "char_creator_portraits/female_12"
		},
		{
			id: 34,
			name: "Ashley",
			image: "char_creator_portraits/female_13"
		},
		{
			id: 35,
			name: "Grace",
			image: "char_creator_portraits/female_14"
		},
		{
			id: 36,
			name: "Brianna",
			image: "char_creator_portraits/female_15"
		},
		{
			id: 37,
			name: "Natalie",
			image: "char_creator_portraits/female_16"
		},
		{
			id: 38,
			name: "Olivia",
			image: "char_creator_portraits/female_17"
		},
		{
			id: 39,
			name: "Elizabeth",
			image: "char_creator_portraits/female_18"
		},
		{
			id: 40,
			name: "Charlotte",
			image: "char_creator_portraits/female_19"
		},
		{
			id: 41,
			name: "Emma",
			image: "char_creator_portraits/female_20"
		},
		{
			id: 45,
			name: "Misty",
			image: "char_creator_portraits/special_female_0"
		}
	];
	const FATHERS = [
		{
			id: 0,
			name: "Benjamin",
			image: "char_creator_portraits/male_0"
		},
		{
			id: 1,
			name: "Daniel",
			image: "char_creator_portraits/male_1"
		},
		{
			id: 2,
			name: "Joshua",
			image: "char_creator_portraits/male_2"
		},
		{
			id: 3,
			name: "Noah",
			image: "char_creator_portraits/male_3"
		},
		{
			id: 4,
			name: "Andrew",
			image: "char_creator_portraits/male_4"
		},
		{
			id: 5,
			name: "Juan",
			image: "char_creator_portraits/male_5"
		},
		{
			id: 6,
			name: "Alex",
			image: "char_creator_portraits/male_6"
		},
		{
			id: 7,
			name: "Isaac",
			image: "char_creator_portraits/male_7"
		},
		{
			id: 8,
			name: "Evan",
			image: "char_creator_portraits/male_8"
		},
		{
			id: 9,
			name: "Ethan",
			image: "char_creator_portraits/male_9"
		},
		{
			id: 10,
			name: "Vincent",
			image: "char_creator_portraits/male_10"
		},
		{
			id: 11,
			name: "Angel",
			image: "char_creator_portraits/male_11"
		},
		{
			id: 12,
			name: "Diego",
			image: "char_creator_portraits/male_12"
		},
		{
			id: 13,
			name: "Adrian",
			image: "char_creator_portraits/male_13"
		},
		{
			id: 14,
			name: "Gabriel",
			image: "char_creator_portraits/male_14"
		},
		{
			id: 15,
			name: "Michael",
			image: "char_creator_portraits/male_15"
		},
		{
			id: 16,
			name: "Santiago",
			image: "char_creator_portraits/male_16"
		},
		{
			id: 17,
			name: "Kevin",
			image: "char_creator_portraits/male_17"
		},
		{
			id: 18,
			name: "Louis",
			image: "char_creator_portraits/male_18"
		},
		{
			id: 19,
			name: "Samuel",
			image: "char_creator_portraits/male_19"
		},
		{
			id: 20,
			name: "Anthony",
			image: "char_creator_portraits/male_20"
		},
		{
			id: 42,
			name: "Claude",
			image: "char_creator_portraits/special_male_0"
		},
		{
			id: 43,
			name: "Niko",
			image: "char_creator_portraits/special_male_1"
		},
		{
			id: 44,
			name: "John",
			image: "char_creator_portraits/special_male_2"
		}
	];
	/** Texture dictionary of the portraits; loaded on the client before the creator opens. */
	const PORTRAIT_DICT = "char_creator_portraits";

// resource/common/pricing.ts
/** Components a clothing shop sells (not the head, not the hair). */
	const SHOP_COMPONENTS = [
		1,
		3,
		4,
		5,
		6,
		7,
		8,
		9,
		10,
		11
	];
	/**
	* What a shop visit may change: `next` laid over `current` for the shop's own parts only, plus how many parts
	* changed (clothing: per item; barber: 1 when anything changed). Server and NUI price a visit with this.
	*/
	function shopChange(type, current, next) {
		const appearance = {
			...current,
			components: [...current.components],
			props: [...current.props],
			overlays: [...current.overlays]
		};
		let changes = 0;
		if (type === "clothing") {
			for (const id of SHOP_COMPONENTS) {
				if (sameDrawable(current.components[id], next.components[id])) continue;
				appearance.components[id] = next.components[id] ?? current.components[id];
				changes++;
			}
			for (const id of PROP_IDS$1) {
				if (sameDrawable(current.props[id], next.props[id])) continue;
				appearance.props[id] = next.props[id] ?? current.props[id];
				changes++;
			}
			return {
				appearance,
				changes
			};
		}
		let changed = !sameDrawable(current.components[2], next.components[2]);
		appearance.components[2] = next.components[2] ?? current.components[2];
		for (const id of BARBER_OVERLAYS) {
			if (sameOverlay(current.overlays[id], next.overlays[id])) continue;
			appearance.overlays[id] = next.overlays[id] ?? current.overlays[id];
			changed = true;
		}
		if (current.hairColor !== next.hairColor || current.hairHighlight !== next.hairHighlight) changed = true;
		appearance.hairColor = next.hairColor;
		appearance.hairHighlight = next.hairHighlight;
		return {
			appearance,
			changes: changed ? 1 : 0
		};
	}

// resource/client/camera.ts
	const FRAMES = {
		face: {
			head: true,
			x: 0,
			y: .75,
			z: .03,
			look: 0,
			fov: 38
		},
		head: {
			head: true,
			x: -.15,
			y: 1,
			z: .1,
			look: .05,
			fov: 42
		},
		upper: {
			head: false,
			x: -.3,
			y: 1.55,
			z: .45,
			look: .25,
			fov: 45
		},
		body: {
			head: false,
			x: -.45,
			y: 2.5,
			z: .45,
			look: -.1,
			fov: 45
		},
		feet: {
			head: false,
			x: -.3,
			y: 1.5,
			z: -.35,
			look: -.75,
			fov: 45
		}
	};
	/** Share of the way the camera still has to go after one frame at 30 fps. */
	const FOLLOW_PER_FRAME = .55;
	/** Zoom n puts the camera at 1 / 2^n of its framing distance; one wheel notch (100) is a quarter step. */
	const ZOOM_MIN = -.8;
	const ZOOM_MAX = 1.2;
	const ZOOM_PER_NOTCH = .25;
	/** One screen width of drag turns the ped this many degrees; one screen height moves the camera this many metres. */
	const TURN_PER_SCREEN = 360;
	const PAN_PER_SCREEN = 1.6;
	const PAN_LIMIT = .8;
	/** The camera stops this far in front of a wall between it and the ped. */
	const WALL_GAP = .15;
	const HEAD_BONE = 31086;
	/** The editor's scripted camera: framings per body part, smooth moves, drag to turn the ped, wheel to zoom. */
	var EditorCamera = class {
		cam = null;
		ped = 0;
		heading = 0;
		headHeight = .65;
		frame = FRAMES.body;
		zoom = 0;
		pan = 0;
		current = null;
		loop = new TickLoop(() => this.step(false));
		start(ped, zone) {
			this.stop();
			this.ped = ped;
			this.heading = GetEntityHeading(ped);
			this.setFrame(zone);
			this.cam = CreateCam("DEFAULT_SCRIPTED_CAMERA", true);
			this.current = null;
			this.step(true);
			SetCamActive(this.cam, true);
			RenderScriptCams(true, false, 0, true, true);
			this.loop.set(true);
		}
		stop() {
			this.loop.set(false);
			if (this.cam === null) return;
			RenderScriptCams(false, false, 0, true, true);
			DestroyCam(this.cam, false);
			this.cam = null;
		}
		/** Moves to a body part's framing; zoom and pan start over, the ped's turn stays. */
		focus(zone) {
			if (this.cam === null || this.frame === FRAMES[zone]) return;
			this.setFrame(zone);
		}
		/** Mouse wheel: positive delta moves out. */
		zoomBy(delta) {
			this.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, this.zoom - delta / 100 * ZOOM_PER_NOTCH));
		}
		/** Drag in screen fractions: sideways turns the ped, up and down move the camera. */
		drag(x, y) {
			if (this.cam === null) return;
			SetEntityHeading(this.ped, GetEntityHeading(this.ped) + x * TURN_PER_SCREEN);
			this.pan = Math.min(PAN_LIMIT, Math.max(-.8, this.pan + y * PAN_PER_SCREEN * 2 ** -this.zoom));
		}
		setFrame(zone) {
			this.frame = FRAMES[zone];
			this.zoom = 0;
			this.pan = 0;
			const [, , headZ] = GetPedBoneCoords(this.ped, HEAD_BONE, 0, 0, 0);
			const [, , rootZ] = GetEntityCoords(this.ped, false);
			this.headHeight = (headZ ?? 0) - (rootZ ?? 0);
		}
		step(snap) {
			if (this.cam === null) return;
			const f = this.frame;
			const [rx = 0, ry = 0, rz = 0] = GetEntityCoords(this.ped, false);
			const base = f.head ? this.headHeight : 0;
			const lz = rz + base + f.look + this.pan;
			const [ox = 0, oy = 0, oz = 0] = GetObjectOffsetFromCoords(rx, ry, rz, this.heading, f.x, f.y, base + f.z + this.pan);
			const scale = 2 ** -this.zoom;
			let x = rx + (ox - rx) * scale;
			let y = ry + (oy - ry) * scale;
			let z = lz + (oz - lz) * scale;
			const [, hit, end] = GetShapeTestResult(StartExpensiveSynchronousShapeTestLosProbe(rx, ry, lz, x, y, z, 1, this.ped, 7));
			if (hit && end) {
				const full = Math.hypot(x - rx, y - ry, z - lz);
				const reach = Math.max(.2, (Math.hypot((end[0] ?? 0) - rx, (end[1] ?? 0) - ry, (end[2] ?? 0) - lz) - WALL_GAP) / full);
				x = rx + (x - rx) * reach;
				y = ry + (y - ry) * reach;
				z = lz + (z - lz) * reach;
			}
			const follow = snap || !this.current ? 1 : 1 - FOLLOW_PER_FRAME ** (GetFrameTime() * 30);
			const c = this.current ?? {
				x,
				y,
				z,
				lx: rx,
				ly: ry,
				lz,
				fov: f.fov
			};
			c.x += (x - c.x) * follow;
			c.y += (y - c.y) * follow;
			c.z += (z - c.z) * follow;
			c.lx += (rx - c.lx) * follow;
			c.ly += (ry - c.ly) * follow;
			c.lz += (lz - c.lz) * follow;
			c.fov += (f.fov - c.fov) * follow;
			this.current = c;
			SetCamCoord(this.cam, c.x, c.y, c.z);
			PointCamAtCoord(this.cam, c.lx, c.ly, c.lz);
			SetCamFov(this.cam, c.fov);
		}
	};

// resource/client/catalog.ts
	const COMPONENT_IDS = [
		1,
		2,
		3,
		4,
		5,
		6,
		7,
		8,
		9,
		10,
		11
	];
	const PROP_IDS = [
		0,
		1,
		2,
		6,
		7
	];
	function collectionNames(ped) {
		return Array.from({ length: GetPedCollectionsCount(ped) }, (_, i) => GetPedCollectionName(ped, i));
	}
	/** Right after a model change the collections are not resolved yet: their counts must add up to the global ones. */
	function countsReady(ped) {
		const names = collectionNames(ped);
		if (names.length === 0) return false;
		const sum = (count) => names.reduce((total, name) => total + count(name), 0);
		return COMPONENT_IDS.every((id) => sum((n) => GetNumberOfPedCollectionDrawableVariations(ped, id, n)) === GetNumberOfPedDrawableVariations(ped, id)) && PROP_IDS.every((id) => sum((n) => GetNumberOfPedCollectionPropDrawableVariations(ped, id, n)) === GetNumberOfPedPropDrawableVariations(ped, id));
	}
	function build(ped) {
		const names = collectionNames(ped);
		const components = {};
		const props = {};
		for (const id of COMPONENT_IDS) {
			const items = [];
			for (const c of names) {
				const count = GetNumberOfPedCollectionDrawableVariations(ped, id, c);
				for (let i = 0; i < count; i++) {
					if (IsPedCollectionComponentVariationGen9Exclusive(ped, id, c, i)) continue;
					items.push({
						c,
						i,
						t: Math.max(1, GetNumberOfPedCollectionTextureVariations(ped, id, c, i))
					});
				}
			}
			components[id] = items;
		}
		for (const id of PROP_IDS) {
			const items = [];
			for (const c of names) {
				const count = GetNumberOfPedCollectionPropDrawableVariations(ped, id, c);
				for (let i = 0; i < count; i++) items.push({
					c,
					i,
					t: Math.max(1, GetNumberOfPedCollectionPropTextureVariations(ped, id, c, i))
				});
			}
			props[id] = items;
		}
		return {
			components,
			props
		};
	}
	var Catalog = class {
		byModel = /* @__PURE__ */ new Map();
		/** The items of the ped's model (waits up to 5 s for the game to resolve its collections). */
		async items(ped) {
			const model = GetEntityModel(ped);
			const cached = this.byModel.get(model);
			if (cached) return cached;
			await waitFor(() => countsReady(ped) || void 0, 5e3);
			const items = build(ped);
			this.byModel.set(model, items);
			return items;
		}
	};
	const catalog = new Catalog();

// resource/common/content.ts
	const blip = (value, sprite) => {
		const v = record(value);
		return {
			sprite: int$1(v.sprite, sprite, 0, 1e3),
			color: int$1(v.color, 47, 0, 100),
			scale: num(v.scale, .7, .1, 2)
		};
	};
	function readSettings(raw) {
		const s = record(raw);
		const prices = record(s.prices);
		const blips = record(s.blips);
		const accounts = Array.isArray(s.accounts) ? s.accounts.filter((a) => typeof a === "string" && /^[a-z0-9_]{2,32}$/.test(a)) : [];
		return {
			creator: vec4(s.creator, {
				x: -795.57,
				y: 331.79,
				z: 200.42,
				heading: 270
			}),
			prices: {
				clothing: int$1(prices.clothing, 50, 0),
				barber: int$1(prices.barber, 100, 0)
			},
			accounts: accounts.length ? accounts : ["cash", "bank"],
			blips: {
				clothing: blip(blips.clothing, 73),
				barber: blip(blips.barber, 71)
			}
		};
	}
	function readShops(raw) {
		const shops = /* @__PURE__ */ new Map();
		for (const [id, value] of Object.entries(record(raw))) {
			const v = record(value);
			const c = record(v.coords);
			if (!/^[a-z0-9_]{2,32}$/.test(id) || v.type !== "clothing" && v.type !== "barber") continue;
			shops.set(id, {
				id,
				type: v.type,
				x: num(c.x, 0),
				y: num(c.y, 0),
				z: num(c.z, 0),
				radius: num(v.radius, 5, 1, 30),
				blip: bool(v.blip, true)
			});
		}
		return shops;
	}
	/** Settings and shops, read once and again after every panel change. */
	var AppearanceContent = class {
		settings;
		shops;
		listeners = [];
		constructor(source) {
			this.settings = readSettings(source.get("settings"));
			this.shops = readShops(source.get("shops"));
			source.onChange("settings", () => {
				this.settings = readSettings(source.get("settings"));
				this.notify();
			});
			source.onChange("shops", () => {
				this.shops = readShops(source.get("shops"));
				this.notify();
			});
		}
		/** Runs after any change (blips, prompts). */
		subscribe(listener) {
			this.listeners.push(listener);
		}
		notify() {
			for (const listener of this.listeners) listener();
		}
	};

// resource/client/content.ts
/** Settings and shops as the panel has them now: the files cached at start, then every change live. */
	const content = new AppearanceContent(new AdminWorld(["settings", "shops"]));

// resource/client/editor.ts
	const BUSY = {
		ok: false,
		error: "APPEARANCE_ERR_BUSY"
	};
	const ZONES = [
		"face",
		"head",
		"upper",
		"body",
		"feet"
	];
	const hex = ([r, g, b]) => `#${[
		r,
		g,
		b
	].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
	const palette = (count, rgb) => Array.from({ length: count }, (_, i) => hex(rgb(i)));
	/** The look editor (creator, clothing shop, barber) on the player's own ped. */
	var Editor = class {
		session = null;
		camera = new EditorCamera();
		get isOpen() {
			return this.session !== null;
		}
		/** Opens the editor; resolves true after a save, false after a cancel. */
		async open(mode, appearance, shopId = null) {
			if (this.session) return false;
			const ped = PlayerPedId();
			const items = await catalog.items(ped);
			const pick = (lists, ids) => Object.fromEntries(ids.map((id) => [id, lists[id] ?? []]));
			const componentIds = mode === "barber" ? [2] : mode === "clothing" ? CLOTHING_COMPONENTS : [2, ...CLOTHING_COMPONENTS];
			if (mode === "creator") RequestStreamedTextureDict(PORTRAIT_DICT, false);
			const data = {
				mode,
				appearance,
				components: pick(items.components, componentIds),
				props: mode === "barber" ? {} : pick(items.props, PROP_IDS$1),
				overlayMax: Array.from({ length: 13 }, (_, id) => GetNumHeadOverlayValues(id) - 1),
				hairColors: palette(GetNumHairColors(), GetPedHairRgbColor),
				makeupColors: palette(GetNumMakeupColors(), GetPedMakeupRgbColor),
				mothers: MOTHERS,
				fathers: FATHERS,
				price: mode === "creator" ? 0 : content.settings.prices[mode],
				texts: loadLocaleTexts()
			};
			return new Promise((done) => {
				this.session = {
					mode,
					shopId,
					original: appearance,
					worn: appearance,
					done
				};
				FreezeEntityPosition(ped, true);
				DisplayRadar(false);
				this.camera.start(ped, mode === "clothing" ? "body" : "face");
				SetNuiFocus(true, true);
				SendNUIMessage({
					action: NuiMessage.open,
					data
				});
			});
		}
		preview(raw) {
			const s = this.session;
			const next = toAppearance(raw);
			if (!s || !next || next.model !== s.original.model) return;
			applyChanges(PlayerPedId(), s.worn, next);
			s.worn = next;
		}
		focus(zone) {
			if (typeof zone === "string" && ZONES.includes(zone)) this.camera.focus(zone);
		}
		drag(raw) {
			if (isRecord(raw) && typeof raw.x === "number" && typeof raw.y === "number") this.camera.drag(raw.x, raw.y);
		}
		zoom(delta) {
			if (typeof delta === "number" && Number.isFinite(delta)) this.camera.zoomBy(delta);
		}
		async save(raw) {
			const s = this.session;
			if (!s) return BUSY;
			this.preview(raw);
			const args = s.mode === "creator" ? [s.worn] : [s.shopId, s.worn];
			const answer = await triggerServerCallback(s.mode === "creator" ? EVENTS.saveCreator : EVENTS.saveShop, args).catch(() => null);
			if (!isRecord(answer) || answer.ok !== true) return {
				ok: false,
				error: isRecord(answer) && typeof answer.error === "string" ? answer.error : BUSY.error
			};
			const stored = s.mode === "creator" ? s.worn : shopChange(s.mode, s.original, s.worn).appearance;
			applyChanges(PlayerPedId(), s.worn, stored);
			look.current = stored;
			this.close(true);
			return { ok: true };
		}
		cancel() {
			const s = this.session;
			if (!s || s.mode === "creator") return;
			applyChanges(PlayerPedId(), s.worn, s.original);
			this.close(false);
		}
		close(saved) {
			const s = this.session;
			if (!s) return;
			this.session = null;
			SetNuiFocus(false, false);
			SendNUIMessage({ action: NuiMessage.close });
			this.camera.stop();
			FreezeEntityPosition(PlayerPedId(), false);
			DisplayRadar(true);
			if (s.mode === "creator") SetStreamedTextureDictAsNoLongerNeeded(PORTRAIT_DICT);
			s.done(saved);
		}
	};
	const editor = new Editor();
	RegisterNuiCallback(NuiCallback.preview, (data, cb) => {
		editor.preview(data);
		cb(true);
	});
	RegisterNuiCallback(NuiCallback.camera, (data, cb) => {
		editor.focus(data);
		cb(true);
	});
	RegisterNuiCallback(NuiCallback.drag, (data, cb) => {
		editor.drag(data);
		cb(true);
	});
	RegisterNuiCallback(NuiCallback.zoom, (data, cb) => {
		editor.zoom(data);
		cb(true);
	});
	RegisterNuiCallback(NuiCallback.save, (data, cb) => {
		editor.save(data).then(cb, () => cb(BUSY));
	});
	RegisterNuiCallback(NuiCallback.cancel, (_data, cb) => {
		editor.cancel();
		cb(true);
	});

// resource/common/locale.ts
/** This resource's lang texts: `Locale("NOTIFY_NO_MONEY", price)`; keys typed from locales/en.json. */
	const Locale = createLocale();

// resource/common/resource.ts
	const ResourceName = GetCurrentResourceName();
	const ResourceContext = IsDuplicityVersion() ? "server" : "client";

// resource/client/creator.ts
	const log$1 = createLogger(ResourceName);
	async function fadeOut() {
		DoScreenFadeOut(300);
		await waitFor(() => IsScreenFadedOut() || void 0, 2e3).catch(() => void 0);
	}
	/**
	* `ground`: z is the floor (panel points), the game lifts the ped by its root height. Otherwise z is the ped's own
	* root (read with GetEntityCoords) and is used as it is; mixing the two buries the ped or drops it from 1 m.
	*/
	async function teleport(x, y, z, heading, ground) {
		const ped = PlayerPedId();
		RequestCollisionAtCoord(x, y, z);
		if (ground) SetEntityCoords(ped, x, y, z, false, false, false, false);
		else SetEntityCoordsNoOffset(ped, x, y, z, false, false, false);
		SetEntityHeading(ped, heading);
		await waitFor(() => HasCollisionLoadedAroundEntity(ped) || void 0, 5e3).catch(() => void 0);
	}
	/** A new character: into the creator room (the server moved the player to a private bucket), back after saving. */
	async function runCreator(start) {
		await waitFor(() => resourceExport("ai-core").IsPlayerLoaded() || void 0, 3e4);
		await fadeOut();
		const [bx = 0, by = 0, bz = 0] = GetEntityCoords(PlayerPedId(), false);
		const backHeading = GetEntityHeading(PlayerPedId());
		const ped = await ensurePlayerModel(start.model);
		applyAppearance(ped, start);
		const c = content.settings.creator;
		await teleport(c.x, c.y, c.z, c.heading, true);
		DoScreenFadeIn(500);
		await editor.open("creator", start);
		await fadeOut();
		await teleport(bx, by, bz, backHeading, false);
		DoScreenFadeIn(500);
	}
	onServerEvent(EVENTS.create, { args: ([raw]) => asArgs(toAppearance(raw)) }, (start) => runCreator(start).catch((error) => {
		log$1.error("character creator failed", error);
		DoScreenFadeIn(0);
	}));

// resource/client/shops.ts
	const PROMPT = {
		clothing: "HELP_CLOTHING",
		barber: "HELP_BARBER"
	};
	const BLIP = {
		clothing: "AIAPP_BLIP_CLOTHING",
		barber: "AIAPP_BLIP_BARBER"
	};
	/** Height above and below a store's centre that still counts as inside (a floor or two). */
	const ZONE_HEIGHT = 4;
	AddTextEntry(BLIP.clothing, Locale("BLIP_CLOTHING"));
	AddTextEntry(BLIP.barber, Locale("BLIP_BARBER"));
	/**
	* Stores on this client: map blips, a zone per store (checked twice a second, no per-frame work) and ai-core's
	* prompt while the player is inside. Rebuilt whenever the panel changes a store or the settings.
	*/
	var Shops = class {
		blips = [];
		zones = new Zones();
		rebuild() {
			for (const blip of this.blips) RemoveBlip(blip);
			this.blips = [];
			this.zones.clear();
			for (const shop of content.shops.values()) {
				if (shop.blip) this.blips.push(this.blip(shop.type, shop.x, shop.y, shop.z));
				this.zones.add(shop.id, {
					shape: {
						type: "cylinder",
						center: {
							x: shop.x,
							y: shop.y,
							z: shop.z
						},
						radius: shop.radius,
						height: ZONE_HEIGHT
					},
					interval: 500,
					onEnter: () => showPrompt(shop.id, Locale(PROMPT[shop.type])),
					onExit: () => hidePrompt(shop.id)
				});
			}
		}
		/** The interaction key on a store's prompt: open it if the player is dressed, on foot and alive. */
		open(id) {
			const shop = content.shops.get(id);
			const ped = PlayerPedId();
			if (!shop || !look.current || editor.isOpen || IsPedInAnyVehicle(ped, false) || IsEntityDead(ped)) return;
			hidePrompt(id);
			editor.open(shop.type, look.current, shop.id).then(() => {
				if (this.zones.isInside(id)) showPrompt(id, Locale(PROMPT[shop.type]));
			});
		}
		blip(type, x, y, z) {
			const style = content.settings.blips[type];
			const blip = AddBlipForCoord(x, y, z);
			SetBlipSprite(blip, style.sprite);
			SetBlipColour(blip, style.color);
			SetBlipScale(blip, style.scale);
			SetBlipAsShortRange(blip, true);
			BeginTextCommandSetBlipName(BLIP[type]);
			EndTextCommandSetBlipName(blip);
			return blip;
		}
	};
	const shops = new Shops();
	shops.rebuild();
	content.subscribe(() => shops.rebuild());
	onPromptPressed((id) => shops.open(id));

// resource/client/portraits.ts
	const log = createLogger(ResourceName);
	/**
	* Portraits for ai-core's character cards: each look goes on a local ped behind the full-screen menu, the
	* game renders a transparent headshot of it, ai-core shows it through `nui-img`. Headshots live until a character spawns.
	*/
	var Portraits = class {
		/** Character id -> headshot handle and the look it shows. */
		shots = /* @__PURE__ */ new Map();
		queue = Promise.resolve();
		request(list) {
			this.queue = this.queue.then(async () => {
				for (const { id, appearance } of list) await this.make(id, appearance).catch((error) => log.error(`portrait of character ${id} failed`, error));
			});
		}
		async make(id, appearance) {
			const key = JSON.stringify(appearance);
			const old = this.shots.get(id);
			if (old?.key === key && IsPedheadshotValid(old.handle)) return this.announce(id, old.handle);
			if (old) UnregisterPedheadshot(old.handle);
			this.shots.delete(id);
			const hash = await requestModel(appearance.model);
			const [x = 0, y = 0, z = 0] = GetOffsetFromEntityInWorldCoords(PlayerPedId(), 0, 1.5, 0);
			const ped = CreatePed(4, hash, x, y, z - 1, 0, false, false);
			SetModelAsNoLongerNeeded(hash);
			try {
				FreezeEntityPosition(ped, true);
				SetEntityInvincible(ped, true);
				SetBlockingOfNonTemporaryEvents(ped, true);
				applyAppearance(ped, appearance);
				await waitFor(() => HasPedHeadBlendFinished(ped) && HasPedPreloadVariationDataFinished(ped) || void 0, 3e3).catch(() => void 0);
				await sleep(100);
				const handle = RegisterPedheadshotTransparent(ped);
				await waitFor(() => IsPedheadshotReady(handle) && IsPedheadshotValid(handle) || void 0, 5e3);
				this.shots.set(id, {
					handle,
					key
				});
				this.announce(id, handle);
			} finally {
				DeletePed(ped);
			}
		}
		announce(id, handle) {
			const txd = GetPedheadshotTxdString(handle);
			emit(CORE.clientCharacterPortraitEvent, id, `https://nui-img/${txd}/${txd}`);
		}
		clear() {
			for (const { handle } of this.shots.values()) UnregisterPedheadshot(handle);
			this.shots.clear();
		}
	};
	const portraits = new Portraits();
	/** Cards of the character screen: only entries with a numeric id and a valid look pass. */
	function toPortraitList(raw) {
		if (!Array.isArray(raw)) return null;
		return raw.flatMap((entry) => {
			if (!isRecord(entry) || typeof entry.id !== "number") return [];
			const appearance = toAppearance(entry.appearance);
			return appearance ? [{
				id: entry.id,
				appearance
			}] : [];
		});
	}
	onServerEvent(EVENTS.portraits, { args: ([raw]) => asArgs(toPortraitList(raw)) }, (list) => portraits.request(list));
	on(CORE.clientPlayerLoadedEvent, () => portraits.clear());
	on("onResourceStop", (resource) => {
		if (resource === ResourceName) portraits.clear();
	});

})();
}catch(e){globalThis.__aicoreReportError&&globalThis.__aicoreReportError("load: "+(e&&e.stack||e));throw e}
