import { Box, Text } from '@chakra-ui/react';
import { useAuthStore } from './store/authStore';
import { useCustomStore } from './store/customStore';
import { LoginForm } from './components/ui/LoginForm';
import { Layout } from './components/layout/Layout';
import { CustomDetail } from './components/custom/CustomDetail';
import { MatchDetail } from './components/custom/MatchDetail';
import { AnnouncementDialog } from './components/ui/AnnouncementDialog';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasAgreedToTerms = useAuthStore((state) => state.hasAgreedToTerms);
  const agreeToTerms = useAuthStore((state) => state.agreeToTerms);
  const currentCustomId = useCustomStore((state) => state.currentCustomId);
  const currentMatchId = useCustomStore((state) => state.currentMatchId);

  // ダイアログの表示制御
  const showAnnouncementDialog = isAuthenticated && !hasAgreedToTerms;
  
  // ダイアログを閉じる処理
  const handleCloseDialog = () => {
    agreeToTerms();
  };

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
          
          <AnnouncementDialog 
            isOpen={showAnnouncementDialog} 
            onClose={handleCloseDialog} 
          />
        </>
      ) : (
        <LoginForm />
      )}
    </Box>
  );
}

export default App;
