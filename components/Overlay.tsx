import React from 'react';
import { Settings, Sparkles, Zap, Minimize2, Palette, Wand2 } from 'lucide-react';
import { TreeConfig, OrnamentTheme } from '../types';

interface OverlayProps {
  config: TreeConfig;
  setConfig: React.Dispatch<React.SetStateAction<TreeConfig>>;
  greeting: string;
  isGeneratingGreeting: boolean;
  onGenerateGreeting: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ 
  config, 
  setConfig, 
  greeting, 
  isGeneratingGreeting, 
  onGenerateGreeting 
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const toggleOpen = () => setIsOpen(!isOpen);

  const updateConfig = <K extends keyof TreeConfig>(key: K, value: TreeConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const toggleTreeState = () => {
    setConfig(prev => ({
        ...prev,
        treeState: prev.treeState === 'formed' ? 'scattered' : 'formed'
    }));
  };

  return (
    <>
      {/* Header / Logo */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start pointer-events-none z-10">
        <div>
          <h1 className="text-4xl md:text-6xl text-amber-400 font-luxury tracking-widest drop-shadow-[0_2px_10px_rgba(255,215,0,0.5)]">
            WINNIE
          </h1>
          <p className="text-emerald-100/60 font-display italic tracking-widest text-sm md:text-base mt-2">
            SIGNATURE COLLECTION
          </p>
        </div>
      </div>

      {/* Greeting Display */}
      <div className="absolute top-32 w-full flex justify-center pointer-events-none z-10 px-4">
        <div className="max-w-2xl text-center">
            <p className={`text-xl md:text-3xl text-white/90 font-display italic transition-opacity duration-1000 ${isGeneratingGreeting ? 'opacity-50 animate-pulse' : 'opacity-100'}`}>
                {greeting}
            </p>
        </div>
      </div>

      {/* Floating Controls */}
      <div className={`absolute bottom-8 right-8 flex flex-col items-end gap-4 transition-all duration-500 z-20 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        
        {/* Magic Toggle Button - Primary Interaction */}
        <button
            onClick={toggleTreeState}
            className="group relative flex items-center gap-3 bg-emerald-950/80 hover:bg-emerald-900/90 backdrop-blur-md border border-amber-500/50 px-6 py-4 rounded-full shadow-[0_0_30px_rgba(2,58,38,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,215,0,0.3)] z-30 pointer-events-auto"
        >
            <Wand2 size={24} className={`text-amber-400 transition-transform duration-700 ${config.treeState === 'scattered' ? 'rotate-180' : 'rotate-0'}`} />
            <span className="text-amber-100 font-luxury tracking-widest text-sm uppercase">
                {config.treeState === 'formed' ? 'Disassemble' : 'Assemble'}
            </span>
        </button>

        {/* Control Panel */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-6 rounded-sm w-72 shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-2 mb-6 text-amber-400 border-b border-white/10 pb-2">
            <Settings size={16} />
            <span className="text-xs tracking-[0.2em] font-bold uppercase">Configuration</span>
          </div>

          {/* Theme Selector */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-white/60 text-xs uppercase tracking-wider mb-3">
              <Palette size={12} /> Ornament Theme
            </label>
            <div className="flex gap-2">
              {[OrnamentTheme.GOLD, OrnamentTheme.SILVER, OrnamentTheme.ROSE_GOLD].map((color) => (
                <button
                  key={color}
                  onClick={() => updateConfig('ornamentColor', color)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${config.ornamentColor === color ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Set theme to ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-5">
            <div>
              <label className="flex justify-between text-white/60 text-xs uppercase tracking-wider mb-2">
                <span className="flex items-center gap-2"><Sparkles size={12}/> Bloom</span>
                <span>{(config.bloomIntensity * 10).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={config.bloomIntensity}
                onChange={(e) => updateConfig('bloomIntensity', parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300"
              />
            </div>

            <div>
              <label className="flex justify-between text-white/60 text-xs uppercase tracking-wider mb-2">
                <span className="flex items-center gap-2"><Zap size={12}/> Luminance</span>
                <span>{(config.lightsIntensity).toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={config.lightsIntensity}
                onChange={(e) => updateConfig('lightsIntensity', parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300"
              />
            </div>
             <div>
              <label className="flex justify-between text-white/60 text-xs uppercase tracking-wider mb-2">
                <span className="flex items-center gap-2">↻ Speed</span>
                <span>{config.rotationSpeed > 0 ? 'ON' : 'OFF'}</span>
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.rotationSpeed}
                onChange={(e) => updateConfig('rotationSpeed', parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300"
              />
            </div>
          </div>

          {/* AI Action */}
          <button
            onClick={onGenerateGreeting}
            disabled={isGeneratingGreeting}
            className="mt-6 w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 text-amber-400 text-xs uppercase tracking-widest transition-all hover:shadow-[0_0_15px_rgba(255,191,0,0.2)] flex items-center justify-center gap-2"
          >
            {isGeneratingGreeting ? 'Forging Wish...' : 'Generate Royal Wish'}
            {!isGeneratingGreeting && <Sparkles size={14} />}
          </button>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleOpen}
        className="absolute bottom-8 right-8 z-30 p-4 bg-white/5 backdrop-blur-md rounded-full text-amber-400 border border-amber-500/30 hover:bg-white/10 hover:scale-110 transition-all shadow-lg"
      >
         {isOpen ? <Minimize2 size={24} /> : <Settings size={24} />}
      </button>
    </>
  );
};

export default Overlay;