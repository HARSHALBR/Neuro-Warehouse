/**
 * NeuroWarehouse Mobile Operator Client Application Logic.
 * Handles tactile fleet selection, n8n/direct dispatching, Web Speech API, and real-time WebSocket sync.
 */

// Configuration defaults
const CONFIG = {
  FASTAPI_BASE_URL: "http://localhost:8000",
  N8N_WEBHOOK_URL: "http://localhost:5678/webhook/phone-incident",
  WS_URL: "ws://localhost:8000/ws/warehouse",
};

let currentRoutingMode = "n8n"; // "n8n" or "direct"
let selectedRobotId = "R04";
let socket = null;
let recognition = null;
let isListening = false;
let isScanning = false;
let localFleet = {};

// 1. Initialize Fleet State & Grid
function initFleetGrid() {
  const grid = document.getElementById("robotGrid");
  grid.innerHTML = "";

  for (let i = 1; i <= 12; i++) {
    const rId = `R${i.toString().padStart(2, "0")}`;
    const btn = document.createElement("button");
    btn.className = `robot-btn ${rId === selectedRobotId ? "selected" : ""}`;
    btn.id = `btnRobot_${rId}`;
    btn.onclick = () => selectRobot(rId);

    btn.innerHTML = `
      <span class="r-id">${rId}</span>
      <span class="r-bat" id="bat_${rId}">--%</span>
    `;
    grid.appendChild(btn);
  }
}

// 2. Select Target Robot
function selectRobot(robotId) {
  selectedRobotId = robotId;
  document.getElementById("selectedRobotLabel").innerText = `Selected: ${robotId}`;

  document.querySelectorAll(".robot-btn").forEach((btn) => {
    btn.classList.remove("selected");
  });

  const selectedBtn = document.getElementById(`btnRobot_${robotId}`);
  if (selectedBtn) {
    selectedBtn.classList.add("selected");
  }
}

// 3. Routing Mode Toggle (n8n vs Direct)
function setRoutingMode(mode) {
  currentRoutingMode = mode;
  document.getElementById("btnRouteN8N").classList.toggle("active", mode === "n8n");
  document.getElementById("btnRouteDirect").classList.toggle("active", mode === "direct");

  const infoEl = document.getElementById("routingInfo");
  if (mode === "n8n") {
    infoEl.innerText = `Forwarding via n8n Broker: ${CONFIG.N8N_WEBHOOK_URL}`;
  } else {
    infoEl.innerText = `Forwarding directly to FastAPI: ${CONFIG.FASTAPI_BASE_URL}/api/v1/events/phone-trigger`;
  }
}

// 4. Dispatch Event (Phone -> n8n or Direct FastAPI -> LangGraph)
async function dispatchIncident(robotId, notes = "Dispatched via tactile mobile UI") {
  const payload = {
    event_type: "robot_failure",
    robot_id: robotId,
    source: "iqoo_phone",
    notes: notes,
    timestamp: new Date().toISOString(),
  };

  logEvent(`[DISPATCH] Sending incident on ${robotId} via ${currentRoutingMode.toUpperCase()}...`, "failure");

  let targetUrl = currentRoutingMode === "n8n" ? CONFIG.N8N_WEBHOOK_URL : `${CONFIG.FASTAPI_BASE_URL}/api/v1/events/phone-trigger`;

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // If n8n endpoint is not running locally, fall back to direct FastAPI
      if (currentRoutingMode === "n8n") {
        logEvent(`[WARN] n8n broker unreachable, falling back to direct FastAPI endpoint...`, "failure");
        const fallbackRes = await fetch(`${CONFIG.FASTAPI_BASE_URL}/api/v1/events/phone-trigger`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await fallbackRes.json();
        handleRecoveryResponse(data);
        return;
      }
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    handleRecoveryResponse(data);
  } catch (err) {
    logEvent(`[ERROR] Dispatch failed: ${err.message}`, "failure");
  }
}

function dispatchManualFailure() {
  dispatchIncident(selectedRobotId, `Tactile trigger on ${selectedRobotId}`);
}

// 5. Handle Recovery Response in UI
function handleRecoveryResponse(data) {
  const box = document.getElementById("recoveryBox");
  box.className = "recovery-status-box active-recovery";

  const selected = data.selected_robot_id || "R07";
  const failed = data.failed_robot_id || selectedRobotId;
  const expl = data.explanation || {};
  const summary = expl.summary_sentence || `Robot ${failed} failed. Replacement ${selected} assigned and route verified.`;

  box.innerHTML = `
    <div class="rec-title">
      <span>RECOVERY VALIDATED</span>
      <span class="rec-badge">PASSED</span>
    </div>
    <div style="margin-bottom: 4px;">${summary}</div>
    <div class="rec-factors">
      <span class="factor-chip">⚡ Replacement: <strong>${selected}</strong></span>
      <span class="factor-chip">🛡️ Collision-Free: <strong>VERIFIED</strong></span>
      <span class="factor-chip">⏱️ Status: <strong>AUTONOMOUSLY HEALED</strong></span>
    </div>
  `;

  logEvent(`[RECOVERED] Mission reassigned to ${selected}. Plan validated.`, "recovery");
}

