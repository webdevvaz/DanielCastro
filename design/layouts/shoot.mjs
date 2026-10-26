// Renders one layout proposal with headless Microsoft Edge (Windows) through the DevTools
// protocol, so phone shots use a real 390 px screen.
//
//   node shoot.mjs <page.html> <out.png> desktop        full page at 1440 px
//   node shoot.mjs <page.html> <out.png> phone          the first phone screen (390 x 844)
//   node shoot.mjs <page.html> <out.png> phone-full     the whole page at phone width
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";

const [page, output, mode = "desktop"] = process.argv.slice(2);
const phone = mode !== "desktop";
const width = phone ? 390 : 1440;
const height = phone ? 844 : 900;
const port = 9340;

const edge = spawn(
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${process.env.TEMP}/edge-layout-shots`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

try {
  let target;

  for (let attempt = 0; attempt < 40 && target === undefined; attempt++) {
    await sleep(250);

    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
        method: "PUT",
      });
      target = await response.json();
    } catch {}
  }

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done) => socket.addEventListener("open", done, { once: true }));

  let nextId = 0;
  const pending = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);

    if (message.id !== undefined) pending.get(message.id)?.(message);
  });

  const send = (method, params = {}) =>
    new Promise((done) => {
      const id = ++nextId;

      pending.set(id, done);
      socket.send(JSON.stringify({ id, method, params }));
    });

  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: phone,
  });
  await send("Page.navigate", { url: pathToFileURL(resolve(page)).href });
  await sleep(3500);

  // In a full-page shot, fixed or sticky bars would sit in the middle of the picture; the
  // `capture` class lets each page lay them out flat.
  if (mode !== "phone") {
    await send("Runtime.evaluate", {
      expression: "document.documentElement.classList.add('capture')",
    });
  }

  const measured = await send("Runtime.evaluate", {
    expression: "document.documentElement.scrollHeight",
    returnByValue: true,
  });
  const fullHeight = mode === "phone" ? height : measured.result.result.value;

  const shot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: mode !== "phone",
    clip: { x: 0, y: 0, width, height: fullHeight, scale: 1 },
  });

  writeFileSync(output, Buffer.from(shot.result.data, "base64"));
  console.log(`${output}: ${width} x ${fullHeight}`);
  socket.close();
} finally {
  edge.kill();
}
