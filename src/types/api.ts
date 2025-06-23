// APIレスポンスの型定義

// Gemini APIからのレスポンス型
export interface GeminiApiResponse {
  rank: number;
  team_name: string;
  kill: number;
}

// 集計結果の型
export interface CalculationResult {
  teamName: string;
  rank: number;
  kills: number;
  killPoints: number;
  placementPoints: number;
  totalPoints: number;
}
