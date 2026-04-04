import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, COLORS, SPACING, RADIUS, FONTS } from '../src/constants/theme';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_BACKEND_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string; devCode: string }>();
  const { isDark, colors } = useTheme();

  const email = params.email || '';
  const initialDevCode = params.devCode || '';

  // State
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'code' | 'password'>('code');
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState(initialDevCode);

  // Refs for inputs
  const codeInputRefs = useRef<(TextInput | null)[]>([]);
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Password validation
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isPasswordValid = hasMinLength && hasLetter && hasNumber && passwordsMatch;

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...codeDigits];
      digits.forEach((d, i) => {
        if (i + index < 6) newDigits[i + index] = d;
      });
      setCodeDigits(newDigits);
      const fullCode = newDigits.join('');
      setCode(fullCode);
      // Focus last filled or next empty
      const nextIndex = Math.min(index + digits.length, 5);
      codeInputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newDigits = [...codeDigits];
    newDigits[index] = digit;
    setCodeDigits(newDigits);
    setCode(newDigits.join(''));

    // Auto-advance
    if (digit && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !codeDigits[index] && index > 0) {
      const newDigits = [...codeDigits];
      newDigits[index - 1] = '';
      setCodeDigits(newDigits);
      setCode(newDigits.join(''));
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const fullCode = codeDigits.join('');
    if (fullCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResetToken(data.reset_token);
        setStep('password');
        // Animate transition
        fadeAnim.setValue(0);
        slideAnim.setValue(30);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
      } else {
        Alert.alert('Verification Failed', data.detail || 'Invalid code. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Network Error', 'Unable to connect. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isPasswordValid) {
      Alert.alert('Invalid Password', 'Please ensure all password requirements are met.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Success animation
        Animated.timing(successAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        
        Alert.alert(
          'Password Reset!',
          'Your password has been reset successfully. You can now log in with your new password.',
          [{ text: 'Go to Login', onPress: () => router.replace('/(auth)/login') }]
        );
      } else {
        Alert.alert('Reset Failed', data.detail || 'Something went wrong. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Network Error', 'Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setCooldown(30);
        if (data.dev_code) {
          setDevCode(data.dev_code);
        }
        // Clear old code
        setCodeDigits(['', '', '', '', '', '']);
        setCode('');
        Alert.alert('Code Sent', 'A new reset code has been sent.');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const PasswordCheck = ({ met, label }: { met: boolean; label: string }) => (
    <View style={styles.checkRow}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={16}
        color={met ? COLORS.success : colors.textSecondary}
      />
      <Text style={[styles.checkText, { color: met ? COLORS.success : colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.card }]}
            onPress={() => step === 'password' ? setStep('code') : router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, { backgroundColor: COLORS.primary }]} />
            <View style={[styles.stepLine, { backgroundColor: step === 'password' ? COLORS.primary : colors.border }]} />
            <View style={[styles.stepDot, { backgroundColor: step === 'password' ? COLORS.primary : colors.border }]} />
          </View>

          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {step === 'code' ? (
              <>
                {/* Code Entry Step */}
                <View style={[styles.iconCircle, { backgroundColor: COLORS.primary + '15' }]}>
                  <Ionicons name="keypad-outline" size={36} color={COLORS.primary} />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>
                  Enter Reset Code
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  We sent a 6-digit code to{'\n'}
                  <Text style={{ fontWeight: '600', color: colors.text }}>{email}</Text>
                </Text>

                {/* Dev Code Display (MVP only) */}
                {devCode ? (
                  <View style={[styles.devCodeCard, {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#10B98110',
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#10B98130',
                  }]}>
                    <Ionicons name="information-circle" size={18} color={COLORS.success} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.devCodeLabel, { color: COLORS.success }]}>
                        Your Reset Code
                      </Text>
                      <Text style={[styles.devCodeValue, { color: colors.text }]}>
                        {devCode}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {/* 6-digit OTP Input */}
                <View style={styles.codeContainer}>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => { codeInputRefs.current[index] = ref; }}
                      style={[
                        styles.codeInput,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.card,
                          borderColor: codeDigits[index]
                            ? COLORS.primary
                            : isDark ? 'rgba(255,255,255,0.12)' : colors.border,
                          color: colors.text,
                        },
                      ]}
                      value={codeDigits[index]}
                      onChangeText={(val) => handleCodeChange(index, val)}
                      onKeyPress={({ nativeEvent }) => handleCodeKeyPress(index, nativeEvent.key)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      selectTextOnFocus
                    />
                  ))}
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={[styles.actionButton, { opacity: loading || code.length !== 6 ? 0.6 : 1 }]}
                  onPress={handleVerifyCode}
                  disabled={loading || code.length !== 6}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={18} color="#fff" />
                      <Text style={styles.actionButtonText}>Verify Code</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Resend */}
                <TouchableOpacity
                  style={[styles.resendButton, { opacity: cooldown > 0 ? 0.5 : 1 }]}
                  onPress={handleResendCode}
                  disabled={cooldown > 0 || loading}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={16} color={COLORS.primary} />
                  <Text style={[styles.resendText, { color: COLORS.primary }]}>
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't receive a code? Resend"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* New Password Step */}
                <View style={[styles.iconCircle, { backgroundColor: COLORS.success + '15' }]}>
                  <Ionicons name="lock-closed-outline" size={36} color={COLORS.success} />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>
                  Create New Password
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Your new password must be different from previously used passwords.
                </Text>

                {/* New Password */}
                <View style={styles.inputSection}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>New Password</Text>
                  <View style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.card,
                      borderColor: newPassword.length > 0
                        ? (hasMinLength && hasLetter && hasNumber ? COLORS.success : COLORS.error + '60')
                        : (isDark ? 'rgba(255,255,255,0.1)' : colors.border),
                    },
                  ]}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Enter new password"
                      placeholderTextColor={colors.textSecondary}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Password Requirements */}
                <View style={[styles.requirementsCard, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.card,
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
                }]}>
                  <PasswordCheck met={hasMinLength} label="At least 8 characters" />
                  <PasswordCheck met={hasLetter} label="At least 1 letter" />
                  <PasswordCheck met={hasNumber} label="At least 1 number" />
                </View>

                {/* Confirm Password */}
                <View style={styles.inputSection}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm Password</Text>
                  <View style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.card,
                      borderColor: confirmPassword.length > 0
                        ? (passwordsMatch ? COLORS.success : COLORS.error + '60')
                        : (isDark ? 'rgba(255,255,255,0.1)' : colors.border),
                    },
                  ]}>
                    <Ionicons name="lock-open-outline" size={20} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Confirm new password"
                      placeholderTextColor={colors.textSecondary}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    {confirmPassword.length > 0 && (
                      <Ionicons
                        name={passwordsMatch ? 'checkmark-circle' : 'close-circle'}
                        size={20}
                        color={passwordsMatch ? COLORS.success : COLORS.error}
                      />
                    )}
                  </View>
                </View>

                {/* Reset Button */}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: isPasswordValid ? COLORS.success : COLORS.success + '60',
                      opacity: loading ? 0.6 : 1,
                    },
                  ]}
                  onPress={handleResetPassword}
                  disabled={loading || !isPasswordValid}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.actionButtonText}>Reset Password</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 0,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLine: {
    width: 60,
    height: 2,
    marginHorizontal: 6,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  devCodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  devCodeLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  devCodeValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 6,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 14,
    gap: 8,
    marginBottom: 16,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 56,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  requirementsCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
