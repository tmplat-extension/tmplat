import AnalyticsIcon from '@mui/icons-material/Analytics';
import CloseIcon from '@mui/icons-material/Close';
import ConstructionIcon from '@mui/icons-material/Construction';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LinkIcon from '@mui/icons-material/Link';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CssBaseline from '@mui/material/CssBaseline';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import _isEqual from 'lodash.isequal';
import { Fragment, ReactNode, useCallback, useEffect, useState } from 'react';
import { useIntl } from 'extension/common/intl/intl.context';
import { useSettings } from 'extension/common/settings/settings.context';
import { Settings } from 'extension/common/settings/settings.model';
import { AnalyticsSettings } from 'extension/ui/options/component/analytics-settings/analytics-settings';
import { AppearanceSettings } from 'extension/ui/options/component/appearance-settings/appearance-settings';
import { DeveloperSettings } from 'extension/ui/options/component/developer-settings/developer-settings';
import { GeneralSettings } from 'extension/ui/options/component/general-settings/general-settings';
import { NotificationSettings } from 'extension/ui/options/component/notification-settings/notification-settings';
import { getErrorMessage } from 'extension/ui/options/component/options-error.utils';
import { UnsavedChangesDialog } from 'extension/ui/options/component/settings-dialog/unsaved-changes-dialog';
import {
  isUrlShortenerSettingsValid,
  UrlShortenerSettings,
} from 'extension/ui/options/component/url-shortener-settings/url-shortener-settings';

const drawerWidth = 250;

