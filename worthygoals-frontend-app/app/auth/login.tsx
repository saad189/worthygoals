import React, { useEffect, useState } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Keyboard,
  Switch,
} from "react-native";
import { Text } from "react-native-paper";
import {
  emailValidator,
  getRememberedUserCredentials,
  rememberUserCredentials,
} from "@/helpers";
import Background from "@/components/SubComponents/Background";
import { StackNavigationProp } from "@react-navigation/stack";
import Logo from "@/components/SubComponents/Logo";

import TextInput from "@/components/SubComponents/TextInput";
import Button from "@/components/SubComponents/Button";
import { ROUTE_NAMES } from "@/constants/Routes";
import { useNavigation } from "expo-router";
import { ParamListBase } from "@react-navigation/native";
import Header from "@/components/SubComponents/Header";

import { LoginInfo } from "@/models";
import authService from "@/services/AuthService";
import { useAuth, useLoader, useToast } from "@/hooks";
import PasswordField from "@/components/SubComponents/PasswordField";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function LoginScreen() {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const { colors } = useAppTheme();
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
    <Background>
      <Logo isWhite={true} />
      <View style={staticStyles.container}>
        <Header>Welcome back!</Header>
        <TextInput
          label="Email"
          returnKeyType="next"
          value={email.value}
          onChangeText={(text: any) => setEmail({ value: text, error: "" })}
          error={!!email.error}
          errorText={email.error}
          autoCapitalize="none"
          textContentType="emailAddress"
          keyboardType="email-address"
        />

        <PasswordField
          placeholder="Password"
          value={password.value}
          onChangeText={(text: any) => setPassword({ value: text, error: "" })}
          onSubmitEditing={onLoginPressed}
          errorText={password.error}
        />
        <View style={staticStyles.rememberMeContainer}>
          <Text style={[staticStyles.rememberMeText, { color: colors.secondary }]}>Remember Me</Text>
          <Switch
            value={rememberMe}
            onValueChange={setRememberMe}
            trackColor={{ true: colors.background, false: colors.background }}
            thumbColor={colors.icon}
          />
        </View>
        <View style={staticStyles.forgotPassword}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate(ROUTE_NAMES.AUTH.self, {
                screen: ROUTE_NAMES.AUTH.RESET_PASSWORD,
              })
            }
          >
            <Text style={[staticStyles.forgot, { color: colors.secondary }]}>Forgot your password?</Text>
          </TouchableOpacity>
        </View>
        <Button
          style={staticStyles.button}
          mode="contained"
          onPress={onLoginPressed}
          loading={isLoading}
        >
          Login
        </Button>
        <View style={staticStyles.row}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate(ROUTE_NAMES.AUTH.self, {
                screen: ROUTE_NAMES.AUTH.REGISTER,
              })
            }
          >
            <Text style={{ color: colors.primary }}>
              Don't have an account?
              <Text style={{ fontWeight: "bold", color: colors.secondary }}> Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Background>
  );
}

const staticStyles = StyleSheet.create({
  container: {
    width: "100%",
    justifyContent: "center",
  },
  button: {
    width: "100%",
  },
  forgotPassword: {
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    marginTop: 4,
  },
  forgot: {
    fontSize: 13,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 15,
    marginHorizontal: 5,
  },
  rememberMeText: {
    fontSize: 16,
  },
});
