/**
 * Register profile — Hi-Fi composition (S45 · P-E): editorial header, warm
 * Field inputs, and the selectable-card pattern for gender (replaces the
 * legacy rust DropDownPicker). Profile-creation logic and the DOB picker
 * behaviour (iOS modal / Android inline) are unchanged; on success the
 * personality-match funnel (U4) takes over.
 */
import React, { useReducer, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  Keyboard,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "expo-router";
import { ParamListBase } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { Button, Card, Field, Header, Screen, Text } from "@/components/ui";
import { ROUTE_NAMES } from "@/constants/Routes";
import { calculateAge, getUserLocationAsync, nameValidator } from "@/helpers";
import { useAuth, useLoader, useToast } from "@/hooks";
import userService from "@/services/UserService";
import { useAppTheme } from "@/hooks/useAppTheme";

const GENDER_OPTIONS = [
  { label: "Male", value: "m" },
  { label: "Female", value: "f" },
];

type FormState = {
  firstName: { value: string; error: string };
  lastName: { value: string; error: string };
  gender: { value: string; error: string };
  dateOfBirth: { value: Date | null; error: string };
};

type FormAction =
  | { type: "UPDATE_FIRST_NAME"; payload: string }
  | { type: "UPDATE_LAST_NAME"; payload: string }
  | { type: "UPDATE_GENDER"; payload: string }
  | { type: "UPDATE_DATE_OF_BIRTH"; payload: Date }
  | {
      type: "SET_ERRORS";
      payload: {
        emailError?: string;
        firstNameError?: string;
        lastNameError?: string;
        genderError?: string;
        dateOfBirthError?: string;
      };
    };

const initialState: FormState = {
  firstName: { value: "", error: "" },
  lastName: { value: "", error: "" },
  gender: { value: "", error: "" },
  dateOfBirth: { value: null, error: "" },
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "UPDATE_FIRST_NAME":
      return { ...state, firstName: { value: action.payload, error: "" } };
    case "UPDATE_LAST_NAME":
      return { ...state, lastName: { value: action.payload, error: "" } };
    case "UPDATE_GENDER":
      return { ...state, gender: { value: action.payload, error: "" } };
    case "UPDATE_DATE_OF_BIRTH":
      return { ...state, dateOfBirth: { value: action.payload, error: "" } };
    case "SET_ERRORS":
      return {
        ...state,
        firstName: { ...state.firstName, error: action.payload.firstNameError ?? "" },
        lastName: { ...state.lastName, error: action.payload.lastNameError ?? "" },
        gender: { ...state.gender, error: action.payload.genderError ?? "" },
        dateOfBirth: { ...state.dateOfBirth, error: action.payload.dateOfBirthError ?? "" },
      };
    default:
      return state;
  }
}

