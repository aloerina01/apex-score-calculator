import { useState, useEffect } from 'react';

/**
 * 結果の段階的表示処理を担当するカスタムフック
 * 
 * @param items 表示対象のアイテム配列
 * @param isEnabled 段階的表示を有効にするかどうか
 * @param interval 表示間隔（ミリ秒）
 * @returns 段階的表示に関する状態と関数
 */
export function useAnimatedDisplay<T extends { teamId: string }>(
  items: T[],
  isEnabled: boolean,
  interval: number = 50
) {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [displayTimerId, setDisplayTimerId] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  
  // 段階的表示処理
  useEffect(() => {
    // 表示対象がない場合や無効化されている場合は何もしない
    if (!isEnabled || items.length === 0) {
      return;
    }
    
    // 前回のタイマーがあればクリア
    if (displayTimerId !== null) {
      clearInterval(displayTimerId);
      setDisplayTimerId(null);
    }
    
    // 表示状態をリセット
    setVisibleItems([]);
    setIsComplete(false);
    
    // 順位でソートしたアイテムの配列を作成（昇順）
    const sortedItems = [...items].sort((a: any, b: any) => {
      if ('placement' in a && 'placement' in b) {
        return (a as any).placement - (b as any).placement;
      }
      return 0;
    });
    
    // 段階的表示用の変数
    let displayedCount = 0;
    const totalItems = sortedItems.length;
    
    // タイマーで段階的に表示
    const timerId = window.setInterval(() => {
      // 現在のインデックスが有効範囲内かチェック
      if (displayedCount < totalItems) {
        const currentItem = sortedItems[displayedCount];
        
        // 現在のアイテムが存在する場合のみ処理
        if (currentItem) {
          // 1アイテムずつ追加
          setVisibleItems(prev => {
            // 新しい配列を作成して返す（参照の問題を避けるため）
            const newItems = [...prev];
            
            // まだ追加されていないアイテムのみを追加
            if (!newItems.some(item => item.teamId === currentItem.teamId)) {
              newItems.push(currentItem);
            }
            
            return newItems;
          });
        }
        
        // カウントを増やす（アイテムの追加後）
        displayedCount++;
      } else {
        // 全アイテム表示完了
        clearInterval(timerId);
        setDisplayTimerId(null);
        setIsComplete(true);
      }
    }, interval);
    
    setDisplayTimerId(timerId);
    
    // コンポーネントのアンマウント時にタイマーをクリア
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [items, isEnabled, interval]);
  
  // タイマーのクリーンアップ
  useEffect(() => {
    return () => {
      if (displayTimerId !== null) {
        clearInterval(displayTimerId);
      }
    };
  }, [displayTimerId]);
  
  // 表示をリセットする関数
  const resetDisplay = () => {
    if (displayTimerId !== null) {
      clearInterval(displayTimerId);
      setDisplayTimerId(null);
    }
    setVisibleItems([]);
    setIsComplete(false);
  };
  
  return {
    visibleItems,
    isComplete,
    resetDisplay
  };
}
