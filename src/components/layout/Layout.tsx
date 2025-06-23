import { Flex } from '@chakra-ui/react';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <Flex direction="column" height="100vh" width="100vw" overflow="hidden">
      <Header />
      
      <Flex flex="1" overflow="hidden" width="100%">
        <Sidebar/>
        <MainContent>{children}</MainContent>
      </Flex>
    </Flex>
  );
};
