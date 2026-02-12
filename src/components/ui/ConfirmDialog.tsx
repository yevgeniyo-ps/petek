import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete' }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-[15px] font-semibold text-white mb-2">{title}</h3>
        <p className="text-[13px] text-[#7a7890] mb-6">{message}</p>
        <div className="flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] text-[#7a7890] hover:text-white rounded-lg hover:bg-white/[0.04] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="px-5 py-2 text-[13px] bg-[#f87171] hover:bg-[#ef4444] text-white font-medium rounded-full transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
