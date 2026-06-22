HTMLWidgets.widget({
  name: "myIO",
  type: "output",
  factory: function(el, width, height) {
    return {
      renderValue: function(x) {
        if (this._myIO_bridgeCleanup) {
          try { this._myIO_bridgeCleanup(); } catch (e) { /* ignore */ }
          this._myIO_bridgeCleanup = null;
        }
        // Prior-render coordinator cleanup (if we previously registered).
        if (this._myIO_chartId && window.myIO && window.myIO.getCoordinator) {
          var prev = window.myIO.getCoordinator();
          if (prev) {
            try { prev.unregister(this._myIO_chartId); } catch (e) { /* ignore */ }
          }
        }
        if (this._myIO_xadapter) {
          try { this._myIO_xadapter.destroy(); } catch (e) { /* ignore */ }
          this._myIO_xadapter = null;
        }
        if (x.config && x.config.layers) {
          var coord = null;
          var registerCoordinatorChart = false;
          var coordinatorMarkSpec = null;
          var coordinatorQueryTemplate = "";
          if (this.myIOchart) {
            // Destroy and recreate to handle layer count/type changes cleanly.
            // The chart's "destroy" event unregisters it from the proxy registry.
            this.myIOchart.destroy();
            d3.select(el).selectAll("*").remove();
            this.myIOchart = null;
          }
          // T1.7: Coordinator boot + file-protocol override.
          // Gated on x.config.coordinator_enabled so charts without
          // setBigData() exercise zero new code paths (contract §Backward-
          // compatibility invariants).
          if (x.config && x.config.specVersion === 2 && x.config.coordinator_enabled === true) {
            // File-protocol fallback: Chromium blocks dynamic module imports
            // from origin 'null'. Degrade to SVG silently but log once.
            if (window.location.protocol === "file:") {
              if (!window._myIO_fileProtoWarned) {
                console.info(
                  "myIO: file:// protocol detected — WASM engine unavailable; " +
                  "using SVG path. Serve the HTML via servr::httd() or " +
                  "`quarto preview` to use the big-data engine."
                );
                window._myIO_fileProtoWarned = true;
              }
              x.config.engine = "svg";
            }
            // Boot the page-level coordinator (idempotent).
            if (window.myIO && typeof window.myIO.bootCoordinator === "function") {
              coord = window.myIO.bootCoordinator(x.config);
              // On re-render, unregister the previous chart id before
              // registering the new one (multi-widget lifecycle).
              if (this._myIO_chartId) {
                try { coord.unregister(this._myIO_chartId); } catch (e) { /* ignore */ }
              }
              this._myIO_chartId = (x.coordinator && x.coordinator.chart_id) || null;
              if (x.bigdata && x.bigdata.mode !== "none") {
                coord.registerSource({
                  sourceId:   x.bigdata.source_id,
                  mode:       x.bigdata.mode,
                  ipcB64:     x.bigdata.ipc_b64,
                  url:        x.bigdata.url,
                  schema:     x.bigdata.schema || [],
                  rowCount:   x.bigdata.row_count,
                  rowkeyCol:  x.bigdata.rowkey_col
                });
                // Fire-and-forget async: adapter creation + init may touch WASM.
                if (x.config.engine !== "svg") {
                  coord.ensureAdapterFor(x.bigdata.source_id, x.config.engine, x.config)
                    .catch(function(err) {
                      console.error("myIO: engine adapter init failed", err);
                    });
                }
                if (this._myIO_chartId) {
                  registerCoordinatorChart = true;
                  coordinatorMarkSpec = (x.coordinator && x.coordinator.mark_spec) || null;
                  coordinatorQueryTemplate = (x.coordinator && x.coordinator.query_template) || "";
                }
              }
              // T4.3: CrosstalkAdapter instantiation.
              if (x.crosstalk && x.crosstalk.group && window.myIO &&
                  typeof window.myIO.CrosstalkAdapter === "function") {
                // Idempotent: same source + group combo reuses an existing adapter.
                if (!this._myIO_xadapter) {
                  var xAdapter = new window.myIO.CrosstalkAdapter({
                    coordinator: coord,
                    sourceId:    x.bigdata.source_id,
                    group:       x.crosstalk.group[0] || x.crosstalk.group,
                    rowkeyCol:   (x.bigdata && x.bigdata.rowkey_col) || "__myio_rowkey__",
                    threshold:   (x.config && x.config.crosstalk_threshold) || 100000
                  });
                  xAdapter.attach();
                  // Subscribe to coordinator selection changes on this source so
                  // local brushes broadcast outward.
                  coord.subscribe(x.bigdata.source_id, function(evt) {
                    if (evt.chartId === "__crosstalk__:" + x.bigdata.source_id) {
                      // Ignore - this was OUR incoming-translated predicate.
                      return;
                    }
                    xAdapter.broadcast({ predicate: evt.predicate });
                  });
                  this._myIO_xadapter = xAdapter;
                }
              }
            }
          }
          if (!this.myIOchart) {
            this.myIOchart = new myIOchart({
              element: document.getElementById(el.id),
              config: x.config,
              width: width,
              height: height
            });
            var id = el.id;
            // Register for myIOProxy() partial updates immediately after
            // construction (before any async coordinator work) so the registry
            // never has an empty window across a re-render where an in-flight
            // proxy message could be dropped. The chart's "destroy" event reaps
            // the entry on re-render and on teardown.
            if (HTMLWidgets.shinyMode && window.myIO &&
                typeof window.myIO.registerInstance === "function") {
              window.myIO.registerInstance(id, this.myIOchart);
              window.myIO.installProxyHandler();
              this.myIOchart.on("destroy", function() {
                if (window.myIO && typeof window.myIO.unregisterInstance === "function") {
                  window.myIO.unregisterInstance(id);
                }
              });
            }
            this.myIOchart.on("error", function(e) {
              el._myIO_lastError = {
                message: e.message,
                layer: e.layer ? e.layer.label : null,
                timestamp: new Date().toISOString()
              };
              if (HTMLWidgets.shinyMode) {
                Shiny.onInputChange("myIO-" + id + "-error", e.message);
              }
            });
            if (HTMLWidgets.shinyMode) {
              this.myIOchart.on("rollover", function(e) {
                Shiny.onInputChange("myIO-" + id + "-rollover", JSON.stringify(e.data));
              });
              this.myIOchart.on("dragEnd", function(e) {
                Shiny.onInputChange("myIO-" + id + "-dragEnd", JSON.stringify(e.point));
              });
              this.myIOchart.on("brushed", function(e) {
                Shiny.onInputChange("myIO-" + id + "-brushed", JSON.stringify(e));
              });
              this.myIOchart.on("annotated", function(e) {
                Shiny.onInputChange("myIO-" + id + "-annotated", JSON.stringify(e));
              });
            }
          }
          if (coord && registerCoordinatorChart && this._myIO_chartId && this.myIOchart) {
            var resultHandler = null;
            if (coordinatorQueryTemplate && x.config && x.config.engine !== "svg" &&
                window.myIO &&
                typeof window.myIO.createCoordinatorResultHandler === "function") {
              resultHandler = window.myIO.createCoordinatorResultHandler({
                chart:       this.myIOchart,
                coordinator: coord,
                chartId:     this._myIO_chartId,
                markSpec:    coordinatorMarkSpec,
                rowCount:    x.bigdata && x.bigdata.row_count,
                threshold:   x.config && x.config.webgl_threshold,
                unifyDataPath: x.config && x.config.unify_data_path === true,
                layerIndex:  0
              });
              if (resultHandler && resultHandler.destroy) {
                this._myIO_bridgeCleanup = resultHandler.destroy;
              }
            }
            coord.register({
              chartId:       this._myIO_chartId,
              queryTemplate: coordinatorQueryTemplate,
              markSpec:      coordinatorMarkSpec,
              sourceHandle:  { sourceId: x.bigdata.source_id, engine: x.config && x.config.engine },
              predicateFn:   function() { return null; },
              onResult:      resultHandler ? resultHandler.onResult : null
            });
            if (resultHandler && window.myIO) {
              window.myIO._debugBridgeState = window.myIO._debugBridgeState || {};
              window.myIO._debugBridgeState[this._myIO_chartId] = resultHandler;
              window.myIO._debugBridge = function(chartId) {
                return window.myIO._debugBridgeState &&
                  window.myIO._debugBridgeState[chartId];
              };
            }
          }
        }
      },
      resize: function(width, height) {
        if ((width === 0 || height === 0) && this._myIO_chartId && window.myIO && window.myIO.getCoordinator) {
          var coord = window.myIO.getCoordinator();
          if (coord) {
            try { coord.unregister(this._myIO_chartId); } catch (e) { /* ignore */ }
          }
          this._myIO_chartId = null;
        }
        if (this.myIOchart) {
          if (this.myIOchart.facetController) {
            this.myIOchart.facetController.resize();
          } else {
            this.myIOchart.resize(width, height);
          }
        }
      }
    };
  }
});
