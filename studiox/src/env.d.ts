/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Site settings from the CMS, loaded once per request by src/middleware.ts. */
    settings: import('./lib/db/queries').SiteSettings;
  }
}
