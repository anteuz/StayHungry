/**
 * Prevents Angular change detection from running with certain Web API's.
 * Change detection is not useful in some testing scenarios and these flags 
 * can help prevent it from running.
 */

// Disable patch for specific APIs during testing
(window as any).__Zone_disable_on_property = true; // disable patch onProperty such as onclick
(window as any).__zone_symbol__UNPATCHED_EVENTS = ['scroll', 'mousemove']; // disable patch specified eventNames