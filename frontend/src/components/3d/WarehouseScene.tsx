"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { WarehouseFullState, RobotState } from "@/hooks/useWarehouseSocket";

interface WarehouseSceneProps {
  state: WarehouseFullState | null;
  onSelectRobot?: (robotId: string) => void;
}

function createTextSprite(text: string, bgColor: string, textColor = "#ffffff", borderColor = "#38bdf8") {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 72;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(8, 6, 240, 60, 10);
    } else {
      ctx.rect(8, 6, 240, 60);
    }
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = borderColor;
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 36);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(1.5, 0.42, 1);
  return sprite;
}

export default function WarehouseScene({ state, onSelectRobot }: WarehouseSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Mesh registries for fast delta updates
  const robotMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const routeLinesRef = useRef<Map<string, THREE.Line>>(new Map());
  const targetPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#07090e");
    scene.fog = new THREE.FogExp2("#07090e", 0.015);
    sceneRef.current = scene;

    // 2. Camera setup (Isometric Command Center Perspective)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(15, 32, 28);
    camera.lookAt(15, 0, 10);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // 4. Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x60a5fa, 1.2);
    dirLight.position.set(15, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Subdued purple rim light
    const pointLight = new THREE.PointLight(0x8b5cf6, 2.0, 50);
    pointLight.position.set(15, 10, 10);
    scene.add(pointLight);

    // 5. Floor & Grid (30x20 cells, 1 unit per cell)
    const floorGeo = new THREE.PlaneGeometry(30, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0d121d,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(14.5, 0, 9.5);
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid helper overlay
    const gridHelper = new THREE.GridHelper(30, 30, 0x1e293b, 0x141b27);
    gridHelper.position.set(14.5, 0.01, 9.5);
    gridHelper.scale.set(1, 1, 20 / 30);
    scene.add(gridHelper);

    // Boundary frame
    const frameGeo = new THREE.BoxGeometry(30.4, 0.2, 20.4);
    const frameMat = new THREE.MeshBasicMaterial({ color: 0x2563eb, wireframe: true });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(14.5, 0.1, 9.5);
    scene.add(frame);

    // 6. Charging Bays (x=1, y=1..4)
    for (let y = 1; y <= 4; y++) {
      const padGeo = new THREE.BoxGeometry(0.85, 0.05, 0.85);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.6 });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(1, 0.03, y);
      scene.add(pad);
    }

    // 7. Dropoff Stations (x=28, y=5, 10, 15)
    [5, 10, 15].forEach((y) => {
      const dropGeo = new THREE.BoxGeometry(1.2, 0.08, 1.2);
      const dropMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.5 });
      const drop = new THREE.Mesh(dropGeo, dropMat);
      drop.position.set(28, 0.04, y);
      scene.add(drop);
    });

    // 8. Shelves Construction (Instanced Mesh for fast performance)
    const shelfGeo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.4 });
    const shelfInst = new THREE.InstancedMesh(shelfGeo, shelfMat, 48);
    shelfInst.castShadow = true;
    shelfInst.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;
    for (const col of [6, 12, 18, 24]) {
      for (const row of [3, 4, 5, 6, 8, 9, 10, 11, 13, 14, 15, 16]) {
        dummy.position.set(col, 0.9, row);
        dummy.updateMatrix();
        shelfInst.setMatrixAt(idx++, dummy.matrix);
      }
    }
    scene.add(shelfInst);

    // Mouse Drag Rotation / Orbiting
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !cameraRef.current) return;
      const dx = (e.clientX - prevMouseX) * 0.005;
      const dy = (e.clientY - prevMouseY) * 0.005;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      cameraRef.current.position.x -= dx * 10;
      cameraRef.current.position.z -= dy * 10;
      cameraRef.current.lookAt(15, 0, 10);
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Resize handler
    const onResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // Animation Render Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Smooth Lerp Interpolation for Robots
      robotMeshesRef.current.forEach((mesh, rId) => {
        const target = targetPositionsRef.current.get(rId);
        if (target) {
          mesh.position.x += (target.x - mesh.position.x) * 0.15;
          mesh.position.z += (target.y - mesh.position.z) * 0.15;
        }

        // Pulse failed robot mesh
        const statusRing = mesh.getObjectByName("statusRing") as THREE.Mesh;
        if (statusRing && mesh.userData.status === "FAILED") {
          const s = 1.0 + Math.sin(clock.getElapsedTime() * 8) * 0.15;
          statusRing.scale.set(s, s, s);
        }
      });

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
      window.removeEventListener("resize", onResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Dynamic Robots and Routes when state changes
  useEffect(() => {
    if (!sceneRef.current || !state) return;
    const scene = sceneRef.current;

    const activeRobotIds = new Set<string>();

    Object.entries(state.robots || {}).forEach(([rId, robot]: [string, RobotState]) => {
      activeRobotIds.add(rId);
      targetPositionsRef.current.set(rId, { x: robot.position[0], y: robot.position[1] });

      let group = robotMeshesRef.current.get(rId);

      // 1. Create robot mesh if not present
      if (!group) {
        group = new THREE.Group();
        group.name = `robot_${rId}`;
        group.position.set(robot.position[0], 0.2, robot.position[1]);

        // Base AGV Chassis (Rounded box)
        const bodyGeo = new THREE.BoxGeometry(0.7, 0.28, 0.7);
        const bodyMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(robot.color || "#3b82f6"),
          roughness: 0.3,
          metalness: 0.7,
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        body.position.y = 0.14;
        group.add(body);

        // Status Indicator Ring
        const ringGeo = new THREE.RingGeometry(0.42, 0.52, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x3b82f6,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.name = "statusRing";
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.02;
        group.add(ring);

        // Top Sensor Dome
        const domeGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.12, 16);
        const domeMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        // Floating Text Label Sprite
        const sprite = createTextSprite(rId, "#1e293b", "#ffffff", "#3b82f6");
        sprite.name = "textSprite";
        sprite.position.set(0, 0.75, 0);
        group.add(sprite);

        scene.add(group);
        robotMeshesRef.current.set(rId, group);
      }

      group.userData = { id: rId, status: robot.status };

      // Update Visual Colors and Text Label Based on Live Status
      const ring = group.getObjectByName("statusRing") as THREE.Mesh;
      if (ring) {
        const ringMat = ring.material as THREE.MeshBasicMaterial;
        if (robot.status === "FAILED") {
          ringMat.color.setHex(0xef4444); // Bright Red
        } else if (robot.status === "RECOVERING") {
          ringMat.color.setHex(0x8b5cf6); // Recovery Purple
        } else if (robot.status === "CHARGING") {
          ringMat.color.setHex(0x06b6d4); // Charging Cyan
        } else {
          ringMat.color.setHex(0x10b981); // Healthy Green
        }
      }

      // Update Floating Label text if status changed
      const oldSprite = group.getObjectByName("textSprite");
      if (oldSprite) {
        group.remove(oldSprite);
        let labelText = `${rId} ${Math.round(robot.battery)}%`;
        let bgCol = "#0f172a";
        let borderCol = "#3b82f6";
        if (robot.status === "FAILED") {
          labelText = `${rId} ❌ FAILED`;
          bgCol = "#7f1d1d";
          borderCol = "#ef4444";
        } else if (robot.status === "RECOVERING") {
          labelText = `${rId} ⚡ RECOVER`;
          bgCol = "#581c87";
          borderCol = "#a855f7";
        }
        const newSprite = createTextSprite(labelText, bgCol, "#ffffff", borderCol);
        newSprite.name = "textSprite";
        newSprite.position.set(0, 0.75, 0);
        group.add(newSprite);
      }

      // 2. Render A* Navigation Trajectory
      let line = routeLinesRef.current.get(rId);
      if (robot.route && robot.route.length > 1) {
        const points = robot.route.map((pt) => new THREE.Vector3(pt[0], 0.08, pt[1]));
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

        if (!line) {
          const lineMat = new THREE.LineBasicMaterial({
            color: robot.status === "RECOVERING" ? 0xa855f7 : 0x3b82f6,
            linewidth: 3,
            transparent: true,
            opacity: 0.85,
          });
          line = new THREE.Line(lineGeo, lineMat);
          scene.add(line);
          routeLinesRef.current.set(rId, line);
        } else {
          line.geometry.dispose();
          line.geometry = lineGeo;
          (line.material as THREE.LineBasicMaterial).color.setHex(
            robot.status === "RECOVERING" ? 0xa855f7 : 0x3b82f6
          );
          line.visible = true;
        }
      } else if (line) {
        line.visible = false;
      }
    });
  }, [state]);

  return (
    <div className="relative w-full h-full min-h-[520px] bg-[#07090e] rounded-xl overflow-hidden border border-slate-800">
      <div ref={mountRef} className="w-full h-full" />
      
      {/* 3D Viewport Controls Overlay */}
      <div className="absolute top-3 left-3 bg-[#0f141f]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          DIGITAL TWIN 3D VIEW
        </span>
        <span className="text-slate-400">| Drag to Orbit</span>
      </div>

      {/* Legend Badge */}
      <div className="absolute bottom-3 left-3 bg-[#0f141f]/85 backdrop-blur-md p-2.5 rounded-lg border border-slate-800 text-xs flex gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Normal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          <span className="text-red-400 font-semibold">Failed (R04)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
          <span className="text-purple-300">Recovering (R07)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          <span>Charging</span>
        </div>
      </div>
    </div>
  );
}
