import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useImageUpload } from '../useImageUpload';

describe('useImageUpload', () => {
  // モックの設定
  const mockOnImageUploaded = vi.fn();
  
  // FileReaderのモック
  const originalFileReader = window.FileReader;
  const mockFileReader = {
    readAsDataURL: vi.fn(),
    onload: null as any,
    result: 'data:image/png;base64,abc123'
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // FileReaderのモック設定
    window.FileReader = vi.fn(() => mockFileReader) as any;
  });
  
  afterEach(() => {
    // FileReaderを元に戻す
    window.FileReader = originalFileReader;
  });

  it('初期状態が正しく設定されていること', () => {
    const { result } = renderHook(() => useImageUpload(mockOnImageUploaded));
    
    expect(result.current.isDragging).toBe(false);
  });

  it('ドラッグオーバー時にisDraggingがtrueになること', () => {
    const { result } = renderHook(() => useImageUpload(mockOnImageUploaded));
    
    act(() => {
      result.current.handleDragOver({ preventDefault: vi.fn() } as any);
    });
    
    expect(result.current.isDragging).toBe(true);
  });

  it('ドラッグリーブ時にisDraggingがfalseになること', () => {
    const { result } = renderHook(() => useImageUpload(mockOnImageUploaded));
    
    // まずドラッグ状態にする
    act(() => {
      result.current.handleDragOver({ preventDefault: vi.fn() } as any);
    });
    expect(result.current.isDragging).toBe(true);
    
    // ドラッグリーブ
    act(() => {
      result.current.handleDragLeave();
    });
    
    expect(result.current.isDragging).toBe(false);
  });

  it('ドロップ時に画像が処理されること', () => {
    const { result } = renderHook(() => useImageUpload(mockOnImageUploaded));
    
    const mockFile = new File(['dummy content'], 'image.png', { type: 'image/png' });
    const mockEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {
        files: [mockFile]
      }
    };
    
    act(() => {
      result.current.handleDrop(mockEvent as any);
    });
    
    // ドラッグ状態がリセットされていることを確認
    expect(result.current.isDragging).toBe(false);
    
    // FileReaderが呼ばれたことを確認
    expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile);
    
    // FileReaderのonloadを実行
    act(() => {
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: mockFileReader.result } } as any);
      }
    });
    
    // コールバックが呼ばれたことを確認
    expect(mockOnImageUploaded).toHaveBeenCalledWith(mockFileReader.result);
  });

  it('ファイル選択時に画像が処理されること', () => {
    const { result } = renderHook(() => useImageUpload(mockOnImageUploaded));
    
    const mockFile = new File(['dummy content'], 'image.png', { type: 'image/png' });
    const mockEvent = {
      target: {
        files: [mockFile]
      }
    };
    
    act(() => {
      result.current.handleFileChange(mockEvent as any);
    });
    
    // FileReaderが呼ばれたことを確認
    expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile);
    
    // FileReaderのonloadを実行
    act(() => {
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: mockFileReader.result } } as any);
      }
    });
    
    // コールバックが呼ばれたことを確認
    expect(mockOnImageUploaded).toHaveBeenCalledWith(mockFileReader.result);
  });

  it('PNG以外のファイルがアップロードされた場合、アラートが表示されること', () => {
    const { result } = renderHook(() => useImageUpload(mockOnImageUploaded));
    
    // アラートのモック
    const originalAlert = window.alert;
    window.alert = vi.fn();
    
    const mockFile = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' });
    const mockEvent = {
      target: {
        files: [mockFile]
      }
    };
    
    act(() => {
      result.current.handleFileChange(mockEvent as any);
    });
    
    // アラートが表示されたことを確認
    expect(window.alert).toHaveBeenCalledWith('PNG または JPEG 画像のみアップロードできます');
    
    // FileReaderが呼ばれていないことを確認
    expect(mockFileReader.readAsDataURL).not.toHaveBeenCalled();
    
    // コールバックが呼ばれていないことを確認
    expect(mockOnImageUploaded).not.toHaveBeenCalled();
    
    // アラートを元に戻す
    window.alert = originalAlert;
  });

  it('JPEG画像がアップロードされた場合、正しく処理されること', () => {
    const { result } = renderHook(() => useImageUpload(mockOnImageUploaded));
    
    const mockFile = new File(['dummy content'], 'image.jpg', { type: 'image/jpeg' });
    const mockEvent = {
      target: {
        files: [mockFile]
      }
    };
    
    act(() => {
      result.current.handleFileChange(mockEvent as any);
    });
    
    // FileReaderが呼ばれたことを確認
    expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile);
    
    // FileReaderのonloadを実行
    act(() => {
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: mockFileReader.result } } as any);
      }
    });
    
    // コールバックが呼ばれたことを確認
    expect(mockOnImageUploaded).toHaveBeenCalledWith(mockFileReader.result);
  });
});
