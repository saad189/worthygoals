/**
 * Worthy Goals — Screen (shell primitive)
 * ─────────────────────────────────────────────────────────────
 * Safe-area + warm-paper background, the base of every flow. Replaces the
 * legacy dark-image `Background` for the re-architected screens (§F). Pure
 * tokens — no raw hex, no OS-dependent surface.
 */
import React, { ReactElement, ReactNode } from 'react';
import { RefreshControlProps, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  children: ReactNode;
  /** Wrap content in a ScrollView. Default false. */
  scroll?: boolean;
  /** Centre content vertically + horizontally (for splash / empty states). */
  center?: boolean;
  /** Horizontal padding from the spacing grid. Default '5' (20pt). */
  padded?: boolean;
  edges?: Edge[];
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  /** Pull-to-refresh control; only applied when `scroll` is true. */
  refreshControl?: ReactElement<RefreshControlProps>;
};

export default function Screen({
  children,
  scroll = false,
  center = false,
  padded = true,
  edges = ['top', 'bottom'],
  style,
  contentStyle,
  refreshControl,
}: Props) {
  const { colors, space } = useAppTheme();

  const inner: ViewStyle = {
    paddingHorizontal: padded ? space['5'] : 0,
    ...(center ? styles.centered : null),
    ...contentStyle,
  };

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }, style]} edges={edges}>
      <StatusBar style="dark" />
      {scroll ? (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={[scroll && !center ? styles.grow : null, inner]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, inner]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flexGrow: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
