// Shiny transport prototype: prove directionality.
// Browser -> R: Shiny.setInputValue (NOT Shiny.sendCustomMessage, which does not exist).
// R -> browser: Shiny.addCustomMessageHandler listening for session$sendCustomMessage.
$(document).on("shiny:connected", function() {
  Shiny.addCustomMessageHandler("myio:end", function(msg) {
    window.__myioRoundTrip = msg;
    document.title = "OK:" + msg.queryId;
    console.log("[myio] R->browser myio:end", msg);
  });
  setTimeout(function() {
    var payload = {
      v: 1,
      queryId: "qid_test",
      templateId: "test",
      sourceId: "test",
      bindings: []
    };
    console.log("[myio] browser->R setInputValue", payload);
    Shiny.setInputValue("myio_query", payload, { priority: "event" });
  }, 200);
});
