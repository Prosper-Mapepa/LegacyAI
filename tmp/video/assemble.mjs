/**
 * Export silent 1080p MP4 — uniform scale only (never stretch), full-bleed crop.
 */
import { createRequire } from "node:module";
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { PNG } = require("pngjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.join(__dirname, "raw-demo.webm");
const OUT = path.join(__dirname, "LegacyAI-Product-Demo.mp4");
const DESKTOP_OUT = path.join(
  process.env.HOME || "",
  "Desktop",
  "LegacyAI-Product-Demo.mp4",
);
const CHECK = path.join(__dirname, "verify-frame.png");

function sh(cmd) {
  console.log(">", cmd.slice(0, 180) + (cmd.length > 180 ? "…" : ""));
  execSync(cmd, { stdio: "inherit" });
}

function durationOf(file) {
  return Number(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        file,
      ],
      { encoding: "utf8" },
    ).trim(),
  );
}

function probeSize(file) {
  const out = execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height",
      "-of",
      "csv=p=0",
      file,
    ],
    { encoding: "utf8" },
  ).trim();
  const [w, h] = out.split(",").map(Number);
  return { w, h };
}

function assertFullBleed(pngPath) {
  const png = PNG.sync.read(fs.readFileSync(pngPath));
  const { width: w, height: h } = png;
  if (w !== 1920 || h !== 1080) {
    throw new Error(`Expected 1920x1080 frame, got ${w}x${h}`);
  }
  const sample = (x, y) => {
    const i = (Math.floor(y) * w + Math.floor(x)) * 4;
    return [png.data[i], png.data[i + 1], png.data[i + 2]];
  };
  const black = ([r, g, b]) => r < 12 && g < 12 && b < 12;
  const nearGray = ([r, g, b]) => {
    const mean = (r + g + b) / 3;
    return mean > 180 && mean < 250 && Math.max(r, g, b) - Math.min(r, g, b) < 18;
  };
  const tl = sample(20, 20);
  const tr = sample(w - 20, 20);
  const tm = sample(w / 2, 8);
  const bm = sample(w / 2, h - 8);
  const mr = sample(w - 20, h / 2);

  if (black(tm) || black(bm) || black(sample(8, h / 2)) || black(mr)) {
    throw new Error("BLACK BARS detected on frame edges");
  }
  const tlNavy = tl[2] > 60 && tl[0] < 90 && tl[1] < 90;
  const trNavy = tr[2] > 60 && tr[0] < 90 && tr[1] < 90;
  if (tlNavy && !trNavy) {
    throw new Error("Header does not span full width");
  }
  if (tlNavy && nearGray(tr) && nearGray(mr)) {
    throw new Error("LETTERBOX: UI stuck in corner");
  }
  console.log("Full-bleed check passed", { tl, tr });
}

const videoDur = durationOf(RAW);
const { w: rw, h: rh } = probeSize(RAW);
const TARGET = 120;
console.log({ videoDur, raw: `${rw}x${rh}`, TARGET });

// Keep timing close to real capture — avoid heavy slow-mo that feels "shrunk"
let setpts = "1";
let outDur = videoDur;
if (videoDur > 128) {
  setpts = (TARGET / videoDur).toFixed(6);
  outDur = TARGET;
} else if (videoDur < 105) {
  setpts = (TARGET / videoDur).toFixed(6);
  outDur = TARGET;
}

// Uniform upscale to 1080p (e.g. 1440×810 → 1920×1080). Never stretch.
const geometry =
  rw === 1920 && rh === 1080
    ? "setsar=1"
    : "scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,setsar=1";
const vf = `[0:v]setpts=${setpts}*PTS,fps=30,${geometry},format=yuv420p,fade=t=in:st=0:d=0.25,fade=t=out:st=${(outDur - 0.45).toFixed(2)}:d=0.45[v]`;
console.log(`Assemble: ${rw}x${rh} → 1920x1080 uniform (no stretch)`);

sh(
  `ffmpeg -y -i "${RAW}" -f lavfi -i anullsrc=r=48000:cl=stereo \
  -filter_complex "${vf}" \
  -map "[v]" -map 1:a -c:v libx264 -preset slow -crf 14 -profile:v high -level 4.2 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -shortest -t ${outDur} -movflags +faststart "${OUT}"`,
);

sh(`ffmpeg -y -ss 6 -i "${OUT}" -frames:v 1 -update 1 "${CHECK}"`);
assertFullBleed(CHECK);

fs.copyFileSync(OUT, DESKTOP_OUT);
const finalDur = durationOf(OUT);
const sizeMb = (fs.statSync(OUT).size / (1024 * 1024)).toFixed(1);
console.log(`\nWrote ${OUT}`);
console.log(`Also copied to ${DESKTOP_OUT}`);
console.log(`Duration ${finalDur.toFixed(1)}s · ${sizeMb} MB · 1920x1080 uniform cover · silent`);
