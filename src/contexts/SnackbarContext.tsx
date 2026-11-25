import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { Snackbar } from '../components/Snackbar';

interface SnackbarContextValue {
  /** Shows a short, announced message over any screen ("Usuário salvo"). */
  showSnackbar(message: string): void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

/**
 * App-wide snackbar, so a message survives the screen that triggered it (save → back to the
 * list) without passing anything but ids through route params (FR-030).
 */
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const dismiss = useCallback(() => setMessage(null), []);
  const value = useMemo<SnackbarContextValue>(() => ({ showSnackbar: setMessage }), []);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar message={message} onDismiss={dismiss} />
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const value = useContext(SnackbarContext);
  if (!value) throw new Error('useSnackbar must be used inside SnackbarProvider');
  return value;
}
