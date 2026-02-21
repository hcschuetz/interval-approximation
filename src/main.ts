const N = 100;
const dotRadius = 3;
const inStepsScale = 20; // should be a divisor of 600


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

function dot(x: number, y: number) {
  ctx.beginPath();
  ctx.arc(posX(x), posY(y), dotRadius, 0, TAU);
  ctx.fill();
}


const numIn = document.querySelector<HTMLInputElement>("#numerator")!;
const numOut = document.querySelector<HTMLOutputElement>("#numerator-out")!;
numIn?.addEventListener("input", () => numOut.value = numIn.value);
numIn.value = numOut.value = "5";

const denomIn = document.querySelector<HTMLInputElement>("#denominator")!;
const denomOut = document.querySelector<HTMLOutputElement>("#denominator-out")!;
denomIn?.addEventListener("input", () => denomOut.value = denomIn.value);
denomIn.value = denomOut.value = "3";

const strandsIn = document.querySelector<HTMLInputElement>("#strands")!;
const strandsOut = document.querySelector<HTMLOutputElement>("#strands-out")!;
strandsIn?.addEventListener("input", () =>
  strandsOut.value = strandsIn.value === "0" ? "-" : strandsIn.value);
strandsIn.value = "0";
strandsOut.value = "-";

const absIn = document.querySelector<HTMLInputElement>("#abs")!;
absIn.checked = false;
const inStepsIn = document.querySelector<HTMLInputElement>("#in-steps")!;
inStepsIn.checked = true;

const ratioOut = document.querySelector<HTMLOutputElement>("#ratio")!;
const intervalInOctavesOut = document.querySelector<HTMLOutputElement>("#interval-in-octaves")!;
const intervalTimesStrandsOut = document.querySelector<HTMLOutputElement>("#interval-times-strands")!;

function coords() {
  ctx.strokeStyle = "#888";
  ctx.fillStyle = "#000";
  ctx.lineWidth = .5;

  line(fromX, fromY, toX, fromY);
  line(fromX, 0    , toX, 0    );
  line(fromX, toY  , toX, toY  );

  line(fromX, fromY, fromX, toY);

  // TODO eliminate "magic" numbers

  ctx.font = "10px sans";
  for (let x = fromX + 10; x <= toX; x += 10) {
    line(x, -.02, x, .02);
    ctx.fillText(x.toString(), posX(x)-5, posY(-0.05));
  }
  if (inStepsIn.checked) {
    for (const y of [fromY, 0, toY]) {
      ctx.fillText(y.toString(), posX(0), posY(y) + 5);
    }
  } else {
    for (let y = -600/inStepsScale; y <= 600/inStepsScale; y += 200/inStepsScale) {
      ctx.fillText(y.toString() + "ct", posX(0), posY(y * inStepsScale / 1200) + 5);
    }
  }
}

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
      let diff = steps - rounded;
      if (abs) diff = Math.abs(diff);
      if (!inSteps) diff = diff / n * inStepsScale;
      // console.log({n, steps, rounded, diff});
      dot(n, diff);
      if (!strands) continue;
      if (nOld > 0) {
        line(nOld, diffOld, n, diff);
      }
      [nOld, diffOld] = [n, diff];
    }
  }
}

for (const el of [numIn, denomIn, strandsIn, absIn, inStepsIn]) {
  el.addEventListener("input", () => {
    ctx.clearRect(0, 0, width, height);
    coords();
    draw();
  });
}

coords();
draw();
