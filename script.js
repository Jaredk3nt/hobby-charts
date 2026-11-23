const SVG_NS = 'http://www.w3.org/2000/svg';
// Colors
const TEXT_COLOR = '#333';
const LINE_COLOR = '#32a852';
const PLOT_LINE_COLOR = '#aaaaaa55';
// Sizes
const PLOT_LINE_WIDTH = 4;
const X_PLOT_SPACE = 72;
const Y_PLOT_SPACE = 128;
const PLOT_COL_GAP = 128;
const HANDLE_DISTANCE = 100;
const PLOT_TEXT_PADDING = 24;
const PLOT_TEXT_SPACING = 2;

// TODO: this needs to be set based on the size of the container not the window
function getSize(columns) {
  return { height: window.innerHeight, width: Y_PLOT_SPACE + ((columns + 1) * PLOT_COL_GAP) };
}

function prepPlot(
  columns // num
) {
  const { height, width } = getSize(columns);
  const plot = document.getElementById('plot');
  plot.setAttribute('height', height);
  plot.setAttribute('width', width);
  return plot;
}

// TODO: make a class so we can init with data and access it everywhere
function prepCanvas(columns) {
  const { height, width } = getSize(columns);
  const canvas = document.getElementById('graph');
  const ctx = canvas.getContext('2d');

  canvas.width = width;
  canvas.height = height;

  return ctx;
}


// Assumes moving FORWARD
function drawLine(
  ctx,
  start, // { x, y }
  end, // { x, y }
  style // { color, width }
) {
  ctx.beginPath();
  ctx.strokeStyle = style?.color || LINE_COLOR;
  ctx.lineWidth = style?.width || 10;
  ctx.moveTo(start.x, start.y);
  ctx.bezierCurveTo(
    start.x + HANDLE_DISTANCE,
    start.y,
    end.x - HANDLE_DISTANCE,
    end.y,
    end.x,
    end.y
  );
  ctx.stroke();
}

// TODO: make the font dynamic from vars
function getTextWidth(text, font = "500 16px sans-serif") {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = font;
  return context.measureText(text).width;
}

function breakString(word, width, hyphenCharacter = '-') {
  const characters = word.split("");
  const lines = [];
  let currentLine = "";

  characters.forEach((character, index) => {
    const nextLine = `${currentLine}${character}`;
    const lineWidth = getTextWidth(nextLine);
    if (lineWidth >= width) {
      const currentCharacter = index + 1;
      const isLastLine = characters.length === currentCharacter;
      const hyphenatedNextLine = `${nextLine}${hyphenCharacter}`;
      lines.push(isLastLine ? nextLine : hyphenatedNextLine);
      currentLine = "";
    } else {
      currentLine = nextLine;
    }
  });

  return { hyphenatedStrings: lines, remainingWord: currentLine };
}

function breakTextForWrap(text, space) {
  const words = text.split(' ');
  const lines = [];
  let next = '';

  words.forEach((w, i) => {
    const len = getTextWidth(`${w} `);
    const nextLen = getTextWidth(next);

    if (len > space) {
      const { hyphenatedStrings, remainingWord } = breakString(w, space);
      lines.push(next, ...hyphenatedStrings);
      next = remainingWord;
    } else if (nextLen + len >= space) {
      lines.push(next);
      next = w;
    } else {
      next = [next, w].filter(Boolean).join(" ");
    }

    const current = i + 1;
    const isLastWord = current === words.length;
    if (isLastWord) {
      lines.push(next);
    }
  });

  return lines.filter(l => l !== '');
}

function drawPlotText(
  root,
  text,
  location, // { x, y }
  style // { fill, familiy, size, anchor, width }
) {
  const parts = breakTextForWrap(text, Y_PLOT_SPACE - 16);
  const el = document.createElementNS(SVG_NS, "text");
  el.setAttribute("fill", style?.fill ?? TEXT_COLOR);
  el.setAttribute("font-family", style?.family ?? "sans-serif");
  el.setAttribute("font-size", style?.size ?? "16px");
  el.setAttribute('x', location.x);
  el.setAttribute('y', location.y);
  el.setAttribute('text-anchor', style?.anchor ?? 'middle')
  parts.forEach((p, i) => {
    const tspan = document.createElementNS(SVG_NS, 'tspan');
    tspan.setAttribute('x', location.x);
    tspan.setAttribute('dy', i === 0 ? '0' : '1.2em');
    tspan.textContent = p;
    el.appendChild(tspan);
  });
  root.appendChild(el);
}

function drawPlotLine(
  root,
  start, // { x, y }
  end, // { x, y }
  style // { color, width }
) {
  const el = document.createElementNS(SVG_NS, 'line');
  el.setAttribute('x1', start.x);
  el.setAttribute('y1', start.y);
  el.setAttribute('x2', end.x);
  el.setAttribute('y2', end.y);
  el.setAttribute('stroke', style?.color ?? PLOT_LINE_COLOR);
  el.setAttribute('stroke-width', style?.width ?? PLOT_LINE_WIDTH);
  // TODO: do we need to return these ever?
  root.appendChild(el);
}

/**
 * Hobby 1 |-----|------|------
 * Hobby 2 |-----|------|------
 *         |_____|______|_______
 *             2000    2001 
 */
