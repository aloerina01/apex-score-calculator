import { useState } from 'react';
import {
  Box,
  Input,
  Stack,
  Heading,
  Text,
} from '@chakra-ui/react';
import { useAuthStore } from '../../store/authStore';

export const LoginForm = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const login = useAuthStore((state) => state.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // 意図的な遅延を追加（セキュリティ対策）
    setTimeout(() => {
      const success = login(inviteCode);
      
      if (success) {
        setMessage({
          text: 'ログイン成功',
          type: 'success'
        });
      } else {
        setAttempts(prev => prev + 1);
        setMessage({
          text: '招待コードが正しくありません',
          type: 'error'
        });
      }
      
      setLoading(false);
      setInviteCode('');
    }, 500);
  };

  return (
    <Box 
      width="100vw" 
      height="100vh" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      bg="gray.50"
    >
      <Box 
        width="100%" 
        maxW="400px" 
        p={8} 
        borderWidth={1} 
        borderRadius="lg" 
        boxShadow="lg" 
        bg="white"
      >
        <Stack gap={6}>
          <Box textAlign="center">
            <Heading size="3xl" fontWeight="bold" color="blue.600">PexScorer</Heading>
            <Text mt={2} color="gray.500">Apexカスタムマッチのスコア計算ツール</Text>
          </Box>
          
          <form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Box>
                <Input
                  type="password"
                  value={inviteCode}
                  variant="outline"
                  color="gray.950"
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="招待コード"
                  size="md"
                  disabled={attempts >= 5}
                />
              </Box>
              
              {message && (
                <Text color={message.type === 'success' ? 'green.500' : 'red.500'}>
                  {message.text}
                </Text>
              )}
              
              {attempts >= 5 && (
                <Text color="red.500" fontSize="sm">
                  ログイン試行回数が上限に達しました。しばらく時間をおいてから再度お試しください。
                </Text>
              )}
              
              <button
                type="submit"
                disabled={attempts >= 5 || !inviteCode}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '16px',
                  backgroundColor: attempts >= 5 || !inviteCode ? '#A0AEC0' : '#3182CE',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: attempts >= 5 || !inviteCode ? 'not-allowed' : 'pointer',
                }}
              >
                ログイン
              </button>
            </Stack>
          </form>
        </Stack>
      </Box>
    </Box>
  );
};
