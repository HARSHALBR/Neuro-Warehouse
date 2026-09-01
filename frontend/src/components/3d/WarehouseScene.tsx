"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { WarehouseFullState, RobotState } from "@/hooks/useWarehouseSocket";

interface WarehouseSceneProps {
  state: WarehouseFullState | null;
  onSelectRobot?: (robotId: string) => void;
}

function createCrispTagTexture(title: string, sub: string, bgCol: string, borderCol: string, textCol = "#ffffff") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 512, 160);

    // Pill background
    ctx.fillStyle = bgCol;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(16, 12, 480, 136, 24);
    } else {
      ctx.rect(16, 12, 480, 136);
    }
    ctx.fill();

    // Border
    ctx.lineWidth = 10;
    ctx.strokeStyle = borderCol;
    ctx.stroke();

    // Title
    ctx.fillStyle = textCol;
    ctx.font = "bold 56px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(title, 256, 56);

    // Subtitle
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(sub, 256, 114);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export default function WarehouseScene({ state }: WarehouseSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const robotMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const routeLinesRef = useRef<Map<string, THREE.Line>>(new Map());
  const targetPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const targetMarkerRef = useRef<THREE.Mesh | null>(null);
  const shelfMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Camera Target lerp tracking
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(15, 0, 10));

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#070a11");
    scene.fog = new THREE.FogExp2("#070a11", 0.01);
    sceneRef.current = scene;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 500);
    camera.position.set(15, 25, 26);
    camera.lookAt(15, 0, 10);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // 4. Industrial Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xe0f2fe, 1.4);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xffffff, 2.0);
    sun.position.set(18, 40, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x38bdf8, 1.0);
    fill.position.set(-15, 20, -10);
    scene.add(fill);

    // 5. Floor & Guidance Markings
    const floorGeo = new THREE.PlaneGeometry(32, 22);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.5,
      metalness: 0.4,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(15, 0, 10);
    floor.receiveShadow = true;
    scene.add(floor);

    // Clean subtle grid
    const gridHelper = new THREE.GridHelper(32, 32, 0x1e293b, 0x0f172a);
    gridHelper.position.set(15, 0.015, 10);
    gridHelper.scale.set(1, 1, 22 / 32);
    scene.add(gridHelper);

    // High-visibility perimeter
    const borderEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(32, 0.05, 22));
    const borderLine = new THREE.LineSegments(borderEdges, new THREE.LineBasicMaterial({ color: 0x0ea5e9, linewidth: 3 }));
    borderLine.position.set(15, 0.02, 10);
    scene.add(borderLine);

    // 6. Charging Stations (x=1, y=1..4)
    for (let y = 1; y <= 4; y++) {
      const padGeo = new THREE.BoxGeometry(1.4, 0.06, 1.4);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.7 });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(1, 0.03, y);
      scene.add(pad);
    }

    // 7. Dropoff Delivery Bays (x=28, y=5, 10, 15)
    [5, 10, 15].forEach((y, idx) => {
      const dropGeo = new THREE.BoxGeometry(1.6, 0.08, 1.6);
      const dropMat = new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0xb45309, emissiveIntensity: 0.7 });
      const drop = new THREE.Mesh(dropGeo, dropMat);
      drop.position.set(28, 0.04, y);
      scene.add(drop);

      // Bay sign
      const bayTex = createCrispTagTexture(`BAY 0${idx + 1}`, "DROPOFF", "#78350f", "#f59e0b", "#fef3c7");
      const bayMat = new THREE.SpriteMaterial({ map: bayTex, transparent: true });
      const baySprite = new THREE.Sprite(bayMat);
      baySprite.scale.set(1.8, 0.55, 1);
      baySprite.position.set(28, 1.8, y);
      scene.add(baySprite);
    });

    // 8. Industrial Warehouse Shelving Racks with Bins
    const shelfCols = [6, 12, 18, 24];
    const shelfRows = [3, 4, 5, 6, 8, 9, 10, 11, 13, 14, 15, 16];
    const crateColors = [0x3b82f6, 0xf59e0b, 0x10b981, 0x6366f1, 0xec4899];

    shelfCols.forEach((col, cIdx) => {
      // Overhead Aisle Banner
      const aisleTex = createCrispTagTexture(`AISLE 0${cIdx + 1}`, "RACK ZONE", "#0f172a", "#38bdf8", "#38bdf8");
      const aisleMat = new THREE.SpriteMaterial({ map: aisleTex, transparent: true });
      const aisleSprite = new THREE.Sprite(aisleMat);
      aisleSprite.scale.set(2.4, 0.7, 1);
      aisleSprite.position.set(col, 3.2, 1.8);
      scene.add(aisleSprite);

      shelfRows.forEach((row, rIdx) => {
        const rackGroup = new THREE.Group();
        rackGroup.position.set(col, 0, row);

        // Rack Frame
        const frameGeo = new THREE.BoxGeometry(0.9, 1.8, 0.9);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.8 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.y = 0.9;
        frame.castShadow = true;
        frame.receiveShadow = true;
        rackGroup.add(frame);

        // Inventory Storage Crate
        const crateColor = crateColors[(cIdx * 5 + rIdx) % crateColors.length];
        const crateGeo = new THREE.BoxGeometry(0.75, 0.45, 0.75);
        const crateMat = new THREE.MeshStandardMaterial({ color: crateColor, roughness: 0.3 });
        const crate = new THREE.Mesh(crateGeo, crateMat);
        crate.position.y = 1.0;
        crate.name = `crate_${col}_${row}`;
        rackGroup.add(crate);

        scene.add(rackGroup);
        shelfMeshesRef.current.set(`${col},${row}`, crate);
      });
    });

    // 9. Pulsing Target Pick Waypoint Ring
    const targetGeo = new THREE.RingGeometry(0.6, 0.9, 32);
    const targetMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const targetMarker = new THREE.Mesh(targetGeo, targetMat);
    targetMarker.rotation.x = -Math.PI / 2;
    targetMarker.position.set(7, 0.05, 7);
    targetMarker.visible = false;
    scene.add(targetMarker);
    targetMarkerRef.current = targetMarker;

    // Camera Orbit Controls
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !cameraRef.current) return;
      const dx = (e.clientX - prevX) * 0.004;
      const dy = (e.clientY - prevY) * 0.004;
      prevX = e.clientX;
      prevY = e.clientY;

      cameraRef.current.position.x -= dx * 14;
      cameraRef.current.position.z -= dy * 14;
      cameraRef.current.position.y = Math.max(12, Math.min(38, cameraRef.current.position.y + dy * 10));
      cameraRef.current.lookAt(cameraTargetRef.current);
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (!cameraRef.current) return;
      const zoomDelta = e.deltaY * 0.025;
      cameraRef.current.position.y = Math.max(10, Math.min(45, cameraRef.current.position.y + zoomDelta));
      cameraRef.current.position.z = Math.max(10, Math.min(45, cameraRef.current.position.z + zoomDelta));
      cameraRef.current.lookAt(cameraTargetRef.current);
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    dom.addEventListener("wheel", onWheel, { passive: true });

    // Resize
    const onResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth Robot Kinematics Interpolation
      robotMeshesRef.current.forEach((mesh, rId) => {
        const target = targetPositionsRef.current.get(rId);
        if (target) {
          mesh.position.x += (target.x - mesh.position.x) * 0.22;
          mesh.position.z += (target.y - mesh.position.z) * 0.22;
        }

        // Animate Failure Hazard Beacon
        if (mesh.userData.status === "FAILED") {
          const s = 1.0 + Math.sin(elapsed * 12) * 0.3;
          const aura = mesh.getObjectByName("hazardAura") as THREE.Mesh;
          if (aura) aura.scale.set(s, s, s);
        }

        // Animate Recovering Robot Neon Pulse
        if (mesh.userData.status === "RECOVERING") {
          const ps = 1.0 + Math.sin(elapsed * 8) * 0.2;
          const ring = mesh.getObjectByName("statusRing") as THREE.Mesh;
          if (ring) ring.scale.set(ps, ps, ps);
        }
      });

      // Pulse Pick Waypoint Marker
      if (targetMarkerRef.current && targetMarkerRef.current.visible) {
        const ts = 1.0 + Math.sin(elapsed * 8) * 0.25;
        targetMarkerRef.current.scale.set(ts, ts, ts);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dom.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Synchronize Live State from WebSocket
  useEffect(() => {
    if (!sceneRef.current || !state) return;
    const scene = sceneRef.current;

    let hasFailedRobot = false;

    Object.entries(state.robots || {}).forEach(([rId, robot]: [string, RobotState]) => {
      targetPositionsRef.current.set(rId, { x: robot.position[0], y: robot.position[1] });

      let group = robotMeshesRef.current.get(rId);

      // 1. Build Recognizable AGV Vehicle Geometry
      if (!group) {
        const newGroup = new THREE.Group();
        newGroup.name = `robot_${rId}`;
        newGroup.position.set(robot.position[0], 0.2, robot.position[1]);

        // Heavy Lower AGV Chassis
        const chassisGeo = new THREE.BoxGeometry(0.95, 0.32, 0.95);
        const chassisMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(robot.color || "#0284c7"),
          roughness: 0.3,
          metalness: 0.8,
        });
        const chassis = new THREE.Mesh(chassisGeo, chassisMat);
        chassis.position.y = 0.16;
        chassis.castShadow = true;
        newGroup.add(chassis);

        // 4 Industrial Wheel Hubs
        const wheelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.8 });
        [[-0.45, -0.4], [-0.45, 0.4], [0.45, -0.4], [0.45, 0.4]].forEach(([wx, wz]) => {
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.1, wz);
          newGroup.add(wheel);
        });

        // Glowing Status Underglow Ring
        const ringGeo = new THREE.RingGeometry(0.55, 0.72, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x10b981,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.name = "statusRing";
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.03;
        newGroup.add(ring);

        // Emergency Hazard Halo
        const auraGeo = new THREE.RingGeometry(0.72, 1.1, 32);
        const auraMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
        const aura = new THREE.Mesh(auraGeo, auraMat);
        aura.name = "hazardAura";
        aura.rotation.x = -Math.PI / 2;
        aura.position.y = 0.02;
        aura.visible = false;
        newGroup.add(aura);

        // Sensor Turret Dome
        const turretGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.18, 24);
        const turretMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
        const turret = new THREE.Mesh(turretGeo, turretMat);
        turret.position.y = 0.38;
        newGroup.add(turret);

        // High-DPI Floating Badge Sprite
        const spriteTex = createCrispTagTexture(rId, `${Math.round(robot.battery)}% BATTERY`, "#0f172a", "#38bdf8");
        const spriteMat = new THREE.SpriteMaterial({ map: spriteTex, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.name = "textSprite";
        sprite.scale.set(1.9, 0.58, 1);
        sprite.position.set(0, 1.1, 0);
        newGroup.add(sprite);

        scene.add(newGroup);
        robotMeshesRef.current.set(rId, newGroup);
        group = newGroup;
      }

      group.userData = { id: rId, status: robot.status };

      // 2. Live Visual Badges & Material Updates
      const ring = group.getObjectByName("statusRing") as THREE.Mesh;
      const aura = group.getObjectByName("hazardAura") as THREE.Mesh;
      const sprite = group.getObjectByName("textSprite") as THREE.Sprite;

      if (robot.status === "FAILED") {
        hasFailedRobot = true;
        if (ring) (ring.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
        if (aura) aura.visible = true;
        if (sprite) {
          sprite.material.map = createCrispTagTexture(`🔴 ${rId}`, "STALLED / FAILED", "#7f1d1d", "#ef4444", "#fecaca");
          sprite.material.needsUpdate = true;
        }
      } else if (robot.status === "RECOVERING") {
        if (ring) (ring.material as THREE.MeshBasicMaterial).color.setHex(0xa855f7);
        if (aura) aura.visible = false;
        if (sprite) {
          sprite.material.map = createCrispTagTexture(`⚡ ${rId}`, "RECOVERING O104", "#581c87", "#c084fc", "#f3e8ff");
          sprite.material.needsUpdate = true;
        }
      } else if (robot.status === "CHARGING") {
        if (ring) (ring.material as THREE.MeshBasicMaterial).color.setHex(0x06b6d4);
        if (aura) aura.visible = false;
        if (sprite) {
          sprite.material.map = createCrispTagTexture(`🔋 ${rId}`, `${Math.round(robot.battery)}% CHARGING`, "#0c4a6e", "#38bdf8", "#e0f2fe");
          sprite.material.needsUpdate = true;
        }
      } else {
        // Normal Fleet
        if (ring) (ring.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
        if (aura) aura.visible = false;
        if (sprite) {
          sprite.material.map = createCrispTagTexture(`${rId}`, `${Math.round(robot.battery)}% BATTERY`, "#0f172a", "#38bdf8", "#ffffff");
          sprite.material.needsUpdate = true;
        }
      }

      // 3. Thick Glowing 3D A* Navigation Ribbons
      let line = routeLinesRef.current.get(rId);
      if (robot.route && robot.route.length > 1) {
        const points = robot.route.map((pt) => new THREE.Vector3(pt[0], 0.14, pt[1]));
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

        if (!line) {
          const lineMat = new THREE.LineBasicMaterial({
            color: robot.status === "RECOVERING" ? 0xd946ef : 0x0284c7,
            linewidth: robot.status === "RECOVERING" ? 6 : 3,
            transparent: true,
            opacity: 0.95,
          });
          line = new THREE.Line(lineGeo, lineMat);
          scene.add(line);
          routeLinesRef.current.set(rId, line);
        } else {
          line.geometry.dispose();
          line.geometry = lineGeo;
          (line.material as THREE.LineBasicMaterial).color.setHex(
            robot.status === "RECOVERING" ? 0xd946ef : 0x0284c7
          );
          line.visible = true;
        }
      } else if (line) {
        line.visible = false;
      }
    });

    if (targetMarkerRef.current) {
      targetMarkerRef.current.visible = hasFailedRobot;
    }
  }, [state]);

  return (
    <div className="relative w-full h-full min-h-[580px] bg-[#070a11] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left Floating Digital Twin Badge */}
      <div className="absolute top-4 left-4 bg-[#090d16]/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/80 text-xs font-mono flex items-center gap-3 shadow-xl">
        <span className="flex items-center gap-2 font-bold text-slate-100">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]"></span>
          AUTONOMOUS DIGITAL TWIN
        </span>
        <span className="text-slate-400">| 10Hz Kinematics • 30×20 Grid</span>
      </div>

      {/* Bottom Floating Legend */}
      <div className="absolute bottom-4 left-4 bg-[#090d16]/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/80 text-xs flex gap-5 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
          <span className="font-semibold text-slate-200">Active Fleet</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping shadow-[0_0_10px_#ef4444]"></span>
          <span className="font-bold text-red-400">Failed (R04)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-fuchsia-500 shadow-[0_0_10px_#d946ef]"></span>
          <span className="font-bold text-fuchsia-300">Recovering (R07)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
          <span className="font-semibold text-slate-200">Charging Bays</span>
        </div>
      </div>
    </div>
  );
}
