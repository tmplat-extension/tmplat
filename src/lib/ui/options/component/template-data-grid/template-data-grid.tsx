import 'extension/ui/options/component/template-data-grid/template-data-grid.scss';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ClearIcon from '@mui/icons-material/Clear';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';
import VerticalAlignTopIcon from '@mui/icons-material/VerticalAlignTop';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Slide from '@mui/material/Slide';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {
  DataGrid,
  GridColDef,
  GridColumnVisibilityModel,
  GridPaginationModel,
  GridRowSelectionModel,
} from '@mui/x-data-grid';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useErrorBoundary } from 'react-error-boundary';
import { useAppearance } from 'extension/common/appearance/appearance.context';
import { DEFAULT_TEMPLATE_DATA_GRID_APPEARANCE } from 'extension/common/appearance/data/appearance-data.model';
import { useIntl } from 'extension/common/intl/intl.context';
import { getShortcutModifier } from 'extension/common/system/system.utils';
import { Template } from 'extension/template/template.model';
import { useTemplates } from 'extension/template/templates.context';
import { useDataGridLocaleText } from 'extension/ui/common/hooks/use-data-grid-locale-text';
import { ConfirmDialog } from 'extension/ui/options/component/confirm-dialog/confirm-dialog';
import { getErrorMessage } from 'extension/ui/options/component/options-error.utils';
import { TemplateEditorDialog } from 'extension/ui/options/component/template-editor-dialog/template-editor-dialog';
import { TemplateExportDialog } from 'extension/ui/options/component/template-export-dialog/template-export-dialog';
import { TemplateImportDialog } from 'extension/ui/options/component/template-import-dialog/template-import-dialog';

const emptySelectionModel: GridRowSelectionModel = { ids: new Set(), type: 'include' };

/**
 * Resolves the identifiers of the currently selected rows.
 *
 * The data grid describes its selection as either the rows that *are* selected or, once "select all" has been used,
 * the rows that are *not*, so the latter has to be inverted.
 */
function resolveSelectedIds(model: GridRowSelectionModel, rows: readonly Template[]): string[] {
  if (model.type === 'exclude') {
    return rows.map((row) => row.id).filter((id) => !model.ids.has(id));
  }

  return rows.map((row) => row.id).filter((id) => model.ids.has(id));
}

