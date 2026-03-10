import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('network-data');

export interface NetworkCallData {
  testName: string;
  timestamp: string;
  durationMs?: number;
  request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  response: {
    status: number;
    statusText: string;
    duration?: number;
    headers: Record<string, string>;
    body: unknown;
  };
}

export function saveNetworkCall(data: NetworkCallData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

export function clearNetworkData(): void {
  if (fs.existsSync(DATA_DIR)) {
    fs.rmSync(DATA_DIR, { recursive: true });
  }
}
