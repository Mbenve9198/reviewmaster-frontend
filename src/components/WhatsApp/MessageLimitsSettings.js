import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Switch, 
  Slider, 
  Button, 
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  border: '1px solid #f0f0f0',
  overflow: 'visible'
}));

const StyledSlider = styled(Slider)(({ theme }) => ({
  color: theme.palette.primary.main,
  height: 8,
  '& .MuiSlider-track': {
    border: 'none',
  },
  '& .MuiSlider-thumb': {
    height: 24,
    width: 24,
    backgroundColor: '#fff',
    border: `2px solid ${theme.palette.primary.main}`,
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: '0 0 0 8px rgba(25, 118, 210, 0.16)',
    },
    '&:before': {
      display: 'none',
    },
  },
  '& .MuiSlider-valueLabel': {
    lineHeight: 1.2,
    fontSize: 12,
    background: 'unset',
    padding: 0,
    width: 32,
    height: 32,
    borderRadius: '50% 50% 50% 0',
    backgroundColor: theme.palette.primary.main,
    transformOrigin: 'bottom left',
    transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
    '&:before': { display: 'none' },
    '&.MuiSlider-valueLabelOpen': {
      transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
    },
    '& > *': {
      transform: 'rotate(45deg)',
    },
  },
}));

const LimitValue = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  fontSize: '1.2rem',
  color: theme.palette.primary.main,
  marginLeft: theme.spacing(1)
}));

const SaveButton = styled(Button)(({ theme }) => ({
  borderRadius: '20px',
  padding: '8px 24px',
  fontWeight: 'bold',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 6px 10px rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-2px)'
  }
}));

const MessageLimitsSettings = ({ hotelId }) => {
  const [settings, setSettings] = useState({
    enabled: true,
    inboundPerDay: 5,
    outboundPerDay: 5
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, [hotelId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/whatsapp-assistant/${hotelId}/message-limits`);
      const { messageLimits } = response.data;
      
      if (messageLimits) {
        setSettings({
          enabled: messageLimits.enabled,
          inboundPerDay: messageLimits.inboundPerDay,
          outboundPerDay: messageLimits.outboundPerDay
        });
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching message limits:', err);
      setError('Unable to load message limits settings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.put(`/api/whatsapp-assistant/${hotelId}/message-limits`, settings);
      toast.success('Message limits updated successfully');
      setOpenDialog(false);
      setError(null);
    } catch (err) {
      console.error('Error saving message limits:', err);
      setError('Failed to update message limits. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <StyledCard>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Daily Message Limits
            </Typography>
            <Box display="flex" alignItems="center">
              <Typography variant="body2" color="textSecondary" mr={1}>
                Enabled
              </Typography>
              <Switch
                checked={settings.enabled}
                onChange={(e) => handleChange('enabled', e.target.checked)}
                color="primary"
              />
            </Box>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="body2" color="textSecondary" mb={3}>
            Set daily limits for messages that guests can send and receive through the WhatsApp concierge.
            <Box 
              component="span" 
              sx={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                ml: 1, 
                cursor: 'pointer',
                color: 'primary.main'
              }}
              onClick={handleOpenDialog}
            >
              <InfoOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} />
              Learn more
            </Box>
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ opacity: settings.enabled ? 1 : 0.5, pointerEvents: settings.enabled ? 'auto' : 'none' }}>
            <Box mb={4}>
              <Box display="flex" alignItems="center" mb={1}>
                <Typography variant="subtitle1">
                  Inbound Messages (from guests):
                </Typography>
                <LimitValue>{settings.inboundPerDay}</LimitValue>
              </Box>
              <StyledSlider
                value={settings.inboundPerDay}
                onChange={(_, value) => handleChange('inboundPerDay', value)}
                min={5}
                max={50}
                step={1}
                valueLabelDisplay="auto"
                aria-label="Inbound messages limit"
              />
              <Typography variant="caption" color="textSecondary">
                Minimum: 5 messages | Maximum: 50 messages
              </Typography>
            </Box>

            <Box mb={3}>
              <Box display="flex" alignItems="center" mb={1}>
                <Typography variant="subtitle1">
                  Outbound Messages (to guests):
                </Typography>
                <LimitValue>{settings.outboundPerDay}</LimitValue>
              </Box>
              <StyledSlider
                value={settings.outboundPerDay}
                onChange={(_, value) => handleChange('outboundPerDay', value)}
                min={5}
                max={50}
                step={1}
                valueLabelDisplay="auto"
                aria-label="Outbound messages limit"
              />
              <Typography variant="caption" color="textSecondary">
                Minimum: 5 messages | Maximum: 50 messages
              </Typography>
            </Box>
          </Box>

          <Box display="flex" justifyContent="flex-end" mt={2}>
            <SaveButton
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Changes'}
            </SaveButton>
          </Box>
        </CardContent>
      </StyledCard>

      {/* Info Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        PaperProps={{
          style: {
            borderRadius: '12px',
            maxWidth: '500px'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight="bold">About Message Limits</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Message limits help manage the volume of conversations between your guests and the AI concierge.
          </Typography>
          
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            How it works:
          </Typography>
          
          <Typography variant="body2" paragraph>
            • <strong>Inbound limit:</strong> The maximum number of messages a guest can send to your concierge in a single day.
          </Typography>
          
          <Typography variant="body2" paragraph>
            • <strong>Outbound limit:</strong> The maximum number of responses your concierge can send to a guest in a single day.
          </Typography>
          
          <Typography variant="body2" paragraph>
            • When guests reach their daily limit, they'll receive a polite notification and will be able to continue the conversation the next day.
          </Typography>
          
          <Typography variant="body2" paragraph>
            • The minimum limit is 5 messages in each direction to ensure a meaningful conversation experience.
          </Typography>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            Guests will be informed about these limits in their first interaction with the concierge.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDialog} 
            color="primary"
            variant="outlined"
            sx={{ borderRadius: '20px' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MessageLimitsSettings; 