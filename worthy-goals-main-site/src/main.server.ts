import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

// The BootstrapContext must be forwarded — without it the server bootstrap
// fails with NG0401 "Missing Platform" and no route prerenders.
const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(App, config, context);

export default bootstrap;
