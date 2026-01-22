
export enum ScenarioType {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export type Timeframe = '15m' | '30m' | '1h' | '4h' | '1d';

export interface CandleData {
  id: number; // timestamp or index
  open: number;
  close: number;
  high: number;
  low: number;
  isSignal?: boolean; // The candle that touches the box
  isEntry?: boolean;  // The candle afterwards
  label?: string;
}

export interface StrategyStep {
  id: number;
  title: string;
  description: string[];
  highlightCondition?: (candle: CandleData) => boolean;
}

export interface StrategyLogic {
  context: string;
  pattern: string;
  trigger: string;
  filter: string;
}

export interface BoxCoords {
  top: number;
  bottom: number;
  startIndex: number;
  endIndex: number;
}

export interface ScannerResult {
  symbol: string;
  price: number;
  change24h: number;
  scenario: ScenarioType;
  timestamp: number;
  barsAgo?: number;
  boxTop?: number;
  boxBottom?: number;
  structure?: {
    l1: number;
    h1: number;
    l2: number;
    h2: number;
    l3?: number;
    h3?: number;
  };
}
