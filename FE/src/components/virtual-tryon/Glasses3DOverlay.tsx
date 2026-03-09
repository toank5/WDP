import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { FaceTrackingData } from '@/types/virtual-tryon.types';

interface Glasses3DOverlayProps {
  faceData: FaceTrackingData | null;
  modelUrl?: string;
  frameColor?: string;
  mirrorMode?: boolean;
}

// Demo 3D glasses model (procedural generation)
function DemoGlassesModel({ frameColor = '#333333' }: { frameColor?: string }) {
  const meshRef = useRef<THREE.Group>(null);

  // Materials
  const frameMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: frameColor,
      metalness: 0.8,
      roughness: 0.2,
    }),
    [frameColor]
  );

  const lensMaterial = useMemo(
    () => new THREE.MeshPhysicalMaterial({
      color: 0x87ceeb,
      metalness: 0,
      roughness: 0,
      transmission: 0.9,
      thickness: 0.5,
      transparent: true,
      opacity: 0.6,
    }),
    []
  );

  return (
    <group ref={meshRef}>
      {/* Left Frame */}
      <mesh position={[-0.06, 0, 0]} material={frameMaterial}>
        <torusGeometry args={[0.04, 0.003, 16, 32]} />
      </mesh>

      {/* Left Lens */}
      <mesh position={[-0.06, 0, 0.002]} rotation={[0, 0, 0]} material={lensMaterial}>
        <circleGeometry args={[0.038, 32]} />
      </mesh>

      {/* Right Frame */}
      <mesh position={[0.06, 0, 0]} material={frameMaterial}>
        <torusGeometry args={[0.04, 0.003, 16, 32]} />
      </mesh>

      {/* Right Lens */}
      <mesh position={[0.06, 0, 0.002]} rotation={[0, 0, 0]} material={lensMaterial}>
        <circleGeometry args={[0.038, 32]} />
      </mesh>

      {/* Bridge */}
      <mesh position={[0, 0.02, 0]} rotation={[0, 0, Math.PI / 2]} material={frameMaterial}>
        <capsuleGeometry args={[0.003, 0.02, 8, 16]} />
      </mesh>

      {/* Left Temple */}
      <mesh position={[-0.1, 0, 0]} rotation={[0, 0, Math.PI / 6]} material={frameMaterial}>
        <capsuleGeometry args={[0.003, 0.08, 8, 16]} />
      </mesh>

      {/* Right Temple */}
      <mesh position={[0.1, 0, 0]} rotation={[0, 0, -Math.PI / 6]} material={frameMaterial}>
        <capsuleGeometry args={[0.003, 0.08, 8, 16]} />
      </mesh>
    </group>
  );
}

// Loaded GLB model component
function LoadedGlassesModel({ url, frameColor }: { url: string; frameColor?: string }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    if (frameColor) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.setStyle(frameColor);
          }
        }
      });
    }
  }, [scene, frameColor]);

  return <primitive object={scene} scale={0.1} />;
}

// Main scene with glasses positioned on face
function GlassesScene({
  faceData,
  modelUrl,
  frameColor,
}: {
  faceData: FaceTrackingData | null;
  modelUrl?: string;
  frameColor?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);

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

    groupRef.current.position.set(x, y, z);

    // Add subtle idle animation
  }, [faceData]);

  // Subtle floating animation
  useFrame((state) => {
    if (!groupRef.current || !faceData) return;
    groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 0.5) * 0.0005;
  });

  if (!faceData) return null;

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

      <group ref={groupRef}>
        {modelUrl ? (
          <LoadedGlassesModel url={modelUrl} frameColor={frameColor} />
        ) : (
          <DemoGlassesModel frameColor={frameColor} />
        )}
      </group>
    </>
  );
}

export function Glasses3DOverlay({
  faceData,
  modelUrl,
  frameColor = '#333333',
  mirrorMode = false,
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
        pointerEvents: 'none',
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
        style={{
          transform: mirrorMode ? 'scaleX(-1)' : 'scaleX(1)',
        }}
      >
        <GlassesScene faceData={faceData} modelUrl={modelUrl} frameColor={frameColor} />
      </Canvas>
    </div>
  );
}

// Simple fallback 2D overlay when 3D is not available
export function SimpleGlassesOverlay({
  faceData,
  frameColor = '#333333',
  mirrorMode = false,
}: {
  faceData: FaceTrackingData | null;
  frameColor?: string;
  mirrorMode?: boolean;
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
        transform: mirrorMode ? 'scaleX(-1)' : 'scaleX(1)',
        transformOrigin: 'center',
      }}
      viewBox="0 0 100 100"
    >
      {/* Left lens */}
      <ellipse
        cx={centerX - scale * 0.22}
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
        cx={centerX + scale * 0.22}
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
        x1={centerX - scale * 0.07}
        y1={centerY}
        x2={centerX + scale * 0.07}
        y2={centerY}
        stroke={frameColor}
        strokeWidth="0.4"
      />

      {/* Left temple */}
      <line
        x1={centerX - scale * 0.37}
        y1={centerY - scale * 0.03}
        x2={centerX - scale * 0.55}
        y2={centerY - scale * 0.06}
        stroke={frameColor}
        strokeWidth="0.35"
      />

      {/* Right temple */}
      <line
        x1={centerX + scale * 0.37}
        y1={centerY - scale * 0.03}
        x2={centerX + scale * 0.55}
        y2={centerY - scale * 0.06}
        stroke={frameColor}
        strokeWidth="0.35"
      />
    </svg>
  );
}
