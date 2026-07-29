const DWELL_MS = 1000;

function framesFor(chart) {
  return chart && chart.config && Array.isArray(chart.config.keyframes)
    ? chart.config.keyframes
    : [];
}

function clearPlaybackTimer(chart) {
  if (!chart || !chart.runtime) return;
  if (chart.runtime.keyframeTimer !== null && chart.runtime.keyframeTimer !== undefined) {
    clearTimeout(chart.runtime.keyframeTimer);
  }
  chart.runtime.keyframeTimer = null;
}

function applyWithoutRender(chart, frame) {
  if (!frame || !Array.isArray(frame.layers) || !chart.config ||
      !Array.isArray(chart.config.layers)) return;
  const byLabel = Object.create(null);
  chart.config.layers.forEach(function(layer) { byLabel[layer.label] = layer; });
  frame.layers.forEach(function(update) {
    if (update && Array.isArray(update.data) &&
        Object.prototype.hasOwnProperty.call(byLabel, update.label)) {
      byLabel[update.label].data = update.data;
    }
  });
}

function resolveFrameIndex(chart, frame) {
  const frames = framesFor(chart);
  if (typeof frame === "number" && Number.isInteger(frame)) {
    const index = frame - 1;
    return index >= 0 && index < frames.length ? index : -1;
  }
  if (typeof frame === "string") {
    return frames.findIndex(function(candidate) { return candidate.label === frame; });
  }
  return -1;
}

function updateControls(chart) {
  if (!chart || !chart.runtime || !chart.runtime.keyframeControls) return;
  const frames = framesFor(chart);
  const controls = chart.runtime.keyframeControls;
  const label = controls.querySelector(".myIO-keyframe-label");
  const play = controls.querySelector('[data-keyframe-action="play"]');
  const previous = controls.querySelector('[data-keyframe-action="previous"]');
  const next = controls.querySelector('[data-keyframe-action="next"]');
  const index = chart.runtime.keyframeIndex || 0;
  if (label && frames[index]) label.textContent = frames[index].label;
  if (play) {
    play.textContent = chart.runtime.keyframePlaying ? "Pause" : "Play";
    play.setAttribute("aria-label", chart.runtime.keyframePlaying
      ? "Pause keyframe playback" : "Play keyframes");
    play.setAttribute("aria-pressed", chart.runtime.keyframePlaying ? "true" : "false");
  }
  if (previous) previous.disabled = index <= 0;
  if (next) next.disabled = index >= frames.length - 1;
}

function stopPlayback(chart) {
  if (!chart || !chart.runtime) return;
  clearPlaybackTimer(chart);
  chart.runtime.keyframePlaying = false;
  updateControls(chart);
}

function scheduleNext(chart) {
  clearPlaybackTimer(chart);
  if (!chart.runtime.keyframePlaying) return;
  const speed = Number(chart.config && chart.config.transitions &&
    chart.config.transitions.speed) || 0;
  chart.runtime.keyframeTimer = setTimeout(function() {
    if (!chart.runtime || !chart.runtime.keyframePlaying) return;
    const frames = framesFor(chart);
    const next = chart.runtime.keyframeIndex + 1;
    if (next >= frames.length) {
      stopPlayback(chart);
      return;
    }
    selectKeyframe(chart, next + 1, { preservePlayback: true });
    if (next >= frames.length - 1) stopPlayback(chart);
    else scheduleNext(chart);
  }, Math.max(0, speed) + DWELL_MS);
}

function makeButton(action, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "myIO-keyframe-button";
  button.dataset.keyframeAction = action;
  button.textContent = label;
  return button;
}

function renderControls(chart) {
  const frames = framesFor(chart);
  if (frames.length < 2 || !chart.dom || !chart.dom.element) return;
  const controls = document.createElement("div");
  controls.className = "myIO-keyframe-controls";
  controls.setAttribute("role", "group");
  controls.setAttribute("aria-label", "Keyframe playback controls");

  const previous = makeButton("previous", "Previous");
  previous.setAttribute("aria-label", "Previous keyframe");
  previous.addEventListener("click", function() { stepKeyframe(chart, "previous"); });
  controls.appendChild(previous);

  const play = makeButton("play", "Play");
  play.setAttribute("aria-label", "Play keyframes");
  play.setAttribute("aria-pressed", "false");
  play.addEventListener("click", function() { toggleKeyframePlayback(chart); });
  controls.appendChild(play);

  const next = makeButton("next", "Next");
  next.setAttribute("aria-label", "Next keyframe");
  next.addEventListener("click", function() { stepKeyframe(chart, "next"); });
  controls.appendChild(next);

  const label = document.createElement("span");
  label.className = "myIO-keyframe-label";
  label.setAttribute("aria-live", "polite");
  controls.appendChild(label);

  chart.dom.element.appendChild(controls);
  chart.runtime.keyframeControls = controls;
  updateControls(chart);
}

export function initializeKeyframes(chart) {
  destroyKeyframes(chart);
  if (!chart || !chart.runtime) return;
  const frames = framesFor(chart);
  chart.runtime.keyframeIndex = 0;
  chart.runtime.keyframePlaying = false;
  chart.runtime.keyframeTimer = null;
  chart.runtime.keyframeControls = null;
  if (frames.length === 0) return;
  applyWithoutRender(chart, frames[0]);
  renderControls(chart);
}

export function selectKeyframe(chart, frame, options) {
  if (!chart || !chart.runtime) return false;
  const index = resolveFrameIndex(chart, frame);
  if (index < 0) return false;
  const preservePlayback = options && options.preservePlayback === true;
  if (!preservePlayback) stopPlayback(chart);
  chart.runtime.keyframeIndex = index;
  const selected = framesFor(chart)[index];
  if (typeof chart.updateData === "function") chart.updateData(selected.layers || []);
  else applyWithoutRender(chart, selected);
  updateControls(chart);
  return true;
}

export function stepKeyframe(chart, direction) {
  if (!chart || !chart.runtime) return false;
  stopPlayback(chart);
  const frames = framesFor(chart);
  if (frames.length === 0) return false;
  const delta = direction === "previous" ? -1 : direction === "next" ? 1 : 0;
  if (delta === 0) return false;
  const next = Math.max(0, Math.min(frames.length - 1,
    (chart.runtime.keyframeIndex || 0) + delta));
  return selectKeyframe(chart, next + 1);
}

export function toggleKeyframePlayback(chart) {
  if (!chart || !chart.runtime || framesFor(chart).length < 2) return false;
  if (chart.runtime.keyframePlaying) {
    stopPlayback(chart);
    return false;
  }
  if (chart.runtime.keyframeIndex >= framesFor(chart).length - 1) {
    selectKeyframe(chart, 1);
  }
  chart.runtime.keyframePlaying = true;
  updateControls(chart);
  scheduleNext(chart);
  return true;
}

export function destroyKeyframes(chart) {
  if (!chart || !chart.runtime) return;
  clearPlaybackTimer(chart);
  chart.runtime.keyframePlaying = false;
  const controls = chart.runtime.keyframeControls ||
    (chart.dom && chart.dom.element &&
      chart.dom.element.querySelector(".myIO-keyframe-controls"));
  if (controls && controls.parentNode) controls.parentNode.removeChild(controls);
  chart.runtime.keyframeControls = null;
}
