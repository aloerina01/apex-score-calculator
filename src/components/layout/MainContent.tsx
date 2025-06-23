import { Box, Flex } from '@chakra-ui/react';

interface MainContentProps {
  children: React.ReactNode;
}

export const MainContent = ({ children }: MainContentProps) => {
  return (
    <Flex bg="white" direction="column" flex="1" height="100%" overflow="hidden">
      <Box flex="1" p={4} overflowY="auto">
        {children}
      </Box>
    </Flex>
  );
};
