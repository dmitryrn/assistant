import React from 'react';
import { Picker } from '@react-native-picker/picker';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SelectDropdownProps<Value extends string> = {
  value: Value;
  onChange(value: Value): void;
  children: React.ReactNode;
};

export function SelectDropdown<Value extends string>({
  value,
  onChange,
  children,
}: SelectDropdownProps<Value>): React.JSX.Element {
  const theme = useTheme();

  return (
    <View style={[styles.container, { borderColor: theme.backgroundSelected, backgroundColor: '#fff' }]}>
      <Picker
        selectedValue={value}
        onValueChange={(itemValue: Value) => onChange(itemValue)}
        style={[styles.picker, { color: theme.text }]}
        dropdownIconColor={theme.text}
      >
        {children}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  picker: {
    minHeight: 52,
  },
});