// TODO: resize events should redraw
function drawPlot(
  plot,
  rows, // [string]
  cols, // [string]
) {
  const { width, height } = getSize(cols.length);
  const plotHeight = height - X_PLOT_SPACE;
  // Total height for each line based on the
  const rowHeight = plotHeight / (rows.length + 1);
  // Y Boundary
  drawPlotLine(
    plot,
    { x: Y_PLOT_SPACE, y: 0 },
    { x: Y_PLOT_SPACE, y: plotHeight }
  );
  // X Boundary
  drawPlotLine(
    plot,
    { x: Y_PLOT_SPACE, y: plotHeight },
    { x: Y_PLOT_SPACE + (PLOT_COL_GAP * (cols.length + 1)), y: plotHeight }
  )
  // Draw row lines
  rows.forEach((text, i) => {
    const num = i + 1;
    drawPlotLine(
      plot,
      { x: Y_PLOT_SPACE, y: rowHeight * num },
      { x: Y_PLOT_SPACE + ((cols.length + 1) * PLOT_COL_GAP), y: rowHeight * num },
    );
    drawPlotText(
      plot,
      text,
      { x: Y_PLOT_SPACE - PLOT_TEXT_PADDING, y: rowHeight * num },
      { anchor: 'end' }
    );
  });
  // Draw column lines 
  cols.forEach((text, i) => {
    const num = i + 1;
    drawPlotLine(
      plot,
      { x: Y_PLOT_SPACE + (num * PLOT_COL_GAP), y: plotHeight },
      { x: Y_PLOT_SPACE + (num * PLOT_COL_GAP), y: 0 }
    );
    drawPlotText(
      plot,
      text,
      { x: Y_PLOT_SPACE + (num * PLOT_COL_GAP), y: plotHeight + PLOT_TEXT_PADDING }
    );
  });
}

function drawGraph(
  canvas,
  lines // [ [{ x, y }, { x, y }] ]
) {
  lines.forEach(([start, end]) => {
    drawLine(canvas, start, end)
  })
}

// Hobbies must always go for one year
function convertHobbiesToPoints(data) {
  const points = []; // Array of tuples: [start, end]
  const { height } = getSize(data.hobbies.length);
  // Total height of the plot
  const plotHeight = height - X_PLOT_SPACE;
  // Total height for each line based on the
  const rowHeight = plotHeight / (data.hobbies.length + 1);
  data.hobbies.forEach(({ id, start, end, parents }, i) => {
    console.log({ id, parents });
    const num = i + 1;
    const hobbyYLoc = rowHeight * num
    // If parents - draw lines leading to start node
    if (parents && parents.length > 0) {
      // Where the parent lines will end (the start node)
      const pStart = { x: ((start - data.startYear) * PLOT_COL_GAP) + Y_PLOT_SPACE, y: hobbyYLoc };
      const lastYear = start - 1;
      parents.forEach((pid) => {
        const pos = data.hobbies.findIndex(({ id }) => id === pid);
        console.log({
          pid,
          parentStart: { x: ((lastYear - data.startYear) * PLOT_COL_GAP) + Y_PLOT_SPACE, y: rowHeight * (pos + 1) },
          pStart,
        })
        points.push([
          // TODO: make a function for this
          { x: ((lastYear - data.startYear) * PLOT_COL_GAP) + Y_PLOT_SPACE, y: rowHeight * (pos + 1) },
          pStart,
        ])
      })
    }
    // Draw lines for each year it was "on"
    const duration = Array.from({ length: (end ?? data.endYear) - start }, (_, i) => String(start + i));
    console.log(duration);
    duration.forEach((year) => {
      console.log(year);
      const s = { x: ((year - data.startYear) * PLOT_COL_GAP) + Y_PLOT_SPACE, y: hobbyYLoc };
      const e = { x: (((year + 1) - data.startYear) * PLOT_COL_GAP) + Y_PLOT_SPACE, y: hobbyYLoc };
      points.push([s, e])
    });
  });
  return points;
}

const data = {
  startYear: 2014,
  endYear: 2026,
  hobbies: [
    {
      title: 'Trad Climbing',
      id: 'trad',
      start: 2020,
      end: null,
      parents: ['rock'],
    },
    {
      title: 'Rock Climbing', id: 'rock',
      start: 2018,
      end: null,
      parents: ['gym'],
    },
    {
      title: 'Gym Climbing', id: 'gym',
      start: 2014,
      end: null,
      parents: [],
    },
    {
      title: 'Skiing', id: 'ski',
      start: 2014,
      end: null,
      parents: [],
    },
    {
      title: 'Ski Touring', id: 'ski-tour',
      start: 2022,
      end: null,
      parents: ['ski'],
    },
    {
      title: 'Mountaineering', id: 'mntnr',
      start: 2023,
      end: null,
      parents: ['rock'],
    },
    {
      title: 'Ski Mountaineering', id: 'skimo',
      start: 2024,
      end: null,
      parents: ['ski-tour', 'mntnr'],
    },
  ],

}

const hobbyLabels = data.hobbies.map(({ title }) => title);
const yearLabels = Array.from({ length: data.endYear - data.startYear }, (_, i) => String(data.startYear + i));

const plot = prepPlot(yearLabels.length);
const canvas = prepCanvas(yearLabels.length);

drawPlot(plot, hobbyLabels, yearLabels);
drawGraph(canvas, convertHobbiesToPoints(data));

