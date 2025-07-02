import { useEffect, useMemo } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import { useAuthStore } from './store/authStore';
import { useCustomStore } from './store/customStore';
import { LoginForm } from './components/ui/LoginForm';
import { Layout } from './components/layout/Layout';
import { CustomDetail } from './components/custom/CustomDetail';
import { MatchDetail } from './components/custom/MatchDetail';
import { AnnouncementDialog } from './components/ui/AnnouncementDialog';
import { useDialog } from './hooks/useDialog';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentCustomId = useCustomStore((state) => state.currentCustomId);
  const currentMatchId = useCustomStore((state) => state.currentMatchId);

  const hasAgreedToTerms = useAuthStore((state) => state.hasAgreedToTerms);
  const agreeToTerms = useAuthStore((state) => state.agreeToTerms);
  const { openDialog, generateDialogKey } = useDialog();
  
  // ダイアログキーを生成
  const termsDialogKey = useMemo(() => generateDialogKey('terms-agreement'), [generateDialogKey]);
  
  useEffect(() => {
    if (isAuthenticated && !hasAgreedToTerms) {
      openDialog(termsDialogKey, {
        title: '必ずお読みください',
        confirmText: "同意",
        showCancel: false,
      });
    }
  }, [isAuthenticated, hasAgreedToTerms, openDialog, termsDialogKey, agreeToTerms]);


  const renderMainContent = () => {
    if (currentMatchId) {
      return <MatchDetail />;
    }

    if (currentCustomId) {
      return <CustomDetail />;
    }

    return (
      <Box p={4}>
        <Text fontSize="lg">
          カスタムを選択するか、新しいカスタムを始めてください。
        </Text>
      </Box>
    );
  };

  return (
    <Box>
      {isAuthenticated ? (
        <>
          <Layout>
            {renderMainContent()}
          </Layout>
          
          {/* 利用規約同意ダイアログ */}
          <AnnouncementDialog dialogKey={termsDialogKey} onConfirm={agreeToTerms}>
            <VStack align="stretch" color="gray.950">
              <Text>
                このツールはAIによりカスタム結果を解析しますが、間違った解析結果を出す場合があります。
              </Text>
              <Text>
                このツールによる集計結果を鵜呑みにせず、カスタム運営者が最終確認することを推奨します。
              </Text>
              <Text>
                カスタムに関連するトラブル等の責任を一切負いません。
              </Text>
            </VStack>
          </AnnouncementDialog>
        </>
      ) : (
        <LoginForm />
      )}
    </Box>
  );
}

export default App;
