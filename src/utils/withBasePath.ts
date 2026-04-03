const BASE_PATH = '/site';

const withBasePath = (path: string): string => {
  if (path.startsWith(BASE_PATH)) {
    return path;
  }
  return `${BASE_PATH}${path}`;
};

export default withBasePath;

export const replaceUrl = (path: string): void => {
  const url = `${window.location.origin}${withBasePath(path)}`;
  if (url !== window.location.href) {
    window.history.replaceState({}, '', url);
  }
};
