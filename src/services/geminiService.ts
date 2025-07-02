import type { GeminiApiResponse } from '../types/api';

const MODEL_ID = 'gemini-1.5-flash-latest';
const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`

/**
 * 画像を圧縮する関数
 * @param imageDataUrl 圧縮する画像のData URL
 * @returns 圧縮された画像のData URL
 */
export async function compressImage(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 元の画像サイズを取得
      let { width, height } = img;
      
      // 1920x1080以内に収まるようにアスペクト比を維持しながらリサイズ
      if (width > 1920 || height > 1080) {
        const ratio = Math.min(1920 / width, 1080 / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      // Canvasを作成して描画
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context is not available'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // 圧縮して返す（品質0.8で十分な画質を維持しつつ圧縮）
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
}

/**
 * Gemini APIを呼び出して画像を解析する関数
 * @param imageDataUrl 解析する画像のData URL
 * @returns 解析結果
 */
export async function analyzeImage(imageDataUrl: string): Promise<GeminiApiResponse[]> {
  try {
    console.log('compressing image...');
    const compressedImage = await compressImage(imageDataUrl);
    console.log('image compressed successfully', compressedImage);
    const base64Image = compressedImage.split(',')[1];
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: "Apex Legendsのマッチリザルト画面から、順位、チーム名、キル数を抽出してください。JSON形式で抽出してください。キー名は'rank', 'team_name', 'kill'としてください。rankとkillsの値のデータ型は整数、team_nameの値は文字列にしてください。もし'rank'または'kill'が読み取れなかった場合は、それらの値は-1にしてください。チーム名の隣にある「💀」マークの隣の数字がキル数です。順位は「#」の後に続く数字です。"
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json" // JSON出力を強制
      }
    };

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    console.log('API Key is ready', Boolean(apiKey));
    if (!apiKey) {
      throw new Error('Gemini API Keyが設定されていません');
    }
    console.log('Sending request to Gemini API...');
    const response = await fetch(GEMINI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
    },
      body: JSON.stringify(requestBody)
    });
    console.log('Received response from Gemini API', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // レスポンスからJSONデータを抽出
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // JSONブロックを抽出するための正規表現
    const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                      textContent.match(/\[\s*{\s*"rank"[\s\S]*}\s*\]/);
    return JSON.parse(jsonMatch);
  } catch (error) {
    console.error(error);
    throw new Error('APIレスポンスからJSONデータを抽出できませんでした');
  }
}
