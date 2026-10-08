import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import { makeStyles } from 'tss-react/mui';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAsyncTask, useCatch } from '../../reactHelper';
import { messagesActions } from '../../store';
import { useAdministrator } from '../../common/util/permissions';

// Served by the separate WhatsApp templates API, proxied on the same origin
const endpoint = '/templates-api';

const placeholders = ['name', 'uniqueid', 'contact', 'phone', 'sim', 'expiration', 'days'];

const useStyles = makeStyles()((theme) => ({
  details: {
    flexDirection: 'column',
  },
  code: {
    fontFamily: 'monospace',
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    paddingTop: `${theme.spacing(1)} !important`,
  },
}));

// The API authenticates with the Traccar session cookie. A 404 without a JSON body comes from
// Traccar itself (not logged in or session expired); API errors always carry {"error": "..."}.
const request = async (url, init) => {
  const response = await fetch(url, { ...init, credentials: 'same-origin' });
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!response.ok) {
    if (response.status === 404 && typeof json?.error !== 'string') {
      const error = new Error('Session expired');
      error.sessionExpired = true;
      throw error;
    }
    throw new Error(json?.error || text || response.statusText);
  }
  return json || {};
};

const findUnknownPlaceholders = (body) => [
  ...new Set(
    [...(body || '').matchAll(/\{([^{}\s]+)\}/g)]
      .map((match) => match[1])
      .filter((key) => !placeholders.includes(key)),
  ),
];

const WhatsAppTemplatesAccordion = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const t = useTranslation();
  const admin = useAdministrator();

  const [templates, setTemplates] = useState();
  const [error, setError] = useState();
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const errorMessage = (e) => (e.sessionExpired ? t('whatsappSessionExpired') : e.message);

  useAsyncTask(
    async ({ signal }) => {
      if (!admin) {
        return;
      }
      try {
        const { data } = await request(endpoint, { signal });
        setTemplates(data || []);
      } catch (e) {
        if (e.name !== 'AbortError') {
          setError(
            e.sessionExpired
              ? t('whatsappSessionExpired')
              : `${t('whatsappUnavailable')}: ${e.message}`,
          );
        }
      }
    },
    [admin, t],
  );

  const handleSave = useCatch(async () => {
    setSaving(true);
    try {
      const { data } = await request(`${endpoint}?id=${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: editing.body }),
      });
      setTemplates(templates.map((it) => (it.id === data.id ? data : it)));
      setEditing(null);
      dispatch(messagesActions.push({ message: t('whatsappTemplateSaved'), severity: 'success' }));
    } catch (e) {
      throw new Error(errorMessage(e), { cause: e });
    } finally {
      setSaving(false);
    }
  });

  if (!admin) {
    return null;
  }

  const unknownPlaceholders = findUnknownPlaceholders(editing?.body);

  return (
    <>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">WhatsApp</Typography>
        </AccordionSummary>
        <AccordionDetails className={classes.details}>
          {error && <Alert severity="warning">{error}</Alert>}
          {templates && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('sharedName')}</TableCell>
                  <TableCell>{t('whatsappTemplateCode')}</TableCell>
                  <TableCell padding="checkbox" />
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>{template.name}</TableCell>
                    <TableCell className={classes.code}>{template.code}</TableCell>
                    <TableCell padding="checkbox">
                      <IconButton size="small" onClick={() => setEditing({ ...template })}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </AccordionDetails>
      </Accordion>
      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t('whatsappTemplateEdit')}</DialogTitle>
        {editing && (
          <DialogContent className={classes.dialogContent}>
            <TextField
              label={t('whatsappTemplateCode')}
              value={editing.code}
              helperText={t('whatsappTemplateCodeHelp')}
              disabled
            />
            <TextField label={t('sharedName')} value={editing.name} disabled />
            <TextField
              label={t('whatsappTemplateMessage')}
              value={editing.body}
              onChange={(e) => setEditing({ ...editing, body: e.target.value })}
              helperText={`${t('whatsappTemplatePlaceholders')}: ${placeholders.map((it) => `{${it}}`).join(' ')}`}
              multiline
              minRows={6}
              maxRows={14}
            />
            {unknownPlaceholders.length > 0 && (
              <Alert severity="warning">
                {t('whatsappUnknownPlaceholders')}:{' '}
                {unknownPlaceholders.map((key) => `{${key}}`).join(' ')}
              </Alert>
            )}
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setEditing(null)}>{t('sharedCancel')}</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !editing?.body?.trim()}
          >
            {t('sharedSave')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WhatsAppTemplatesAccordion;
