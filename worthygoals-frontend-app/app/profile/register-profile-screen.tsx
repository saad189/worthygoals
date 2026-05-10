import React, { useReducer, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  Platform,
  Modal,
  View,
  Text,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker"; // or another datepicker
import { useNavigation } from "expo-router";
import { ParamListBase } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import DropDownPicker from "react-native-dropdown-picker";
import Background from "@/components/SubComponents/Background";
import Header from "@/components/SubComponents/Header";
import TextInput from "@/components/SubComponents/TextInput";
import Button from "@/components/SubComponents/Button";
import { ROUTE_NAMES } from "@/constants/Routes";
import { theme } from "@/core";
import { calculateAge, getUserLocationAsync, nameValidator } from "@/helpers";
import { useAuth, useLoader, useToast } from "@/hooks";
import userService from "@/services/UserService";

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
        firstName: {
          ...state.firstName,
          error: action.payload.firstNameError ?? "",
        },
        lastName: {
          ...state.lastName,
          error: action.payload.lastNameError ?? "",
        },
        gender: {
          ...state.gender,
          error: action.payload.genderError ?? "",
        },
        dateOfBirth: {
          ...state.dateOfBirth,
          error: action.payload.dateOfBirthError ?? "",
        },
      };
    default:
      return state;
  }
}

export default function RegisterProfileScreen() {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const { isLoading, setLoading } = useLoader();
  const { showErrorMessage, showInfoMessage } = useToast();
  const { userProfile, setUserProfile } = useAuth();
  const [formState, dispatch] = useReducer(formReducer, initialState);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: "Male", value: "m" },
    { label: "Female", value: "f" },
  ]);

  // For the DatePicker visibility
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
        payload: {
          firstNameError,
          lastNameError,
          genderError,
          dateOfBirthError,
        },
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

      navigation.navigate(ROUTE_NAMES.TABS.self, {
        screen: ROUTE_NAMES.TABS.HOME_SCREEN,
      });
    } catch (error: any) {
      showErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      {/* <Logo isWhite={true} /> */}
      <Header>Your Profile</Header>

      {/* First Name */}
      <TextInput
        label="First Name"
        returnKeyType="next"
        value={formState.firstName.value}
        onChangeText={(text: string) =>
          dispatch({ type: "UPDATE_FIRST_NAME", payload: text })
        }
        error={!!formState.firstName.error}
        errorText={formState.firstName.error}
      />

      {/* Last Name */}
      <TextInput
        label="Last Name"
        returnKeyType="next"
        value={formState.lastName.value}
        onChangeText={(text: string) =>
          dispatch({ type: "UPDATE_LAST_NAME", payload: text })
        }
        error={!!formState.lastName.error}
        errorText={formState.lastName.error}
      />

      {/* Email */}
      <TextInput
        label="Email"
        returnKeyType="next"
        value={userProfile?.email || ""}
        autoCapitalize="none"
        textContentType="emailAddress"
        keyboardType="email-address"
        disabled={true}
      />

      <DropDownPicker
        open={open}
        value={formState.gender.value}
        items={items}
        setOpen={setOpen}
        setValue={(callback) => {
          const value = callback(formState.gender.value);
          dispatch({ type: "UPDATE_GENDER", payload: value });
        }}
        setItems={setItems}
        labelStyle={{ color: theme.colors.textWhite }}
        theme="LIGHT"
        multiple={false}
        mode="BADGE"
        placeholder="Gender"
        style={styles.input}
      />

      <TouchableOpacity onPress={openDOBPicker} style={styles.datePickerButton}>
        <View pointerEvents="none">
          <TextInput
            disabled={true}
            label="Date of Birth"
            returnKeyType="next"
            value={formState.dateOfBirth.value?.toDateString() || ""}
            error={!!formState.dateOfBirth.error}
            errorText={formState.dateOfBirth.error}
            description={
              formState.dateOfBirth.value
                ? "You are " +
                  calculateAge(formState.dateOfBirth.value.toDateString()) +
                  " years old"
                : ""
            }
          />
        </View>

        {/* Android inline picker */}
        {showDatePicker && Platform.OS === "android" && (
          <DateTimePicker
            value={formState.dateOfBirth.value || new Date(2000, 0, 1)}
            mode="date"
            display="spinner"
            onChange={onChangeDate}
            maximumDate={new Date()}
          />
        )}
      </TouchableOpacity>

      {/* iOS modal picker with explicit actions */}
      {showDatePicker && Platform.OS === "ios" && (
        <Modal transparent animationType="fade">
          <View style={styles.datePickerModalOverlay}>
            <View style={styles.datePickerModalContent}>
              <DateTimePicker
                value={
                  tempDate ||
                  formState.dateOfBirth.value ||
                  new Date(2000, 0, 1)
                }
                mode="date"
                display="spinner"
                onChange={onChangeDate}
                maximumDate={new Date()}
              />
              <View style={styles.datePickerActions}>
                <TouchableOpacity onPress={cancelDOBPicker}>
                  <Text style={styles.datePickerActionText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmDOBPicker}>
                  <Text style={styles.datePickerActionText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <Button
        mode="contained"
        onPress={onSubmit}
        style={styles.button}
        loading={isLoading}
      >
        Submit
      </Button>
      {/* <View style={styles.row}>
                <TouchableOpacity onPress={() => navigation.replace(ROUTE_NAMES.HOME_SCREEN)}>
                    <Text style={{ color: theme.colors.primary }}>
                        <Text style={styles.link}>Skip</Text>
                    </Text>
                </TouchableOpacity>
            </View> */}
    </Background>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    marginTop: 24,
  },
  link: {
    fontWeight: "bold",
    color: theme.colors.secondary,
  },
  separateLabel: {
    alignSelf: "flex-start",
    fontSize: 14,
    color: "#666",
    marginVertical: 10,
    marginLeft: 5,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    marginLeft: 4,
  },
  input: {
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
    marginVertical: 10,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 14,
  },
  picker: {
    borderRadius: 5,
  },
  row: {
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 5,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  datePickerContainer: {
    width: "100%",
    marginTop: 20,
  },
  datePickerButton: {
    width: "100%",
  },
  datePickerButtonText: {
    color: "#000",
  },
  datePickerModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.backdrop,
  },
  datePickerModalContent: {
    width: "90%",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  datePickerActionText: {
    color: theme.colors.secondary,
    fontWeight: "600",
    fontSize: 16,
  },
});
