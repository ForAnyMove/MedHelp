import { Redirect } from 'expo-router';

export default function Index() {
  // Start the application at the Welcome screen in the auth group
  return <Redirect href="/(auth)/welcome" />;
}
