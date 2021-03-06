import semver from 'semver';
import xmlParser from 'fast-xml-parser';

import {
  UPDATE_SHOULD_USE_DARK_COLORS,
  UPDATE_IS_FULL_SCREEN,
  UPDATE_LATEST_TEMPLATE_VERSION,
  UPDATE_FETCHING_LATEST_TEMPLATE_VERSION,
  UPDATE_MOVING_ALL_APPS,
  UPDATE_INSTALLATION_PROGRESS,
} from '../../constants/actions';

export const updateIsFullScreen = (isFullScreen) => ({
  type: UPDATE_IS_FULL_SCREEN,
  isFullScreen,
});

export const updateShouldUseDarkColors = (shouldUseDarkColors) => ({
  type: UPDATE_SHOULD_USE_DARK_COLORS,
  shouldUseDarkColors,
});

export const updateLatestTemplateVersion = (latestTemplateVersion) => ({
  type: UPDATE_LATEST_TEMPLATE_VERSION,
  latestTemplateVersion,
});

export const updateFetchingLatestTemplateVersion = (fetchingLatestTemplateVersion) => ({
  type: UPDATE_FETCHING_LATEST_TEMPLATE_VERSION,
  fetchingLatestTemplateVersion,
});

export const updateMovingAllApps = (movingAllApps) => ({
  type: UPDATE_MOVING_ALL_APPS,
  movingAllApps,
});

export const updateInstallationProgress = (progress) => ({
  type: UPDATE_INSTALLATION_PROGRESS,
  progress,
});

export const fetchLatestTemplateVersionAsync = () => (dispatch, getState) => {
  const { allowPrerelease } = getState().preferences;
  dispatch(updateFetchingLatestTemplateVersion(true));
  return Promise.resolve()
    .then(() => new Promise((resolve) => setTimeout(resolve, 1000)))
    // use in-house API
    // to avoid using GitHub API as it has rate limit (60 requests per hour)
    // to avoid bugs with instead of https://github.com/atomery/juli/releases.atom
    // https://github.com/atomery/webcatalog/issues/890
    .then(() => {
      // prerelease is not supported by in-house API
      if (allowPrerelease) {
        return window.fetch('https://github.com/atomery/juli/releases.atom')
          .then((res) => res.text())
          .then((xmlData) => {
            const releases = xmlParser.parse(xmlData).feed.entry;

            // just return the first one
            const tagName = releases[0].id.split('/').pop();
            return tagName.substring(1);
          });
      }

      return window.fetch('https://juli.webcatalogapp.com/releases/latest.json')
        .then((res) => res.json())
        .then((data) => data.version);
    })
    .then((latestVersion) => {
      const globalTemplateVersion = window.remote.getGlobal('templateVersion');
      if (globalTemplateVersion && semver.lt(latestVersion, globalTemplateVersion)) {
        dispatch(updateLatestTemplateVersion(globalTemplateVersion));
      } else {
        dispatch(updateLatestTemplateVersion(latestVersion));
      }
      dispatch(updateFetchingLatestTemplateVersion(false));
    })
    .catch((err) => {
      const globalTemplateVersion = window.remote.getGlobal('templateVersion');
      if (globalTemplateVersion) {
        dispatch(updateLatestTemplateVersion(globalTemplateVersion));
      }
      dispatch(updateFetchingLatestTemplateVersion(false));
      console.log(err); // eslint-disable-line no-console
    });
};
