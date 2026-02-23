const N = 100;
const dotRadius = 3;


const TAU = 2 * Math.PI;

const canvas = document.querySelector<HTMLCanvasElement>('#out')!;
const ctx = canvas.getContext("2d")!;

const {width, height} = canvas;
const paddingX = 15, fromX = 0, toX = N;
const paddingY = 5, fromY = -.5, toY = .5;


const scaleX = (width - 2 * paddingX) / (toX - fromX);
const offsetX = paddingX - scaleX * fromX;
const posX = (x: number) => scaleX * x + offsetX;

const scaleY = (height - 2 * paddingY);
const offsetY = paddingY - scaleY * fromY;
const posY = (y: number, max: number) => scaleY/(2*max) * -y + offsetY;

function line(x1: number, y1: number, x2: number, y2: number, maxY: number) {
  ctx.beginPath();
  ctx.moveTo(posX(x1), posY(y1, maxY));
  ctx.lineTo(posX(x2), posY(y2, maxY));
  ctx.stroke();
}

type Dot = {
  X: number, Y: number,
  onin: (ev: PointerEvent) => void,
  onout: () => void;
};

const dots: Dot[] = [];

function dot(
  x: number, y: number, maxY: number,
  onin: (ev: PointerEvent) => void,
  onout: () => void,
) {
  ctx.beginPath();
  const X = posX(x);
  const Y = posY(y, maxY);
  dots.push({X, Y, onin, onout});
  ctx.arc(X, Y, dotRadius, 0, TAU);
  ctx.fill();
}

let latestDot: Dot | undefined = undefined;

function handlePointerEvent(ev: PointerEvent) {
  const {left, top} = canvas.getBoundingClientRect();
  const {clientX, clientY} = ev;
  let X = clientX - left;
  let Y = clientY - top;
  let closestDot = dots[0];
  let closestDotDistSquare = Number.MAX_VALUE;
  for (let dot of dots) {
    const distSqare = (X-dot.X)**2 + (Y-dot.Y)**2;
    if (distSqare < closestDotDistSquare) {
      closestDot = dot;
      closestDotDistSquare = distSqare;
    }
  }
  if (closestDotDistSquare < 5**2) {
    if (closestDot !== latestDot) {
      latestDot?.onout();
      latestDot = closestDot;
      closestDot.onin(ev);
    }
  } else {
    latestDot?.onout();
    latestDot = undefined;
  }
}
for (const eventType of ["pointerenter", "pointermove", "pointerdown"] as const) {
  canvas.addEventListener(eventType, handlePointerEvent);
}
canvas.addEventListener("pointerleave", () => latestDot?.onout());


const numIn = document.querySelector<HTMLInputElement>("#numerator")!;
const numOut = document.querySelector<HTMLOutputElement>("#numerator-out")!;

const denomIn = document.querySelector<HTMLInputElement>("#denominator")!;
const denomOut = document.querySelector<HTMLOutputElement>("#denominator-out")!;

const absIn = document.querySelector<HTMLInputElement>("#abs")!;
const absOut = document.querySelector<HTMLInputElement>("#abs-out")!;

const inStepsIn = document.querySelector<HTMLInputElement>("#in-steps")!;
const inStepsOut = document.querySelector<HTMLInputElement>("#in-steps-out")!;

const maxCentsLabel = document.querySelector<HTMLLabelElement>('label[for="max-cents"]')!;
const maxCentsIn = document.querySelector<HTMLInputElement>("#max-cents")!;
const maxCentsOut = document.querySelector<HTMLOutputElement>("#max-cents-out")!;

const limitsIn = document.querySelector<HTMLInputElement>("#limits")!;
// const limitsOut = document.querySelector<HTMLOutputElement>("#limits-out")!;

const strandsIn = document.querySelector<HTMLInputElement>("#strands")!;
const strandsOut = document.querySelector<HTMLOutputElement>("#strands-out")!;

const ratioOut = document.querySelector<HTMLOutputElement>("#ratio")!;
const intervalInOctavesOut = document.querySelector<HTMLOutputElement>("#interval-in-octaves")!;
const intervalTimesStrandsOut = document.querySelector<HTMLOutputElement>("#interval-times-strands")!;


