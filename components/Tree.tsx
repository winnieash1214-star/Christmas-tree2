import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeConfig } from '../types';

// --- Constants ---
const COUNTS = {
  FOLIAGE: 4000,
  LIGHTS: 500,
  BAUBLES: 150, // Increased
  GIFTS: 60    // Increased
};
const SCATTER_RADIUS = 25;

// --- Shaders ---

const foliageVertex = `
  uniform float uTime;
  uniform float uProgress;
  
  attribute vec3 aTreePos;
  attribute float aRandom;
  attribute float aSize;
  
  varying float vHighlight;

  // Quintic easing for dramatic effect
  float ease(float t) {
      return t < 0.5 ? 16.0 * t * t * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 5.0) / 2.0;
  }

  void main() {
    float t = ease(uProgress);
    
    // Dual Position Interpolation: position attribute is 'scatterPos'
    vec3 pos = mix(position, aTreePos, t);
    
    // Add "Chaos" when scattered
    float scatterEffect = 1.0 - t;
    
    // Breathe effect
    pos += normal * (sin(uTime + aRandom * 10.0) * 0.05);
    
    // Floating effect
    pos.y += sin(uTime * 0.5 + aRandom * 100.0) * 0.5 * scatterEffect;
    pos.x += cos(uTime * 0.3 + aRandom * 50.0) * 0.5 * scatterEffect;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    float sizeAnim = 1.0 + 0.3 * sin(uTime * 2.0 + aRandom * 20.0);
    gl_PointSize = aSize * sizeAnim * (60.0 / -mvPosition.z);
    
    // Pass highlight factor to fragment
    vHighlight = aRandom;
  }
`;

const foliageFragment = `
  varying float vHighlight;
  
  void main() {
    vec2 uv = gl_PointCoord.xy - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;
    
    // Brighter Emerald base (Winnie Style)
    vec3 baseColor = vec3(0.05, 0.35, 0.2); 
    // Gold highlight
    vec3 highlightColor = vec3(1.0, 0.9, 0.4);
    
    float glow = 1.0 - (r * 2.0);
    glow = pow(glow, 2.0); // Sharp falloff
    
    // Mix based on random highlight attribute
    vec3 finalColor = mix(baseColor, highlightColor, vHighlight * 0.3); 
    
    // Make center brighter
    finalColor += vec3(0.15) * glow;

    gl_FragColor = vec4(finalColor, 1.0); // Pre-multiplied look
  }
`;

const lightsVertex = `
  uniform float uTime;
  uniform float uProgress;
  attribute vec3 aTreePos;
  attribute float aRandom;
  
  void main() {
    float t = smoothstep(0.0, 1.0, uProgress);
    vec3 pos = mix(position, aTreePos, t);
    
    float scatterEffect = 1.0 - t;
    pos.y += sin(uTime * 1.0 + aRandom * 100.0) * 0.8 * scatterEffect;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    float blink = sin(uTime * 3.0 + aRandom * 50.0);
    gl_PointSize = (20.0 + 10.0 * blink) * (1.0 / -mvPosition.z);
  }
`;

const lightsFragment = `
  uniform vec3 uColor;
  void main() {
    vec2 uv = gl_PointCoord.xy - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;
    
    float strength = pow(1.0 - dist * 2.0, 3.0);
    if (strength < 0.1) discard;
    
    gl_FragColor = vec4(uColor, strength);
  }
`;

// --- Utils ---

const randomInSphere = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  );
};

const getConePosition = (t: number) => {
    // t is 0 (top) to 1 (bottom) in terms of generation logic usually,
    // but here let's map t (0..1) to y (-4..6)
    const height = 10;
    const y = -4 + t * height; 
    const radius = 4 * (1 - t); 
    const angle = Math.random() * Math.PI * 2;
    // Volume distribution
    const r = Math.sqrt(Math.random()) * radius;
    return new THREE.Vector3(
        Math.cos(angle) * r,
        y,
        Math.sin(angle) * r
    );
};

// --- Sub-Components ---

