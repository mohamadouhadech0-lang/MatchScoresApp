import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Extends app.json with settings that depend on environment variables.
 *
 * Google Sign-In (development/production builds only, not Expo Go):
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID  — "Web application" OAuth client (needed on Android for idToken)
 *   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID  — "iOS" OAuth client
 * The iOS URL scheme required by the config plugin is derived from the iOS client ID.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const plugins = [...(config.plugins ?? [])];

  // The plugin only registers the iOS URL scheme (and throws without one); the native
  // module itself is autolinked, so Android works without it.
  if (iosClientId) {
    const iosUrlScheme = `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}`;
    plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme }]);
  }

  return {
    ...config,
    name: config.name ?? 'Ziscor',
    slug: config.slug ?? 'match-scores-app',
    plugins,
  };
};