export function TemplateDataGrid({ query = '' }: TemplateDataGridProps) {
  const appearance = useAppearance();
  const intl = useIntl();
  const localeText = useDataGridLocaleText();
  const templateService = useTemplates();
  const { showBoundary } = useErrorBoundary();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>(emptySelectionModel);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: DEFAULT_TEMPLATE_DATA_GRID_APPEARANCE.pageSize,
  });
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>(
    DEFAULT_TEMPLATE_DATA_GRID_APPEARANCE.columnVisibilityModel,
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTemplate, setEditorTemplate] = useState<Template>();
  const [editorCloneFrom, setEditorCloneFrom] = useState<Template>();
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>();
  const [toggleMenuAnchor, setToggleMenuAnchor] = useState<HTMLElement>();
  const [moveMenuAnchor, setMoveMenuAnchor] = useState<HTMLElement>();
  const [rowMenu, setRowMenu] = useState<{ anchor: HTMLElement; template: Template }>();

  const refresh = useCallback(async () => {
    setTemplates(await templateService.getTemplates());
  }, [templateService]);

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } catch (e) {
        showBoundary(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh, showBoundary]);

  // Restores the persisted page size/hidden columns once on mount, rather than blocking the initial render on it.
  useEffect(() => {
    let cancelled = false;

    appearance.getTemplateDataGridState().then(({ columnVisibilityModel: hiddenColumns, pageSize }) => {
      if (!cancelled) {
        setPaginationModel((current) => ({ ...current, pageSize }));
        setColumnVisibilityModel(hiddenColumns);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [appearance]);

  const handlePaginationModelChange = useCallback(
    (model: GridPaginationModel) => {
      setPaginationModel(model);
      void appearance.setTemplateDataGridState({ columnVisibilityModel, pageSize: model.pageSize });
    },
    [appearance, columnVisibilityModel],
  );

  const handleColumnVisibilityModelChange = useCallback(
    (model: GridColumnVisibilityModel) => {
      setColumnVisibilityModel(model);
      void appearance.setTemplateDataGridState({ columnVisibilityModel: model, pageSize: paginationModel.pageSize });
    },
    [appearance, paginationModel.pageSize],
  );

  const run = useCallback(
    async (action: () => Promise<void>) => {
      setError(undefined);

      try {
        await action();
        await refresh();
      } catch (e) {
        setError(getErrorMessage(e, intl));
      }
    },
    [intl, refresh],
  );

  const rows = useMemo(() => {
    const safeQuery = query.trim().toLowerCase();
    if (!safeQuery) {
      return templates;
    }

    return templates.filter((template) =>
      [
        templateService.getTemplateTitle(template),
        templateService.getTemplateDescription(template) ?? '',
        template.content,
        template.shortcut ?? '',
      ].some((field) => field.toLowerCase().includes(safeQuery)),
    );
  }, [query, templateService, templates]);

  const selectedIds = useMemo(() => resolveSelectedIds(selectionModel, rows), [rows, selectionModel]);
  const selectedTemplates = useMemo(
    () => templates.filter((template) => selectedIds.includes(template.id)),
    [selectedIds, templates],
  );
  const selectedPredefinedCount = selectedTemplates.filter((template) => template.predefined).length;
  const canDeleteSelection = !!selectedTemplates.length && !selectedPredefinedCount;
  const canEnableSelection = selectedTemplates.some((template) => !template.enabled);
  const canDisableSelection = selectedTemplates.some((template) => template.enabled);

  const openTemplateEditor = useCallback((template?: Template) => {
    setEditorTemplate(template);
    setEditorCloneFrom(undefined);
    setEditorOpen(true);
  }, []);

  const openTemplateCloner = useCallback((template: Template) => {
    setEditorTemplate(undefined);
    setEditorCloneFrom(template);
    setEditorOpen(true);
  }, []);

  const handleDeleteConfirmed = useCallback(async () => {
    const ids = pendingDeleteIds ?? [];

    setPendingDeleteIds(undefined);
    await run(() => templateService.removeTemplates(ids));
    setSelectionModel(emptySelectionModel);
  }, [pendingDeleteIds, run, templateService]);

  const moveTemplateTo = useCallback(
    (id: string, targetIndex: number) => run(() => templateService.moveTemplate(id, targetIndex)),
    [run, templateService],
  );

  const rowMenuIndex = rowMenu ? templates.findIndex((template) => template.id === rowMenu.template.id) : -1;
  const rowMenuAtTop = rowMenuIndex <= 0;
  const rowMenuAtBottom = rowMenuIndex < 0 || rowMenuIndex >= templates.length - 1;

  const columns: GridColDef<Template>[] = [
    {
      field: 'title',
      headerName: intl.getMessage('template_grid_title_column_header'),
      editable: false,
      flex: 0.25,
      valueGetter: (_value, row) => templateService.getTemplateTitle(row),
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" noWrap sx={{ fontStyle: row.predefined ? 'italic' : 'normal' }}>
            {row.predefined ? (
              <Tooltip title={intl.getMessage('template_grid_predefined_tooltip')}>
                <span>{templateService.getTemplateTitle(row)}</span>
              </Tooltip>
            ) : (
              templateService.getTemplateTitle(row)
            )}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'description',
      headerName: intl.getMessage('template_grid_description_column_header'),
      editable: false,
      flex: 0.4,
      valueGetter: (_value, row) => templateService.getTemplateDescription(row) ?? '',
    },
    {
      field: 'shortcut',
      headerName: intl.getMessage('template_grid_shortcut_column_header'),
      editable: false,
      width: 110,
      valueGetter: (_value, row) => row.shortcut ?? '',
      renderCell: ({ value }) =>
        value && (
          <Typography component="code" variant="body2">
            {getShortcutModifier()}

            {value}
          </Typography>
        ),
    },
    {
      field: 'content',
      headerName: intl.getMessage('template_grid_content_column_header'),
      sortable: false,
      flex: 1,
    },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: 60,
      renderCell: ({ row }) => (
        // Clicks/double-clicks are stopped from propagating so they don't also trigger the grid's own row selection
        // or row double-click (open editor) behaviour.
        <IconButton
          size="small"
          aria-label={intl.getMessage('template_grid_row_actions_label')}
          onClick={(event) => {
            event.stopPropagation();
            setRowMenu({ anchor: event.currentTarget, template: row });
          }}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ m: '1em' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(undefined)}>
          {error}
        </Alert>
      )}
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openTemplateEditor()}>
          {intl.getMessage('template_grid_add_button')}
        </Button>
        <Button variant="outlined" startIcon={<FileUploadIcon />} onClick={() => setImportOpen(true)}>
          {intl.getMessage('template_grid_import_button')}
        </Button>
      </Stack>
      <DataGrid
        checkboxSelection
        localeText={localeText}
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        getRowClassName={(params) => (params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd')}
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
        pageSizeOptions={[10, 20, 50]}
        disableColumnResize
        loading={loading}
        rowSelectionModel={selectionModel}
        onRowSelectionModelChange={setSelectionModel}
        onRowDoubleClick={({ row }) => openTemplateEditor(row)}
        // Reserves room below the grid so that, once scrolled all the way down, the floating action bar below
        // doesn't cover the grid's own footer/pagination controls.
        sx={{ mb: selectedIds.length ? 12 : 0 }}
        slotProps={{
          loadingOverlay: {
            noRowsVariant: 'skeleton',
            variant: 'skeleton',
          },
        }}
      />
      {/* Floating action bar for bulk operations, shown while at least one row is selected */}
      {/* Centering is done via flexbox on a fixed-width wrapper rather than a transform, since Slide manages its own
          transform for the enter/exit animation and would otherwise clobber a centering transform on the Paper. */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: (theme) => theme.zIndex.speedDial,
        }}
      >
        <Slide direction="up" in={!!selectedIds.length} mountOnEnter unmountOnExit>
          <Paper elevation={4} sx={{ pointerEvents: 'auto' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', p: 1 }}>
              <Typography
                variant="body2"
                component="span"
                sx={{ px: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <Typography component="code" variant="body2">
                  {selectedIds.length}
                </Typography>
                {intl.getMessage('template_grid_selected_label')}
              </Typography>
              <Button
                startIcon={<SelectAllIcon />}
                onClick={() => setSelectionModel({ type: 'include', ids: new Set(rows.map((row) => row.id)) })}
              >
                {intl.getMessage('template_grid_select_all_button')}
              </Button>
              <Divider orientation="vertical" flexItem />
              <Button startIcon={<FileDownloadIcon />} onClick={() => setExportOpen(true)}>
                {intl.getMessage('template_grid_export_button')}
              </Button>
              <Button
                startIcon={<SwapVertIcon />}
                endIcon={<ArrowDropUpIcon />}
                onClick={(event) => setMoveMenuAnchor(event.currentTarget)}
              >
                {intl.getMessage('template_grid_move_button')}
              </Button>
              <Menu
                anchorEl={moveMenuAnchor}
                open={!!moveMenuAnchor}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                disableScrollLock
                onClose={() => setMoveMenuAnchor(undefined)}
              >
                <MenuItem
                  onClick={() => {
                    setMoveMenuAnchor(undefined);
                    run(() => templateService.moveTemplates(selectedIds, 'top'));
                  }}
                >
                  <ListItemIcon>
                    <VerticalAlignTopIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{intl.getMessage('template_grid_move_top_option')}</ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setMoveMenuAnchor(undefined);
                    run(() => templateService.moveTemplates(selectedIds, 'bottom'));
                  }}
                >
                  <ListItemIcon>
                    <VerticalAlignBottomIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{intl.getMessage('template_grid_move_bottom_option')}</ListItemText>
                </MenuItem>
              </Menu>
              <Button
                startIcon={<ToggleOnIcon />}
                endIcon={<ArrowDropUpIcon />}
                disabled={!canEnableSelection && !canDisableSelection}
                onClick={(event) => setToggleMenuAnchor(event.currentTarget)}
              >
                {intl.getMessage('template_grid_toggle_button')}
              </Button>
              <Menu
                anchorEl={toggleMenuAnchor}
                open={!!toggleMenuAnchor}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                disableScrollLock
                onClose={() => setToggleMenuAnchor(undefined)}
              >
                <MenuItem
                  disabled={!canEnableSelection}
                  onClick={() => {
                    setToggleMenuAnchor(undefined);
                    run(() => templateService.setTemplatesEnabled(selectedIds, true));
                  }}
                >
                  <ListItemIcon>
                    <ToggleOnIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{intl.getMessage('template_grid_enable_option')}</ListItemText>
                </MenuItem>
                <MenuItem
                  disabled={!canDisableSelection}
                  onClick={() => {
                    setToggleMenuAnchor(undefined);
                    run(() => templateService.setTemplatesEnabled(selectedIds, false));
                  }}
                >
                  <ListItemIcon>
                    <ToggleOffIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{intl.getMessage('template_grid_disable_option')}</ListItemText>
                </MenuItem>
              </Menu>
              <Tooltip title={selectedPredefinedCount ? intl.getMessage('template_grid_delete_disabled_tooltip') : ''}>
                <span>
                  <Button
                    startIcon={<DeleteIcon />}
                    disabled={!canDeleteSelection}
                    onClick={() => setPendingDeleteIds(selectedIds)}
                  >
                    {intl.getMessage('template_grid_delete_button')}
                  </Button>
                </span>
              </Tooltip>
              <Divider orientation="vertical" flexItem />
              <Tooltip title={intl.getMessage('template_grid_clear_all_tooltip')}>
                <IconButton onClick={() => setSelectionModel(emptySelectionModel)}>
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Paper>
        </Slide>
      </Box>
      {/* Per-row actions menu. Both menus are anchored on the row's own trigger button (rather than, say, the "Move"
          menu item) so the anchor element stays mounted in the grid regardless of which menu is currently open. */}
      <Menu anchorEl={rowMenu?.anchor} open={!!rowMenu} disableScrollLock onClose={() => setRowMenu(undefined)}>
        {rowMenu && (
          <>
            <MenuItem
              onClick={() => {
                const { template } = rowMenu;
                setRowMenu(undefined);
                run(() => templateService.setTemplatesEnabled([template.id], !template.enabled));
              }}
            >
              <ListItemIcon>
                {rowMenu.template.enabled ? <ToggleOffIcon fontSize="small" /> : <ToggleOnIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText>
                {intl.getMessage(
                  rowMenu.template.enabled ? 'template_grid_disable_option' : 'template_grid_enable_option',
                )}
              </ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                openTemplateEditor(rowMenu.template);
                setRowMenu(undefined);
              }}
            >
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{intl.getMessage('template_grid_edit_option')}</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                openTemplateCloner(rowMenu.template);
                setRowMenu(undefined);
              }}
            >
              <ListItemIcon>
                <ContentCopyIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{intl.getMessage('template_grid_clone_option')}</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem
              disabled={rowMenuAtTop}
              onClick={() => {
                moveTemplateTo(rowMenu.template.id, 0);
                setRowMenu(undefined);
              }}
            >
              <ListItemIcon>
                <VerticalAlignTopIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{intl.getMessage('template_grid_move_to_top_option')}</ListItemText>
            </MenuItem>
            <MenuItem
              disabled={rowMenuAtTop}
              onClick={() => {
                moveTemplateTo(rowMenu.template.id, rowMenuIndex - 1);
                setRowMenu(undefined);
              }}
            >
              <ListItemIcon>
                <ArrowUpwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{intl.getMessage('template_grid_move_up_option')}</ListItemText>
            </MenuItem>
            <MenuItem
              disabled={rowMenuAtBottom}
              onClick={() => {
                moveTemplateTo(rowMenu.template.id, rowMenuIndex + 1);
                setRowMenu(undefined);
              }}
            >
              <ListItemIcon>
                <ArrowDownwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{intl.getMessage('template_grid_move_down_option')}</ListItemText>
            </MenuItem>
            <MenuItem
              disabled={rowMenuAtBottom}
              onClick={() => {
                moveTemplateTo(rowMenu.template.id, templates.length - 1);
                setRowMenu(undefined);
              }}
            >
              <ListItemIcon>
                <VerticalAlignBottomIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{intl.getMessage('template_grid_move_to_bottom_option')}</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem
              disabled={rowMenu.template.predefined}
              onClick={() => {
                setPendingDeleteIds([rowMenu.template.id]);
                setRowMenu(undefined);
              }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{intl.getMessage('template_grid_delete_button')}</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
      {/* Each dialog is only mounted while open so that it always starts from the current state */}
      {editorOpen && (
        <TemplateEditorDialog
          open
          key={editorTemplate?.id ?? (editorCloneFrom ? `clone-${editorCloneFrom.id}` : 'new')}
          cloneFrom={editorCloneFrom}
          template={editorTemplate}
          templates={templates}
          onClose={() => setEditorOpen(false)}
          onSaved={refresh}
        />
      )}
      {importOpen && <TemplateImportDialog open onClose={() => setImportOpen(false)} onImported={refresh} />}
      {exportOpen && <TemplateExportDialog open templates={selectedTemplates} onClose={() => setExportOpen(false)} />}
      <ConfirmDialog
        open={!!pendingDeleteIds?.length}
        destructive
        title={intl.getMessage('template_grid_delete_confirm_title')}
        content={
          pendingDeleteIds?.length === 1
            ? intl.getMessage('template_grid_delete_confirm_content_singular')
            : intl.getMessage('template_grid_delete_confirm_content_plural', String(pendingDeleteIds?.length))
        }
        confirmText={intl.getMessage('template_grid_delete_button')}
        onCancel={() => setPendingDeleteIds(undefined)}
        onConfirm={handleDeleteConfirmed}
      />
    </Box>
  );
}

export type TemplateDataGridProps = {
  /**
   * Free-text search applied to the title, description, content and shortcut of each template.
   */
  query?: string;
};
