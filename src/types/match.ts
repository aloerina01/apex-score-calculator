// マッチ情報の型定義
import type { TeamScore } from './score';

export interface Match {
  id: string;
  customId: string;
  matchNumber: number;
  imageUrl?: string; // 画像のData URL
  teams: TeamScore[];
  createdAt: number;
}
