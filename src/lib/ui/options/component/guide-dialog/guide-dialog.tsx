import Dialog from '@mui/material/Dialog';
import { useLogger } from 'extension/common/logging/logging.context';
import { useTabs } from 'extension/tab/tabs.context';
import { Guide } from 'extension/ui/common/components/guide/guide';

export function GuideDialog({ onClose, open }: GuideDialogProps) {
  const logger = useLogger('GuideDialog');
  const tabs = useTabs();

  const handleClose = () => {
    onClose?.({});
  };

  const handleOpenInNewTab = async () => {
    try {
      await tabs.createExtensionTab('guide.html');
    } catch (e) {
      logger.warn('Failed to open guide in a new tab:', e);
    }
  };

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <Guide onClose={handleClose} onOpenInNewTab={handleOpenInNewTab} />
    </Dialog>
  );
}

export type GuideDialogProps = {
  onClose?: (event: object) => void;
  open: boolean;
};
