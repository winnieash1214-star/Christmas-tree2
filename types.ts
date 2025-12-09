export interface TreeConfig {
  rotationSpeed: number;
  lightsIntensity: number;
  bloomIntensity: number;
  ornamentColor: string;
  treeState: 'scattered' | 'formed';
}

export enum OrnamentTheme {
  GOLD = '#FFD700',
  SILVER = '#E0E0E0',
  ROSE_GOLD = '#B76E79',
}

export interface GreetingState {
  text: string;
  loading: boolean;
}