import { Box, Flex, Heading } from '@chakra-ui/react';
import { useCustomStore } from '../../store/customStore';
import { useMatchStore } from '../../store/matchStore';
import apexBgImage from '../../assets/apex-bg.jpg';

export const Header = () => {
  const currentMatchId = useCustomStore((state) => state.currentMatchId);
  const getCurrentCustom = useCustomStore((state) => state.getCurrentCustom);
  const getMatchById = useMatchStore((state) => state.getMatchById);

  const currentCustom = getCurrentCustom();
  const currentMatch = currentMatchId ? getMatchById(currentMatchId) : null;

  const getHeaderTitle = () => {
    if (!currentCustom) return 'PexScorer';
    
    if (currentMatch) {
      return `${currentCustom.name} - 第${currentMatch.matchNumber}マッチ`;
    }
    
    return currentCustom.name;
  };

  return (
    <Box 
      as="header" 
      backgroundImage={`url(${apexBgImage})`} 
      backgroundSize="cover"
      backgroundPosition="top"
      color="white" 
      py={4} 
      px={6} 
      boxShadow="md"
    >
      <Flex align="center">
        <Heading size="3xl" mr="auto" ml="auto" textShadow="0px 0px 8px rgba(0,0,0,0.8)">{getHeaderTitle()}</Heading>
      </Flex>
    </Box>
  );
};
