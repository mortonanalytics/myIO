import { fieldData, positionAt, trailAt, playback } from "../interactions/field-tracking.js";
import { fieldMetrics, fieldMetricsWindow } from "../interactions/field-metrics.js";

const metric = value => value === null ? "—" : value.toFixed(2);

export class FieldTrackingRenderer {
  static type = "field";
  static traits = { hasAxes: false, referenceLines: false, legendType: "none", binning: false, rolloverStyle: "none", scaleCapabilities: {} };
  static scaleHints = null;
  static dataContract = { x_var: { required: true, numeric: true }, y_var: { required: true, numeric: true }, time: { required: true, numeric: true }, entity: { required: true }, team: {}, label: {}, kind: {} };

  render(chart, layer) {
    let view = chart.runtime.field;
    if (view && (view.data !== layer.data || view.mapping !== layer.mapping || view.options !== layer.options)) { view.dispose(); view = null; }
    if (!view) {
      const options = layer.options || {};
      const length = Number.isFinite(options.pitchLength) && options.pitchLength > 0 ? options.pitchLength : 105;
      const width = Number.isFinite(options.pitchWidth) && options.pitchWidth > 0 ? options.pitchWidth : 68;
      const gap = Number.isFinite(options.maxGap) && options.maxGap > 0 ? options.maxGap : 0.5;
      const data = fieldData(layer.data, layer.mapping);
      const overlays = options.overlays && typeof options.overlays === "object" ? options.overlays : {};
      const showShape = overlays.shape === true, showSeparation = overlays.separation === true;
      const metricOptions = { maxGap: gap, minPlayers: Number.isInteger(options.minPlayers) && options.minPlayers >= 2 ? options.minPlayers : 2, excludeEntities: Array.isArray(options.excludeEntities) ? options.excludeEntities.map(String) : [] };
      const requested = options.metricWindow;
      let metricWindow = Array.isArray(requested) && requested.length === 2 && requested.every(Number.isFinite) && requested[0] <= requested[1] ? [...requested] : [data.times[0] ?? 0, data.times.at(-1) ?? 0];
      const root = chart.dom.chartArea.append("foreignObject").attr("class", "myIO-field-root");
      const host = root.append("xhtml:div").attr("class", "myIO-field").on("keydown", event => event.stopPropagation());
      host.append("div").attr("class", "field-heading").text(layer.label || "Field tracking");
      const controls = host.append("div").attr("class", "field-controls");
      const button = (name, action) => controls.append("button").attr("type", "button").attr("aria-label", name).text(name).on("click", action);
      const play = button("Play", () => controller.state.playing ? controller.pause() : controller.play());
      button("Reset", () => { controller.pause(); controller.seek(data.times[0]); });
      const previous = button("Previous frame", () => controller.step(-1));
      const next = button("Next frame", () => controller.step(1));
      const speed = controls.append("label").text("Speed ").append("select").attr("aria-label", "Playback speed");
      speed.selectAll("option").data([0.5, 1, 2]).join("option").attr("value", d => d).text(d => `${d}×`);
      speed.property("value", 1).on("change", event => { controller.state.speed = +event.target.value; });
      const clock = controls.append("output").attr("class", "field-time").attr("aria-label", "Current time");
      const timeline = host.append("input").attr("class", "field-timeline").attr("type", "range").attr("aria-label", "Timeline").attr("min", data.times[0] ?? 0).attr("max", data.times.at(-1) ?? 0).attr("step", "any").on("input", event => { const time = +event.target.value; controller.pause(); controller.seek(time); });
      const choices = host.append("div").attr("class", "field-controls");
      const select = choices.append("label").text("Player ").append("select").attr("aria-label", "Player");
      select.append("option").attr("value", "").text("Choose a player");
      select.selectAll("option.player").data(data.entities.filter(d => d.kind !== "ball")).join("option").attr("class", "player").attr("value", d => d.id).text(d => `${d.team} · ${d.label}`);
      let selected = "", labels = true, seconds = 3;
      const hidden = new Set();
      select.on("change", event => { selected = event.target.value; paint(); });
      const labelToggle = choices.append("label");
      labelToggle.append("input").attr("type", "checkbox").attr("aria-label", "Labels").property("checked", true).on("change", event => { labels = event.target.checked; paint(); });
      labelToggle.append("span").text("Labels");
      const trailControl = choices.append("label").text("Trail ");
      trailControl.append("input").attr("type", "range").attr("aria-label", "Trail length").attr("min", 0).attr("max", 20).attr("step", 0.5).property("value", seconds).on("input", event => { seconds = +event.target.value; trailReadout.text(`${seconds}s`); paint(); });
      const trailReadout = trailControl.append("span").text("3s");
      const teams = [...new Set(data.entities.filter(d => d.kind !== "ball").map(d => d.team))];
      const color = d3.scaleOrdinal().domain(teams).range(["#56B4E9", "#E69F00", "#CC79A7", "#009E73"]);
      teams.forEach(team => {
        const label = choices.append("label").style("border-bottom", `3px solid ${color(team)}`);
        label.append("input").attr("type", "checkbox").attr("aria-label", `Show ${team}`).property("checked", true).on("change", event => { event.target.checked ? hidden.delete(team) : hidden.add(team); paint(); });
        label.append("span").text(team);
      });
      const pitch = host.append("svg").attr("class", "field-pitch").attr("viewBox", `-3 -3 ${length + 6} ${width + 6}`).attr("role", "group").attr("aria-label", "Soccer pitch, top-left coordinate origin");
      const marks = pitch.append("g").attr("class", "field-markings");
      marks.append("rect").attr("width", length).attr("height", width);
      marks.append("path").attr("d", `M${length / 2},0V${width}`);
      marks.append("circle").attr("cx", length / 2).attr("cy", width / 2).attr("r", 9.15);
      for (const side of [0, length]) {
        marks.append("rect").attr("x", side ? length - 16.5 : 0).attr("y", width / 2 - 20.16).attr("width", 16.5).attr("height", 40.32);
        marks.append("rect").attr("x", side ? length - 5.5 : 0).attr("y", width / 2 - 9.16).attr("width", 5.5).attr("height", 18.32);
        marks.append("circle").attr("cx", side ? length - 11 : 11).attr("cy", width / 2).attr("r", 0.22).attr("fill", "white");
        marks.append("rect").attr("x", side ? length : -2).attr("y", width / 2 - 3.66).attr("width", 2).attr("height", 7.32);
      }
      const trail = pitch.append("path").attr("class", "field-trail");
      const overlay = showShape || showSeparation ? pitch.append("g").attr("class", "field-overlays").attr("pointer-events", "none") : null;
      const players = pitch.append("g");
      const separationLayer = showSeparation ? pitch.append("g").attr("class", "field-separation").attr("pointer-events", "none") : null;
      const detail = host.append("div").attr("class", "field-detail").text("Select a player to follow their trail.");
      const panel = overlay ? host.append("div").attr("class", "field-metrics").attr("role", "group").attr("aria-label", "Tactical metrics") : null;
      let shapeTable, windowLabel, windowTable, windowSummary, separationText;
      if (showShape) {
        shapeTable = panel.append("table").attr("class", "field-shape-table");
        shapeTable.append("caption");
        shapeTable.append("thead").append("tr").selectAll("th").data(["Team", "Players", "Width (m)", "Depth (m)"]).join("th").attr("scope", "col").text(d => d);
        shapeTable.append("tbody");
        const windowControls = panel.append("div").attr("class", "field-controls");
        windowLabel = windowControls.append("output").attr("class", "field-window").attr("aria-label", "Metric window");
        windowControls.append("button").attr("type", "button").text("Set window start").on("click", () => { metricWindow = [controller.state.time, Math.max(controller.state.time, metricWindow[1])]; windowSummary = null; paint(); });
        windowControls.append("button").attr("type", "button").text("Set window end").on("click", () => { metricWindow = [Math.min(controller.state.time, metricWindow[0]), controller.state.time]; windowSummary = null; paint(); });
        windowTable = panel.append("table").attr("class", "field-window-table");
        windowTable.append("thead").append("tr").selectAll("th").data(["Team", "Frames", "Width mean / min / max", "Depth mean / min / max"]).join("th").attr("scope", "col").text(d => d);
        windowTable.append("tbody");
      }
      if (showSeparation) separationText = panel.append("p").attr("class", "field-separation-text");
      const events = (Array.isArray(options.events) ? options.events : []).filter(e => Number.isFinite(e.time) && e.time >= data.times[0] && e.time <= data.times.at(-1)).slice().sort((a, b) => a.time - b.time);
      const eventList = host.append("div").attr("class", "field-events").attr("role", "group").attr("aria-label", "Match events");
      const eventButtons = eventList.selectAll("button").data(events).join("button").attr("type", "button").text(e => `${e.time.toFixed(2)}s · ${e.type} · ${e.player ?? e.team ?? ""}`).on("click", (_, e) => { controller.pause(); controller.seek(e.time); });
      function choose(entity) { selected = entity.id; select.property("value", selected); paint(); chart.emit("select", { layer: layer.label, entity: selected, time: controller.state.time }); }
      function paint() {
        const { time, playing } = controller.state;
        play.text(playing ? "Pause" : "Play").attr("aria-label", playing ? "Pause" : "Play");
        previous.property("disabled", time <= data.times[0]); next.property("disabled", time >= data.times.at(-1));
        play.property("disabled", data.times.length < 2);
        timeline.property("value", time); clock.text(`${time.toFixed(2)} / ${(data.times.at(-1) ?? 0).toFixed(2)} s`);
        const visible = data.entities.flatMap(entity => { const point = positionAt(entity.samples, time, gap); return point && !hidden.has(entity.team) ? [{ ...entity, point }] : []; });
        const nodes = players.selectAll("g.field-entity").data(visible, d => d.id).join(enter => { const g = enter.append("g").attr("class", "field-entity"); g.append("circle"); g.append("text"); g.append("title"); return g; });
        nodes.attr("transform", d => `translate(${d.point.x},${d.point.y})`).attr("data-entity", d => d.id).attr("data-kind", d => d.kind).attr("tabindex", d => d.kind === "ball" ? null : 0).attr("role", "button").attr("aria-label", d => `${d.team} ${d.label}, ${d.point.x.toFixed(1)}, ${d.point.y.toFixed(1)} meters`).attr("aria-pressed", d => String(d.id === selected)).classed("selected", d => d.id === selected).on("click", (_, d) => { if (d.kind !== "ball") choose(d); }).on("keydown", (event, d) => { if (["Enter", " "].includes(event.key) && d.kind !== "ball") { event.preventDefault(); choose(d); } });
        nodes.select("circle").attr("r", d => d.kind === "ball" ? 0.8 : 1.3).attr("fill", d => d.kind === "ball" ? "white" : color(d.team));
        nodes.select("text").attr("y", -2).text(d => labels ? (d.label.match(/\d+$/)?.[0] || d.label) : "");
        nodes.select("title").text(d => `${d.team} · ${d.label} · ${d.point.x.toFixed(2)}, ${d.point.y.toFixed(2)} m`);
        const entity = data.entities.find(d => d.id === selected);
        trail.attr("d", entity && !hidden.has(entity.team) ? trailAt(entity.samples, time, seconds, gap) : "").attr("stroke", entity ? color(entity.team) : "none");
        if (entity) { const p = positionAt(entity.samples, time, gap); detail.text(`${entity.team} · ${entity.label} — ${p ? `${p.x.toFixed(2)}, ${p.y.toFixed(2)} m` : "No observation"} · ${seconds}s trail`); }
        const current = events.filter(e => e.time <= time + 1e-8).at(-1);
        eventButtons.attr("aria-current", e => e === current ? "true" : null);
        if (overlay) paintMetrics(time);
      }
      function paintMetrics(time) {
        const metrics = fieldMetrics(data, time, { ...metricOptions, selected: showSeparation && selected ? selected : null });
        const payload = { layer: layer.label, time, teams: showShape ? metrics.teams : null, separation: showSeparation ? metrics.separation : null, window: null };
        if (showShape) {
          windowSummary = windowSummary || fieldMetricsWindow(data, metricWindow, metricOptions);
          payload.window = windowSummary;
          overlay.selectAll("rect.field-shape-box").data(metrics.teams.filter(t => t.width !== null && !hidden.has(t.team)), t => t.team).join("rect").attr("class", "field-shape-box").attr("data-team", t => t.team).attr("x", t => t.minX).attr("y", t => t.minY).attr("width", t => t.depth).attr("height", t => t.width).attr("stroke", t => color(t.team)).attr("fill", t => color(t.team));
          shapeTable.select("caption").text(`Team shape at ${time.toFixed(2)} s`);
          shapeTable.select("tbody").selectAll("tr").data(metrics.teams, t => t.team).join(enter => { const tr = enter.append("tr"); tr.append("th").attr("scope", "row"); ["n", "width", "depth"].forEach(key => tr.append("td").attr("data-metric", key)); return tr; }).attr("data-team", t => t.team).call(tr => { tr.select("th").text(t => t.team); for (const key of ["n", "width", "depth"]) tr.select(`td[data-metric="${key}"]`).attr("data-value", t => String(t[key])).text(t => key === "n" ? String(t.n) : metric(t[key])); });
          windowLabel.text(`Window ${metricWindow[0].toFixed(2)}–${metricWindow[1].toFixed(2)} s · ${windowSummary.sampled} sampled frames`);
          windowTable.select("tbody").selectAll("tr").data(windowSummary.teams, t => t.team).join(enter => { const tr = enter.append("tr"); tr.append("th").attr("scope", "row"); ["frames", "width", "depth"].forEach(key => tr.append("td").attr("data-metric", key)); return tr; }).attr("data-team", t => t.team).call(tr => { tr.select("th").text(t => t.team); tr.select('td[data-metric="frames"]').text(t => String(t.frames)); for (const key of ["width", "depth"]) tr.select(`td[data-metric="${key}"]`).attr("data-value", t => JSON.stringify(t[key])).text(t => [t[key].mean, t[key].min, t[key].max].map(metric).join(" / ")); });
        }
        if (showSeparation) {
          const s = metrics.separation, self = s && data.entities.find(d => d.id === s.entity);
          const lines = s && s.opponent && !hidden.has(self.team) && !hidden.has(data.entities.find(d => d.id === s.opponent.entity).team) ? [s] : [];
          const link = separationLayer.selectAll("g.field-separation-link").data(lines).join(enter => { const g = enter.append("g").attr("class", "field-separation-link"); g.append("line"); g.append("text"); return g; });
          link.select("line").attr("x1", d => d.x).attr("y1", d => d.y).attr("x2", d => d.opponent.x).attr("y2", d => d.opponent.y).attr("data-distance", d => d.opponent.distance);
          link.select("text").attr("x", d => (d.x + d.opponent.x) / 2).attr("y", d => (d.y + d.opponent.y) / 2 + 3).text(d => `${metric(d.opponent.distance)} m`);
          const name = id => { const e = data.entities.find(d => d.id === id); return `${e.team} · ${e.label}`; };
          const near = (role, n) => n ? `nearest ${role} ${name(n.entity)} at ${metric(n.distance)} m` : `no ${role} position`;
          separationText.text(!selected ? "Select a player to measure separation." : s ? `${name(s.entity)}: ${near("opponent", s.opponent)}; ${near("teammate", s.teammate)}.` : `${name(selected)}: no valid position at this time.`)
            .attr("data-opponent", s?.opponent?.entity ?? null).attr("data-opponent-distance", s?.opponent ? String(s.opponent.distance) : null)
            .attr("data-teammate", s?.teammate?.entity ?? null).attr("data-teammate-distance", s?.teammate ? String(s.teammate.distance) : null);
        }
        chart.emit("fieldMetrics", payload);
      }
      const controller = playback(data.times, paint);
      view = { data: layer.data, mapping: layer.mapping, options: layer.options, label: layer.label, root, controller, dispose() { controller.dispose(); root.remove(); chart.off("destroy", view.dispose); if (chart.runtime?.field === view) chart.runtime.field = null; } };
      chart.runtime.field = view;
      chart.on("destroy", view.dispose);
      paint();
    }
    const margin = chart.margin || chart.config.layout.margin;
    view.root.style("--field-label-size", `${Math.max(1.7, 1110 / Math.max(280, chart.width - margin.left - margin.right))}px`);
    view.root.attr("width", Math.max(0, chart.width - margin.left - margin.right)).attr("height", Math.max(0, chart.height - margin.top - margin.bottom));
  }

  remove(chart, layer) { if (chart.runtime?.field?.label === layer.label) chart.runtime.field.dispose(); }
}
