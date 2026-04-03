(function () {
  var COLS = 40;
  var ROWS = 10;
  var NBSP = "\xa0";

  var nodes = new Array(ROWS)
    .fill(0)
    .map(function () {
      var n = document.createComment("");
      document.insertBefore(n, document.firstChild);
      return n;
    })
    .reverse();

  function render(lines) {
    for (var i = 0; i < ROWS; i++) {
      nodes[i].nodeValue = (lines[i] || "")
        .replace(/ /g, NBSP)
        .padEnd(COLS, NBSP)
        .substr(0, COLS);
    }
  }

  function createVT(cols, rows) {
    var screen = [];
    var cx = 0;
    var cy = 0;
    for (var r = 0; r < rows; r++) screen[r] = new Array(cols).fill(" ");

    function scroll() {
      screen.shift();
      screen.push(new Array(cols).fill(" "));
      cy = rows - 1;
    }

    function put(ch) {
      if (cx >= cols) {
        cx = 0;
        cy++;
      }
      if (cy >= rows) scroll();
      screen[cy][cx++] = ch;
    }

    function parse(data) {
      for (var i = 0; i < data.length; i++) {
        var ch = data[i];

        if (ch === "\x1b") {
          if (++i >= data.length) break;
          if (data[i] === "]") {
            for (i++; i < data.length; i++) {
              if (data[i] === "\x07") break;
              if (data[i] === "\x1b" && data[i + 1] === "\\") {
                i++;
                break;
              }
            }
            continue;
          }
          if (data[i] === "[") {
            var params = "";
            for (
              i++;
              i < data.length && data[i] >= "\x20" && data[i] <= "\x3f";
              i++
            )
              params += data[i];
            if (i >= data.length) break;
            var cmd = data[i];
            var nums = params.split(";").map(function (s) {
              return parseInt(s, 10) || 0;
            });

            switch (cmd) {
              case "H":
              case "f":
                cy = Math.min((nums[0] || 1) - 1, rows - 1);
                cx = Math.min((nums[1] || 1) - 1, cols - 1);
                break;
              case "A":
                cy = Math.max(cy - (nums[0] || 1), 0);
                break;
              case "B":
                cy = Math.min(cy + (nums[0] || 1), rows - 1);
                break;
              case "C":
                cx = Math.min(cx + (nums[0] || 1), cols - 1);
                break;
              case "D":
                cx = Math.max(cx - (nums[0] || 1), 0);
                break;
              case "J":
                if (nums[0] === 2 || nums[0] === 3) {
                  for (var r = 0; r < rows; r++) screen[r].fill(" ");
                  cx = 0;
                  cy = 0;
                } else if (nums[0] === 1) {
                  for (var r = 0; r < cy; r++) screen[r].fill(" ");
                  for (var c = 0; c <= cx; c++) screen[cy][c] = " ";
                } else {
                  for (var c = cx; c < cols; c++) screen[cy][c] = " ";
                  for (var r = cy + 1; r < rows; r++) screen[r].fill(" ");
                }
                break;
              case "K":
                if (nums[0] === 2) screen[cy].fill(" ");
                else if (nums[0] === 1) {
                  for (var c = 0; c <= cx; c++) screen[cy][c] = " ";
                } else {
                  for (var c = cx; c < cols; c++) screen[cy][c] = " ";
                }
                break;
            }
            continue;
          }
          continue;
        }

        if (ch === "\r") {
          cx = 0;
          continue;
        }
        if (ch === "\n") {
          cy++;
          if (cy >= rows) scroll();
          continue;
        }
        if (ch === "\x08") {
          if (cx > 0) cx--;
          continue;
        }
        if (ch === "\t") {
          cx = Math.min(cx + (8 - (cx % 8)), cols - 1);
          continue;
        }
        if (ch < "\x20") continue;

        put(ch);
      }
    }

    return {
      parse: parse,
      getLines: function () {
        return screen.map(function (row) {
          return row.join("");
        });
      },
    };
  }

  function parseCast(text) {
    var lines = text.trim().split("\n");
    var header = JSON.parse(lines[0]);
    var events = [];
    for (var i = 1; i < lines.length; i++) {
      try {
        var ev = JSON.parse(lines[i]);
        if (ev[1] === "o") events.push({ time: ev[0], data: ev[2] });
      } catch (e) {}
    }
    return { header: header, events: events };
  }

  function buildFrames(cast) {
    var cols = Math.min(cast.header.width || COLS, COLS);
    var rows = Math.min(cast.header.height || ROWS, ROWS);
    var vt = createVT(cols, rows);
    var frames = [];
    var step = 0.1;
    var idx = 0;
    var end = cast.events.length ? cast.events[cast.events.length - 1].time : 0;

    for (var t = 0; t <= end + step; t += step) {
      while (idx < cast.events.length && cast.events[idx].time <= t) {
        vt.parse(cast.events[idx].data);
        idx++;
      }
      frames.push(vt.getLines().slice());
    }
    return frames;
  }

  var recordings = [
    "hello.cast",
    "hack.cast",
    "neofetch.cast",
    "matrix.cast",
    "coffee.cast",
    "fortune.cast",
    "todo.cast",
    "cowsay.cast",
    "gameoflife.cast",
  ];

  function playSequence(index) {
    if (index >= recordings.length) index = 0;
    fetch("/casts/" + recordings[index])
      .then(function (r) {
        return r.text();
      })
      .then(function (text) {
        var frames = buildFrames(parseCast(text));
        var frame = 0;
        var timer = setInterval(function () {
          if (frame >= frames.length) {
            clearInterval(timer);
            playSequence(index + 1);
            return;
          }
          render(frames[frame++]);
        }, 100);
      })
      .catch(function () {
        playSequence(index + 1);
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    playSequence(Math.floor(Math.random() * recordings.length));
  });
})();
