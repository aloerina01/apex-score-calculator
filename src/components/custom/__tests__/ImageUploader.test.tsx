import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, assert } from 'vitest';
import { ImageUploader } from '../ImageUploader';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

// テスト用のラッパーコンポーネント
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>;
};

// カスタムレンダー関数
const customRender = (ui: React.ReactElement) => {
  return render(ui, { wrapper: TestWrapper });
};

describe('ImageUploader', () => {
  it('画像がアップロードされたら、onImageUploadedが呼び出されること', async () => {
    // onImageUploadedのモック関数を作成
    const onImageUploadedMock = vi.fn();
    
    // コンポーネントをレンダリング
    customRender(<ImageUploader onImageUploaded={onImageUploadedMock} />);
    
    // ファイル選択ボタンを取得
    const fileButton = screen.getByText(/ファイルを選択/);
    expect(fileButton).toBeInTheDocument();
    
    const fileInput = fileButton.closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    
    // FileReaderのモック
    const originalFileReader = window.FileReader;
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      result: 'data:image/png;base64,mockImageData'
    };
    
    // FileReaderのモックを設定
    window.FileReader = vi.fn(() => mockFileReader) as any;
    
    try {
      if (fileInput) {
        // テスト用のファイルを作成
        const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
        
        // ファイル選択イベントをシミュレート
        await userEvent.upload(fileInput, file);
        
        // FileReaderのonloadイベントをシミュレート
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: mockFileReader.result } } as any);
          
          // onImageUploadedが呼び出されたことを確認
          expect(onImageUploadedMock).toHaveBeenCalledWith(mockFileReader.result);
        } else {
          // onloadが設定されていない場合はテスト失敗
          assert(false, 'FileReader.onload was not set');
        }
      }
    } finally {
      // FileReaderを元に戻す
      window.FileReader = originalFileReader;
    }
  });
});
