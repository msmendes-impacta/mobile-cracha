import { useSession } from '../contexts/SessionContext';
import { StartupScreen } from '../pages/StartupScreen';

/**
 * Chooses which screens exist based on the session status (research R2). Screens of
 * the other status are not mounted, so system Back can never reach them (FR-025).
 * Public/Private stacks are registered in US1 (T035) and US2 (T040); the data-error
 * screen in T058. Until then every status shows the startup screen.
 */
export function RootNavigator() {
  const { status } = useSession();
  switch (status) {
    case 'loading':
    default:
      return <StartupScreen />;
  }
}
