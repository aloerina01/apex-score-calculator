import { useCallback } from 'react';
import { useDialogStore, type DialogConfig } from '../store/dialogStore';

// ユニークなダイアログキーを生成するためのカウンター
let dialogKeyCounter = 0;

export const useDialog = () => {
  const openDialog = useDialogStore((state) => state.openDialog);
  const closeDialog = useDialogStore((state) => state.closeDialog);
  const setDialogConfig = useDialogStore((state) => state.setDialogConfig);
  
  // ユニークなダイアログキーを生成する関数
  const generateDialogKey = useCallback((prefix: string = 'dialog') => {
    return `${prefix}-${Date.now()}-${dialogKeyCounter++}`;
  }, []);
  
  // 確認ダイアログを表示
  const showConfirm = useCallback((
    key: string,
    title: string,
    onConfirm: () => void,
    options?: Partial<DialogConfig>
  ) => {
    openDialog(key, {
      title,
      confirmText: options?.confirmText || '確認',
      cancelText: options?.cancelText || 'キャンセル',
      onConfirm,
      showCancel: true,
      ...options
    });
  }, [openDialog]);
  
  // アラートダイアログを表示
  const showAlert = useCallback((
    key: string,
    title: string,
    options?: Partial<DialogConfig>
  ) => {
    openDialog(key, {
      title,
      confirmText: options?.confirmText || 'OK',
      showCancel: false,
      ...options
    });
  }, [openDialog]);
  
  return {
    showConfirm,
    showAlert,
    openDialog,
    closeDialog,
    setDialogConfig,
    generateDialogKey
  };
};
