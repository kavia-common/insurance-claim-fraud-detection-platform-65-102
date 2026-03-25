export const getURL = () => {
  let url = process.env.REACT_APP_SITE_URL || "http://localhost:3000/";

  url = url.startsWith("http") ? url : `https://${url}`;
  url = url.endsWith("/") ? url : `${url}/`;

  return url;
};
