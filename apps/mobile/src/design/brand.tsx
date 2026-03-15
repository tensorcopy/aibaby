import type { PropsWithChildren } from "react";
import type { ScrollViewProps, StyleProp, ViewStyle } from "react-native";
import { ScrollView, StyleSheet, View } from "react-native";

export const brandColors = {
  page: "#fff7f1",
  surface: "#fffdf8",
  surfaceStrong: "#fff0e3",
  surfaceMint: "#edf9f4",
  surfaceSky: "#eef8ff",
  surfaceButter: "#fff6d7",
  borderSoft: "#f2d7c8",
  borderWarm: "#f6bf9d",
  primary: "#ff7b54",
  primaryPressed: "#f06b43",
  mint: "#6ecfb4",
  mintDeep: "#2f7d6b",
  sky: "#65bfd9",
  butter: "#f6c85f",
  text: "#223548",
  textMuted: "#5f7282",
  textSoft: "#7b8b98",
  successSurface: "#e6f7ef",
  successText: "#276454",
  warningSurface: "#fff1db",
  warningText: "#9a5a1e",
  dangerSurface: "#fff1ef",
  dangerText: "#b04a44",
  white: "#ffffff",
} as const;

export const brandShadow = {
  shadowColor: "#e59c7d",
  shadowOpacity: 0.18,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 12 },
  elevation: 8,
} as const;

export const brandLayout = {
  screenPadding: 22,
  sectionGap: 18,
  cardRadius: 28,
  innerRadius: 20,
  pillRadius: 999,
} as const;

type BrandScrollViewProps = PropsWithChildren<
  ScrollViewProps & {
    contentContainerStyle?: StyleProp<ViewStyle>;
  }
>;

export function BrandScrollView({
  children,
  contentContainerStyle,
  style,
  ...props
}: BrandScrollViewProps) {
  return (
    <View style={styles.page}>
      <View pointerEvents="none" style={styles.backdrop}>
        <View style={[styles.orb, styles.orbCoral]} />
        <View style={[styles.orb, styles.orbMint]} />
        <View style={[styles.orb, styles.orbSky]} />
      </View>
      <ScrollView
        {...props}
        style={[styles.scroll, style]}
        contentContainerStyle={[styles.content, contentContainerStyle]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: brandColors.page,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: brandLayout.screenPadding,
    paddingBottom: 40,
    gap: brandLayout.sectionGap,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.55,
  },
  orbCoral: {
    top: -60,
    right: -20,
    width: 220,
    height: 220,
    backgroundColor: "#ffd7c4",
  },
  orbMint: {
    top: 200,
    left: -70,
    width: 180,
    height: 180,
    backgroundColor: "#d7f5e8",
  },
  orbSky: {
    bottom: 80,
    right: -60,
    width: 220,
    height: 220,
    backgroundColor: "#dff4ff",
  },
});
