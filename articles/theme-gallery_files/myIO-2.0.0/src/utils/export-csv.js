export function exportToCsv(filename, rows) {
  var jsonObject = JSON.stringify(rows);

  function convertToCSV(objArray) {
    var array = typeof objArray !== "object" ? JSON.parse(objArray) : objArray;
    var names = Object.keys(array[0]).toString();
    var str = names + "\r\n";

    for (var i = 0; i < array.length; i++) {
      var line = "";
      for (var index in array[i]) {
        if (line !== "") line += ",";
        line += array[i][index];
      }
      str += line + "\r\n";
    }

    return str;
  }

  var csvFile = convertToCSV(jsonObject);
  var blob = new Blob([csvFile], { type: "text/csv;charset=utf-8;" });
  var link = document.createElement("a");

  if (link.download !== undefined) {
    var url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
