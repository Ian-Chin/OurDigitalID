import { BackButton } from '@/components/ui/BackButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { VersionFooter } from '@/components/ui/VersionFooter';
import { s, vs } from '@/constants/layout';
import { useFadeInUp, useScaleIn, useFadeIn, useSlideInLeft, stagger } from '@/hooks/useAnimations';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/context/AppContext';
import { AppText } from '@/components/common/AppText';

export default function ShowcaseScreen() {
  const router = useRouter();
  const { colors } = useAppContext();
  const { t } = useTranslation();

  const FEATURES = [
    t('showcaseFeature1'),
    t('showcaseFeature2'),
    t('showcaseFeature3'),
  ];

  // Staggered entrance animations
  const welcomeAnim = useFadeInUp(stagger(0, 100));
  const logoAnim = useScaleIn(stagger(1, 100));
  const titleAnim = useFadeInUp(stagger(2, 100));
  const bullet0 = useSlideInLeft(stagger(3, 100));
  const bullet1 = useSlideInLeft(stagger(4, 100));
  const bullet2 = useSlideInLeft(stagger(5, 100));
  const bulletAnims = [bullet0, bullet1, bullet2];
  const btnAnim = useFadeInUp(stagger(6, 100));
  const loginAnim = useFadeIn(stagger(7, 100));
  const footerAnim = useFadeIn(stagger(8, 100));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <BackButton />

      <View style={styles.container}>
        <Animated.View style={welcomeAnim}>
          <AppText size={26} style={{ fontWeight: '700', textAlign: 'center', marginBottom: vs(12) }}>
            {t('welcomeToOurDigitalID')}
          </AppText>
        </Animated.View>

        <Animated.View style={logoAnim}>
          <Image
            source={require('../../assets/images/id_illustration.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={titleAnim}>
          <AppText size={22} style={{ fontWeight: '700', textAlign: 'center', marginBottom: vs(16) }}>
            {t('showcaseTitle')}
          </AppText>
        </Animated.View>

        <View style={styles.bulletWrapper}>
          {FEATURES.map((item, i) => (
            <Animated.View key={i} style={[styles.bulletRow, bulletAnims[i]]}>
              <AppText size={14} style={{ marginTop: vs(1) }}>•</AppText>
              <AppText size={14} style={{ flex: 1, lineHeight: 20 }}>{item}</AppText>
            </Animated.View>
          ))}
        </View>

        <Animated.View style={[styles.buttonWrapper, btnAnim]}>
          <PrimaryButton
            label={t('createDigitalId')}
            onPress={() => router.push('/auth/create-digital-id')}
          />
        </Animated.View>

        <Animated.View style={loginAnim}>
          <TouchableOpacity
            onPress={() => router.push('/auth/email')}
            activeOpacity={0.7}
            style={styles.loginWrapper}
          >
            <AppText size={14} style={{ fontWeight: '500' }}>{t('login')}</AppText>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.footer, footerAnim]}>
          <StepIndicator totalSteps={3} currentStep={2} />
          <VersionFooter />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(32),
    paddingTop: vs(60),
  },
  logo: {
    width: s(200),
    height: s(200),
    marginBottom: vs(20),
  },
  bulletWrapper: { width: '100%', marginBottom: vs(28), gap: vs(10) },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: s(8) },
  buttonWrapper: { width: '100%', marginBottom: vs(16) },
  loginWrapper: { paddingVertical: vs(8) },
  footer: { alignItems: 'center', marginTop: vs(48), gap: vs(12) },
});
