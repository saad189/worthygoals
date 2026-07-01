/**
 * Sign in — Hi-Fi composition (S45 · P-E): editorial header + warm Field
 * inputs replace the legacy dark form. Logic (remembered credentials,
 * unverified-email redirect) unchanged.
 */
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Switch,
  View,
  Keyboard,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ParamListBase } from "@react-navigation/native";
import { useNavigation } from "expo-router";

import { Button, Field, Header, Screen, Text } from "@/components/ui";
import { APP_NAME } from "@/constants/Brand";
import { ROUTE_NAMES } from "@/constants/Routes";
import {
  emailValidator,
  getRememberedUserCredentials,
  rememberUserCredentials,
} from "@/helpers";
import { LoginInfo } from "@/models";
import authService from "@/services/AuthService";
import { useAuth, useLoader, useToast } from "@/hooks";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function LoginScreen() {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const { colors, space } = useAppTheme();
  const emptyLoginInfo = { email: "", password: "" };

  const [email, setEmail] = useState<{ value: string; error: string }>({
    value: emptyLoginInfo.email,
    error: "",
  });
  const [password, setPassword] = useState<{ value: string; error: string }>({
    value: emptyLoginInfo.password,
    error: "",
  });
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const { isAuthenticated, login } = useAuth();
  const { showErrorMessage, showInfoMessage } = useToast();

  const { isLoading, setLoading } = useLoader();

  useEffect(() => {
    const updateLoginInfo = async ({ email, password }: LoginInfo) => {
      setEmail({ value: email, error: "" });
      setPassword({ value: password, error: "" });
    };

    const checkSavedCredentials = async () => {
      try {
        const { loginInfo, rememberMe } = await getRememberedUserCredentials();
        updateLoginInfo(loginInfo);
        setRememberMe(rememberMe);
      } catch (error) {
        showErrorMessage((error as Error).message);
      }
    };

    if (!isAuthenticated) checkSavedCredentials();
  }, [isAuthenticated]);

  const onLoginPressed = () => {
    const emailError = emailValidator(email.value);
    const passwordError = !password.value
      ? "Password field cannot be empty"
      : "";

    if (emailError || passwordError) {
      setEmail({ ...email, error: emailError });
      setPassword({ ...password, error: passwordError });
      return;
    }

    handleLogin();
  };

  const handleLogin = async () => {
    try {
      Keyboard.dismiss();
      setLoading(true);

      const loginInfo: LoginInfo = {
        email: email.value,
        password: password.value,
      };
      const isValidUser = await authService.loginUser(loginInfo);

      if (isValidUser) {
        rememberUserCredentials({
          loginInfo: rememberMe ? loginInfo : emptyLoginInfo,
          rememberMe,
        });
        await login(email.value);
      } else {
        showInfoMessage("The email is not verified yet!");
        navigation.navigate(ROUTE_NAMES.AUTH.self, {
          screen: ROUTE_NAMES.AUTH.VERIFY_EMAIL_SCREEN,
          params: { email: email.value },
        });
      }
    } catch (error) {
      showErrorMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Header eyebrow={`${APP_NAME} · SIGN IN`} title="Welcome back." />

          <Field
            label="Email"
            returnKeyType="next"
            value={email.value}
            onChangeText={(text: string) => setEmail({ value: text, error: "" })}
            errorText={email.error}
            autoCapitalize="none"
            textContentType="emailAddress"
            keyboardType="email-address"
          />
          <Field
            label="Password"
            secure
            returnKeyType="done"
            value={password.value}
            onChangeText={(text: string) =>
              setPassword({ value: text, error: "" })
            }
            onSubmitEditing={onLoginPressed}
            errorText={password.error}
          />

          <View style={[styles.rememberRow, { marginBottom: space["4"] }]}>
            <Text variant="muted">Remember me</Text>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ true: colors.text, false: colors.border }}
              thumbColor={colors.background}
            />
          </View>

          <Button label="Sign in" onPress={onLoginPressed} loading={isLoading} />
          <Button
            label="Forgot your password?"
            variant="link"
            onPress={() =>
              navigation.navigate(ROUTE_NAMES.AUTH.self, {
                screen: ROUTE_NAMES.AUTH.RESET_PASSWORD,
              })
            }
          />
          <Button
            label="No account yet? Create one"
            variant="link"
            onPress={() =>
              navigation.navigate(ROUTE_NAMES.AUTH.self, {
                screen: ROUTE_NAMES.AUTH.REGISTER,
              })
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