function coords() {
  ctx.strokeStyle = "#888";
  ctx.fillStyle = "#000";
  ctx.lineWidth = .5;

  line(fromX, 0    , toX, 0    , toY);
  line(fromX, fromY, fromX, toY, toY);

  // TODO eliminate "magic" numbers

  ctx.font = "10px sans";
  for (let x = fromX + 10; x <= toX; x += 10) {
    line(x, -.04, x, .04, 1);
    ctx.fillText(x.toString(), posX(x)-5, posY(-0.1, 1));
  }
  if (inStepsIn.checked) {
    for (const y of [fromY, 0, toY]) {
      ctx.fillText(y.toString(), posX(0), posY(y, toY) + 3);
    }
    if (limitsIn.checked) {
      line(fromX, toY  , toX, toY  , toY);
      if (!absIn.checked) {
        line(fromX, fromY, toX, fromY, toY);
      }
    }
  } else {
    const maxCents = Number.parseInt(maxCentsIn.value);
    ctx.fillText("0ct", posX(0), posY(0, maxCents) + 3);
    const centsTick =
      maxCents < 20 ? 5 :
      maxCents < 50 ? 10 :
      maxCents < 100 ? 20 :
      maxCents < 200 ? 50 :
      100;
    // The `toY` here is because posY(...) is "calibrated" to this value.
    // It might be cleaner to pass the range to posY(...). 
    for (let y = centsTick; y <= maxCents; y += centsTick) {
      ctx.fillText(`-${y.toFixed()}ct`, posX(0), posY(-y, maxCents) + 3);
      ctx.fillText(`+${y.toFixed()}ct`, posX(0), posY(+y, maxCents) + 3);
    }
    if (limitsIn.checked) {
      let xOld = 0, yOld = 0;
      for (let x = 1; x < toX; x += 0.3) {
        const y = 0.5 / x * 1200;
        if (xOld) {
          line(xOld, +yOld, x, +y, maxCents);
          if (!absIn.checked) {
            line(xOld, -yOld, x, -y, maxCents);
          }
        }
        [xOld, yOld] = [x, y];
      }
    }
  }
}

const dotInfo = document.querySelector<HTMLOutputElement>("#dot-info")!;

function draw() {
  const ratio = Number.parseInt(numIn.value) / Number.parseInt(denomIn.value);
  const inOctaves = Math.log2(ratio);
  const strands = Number.parseInt(strandsIn.value);
  const m = Math.max(1, strands);
  const abs = absIn.checked;
  const inSteps = inStepsIn.checked;
  const maxCents = Number.parseInt(maxCentsIn.value);

  ratioOut.value = ratio.toString();
  intervalInOctavesOut.value = inOctaves.toString();
  intervalTimesStrandsOut.value = strands ? (inOctaves * m).toString() : "-";

  dots.length = 0;

  ctx.lineWidth = 1;
  for (let rest = 0; rest < m; rest ++) {
    ctx.strokeStyle = ctx.fillStyle =
      strands ? `hsl(${rest/m}turn 100% 50%)` : "#000";
    let nOld = 0; let diffOld = 0;
    for (let n = rest; n <= N; n += m) {
      if (n === 0) continue;
      const steps = inOctaves * n;
      const rounded = Math.round(steps);
      const diff = rounded - steps;
      const diff2 = abs ? Math.abs(diff) : diff;
      const diff3 = inSteps ? diff2 : diff2 / n * 1200;
      const maxY = inSteps ? toY : maxCents;
      dot(n, diff3, maxY,
         ev => {
          dotInfo.style.display = "block";
          dotInfo.style.left = Math.min(ev.clientX, window.innerWidth - 400) + "px";
          dotInfo.style.top  = (ev.clientY + 10) + "px";
          dotInfo.value =
`${rounded}/${n
} = ${(rounded/n).toFixed(5)
} = log₂(${numIn.value}/${denomIn.value}) ${diff < 0 ? "-" : "+"} ${(Math.abs(diff)/n).toFixed(5)}
where
${(diff / n).toFixed(5)} octaves = ${
  (diff / n * 1200).toFixed(2)} ct = ${
  diff.toFixed(5)} steps`;
        },
        () => {
          dotInfo.style.display = "none";
        },
      );
      if (!strands) continue;
      if (nOld > 0) {
        line(nOld, diffOld, n, diff3, maxY);
      }
      [nOld, diffOld] = [n, diff3];
    }
  }
}

for (const elem of [numIn, denomIn, absIn, inStepsIn, maxCentsIn, limitsIn, strandsIn]) {
  elem.addEventListener("input", () =>
    location.hash = (new URLSearchParams({
      num: numIn.value,
      denom: denomIn.value,
      unsigned: absIn.checked ? "true" : "false",
      inSteps: inStepsIn.checked ? "true" : "false",
      maxCents: maxCentsIn.value,
      limits: limitsIn.checked ? "true" : "false",
      strands: strandsIn.value,
    })).toString()
  );
}

function handleHash() {
  const params = new URLSearchParams(location.hash.substring(1));

  numOut.value = numIn.value = params.get("num") ?? "5";
  denomOut.value = denomIn.value = params.get("denom") ?? "3";

  absIn.checked = params.get("unsigned") === "true";
  absOut.value = absIn.checked ? "unsigned" : "signed";

  {
    const checked = inStepsIn.checked = params.get("inSteps") === "true";
    inStepsOut.value = checked ? "measure in steps" : "measure in cents";
    maxCentsIn.disabled = checked;
    maxCentsLabel.style.opacity = maxCentsOut.style.opacity = checked ? "0.5" : "1";
  }

  {
    const value = maxCentsIn.value = params.get("maxCents") ?? "60";
    maxCentsOut.value = `-${value}ct ... +${value}ct`;
  }

  limitsIn.checked = params.get("limits") === "true";
  // limitsOut.value = ... // anything sensible to write here?

  {
    const value = params.get("strands") ?? "0";
    strandsIn.value = value;
    strandsOut.value = value === "0" ? "-" : value;
  }

  ctx.clearRect(0, 0, width, height);
  coords();
  draw();
}

window.addEventListener("hashchange", handleHash);
handleHash();
