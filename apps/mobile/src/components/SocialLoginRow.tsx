import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { t } from '../i18n/ko';

type SocialProvider = 'google';

type Props = {
  providers: SocialProvider[];
  onGooglePress: () => void;
  googleLoading?: boolean;
  disabled?: boolean;
  hint?: string;
};

const googleWordmark = require('../../assets/google-wordmark.png');

export function SocialLoginRow({
  providers,
  onGooglePress,
  googleLoading = false,
  disabled = false,
  hint,
}: Props) {
  if (providers.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {providers.includes('google') && (
          <Pressable
            style={[styles.providerButton, (disabled || googleLoading) && styles.buttonDisabled]}
            disabled={disabled || googleLoading}
            onPress={onGooglePress}
            accessibilityRole="button"
            accessibilityLabel={t.login.googleA11y}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <>
                <Image source={googleWordmark} style={styles.providerLogo} resizeMode="contain" />
                <Text style={styles.providerLabel}>{t.login.socialProviderLogin}</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    alignSelf: 'stretch',
    maxWidth: 320,
    width: '100%',
  },
  providerLogo: {
    width: 56,
    height: 18,
  },
  providerLabel: {
    color: '#1f1f1f',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: { opacity: 0.65 },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
  },
});
