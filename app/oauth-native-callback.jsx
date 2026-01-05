import { Redirect } from 'expo-router';

export default function Page() {
  // Catch the user returning from the browser and send them to the Home tab
  return <Redirect href="/(tabs)/home" />;
}