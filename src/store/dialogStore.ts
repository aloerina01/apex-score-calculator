import { create } from 'zustand';

// ダイアログの設定タイプ
export type DialogConfig<T = any> = {
  title: string;
  confirmText: string;
  cancelText?: string;
  onConfirm?: (payload?: T) => void;
  showCancel: boolean;
  isValid?: boolean | (() => boolean); // 確認ボタンの有効/無効を制御
};

// ダイアログストアの状態
interface DialogState {
  // 現在開いているダイアログのキー
  openedDialogKey: string | null;
  
  // ダイアログの設定（キーごと）
  configs: Record<string, DialogConfig>;
  
  // キーを指定してダイアログを開く
  openDialog: (key: string, config: DialogConfig) => void;
  
  // 現在開いているダイアログを閉じる
  closeDialog: () => void;
  
  // キーを指定してダイアログ設定を更新する
  setDialogConfig: (key: string, config: Partial<DialogConfig>) => void;
}

// ダイアログストアの作成
export const useDialogStore = create<DialogState>((set) => ({
  openedDialogKey: null,
  configs: {},
  
  openDialog: (key, config) => {
    set((state) => ({
      openedDialogKey: key,
      configs: {
        ...state.configs,
        [key]: config
      }
    }));
  },
  
  closeDialog: () => {
    set({
      openedDialogKey: null
    });
  },
  
  setDialogConfig: (key, newConfig) => {
    set((state) => {
      const currentConfig = state.configs[key];
      
      return {
        configs: {
          ...state.configs,
          [key]: currentConfig 
            ? { ...currentConfig, ...newConfig } 
            : newConfig as DialogConfig
        }
      };
    });
  }
}));
