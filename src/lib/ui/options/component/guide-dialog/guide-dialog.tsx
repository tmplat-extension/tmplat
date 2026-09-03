import Dialog from '@mui/material/Dialog';
import { useTabs } from 'extension/tab/tabs.context';
import { Guide } from 'extension/ui/common/components/guide/guide';

export function GuideDialog({ onClose, open }: GuideDialogProps) {
  const tabs = useTabs();

  const handleClose = () => {
    onClose?.({});
  };

  const handleOpenInNewTab = () => {
    void tabs.createExtensionTab('guide.html');
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
