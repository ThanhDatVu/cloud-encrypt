import express, { Router } from 'express';
import authRoute from './auth.route';
import docsRoute from './swagger.route';
import userRoute from './user.route';
import encryptRoute from './encrypt.route';
import keyManagementRoute from './keyManagement.route';
import attachmentRoute from './attachment.route';
import metadataRoute from './metadata.route';
import config from '../../config/config';

const router = express.Router();

interface IRoute {
  path: string;
  route: Router;
}

const defaultIRoute: IRoute[] = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/encrypts',
    route: encryptRoute,
  },
  {
    path: '/kms',
    route: keyManagementRoute,
  },
  {
    path: '/attachments',
    route: attachmentRoute,
  },
  {
    path: '/metadata',
    route: metadataRoute,
  },
];

const devIRoute: IRoute[] = [
  // IRoute available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultIRoute.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devIRoute.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;
