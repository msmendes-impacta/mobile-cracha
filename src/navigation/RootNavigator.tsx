import { useSession } from '../contexts/SessionContext';
import { StartupScreen } from '../pages/StartupScreen';
import { PrivateStack } from './PrivateStack';
import { PublicStack } from './PublicStack';

/**
 * Chooses which screens exist based on the session status (research R2). Screens of the
 * other status are not mounted, so system Back can never reach them (FR-025).
 * The data error screen arrives in T058; until then corrupt data keeps the startup screen.
 */
export function RootNavigator() {
  const { status } = useSession();
  switch (status) {
    case 'signedOut':
      return <PublicStack />;
    case 'signedIn':
      return <PrivateStack />;
    case 'loading':
    case 'dataError':
    default:
      return <StartupScreen />;
  }
}
