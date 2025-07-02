import { Box, Button, Text } from '@chakra-ui/react';
import { useImageUpload } from '../../hooks/useImageUpload';

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
}

/**
 * 画像アップロード部分を担当するコンポーネント
 */
export const ImageUploader = ({ onImageUploaded }: ImageUploaderProps) => {
  const { isDragging, handleDragOver, handleDragLeave, handleDrop, handleFileChange } = 
    useImageUpload(onImageUploaded);
  
  return (
    <Box
      border="2px dashed"
      borderColor={isDragging ? 'blue.400' : 'gray.300'}
      borderRadius="md"
      p={10}
      textAlign="center"
      bg={isDragging ? 'blue.50' : 'gray.50'}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      mb={4}
      width="100%"
    >
      <Text color="gray.400" mb={4}>リザルト画面の画像をドラッグ＆ドロップ</Text>
      <Text color="gray.400" mb={4}>または</Text>
      <Button as="label" colorPalette="blue">
        ファイルを選択
        <input
          type="file"
          accept="image/png,image/jpeg"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </Button>
    </Box>
  );
};
