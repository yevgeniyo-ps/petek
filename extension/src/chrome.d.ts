// Chrome Extension API type declarations (subset used by Petek)
declare namespace chrome {
  namespace runtime {
    function sendMessage<T = unknown>(message: unknown): Promise<T>;
  }

  namespace sidePanel {
    function setPanelBehavior(options: { openPanelOnActionClick: boolean }): Promise<void>;
  }
}
