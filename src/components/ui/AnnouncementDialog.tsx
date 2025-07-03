import { useEffect, type ReactNode } from 'react';
import { Button, Dialog, Portal } from "@chakra-ui/react";
import { useDialogStore } from "../../store/dialogStore";

type AnnouncementDialogProps<T = never> = {
  dialogKey: string;
  children?: ReactNode;
  onConfirm?: (payload?: T) => void;
};

export const AnnouncementDialog = ({ dialogKey, children, onConfirm }: AnnouncementDialogProps) => {
  // ダイアログストアから状態を取得
  const openedDialogKey = useDialogStore((state) => state.openedDialogKey);
  const config = useDialogStore((state) => state.configs[dialogKey]);
  const closeDialog = useDialogStore((state) => state.closeDialog);
  
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeDialog();
  };

  // Enterキーのイベントハンドラを追加
  useEffect(() => {
    // ダイアログが開いている場合のみイベントリスナーを追加
    if (openedDialogKey === dialogKey && config) {
      // configからisValidを取得
      const isValid = config.isValid ?? true;
      // isValidが関数の場合は実行して結果を取得、そうでなければそのまま使用
      const isButtonEnabled = typeof isValid === 'function' ? isValid() : isValid;
      
      const handleKeyDown = (event: KeyboardEvent) => {
        // event.keyCodeは後方互換性のために利用
        if (event.isComposing || event.keyCode === 229) {
          return;
        }
        
        // Enterキーが押され、かつボタンが有効な場合のみ確認処理を実行
        if (event.key === 'Enter' && isButtonEnabled) {
          // フォーム内のEnterキー押下による意図しない送信を防止
          event.preventDefault();
          handleConfirm();
        }
      };
      
      // イベントリスナーを追加
      document.addEventListener('keydown', handleKeyDown);
      
      // クリーンアップ関数
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [openedDialogKey, dialogKey, config, onConfirm, closeDialog]);
  
  // このダイアログが開いていない場合は何も表示しない
  if (openedDialogKey !== dialogKey || !config) return null;
  
  const { 
    title, 
    confirmText = "OK", 
    cancelText = "キャンセル",
    showCancel = true,
    isValid = true // デフォルトはtrue
  } = config;

  // isValidが関数の場合は実行して結果を取得、そうでなければそのまま使用
  const isButtonEnabled = typeof isValid === 'function' ? isValid() : isValid;

  return (
    <Dialog.Root
      open={true}
      placement="center"
      motionPreset="scale"
      trapFocus={true}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxWidth="500px" width="90%">
            <Dialog.Header>
              <Dialog.Title color="gray.950" fontSize="xl" fontWeight="bold">
                {title}
              </Dialog.Title>
            </Dialog.Header>
            
            <Dialog.Body>
              {children}
            </Dialog.Body>
            
            <Dialog.Footer>
              {showCancel && (
                <Button 
                  variant="outline" 
                  mr={3} 
                  onClick={closeDialog}
                >
                  {cancelText}
                </Button>
              )}
              <Dialog.ActionTrigger asChild>
                <Button 
                  colorPalette="blue" 
                  width={showCancel ? "auto" : "100%"} 
                  onClick={handleConfirm}
                  disabled={!isButtonEnabled}
                >
                  {confirmText}
                </Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
