/* ══════════════════════════════════════════════════
   TypingMaster — script.js
   - Backspace fully supported (undo last char)
   - Coder mode text is clearly visible (#666 gray)
   - Both modes use keydown-based char tracking
══════════════════════════════════════════════════ */

/* ── TEXT POOLS ── */
const NORMAL_TEXTS = {
  easy: [
    "The quick brown fox jumps over the lazy dog and then runs away into the forest.",
    "A cat sat on the mat and looked at the birds flying in the blue sky above.",
    "She sells sea shells by the sea shore and the shells she sells are surely sea shells.",
    "The sun was shining brightly as the children played in the warm golden sand.",
    "Every day is a new chance to learn something wonderful about the world around you."
  ],
  medium: [
    "Programming is the art of telling another human what one wants the computer to do. The best programs are written so that computing machines can perform them quickly and so that human beings can understand them clearly.",
    "The ability to simplify means to eliminate the unnecessary so that the necessary may speak. In software development, clean code is not written by following a set of rules, but by caring about craftsmanship.",
    "Curiosity is the engine of achievement. If you ask the right questions, you will find the answers you need. The best developers never stop asking why, and always challenge assumptions.",
  ],
  hard: [
    "Concurrency is not parallelism; although it enables parallelism. If you have only one processor, your program can still be concurrent but it cannot be parallel. On the other hand, a well-written concurrent program might run efficiently in parallel on a multiprocessor.",
    "The halting problem, determining whether an arbitrary program will halt or run forever, is undecidable. Turing proved this in 1936 using a diagonalization argument, showing that no general algorithm can solve it for all possible program-input pairs.",
    "Byzantine fault tolerance requires that the system reaches consensus despite up to f faulty nodes out of 3f+1 total nodes. This guarantees safety and liveness properties even when some nodes behave arbitrarily or maliciously."
  ]
};

const CODE_SNIPPETS = {
  JavaScript: {
    name: "bubbleSort.js",
    code: `function bubbleSort(arr) {\n  let n = arr.length;\n  for (let i = 0; i < n - 1; i++) {\n    for (let j = 0; j < n - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) {\n        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];\n      }\n    }\n  }\n  return arr;\n}`
  },
  Python: {
    name: "two_pointer.py",
    code: `def two_sum(nums, target):\n    left, right = 0, len(nums) - 1\n    while left < right:\n        current = nums[left] + nums[right]\n        if current == target:\n            return [left, right]\n        elif current < target:\n            left += 1\n        else:\n            right -= 1\n    return []`
  },
  "C++": {
    name: "binary_search.cpp",
    code: `int binarySearch(vector<int>& arr, int target) {\n    int left = 0, right = arr.size() - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (arr[mid] == target) return mid;\n        else if (arr[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}`
  },
  Java: {
    name: "LinkedList.java",
    code: `public ListNode reverseList(ListNode head) {\n    ListNode prev = null;\n    ListNode curr = head;\n    while (curr != null) {\n        ListNode next = curr.next;\n        curr.next = prev;\n        prev = curr;\n        curr = next;\n    }\n    return prev;\n}`
  },
  Go: {
    name: "goroutines.go",
    code: `func merge(ch1, ch2 <-chan int) <-chan int {\n    out := make(chan int)\n    go func() {\n        defer close(out)\n        for v := range ch1 {\n            out <- v\n        }\n        for v := range ch2 {\n            out <- v\n        }\n    }()\n    return out\n}`
  },
  Rust: {
    name: "ownership.rs",
    code: `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {\n    if x.len() > y.len() {\n        x\n    } else {\n        y\n    }\n}\n\nfn main() {\n    let s1 = String::from("long string");\n    let s2 = String::from("xyz");\n    let result = longest(s1.as_str(), s2.as_str());\n    println!("Longest: {}", result);\n}`
  }
};

