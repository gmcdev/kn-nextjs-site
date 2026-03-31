const BASE_PATH = '/site';

const withBasePath = (path: string): string => {
  if (path.startsWith(BASE_PATH)) {
    return path;
  }
  return `${BASE_PATH}${path}`;
};

export default withBasePath;
