// マッチ情報の型定義
import type { TeamScore } from './score';
import type { ScoreRules } from './score';

export interface Match {
  id: string;
  customId: string;
  matchNumber: number;
  imageUrl?: string; // 画像のData URL
  teams: TeamScore[];
  rules: ScoreRules; // ルールをマッチごとに持たせる
  createdAt: number;
}
