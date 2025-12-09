import React from 'react';

interface LightsProps {
  intensity: number;
}

const Lights: React.FC<LightsProps> = ({ intensity }) => {
  return (
    <>
      <ambientLight intensity={0.4} color="#052515" />
      <spotLight
        position={[10, 20, 10]}
        angle={0.4}
        penumbra={1}
        intensity={intensity * 2.5}
        castShadow
        shadow-bias={-0.0001}
        color="#fff5e6"
      />
      <pointLight position={[-10, -5, -10]} intensity={intensity * 1.5} color="#c2f2d0" />
      <pointLight position={[0, 8, 5]} intensity={intensity * 0.8} color="#FFD700" />
    </>
  );
};

export default Lights;