import { Stack } from "expo-router";
import { OfflineBanner } from "../components/OfflineBanner";
import { View } from "react-native";

import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="board/[id]" options={{ headerShown: true, title: "Board" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
