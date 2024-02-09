const regex = /^(?<protocol>\w+:)\/\/(?<hostname>[\w.-]+)+:?(?<port>\d+)?(?<pathname>\/[\w/.%*\-&$+,:;=]{0,})+(?<search>\?(?:[\w\/.%*\-&$+,:;]+=[\w\/.%*\-&$+,:;]*&?)+)?(?<hash>#.+)?$/

export class EdgioNonStandardUrl {
    constructor(rawUrlOrRelativeUrl, baseUrl) {
        if (baseUrl) {
            throw new Error('baseUrl is not supported in EdgioNonStandardUrl. Please use absolute URL in the first argument instead.');
        }

        if (typeof rawUrlOrRelativeUrl !== 'string' || !rawUrlOrRelativeUrl) {
            throw new Error('Invalid URL');
        }

        // run the regex
        const match = regex.exec(rawUrlOrRelativeUrl);
        if (!match) {
            console.log('Invalid URL', rawUrlOrRelativeUrl);
            throw new Error('Invalid URL');
        }

        // extract the groups
        const {
            protocol = '',
            hostname = '',
            port = '',
            pathname = '',
            search = '',
            hash = ''
        } = match.groups;
        this.protocol = protocol;
        this.hostname = hostname;
        this.port = port;
        this.pathname = pathname;
        this.search = search;
        this.hash = hash;

        // create the search params
        this.searchParams = new EdgioNonStandardUrlSearchParams(search);
    }

    toString() {
        return this.origin + this.pathname + (this.searchParams.size() ? '?' + this.searchParams.toString() : '') + this.hash;
    }

    toJSON() {
        return this.toString();
    }

    get host() {
        return this.hostname + (this.port ? ':' + this.port : '');
    }

    get origin() {
        return this.protocol + '//' + this.host;
    }

    get href() {
        return this.toString();
    }
}

export class EdgioNonStandardUrlSearchParams {
    /** @type {[string, string][]} */
    #parameters = [];

    constructor(rawSearch) {
        // parse the search string
        const search = rawSearch.slice(1);
        const pairs = search.split('&');
        for (const pair of pairs) {
            const [key, value] = pair.split('=');
            if (!key) {
                continue;
            }
            this.append(key, value)
        }

        return this;
    }

    append(key, value) {
        if (typeof key !== 'string') {
            throw new TypeError('key must be a string');
        }
        this.#parameters.push([key, value || '']);
    }

    delete(key, value) {
        if (typeof key !== 'string') {
            throw new TypeError('key must be a string');
        }

        let searchFunction = ([k]) => k === key;
        if (value !== undefined) {
            if (typeof value !== 'string') {
                throw new TypeError('value must be a string');
            }

            searchFunction = ([k, v]) => k === key && v === value;
        }
        const index = this.#parameters.findIndex(searchFunction);
        if (index !== -1) {
            this.#parameters.splice(index, 1);
        }
    }

    entries() {
        return this.#parameters.slice();
    }

    forEach(callback, thisArg) {
        for (const [key, value] of this.#parameters) {
            callback.call(thisArg, value, key, this);
        }
    }

    get(key) {
        const pair = this.#parameters.find(([k]) => k === key);
        return pair ? pair[1] : null;
    }

    getAll(key) {
        return this.#parameters.filter(([k]) => k === key).map(([, v]) => v);
    }

    has(key) {
        return this.#parameters.some(([k]) => k === key);
    }

    keys() {
        return this.#parameters.map(([k]) => k);
    }

    set(key, value) {
        this.delete(key);
        this.append(key, value);
    }

    sort() {
        this.#parameters.sort(([a], [b]) => a.localeCompare(b));
    }

    toString() {
        return this.#parameters.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v || '')}`).join('&');
    }

    values() {
        return this.#parameters.map(([, v]) => v);
    }

    [Symbol.iterator]() {
        return this.#parameters[Symbol.iterator]();
    }

    size() {
        return this.#parameters.length;
    }
}
