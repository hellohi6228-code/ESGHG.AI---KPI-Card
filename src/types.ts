export type KPIType = 'price' | 'time' | 'control' | 'training' | 'emission' | 'roi' | 'irr' | 'beta';
export type Theme = 'dark' | 'light' | 'grey' | 'blue-yellow' | 'mandarin-green';
export type CardLayout = 'standard' | 'hero-top-left' | 'split-metrics';
export type Timeframe = 'daily' | 'weekly' | 'monthly';
export type DataSourceType = 'local-upload' | 'shared-drive' | 'company-drive';

export interface AIExtractedData {
  value: string;
  unit: string;
  trend: string;
  insight: string;
  calculationSteps: string;
  fileName: string;
  extractedAt: string;
}

export interface CardConfig {
  id: string;
  title: string;
  type: KPIType | null;
  description: string;
  dataSource: DataSourceType | null;
  dataSourceDescription: string;
  indicator: string | null;
  unit: string | null;
  layout: CardLayout;
  aiData?: AIExtractedData;
}

export interface User {
  id: string;
  email: string;
  name: string;
}
