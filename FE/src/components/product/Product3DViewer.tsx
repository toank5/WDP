import { useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { Box, CircularProgress, Typography } from '@mui/material';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

interface Product3DViewerProps {
  modelUrl: string;
  className?: string;
}

function GLBModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  // Center and scale the model
  useEffect(() => {
    if (scene) {
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Center the model
      scene.position.set(-center.x, -center.y, -center.z);

      // Scale to fit in view
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1 / maxDim;
      scene.scale.set(scale, scale, scale);
    }
  }, [scene]);

  return <primitive object={scene} />;
}

function OBJModel({ url, onLoad }: { url: string; onLoad?: () => void }) {
  const [scene, setScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new OBJLoader();
    loader.load(
      url,
      (loadedScene) => {
        // Apply default material to all meshes (OBJ has no MTL)
        const defaultMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          metalness: 0.8,
          roughness: 0.2,
          side: THREE.DoubleSide,
        });

        loadedScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = defaultMaterial.clone();
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Calculate original bounds
        const box = new THREE.Box3().setFromObject(loadedScene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Calculate scale
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.5 / maxDim;

        // Create a container group
        const container = new THREE.Group();
        container.add(loadedScene);

        // Scale and position the loaded scene
        loadedScene.scale.set(scale, scale, scale);
        loadedScene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

        setScene(container);
        onLoad?.();
      },
      undefined,
      (error) => {
        console.error('[Product3DViewer] Error loading OBJ:', error);
      }
    );
  }, [url, onLoad]);

  if (!scene) return null;
  return <primitive object={scene} />;
}

function Model({ url, onObjLoad }: { url: string; onObjLoad?: () => void }) {
  const isOBJ = url.toLowerCase().endsWith('.obj');

  if (isOBJ) {
    return <OBJModel url={url} onLoad={onObjLoad} />;
  }

  return <GLBModel url={url} />;
}

// R3F-compatible loading indicator (no SVG elements)
function LoadingFallback() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshBasicMaterial color="#ffffff" wireframe />
      </mesh>
    </group>
  );
}

function Scene3D({ modelUrl, onLoad }: { modelUrl: string; onLoad: () => void }) {
  const isObj = modelUrl.toLowerCase().endsWith('.obj');

  // For non-OBJ models, use Suspense to detect when loaded
  useEffect(() => {
    if (!isObj) {
      // GLB models load via Suspense, call onLoad after a brief delay
      const timer = setTimeout(onLoad, 100);
      return () => clearTimeout(timer);
    }
  }, [onLoad, isObj]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />
      <Environment preset="studio" />

      <Suspense fallback={null}>
        <Model url={modelUrl} onObjLoad={isObj ? onLoad : undefined} />
      </Suspense>

      <ContactShadows
        position={[0, -0.5, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={4}
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        minDistance={0.5}
        maxDistance={10}
        enablePan={false}
      />
    </>
  );
}

export function Product3DViewer({ modelUrl, className }: Product3DViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check file type
  const isGltf = modelUrl.toLowerCase().endsWith('.gltf');
  const isObj = modelUrl.toLowerCase().endsWith('.obj');

  // GLTF files require external resources - show warning
  if (isGltf) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          color: 'white',
          p: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" gutterBottom>
          ⚠️ GLTF Format Not Supported
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, maxWidth: 400 }}>
          GLTF files require external resources that cannot be loaded from Cloudinary.
          Please use <strong>GLB format</strong> (single file) instead.
        </Typography>
        <Typography variant="caption" sx={{ mt: 2, opacity: 0.6 }}>
          Export your 3D model as .glb file and upload again.
        </Typography>
      </Box>
    );
  }

  // OBJ files note
  if (isObj) {
    console.info('ℹ️ Loading OBJ model - Materials/textures may not load without MTL files');
  }

  return (
    <>
      <Canvas
        className={className}
        camera={{ position: [0, 0, 2], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        }}
        style={{ width: '100%', height: '100%' }}
        onError={(err) => {
          console.error('3D viewer error:', err);
          setError('Failed to load 3D model');
          setIsLoading(false);
        }}
      >
        <Scene3D modelUrl={modelUrl} onLoad={() => setIsLoading(false)} />
      </Canvas>

      {/* Loading indicator outside Canvas */}
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            color: 'white',
            pointerEvents: 'none',
          }}
        >
          <CircularProgress size={40} sx={{ color: 'white' }} />
          <Typography variant="body2" color="white">
            Loading 3D model...
          </Typography>
        </Box>
      )}

      {error && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            bgcolor: 'rgba(255, 0, 0, 0.8)',
            color: 'white',
            p: 1,
            borderRadius: 1,
            fontSize: '0.8rem',
          }}
        >
          {error}
        </Box>
      )}
    </>
  );
}