export default function RegisterProfileScreen() {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const { colors, space } = useAppTheme();
  const { isLoading, setLoading } = useLoader();
  const { showErrorMessage, showInfoMessage } = useToast();
  const { userProfile, setUserProfile } = useAuth();
  const [formState, dispatch] = useReducer(formReducer, initialState);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const openDOBPicker = () => {
    setTempDate(formState.dateOfBirth.value ?? new Date(2000, 0, 1));
    setShowDatePicker(true);
  };

  const cancelDOBPicker = () => {
    setTempDate(null);
    setShowDatePicker(false);
  };

  const confirmDOBPicker = () => {
    if (tempDate) {
      dispatch({ type: "UPDATE_DATE_OF_BIRTH", payload: tempDate });
    }
    setTempDate(null);
    setShowDatePicker(false);
  };

  const onChangeDate = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      if (_event?.type === "dismissed") {
        setShowDatePicker(false);
        return;
      }

      if (selectedDate) {
        dispatch({ type: "UPDATE_DATE_OF_BIRTH", payload: selectedDate });
      }
      setShowDatePicker(false);
      return;
    }

    if (selectedDate) setTempDate(selectedDate);
  };

  const validateForm = () => {
    const firstNameError = nameValidator(formState.firstName.value);
    const lastNameError = nameValidator(formState.lastName.value);
    const genderError = !formState.gender.value ? "Select a gender" : "";
    const dateOfBirthError = !formState.dateOfBirth.value
      ? "Select a date of birth"
      : "";

    if (firstNameError || lastNameError || genderError || dateOfBirthError) {
      dispatch({
        type: "SET_ERRORS",
        payload: { firstNameError, lastNameError, genderError, dateOfBirthError },
      });
      return false;
    }
    return true;
  };

  const onSubmit = async () => {
    if (!validateForm()) return;

    try {
      Keyboard.dismiss();
      setLoading(true);

      const { firstName, lastName, gender, dateOfBirth } = formState;

      const coords = await getUserLocationAsync();

      const createdProfile = await userService.createProfile({
        email: userProfile?.email as string,
        firstName: firstName.value.trim(),
        lastName: lastName.value.trim(),
        gender: gender.value,
        dateOfBirth: dateOfBirth.value as Date,
        ...coords,
      });

      if (!createdProfile) throw new Error("Profile creation failed");

      setUserProfile(createdProfile);
      showInfoMessage("Profile Completed!");

      // New user → run the personality-match funnel (U4). The funnel's confirm
      // screen resets into the tabs once a mentor + tone are chosen.
      navigation.navigate(ROUTE_NAMES.JOURNEY.self, {
        screen: ROUTE_NAMES.JOURNEY.INTRO_SCREEN,
      });
    } catch (error: any) {
      showErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={staticStyles.flex}
      >
        <Header
          eyebrow="BEFORE WE START"
          title="Who's doing this?"
          style={{ marginTop: space["4"] }}
        />
        <Text variant="muted" style={{ marginBottom: space["6"] }}>
          So your mentors know who they're talking to.
        </Text>

        <Field
          label="First name"
          returnKeyType="next"
          value={formState.firstName.value}
          onChangeText={(text: string) =>
            dispatch({ type: "UPDATE_FIRST_NAME", payload: text })
          }
          errorText={formState.firstName.error}
        />
        <Field
          label="Last name"
          returnKeyType="next"
          value={formState.lastName.value}
          onChangeText={(text: string) =>
            dispatch({ type: "UPDATE_LAST_NAME", payload: text })
          }
          errorText={formState.lastName.error}
        />
        <Field
          label="Email"
          value={userProfile?.email || ""}
          autoCapitalize="none"
          textContentType="emailAddress"
          keyboardType="email-address"
          disabled
        />

        <Text variant="eyebrow" style={{ marginBottom: space["2"] }}>
          Gender
        </Text>
        <View style={[staticStyles.genderRow, { gap: space["3"] }]}>
          {GENDER_OPTIONS.map((option) => (
            <Card
              key={option.value}
              selected={formState.gender.value === option.value}
              onPress={() =>
                dispatch({ type: "UPDATE_GENDER", payload: option.value })
              }
              style={staticStyles.genderCard}
            >
              <Text variant="label" style={staticStyles.genderLabel}>
                {option.label}
              </Text>
            </Card>
          ))}
        </View>
        {formState.gender.error ? (
          <Text variant="muted" color="dangerColor" style={{ marginTop: space["2"] }}>
            {formState.gender.error}
          </Text>
        ) : null}

        <Pressable
          onPress={openDOBPicker}
          accessibilityRole="button"
          accessibilityLabel="Date of birth"
          style={{ marginTop: space["4"] }}
        >
          <View pointerEvents="none">
            <Field
              label="Date of birth"
              value={formState.dateOfBirth.value?.toDateString() || ""}
              placeholder="Tap to pick a date"
              errorText={formState.dateOfBirth.error}
              description={
                formState.dateOfBirth.value
                  ? "You are " +
                    calculateAge(formState.dateOfBirth.value.toDateString()) +
                    " years old"
                  : ""
              }
              editable={false}
            />
          </View>
        </Pressable>

        {showDatePicker && Platform.OS === "android" && (
          <DateTimePicker
            value={formState.dateOfBirth.value || new Date(2000, 0, 1)}
            mode="date"
            display="spinner"
            onChange={onChangeDate}
            maximumDate={new Date()}
          />
        )}

        {showDatePicker && Platform.OS === "ios" && (
          <Modal transparent animationType="fade">
            <View style={[staticStyles.datePickerModalOverlay, { backgroundColor: colors.overlayBlack }]}>
              <View style={[staticStyles.datePickerModalContent, { backgroundColor: colors.surface }]}>
                <DateTimePicker
                  value={tempDate || formState.dateOfBirth.value || new Date(2000, 0, 1)}
                  mode="date"
                  display="spinner"
                  onChange={onChangeDate}
                  maximumDate={new Date()}
                />
                <View style={staticStyles.datePickerActions}>
                  <TouchableOpacity onPress={cancelDOBPicker}>
                    <Text variant="label" color="textMuted">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={confirmDOBPicker}>
                    <Text variant="label">OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        <Button
          label="Continue"
          onPress={onSubmit}
          loading={isLoading}
          style={{ marginTop: space["6"], marginBottom: space["6"] }}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const staticStyles = StyleSheet.create({
  flex: { flex: 1 },
  genderRow: {
    flexDirection: "row",
  },
  genderCard: {
    flex: 1,
  },
  genderLabel: {
    textAlign: "center",
  },
  datePickerModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerModalContent: {
    width: "90%",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingHorizontal: 10,
  },
});
