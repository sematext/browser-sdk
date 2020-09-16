/* @flow */
export default {
  post(url: string, data: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.addEventListener('abort', () => reject(xhr));
      xhr.addEventListener('error', () => reject(xhr));
      xhr.addEventListener('timeout', () => reject(xhr));
      xhr.addEventListener('load', () => {
        resolve(xhr);
      });
      xhr.open('POST', url);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(data);
    });
  },

  head(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.addEventListener('abort', () => reject(xhr));
      xhr.addEventListener('error', () => reject(xhr));
      xhr.addEventListener('timeout', () => reject(xhr));
      xhr.addEventListener('load', () => {
        resolve(xhr);
      });
      xhr.open('HEAD', url);
      xhr.send();
    });
  },
};