/* ══════════════ SHARED ══════════════ */
let currentMode = "normal";
const DAILY_GOAL_TARGET = 10;
const DAILY_GOAL_STORAGE_KEY = "typingMasterDailyGoal";

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function loadDailyGoal() {
  const fallback = { date: todayKey(), sessions: 0 };

  try {
    const saved = JSON.parse(localStorage.getItem(DAILY_GOAL_STORAGE_KEY));
    if (!saved || saved.date !== fallback.date) return fallback;
    return {
      date: saved.date,
      sessions: Number.isInteger(saved.sessions) ? saved.sessions : 0
    };
  } catch {
    return fallback;
  }
}

function saveDailyGoal(goal) {
  localStorage.setItem(DAILY_GOAL_STORAGE_KEY, JSON.stringify(goal));
}

function switchToNormal() {
  currentMode = "normal";
  document.getElementById("normal-view").classList.add("active");
  document.getElementById("coder-view").classList.remove("active");
  document.getElementById("btn-normal").classList.add("active");
  document.getElementById("btn-coder").classList.remove("active");
  document.getElementById("cbtn-normal").classList.remove("active");
  document.getElementById("cbtn-coder").classList.add("active");
}
function switchToCoder() {
  currentMode = "coder";
  document.getElementById("coder-view").classList.add("active");
  document.getElementById("normal-view").classList.remove("active");
  document.getElementById("btn-coder").classList.add("active");
  document.getElementById("btn-normal").classList.remove("active");
  document.getElementById("cbtn-coder").classList.add("active");
  document.getElementById("cbtn-normal").classList.remove("active");
}

document.getElementById("btn-normal").addEventListener("click", switchToNormal);
document.getElementById("btn-coder").addEventListener("click", switchToCoder);
document.getElementById("cbtn-normal").addEventListener("click", switchToNormal);
document.getElementById("cbtn-coder").addEventListener("click", switchToCoder);


/* ══════════════════════════════════════════
   SHARED TYPING ENGINE (used by both modes)
   charStates[i] = "untyped" | "correct" | "incorrect"
   charIndex = position of cursor
══════════════════════════════════════════ */

