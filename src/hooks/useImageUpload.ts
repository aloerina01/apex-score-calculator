import { useState } from 'react';

/**
 * 画像のドラッグ＆ドロップとアップロード処理を担当するカスタムフック
 * 
 * @param onImageUploaded 画像がアップロードされた時に呼び出されるコールバック関数
 * @returns ドラッグ＆ドロップとファイル選択に関する状態と関数
 */
export function useImageUpload(onImageUploaded: (imageUrl: string) => void) {
  const [isDragging, setIsDragging] = useState(false);
  
  // ドラッグ＆ドロップ処理
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };
  
  // ファイル選択処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
  };
  
  // 画像アップロード処理
  const handleImageUpload = (file: File) => {
    // 画像ファイルのみ許可
    if (!file.type.match('image/png') && !file.type.match('image/jpeg')) {
      alert('PNG または JPEG 画像のみアップロードできます');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageUploaded(result);
    };
    reader.readAsDataURL(file);
  };
  
  return {
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange
  };
}