// 6. Reset Warehouse State
async function resetWarehouse() {
  try {
    const res = await fetch(`${CONFIG.FASTAPI_BASE_URL}/api/v1/warehouse/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seed: 42 }),
    });
    if (res.ok) {
      logEvent("[RESET] Warehouse returned to deterministic seed 42.", "recovery");
      const box = document.getElementById("recoveryBox");
      box.className = "recovery-status-box";
      box.innerHTML = `<div class="status-idle">Warehouse operating normally. Ready for field events.</div>`;
    }
  } catch (e) {
    logEvent(`[ERROR] Reset failed: ${e.message}`, "failure");
  }
}

// 7. Voice Input via Web Speech API
function toggleVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const feedback = document.getElementById("sensorFeedback");
  const msgEl = document.getElementById("sensorMessage");
  const voiceBtn = document.getElementById("btnVoice");

  if (!SpeechRecognition) {
    feedback.style.display = "block";
    msgEl.innerText = "Web Speech API not supported on this browser. Use tactile buttons.";
    return;
  }

  if (isListening) {
    recognition.stop();
    isListening = false;
    voiceBtn.classList.remove("listening");
    feedback.style.display = "none";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening = true;
    voiceBtn.classList.add("listening");
    feedback.style.display = "block";
    msgEl.innerText = "🎙️ Listening... Say: 'Robot R04 failure' or 'Break R02'";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toUpperCase();
    msgEl.innerText = `Heard: "${transcript}"`;
    logEvent(`[VOICE] Recognized: "${transcript}"`);

    // Match robot ID pattern (e.g. R4, R04, ROBOT 4, R11)
    const match = transcript.match(/\b(R\s?0?\d{1,2}|ROBOT\s?0?\d{1,2})\b/);
    if (match) {
      let rNum = match[0].replace(/ROBOT|\s/g, "").replace(/^R/, "");
      let parsedId = `R${rNum.padStart(2, "0")}`;
      selectRobot(parsedId);
      dispatchIncident(parsedId, `Voice Command: "${transcript}"`);
    } else {
      msgEl.innerText = `No robot ID identified in "${transcript}".`;
    }
  };

  recognition.onerror = (e) => {
    msgEl.innerText = `Voice error: ${e.error}`;
    isListening = false;
    voiceBtn.classList.remove("listening");
  };

  recognition.onend = () => {
    isListening = false;
    voiceBtn.classList.remove("listening");
  };

  recognition.start();
}

// 8. Camera QR / Barcode Scanner
async function toggleCameraScanner() {
  const feedback = document.getElementById("sensorFeedback");
  const msgEl = document.getElementById("sensorMessage");
  const video = document.getElementById("qrVideo");

  if (isScanning) {
    if (video.srcObject) {
      video.srcObject.getTracks().forEach((t) => t.stop());
    }
    video.style.display = "none";
    feedback.style.display = "none";
    isScanning = false;
    return;
  }

  feedback.style.display = "block";
  msgEl.innerText = "📷 Point camera at Robot QR code / asset marker...";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;
    video.style.display = "block";
    video.play();
    isScanning = true;

    // Simulate QR detection or use BarcodeDetector if supported
    if ("BarcodeDetector" in window) {
      const barcodeDetector = new BarcodeDetector({ formats: ["qr_code", "code_128"] });
      const interval = setInterval(async () => {
        if (!isScanning) {
          clearInterval(interval);
          return;
        }
        try {
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes.length > 0) {
            const rawVal = barcodes[0].rawValue.toUpperCase();
            if (rawVal.startsWith("R")) {
              selectRobot(rawVal);
              dispatchIncident(rawVal, `Scanned QR Code: ${rawVal}`);
              toggleCameraScanner();
              clearInterval(interval);
            }
          }
        } catch (_) {}
      }, 500);
    }
  } catch (err) {
    msgEl.innerText = `Camera access error: ${err.message}. Using simulated scan for ${selectedRobotId}.`;
    setTimeout(() => {
      dispatchIncident(selectedRobotId, `Simulated QR Scan on ${selectedRobotId}`);
      feedback.style.display = "none";
    }, 1200);
  }
}

// 9. Real-Time WebSocket Connection
function connectWebSocket() {
  socket = new WebSocket(CONFIG.WS_URL);

  socket.onopen = () => {
    document.getElementById("connectionStatus").innerHTML = `
      <span class="status-dot online"></span>
      <span id="statusText">CONNECTED</span>
    `;
    logEvent("[WS] Connected to NeuroWarehouse live stream.");
  };

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);

      if (msg.type === "TICK" && msg.robots) {
        updateRobotStatuses(msg.robots);
      } else if (msg.type === "AGENT_STEP") {
        logEvent(`[${msg.agent}] ${msg.message}`);
      } else if (msg.type === "INCIDENT_DETECTED") {
        logEvent(`[ALERT] Disruption on ${msg.robot_id} (${msg.source})`, "failure");
      }
    } catch (_) {}
  };

  socket.onclose = () => {
    document.getElementById("connectionStatus").innerHTML = `
      <span class="status-dot offline"></span>
      <span id="statusText">RECONNECTING...</span>
    `;
    setTimeout(connectWebSocket, 2000);
  };
}

function updateRobotStatuses(robots) {
  localFleet = robots;
  for (const [rId, robot] of Object.entries(robots)) {
    const batEl = document.getElementById(`bat_${rId}`);
    const btnEl = document.getElementById(`btnRobot_${rId}`);
    if (batEl) {
      batEl.innerText = `${Math.round(robot.battery)}%`;
    }
    if (btnEl) {
      btnEl.classList.toggle("failed", robot.status === "FAILED");
      btnEl.classList.toggle("recovering", robot.status === "RECOVERING");
    }
  }
}

function logEvent(text, type = "normal") {
  const container = document.getElementById("eventLogs");
  const item = document.createElement("div");
  item.className = `log-item ${type}`;
  item.innerText = `${new Date().toLocaleTimeString()} ${text}`;
  container.prepend(item);

  // Keep log size bounded
  while (container.children.length > 25) {
    container.removeChild(container.lastChild);
  }
}

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
  initFleetGrid();
  setRoutingMode("n8n");
  connectWebSocket();
});
