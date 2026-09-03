import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Switch from '@mui/material/Switch';
import { ChangeEvent, ReactNode } from 'react';

/**
 * Consistent layout for a switch-based settings control, with an optional helper text.
 *
 * Always wraps the switch in a `FormControl` so that rows with and without helper text share the same structure and
 * indentation.
 */
export function SettingsSwitch({ checked, disabled, helperText, label, onChange }: SettingsSwitchProps) {
  return (
    <FormControl disabled={disabled}>
      <FormControlLabel control={<Switch checked={checked} onChange={onChange} />} label={label} />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}

export type SettingsSwitchProps = {
  checked: boolean;
  disabled?: boolean;
  helperText?: ReactNode;
  label: ReactNode;
  onChange: (event: ChangeEvent<HTMLInputElement>, checked: boolean) => void;
};
