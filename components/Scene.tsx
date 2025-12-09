import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Sparkles, MeshReflectorMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { TreeConfig } from '../types';
import Tree from './Tree';
import Lights from './Lights';

interface SceneProps {
  config: TreeConfig;
}

const Floor = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
      <planeGeometry args={[50, 50]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={40}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#0a1a10"
        metalness={0.6}
        mirror={1} 
      />
    </mesh>
  );
};

const Scene: React.FC<SceneProps> = ({ config }) => {
  const bgColor = '#05150a'; // Slightly lighter, richer green/black
  
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 2, 14], fov: 45 }}
      gl={{ antialias: false, stencil: false, depth: false }}
    >
      <color attach="background" args={[bgColor]} />
      
      {/* Atmosphere */}
      <fog attach="fog" args={[bgColor, 5, 35]} />
      
      <Suspense fallback={null}>
        <Environment preset="city" />
        
        <Lights intensity={config.lightsIntensity} />

        <group rotation={[0, 0, 0]}>
            <Tree config={config} />
            <Sparkles 
                count={300} 
                scale={18} 
                size={3} 
                speed={0.4} 
                opacity={0.6} 
                color={config.ornamentColor}
            />
        </group>

        <Floor />

        <ContactShadows resolution={1024} scale={30} blur={2} opacity={0.5} far={10} color="#000000" />
        
        <OrbitControls 
            autoRotate 
            autoRotateSpeed={config.rotationSpeed} 
            enablePan={false}
            enableZoom={true}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
            minDistance={5}
            maxDistance={25}
        />

        <EffectComposer enableNormalPass={false}>
            <Bloom 
                luminanceThreshold={0.5} 
                mipmapBlur 
                intensity={config.bloomIntensity} 
                radius={0.7}
            />
            <Vignette eskil={false} offset={0.1} darkness={0.9} />
            <Noise opacity={0.02} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
};

export default Scene;