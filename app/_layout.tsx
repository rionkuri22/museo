import { Stack } from "expo-router";
import { OfflineBanner } from "../components/OfflineBanner";
import { View } from "react-native";

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="board/[id]" options={{ headerShown: true, title: "Board" }} />
      </Stack>
    </View>
  );
}
