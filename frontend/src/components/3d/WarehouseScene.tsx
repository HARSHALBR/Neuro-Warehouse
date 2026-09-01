"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { WarehouseFullState, RobotState } from "@/hooks/useWarehouseSocket";

interface WarehouseSceneProps {
  state: WarehouseFullState | null;
  onSelectRobot?: (robotId: string) => void;
}

// Crisp Canvas Texture for Floating Labels
function createCrispLabelTexture(text: string, bgColor: string, borderColor: string, textColor = "#ffffff") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 144;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 512, 144);

    // Pill background
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(16, 12, 480, 120, 24);
    } else {
      ctx.rect(16, 12, 480, 120);
    }
    ctx.fill();

    // Glowing border
    ctx.lineWidth = 10;
    ctx.strokeStyle = borderColor;
    ctx.stroke();

    // Label Text
    ctx.fillStyle = textColor;
    ctx.font = "bold 52px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 72);
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

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#080c14");
    scene.fog = new THREE.FogExp2("#080c14", 0.012);
    sceneRef.current = scene;

    // 2. Camera Setup (Optimized Command Center Isometric Angle)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 500);
    camera.position.set(15, 23, 23);
    camera.lookAt(15, 0, 9.5);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // 4. Vibrant Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.2);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xffffff, 1.8);
    mainSun.position.set(15, 35, 25);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 2048;
    mainSun.shadow.mapSize.height = 2048;
    mainSun.shadow.bias = -0.0005;
    scene.add(mainSun);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    fillLight.position.set(-10, 20, -10);
    scene.add(fillLight);

    // 5. Floor & Aisle Markings (30 x 20 Grid)
    const floorGeo = new THREE.PlaneGeometry(30, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
      metalness: 0.3,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(14.5, 0, 9.5);
    floor.receiveShadow = true;
    scene.add(floor);

    // Subtle Grid Helper
    const gridHelper = new THREE.GridHelper(30, 30, 0x334155, 0x1e293b);
    gridHelper.position.set(14.5, 0.015, 9.5);
    gridHelper.scale.set(1, 1, 20 / 30);
    scene.add(gridHelper);

    // Neon Floor Perimeter Border (Clean Outline without diagonal cross-wireframe)
    const borderEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(30, 0.05, 20));
    const borderLine = new THREE.LineSegments(borderEdges, new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 }));
    borderLine.position.set(14.5, 0.02, 9.5);
    scene.add(borderLine);

    // 6. Charging Bays (x=1, y=1..4)
    for (let y = 1; y <= 4; y++) {
      const padGeo = new THREE.BoxGeometry(1.2, 0.04, 1.2);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.8 });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(1, 0.03, y);
      scene.add(pad);
    }

    // 7. Dropoff Stations (x=28, y=5, 10, 15)
    [5, 10, 15].forEach((y) => {
      const dropGeo = new THREE.BoxGeometry(1.4, 0.06, 1.4);
      const dropMat = new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0xb45309, emissiveIntensity: 0.8 });
      const drop = new THREE.Mesh(dropGeo, dropMat);
      drop.position.set(28, 0.04, y);
      scene.add(drop);
    });

    // 8. Modular Warehouse Shelves (Detailed Racks with Colorful Storage Crates)
    const binColors = [0x3b82f6, 0xf59e0b, 0x10b981, 0xef4444, 0x8b5cf6, 0x06b6d4];
    const shelfCols = [6, 12, 18, 24];
    const shelfRows = [3, 4, 5, 6, 8, 9, 10, 11, 13, 14, 15, 16];

    shelfCols.forEach((col, cIdx) => {
      // Aisle Overhead Sign
      const aisleSignTex = createCrispLabelTexture(`AISLE ${cIdx + 1}`, "#1e293b", "#38bdf8", "#38bdf8");
      const aisleSignMat = new THREE.SpriteMaterial({ map: aisleSignTex, transparent: true });
      const aisleSign = new THREE.Sprite(aisleSignMat);
      aisleSign.scale.set(2.2, 0.6, 1);
      aisleSign.position.set(col, 2.8, 2);
      scene.add(aisleSign);

      shelfRows.forEach((row) => {
        // Shelf Metallic Frame
        const rackGroup = new THREE.Group();
        rackGroup.position.set(col, 0, row);

        const frameGeo = new THREE.BoxGeometry(0.85, 1.6, 0.85);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.7 });
        const rackMesh = new THREE.Mesh(frameGeo, frameMat);
        rackMesh.position.y = 0.8;
        rackMesh.castShadow = true;
        rackMesh.receiveShadow = true;
        rackGroup.add(rackMesh);

        // Bins on Shelf Tiers
        const binColor = binColors[(col * 3 + row) % binColors.length];
        const binGeo = new THREE.BoxGeometry(0.7, 0.35, 0.7);
        const binMat = new THREE.MeshStandardMaterial({ color: binColor, roughness: 0.4 });
        const bin = new THREE.Mesh(binGeo, binMat);
        bin.position.y = 0.9;
        rackGroup.add(bin);

        scene.add(rackGroup);
      });
    });

    // 9. Target Waypoint Highlight Ring (for active recovery)
    const targetGeo = new THREE.RingGeometry(0.5, 0.7, 32);
    const targetMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const targetMarker = new THREE.Mesh(targetGeo, targetMat);
    targetMarker.rotation.x = -Math.PI / 2;
    targetMarker.position.set(7, 0.05, 7);
    targetMarker.visible = false;
    scene.add(targetMarker);
    targetMarkerRef.current = targetMarker;

    // Mouse Controls (Pan & Orbit)
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

      cameraRef.current.position.x -= dx * 12;
      cameraRef.current.position.z -= dy * 12;
      cameraRef.current.position.y = Math.max(12, Math.min(35, cameraRef.current.position.y + dy * 8));
      cameraRef.current.lookAt(15, 0, 9.5);
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (!cameraRef.current) return;
      const zoomDelta = e.deltaY * 0.02;
      cameraRef.current.position.y = Math.max(10, Math.min(40, cameraRef.current.position.y + zoomDelta));
      cameraRef.current.position.z = Math.max(10, Math.min(40, cameraRef.current.position.z + zoomDelta));
      cameraRef.current.lookAt(15, 0, 9.5);
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    dom.addEventListener("wheel", onWheel, { passive: true });

    // Resize Handler
    const onResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // Render Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth Robot Lerp Movement
      robotMeshesRef.current.forEach((mesh, rId) => {
        const target = targetPositionsRef.current.get(rId);
        if (target) {
          mesh.position.x += (target.x - mesh.position.x) * 0.2;
          mesh.position.z += (target.y - mesh.position.z) * 0.2;
        }

        // Alarm animation on failed robot
        if (mesh.userData.status === "FAILED") {
          const s = 1.0 + Math.sin(elapsed * 10) * 0.25;
          const aura = mesh.getObjectByName("hazardAura") as THREE.Mesh;
          if (aura) aura.scale.set(s, s, s);
        }
      });

      // Pulse target pick marker
      if (targetMarkerRef.current && targetMarkerRef.current.visible) {
        const ts = 1.0 + Math.sin(elapsed * 6) * 0.2;
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

  // Synchronize Live Robots, Status Badges & Trajectories from WebSocket State
  useEffect(() => {
    if (!sceneRef.current || !state) return;
    const scene = sceneRef.current;

    let hasFailedRobot = false;

    Object.entries(state.robots || {}).forEach(([rId, robot]: [string, RobotState]) => {
      targetPositionsRef.current.set(rId, { x: robot.position[0], y: robot.position[1] });

      let group = robotMeshesRef.current.get(rId);

      // 1. Create Detailed AGV Model if not exists
      if (!group) {
        group = new THREE.Group();
        group.name = `robot_${rId}`;
        group.position.set(robot.position[0], 0.2, robot.position[1]);

        // Main AGV Chassis
        const chassisGeo = new THREE.BoxGeometry(0.85, 0.3, 0.85);
        const chassisMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(robot.color || "#3b82f6"),
          roughness: 0.25,
          metalness: 0.8,
        });
        const chassis = new THREE.Mesh(chassisGeo, chassisMat);
        chassis.position.y = 0.15;
        chassis.castShadow = true;
        group.add(chassis);

        // Status Neon Ground Ring
        const ringGeo = new THREE.RingGeometry(0.5, 0.65, 32);
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
        group.add(ring);

        // Hazard Aura for failure
        const auraGeo = new THREE.RingGeometry(0.65, 0.95, 32);
        const auraMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
        const aura = new THREE.Mesh(auraGeo, auraMat);
        aura.name = "hazardAura";
        aura.rotation.x = -Math.PI / 2;
        aura.position.y = 0.02;
        aura.visible = false;
        group.add(aura);

        // Top Sensor Beacon
        const beaconGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.16, 24);
        const beaconMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.y = 0.35;
        group.add(beacon);

        // Floating Text Sprite
        const spriteTex = createCrispLabelTexture(rId, "#0f172a", "#38bdf8");
        const spriteMat = new THREE.SpriteMaterial({ map: spriteTex, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.name = "textSprite";
        sprite.scale.set(1.8, 0.5, 1);
        sprite.position.set(0, 0.95, 0);
        group.add(sprite);

        scene.add(group);
        robotMeshesRef.current.set(rId, group);
      }

      group.userData = { id: rId, status: robot.status };

      // 2. Update Visual Colors & Badges based on status
      const ring = group.getObjectByName("statusRing") as THREE.Mesh;
      const aura = group.getObjectByName("hazardAura") as THREE.Mesh;
      const sprite = group.getObjectByName("textSprite") as THREE.Sprite;

      if (robot.status === "FAILED") {
        hasFailedRobot = true;
        if (ring) (ring.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
        if (aura) aura.visible = true;
        if (sprite) {
          sprite.material.map = createCrispLabelTexture(`⚠️ ${rId} FAILED`, "#7f1d1d", "#ef4444", "#fecaca");
          sprite.material.needsUpdate = true;
        }
      } else if (robot.status === "RECOVERING") {
        if (ring) (ring.material as THREE.MeshBasicMaterial).color.setHex(0xa855f7);
        if (aura) aura.visible = false;
        if (sprite) {
          sprite.material.map = createCrispLabelTexture(`⚡ ${rId} RECOVER`, "#581c87", "#c084fc", "#f3e8ff");
          sprite.material.needsUpdate = true;
        }
      } else if (robot.status === "CHARGING") {
        if (ring) (ring.material as THREE.MeshBasicMaterial).color.setHex(0x06b6d4);
        if (aura) aura.visible = false;
        if (sprite) {
          sprite.material.map = createCrispLabelTexture(`🔋 ${rId} ${Math.round(robot.battery)}%`, "#0c4a6e", "#38bdf8", "#e0f2fe");
          sprite.material.needsUpdate = true;
        }
      } else {
        // Normal / Moving
        if (ring) (ring.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
        if (aura) aura.visible = false;
        if (sprite) {
          sprite.material.map = createCrispLabelTexture(`${rId} • ${Math.round(robot.battery)}%`, "#0f172a", "#38bdf8", "#ffffff");
          sprite.material.needsUpdate = true;
        }
      }

      // 3. Render 3D A* Route Trajectory
      let line = routeLinesRef.current.get(rId);
      if (robot.route && robot.route.length > 1) {
        const points = robot.route.map((pt) => new THREE.Vector3(pt[0], 0.12, pt[1]));
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

        if (!line) {
          const lineMat = new THREE.LineBasicMaterial({
            color: robot.status === "RECOVERING" ? 0xc084fc : 0x38bdf8,
            linewidth: 4,
            transparent: true,
            opacity: 0.9,
          });
          line = new THREE.Line(lineGeo, lineMat);
          scene.add(line);
          routeLinesRef.current.set(rId, line);
        } else {
          line.geometry.dispose();
          line.geometry = lineGeo;
          (line.material as THREE.LineBasicMaterial).color.setHex(
            robot.status === "RECOVERING" ? 0xc084fc : 0x38bdf8
          );
          line.visible = true;
        }
      } else if (line) {
        line.visible = false;
      }
    });

    // Show/hide target waypoint marker during failure recovery
    if (targetMarkerRef.current) {
      targetMarkerRef.current.visible = hasFailedRobot;
    }
  }, [state]);

  return (
    <div className="relative w-full h-full min-h-[520px] bg-[#080c14] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left Viewport HUD Overlay */}
      <div className="absolute top-4 left-4 bg-[#0f172a]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 text-xs font-mono flex items-center gap-3 shadow-lg">
        <span className="flex items-center gap-2 font-bold text-slate-100">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
          3D DIGITAL TWIN
        </span>
        <span className="text-slate-400">| Drag to Rotate • Scroll to Zoom</span>
      </div>

      {/* Bottom Status Legend */}
      <div className="absolute bottom-4 left-4 bg-[#0f172a]/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/80 text-xs flex gap-5 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
          <span className="font-semibold text-slate-200">Normal Fleet</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shadow-[0_0_8px_#ef4444]"></span>
          <span className="font-bold text-red-400">Failed (R04)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></span>
          <span className="font-bold text-purple-300">Recovering (R07)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
          <span className="font-semibold text-slate-200">Charging Bays</span>
        </div>
      </div>
    </div>
  );
}
