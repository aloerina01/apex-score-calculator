#!/usr/bin/env node

/**
 * 招待コードのハッシュ値を生成するツール
 * 
 * 使用方法:
 * node scripts/generate-invite-code-hash.js
 * 
 * または、実行権限を付与して直接実行:
 * chmod +x scripts/generate-invite-code-hash.js
 * ./scripts/generate-invite-code-hash.js
 */
import crypto from 'crypto';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// SHA-256ハッシュを生成する関数
function generateSHA256Hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

console.log('====================================');
console.log('招待コードハッシュ生成ツール');
console.log('====================================');
console.log('');

rl.question('招待コードを入力してください: ', (code) => {
  if (!code.trim()) {
    console.log('\n❌ エラー: 招待コードが入力されていません。');
    rl.close();
    return;
  }

  const hash = generateSHA256Hash(code);
  
  console.log('\n✅ 招待コードのハッシュ値が生成されました:');
  console.log('\x1b[32m%s\x1b[0m', hash);
  
  console.log('\n📋 GitHub Secretsに以下の名前で登録してください:');
  console.log('\x1b[36m%s\x1b[0m', 'INVITE_CODE_HASH');
  
  console.log('\n📝 .env.localファイルに以下の行を追加することで、開発環境でもテストできます:');
  console.log('\x1b[33m%s\x1b[0m', `VITE_INVITE_CODE_HASH=${hash}`);
  
  console.log('\n⚠️ 注意: 招待コードとハッシュ値は安全に管理してください。');
  console.log('====================================');
  
  rl.close();
});
