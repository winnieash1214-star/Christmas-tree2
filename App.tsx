import React, { useState, useEffect } from 'react';
import Scene from './components/Scene';
import Overlay from './components/Overlay';
import { TreeConfig, OrnamentTheme } from './types';
import { generateLuxuryGreeting } from './services/geminiService';

const App: React.FC = () => {
  const [config, setConfig] = useState<TreeConfig>({
    rotationSpeed: 0.5,
    lightsIntensity: 1.5,
    bloomIntensity: 1.5,
    ornamentColor: OrnamentTheme.GOLD,
    treeState: 'formed'
  });

  const [greeting, setGreeting] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load initial greeting
  useEffect(() => {
    if (!initialized) {
        setGreeting("The Essence of Holiday Splendor.");
        setInitialized(true);
    }
  }, [initialized]);

  const handleGenerateGreeting = async () => {
    setIsGenerating(true);
    const newGreeting = await generateLuxuryGreeting();
    setGreeting(newGreeting);
    setIsGenerating(false);
  };

  return (
    <div className="w-full h-screen bg-[#000502] relative overflow-hidden">
      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0">
        <Scene config={config} />
      </div>

      {/* UI Overlay */}
      <Overlay 
        config={config} 
        setConfig={setConfig} 
        greeting={greeting}
        isGeneratingGreeting={isGenerating}
        onGenerateGreeting={handleGenerateGreeting}
      />
    </div>
  );
};

export default App;