import { initFlash } from './toast';
import { initCountdownDelete, initDirtyTracking, initMenus, initSearch, initSlugAutofill } from './ui';
import { initSortable } from './sortable';
import { initImageFields } from './image-field';
import { initRichText } from './rich-text';
import { initVideoFields } from './video-field';
import { initBlocks } from './blocks';

initFlash();
initMenus();
initSearch();
initSortable();
initCountdownDelete();
initSlugAutofill();
initDirtyTracking();
initImageFields();
initVideoFields();
initBlocks();
initRichText();
