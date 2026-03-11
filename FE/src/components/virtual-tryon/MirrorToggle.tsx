import { FormControlLabel, Switch, Box, Typography } from '@mui/material';
import { Flip } from '@mui/icons-material';

interface MirrorToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function MirrorToggle({ enabled, onChange }: MirrorToggleProps) {
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 80,
        right: 16,
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        px: 2,
        py: 1,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(e) => onChange(e.target.checked)}
            color="primary"
            size="small"
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Flip sx={{ fontSize: 16 }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Mirror
            </Typography>
          </Box>
        }
        sx={{ margin: 0 }}
      />
    </Box>
  );
}
