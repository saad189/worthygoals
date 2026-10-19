/**
 * Edit a goal or one of its tasks — reached from the goal view in the goals
 * tab ("edit" next to the goal title, "edit" on a task card).
 *
 * Until this existed a goal could not be renamed or removed, and a task could
 * not be made smaller after "Couldn't", which is what the explanation sheet
 * tells the user to do. One screen for both: the same two fields and the same
 * two actions. The backend PATCH/DELETE routes were already complete; deleting
 * a goal cascades to its tasks, completions and explanations.
 */
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Button, Field, Header, Screen, Text } from '@/components/ui';
import { queryClient } from '@/core/queryClient';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useGoals } from '@/hooks/useGoals';
import { useTasks } from '@/hooks/useTasks';
import { goalsApiService } from '@/services/goals.service';
import { tasksService } from '@/services/tasks.service';

type Params = { kind?: string; id?: string; goalId?: string };

const refreshEverywhere = () =>
  Promise.all(
    ['goals', 'tasks', 'dashboard'].map((key) =>
      queryClient.invalidateQueries({ queryKey: [key] }),
    ),
  );

export default function GoalEditScreen() {
  const { space } = useAppTheme();
  const { kind, id, goalId } = useLocalSearchParams<Params>();
  const isGoal = kind === 'goal';

  const { goals } = useGoals();
  const { tasks } = useTasks(isGoal ? null : (goalId ?? null));
  const item = isGoal
    ? goals.find((g) => g.id === id)
    : tasks.find((t) => t.id === id);

  const [title, setTitle] = useState(item?.title ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const noun = isGoal ? 'goal' : 'task';

  if (!id || !item) {
    return (
      <Screen>
        <Header eyebrow={`edit ${noun}`} title="Not found." onBack={() => router.back()} />
        <Text variant="muted">This {noun} isn't here any more.</Text>
      </Screen>
    );
  }

  const save = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Give it a name.');
      return;
    }
    setBusy(true);
    setError('');
    const payload = { title: trimmed, description: description.trim() };
    try {
      if (isGoal) await goalsApiService.update(id, payload);
      else await tasksService.update(id, payload);
      await refreshEverywhere();
      router.back();
    } catch (e: any) {
      setError(e?.message || "Couldn't save. Try again.");
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      if (isGoal) await goalsApiService.remove(id);
      else await tasksService.remove(id);
      await refreshEverywhere();
      router.back();
    } catch (e: any) {
      setError(e?.message || "Couldn't delete. Try again.");
      setBusy(false);
    }
  };

  const confirmRemove = () =>
    Alert.alert(
      `Delete this ${noun}?`,
      isGoal
        ? 'Its tasks, streak and reflections go with it. This can’t be undone.'
        : 'This can’t be undone.',
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: remove },
      ],
    );

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <Header
          eyebrow={`edit ${noun}`}
          title={isGoal ? 'Reshape the goal.' : 'Reshape the task.'}
          onBack={busy ? undefined : () => router.back()}
        />

        <View style={{ gap: space['4'], marginBottom: space['6'] }}>
          <Field
            label={isGoal ? 'The goal' : 'The task'}
            value={title}
            onChangeText={(t: string) => {
              setTitle(t);
              if (error) setError('');
            }}
            maxLength={255}
            disabled={busy}
            errorText={error}
          />
          <Field
            label="Detail"
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={2000}
            disabled={busy}
          />
        </View>

        <Button label="Save" onPress={save} loading={busy} disabled={busy} />
        <Button
          label={`Delete this ${noun}`}
          variant="link"
          onPress={confirmRemove}
          disabled={busy}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
