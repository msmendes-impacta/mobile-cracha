import { useSession } from '../contexts/SessionContext';
import { DataErrorPage } from '../pages/DataErrorPage';
import { StartupScreen } from '../pages/StartupScreen';
import { PrivateStack } from './PrivateStack';
import { PublicStack } from './PublicStack';

/**
 * Chooses which screens exist based on the session status (research R2). Screens of the
 * other status are not mounted, so system Back can never reach them (FR-025).
 * Corrupt data mounts no navigator at all: only the reset leaves the error (FR-031).
 */
export function RootNavigator() {
  const { status } = useSession();
  switch (status) {
    case 'signedOut':
      return <PublicStack />;
    case 'signedIn':
      return <PrivateStack />;
    case 'dataError':
      return <DataErrorPage />;
    case 'loading':
    default:
      return <StartupScreen />;
  }
}
