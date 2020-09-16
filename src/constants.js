/**
 * Don't change GLOBAL_KEY.
 *
 * This is the shared key between loader script and rum script. If you change it, websites that have
 * the older snippet with old GLOBAL_KEY will no longer work. Instead, if this needs to be changed
 * you will need to do it in a way that both old and new loader scripts are supported.
 */
// eslint-disable-next-line
export const GLOBAL_KEY = 'strum';

export const DEBUG_PARAM_KEY = '__strum_debug';

export const SESSION_COOKIE = 'strumsession';
export const USER_COOKIE = 'strumuser';
export const SESSION_KEEP_ALIVE_MINUTES = 5;

export const PAGELOAD_HARD_TIMEOUT = 5000;
export const PAGELOAD_SOFT_TIMEOUT = 5000;

export const BOT_USER_AGENT = RegExp('alexa|bot|crawl(er|ing)|facebookexternalhit|feedburner|google web preview|nagios|postrank|pingdom|slurp|spider|yahoo!|yandex');

