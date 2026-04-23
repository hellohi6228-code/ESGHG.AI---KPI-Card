export type KPIType = 'price' | 'time' | 'control' | 'training' | 'emission' | 'roi' | 'irr' | 'beta';
export type Theme = 'dark' | 'light' | 'grey' | 'blue-yellow' | 'mandarin-green';
export type CardLayout = 'standard' | 'hero-top-left' | 'split-metrics';
export type Timeframe = 'daily' | 'weekly' | 'monthly';

export interface CardConfig {
  id: string;
  title: string;
  type: KPIType | null;
  description: string;
  dataSources: string[];
  indicator: string | null;
  secondaryIndicator: string | null;
  layout: CardLayout;
}

export interface User {
  id: string;
  email: string;
  name: string;
}