const Foliage: React.FC<{ progressRef: React.MutableRefObject<number> }> = ({ progressRef }) => {
    const meshRef = useRef<THREE.Points>(null);
    const uniforms = useRef({
        uTime: { value: 0 },
        uProgress: { value: 0 },
    });

    const { positions, treePositions, randoms, sizes } = useMemo(() => {
        const positions = new Float32Array(COUNTS.FOLIAGE * 3);
        const treePositions = new Float32Array(COUNTS.FOLIAGE * 3);
        const randoms = new Float32Array(COUNTS.FOLIAGE);
        const sizes = new Float32Array(COUNTS.FOLIAGE);

        for (let i = 0; i < COUNTS.FOLIAGE; i++) {
            const scatter = randomInSphere(SCATTER_RADIUS);
            positions.set([scatter.x, scatter.y, scatter.z], i * 3);

            // Bias distribution slightly to bottom
            const t = Math.pow(Math.random(), 0.8);
            const tree = getConePosition(t);
            treePositions.set([tree.x, tree.y, tree.z], i * 3);

            randoms[i] = Math.random();
            sizes[i] = Math.random() * 2.0 + 1.0;
        }
        return { positions, treePositions, randoms, sizes };
    }, []);

    useFrame((state) => {
        if (meshRef.current) {
            uniforms.current.uTime.value = state.clock.elapsedTime;
            uniforms.current.uProgress.value = progressRef.current;
        }
    });

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-aTreePos" count={treePositions.length / 3} array={treePositions} itemSize={3} />
                <bufferAttribute attach="attributes-aRandom" count={randoms.length} array={randoms} itemSize={1} />
                <bufferAttribute attach="attributes-aSize" count={sizes.length} array={sizes} itemSize={1} />
            </bufferGeometry>
            <shaderMaterial
                depthWrite={false}
                transparent
                vertexShader={foliageVertex}
                fragmentShader={foliageFragment}
                uniforms={uniforms.current}
            />
        </points>
    );
};

const FairyLights: React.FC<{ progressRef: React.MutableRefObject<number> }> = ({ progressRef }) => {
    const meshRef = useRef<THREE.Points>(null);
    const uniforms = useRef({
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uColor: { value: new THREE.Color('#ffde7d') } 
    });

    const { positions, treePositions, randoms } = useMemo(() => {
        const positions = new Float32Array(COUNTS.LIGHTS * 3);
        const treePositions = new Float32Array(COUNTS.LIGHTS * 3);
        const randoms = new Float32Array(COUNTS.LIGHTS);

        for (let i = 0; i < COUNTS.LIGHTS; i++) {
            const scatter = randomInSphere(SCATTER_RADIUS);
            positions.set([scatter.x, scatter.y, scatter.z], i * 3);
            
            // Spiral distribution
            const t = i / COUNTS.LIGHTS;
            const y = -4 + t * 10;
            const r = 4.2 * (1 - t) + 0.2; // surface
            const theta = t * 40; 
            const tree = new THREE.Vector3(Math.cos(theta)*r, y, Math.sin(theta)*r);
            
            treePositions.set([tree.x, tree.y, tree.z], i * 3);
            randoms[i] = Math.random();
        }
        return { positions, treePositions, randoms };
    }, []);

    useFrame((state) => {
        if (meshRef.current) {
            uniforms.current.uTime.value = state.clock.elapsedTime;
            uniforms.current.uProgress.value = progressRef.current;
        }
    });

    return (
        <points ref={meshRef}>
             <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-aTreePos" count={treePositions.length / 3} array={treePositions} itemSize={3} />
                <bufferAttribute attach="attributes-aRandom" count={randoms.length} array={randoms} itemSize={1} />
            </bufferGeometry>
            <shaderMaterial
                depthWrite={false}
                transparent
                vertexShader={lightsVertex}
                fragmentShader={lightsFragment}
                uniforms={uniforms.current}
                blending={THREE.AdditiveBlending}
            />
        </points>
    )
}

