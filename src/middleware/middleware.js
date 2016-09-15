
/**
 *
 * @return {!Function} Connection promise that
 *     resolves on log in.
 */
export function ensureLogin() {
    
    return function($q) {
        var rv = $q.defer();
        rv.resolve(true);
        return rv.promise;
    };
}

/**
 *
 * @return {!Function} Connection promise that
 *     resolves on log in.
 */
export function ensureLogout() {
    return function() { return 3; };
}


