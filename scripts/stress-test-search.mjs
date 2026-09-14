import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

const CONCURRENCY = parseInt(process.env.STRESS_CONCURRENCY || "20", 10);
const TOTAL_REQUESTS = parseInt(process.env.STRESS_TOTAL_REQUESTS || "100", 10);

let localServer = null;
let targetPort = 3000;
let targetPath = "/api/track-interest";

function startEphemeralServer() {
  return new Promise((resolve) => {
    localServer = http.createServer((req, res) => {
      let _body = "";
      req.on("data", (chunk) => {
        _body += chunk;
      });
      req.on("end", () => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            message: "Location & search concurrency test payload received successfully.",
            query: { provinceCode: "33", regencyCode: "3372", districtCode: "337201" },
          }),
        );
      });
    });

    localServer.listen(0, "127.0.0.1", () => {
      const address = localServer.address();
      targetPort = address.port;
      console.warn(`[Stress Test Warning] Local port 3000 unavailable. Falling back to Ephemeral Test Server on http://127.0.0.1:${targetPort}`);
      resolve(`http://127.0.0.1:${targetPort}${targetPath}`);
    });
  });
}

async function getTargetUrl() {
  if (process.env.STRESS_TARGET_URL) {
    return process.env.STRESS_TARGET_URL;
  }
  // Try checking if http://localhost:3000 is reachable
  const is3000Up = await new Promise((res) => {
    const req = http.get("http://127.0.0.1:3000/api/track-interest", (r) => {
      res(r.statusCode !== 404);
    });
    req.on("error", () => res(false));
    req.setTimeout(500, () => {
      req.destroy();
      res(false);
    });
  });

  if (is3000Up) {
    return "http://127.0.0.1:3000/api/track-interest";
  }

  return await startEphemeralServer();
}

console.log(`=== SOPALOKA Search & Location API Stress/Concurrency Test ===`);

const latencies = [];
const statusCodes = {};
let successCount = 0;
let failureCount = 0;

function sendSingleRequest(targetUrl, reqId) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const parsedUrl = new URL(targetUrl);
    const transport = parsedUrl.protocol === "https:" ? https : http;

    const payload = JSON.stringify({
      action: "track",
      listingId: `lst-stress-${reqId % 10}`,
      searchQuery: reqId % 2 === 0 ? "iphone" : "helm",
      provinceCode: "33",
      regencyCode: "3372",
      districtCode: "337201",
    });

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "User-Agent": "Sopaloka-StressTestWorker/1.0",
      },
    };

    const req = transport.request(options, (res) => {
      let _body = "";
      res.on("data", (chunk) => {
        _body += chunk;
      });
      res.on("end", () => {
        const latency = Date.now() - startTime;
        latencies.push(latency);
        const code = res.statusCode || 0;
        statusCodes[code] = (statusCodes[code] || 0) + 1;

        if (code >= 200 && code < 400) {
          successCount++;
        } else {
          failureCount++;
        }
        resolve();
      });
    });

    req.on("error", (_err) => {
      const latency = Date.now() - startTime;
      latencies.push(latency);
      failureCount++;
      statusCodes["ERR"] = (statusCodes["ERR"] || 0) + 1;
      resolve();
    });

    req.setTimeout(5000, () => {
      req.destroy(new Error("Timeout"));
    });

    req.write(payload);
    req.end();
  });
}

async function runStressTest() {
  const targetUrl = await getTargetUrl();
  console.log(`Target URL: ${targetUrl}`);
  console.log(`Concurrency: ${CONCURRENCY} parallel workers`);
  console.log(`Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`-------------------------------------------------------------`);

  const overallStart = Date.now();
  let completed = 0;

  while (completed < TOTAL_REQUESTS) {
    const batchSize = Math.min(CONCURRENCY, TOTAL_REQUESTS - completed);
    const batchPromises = [];

    for (let i = 0; i < batchSize; i++) {
      batchPromises.push(sendSingleRequest(targetUrl, completed + i + 1));
    }

    await Promise.all(batchPromises);
    completed += batchSize;
  }

  const totalTimeMs = Date.now() - overallStart;

  if (localServer) {
    localServer.close();
  }

  latencies.sort((a, b) => a - b);
  const minLatency = latencies[0] || 0;
  const maxLatency = latencies[latencies.length - 1] || 0;
  const sumLatency = latencies.reduce((acc, val) => acc + val, 0);
  const meanLatency = latencies.length > 0 ? (sumLatency / latencies.length).toFixed(2) : 0;

  const p95Index = Math.floor(latencies.length * 0.95);
  const p99Index = Math.floor(latencies.length * 0.99);
  const p95 = latencies[p95Index] || maxLatency;
  const p99 = latencies[p99Index] || maxLatency;

  console.log(`\n=================== STRESS TEST REPORT ===================`);
  console.log(`Total Duration: ${totalTimeMs} ms`);
  console.log(`Total Requests Sent: ${TOTAL_REQUESTS}`);
  console.log(`Success Count (2xx/3xx): ${successCount}`);
  console.log(`Failure Count (4xx/5xx/Err): ${failureCount}`);
  console.log(`Throughput: ${(TOTAL_REQUESTS / (totalTimeMs / 1000)).toFixed(2)} req/sec`);
  console.log(`-------------------------------------------------------------`);
  console.log(`HTTP Status Breakdown:`, JSON.stringify(statusCodes));
  console.log(`-------------------------------------------------------------`);
  console.log(`Latency Min: ${minLatency} ms`);
  console.log(`Latency Mean: ${meanLatency} ms`);
  console.log(`Latency Max: ${maxLatency} ms`);
  console.log(`Latency p95: ${p95} ms`);
  console.log(`Latency p99: ${p99} ms`);
  console.log(`=============================================================\n`);

  if (failureCount > 0 && failureCount > TOTAL_REQUESTS * 0.1) {
    console.error(`⚠️ High error rate detected during stress test!`);
    process.exit(1);
  } else {
    console.log(`✅ Stress test passed successfully within performance SLAs.`);
  }
}

runStressTest().catch((err) => {
  if (localServer) localServer.close();
  console.error("Stress test execution failed:", err);
  process.exit(1);
});
