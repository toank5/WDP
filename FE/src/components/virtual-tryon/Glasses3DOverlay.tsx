import { useRef, useEffect, useMemo, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import type { FaceTrackingData } from '@/types/virtual-tryon.types';

interface Glasses3DOverlayProps {
  faceData: FaceTrackingData | null;
  modelUrl?: string;
  frameColor?: string;
  interactiveMode?: boolean;
}

// Demo 3D glasses model (procedural generation)
function DemoGlassesModel({ frameColor = '#333333' }: { frameColor?: string }) {
  const glassesGroup = useMemo(() => {
    const group = new THREE.Group();

    // Materials
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: frameColor,
      metalness: 0.8,
      roughness: 0.2,
    });

    const lensMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x87ceeb,
      metalness: 0,
      roughness: 0,
      transmission: 0.9,
      thickness: 0.5,
      transparent: true,
      opacity: 0.6,
    });

    // Left Frame
    const leftFrame = new THREE.Mesh(
      new THREE.TorusGeometry(0.04, 0.003, 16, 32),
      frameMaterial
    );
    leftFrame.position.set(-0.06, 0, 0);
    group.add(leftFrame);

    // Left Lens
    const leftLens = new THREE.Mesh(
      new THREE.CircleGeometry(0.038, 32),
      lensMaterial
    );
    leftLens.position.set(-0.06, 0, 0.002);
    group.add(leftLens);

    // Right Frame
    const rightFrame = new THREE.Mesh(
      new THREE.TorusGeometry(0.04, 0.003, 16, 32),
      frameMaterial
    );
    rightFrame.position.set(0.06, 0, 0);
    group.add(rightFrame);

    // Right Lens
    const rightLens = new THREE.Mesh(
      new THREE.CircleGeometry(0.038, 32),
      lensMaterial
    );
    rightLens.position.set(0.06, 0, 0.002);
    group.add(rightLens);

    // Bridge
    const bridge = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.003, 0.02, 8, 16),
      frameMaterial
    );
    bridge.position.set(0, 0.02, 0);
    bridge.rotation.z = Math.PI / 2;
    group.add(bridge);

    // Left Temple
    const leftTemple = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.003, 0.08, 8, 16),
      frameMaterial
    );
    leftTemple.position.set(-0.1, 0, 0);
    leftTemple.rotation.z = Math.PI / 6;
    group.add(leftTemple);

    // Right Temple
    const rightTemple = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.003, 0.08, 8, 16),
      frameMaterial
    );
    rightTemple.position.set(0.1, 0, 0);
    rightTemple.rotation.z = -Math.PI / 6;
    group.add(rightTemple);

    return group;
  }, [frameColor]);

  return <primitive object={glassesGroup} />;
}

// Loaded GLB model component
function LoadedGlassesModel({ url, frameColor }: { url: string; frameColor?: string }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    if (!scene) return;

    // Apply frame color
    if (frameColor) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.setStyle(frameColor);
          }
        }
      });
    }

    // Center and scale the model
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Center the model
    scene.position.set(-center.x, -center.y, -center.z);

    // Scale to fit (glasses should be smaller for virtual try-on)
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 0.3 / maxDim;
    scene.scale.set(scale, scale, scale);
  }, [scene, frameColor]);

  return <primitive object={scene} />;
}

// Loaded OBJ model component
function LoadedGlassesModelOBJ({ url, frameColor }: { url: string; frameColor?: string }) {
  const [scene, setScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new OBJLoader();
    loader.load(
      url,
      (loadedScene) => {
        // Apply default material with frame color
        const defaultMaterial = new THREE.MeshStandardMaterial({
          color: frameColor || '#333333',
          metalness: 0.8,
          roughness: 0.2,
          side: THREE.DoubleSide,
        });

        loadedScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = defaultMaterial.clone();
          }
        });

        // Center and scale
        const box = new THREE.Box3().setFromObject(loadedScene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Create container
        const container = new THREE.Group();
        container.add(loadedScene);

        // Scale and position
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 0.3 / maxDim;
        loadedScene.scale.set(scale, scale, scale);
        loadedScene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

        setScene(container);
      },
      undefined,
      (error) => {
        console.error('[VirtualTryOn] Error loading OBJ:', error);
      }
    );
  }, [url, frameColor]);

  if (!scene) return null;
  return <primitive object={scene} />;
}