export function SettingsDialog({ onClose, open }: SettingsDialogProps) {
  const intl = useIntl();
  const settingsService = useSettings();
  const [isClosing, setIsClosing] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activePageId, setActivePageId] = useState<SettingsPageId>('general');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSettings, setSavedSettings] = useState<Settings>();
  const [settings, setSettings] = useState<Settings>();
  const [showUnsavedChangesPrompt, setShowUnsavedChangesPrompt] = useState(false);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  // Settings are (re)loaded each time the dialog is opened so that any unsaved changes are discarded and any changes
  // made elsewhere (e.g. another tab) are picked up
  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    (async () => {
      // Always open on the General page, regardless of which page was last active
      setActivePageId('general');
      setError(undefined);
      setLoading(true);
      setShowUnsavedChangesPrompt(false);

      try {
        const loadedSettings = await settingsService.getSettings();
        if (!cancelled) {
          setSavedSettings(loadedSettings);
          setSettings(loadedSettings);
        }
      } catch (e) {
        if (!cancelled) {
          setError(getErrorMessage(e, intl));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [intl, open, settingsService]);

  const handleSave = useCallback(
    async (closeAfterSave: boolean) => {
      if (!settings) {
        return;
      }

      setError(undefined);
      setSaving(true);

      try {
        await settingsService.saveSettings(settings);
        setSavedSettings(settings);

        if (closeAfterSave) {
          onClose?.({});
        }
      } catch (e) {
        setError(getErrorMessage(e, intl));
      } finally {
        setSaving(false);
      }
    },
    [intl, onClose, settings, settingsService],
  );

  const handleReset = useCallback(() => {
    setError(undefined);
    setSettings(savedSettings);
  }, [savedSettings]);

  const dirty = !!settings && !_isEqual(settings, savedSettings);
  const valid = !!settings && isUrlShortenerSettingsValid(settings.urlShortener, intl);
  const canReset = dirty && !saving;
  const canSave = dirty && valid && !saving;

  const handleCloseRequest = useCallback(
    (event: object) => {
      if (dirty) {
        setShowUnsavedChangesPrompt(true);
      } else {
        onClose?.(event);
      }
    },
    [dirty, onClose],
  );

  const handleCancelClose = useCallback(() => {
    setShowUnsavedChangesPrompt(false);
  }, []);

  const handleDiscardAndClose = useCallback(() => {
    setShowUnsavedChangesPrompt(false);
    setError(undefined);
    setSettings(savedSettings);
    onClose?.({});
  }, [onClose, savedSettings]);

  const handleSaveAndClose = useCallback(() => {
    setShowUnsavedChangesPrompt(false);
    void handleSave(true);
  }, [handleSave]);

  const pageGroups: SettingsPage[][] = settings
    ? [
        [
          {
            icon: <SettingsIcon />,
            id: 'general',
            page: (
              <GeneralSettings
                settings={settings.general}
                onChange={(general) => setSettings({ ...settings, general })}
              />
            ),
            text: intl.getMessage('settings_dialog_page_general'),
          },
          {
            icon: <NotificationsIcon />,
            id: 'notifications',
            page: (
              <NotificationSettings
                settings={settings.notification}
                onChange={(notification) => setSettings({ ...settings, notification })}
              />
            ),
            text: intl.getMessage('settings_dialog_page_notifications'),
          },
          {
            icon: <DarkModeIcon />,
            id: 'appearance',
            page: (
              <AppearanceSettings
                settings={settings.appearance}
                onChange={(appearance) => setSettings({ ...settings, appearance })}
              />
            ),
            text: intl.getMessage('settings_dialog_page_appearance'),
          },
          {
            icon: <AnalyticsIcon />,
            id: 'analytics',
            page: (
              <AnalyticsSettings
                settings={settings.analytics}
                onChange={(analytics) => setSettings({ ...settings, analytics })}
              />
            ),
            text: intl.getMessage('settings_dialog_page_analytics'),
          },
        ],
        [
          {
            icon: <LinkIcon />,
            id: 'urlShorteners',
            page: (
              <UrlShortenerSettings
                settings={{ oauth: settings.oauth, urlShortener: settings.urlShortener }}
                onChange={({ oauth, urlShortener }) => setSettings({ ...settings, oauth, urlShortener })}
              />
            ),
            text: intl.getMessage('settings_dialog_page_url_shorteners'),
          },
        ],
        [
          {
            icon: <ConstructionIcon />,
            id: 'developer',
            page: (
              <DeveloperSettings
                settings={settings.logging}
                onChange={(logging) => setSettings({ ...settings, logging })}
              />
            ),
            text: intl.getMessage('settings_dialog_page_developer'),
          },
        ],
      ]
    : [];

  const activePage = pageGroups.flat().find((page) => page.id === activePageId);

  const drawer = (
    <div>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={() => handleCloseRequest({})}
          aria-label={intl.getMessage('settings_dialog_close_button_label')}
        >
          <CloseIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        {pageGroups.map((pages, groupIndex) => (
          <Fragment key={groupIndex}>
            {pages.map((page) => (
              <ListItem key={page.id} disablePadding>
                <ListItemButton selected={page.id === activePageId} onClick={() => setActivePageId(page.id)}>
                  <ListItemIcon>{page.icon}</ListItemIcon>
                  <ListItemText primary={page.text} />
                </ListItemButton>
              </ListItem>
            ))}
            {groupIndex !== pageGroups.length - 1 && <Divider />}
          </Fragment>
        ))}
      </List>
    </div>
  );

  return (
    <>
      <Dialog fullScreen open={open} onClose={handleCloseRequest}>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <AppBar
            position="fixed"
            sx={{
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              ml: { sm: `${drawerWidth}px` },
            }}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                edge="start"
                aria-label={intl.getMessage('settings_dialog_open_menu_button_label')}
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                {intl.getMessage('settings_dialog_title')}
              </Typography>
              <Button color="inherit" disabled={!canReset} onClick={handleReset}>
                {intl.getMessage('settings_dialog_reset_button')}
              </Button>
              <Button color="inherit" disabled={!canSave} onClick={() => handleSave(false)}>
                {intl.getMessage('settings_dialog_apply_button')}
              </Button>
              <Button autoFocus color="inherit" disabled={!canSave} onClick={() => handleSave(true)}>
                {intl.getMessage('settings_dialog_save_button')}
              </Button>
            </Toolbar>
          </AppBar>
          <Box
            component="nav"
            sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            aria-label={intl.getMessage('settings_dialog_menu_label')}
          >
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerClose}
              onTransitionEnd={handleDrawerTransitionEnd}
              ModalProps={{ keepMounted: true }}
              sx={{
                display: { xs: 'block', sm: 'none' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
              }}
            >
              {drawer}
            </Drawer>
            <Drawer
              variant="permanent"
              open
              sx={{
                display: { xs: 'none', sm: 'block' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
              }}
            >
              {drawer}
            </Drawer>
          </Box>
          <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
            <Toolbar />
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(undefined)}>
                {error}
              </Alert>
            )}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              activePage?.page
            )}
          </Box>
        </Box>
      </Dialog>
      <UnsavedChangesDialog
        open={showUnsavedChangesPrompt}
        saving={saving}
        onCancel={handleCancelClose}
        onDiscard={handleDiscardAndClose}
        onSave={handleSaveAndClose}
      />
    </>
  );
}

export type SettingsDialogProps = {
  onClose?: (event: object) => void;
  open: boolean;
};

type SettingsPage = {
  icon: ReactNode;
  id: SettingsPageId;
  page: ReactNode;
  text: string;
};

type SettingsPageId = 'analytics' | 'appearance' | 'developer' | 'general' | 'notifications' | 'urlShorteners';
