import { spawnSync } from "node:child_process";
import { setTimeout } from "node:timers/promises";

const dockerReady = () =>
  spawnSync("docker", ["info"], { stdio: "ignore", timeout: 5000 }).status === 0;

const version = spawnSync("docker", ["--version"], { stdio: "ignore" });
if (version.error || version.status !== 0) {
  console.error("Install Docker Desktop before running npm run dev.");
  process.exit(1);
}

if (!dockerReady()) {
  if (process.platform !== "darwin") {
    console.error("Start Docker Desktop or your Docker daemon, then run npm run dev again.");
    process.exit(1);
  }

  console.log("Starting Docker Desktop for local development...");
  const launch = spawnSync("open", ["-a", "Docker"], { stdio: "inherit" });
  if (launch.error || launch.status !== 0) {
    console.error("Could not open Docker Desktop. Install or start it, then retry.");
    process.exit(1);
  }

  const deadline = Date.now() + 120_000;
  let ready = dockerReady();
  while (!ready && Date.now() < deadline) {
    await setTimeout(2000);
    ready = dockerReady();
  }
  if (!ready) {
    console.error("Docker did not become ready within two minutes. Check Docker Desktop and retry.");
    process.exit(1);
  }
  console.log("Docker is ready. Starting the local app...");
}
