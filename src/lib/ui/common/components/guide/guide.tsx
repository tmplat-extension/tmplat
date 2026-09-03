import CloseIcon from '@mui/icons-material/Close';
import DataArrayIcon from '@mui/icons-material/DataArray';
import FunctionsIcon from '@mui/icons-material/Functions';
import MenuIcon from '@mui/icons-material/Menu';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchIcon from '@mui/icons-material/Search';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import TuneIcon from '@mui/icons-material/Tune';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import { alpha, styled } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Fragment, ReactNode, useMemo, useState } from 'react';
import { useIntl } from 'extension/common/intl/intl.context';
import {
  collectionGuideExamples,
  operationGuideExamples,
  optionGuideExamples,
  standardGuideExamples,
} from 'extension/ui/common/components/guide/guide-examples';
import {
  getCollectionGuideEntries,
  getOperationGuideEntries,
  getPropertyGuideEntries,
  getStandardGuideEntries,
  matchesGuideQuery,
} from 'extension/ui/common/components/guide/guide.utils';
import { GuideCategoryPage } from 'extension/ui/common/components/guide-category-page/guide-category-page';
import { GuideIntroduction } from 'extension/ui/common/components/guide-introduction/guide-introduction';

const drawerWidth = 250;

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
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

/**
 * Renders the guide's navigable content (introduction + reference categories), shared by both the dialog opened
 * from the options page and the standalone guide page opened in its own tab.
 *
 * `onClose` and `onOpenInNewTab` are both optional and independently control whether their corresponding button is
 * rendered: the dialog usage supplies both (closeable, and able to open the standalone page), while the standalone
 * page usage supplies neither (nothing to close, and already the standalone page).
 */
export function Guide({ onClose, onOpenInNewTab }: GuideProps) {
  const intl = useIntl();
  const [isClosing, setIsClosing] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activePageId, setActivePageId] = useState<GuidePageId>('introduction');
  const [query, setQuery] = useState('');

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

  // Entries are derived from the context entry definitions, which are static, so they only need building once per
  // locale (guide entries embed localised type labels, so must be rebuilt if the locale ever changes).
  const allEntries = useMemo(
    () => ({
      collections: getCollectionGuideEntries(intl),
      operations: getOperationGuideEntries(intl),
      options: getPropertyGuideEntries(intl),
      standard: getStandardGuideEntries(intl),
    }),
    [intl],
  );

  const entries = useMemo(
    () => ({
      collections: allEntries.collections.filter((entry) => matchesGuideQuery(entry, query)),
      operations: allEntries.operations.filter((entry) => matchesGuideQuery(entry, query)),
      options: allEntries.options.filter((entry) => matchesGuideQuery(entry, query)),
      standard: allEntries.standard.filter((entry) => matchesGuideQuery(entry, query)),
    }),
    [allEntries, query],
  );

  const pageGroups: GuidePage[][] = [
    [
      {
        icon: <MenuBookIcon />,
        id: 'introduction',
        page: <GuideIntroduction />,
        text: intl.getMessage('guide_page_introduction'),
      },
    ],
    [
      {
        badge: entries.standard.length,
        icon: <TextFieldsIcon />,
        id: 'standard',
        page: (
          <GuideCategoryPage
            title={intl.getMessage('guide_page_standard')}
            description={intl.getMessage('guide_standard_description')}
            entries={entries.standard}
            examples={standardGuideExamples}
            typeHeader={intl.getMessage('guide_type_header')}
          />
        ),
        text: intl.getMessage('guide_page_standard'),
      },
      {
        badge: entries.collections.length,
        icon: <DataArrayIcon />,
        id: 'collections',
        page: (
          <GuideCategoryPage
            title={intl.getMessage('guide_page_lists_objects')}
            description={intl.getMessage('guide_lists_objects_description')}
            entries={entries.collections}
            examples={collectionGuideExamples}
            typeHeader={intl.getMessage('guide_type_header')}
          />
        ),
        text: intl.getMessage('guide_page_lists_objects'),
      },
      {
        badge: entries.operations.length,
        icon: <FunctionsIcon />,
        id: 'operations',
        page: (
          <GuideCategoryPage
            title={intl.getMessage('guide_page_operations')}
            description={intl.getMessage('guide_operations_description')}
            entries={entries.operations}
            examples={operationGuideExamples}
            typeHeader={intl.getMessage('guide_signature_header')}
          />
        ),
        text: intl.getMessage('guide_page_operations'),
      },
      {
        badge: entries.options.length,
        icon: <TuneIcon />,
        id: 'options',
        page: (
          <GuideCategoryPage
            title={intl.getMessage('guide_page_options')}
            description={intl.getMessage('guide_options_description')}
            entries={entries.options}
            examples={optionGuideExamples}
            typeHeader={intl.getMessage('guide_type_header')}
          />
        ),
        text: intl.getMessage('guide_page_options'),
      },
    ],
  ];

  const activePage = pageGroups.flat().find((page) => page.id === activePageId);

  const drawer = (
    <div>
      <Toolbar>
        {onClose && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label={intl.getMessage('guide_close_button_label')}
          >
            <CloseIcon />
          </IconButton>
        )}
        <Box sx={{ flexGrow: 1 }} />
        {onOpenInNewTab && (
          <Tooltip title={intl.getMessage('guide_open_in_new_tab_label')}>
            <IconButton
              edge="end"
              color="inherit"
              aria-label={intl.getMessage('guide_open_in_new_tab_label')}
              onClick={onOpenInNewTab}
            >
              <OpenInNewIcon />
            </IconButton>
          </Tooltip>
        )}
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
                  {page.badge != null && (
                    <Typography variant="caption" color="text.secondary">
                      {page.badge}
                    </Typography>
                  )}
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
    <Paper elevation={24} square sx={{ display: 'flex', flexShrink: 0, minHeight: '100vh' }}>
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
            aria-label={intl.getMessage('guide_open_menu_button_label')}
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography sx={{ ml: 2 }} variant="h6" component="div">
            {intl.getMessage('guide_title')}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder={intl.getMessage('guide_search_placeholder')}
              inputProps={{ 'aria-label': intl.getMessage('guide_search_label') }}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </Search>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label={intl.getMessage('guide_menu_label')}
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
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, minWidth: 0 }}>
        <Toolbar />
        {activePage?.page}
      </Box>
    </Paper>
  );
}

export type GuideProps = {
  onClose?: () => void;
  onOpenInNewTab?: () => void;
};

type GuidePage = {
  badge?: number;
  icon: ReactNode;
  id: GuidePageId;
  page: ReactNode;
  text: string;
};

type GuidePageId = 'collections' | 'introduction' | 'operations' | 'options' | 'standard';
