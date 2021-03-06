import {
  DIALOG_CREATE_CUSTOM_APP_CLOSE,
  DIALOG_CREATE_CUSTOM_APP_DOWNLOADING_ICON_UPDATE,
  DIALOG_CREATE_CUSTOM_APP_FORM_UPDATE,
  DIALOG_CREATE_CUSTOM_APP_OPEN,
} from '../../constants/actions';

import hasErrors from '../../helpers/has-errors';
import isUrl from '../../helpers/is-url';
import validate from '../../helpers/validate';

import { open as openDialogChooseEngine } from '../dialog-choose-engine/actions';
import {
  isNameExisted,
} from '../app-management/utils';

import {
  open as openDialogLicenseRegistration,
} from '../dialog-license-registration/actions';

import { requestShowMessageBox } from '../../senders';

export const close = () => ({
  type: DIALOG_CREATE_CUSTOM_APP_CLOSE,
});

export const open = (form) => (dispatch, getState) => {
  const state = getState();

  const shouldAskForLicense = !state.preferences.registered
    && Object.keys(state.appManagement.apps).length > 1;

  if (shouldAskForLicense) {
    return dispatch(openDialogLicenseRegistration());
  }

  return dispatch({
    type: DIALOG_CREATE_CUSTOM_APP_OPEN,
    form,
  });
};

// to be replaced with invoke (electron 7+)
// https://electronjs.org/docs/api/ipc-renderer#ipcrendererinvokechannel-args
export const getWebsiteIconUrlAsync = (url) => new Promise((resolve, reject) => {
  try {
    const id = Date.now().toString();
    window.ipcRenderer.once(id, (e, uurl) => {
      resolve(uurl);
    });
    window.ipcRenderer.send('request-get-website-icon-url', id, url);
  } catch (err) {
    reject(err);
  }
});

let requestCount = 0;
export const getIconFromInternet = () => (dispatch, getState) => {
  const { form: { url, urlDisabled, urlError } } = getState().dialogCreateCustomApp;
  if (!url || urlDisabled || urlError) return;

  dispatch({
    type: DIALOG_CREATE_CUSTOM_APP_DOWNLOADING_ICON_UPDATE,
    downloadingIcon: true,
  });
  requestCount += 1;

  getWebsiteIconUrlAsync(url)
    .then((iconUrl) => {
      const { form } = getState().dialogCreateCustomApp;
      if (form.url === url) {
        const changes = { internetIcon: iconUrl || form.internetIcon };
        dispatch(({
          type: DIALOG_CREATE_CUSTOM_APP_FORM_UPDATE,
          changes,
        }));
      }

      if (!iconUrl) {
        return window.remote.dialog.showMessageBox(window.remote.getCurrentWindow(), {
          message: 'Unable to find a suitable icon from the Internet.',
          buttons: ['OK'],
          cancelId: 0,
          defaultId: 0,
        });
      }

      return null;
    }).catch(console.log) // eslint-disable-line no-console
    .then(() => {
      requestCount -= 1;
      dispatch({
        type: DIALOG_CREATE_CUSTOM_APP_DOWNLOADING_ICON_UPDATE,
        downloadingIcon: requestCount > 0,
      });
    });
};

const getValidationRules = (urlDisabled) => ({
  name: {
    fieldName: 'Name',
    required: true,
    filePath: true,
  },
  url: urlDisabled ? {
    fieldName: 'URL',
    required: true,
    lessStrictUrl: true,
  } : undefined,
});

export const updateForm = (changes) => (dispatch, getState) => {
  const { urlDisabled } = getState().dialogCreateCustomApp.form;

  dispatch({
    type: DIALOG_CREATE_CUSTOM_APP_FORM_UPDATE,
    changes: validate(changes, getValidationRules(urlDisabled)),
  });
};

export const create = () => (dispatch, getState) => {
  const state = getState();

  const { form } = state.dialogCreateCustomApp;

  const validatedChanges = validate(form, getValidationRules(form.urlDisabled));
  if (hasErrors(validatedChanges)) {
    return dispatch(updateForm(validatedChanges));
  }

  const id = `custom-${Date.now().toString()}`;
  const { name, url, urlDisabled } = form;
  const icon = form.icon || form.internetIcon || window.remote.getGlobal('defaultIcon');
  const protocolledUrl = isUrl(url) ? url : `http://${url}`;

  if (isNameExisted(name, state)) {
    requestShowMessageBox(`An app named ${name} already exists.`, 'error');
    return null;
  }

  dispatch(openDialogChooseEngine(id, name, urlDisabled ? null : protocolledUrl, icon));

  dispatch(close());
  return null;
};
