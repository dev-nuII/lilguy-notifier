// data/state-data.js
// Colors, the game state object, dialogue tables, sprite/rect layout, and
// season/weather tuning tables. Pure data + a couple of plain variables —
// no functions live here anymore (see functions/*.js).

// ---------- COLORS ----------
const WHITE = "#ffffff";
const GREEN = "#00ff00";
const RED = "#ff0000";
const YELLOW = "#ffff00";
const BLUE = "#0000ff";
const ORANGE = "#ff7f00";
const BLACK = "#000000";

// ---------- STATE ----------
let state = {
  x: 180, y: 0,
  mood: 2, mental_state: "neutral",
  hp: 5, hunger: 20,
  bond: 0, streak: 0,
  pets_today: 8,
  season: "fall", weather: "",
  lilstate: "", lilstate1: "",
  speech_timer: 0, current_line: "",
  session_seconds: 0,
  animation: 0, animation_seconds_override: 0,
  lilguy_color: GREEN,
  running: true,
  save_num: 0,
  last_open_date: null,
  last_open_date_str: null,
  gap: 0,
  highest_bond: 0,
  unlocked_tiers: [],
  seen_first_snow: false,
  moment_active: false,
  moment_expires_at: 0,
  presence_moment_active: false,
  presence_moment_expires_at: 0,
  line_display_timer: 0,
  last_line_seen: "",
  sleeping: false,
  sleep_wake_at: null,   // timestamp (ms), written by the cron job
  slept_today: null,     // "YYYY-MM-DD", written by the cron job
  username: null,        // player-entered name, saved on the record
  hasSubscription: false, // set from the save's stored push subscription; UI-only, not persisted directly
};

let hunger_drain_weather = 1.0;
let mods = { hunger_drain: 1.0, bond_mult: 1.0 };
let weather_particles = [];

const exit_rect  = { x: 590, y: 120, w: 50, h: 50 };
const feed_rect  = { x: 590, y: 180, w: 50, h: 50 };
const idle_rect = { x: 590, y: 60, w: 50, h: 50};
let lilguy_rect  = { x: state.x, y: 450, w: 30, h: 20 };

// ---------- DIALOGUE ----------
const dialogue = {
  happy: [
    "hehe :)", "today's a good day", "glad you're here",
    "i love you <3", "i like it when you're around",
    "thank you for spending time with me",
  ],
  neutral: [
    "...", "just vibing", "hm", "wassup.",
    "today felt normal. in a good way",
    "do you ever wonder why theres so much violence",
    "i've been thinking about that walk earlier",
    "do you ever wonder what's outside the window",
    "sometimes i just sit here and think",
    "someday...ill see others like me",
  ],
  angry: [
    ">:(", "not now.", ">:{", "leave me alone.",
    "its lonely when you leave me",
  ],
  winter: ["it's cold out there, huh", "i wish i could see snow", "let's stay inside today"],
  spring: ["everything is growing again", "i can smell the flowers. probably.", "spring always feels hopeful"],
  summer: ["it's so warm out", "summer's my favorite honestly", "i bet its bright outside right now"],
  fall: ["the leaves must be falling", "fall always feels a little nostalgic", "cozy season, right?"],
};

const season_colors = {
  winter: "rgb(225,240,255)",
  spring: "rgb(230,255,230)",
  summer: "rgb(255,250,205)",
  fall:   "rgb(255,235,210)",
};
const BOND_SCALE = 50;
const unlockTiers = [
  { threshold: 10 * BOND_SCALE, sprite: "wink",       frames: ["^_^", "^_^"],   lines: ["hehe, i feel closer to you now", "something feels different. good different."] },
  { threshold: 30 * BOND_SCALE, sprite: "dance",      frames: ["\\o/", "/o\\"], lines: ["i wanna dance!!", "watch this!"] },
  { threshold: 60 * BOND_SCALE, sprite: "heart_eyes", frames: ["<3_<3", "<3_<3"], lines: ["you're my favorite person, you know that?", "i really mean it. thank you."] },
  { threshold: 100 * BOND_SCALE, sprite: "royal",     frames: ["[o]", "[o]"],   lines: ["we've really been through it together huh", "i wouldn't trade this for anything"] },
];

dialogue.angry_missed = [
  "you were gone a while. i got weird about it. sorry.",
  "i wasn't really mad. i think i was just worried.",
  "it's dumb, i know you have a life. i still don't love the quiet though.",
];
const keep_rect = { x: 300, y: 500, w: 90, h: 40 };
const share_rect = { x: 420, y: 500, w: 90, h: 40 };
const goodnight_rect = { x: 660, y: 180, w: 50, h: 50 };

const season_modifiers = {
  winter: { hunger_drain: 1.25, bond_mult: 0.9 },
  spring: { hunger_drain: 1.0,  bond_mult: 1.1 },
  summer: { hunger_drain: 0.9,  bond_mult: 1.0 },
  fall:   { hunger_drain: 1.0,  bond_mult: 1.0 },
};

const weather_visuals = {
  rain:   { char: "|", color: "rgb(100,150,255)", speed: 8,  spawn_chance: 3,  mode: "fall" },
  snow:   { char: "*", color: "rgb(255,255,255)", speed: 2,  spawn_chance: 5,  mode: "fall" },
  storm:  { char: "|", color: "rgb(80,100,160)",  speed: 12, spawn_chance: 2,  mode: "fall" },
  cloudy: { char: "~", color: "rgb(200,200,210)", speed: 1,  spawn_chance: 40, mode: "drift" },
  clear:  { char: "o", color: "rgb(255,220,80)",  speed: 0,  spawn_chance: 0,  mode: "sun" },
};

let lastHungerAt = Date.now();
