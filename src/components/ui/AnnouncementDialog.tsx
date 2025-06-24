import { Button, Dialog, Portal, Text, VStack } from "@chakra-ui/react";

interface AnnouncementDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnnouncementDialog = ({ isOpen, onClose }: AnnouncementDialogProps) => {
  if (!isOpen) return null;

  return (
    <Dialog.Root
      open={isOpen}
      placement="center"
      motionPreset="scale"
      trapFocus={true}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxWidth="500px" width="90%">
            <Dialog.Header>
              <Dialog.Title color="red.600" fontSize="xl" fontWeight="bold">
                必ずお読みください
              </Dialog.Title>
            </Dialog.Header>
            
            <Dialog.Body>
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
            </Dialog.Body>
            
            <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                    <Button 
                        colorScheme="blue" 
                        width="100%" 
                        onClick={onClose}
                    >
                同意
              </Button>
                </Dialog.ActionTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
