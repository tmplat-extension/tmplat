import 'extension/ui/options/component/options-app-bar/options-app-bar.scss';
import BugReportIcon from '@mui/icons-material/BugReport';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HelpIcon from '@mui/icons-material/Help';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import { alpha, styled } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import { useState } from 'react';
import { useIntl } from 'extension/common/intl/intl.context';
import { GuideDialog } from 'extension/ui/options/component/guide-dialog/guide-dialog';
import { SettingsDialog } from 'extension/ui/options/component/settings-dialog/settings-dialog';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const SPONSOR_URL = 'https://github.com/sponsors/airmrcr';
const ISSUE_URL = 'https://github.com/tmplat-extension/tmplat/issues';

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

export default function OptionsAppBar({ onQueryChange, query }: OptionsAppBarProps) {
  const intl = useIntl();

  const [isGuideOpen, setGuideOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const handleGuideOpen = () => {
    setGuideOpen(true);
  };

  const handleGuideClose = () => {
    setGuideOpen(false);
  };

  const handleSettingsOpen = () => {
    setSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Box
            component="img"
            src="img/logo_mark_inverse.svg"
            alt={intl.getMessage('name')}
            sx={{ height: 32, mr: { sm: 0, xs: 2 } }}
          />
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder={intl.getMessage('options_app_bar_search_placeholder')}
              inputProps={{ 'aria-label': intl.getMessage('options_app_bar_search_label') }}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </Search>
          <Box sx={{ flexGrow: 1 }} />
          <Box>
            <Tooltip title={intl.getMessage('options_app_bar_sponsor_label')}>
              <IconButton
                size="large"
                aria-label={intl.getMessage('options_app_bar_sponsor_label')}
                color="inherit"
                href={SPONSOR_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FavoriteIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={intl.getMessage('options_app_bar_issue_label')}>
              <IconButton
                size="large"
                aria-label={intl.getMessage('options_app_bar_issue_label')}
                color="inherit"
                href={ISSUE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <BugReportIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={intl.getMessage('options_app_bar_guide_label')}>
              <IconButton
                size="large"
                aria-label={intl.getMessage('options_app_bar_guide_label')}
                color="inherit"
                onClick={handleGuideOpen}
              >
                <HelpIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={intl.getMessage('options_app_bar_settings_label')}>
              <IconButton
                size="large"
                aria-label={intl.getMessage('options_app_bar_settings_label')}
                color="inherit"
                onClick={handleSettingsOpen}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      <GuideDialog open={isGuideOpen} onClose={handleGuideClose} />
      <SettingsDialog open={isSettingsOpen} onClose={handleSettingsClose} />
    </Box>
  );
}

export type OptionsAppBarProps = {
  onQueryChange: (query: string) => void;
  /**
   * Free-text search applied to the templates listed beneath the app bar.
   */
  query: string;
};
