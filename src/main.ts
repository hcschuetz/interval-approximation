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

const scaleY = (height - 2 * paddingY) / (toY - fromY);
const offsetY = paddingY - scaleY * fromY;
const posY = (y: number) => scaleY * -y + offsetY;

function line(x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath();
  ctx.moveTo(posX(x1), posY(y1));
  ctx.lineTo(posX(x2), posY(y2));
  ctx.stroke();
}

type Dot = {
  X: number, Y: number,
  onin: (ev: PointerEvent) => void,
  onout: () => void;
};

const dots: Dot[] = [];

function dot(x: number, y: number, onin: (ev: PointerEvent) => void, onout: () => void) {
  ctx.beginPath();
  const X = posX(x);
  const Y = posY(y);
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
// canvas.addEventListener("pointerleave", () => latestDot?.onout());


const numIn = document.querySelector<HTMLInputElement>("#numerator")!;
const numOut = document.querySelector<HTMLOutputElement>("#numerator-out")!;
numIn.addEventListener("input", () => numOut.value = numIn.value);
numIn.value = numOut.value = "5";

const denomIn = document.querySelector<HTMLInputElement>("#denominator")!;
const denomOut = document.querySelector<HTMLOutputElement>("#denominator-out")!;
denomIn.addEventListener("input", () => denomOut.value = denomIn.value);
denomIn.value = denomOut.value = "3";

const strandsIn = document.querySelector<HTMLInputElement>("#strands")!;
const strandsOut = document.querySelector<HTMLOutputElement>("#strands-out")!;
strandsIn.addEventListener("input", () =>
  strandsOut.value = strandsIn.value === "0" ? "-" : strandsIn.value);
strandsIn.value = "4";
strandsIn.dispatchEvent(new InputEvent("input"));

const absIn = document.querySelector<HTMLInputElement>("#abs")!;
const absOut = document.querySelector<HTMLInputElement>("#abs-out")!;
absIn.addEventListener("change", () => {
  absOut.value = absIn.checked ? "unsigned" : "signed";
})
absIn.checked = false;
absIn.dispatchEvent(new CustomEvent("change"));

const inStepsIn = document.querySelector<HTMLInputElement>("#in-steps")!;
const inStepsOut = document.querySelector<HTMLInputElement>("#in-steps-out")!;
inStepsIn.addEventListener("change", () => {
  inStepsOut.value = inStepsIn.checked ? "measure in steps" : "measure in cents";
});
inStepsIn.checked = true;
inStepsIn.dispatchEvent(new CustomEvent("change"));

// The y axis will go from -maxCents to +maxCents:
let maxCents = 60;
const maxCentsLabel = document.querySelector<HTMLLabelElement>('label[for="max-cents"]')!;
const maxCentsIn = document.querySelector<HTMLInputElement>("#max-cents")!;
const maxCentsOut = document.querySelector<HTMLOutputElement>("#max-cents-out")!;
maxCentsIn.addEventListener("input", () => {
  const {value} = maxCentsIn;
  maxCentsOut.value = `-${value}ct ... +${value}ct`;
  maxCents = Number.parseInt(value);
});
maxCentsIn.value = maxCents.toString();
maxCentsIn.dispatchEvent(new InputEvent("input"));

inStepsIn.addEventListener("change", () => {
  const {checked} = inStepsIn;
  maxCentsIn.disabled = checked;
  maxCentsLabel.style.opacity = maxCentsOut.style.opacity = checked ? "0.5" : "1";
});
inStepsIn.dispatchEvent(new CustomEvent("change"));


const ratioOut = document.querySelector<HTMLOutputElement>("#ratio")!;
const intervalInOctavesOut = document.querySelector<HTMLOutputElement>("#interval-in-octaves")!;
const intervalTimesStrandsOut = document.querySelector<HTMLOutputElement>("#interval-times-strands")!;

function coords() {
  ctx.strokeStyle = "#888";
  ctx.fillStyle = "#000";
  ctx.lineWidth = .5;

  line(fromX, 0    , toX, 0    );
  line(fromX, fromY, fromX, toY);

  // TODO eliminate "magic" numbers

  ctx.font = "10px sans";
  for (let x = fromX + 10; x <= toX; x += 10) {
    line(x, -.02, x, .02);
    ctx.fillText(x.toString(), posX(x)-5, posY(-0.05));
  }
  if (inStepsIn.checked) {
    line(fromX, fromY, toX, fromY);
    line(fromX, toY  , toX, toY  );
    for (const y of [fromY, 0, toY]) {
      ctx.fillText(y.toString(), posX(0), posY(y) + 3);
    }
  } else {
    ctx.fillText("0ct", posX(0), posY(0) + 3);
    const centsTick =
      maxCents < 20 ? 5 :
      maxCents < 50 ? 10 :
      maxCents < 100 ? 20 :
      maxCents < 200 ? 50 :
      100;
    const scaling = 0.5 / maxCents;
    for (let y = centsTick; y <= maxCents; y += centsTick) {
      ctx.fillText(`-${y.toFixed()}ct`, posX(0), posY(-y*scaling) + 3);
      ctx.fillText(`+${y.toFixed()}ct`, posX(0), posY(+y*scaling) + 3);
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

  ratioOut.value = ratio.toString();
  intervalInOctavesOut.value = inOctaves.toString();
  intervalTimesStrandsOut.value = strands ? (inOctaves * m).toString() : "-";

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
      const diff3 = inSteps ? diff2 : diff2 * 600 / (n * maxCents);
      dot(n, diff3,
         ev => {
          dotInfo.style.display = "block";
          dotInfo.style.left = Math.min(ev.clientX, window.innerWidth - 400) + "px";
          dotInfo.style.top  = Math.min(ev.clientY, window.innerHeight - 100) + "px";
          dotInfo.value =
`${rounded}/${n} = ${(rounded/n).toFixed(5)} = log₂(${numIn.value}/${denomIn.value}) ${diff < 0 ? "-" : "+"} ${(Math.abs(diff)/n).toFixed(5)}
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
        line(nOld, diffOld, n, diff3);
      }
      [nOld, diffOld] = [n, diff3];
    }
  }
}

for (const el of [numIn, denomIn, strandsIn, absIn, inStepsIn, maxCentsIn]) {
  el.addEventListener("input", () => {
    ctx.clearRect(0, 0, width, height);
    coords();
    dots.length = 0;
    draw();
  });
}

coords();
dots.length = 0;
draw();