// Main scene with glasses positioned on face
function GlassesScene({
  faceData,
  modelUrl,
  frameColor,
  interactiveMode,
}: {
  faceData: FaceTrackingData | null;
  modelUrl?: string;
  frameColor?: string;
  interactiveMode?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const isObj = modelUrl?.toLowerCase().endsWith('.obj');

  // Position glasses on face based on landmarks
  useEffect(() => {
    if (!faceData || !groupRef.current) return;

    // Use nose bridge landmarks (index 6) for positioning
    const noseBridge = faceData.landmarks[6];

    // Convert normalized coordinates (0-1) to 3D position
    // Center is (0, 0, 0), range is approximately -1 to 1
    const x = (noseBridge.x - 0.5) * 2;
    const y = -(noseBridge.y - 0.5) * 2; // Flip Y
    const z = noseBridge.z * 0.5; // Scale Z for depth

    // Add offset for 3D mode (negative to move left)
    const xOffset = -0.3;
    const finalOffset = xOffset;

    console.log('[Glasses3D] Position:', { x, y, z, xOffset, finalOffset, finalX: x + finalOffset });

    groupRef.current.position.set(x + finalOffset, y, z);
  }, [faceData]);

  if (!faceData) return null;

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

      <group ref={groupRef}>
        {modelUrl ? (
          isObj ? (
            <Suspense fallback={null}>
              <LoadedGlassesModelOBJ url={modelUrl} frameColor={frameColor} />
            </Suspense>
          ) : (
            <LoadedGlassesModel url={modelUrl} frameColor={frameColor} />
          )
        ) : (
          <DemoGlassesModel frameColor={frameColor} />
        )}
      </group>

      {/* Enable user interaction with 3D model - only in interactive mode */}
      <OrbitControls
        enabled={!!interactiveMode}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        enableZoom={true}
        minDistance={0.5}
        maxDistance={3}
      />
    </>
  );
}

export function Glasses3DOverlay({
  faceData,
  modelUrl,
  frameColor = '#333333',
  interactiveMode = false,
}: Glasses3DOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!faceData) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: interactiveMode ? 'auto' : 'none',
        zIndex: 10,
      }}
    >
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 0, 1], fov: 50 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        }}
      >
        <GlassesScene faceData={faceData} modelUrl={modelUrl} frameColor={frameColor} interactiveMode={interactiveMode} />
      </Canvas>
    </div>
  );
}

// Simple fallback 2D overlay when 3D is not available
export function SimpleGlassesOverlay({
  faceData,
  frameColor = '#333333',
}: {
  faceData: FaceTrackingData | null;
  frameColor?: string;
}) {
  if (!faceData) return null;

  const noseBridge = faceData.landmarks[6] || faceData.landmarks[1];
  const leftEye = faceData.landmarks[33];
  const rightEye = faceData.landmarks[263];

  if (!noseBridge || !leftEye || !rightEye) return null;

  // Calculate position and scale
  const centerX = noseBridge.x * 100;
  const centerY = noseBridge.y * 100;
  const eyeDistance = Math.abs(rightEye.x - leftEye.x) * 100;
  const scale = eyeDistance * 1.8; // Scale based on eye distance

  // Add horizontal offset (negative to move left)
  const xOffset = -15;
  const adjustedCenterX = centerX + xOffset;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
        transformOrigin: 'center',
      }}
      viewBox="0 0 100 100"
    >
      {/* Left lens */}
      <ellipse
        cx={adjustedCenterX - scale * 0.22}
        cy={centerY}
        rx={scale * 0.15}
        ry={scale * 0.12}
        fill="rgba(135, 206, 235, 0.3)"
        stroke={frameColor}
        strokeWidth="0.3"
        filter="drop-shadow(2px 4px 6px rgba(0,0,0,0.3))"
      />

      {/* Right lens */}
      <ellipse
        cx={adjustedCenterX + scale * 0.22}
        cy={centerY}
        rx={scale * 0.15}
        ry={scale * 0.12}
        fill="rgba(135, 206, 235, 0.3)"
        stroke={frameColor}
        strokeWidth="0.3"
        filter="drop-shadow(2px 4px 6px rgba(0,0,0,0.3))"
      />

      {/* Bridge */}
      <line
        x1={adjustedCenterX - scale * 0.07}
        y1={centerY}
        x2={adjustedCenterX + scale * 0.07}
        y2={centerY}
        stroke={frameColor}
        strokeWidth="0.4"
      />

      {/* Left temple */}
      <line
        x1={adjustedCenterX - scale * 0.37}
        y1={centerY - scale * 0.03}
        x2={adjustedCenterX - scale * 0.55}
        y2={centerY - scale * 0.06}
        stroke={frameColor}
        strokeWidth="0.35"
      />

      {/* Right temple */}
      <line
        x1={adjustedCenterX + scale * 0.37}
        y1={centerY - scale * 0.03}
        x2={adjustedCenterX + scale * 0.55}
        y2={centerY - scale * 0.06}
        stroke={frameColor}
        strokeWidth="0.35"
      />
    </svg>
  );
}
