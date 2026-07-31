import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  type TextInput,
} from 'react-native';

import type { RootStackScreenProps } from '../../../navigation/types';
import { Button } from '../../../shared/components/Button';
import { Screen } from '../../../shared/components/Screen';
import { TextField } from '../../../shared/components/TextField';
import { colors, spacing, typography } from '../../../shared/theme';
import { DeviceInfoCard } from '../../device/components/DeviceInfoCard';
import { useDeviceSnapshot } from '../../device/hooks/useDeviceSnapshot';
import { useLocalReports } from '../store/localReportsStore';
import {
  BODY_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  validateReportForm,
  type ReportFormValues,
} from '../validation';

const EMPTY_FORM: ReportFormValues = { title: '', description: '' };

type TouchedFields = Record<keyof ReportFormValues, boolean>;

const UNTOUCHED: TouchedFields = { title: false, description: false };

export function CreateReportScreen({
  navigation,
}: RootStackScreenProps<'CreateReport'>) {
  const { addReport } = useLocalReports();
  const {
    snapshot,
    isCapturing,
    error: deviceError,
    capture,
  } = useDeviceSnapshot();

  const [values, setValues] = useState<ReportFormValues>(EMPTY_FORM);
  const [touched, setTouched] = useState<TouchedFields>(UNTOUCHED);

  const descriptionRef = useRef<TextInput>(null);
  // A second tap can land before the confirmation alert renders; without this
  // ref, a fast double-tap would file the same report twice. Never reset —
  // both alert actions leave the screen.
  const submittedRef = useRef(false);

  // Validation runs on every keystroke so the submit button reflects the
  // current state, but errors are only *shown* for fields the user has left.
  // Validating eagerly while displaying lazily avoids scolding someone for a
  // field they have not finished typing.
  const { errors, isValid } = useMemo(
    () => validateReportForm(values),
    [values],
  );

  const setField = (field: keyof ReportFormValues) => (text: string) =>
    setValues((current) => ({ ...current, [field]: text }));

  const markTouched = (field: keyof ReportFormValues) => () =>
    setTouched((current) => ({ ...current, [field]: true }));

  const handleSubmit = () => {
    if (submittedRef.current || !isValid) return;
    submittedRef.current = true;

    const report = addReport({
      title: values.title.trim(),
      body: values.description.trim(),
      // Undefined when the user never tapped attach, which is what keeps
      // `device` genuinely optional on the report rather than always present
      // and sometimes empty.
      device: snapshot ?? undefined,
    });

    Alert.alert('Report filed', `Saved as report #${report.id}.`, [
      {
        text: 'View report',
        onPress: () =>
          navigation.replace('ReportDetail', { reportId: report.id }),
      },
      { text: 'Done', style: 'cancel', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        // iOS pushes content above the keyboard; Android's windowSoftInputMode
        // already resizes the window, so padding there would double-count.
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <TextField
            label="Title"
            value={values.title}
            onChangeText={setField('title')}
            onBlur={markTouched('title')}
            error={touched.title ? errors.title : null}
            hint={`${values.title.trim().length}/${TITLE_MAX_LENGTH}`}
            placeholder="Short summary of the report"
            maxLength={TITLE_MAX_LENGTH}
            returnKeyType="next"
            onSubmitEditing={() => descriptionRef.current?.focus()}
            autoCapitalize="sentences"
          />

          <TextField
            ref={descriptionRef}
            label="Description"
            value={values.description}
            onChangeText={setField('description')}
            onBlur={markTouched('description')}
            error={touched.description ? errors.description : null}
            hint={`${values.description.trim().length}/${BODY_MAX_LENGTH}`}
            placeholder="What happened, where, and when"
            maxLength={BODY_MAX_LENGTH}
            multiline
            numberOfLines={8}
            style={styles.multiline}
            textAlignVertical="top"
          />

          <Button
            label={
              isCapturing
                ? 'Reading device…'
                : snapshot
                  ? 'Refresh Device Information'
                  : 'Attach Device Information'
            }
            variant="secondary"
            onPress={capture}
            disabled={isCapturing}
          />

          {deviceError ? (
            <Text style={styles.deviceError}>{deviceError}</Text>
          ) : null}

          {snapshot ? (
            <DeviceInfoCard snapshot={snapshot} title="Attached to this report" />
          ) : null}

          <Button
            label="Submit report"
            onPress={handleSubmit}
            disabled={!isValid}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  multiline: {
    minHeight: 160,
  },
  deviceError: {
    ...typography.caption,
    color: colors.danger,
  },
});