function buildEngine(config) {
  return {
    state: "idle",
    timer: null,
    timeLimit: config.defaultTime,
    timeLeft: config.defaultTime,
    text: "",
    charIndex: 0,
    charStates: [],   // tracks each char: "untyped"|"correct"|"incorrect"
    errors: 0,
    correctChars: 0,
    totalTyped: 0,
    startTime: null,
    wpmHistory: [],

    /* — render chars into the display element — */
    renderChars(initClass) {
      const el = config.getDisplay();
      el.innerHTML = "";
      this.charStates = [];
      for (let i = 0; i < this.text.length; i++) {
        const span = document.createElement("span");
        span.classList.add("char");
        const ch = this.text[i];
        // preserve newlines as visible characters
        span.textContent = ch;
        span.dataset.index = i;
        span.classList.add(i === 0 ? "current" : initClass);
        this.charStates.push(i === 0 ? "current" : "untyped");
        el.appendChild(span);
      }
      if (config.onRenderDone) config.onRenderDone(this.text);
    },

    getChars() {
      return config.getDisplay().querySelectorAll(".char");
    },

    applyChar(i, state) {
      const chars = this.getChars();
      if (!chars[i]) return;
      chars[i].classList.remove("current", "correct", "incorrect", "untyped");
      chars[i].classList.add(state);
      this.charStates[i] = state;
    },

    setCurrent(i) {
      const chars = this.getChars();
      // remove current from all
      this.getChars().forEach(c => c.classList.remove("current"));
      if (chars[i]) {
        chars[i].classList.add("current");
        chars[i].scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    },

    handleKey(key) {
      if (this.state !== "running") return;

      if (key === "Backspace") {
        if (this.charIndex === 0) return;

        // move cursor back
        this.charIndex--;

        // restore the char we're going back to
        const wasState = this.charStates[this.charIndex];
        if (wasState === "correct") {
          this.correctChars = Math.max(0, this.correctChars - 1);
        } else if (wasState === "incorrect") {
          this.errors = Math.max(0, this.errors - 1);
        }
        this.totalTyped = Math.max(0, this.totalTyped - 1);

        // reset that char to untyped (cursor will be on it)
        this.applyChar(this.charIndex, "untyped");
        this.charStates[this.charIndex] = "untyped";
        this.setCurrent(this.charIndex);

        this.updateStats();
        return;
      }

      // normal character
      if (key.length !== 1) return;
      if (this.charIndex >= this.text.length) return;

      const expected = this.text[this.charIndex];

      this.totalTyped++;

      if (key === expected) {
        this.applyChar(this.charIndex, "correct");
        this.correctChars++;
      } else {
        this.applyChar(this.charIndex, "incorrect");
        this.errors++;
      }

      this.charIndex++;

      if (this.charIndex < this.text.length) {
        this.setCurrent(this.charIndex);
      } else {
        // remove current highlight from last char
        this.getChars().forEach(c => c.classList.remove("current"));
      }

      this.updateStats();

      if (this.charIndex >= this.text.length) {
        setTimeout(() => this.finish(), 100);
      }
    },

    updateStats() {
      const acc = this.totalTyped > 0
        ? Math.round((this.correctChars / this.totalTyped) * 100)
        : 100;
      const elapsed = this.startTime ? (Date.now() - this.startTime) / 60000 : 0;
      const wpm = elapsed > 0 ? Math.round(this.correctChars / 5 / elapsed) : 0;
      config.onStatsUpdate({ acc, wpm, errors: this.errors, chars: this.totalTyped, charIndex: this.charIndex, total: this.text.length });
    },

    start(text) {
      this.text = text;
      this.charIndex = 0;
      this.errors = 0;
      this.correctChars = 0;
      this.totalTyped = 0;
      this.timeLeft = this.timeLimit;
      this.wpmHistory = [];
      this.state = "running";
      this.startTime = Date.now();

      this.renderChars("untyped");

      const inp = config.getInput();
      inp.value = "";
      inp.disabled = false;
      inp.focus();

      config.onStart();
      this.updateTimeDisplay();

      clearInterval(this.timer);
      this.timer = setInterval(() => this.tick(), 1000);
    },

    pause() {
      if (this.state === "running") {
        this.state = "paused";
        clearInterval(this.timer);
        config.getInput().disabled = true;
        config.onPause(true);
      } else if (this.state === "paused") {
        this.state = "running";
        config.getInput().disabled = false;
        config.getInput().focus();
        config.onPause(false);
        this.timer = setInterval(() => this.tick(), 1000);
      }
    },

    reset() {
      clearInterval(this.timer);
      this.state = "idle";
      this.charIndex = 0;
      this.errors = 0;
      this.correctChars = 0;
      this.totalTyped = 0;
      this.timeLeft = this.timeLimit;
      const inp = config.getInput();
      inp.value = "";
      inp.disabled = true;
      config.onReset();
      this.updateTimeDisplay();
    },

    tick() {
      if (this.state !== "running") return;
      this.timeLeft--;
      this.updateTimeDisplay();
      const elapsed = (Date.now() - this.startTime) / 60000;
      const wpm = elapsed > 0 ? Math.round(this.correctChars / 5 / elapsed) : 0;
      this.wpmHistory.push(wpm);
      if (config.onTick) config.onTick(wpm, this.wpmHistory);
      if (this.timeLeft <= 0) this.finish();
    },

    updateTimeDisplay() {
      const m = Math.floor(this.timeLeft / 60);
      const s = this.timeLeft % 60;
      config.onTimeUpdate(`${m}:${s.toString().padStart(2, "0")}`);
    },

    finish() {
      clearInterval(this.timer);
      this.state = "done";
      config.getInput().disabled = true;
      const elapsed = this.startTime ? (Date.now() - this.startTime) / 1000 : 1;
      const wpm = elapsed > 0 ? Math.round(this.correctChars / 5 / (elapsed / 60)) : 0;
      const acc = this.totalTyped > 0 ? Math.round((this.correctChars / this.totalTyped) * 100) : 100;
      config.onFinish({ wpm, acc, elapsed, errors: this.errors });
    }
  };
}


/* ══════════════════════════════════════════
   NORMAL MODE
══════════════════════════════════════════ */
const nmEl = {
  display: document.getElementById("n-text-display"),
  input: document.getElementById("n-input"),
  wpm: document.getElementById("n-wpm-display"),
  acc: document.getElementById("n-acc-display"),
  time: document.getElementById("n-time-display"),
  startBtn: document.getElementById("n-start-btn"),
  restartBtn: document.getElementById("n-restart-btn"),
  liveDot: document.getElementById("n-live-dot"),
  status: document.getElementById("n-session-status"),
  chars: document.getElementById("n-chars"),
  sessAcc: document.getElementById("n-sess-acc"),
  sessWpm: document.getElementById("n-sess-wpm"),
  errorsEl: document.getElementById("n-errors"),
  timeTaken: document.getElementById("n-time-taken"),
  bestWpm: document.getElementById("n-best-wpm"),
  bestAcc: document.getElementById("n-best-acc"),
  testsTaken: document.getElementById("n-tests-taken"),
  goalBar: document.getElementById("n-goal-bar"),
  goalLabel: document.getElementById("n-goal-label"),
};

let nmDifficulty = "easy";
let dailyGoal = loadDailyGoal();

function updateDailyGoalDisplay() {
  const sessions = Math.max(0, dailyGoal.sessions);
  const shownSessions = Math.min(sessions, DAILY_GOAL_TARGET);
  const pct = Math.min((sessions / DAILY_GOAL_TARGET) * 100, 100);

  nmEl.goalBar.style.width = pct + "%";
  nmEl.goalLabel.textContent = sessions >= DAILY_GOAL_TARGET
    ? "Daily goal completed"
    : `${shownSessions} / ${DAILY_GOAL_TARGET} completed`;
}

function recordDailySession() {
  const date = todayKey();
  if (dailyGoal.date !== date) {
    dailyGoal = { date, sessions: 0 };
  }

  dailyGoal.sessions += 1;
  saveDailyGoal(dailyGoal);
  updateDailyGoalDisplay();
}

const NM = buildEngine({
  defaultTime: 15,
  getDisplay: () => nmEl.display,
  getInput: () => nmEl.input,
  onStart() {
    nmEl.liveDot.classList.add("active");
    nmEl.status.textContent = "LIVE SESSION — TYPE BELOW";
    nmEl.startBtn.textContent = "Pause";
  },
  onPause(isPaused) {
    if (isPaused) {
      nmEl.liveDot.classList.remove("active");
      nmEl.status.textContent = "PAUSED — PRESS START TO RESUME";
      nmEl.startBtn.textContent = "Resume";
    } else {
      nmEl.liveDot.classList.add("active");
      nmEl.status.textContent = "LIVE SESSION — TYPE BELOW";
      nmEl.startBtn.textContent = "Pause";
    }
  },
  onReset() {
    nmEl.liveDot.classList.remove("active");
    nmEl.status.textContent = "PRESS START TO BEGIN";
    nmEl.startBtn.textContent = "Start";
    nmEl.wpm.textContent = "0";
    nmEl.acc.textContent = "100%";
    nmEl.chars.textContent = "0";
    nmEl.sessAcc.textContent = "100%";
    nmEl.sessWpm.textContent = "0";
    nmEl.errorsEl.textContent = "0";
    nmEl.timeTaken.textContent = "00:00";
    nmEl.display.innerHTML = "";
  },
  onStatsUpdate({ acc, wpm, errors, chars }) {
    nmEl.acc.textContent = acc + "%";
    nmEl.wpm.textContent = wpm;
    nmEl.chars.textContent = chars;
    nmEl.sessAcc.textContent = acc + "%";
    nmEl.sessWpm.textContent = wpm;
    nmEl.errorsEl.textContent = errors;
  },
  onTimeUpdate(str) {
    nmEl.time.textContent = str;
  },
  onTick(wpm) {
    nmEl.wpm.textContent = wpm;
    nmEl.sessWpm.textContent = wpm;
  },
  onFinish({ wpm, acc, elapsed }) {
    nmEl.liveDot.classList.remove("active");
    nmEl.status.textContent = "SESSION COMPLETE!";
    nmEl.startBtn.textContent = "Start";

    const s = Math.floor(elapsed % 60);
    const m = Math.floor(elapsed / 60);
    nmEl.timeTaken.textContent = `${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;

    const prevBest = parseInt(nmEl.bestWpm.textContent) || 0;
    if (wpm > prevBest) nmEl.bestWpm.textContent = wpm;
    const prevTests = parseInt(nmEl.testsTaken.textContent) || 0;
    nmEl.testsTaken.textContent = prevTests + 1;
    recordDailySession();

    showResult("normal", wpm, acc, elapsed);
  }
});

nmEl.startBtn.addEventListener("click", () => {
  if (NM.state === "idle" || NM.state === "done") {
    const pool = NORMAL_TEXTS[nmDifficulty];
    NM.start(pool[Math.floor(Math.random() * pool.length)]);
  } else {
    NM.pause();
  }
});
nmEl.restartBtn.addEventListener("click", () => {
  NM.reset();
  // re-render placeholder
  const pool = NORMAL_TEXTS[nmDifficulty];
  NM.text = pool[0];
  NM.renderChars("untyped");
});

/* intercept keydown on normal input for backspace */
nmEl.input.addEventListener("keydown", (e) => {
  if (NM.state !== "running") return;
  if (e.key === "Backspace") {
    e.preventDefault();
    NM.handleKey("Backspace");
  }
});
nmEl.input.addEventListener("input", (e) => {
  if (NM.state !== "running") return;
  const val = e.target.value;
  if (!val) return;
  // process each character typed (handles paste edge case too)
  for (const ch of val) {
    NM.handleKey(ch);
  }
  e.target.value = "";
});

// Time pills
document.querySelectorAll(".n-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".n-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    const val = pill.dataset.time;
    if (val === "custom") {
      const t = parseInt(prompt("Enter custom time in seconds (10-300):", "45"));
      if (t && t >= 10 && t <= 300) {
        NM.timeLimit = t;
        pill.textContent = t + "s";
      }
    } else {
      NM.timeLimit = parseInt(val);
    }
    if (NM.state !== "idle") NM.reset();
    else { NM.timeLeft = NM.timeLimit; NM.updateTimeDisplay(); }
  });
});

// Difficulty
document.querySelectorAll(".n-diff-option").forEach(opt => {
  opt.addEventListener("click", () => {
    document.querySelectorAll(".n-diff-option").forEach(o => o.classList.remove("active"));
    opt.classList.add("active");
    nmDifficulty = opt.dataset.diff;
    if (NM.state !== "idle") NM.reset();
  });
});


/* ══════════════════════════════════════════
   CODER MODE
══════════════════════════════════════════ */
const cmEl = {
  display: document.getElementById("c-text-display"),
  lineNums: document.getElementById("c-line-nums"),
  input: document.getElementById("c-input"),
  wpm: document.getElementById("c-wpm-display"),
  acc: document.getElementById("c-acc-display"),
  time: document.getElementById("c-time-display"),
  errors: document.getElementById("c-errors-display"),
  startBtn: document.getElementById("c-start-btn"),
  resetBtn: document.getElementById("c-reset-btn"),
  filename: document.getElementById("c-filename"),
  langBadge: document.getElementById("c-lang-badge"),
  langSelect: document.getElementById("c-lang-select"),
  charsDisplay: document.getElementById("c-chars-display"),
  progFill: document.getElementById("c-prog-fill"),
  progPct: document.getElementById("c-prog-pct"),
  bestWpm: document.getElementById("c-best-wpm"),
  bestAcc: document.getElementById("c-best-acc"),
  wpmChart: document.getElementById("c-wpm-chart"),
};

let cmLanguage = "JavaScript";

const CM = buildEngine({
  defaultTime: 60,
  getDisplay: () => cmEl.display,
  getInput: () => cmEl.input,
  onRenderDone(text) {
    // render line numbers
    const lines = text.split("\n").length;
    cmEl.lineNums.innerHTML = Array.from({length: lines}, (_, i) => i + 1).join("<br>");
    // update filename/badge
    const snip = CODE_SNIPPETS[cmLanguage];
    cmEl.filename.textContent = snip.name;
    cmEl.langBadge.textContent = cmLanguage;
  },
  onStart() {
    cmEl.startBtn.textContent = "⏸ Pause";
  },
  onPause(isPaused) {
    cmEl.startBtn.textContent = isPaused ? "▶ Resume" : "⏸ Pause";
  },
  onReset() {
    cmEl.startBtn.textContent = "▶ Start Session";
    cmEl.wpm.textContent = "0";
    cmEl.acc.textContent = "100%";
    cmEl.errors.textContent = "0";
    cmEl.charsDisplay.textContent = "0 / 0";
    cmEl.progFill.style.width = "0%";
    cmEl.progPct.textContent = "0% complete";
    // re-render snippet
    const snip = CODE_SNIPPETS[cmLanguage];
    CM.text = snip.code;
    CM.renderChars("untyped");
    drawWpmChart([]);
  },
  onStatsUpdate({ acc, wpm, errors, charIndex, total }) {
    cmEl.acc.textContent = acc + "%";
    cmEl.wpm.textContent = wpm;
    cmEl.errors.textContent = errors;
    const pct = total > 0 ? Math.round((charIndex / total) * 100) : 0;
    cmEl.charsDisplay.textContent = `${charIndex} / ${total}`;
    cmEl.progFill.style.width = pct + "%";
    cmEl.progPct.textContent = pct + "% complete";
  },
  onTimeUpdate(str) {
    cmEl.time.textContent = str;
  },
  onTick(wpm, history) {
    cmEl.wpm.textContent = wpm;
    drawWpmChart(history);
  },
  onFinish({ wpm, acc, elapsed }) {
    cmEl.startBtn.textContent = "▶ Start Session";
    const prevBest = parseInt(cmEl.bestWpm.textContent) || 0;
    if (wpm > prevBest) cmEl.bestWpm.textContent = wpm;
    showResult("coder", wpm, acc, elapsed);
  }
});

cmEl.startBtn.addEventListener("click", () => {
  if (CM.state === "idle" || CM.state === "done") {
    CM.start(CODE_SNIPPETS[cmLanguage].code);
  } else {
    CM.pause();
  }
});
cmEl.resetBtn.addEventListener("click", () => CM.reset());

/* intercept keydown on coder input for backspace + Tab */
cmEl.input.addEventListener("keydown", (e) => {
  if (CM.state !== "running") return;
  if (e.key === "Backspace") {
    e.preventDefault();
    CM.handleKey("Backspace");
  } else if (e.key === "Tab") {
    e.preventDefault();
    // type two spaces for tab in code
    CM.handleKey(" ");
    CM.handleKey(" ");
  } else if (e.key === "Enter") {
    e.preventDefault();
    CM.handleKey("\n");
  }
});
cmEl.input.addEventListener("input", (e) => {
  if (CM.state !== "running") return;
  const val = e.target.value;
  if (!val) return;
  for (const ch of val) {
    CM.handleKey(ch);
  }
  e.target.value = "";
});

// Language select dropdown
cmEl.langSelect.addEventListener("change", () => {
  cmLanguage = cmEl.langSelect.value;
  syncLangTags(cmLanguage);
  CM.reset();
});

// Language tags sidebar
document.querySelectorAll(".c-lang-tag").forEach(tag => {
  tag.addEventListener("click", () => {
    cmLanguage = tag.dataset.lang;
    syncLangTags(cmLanguage);
    cmEl.langSelect.value = cmLanguage;
    CM.reset();
  });
});

function syncLangTags(lang) {
  document.querySelectorAll(".c-lang-tag").forEach(t => {
    t.classList.toggle("active", t.dataset.lang === lang);
  });
}

// Coder difficulty pills
document.querySelectorAll(".c-diff-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".c-diff-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
  });
});

// Coder time pills
document.querySelectorAll(".c-tpill").forEach(pill => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".c-tpill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    const val = pill.dataset.ctime;
    if (val === "custom") {
      const t = parseInt(prompt("Enter custom time in seconds (10-300):", "90"));
      if (t && t >= 10 && t <= 300) { CM.timeLimit = t; pill.textContent = t + "s"; }
    } else if (val === "snippet") {
      CM.timeLimit = 9999;
    } else {
      CM.timeLimit = parseInt(val);
    }
    if (CM.state !== "idle") CM.reset();
    else { CM.timeLeft = CM.timeLimit; CM.updateTimeDisplay(); }
  });
});

/* WPM chart */
function drawWpmChart(data) {
  const canvas = cmEl.wpmChart;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (data.length < 2) return;
  const max = Math.max(...data, 10);
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * (w - 20) + 10,
    y: h - 10 - ((v / max) * (h - 20))
  }));
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 3; i++) {
    const y = 10 + ((h - 20) / 3) * i;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = "#00ff88";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  pts.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = "#00ff88";
    ctx.fill();
  });
  ctx.fillStyle = "#333";
  ctx.font = "9px monospace";
  ctx.fillText(max, 2, 14);
  ctx.fillText(0, 2, h - 2);
}


/* ── RESULT OVERLAY ── */
function showResult(mode, wpm, acc, elapsed) {
  const s = Math.floor(elapsed % 60);
  const m = Math.floor(elapsed / 60);
  const timeStr = `${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
  const overlay = document.createElement("div");
  overlay.className = "result-overlay";
  overlay.innerHTML = `
    <div class="result-box">
      <h2>${mode === "coder" ? "// Session Complete" : "🎉 Session Complete!"}</h2>
      <div class="result-stats">
        <div><div class="result-stat-label">WPM</div><div class="result-stat-val">${wpm}</div></div>
        <div><div class="result-stat-label">Accuracy</div><div class="result-stat-val">${acc}%</div></div>
        <div><div class="result-stat-label">Time</div><div class="result-stat-val">${timeStr}</div></div>
      </div>
      <button class="result-btn" id="res-retry">Try Again</button>
      <button class="result-btn" id="res-close" style="background:#eee;color:#333;">Close</button>
    </div>`;
  const view = document.getElementById(mode === "coder" ? "coder-view" : "normal-view");
  view.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("show"));
  overlay.querySelector("#res-retry").addEventListener("click", () => {
    overlay.remove();
    if (mode === "normal") {
      const pool = NORMAL_TEXTS[nmDifficulty];
      NM.start(pool[Math.floor(Math.random() * pool.length)]);
    } else {
      CM.start(CODE_SNIPPETS[cmLanguage].code);
    }
  });
  overlay.querySelector("#res-close").addEventListener("click", () => {
    overlay.classList.remove("show");
    setTimeout(() => overlay.remove(), 300);
  });
}


/* ── GLOBAL KEYBOARD SHORTCUTS ── */
document.addEventListener("keydown", (e) => {
  const active = document.activeElement;
  const isTyping = active === nmEl.input || active === cmEl.input;

  if (e.key === "Tab" && !isTyping) {
    e.preventDefault();
    if (currentMode === "normal") NM.reset();
    else CM.reset();
  }
  if (e.key === "Escape") {
    if (currentMode === "normal") NM.pause();
    else CM.pause();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "r") {
    e.preventDefault();
    if (currentMode === "normal") {
      if (NM.state === "idle" || NM.state === "done") {
        const pool = NORMAL_TEXTS[nmDifficulty];
        NM.start(pool[Math.floor(Math.random() * pool.length)]);
      } else NM.reset();
    } else {
      if (CM.state === "idle" || CM.state === "done") CM.start(CODE_SNIPPETS[cmLanguage].code);
      else CM.reset();
    }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    if (currentMode === "normal" && NM.state === "running") NM.finish();
    else if (currentMode === "coder" && CM.state === "running") CM.finish();
  }
});


/* ── INIT ── */
(function init() {
  // Normal: render first text as preview
  NM.text = NORMAL_TEXTS.easy[0];
  NM.renderChars("untyped");
  NM.timeLeft = NM.timeLimit;
  NM.updateTimeDisplay();
  updateDailyGoalDisplay();

  // Coder: load default snippet
  CM.text = CODE_SNIPPETS["JavaScript"].code;
  CM.renderChars("untyped");
  CM.timeLeft = CM.timeLimit;
  CM.updateTimeDisplay();
  drawWpmChart([]);
})();
