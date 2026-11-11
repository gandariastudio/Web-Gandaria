import { initFlash } from './toast';
import { initCountdownDelete, initDirtyTracking, initMenus, initSearch, initSlugAutofill } from './ui';
import { initSortable } from './sortable';
import { initImageFields } from './image-field';
import { initRichText } from './rich-text';

initFlash();
initMenus();
initSearch();
initSortable();
initCountdownDelete();
initSlugAutofill();
initDirtyTracking();
initImageFields();
initRichText();
