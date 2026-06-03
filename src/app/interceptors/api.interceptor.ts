import { HttpInterceptorFn } from '@angular/common/http';
import { SERVER_URL } from '../server.config';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('localhost:8080') || req.url.startsWith('http://localhost:8080')) {
    const newUrl = req.url.replace('http://localhost:8080', SERVER_URL);
    return next(req.clone({ url: newUrl }));
  }
  return next(req);
};
