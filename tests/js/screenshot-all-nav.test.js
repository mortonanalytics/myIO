import { beforeEach, describe, expect, test } from "vitest";
import {
  navbarFromDocument,
  slug,
  subTabsFromDocument
} from "../../scripts/screenshot-all.js";

// Mirrors the demo app's shinydashboard/bslib navbar: a mix of dropdown menus
// and plain top-level tabs, two of which own a nested tabset.
var NAVBAR = [
  '<ul class="nav navbar-nav">',
  '  <li><a class="nav-link" data-value="Home" href="#tab-1">Home</a></li>',
  '  <li class="dropdown">',
  '    <a class="nav-link dropdown-toggle" href="#">Basic Charts</a>',
  '    <ul class="dropdown-menu">',
  '      <li><a href="#tab-2">Bar</a></li>',
  '      <li><a href="#tab-3">Grouped Bar</a></li>',
  '    </ul>',
  '  </li>',
  '  <li><a class="nav-link" data-value="Financial" href="#tab-4">Financial</a></li>',
  '  <li><a class="nav-link" data-value="Relational" href="#tab-5">Relational</a></li>',
  '</ul>'
].join("");

function pane(id, active, inner) {
  return (
    '<div class="tab-pane' + (active ? " active" : "") + '" id="' + id + '">' + inner + "</div>"
  );
}

var SUBTABS = [
  '<ul class="nav nav-tabs">',
  '  <li><a href="#sub-1">Candlestick</a></li>',
  '  <li><a href="#sub-2">Waterfall</a></li>',
  '</ul>'
].join("");

describe("navbarFromDocument", function() {
  beforeEach(function() {
    document.body.innerHTML = NAVBAR;
  });

  test("enumerates every top-level entry, dropdown or plain tab", function() {
    var items = navbarFromDocument();
    expect(items.map(function(i) { return i.label; })).toEqual([
      "Home",
      "Basic Charts",
      "Financial",
      "Relational"
    ]);
  });

  test("classifies dropdown toggles separately from plain tabs", function() {
    var items = navbarFromDocument();
    var kinds = {};
    items.forEach(function(i) { kinds[i.label] = i.kind; });
    expect(kinds["Basic Charts"]).toBe("dropdown");
    // Financial and Relational are plain top-level tabs, not dropdowns: the
    // previous script assumed a "Financial" dropdown and crashed on them.
    expect(kinds.Financial).toBe("tab");
    expect(kinds.Relational).toBe("tab");
    expect(kinds.Home).toBe("tab");
  });

  test("returns dropdown menu items as children", function() {
    var basic = navbarFromDocument().find(function(i) { return i.label === "Basic Charts"; });
    expect(basic.children).toEqual(["Bar", "Grouped Bar"]);
  });

  test("plain tabs carry no children", function() {
    var financial = navbarFromDocument().find(function(i) { return i.label === "Financial"; });
    expect(financial.children).toEqual([]);
  });
});

describe("subTabsFromDocument", function() {
  test("reads the nested tabset of the active pane", function() {
    document.body.innerHTML = NAVBAR + pane("tab-4", true, SUBTABS);
    expect(subTabsFromDocument()).toEqual(["Candlestick", "Waterfall"]);
  });

  test("ignores nested tabsets belonging to inactive panes", function() {
    document.body.innerHTML =
      NAVBAR + pane("tab-4", false, SUBTABS) + pane("tab-5", true, "<div></div>");
    expect(subTabsFromDocument()).toEqual([]);
  });

  test("never mistakes the navbar itself for a nested tabset", function() {
    document.body.innerHTML = NAVBAR + pane("tab-1", true, "<div></div>");
    expect(subTabsFromDocument()).toEqual([]);
  });

  test("de-duplicates repeated labels", function() {
    document.body.innerHTML = NAVBAR + pane("tab-4", true, SUBTABS + SUBTABS);
    expect(subTabsFromDocument()).toEqual(["Candlestick", "Waterfall"]);
  });
});

describe("slug", function() {
  test("joins and normalises a tab path into a filename stem", function() {
    expect(slug(["Statistical", "Mean ± CI"])).toBe("statistical-mean-ci");
    expect(slug(["Statistical", "Q-Q Plot"])).toBe("statistical-q-q-plot");
    expect(slug(["Basic Charts", "Grouped Bar"])).toBe("basic-charts-grouped-bar");
  });
});
