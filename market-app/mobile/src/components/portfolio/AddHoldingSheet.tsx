/**
 * AddHoldingSheet — bottom sheet for adding a new holding.
 */
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface AddHoldingSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (holding: { symbol: string; name: string; qty: number; buy_price: number }) => void;
}

export function AddHoldingSheet({ visible, onClose, onAdd }: AddHoldingSheetProps) {
  const insets = useSafeAreaInsets();
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [error, setError] = useState('');

  function handleAdd() {
    const s = symbol.trim().toUpperCase();
    const q = parseFloat(qty);
    const p = parseFloat(buyPrice);

    if (!s) return setError('Symbol is required');
    if (isNaN(q) || q <= 0) return setError('Enter a valid quantity');
    if (isNaN(p) || p <= 0) return setError('Enter a valid buy price');

    setError('');
    onAdd({
      symbol: s.includes('.') ? s : `${s}.NS`,
      name: name.trim() || s,
      qty: q,
      buy_price: p,
    });
    setSymbol('');
    setName('');
    setQty('');
    setBuyPrice('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.dimArea} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add Holding</Text>

          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.fields}>
              <Field
                label="Symbol (e.g. RELIANCE or RELIANCE.NS)"
                value={symbol}
                onChangeText={setSymbol}
                placeholder="RELIANCE.NS"
                autoCapitalize="characters"
              />
              <Field
                label="Company Name (optional)"
                value={name}
                onChangeText={setName}
                placeholder="Reliance Industries"
              />
              <Field
                label="Quantity"
                value={qty}
                onChangeText={setQty}
                placeholder="10"
                keyboardType="numeric"
              />
              <Field
                label="Buy Price (₹)"
                value={buyPrice}
                onChangeText={setBuyPrice}
                placeholder="2500.00"
                keyboardType="numeric"
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.actions}>
              <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} onPress={handleAdd} style={styles.addBtn}>
                <Text style={styles.addText}>Add Holding</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  autoCapitalize?: 'none' | 'characters';
}) {
  return (
    <View style={fieldStyles.container}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={fieldStyles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dimArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#111110',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.xl,
    paddingTop: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textDim,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  fields: {
    gap: spacing.md,
  },
  error: {
    fontSize: typography.size.sm,
    fontFamily: typography.sans,
    color: colors.bear,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cancelText: {
    fontSize: typography.size.md,
    fontFamily: typography.sansMedium,
    color: colors.textMuted,
  },
  addBtn: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.accentBg,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  addText: {
    fontSize: typography.size.md,
    fontFamily: typography.sansBold,
    color: colors.accent,
  },
});

const fieldStyles = StyleSheet.create({
  container: {
    gap: 5,
  },
  label: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansMedium,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: typography.size.md,
    fontFamily: typography.sans,
    color: colors.textPrimary,
  },
});
