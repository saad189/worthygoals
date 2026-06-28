/**
 * Worthy Goals — Design-system demo (U1 exit proof)
 * ─────────────────────────────────────────────────────────────
 * A gallery assembled purely from the ui/ shell primitives + tokens — no raw
 * hex, no inline fonts. Reachable at /design-system; not in the tab nav. Serves
 * as the living reference for the reskins (U3–U8) and the hex-lint proof.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen, Header, Card, Button, MentorAvatar, ProgressRing, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';

const MENTORS = [
  { id: 'marcus', name: 'Marcus', role: 'the lieutenant', line: '“Same time tomorrow. Don’t make me come looking.”' },
  { id: 'lyra', name: 'Lyra', role: 'the steady one', line: '“You’re allowed to be tired. Just don’t be done.”' },
  { id: 'goggs', name: 'Goggs', role: 'the volume', line: '“NO EXCUSES. WHO’S GOT NEXT?”' },
];

export default function DesignSystemDemo() {
  const { space } = useAppTheme();
  const [selected, setSelected] = useState('marcus');
  const gap = { gap: space['3'] } as const;

  return (
    <Screen scroll>
      <Header eyebrow="WORTHY GOALS · DESIGN SYSTEM" title="The voice, in parts." />

      <Text variant="eyebrow" style={{ marginBottom: space['2'] }}>TYPE ROLES</Text>
      <Card style={{ marginBottom: space['6'] }}>
        <View style={gap}>
          <Text variant="display">Find someone who’ll hold you to it.</Text>
          <Text variant="title">Section title — Geist semibold</Text>
          <Text variant="body">Body copy in Geist. The everyday reading voice for instructions, descriptions, and the bulk of the UI.</Text>
          <Text variant="muted">Muted secondary copy — captions and supporting detail.</Text>
          <Text variant="mono">11:14 AM · COST ~30 MIN/SESSION</Text>
        </View>
      </Card>

      <Text variant="eyebrow" style={{ marginBottom: space['2'] }}>PERSONALITIES</Text>
      <View style={[gap, { marginBottom: space['6'] }]}>
        {MENTORS.map((m) => (
          <Card key={m.id} selected={selected === m.id} onPress={() => setSelected(m.id)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space['3'] }}>
              <MentorAvatar mentor={m.id} size={44} />
              <View style={{ flex: 1 }}>
                <Text variant="label">{m.name}</Text>
                <Text variant="eyebrow">{m.role.toUpperCase()}</Text>
                <Text variant="muted" style={{ marginTop: space['1'] }}>{m.line}</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>

      <Text variant="eyebrow" style={{ marginBottom: space['2'] }}>PROGRESS</Text>
      <View style={{ flexDirection: 'row', gap: space['4'], marginBottom: space['6'] }}>
        {[0, 0.66, 1].map((p) => (
          <ProgressRing key={p} progress={p} size={68}>
            <Text variant="title">{Math.round(p * 100)}</Text>
            <Text variant="eyebrow">%</Text>
          </ProgressRing>
        ))}
      </View>

      <Text variant="eyebrow" style={{ marginBottom: space['2'] }}>BUTTONS</Text>
      <View style={[gap, { marginBottom: space['10'] }]}>
        <Button label="Get started" variant="primary" />
        <Button label="Sign me up — the harder voice" variant="accent" />
        <Button label="I already have an account" variant="link" />
        <Button label="Loading…" variant="primary" loading />
      </View>
    </Screen>
  );
}
