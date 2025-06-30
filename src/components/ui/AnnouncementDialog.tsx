import type { ReactNode } from 'react';
import { Button, Dialog, Portal } from "@chakra-ui/react";
import { useDialogStore } from "../../store/dialogStore";

type AnnouncementDialogProps = {
  dialogKey: string;
  children?: ReactNode;
};

export const AnnouncementDialog = ({ dialogKey, children }: AnnouncementDialogProps) => {
  // ダイアログストアから状態を取得
  const openedDialogKey = useDialogStore((state) => state.openedDialogKey);
  const config = useDialogStore((state) => state.configs[dialogKey]);
  const closeDialog = useDialogStore((state) => state.closeDialog);
  
  // このダイアログが開いていない場合は何も表示しない
  if (openedDialogKey !== dialogKey || !config) return null;
  
  const { 
    title, 
    confirmText = "OK", 
    cancelText = "キャンセル",
    onConfirm,
    showCancel = true,
    isValid = true // デフォルトはtrue
  } = config;

  // isValidが関数の場合は実行して結果を取得、そうでなければそのまま使用
  const isButtonEnabled = typeof isValid === 'function' ? isValid() : isValid;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeDialog();
  };

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