const Ornaments: React.FC<{ config: TreeConfig; progressRef: React.MutableRefObject<number> }> = ({ config, progressRef }) => {
    const baublesRef = useRef<THREE.InstancedMesh>(null);
    const giftsRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const baublesData = useMemo(() => {
        return new Array(COUNTS.BAUBLES).fill(0).map(() => {
            const scatter = randomInSphere(SCATTER_RADIUS);
            const t = Math.random();
            const y = -3.5 + t * 9;
            const r = 3.5 * (1 - t) * (0.8 + Math.random()*0.4); 
            const theta = Math.random() * Math.PI * 2;
            const tree = new THREE.Vector3(Math.cos(theta)*r, y, Math.sin(theta)*r);
            return { scatter, tree, scale: 0.2 + Math.random() * 0.2 };
        });
    }, []);

    const giftsData = useMemo(() => {
         return new Array(COUNTS.GIFTS).fill(0).map(() => {
            const scatter = randomInSphere(SCATTER_RADIUS);
            const t = Math.random() * 0.35; // Distributed slightly higher than before
            const y = -4.5 + t * 6; 
            const r = 3 + Math.random() * 2;
            const theta = Math.random() * Math.PI * 2;
            const tree = new THREE.Vector3(Math.cos(theta)*r, y, Math.sin(theta)*r);
            return { scatter, tree, scale: 0.4 + Math.random() * 0.3 };
        });
    }, []);

    useFrame((state) => {
        const time = state.clock.elapsedTime;
        const progress = progressRef.current;
        
        // Easing
        const t = progress < 0.5 ? 4.0 * progress * progress * progress : 1.0 - Math.pow(-2.0 * progress + 2.0, 3.0) / 2.0;
        const scatterEffect = 1.0 - t;

        // Baubles
        if (baublesRef.current) {
            baublesData.forEach((data, i) => {
                dummy.position.lerpVectors(data.scatter, data.tree, t);
                dummy.position.y += Math.sin(time + i) * 0.3 * scatterEffect;
                dummy.rotation.set(time * 0.2 + i, time * 0.1, 0);
                dummy.scale.setScalar(data.scale * (0.5 + 0.5 * t)); 
                dummy.updateMatrix();
                baublesRef.current!.setMatrixAt(i, dummy.matrix);
            });
            baublesRef.current.instanceMatrix.needsUpdate = true;
        }

        // Gifts
        if (giftsRef.current) {
            giftsData.forEach((data, i) => {
                dummy.position.lerpVectors(data.scatter, data.tree, t);
                dummy.position.y += Math.sin(time * 0.5 + i) * 0.1 * scatterEffect;
                dummy.rotation.set(0, time * 0.1 + i, 0);
                dummy.scale.setScalar(data.scale * t); 
                dummy.updateMatrix();
                giftsRef.current!.setMatrixAt(i, dummy.matrix);
            });
            giftsRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <group>
            <instancedMesh ref={baublesRef} args={[undefined, undefined, COUNTS.BAUBLES]} castShadow receiveShadow>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial 
                    color={config.ornamentColor} 
                    roughness={0.1} 
                    metalness={0.9} 
                    envMapIntensity={2} 
                />
            </instancedMesh>
            <instancedMesh ref={giftsRef} args={[undefined, undefined, COUNTS.GIFTS]} castShadow receiveShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial 
                    color="#C0C0C0" 
                    roughness={0.2} 
                    metalness={0.8}
                />
            </instancedMesh>
        </group>
    );
};

const Star: React.FC<{ progressRef: React.MutableRefObject<number> }> = ({ progressRef }) => {
    const meshRef = useRef<THREE.Group>(null);
    const targetPos = new THREE.Vector3(0, 6.2, 0);
    const scatterPos = new THREE.Vector3(0, 15, 0);

    const starGeometry = useMemo(() => {
        const shape = new THREE.Shape();
        const outerRadius = 1;
        const innerRadius = 0.5;
        const PI5 = Math.PI / 5;
        
        for (let i = 0; i < 10; i++) {
            const r = (i % 2 === 0) ? outerRadius : innerRadius;
            const a = i * PI5;
            // Rotate by -PI/2 to align point upwards if needed, but here standard math works
            const x = Math.cos(a + Math.PI/2) * r;
            const y = Math.sin(a + Math.PI/2) * r;
            
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();

        const extrudeSettings = {
            steps: 1,
            depth: 0.2,
            bevelEnabled: true,
            bevelThickness: 0.1,
            bevelSize: 0.1,
            bevelSegments: 2
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = progressRef.current;
        const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        
        meshRef.current.position.lerpVectors(scatterPos, targetPos, easedT);
        meshRef.current.scale.setScalar(easedT);
        meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    });

    return (
        <group ref={meshRef}>
            <mesh geometry={starGeometry}>
                 {/* Center geometry visually */}
                <meshStandardMaterial color="#FFD700" emissive="#F0C000" emissiveIntensity={1.5} toneMapped={false} metalness={0.8} roughness={0.2} />
            </mesh>
            <pointLight intensity={3} color="#FFD700" distance={15} decay={2} />
        </group>
    );
};

// --- Main Tree Component ---

const Tree: React.FC<{ config: TreeConfig }> = ({ config }) => {
    // Shared state ref for animations to avoid react re-renders
    const progressRef = useRef(0);
    const targetRef = useRef(1);

    useFrame((state, delta) => {
        targetRef.current = config.treeState === 'formed' ? 1 : 0;
        // Damp the value towards target
        progressRef.current = THREE.MathUtils.damp(progressRef.current, targetRef.current, 1.5, delta);
    });

    return (
        <group>
            <Foliage progressRef={progressRef} />
            <FairyLights progressRef={progressRef} />
            <Ornaments config={config} progressRef={progressRef} />
            <Star progressRef={progressRef} />
        </group>
    );
};

export default Tree;