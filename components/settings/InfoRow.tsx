import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Image } from 'react-native';
import { s, vs } from '@/constants/layout';
import { AppText } from '@/components/common/AppText';
import { useAppContext } from '@/context/AppContext';

export interface InfoRowProps {
  label: string;
  value: string;
}

export function InfoRow({ label, value }: InfoRowProps) {
  const { colors } = useAppContext();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      {/* [CHANGED] View → TouchableOpacity to trigger modal */}
      <TouchableOpacity style={styles.row} activeOpacity={0.6} onPress={() => setModalVisible(true)}>
        <AppText size={16}>{label}</AppText>
        <AppText size={16} style={{ color: colors.textSecondary }}>{value}</AppText>
      </TouchableOpacity>

      {/* [ADDED] Version Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          {/* Modal Card */}
          <View style={[styles.card, { backgroundColor: colors.backgroundDark }]}>
            <AppText size={18} style={{ fontWeight: '700', color: '#FFFFFF', marginBottom: vs(16) }}>
              Version
            </AppText>
            <Image
              source={require('@/assets/images/logo_whitebg.png')}
              style={styles.icon}
            />
            <AppText size={16} style={{ fontWeight: '700', color: '#FFFFFF', marginTop: vs(12) }}>
              OurDigitalID
            </AppText>
            <AppText size={14} style={{ color: '#FFFFFF', marginTop: vs(4) }}>
              {value}
            </AppText>
            <AppText size={12} style={{ color: '#CCCCCC', marginTop: vs(8) }}>
              All rights reserved
            </AppText>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingVertical: vs(14),
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: s(220),
    borderRadius: s(20),
    padding: s(24),
    alignItems: 'center',
  },
  icon: {
    width: s(64),
    height: s(64),
    borderRadius: s(0),
  },
});