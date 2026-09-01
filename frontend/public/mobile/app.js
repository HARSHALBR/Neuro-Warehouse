/**
 * NeuroWarehouse Mobile Operator Client Application Logic.
 * Handles tactile fleet selection, direct FastAPI dispatching, Web Speech API, and real-time WebSocket sync.
 */

const host = typeof window !== "undefined" ? (window.location.hostname || "localhost") : "localhost";
const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "https:" : "http:";
const wsProtocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";

const CONFIG = {
  FASTAPI_BASE_URL: `${protocol}//${host}:8000`,
  N8N_WEBHOOK_URL: `${protocol}//${host}:5678/webhook/phone-incident`,
  WS_URL: `${wsProtocol}//${host}:8000/ws/warehouse`,
};

let currentRoutingMode = "direct"; // Default to direct FastAPI for instantaneous zero-latency response
let selectedRobotId = "R04";
let socket = null;
let recognition = null;
let isListening = false;
let isScanning = false;
let localFleet = {};

// 1. Initialize Fleet State & Grid
function initFleetGrid() {
  const grid = document.getElementById("robotGrid");
  if (!grid) return;
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
  const label = document.getElementById("selectedRobotLabel");
  if (label) label.innerText = `Selected: ${robotId}`;

  document.querySelectorAll(".robot-btn").forEach((btn) => {
    btn.classList.remove("selected");
  });

  const selectedBtn = document.getElementById(`btnRobot_${robotId}`);
  if (selectedBtn) {
    selectedBtn.classList.add("selected");
  }
}

// 3. Routing Mode Toggle (Direct vs n8n)
function setRoutingMode(mode) {
  currentRoutingMode = mode;
  const n8nBtn = document.getElementById("btnRouteN8N");
  const directBtn = document.getElementById("btnRouteDirect");
  if (n8nBtn) n8nBtn.classList.toggle("active", mode === "n8n");
  if (directBtn) directBtn.classList.toggle("active", mode === "direct");

  const infoEl = document.getElementById("routingInfo");
  if (infoEl) {
    if (mode === "n8n") {
      infoEl.innerText = `Forwarding via n8n Broker: ${CONFIG.N8N_WEBHOOK_URL}`;
    } else {
      infoEl.innerText = `Forwarding directly to FastAPI: ${CONFIG.FASTAPI_BASE_URL}/api/v1/events/phone-trigger`;
    }
  }
}

// 4. Dispatch Event (Phone -> Direct FastAPI or n8n -> LangGraph)
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
      if (currentRoutingMode === "n8n") {
        logEvent(`[WARN] n8n unreachable, falling back to direct FastAPI endpoint...`, "failure");
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

// 5. Handle and Display Recovery Response
function handleRecoveryResponse(data) {
  logEvent(`[RESPONSE] Status: ${data.status} | Candidate: ${data.selected_robot_id || "N/A"}`);

  const banner = document.getElementById("confirmationBanner");
  const msgEl = document.getElementById("confirmMsg");
  const detailsEl = document.getElementById("confirmDetails");

  if (!banner || !msgEl || !detailsEl) return;

  if (data.status === "SUCCESS" || data.status === "RECOVERED") {
    banner.className = "confirm-banner visible success";
    msgEl.innerText = `⚡ ${data.message || `Assigned to ${data.selected_robot_id}`}`;
    detailsEl.innerText = `A* Path Length: ${data.route_length || 15} waypoints | Battery: ${data.battery || 84}%`;

    // Trigger Phone Haptic Feedback Vibration
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 200]);
    }
  } else {
    banner.className = "confirm-banner visible error";
    msgEl.innerText = `⚠️ ${data.message || "Failed to calculate recovery candidate."}`;
    detailsEl.innerText = "Check warehouse fleet status.";
  }

  setTimeout(() => {
    banner.className = "confirm-banner";
  }, 7000);
}

// 6. Real-Time Telemetry Logging
function logEvent(text, type = "normal") {
  const list = document.getElementById("eventList");
  if (!list) return;

  const item = document.createElement("div");
  item.className = `event-item ${type}`;
  const now = new Date().toLocaleTimeString();
  item.innerText = `[${now}] ${text}`;
  list.prepend(item);

  if (list.children.length > 20) {
    list.removeChild(list.lastChild);
  }
}

// 7. Voice Command Handler
function toggleVoiceCommand() {
  const voiceBtn = document.getElementById("btnVoice");
  const feedback = document.getElementById("sensorFeedback");
  const msgEl = document.getElementById("sensorMessage");

  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    alert("Speech recognition is not supported on this browser.");
    return;
  }

  if (isListening) {
    if (recognition) recognition.stop();
    isListening = false;
    voiceBtn.classList.remove("listening");
    feedback.style.display = "none";
    return;
  }

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRec();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening = true;
    voiceBtn.classList.add("listening");
    feedback.style.display = "block";
    msgEl.innerText = "🎙️ Listening... (say 'Robot 4 stalled' or 'Fail R04')";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toUpperCase();
    msgEl.innerText = `Heard: "${transcript}"`;
    logEvent(`[VOICE] Recognized: "${transcript}"`);

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
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach((t) => t.stop());
    }
    if (video) video.style.display = "none";
    if (feedback) feedback.style.display = "none";
    isScanning = false;
    return;
  }

  if (feedback) feedback.style.display = "block";
  if (msgEl) msgEl.innerText = "📷 Point camera at Robot QR code / asset marker...";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    if (video) {
      video.srcObject = stream;
      video.style.display = "block";
      video.play();
    }
    isScanning = true;

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
    if (msgEl) msgEl.innerText = `Camera error: ${err.message}. Using simulated QR trigger on ${selectedRobotId}.`;
    setTimeout(() => {
      dispatchIncident(selectedRobotId, `Simulated QR Scan on ${selectedRobotId}`);
      if (feedback) feedback.style.display = "none";
    }, 1200);
  }
}

// 9. Real-Time WebSocket Telemetry
function initWebSocket() {
  const dot = document.getElementById("wsDot");
  const status = document.getElementById("wsStatus");

  try {
    socket = new WebSocket(CONFIG.WS_URL);

    socket.onopen = () => {
      if (dot) dot.className = "dot connected";
      if (status) status.innerText = "Live 10Hz";
      logEvent("[WS] Connected to Digital Twin stream.");
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "TICK" && payload.robots) {
          updateFleetUI(payload.robots);
        }
      } catch (_) {}
    };

    socket.onclose = () => {
      if (dot) dot.className = "dot";
      if (status) status.innerText = "Offline";
      setTimeout(initWebSocket, 3000);
    };

    socket.onerror = () => {
      if (dot) dot.className = "dot";
      if (status) status.innerText = "Error";
    };
  } catch (e) {
    if (status) status.innerText = "Failed";
  }
}

function updateFleetUI(robots) {
  localFleet = robots;
  Object.entries(robots).forEach(([rId, r]) => {
    const batEl = document.getElementById(`bat_${rId}`);
    const btn = document.getElementById(`btnRobot_${rId}`);
    if (batEl) {
      batEl.innerText = `${Math.round(r.battery)}%`;
    }
    if (btn) {
      btn.classList.toggle("failed", r.status === "FAILED");
      btn.classList.toggle("recovering", r.status === "RECOVERING");
    }
  });
}

// Initialize on Load
window.addEventListener("DOMContentLoaded", () => {
  initFleetGrid();
  initWebSocket();
  setRoutingMode("direct");
});
