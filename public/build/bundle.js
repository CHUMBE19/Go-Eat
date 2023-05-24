
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Schedules a callback to run immediately before the component is unmounted.
     *
     * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
     * only one that runs inside a server-side component.
     *
     * https://svelte.dev/docs#run-time-svelte-ondestroy
     */
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update$1(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update$1($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        const updates = [];
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                // defer updates until all the DOM shuffling is done
                updates.push(() => block.p(child_ctx, dirty));
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        run_all(updates);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.58.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    function construct_svelte_component_dev(component, props) {
        const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
        try {
            const instance = new component(props);
            if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
                throw new Error(error_message);
            }
            return instance;
        }
        catch (err) {
            const { message } = err;
            if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
                throw new Error(error_message);
            }
            else {
                throw err;
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let started = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (started) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            started = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
                // We need to set this to false because callbacks can still happen despite having unsubscribed:
                // Callbacks might already be placed in the queue which doesn't know it should no longer
                // invoke this derived store.
                started = false;
            };
        });
    }

    /**
     * @external Store
     * @see [Svelte stores](https://svelte.dev/docs#component-format-script-4-prefix-stores-with-$-to-access-their-values-store-contract)
     */

    /**
     * Create a store similar to [Svelte's `derived`](https://svelte.dev/docs#run-time-svelte-store-writable),
     * but which has its own `set` and `update` methods and can send values back to the origin stores.
     * [Read more...](https://github.com/PixievoltNo1/svelte-writable-derived#default-export-writablederived)
     * 
     * @param {Store|Store[]} origins One or more stores to derive from. Same as
     * [`derived`](https://svelte.dev/docs#run-time-svelte-store-writable)'s 1st parameter.
     * @param {!Function} derive The callback to determine the derived value. Same as
     * [`derived`](https://svelte.dev/docs#run-time-svelte-store-writable)'s 2nd parameter.
     * @param {!Function} reflect Called when the derived store gets a new value via its `set` or
     * `update` methods, and determines new values for the origin stores.
     * [Read more...](https://github.com/PixievoltNo1/svelte-writable-derived#new-parameter-reflect)
     * @param [initial] The new store's initial value. Same as
     * [`derived`](https://svelte.dev/docs#run-time-svelte-store-writable)'s 3rd parameter.
     * 
     * @returns {Store} A writable store.
     */
    function writableDerived(origins, derive, reflect, initial) {
    	var childDerivedSetter, originValues, blockNextDerive = false;
    	var reflectOldValues = reflect.length >= 2;
    	var wrappedDerive = (got, set) => {
    		childDerivedSetter = set;
    		if (reflectOldValues) {
    			originValues = got;
    		}
    		if (!blockNextDerive) {
    			let returned = derive(got, set);
    			if (derive.length < 2) {
    				set(returned);
    			} else {
    				return returned;
    			}
    		}
    		blockNextDerive = false;
    	};
    	var childDerived = derived(origins, wrappedDerive, initial);
    	
    	var singleOrigin = !Array.isArray(origins);
    	function doReflect(reflecting) {
    		var setWith = reflect(reflecting, originValues);
    		if (singleOrigin) {
    			blockNextDerive = true;
    			origins.set(setWith);
    		} else {
    			setWith.forEach( (value, i) => {
    				blockNextDerive = true;
    				origins[i].set(value);
    			} );
    		}
    		blockNextDerive = false;
    	}
    	
    	var tryingSet = false;
    	function update(fn) {
    		var isUpdated, mutatedBySubscriptions, oldValue, newValue;
    		if (tryingSet) {
    			newValue = fn( get_store_value(childDerived) );
    			childDerivedSetter(newValue);
    			return;
    		}
    		var unsubscribe = childDerived.subscribe( (value) => {
    			if (!tryingSet) {
    				oldValue = value;
    			} else if (!isUpdated) {
    				isUpdated = true;
    			} else {
    				mutatedBySubscriptions = true;
    			}
    		} );
    		newValue = fn(oldValue);
    		tryingSet = true;
    		childDerivedSetter(newValue);
    		unsubscribe();
    		tryingSet = false;
    		if (mutatedBySubscriptions) {
    			newValue = get_store_value(childDerived);
    		}
    		if (isUpdated) {
    			doReflect(newValue);
    		}
    	}
    	return {
    		subscribe: childDerived.subscribe,
    		set(value) { update( () => value ); },
    		update,
    	};
    }

    const TOAST_LIMIT = 20;
    const toasts = writable([]);
    const pausedAt = writable(null);
    const toastTimeouts = new Map();
    const addToRemoveQueue = (toastId) => {
        if (toastTimeouts.has(toastId)) {
            return;
        }
        const timeout = setTimeout(() => {
            toastTimeouts.delete(toastId);
            remove(toastId);
        }, 1000);
        toastTimeouts.set(toastId, timeout);
    };
    const clearFromRemoveQueue = (toastId) => {
        const timeout = toastTimeouts.get(toastId);
        if (timeout) {
            clearTimeout(timeout);
        }
    };
    function update(toast) {
        if (toast.id) {
            clearFromRemoveQueue(toast.id);
        }
        toasts.update(($toasts) => $toasts.map((t) => (t.id === toast.id ? { ...t, ...toast } : t)));
    }
    function add(toast) {
        toasts.update(($toasts) => [toast, ...$toasts].slice(0, TOAST_LIMIT));
    }
    function upsert(toast) {
        if (get_store_value(toasts).find((t) => t.id === toast.id)) {
            update(toast);
        }
        else {
            add(toast);
        }
    }
    function dismiss(toastId) {
        toasts.update(($toasts) => {
            if (toastId) {
                addToRemoveQueue(toastId);
            }
            else {
                $toasts.forEach((toast) => {
                    addToRemoveQueue(toast.id);
                });
            }
            return $toasts.map((t) => t.id === toastId || toastId === undefined ? { ...t, visible: false } : t);
        });
    }
    function remove(toastId) {
        toasts.update(($toasts) => {
            if (toastId === undefined) {
                return [];
            }
            return $toasts.filter((t) => t.id !== toastId);
        });
    }
    function startPause(time) {
        pausedAt.set(time);
    }
    function endPause(time) {
        let diff;
        pausedAt.update(($pausedAt) => {
            diff = time - ($pausedAt || 0);
            return null;
        });
        toasts.update(($toasts) => $toasts.map((t) => ({
            ...t,
            pauseDuration: t.pauseDuration + diff
        })));
    }
    const defaultTimeouts = {
        blank: 4000,
        error: 4000,
        success: 2000,
        loading: Infinity,
        custom: 4000
    };
    function useToasterStore(toastOptions = {}) {
        const mergedToasts = writableDerived(toasts, ($toasts) => $toasts.map((t) => ({
            ...toastOptions,
            ...toastOptions[t.type],
            ...t,
            duration: t.duration ||
                toastOptions[t.type]?.duration ||
                toastOptions?.duration ||
                defaultTimeouts[t.type],
            style: [toastOptions.style, toastOptions[t.type]?.style, t.style].join(';')
        })), ($toasts) => $toasts);
        return {
            toasts: mergedToasts,
            pausedAt
        };
    }

    const isFunction = (valOrFunction) => typeof valOrFunction === 'function';
    const resolveValue = (valOrFunction, arg) => (isFunction(valOrFunction) ? valOrFunction(arg) : valOrFunction);

    const genId = (() => {
        let count = 0;
        return () => {
            count += 1;
            return count.toString();
        };
    })();
    const prefersReducedMotion = (() => {
        // Cache result
        let shouldReduceMotion;
        return () => {
            if (shouldReduceMotion === undefined && typeof window !== 'undefined') {
                const mediaQuery = matchMedia('(prefers-reduced-motion: reduce)');
                shouldReduceMotion = !mediaQuery || mediaQuery.matches;
            }
            return shouldReduceMotion;
        };
    })();

    const createToast = (message, type = 'blank', opts) => ({
        createdAt: Date.now(),
        visible: true,
        type,
        ariaProps: {
            role: 'status',
            'aria-live': 'polite'
        },
        message,
        pauseDuration: 0,
        ...opts,
        id: opts?.id || genId()
    });
    const createHandler = (type) => (message, options) => {
        const toast = createToast(message, type, options);
        upsert(toast);
        return toast.id;
    };
    const toast = (message, opts) => createHandler('blank')(message, opts);
    toast.error = createHandler('error');
    toast.success = createHandler('success');
    toast.loading = createHandler('loading');
    toast.custom = createHandler('custom');
    toast.dismiss = (toastId) => {
        dismiss(toastId);
    };
    toast.remove = (toastId) => remove(toastId);
    toast.promise = (promise, msgs, opts) => {
        const id = toast.loading(msgs.loading, { ...opts, ...opts?.loading });
        promise
            .then((p) => {
            toast.success(resolveValue(msgs.success, p), {
                id,
                ...opts,
                ...opts?.success
            });
            return p;
        })
            .catch((e) => {
            toast.error(resolveValue(msgs.error, e), {
                id,
                ...opts,
                ...opts?.error
            });
        });
        return promise;
    };

    function calculateOffset(toast, $toasts, opts) {
        const { reverseOrder, gutter = 8, defaultPosition } = opts || {};
        const relevantToasts = $toasts.filter((t) => (t.position || defaultPosition) === (toast.position || defaultPosition) && t.height);
        const toastIndex = relevantToasts.findIndex((t) => t.id === toast.id);
        const toastsBefore = relevantToasts.filter((toast, i) => i < toastIndex && toast.visible).length;
        const offset = relevantToasts
            .filter((t) => t.visible)
            .slice(...(reverseOrder ? [toastsBefore + 1] : [0, toastsBefore]))
            .reduce((acc, t) => acc + (t.height || 0) + gutter, 0);
        return offset;
    }
    const handlers = {
        startPause() {
            startPause(Date.now());
        },
        endPause() {
            endPause(Date.now());
        },
        updateHeight: (toastId, height) => {
            update({ id: toastId, height });
        },
        calculateOffset
    };
    function useToaster(toastOptions) {
        const { toasts, pausedAt } = useToasterStore(toastOptions);
        const timeouts = new Map();
        let _pausedAt;
        const unsubscribes = [
            pausedAt.subscribe(($pausedAt) => {
                if ($pausedAt) {
                    for (const [, timeoutId] of timeouts) {
                        clearTimeout(timeoutId);
                    }
                    timeouts.clear();
                }
                _pausedAt = $pausedAt;
            }),
            toasts.subscribe(($toasts) => {
                if (_pausedAt) {
                    return;
                }
                const now = Date.now();
                for (const t of $toasts) {
                    if (timeouts.has(t.id)) {
                        continue;
                    }
                    if (t.duration === Infinity) {
                        continue;
                    }
                    const durationLeft = (t.duration || 0) + t.pauseDuration - (now - t.createdAt);
                    if (durationLeft < 0) {
                        if (t.visible) {
                            // FIXME: This causes a recursive cycle of updates.
                            toast.dismiss(t.id);
                        }
                        return null;
                    }
                    timeouts.set(t.id, setTimeout(() => toast.dismiss(t.id), durationLeft));
                }
            })
        ];
        onDestroy(() => {
            for (const unsubscribe of unsubscribes) {
                unsubscribe();
            }
        });
        return { toasts, handlers };
    }

    /* node_modules\svelte-french-toast\dist\components\CheckmarkIcon.svelte generated by Svelte v3.58.0 */

    const file$9 = "node_modules\\svelte-french-toast\\dist\\components\\CheckmarkIcon.svelte";

    function create_fragment$9(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "svelte-11kvm4p");
    			set_style(div, "--primary", /*primary*/ ctx[0]);
    			set_style(div, "--secondary", /*secondary*/ ctx[1]);
    			add_location(div, file$9, 5, 0, 148);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*primary*/ 1) {
    				set_style(div, "--primary", /*primary*/ ctx[0]);
    			}

    			if (dirty & /*secondary*/ 2) {
    				set_style(div, "--secondary", /*secondary*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CheckmarkIcon', slots, []);
    	let { primary = "#61d345" } = $$props;
    	let { secondary = "#fff" } = $$props;
    	const writable_props = ['primary', 'secondary'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CheckmarkIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('primary' in $$props) $$invalidate(0, primary = $$props.primary);
    		if ('secondary' in $$props) $$invalidate(1, secondary = $$props.secondary);
    	};

    	$$self.$capture_state = () => ({ primary, secondary });

    	$$self.$inject_state = $$props => {
    		if ('primary' in $$props) $$invalidate(0, primary = $$props.primary);
    		if ('secondary' in $$props) $$invalidate(1, secondary = $$props.secondary);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [primary, secondary];
    }

    class CheckmarkIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { primary: 0, secondary: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CheckmarkIcon",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get primary() {
    		throw new Error("<CheckmarkIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set primary(value) {
    		throw new Error("<CheckmarkIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get secondary() {
    		throw new Error("<CheckmarkIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondary(value) {
    		throw new Error("<CheckmarkIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-french-toast\dist\components\ErrorIcon.svelte generated by Svelte v3.58.0 */

    const file$8 = "node_modules\\svelte-french-toast\\dist\\components\\ErrorIcon.svelte";

    function create_fragment$8(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "svelte-1ee93ns");
    			set_style(div, "--primary", /*primary*/ ctx[0]);
    			set_style(div, "--secondary", /*secondary*/ ctx[1]);
    			add_location(div, file$8, 5, 0, 148);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*primary*/ 1) {
    				set_style(div, "--primary", /*primary*/ ctx[0]);
    			}

    			if (dirty & /*secondary*/ 2) {
    				set_style(div, "--secondary", /*secondary*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ErrorIcon', slots, []);
    	let { primary = "#ff4b4b" } = $$props;
    	let { secondary = "#fff" } = $$props;
    	const writable_props = ['primary', 'secondary'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ErrorIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('primary' in $$props) $$invalidate(0, primary = $$props.primary);
    		if ('secondary' in $$props) $$invalidate(1, secondary = $$props.secondary);
    	};

    	$$self.$capture_state = () => ({ primary, secondary });

    	$$self.$inject_state = $$props => {
    		if ('primary' in $$props) $$invalidate(0, primary = $$props.primary);
    		if ('secondary' in $$props) $$invalidate(1, secondary = $$props.secondary);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [primary, secondary];
    }

    class ErrorIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { primary: 0, secondary: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ErrorIcon",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get primary() {
    		throw new Error("<ErrorIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set primary(value) {
    		throw new Error("<ErrorIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get secondary() {
    		throw new Error("<ErrorIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondary(value) {
    		throw new Error("<ErrorIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-french-toast\dist\components\LoaderIcon.svelte generated by Svelte v3.58.0 */

    const file$7 = "node_modules\\svelte-french-toast\\dist\\components\\LoaderIcon.svelte";

    function create_fragment$7(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "svelte-1j7dflg");
    			set_style(div, "--primary", /*primary*/ ctx[0]);
    			set_style(div, "--secondary", /*secondary*/ ctx[1]);
    			add_location(div, file$7, 5, 0, 151);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*primary*/ 1) {
    				set_style(div, "--primary", /*primary*/ ctx[0]);
    			}

    			if (dirty & /*secondary*/ 2) {
    				set_style(div, "--secondary", /*secondary*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('LoaderIcon', slots, []);
    	let { primary = "#616161" } = $$props;
    	let { secondary = "#e0e0e0" } = $$props;
    	const writable_props = ['primary', 'secondary'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LoaderIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('primary' in $$props) $$invalidate(0, primary = $$props.primary);
    		if ('secondary' in $$props) $$invalidate(1, secondary = $$props.secondary);
    	};

    	$$self.$capture_state = () => ({ primary, secondary });

    	$$self.$inject_state = $$props => {
    		if ('primary' in $$props) $$invalidate(0, primary = $$props.primary);
    		if ('secondary' in $$props) $$invalidate(1, secondary = $$props.secondary);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [primary, secondary];
    }

    class LoaderIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { primary: 0, secondary: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LoaderIcon",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get primary() {
    		throw new Error("<LoaderIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set primary(value) {
    		throw new Error("<LoaderIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get secondary() {
    		throw new Error("<LoaderIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondary(value) {
    		throw new Error("<LoaderIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-french-toast\dist\components\ToastIcon.svelte generated by Svelte v3.58.0 */
    const file$6 = "node_modules\\svelte-french-toast\\dist\\components\\ToastIcon.svelte";

    // (13:27) 
    function create_if_block_2$1(ctx) {
    	let div;
    	let loadericon;
    	let t;
    	let current;
    	const loadericon_spread_levels = [/*iconTheme*/ ctx[0]];
    	let loadericon_props = {};

    	for (let i = 0; i < loadericon_spread_levels.length; i += 1) {
    		loadericon_props = assign(loadericon_props, loadericon_spread_levels[i]);
    	}

    	loadericon = new LoaderIcon({ props: loadericon_props, $$inline: true });
    	let if_block = /*type*/ ctx[2] !== 'loading' && create_if_block_3$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(loadericon.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "indicator svelte-1kgeier");
    			add_location(div, file$6, 13, 1, 390);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(loadericon, div, null);
    			append_dev(div, t);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const loadericon_changes = (dirty & /*iconTheme*/ 1)
    			? get_spread_update(loadericon_spread_levels, [get_spread_object(/*iconTheme*/ ctx[0])])
    			: {};

    			loadericon.$set(loadericon_changes);

    			if (/*type*/ ctx[2] !== 'loading') {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*type*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_3$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loadericon.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loadericon.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(loadericon);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(13:27) ",
    		ctx
    	});

    	return block;
    }

    // (11:38) 
    function create_if_block_1$1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*icon*/ ctx[1];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) mount_component(switch_instance, target, anchor);
    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*icon*/ 2 && switch_value !== (switch_value = /*icon*/ ctx[1])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(11:38) ",
    		ctx
    	});

    	return block;
    }

    // (9:0) {#if typeof icon === 'string'}
    function create_if_block$4(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*icon*/ ctx[1]);
    			attr_dev(div, "class", "animated svelte-1kgeier");
    			add_location(div, file$6, 9, 1, 253);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*icon*/ 2) set_data_dev(t, /*icon*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(9:0) {#if typeof icon === 'string'}",
    		ctx
    	});

    	return block;
    }

    // (16:2) {#if type !== 'loading'}
    function create_if_block_3$1(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block_4$1, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*type*/ ctx[2] === 'error') return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "status svelte-1kgeier");
    			add_location(div, file$6, 16, 3, 476);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(16:2) {#if type !== 'loading'}",
    		ctx
    	});

    	return block;
    }

    // (20:4) {:else}
    function create_else_block$4(ctx) {
    	let checkmarkicon;
    	let current;
    	const checkmarkicon_spread_levels = [/*iconTheme*/ ctx[0]];
    	let checkmarkicon_props = {};

    	for (let i = 0; i < checkmarkicon_spread_levels.length; i += 1) {
    		checkmarkicon_props = assign(checkmarkicon_props, checkmarkicon_spread_levels[i]);
    	}

    	checkmarkicon = new CheckmarkIcon({
    			props: checkmarkicon_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(checkmarkicon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(checkmarkicon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const checkmarkicon_changes = (dirty & /*iconTheme*/ 1)
    			? get_spread_update(checkmarkicon_spread_levels, [get_spread_object(/*iconTheme*/ ctx[0])])
    			: {};

    			checkmarkicon.$set(checkmarkicon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkmarkicon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkmarkicon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(checkmarkicon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(20:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (18:4) {#if type === 'error'}
    function create_if_block_4$1(ctx) {
    	let erroricon;
    	let current;
    	const erroricon_spread_levels = [/*iconTheme*/ ctx[0]];
    	let erroricon_props = {};

    	for (let i = 0; i < erroricon_spread_levels.length; i += 1) {
    		erroricon_props = assign(erroricon_props, erroricon_spread_levels[i]);
    	}

    	erroricon = new ErrorIcon({ props: erroricon_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(erroricon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(erroricon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const erroricon_changes = (dirty & /*iconTheme*/ 1)
    			? get_spread_update(erroricon_spread_levels, [get_spread_object(/*iconTheme*/ ctx[0])])
    			: {};

    			erroricon.$set(erroricon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(erroricon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(erroricon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(erroricon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(18:4) {#if type === 'error'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_if_block_1$1, create_if_block_2$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (typeof /*icon*/ ctx[1] === 'string') return 0;
    		if (typeof /*icon*/ ctx[1] !== 'undefined') return 1;
    		if (/*type*/ ctx[2] !== 'blank') return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let type;
    	let icon;
    	let iconTheme;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ToastIcon', slots, []);
    	let { toast } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (toast === undefined && !('toast' in $$props || $$self.$$.bound[$$self.$$.props['toast']])) {
    			console.warn("<ToastIcon> was created without expected prop 'toast'");
    		}
    	});

    	const writable_props = ['toast'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ToastIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('toast' in $$props) $$invalidate(3, toast = $$props.toast);
    	};

    	$$self.$capture_state = () => ({
    		CheckmarkIcon,
    		ErrorIcon,
    		LoaderIcon,
    		toast,
    		iconTheme,
    		icon,
    		type
    	});

    	$$self.$inject_state = $$props => {
    		if ('toast' in $$props) $$invalidate(3, toast = $$props.toast);
    		if ('iconTheme' in $$props) $$invalidate(0, iconTheme = $$props.iconTheme);
    		if ('icon' in $$props) $$invalidate(1, icon = $$props.icon);
    		if ('type' in $$props) $$invalidate(2, type = $$props.type);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*toast*/ 8) {
    			$$invalidate(2, { type, icon, iconTheme } = toast, type, ($$invalidate(1, icon), $$invalidate(3, toast)), ($$invalidate(0, iconTheme), $$invalidate(3, toast)));
    		}
    	};

    	return [iconTheme, icon, type, toast];
    }

    class ToastIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { toast: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ToastIcon",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get toast() {
    		throw new Error("<ToastIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toast(value) {
    		throw new Error("<ToastIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-french-toast\dist\components\ToastMessage.svelte generated by Svelte v3.58.0 */

    const file$5 = "node_modules\\svelte-french-toast\\dist\\components\\ToastMessage.svelte";

    // (7:1) {:else}
    function create_else_block$3(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*toast*/ ctx[0].message;

    	function switch_props(ctx) {
    		return {
    			props: { toast: /*toast*/ ctx[0] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) mount_component(switch_instance, target, anchor);
    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty & /*toast*/ 1) switch_instance_changes.toast = /*toast*/ ctx[0];

    			if (dirty & /*toast*/ 1 && switch_value !== (switch_value = /*toast*/ ctx[0].message)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(7:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (5:1) {#if typeof toast.message === 'string'}
    function create_if_block$3(ctx) {
    	let t_value = /*toast*/ ctx[0].message + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*toast*/ 1 && t_value !== (t_value = /*toast*/ ctx[0].message + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(5:1) {#if typeof toast.message === 'string'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block$3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (typeof /*toast*/ ctx[0].message === 'string') return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let div_levels = [{ class: "message" }, /*toast*/ ctx[0].ariaProps];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			set_attributes(div, div_data);
    			toggle_class(div, "svelte-1nauejd", true);
    			add_location(div, file$5, 3, 0, 37);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [{ class: "message" }, dirty & /*toast*/ 1 && /*toast*/ ctx[0].ariaProps]));
    			toggle_class(div, "svelte-1nauejd", true);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ToastMessage', slots, []);
    	let { toast } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (toast === undefined && !('toast' in $$props || $$self.$$.bound[$$self.$$.props['toast']])) {
    			console.warn("<ToastMessage> was created without expected prop 'toast'");
    		}
    	});

    	const writable_props = ['toast'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ToastMessage> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('toast' in $$props) $$invalidate(0, toast = $$props.toast);
    	};

    	$$self.$capture_state = () => ({ toast });

    	$$self.$inject_state = $$props => {
    		if ('toast' in $$props) $$invalidate(0, toast = $$props.toast);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [toast];
    }

    class ToastMessage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { toast: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ToastMessage",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get toast() {
    		throw new Error("<ToastMessage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toast(value) {
    		throw new Error("<ToastMessage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-french-toast\dist\components\ToastBar.svelte generated by Svelte v3.58.0 */
    const file$4 = "node_modules\\svelte-french-toast\\dist\\components\\ToastBar.svelte";
    const get_default_slot_changes$1 = dirty => ({ toast: dirty & /*toast*/ 1 });

    const get_default_slot_context$1 = ctx => ({
    	ToastIcon,
    	ToastMessage,
    	toast: /*toast*/ ctx[0]
    });

    // (28:1) {:else}
    function create_else_block$2(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], get_default_slot_context$1);
    	const default_slot_or_fallback = default_slot || fallback_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, toast*/ 129)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[7],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[7])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[7], dirty, get_default_slot_changes$1),
    						get_default_slot_context$1
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty & /*toast*/ 1)) {
    					default_slot_or_fallback.p(ctx, !current ? -1 : dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(28:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (23:1) {#if Component}
    function create_if_block$2(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*Component*/ ctx[2];

    	function switch_props(ctx) {
    		return {
    			props: {
    				$$slots: {
    					message: [create_message_slot],
    					icon: [create_icon_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) mount_component(switch_instance, target, anchor);
    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};

    			if (dirty & /*$$scope, toast*/ 129) {
    				switch_instance_changes.$$scope = { dirty, ctx };
    			}

    			if (dirty & /*Component*/ 4 && switch_value !== (switch_value = /*Component*/ ctx[2])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(23:1) {#if Component}",
    		ctx
    	});

    	return block;
    }

    // (29:43)     
    function fallback_block$1(ctx) {
    	let toasticon;
    	let t;
    	let toastmessage;
    	let current;

    	toasticon = new ToastIcon({
    			props: { toast: /*toast*/ ctx[0] },
    			$$inline: true
    		});

    	toastmessage = new ToastMessage({
    			props: { toast: /*toast*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(toasticon.$$.fragment);
    			t = space();
    			create_component(toastmessage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(toasticon, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(toastmessage, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const toasticon_changes = {};
    			if (dirty & /*toast*/ 1) toasticon_changes.toast = /*toast*/ ctx[0];
    			toasticon.$set(toasticon_changes);
    			const toastmessage_changes = {};
    			if (dirty & /*toast*/ 1) toastmessage_changes.toast = /*toast*/ ctx[0];
    			toastmessage.$set(toastmessage_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toasticon.$$.fragment, local);
    			transition_in(toastmessage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toasticon.$$.fragment, local);
    			transition_out(toastmessage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(toasticon, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(toastmessage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$1.name,
    		type: "fallback",
    		source: "(29:43)     ",
    		ctx
    	});

    	return block;
    }

    // (25:3) 
    function create_icon_slot(ctx) {
    	let toasticon;
    	let current;

    	toasticon = new ToastIcon({
    			props: { toast: /*toast*/ ctx[0], slot: "icon" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(toasticon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(toasticon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const toasticon_changes = {};
    			if (dirty & /*toast*/ 1) toasticon_changes.toast = /*toast*/ ctx[0];
    			toasticon.$set(toasticon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toasticon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toasticon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(toasticon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_icon_slot.name,
    		type: "slot",
    		source: "(25:3) ",
    		ctx
    	});

    	return block;
    }

    // (26:3) 
    function create_message_slot(ctx) {
    	let toastmessage;
    	let current;

    	toastmessage = new ToastMessage({
    			props: { toast: /*toast*/ ctx[0], slot: "message" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(toastmessage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(toastmessage, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const toastmessage_changes = {};
    			if (dirty & /*toast*/ 1) toastmessage_changes.toast = /*toast*/ ctx[0];
    			toastmessage.$set(toastmessage_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toastmessage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toastmessage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(toastmessage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_message_slot.name,
    		type: "slot",
    		source: "(26:3) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let div_class_value;
    	let div_style_value;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*Component*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();

    			attr_dev(div, "class", div_class_value = "base " + (/*toast*/ ctx[0].height
    			? /*animation*/ ctx[4]
    			: 'transparent') + " " + (/*toast*/ ctx[0].className || '') + " svelte-ug60r4");

    			attr_dev(div, "style", div_style_value = "" + (/*style*/ ctx[1] + "; " + /*toast*/ ctx[0].style));
    			set_style(div, "--factor", /*factor*/ ctx[3]);
    			add_location(div, file$4, 17, 0, 540);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}

    			if (!current || dirty & /*toast, animation*/ 17 && div_class_value !== (div_class_value = "base " + (/*toast*/ ctx[0].height
    			? /*animation*/ ctx[4]
    			: 'transparent') + " " + (/*toast*/ ctx[0].className || '') + " svelte-ug60r4")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (!current || dirty & /*style, toast*/ 3 && div_style_value !== (div_style_value = "" + (/*style*/ ctx[1] + "; " + /*toast*/ ctx[0].style))) {
    				attr_dev(div, "style", div_style_value);
    			}

    			const style_changed = dirty & /*style, toast*/ 3;

    			if (style_changed || dirty & /*factor, style, toast*/ 11) {
    				set_style(div, "--factor", /*factor*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ToastBar', slots, ['default']);
    	let { toast } = $$props;
    	let { position = void 0 } = $$props;
    	let { style = "" } = $$props;
    	let { Component = void 0 } = $$props;
    	let factor;
    	let animation;

    	$$self.$$.on_mount.push(function () {
    		if (toast === undefined && !('toast' in $$props || $$self.$$.bound[$$self.$$.props['toast']])) {
    			console.warn("<ToastBar> was created without expected prop 'toast'");
    		}
    	});

    	const writable_props = ['toast', 'position', 'style', 'Component'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ToastBar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('toast' in $$props) $$invalidate(0, toast = $$props.toast);
    		if ('position' in $$props) $$invalidate(5, position = $$props.position);
    		if ('style' in $$props) $$invalidate(1, style = $$props.style);
    		if ('Component' in $$props) $$invalidate(2, Component = $$props.Component);
    		if ('$$scope' in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		ToastIcon,
    		prefersReducedMotion,
    		ToastMessage,
    		toast,
    		position,
    		style,
    		Component,
    		factor,
    		animation
    	});

    	$$self.$inject_state = $$props => {
    		if ('toast' in $$props) $$invalidate(0, toast = $$props.toast);
    		if ('position' in $$props) $$invalidate(5, position = $$props.position);
    		if ('style' in $$props) $$invalidate(1, style = $$props.style);
    		if ('Component' in $$props) $$invalidate(2, Component = $$props.Component);
    		if ('factor' in $$props) $$invalidate(3, factor = $$props.factor);
    		if ('animation' in $$props) $$invalidate(4, animation = $$props.animation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*toast, position*/ 33) {
    			{
    				const top = (toast.position || position || "top-center").includes("top");
    				$$invalidate(3, factor = top ? 1 : -1);

    				const [enter, exit] = prefersReducedMotion()
    				? ["fadeIn", "fadeOut"]
    				: ["enter", "exit"];

    				$$invalidate(4, animation = toast.visible ? enter : exit);
    			}
    		}
    	};

    	return [toast, style, Component, factor, animation, position, slots, $$scope];
    }

    class ToastBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			toast: 0,
    			position: 5,
    			style: 1,
    			Component: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ToastBar",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get toast() {
    		throw new Error("<ToastBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toast(value) {
    		throw new Error("<ToastBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error("<ToastBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<ToastBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<ToastBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<ToastBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Component() {
    		throw new Error("<ToastBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Component(value) {
    		throw new Error("<ToastBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-french-toast\dist\components\ToastWrapper.svelte generated by Svelte v3.58.0 */
    const file$3 = "node_modules\\svelte-french-toast\\dist\\components\\ToastWrapper.svelte";
    const get_default_slot_changes = dirty => ({ toast: dirty & /*toast*/ 1 });
    const get_default_slot_context = ctx => ({ toast: /*toast*/ ctx[0] });

    // (34:1) {:else}
    function create_else_block$1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], get_default_slot_context);
    	const default_slot_or_fallback = default_slot || fallback_block(ctx);

    	const block = {
    		c: function create() {
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, toast*/ 129)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[7],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[7])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[7], dirty, get_default_slot_changes),
    						get_default_slot_context
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty & /*toast*/ 1)) {
    					default_slot_or_fallback.p(ctx, !current ? -1 : dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(34:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (32:1) {#if toast.type === 'custom'}
    function create_if_block$1(ctx) {
    	let toastmessage;
    	let current;

    	toastmessage = new ToastMessage({
    			props: { toast: /*toast*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(toastmessage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(toastmessage, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const toastmessage_changes = {};
    			if (dirty & /*toast*/ 1) toastmessage_changes.toast = /*toast*/ ctx[0];
    			toastmessage.$set(toastmessage_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toastmessage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toastmessage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(toastmessage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(32:1) {#if toast.type === 'custom'}",
    		ctx
    	});

    	return block;
    }

    // (35:16)     
    function fallback_block(ctx) {
    	let toastbar;
    	let current;

    	toastbar = new ToastBar({
    			props: {
    				toast: /*toast*/ ctx[0],
    				position: /*toast*/ ctx[0].position
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(toastbar.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(toastbar, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const toastbar_changes = {};
    			if (dirty & /*toast*/ 1) toastbar_changes.toast = /*toast*/ ctx[0];
    			if (dirty & /*toast*/ 1) toastbar_changes.position = /*toast*/ ctx[0].position;
    			toastbar.$set(toastbar_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toastbar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toastbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(toastbar, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(35:16)     ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*toast*/ ctx[0].type === 'custom') return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "wrapper svelte-v01oml");
    			toggle_class(div, "active", /*toast*/ ctx[0].visible);
    			toggle_class(div, "transition", !prefersReducedMotion());
    			set_style(div, "--factor", /*factor*/ ctx[3]);
    			set_style(div, "--offset", /*toast*/ ctx[0].offset);
    			set_style(div, "top", /*top*/ ctx[5]);
    			set_style(div, "bottom", /*bottom*/ ctx[4]);
    			set_style(div, "justify-content", /*justifyContent*/ ctx[2]);
    			add_location(div, file$3, 20, 0, 630);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			/*div_binding*/ ctx[9](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}

    			if (!current || dirty & /*toast*/ 1) {
    				toggle_class(div, "active", /*toast*/ ctx[0].visible);
    			}

    			if (dirty & /*factor*/ 8) {
    				set_style(div, "--factor", /*factor*/ ctx[3]);
    			}

    			if (dirty & /*toast*/ 1) {
    				set_style(div, "--offset", /*toast*/ ctx[0].offset);
    			}

    			if (dirty & /*top*/ 32) {
    				set_style(div, "top", /*top*/ ctx[5]);
    			}

    			if (dirty & /*bottom*/ 16) {
    				set_style(div, "bottom", /*bottom*/ ctx[4]);
    			}

    			if (dirty & /*justifyContent*/ 4) {
    				set_style(div, "justify-content", /*justifyContent*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    			/*div_binding*/ ctx[9](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let top;
    	let bottom;
    	let factor;
    	let justifyContent;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ToastWrapper', slots, ['default']);
    	let { toast } = $$props;
    	let { setHeight } = $$props;
    	let wrapperEl;

    	onMount(() => {
    		setHeight(wrapperEl.getBoundingClientRect().height);
    	});

    	$$self.$$.on_mount.push(function () {
    		if (toast === undefined && !('toast' in $$props || $$self.$$.bound[$$self.$$.props['toast']])) {
    			console.warn("<ToastWrapper> was created without expected prop 'toast'");
    		}

    		if (setHeight === undefined && !('setHeight' in $$props || $$self.$$.bound[$$self.$$.props['setHeight']])) {
    			console.warn("<ToastWrapper> was created without expected prop 'setHeight'");
    		}
    	});

    	const writable_props = ['toast', 'setHeight'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ToastWrapper> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			wrapperEl = $$value;
    			$$invalidate(1, wrapperEl);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('toast' in $$props) $$invalidate(0, toast = $$props.toast);
    		if ('setHeight' in $$props) $$invalidate(6, setHeight = $$props.setHeight);
    		if ('$$scope' in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		prefersReducedMotion,
    		ToastBar,
    		ToastMessage,
    		toast,
    		setHeight,
    		wrapperEl,
    		justifyContent,
    		factor,
    		bottom,
    		top
    	});

    	$$self.$inject_state = $$props => {
    		if ('toast' in $$props) $$invalidate(0, toast = $$props.toast);
    		if ('setHeight' in $$props) $$invalidate(6, setHeight = $$props.setHeight);
    		if ('wrapperEl' in $$props) $$invalidate(1, wrapperEl = $$props.wrapperEl);
    		if ('justifyContent' in $$props) $$invalidate(2, justifyContent = $$props.justifyContent);
    		if ('factor' in $$props) $$invalidate(3, factor = $$props.factor);
    		if ('bottom' in $$props) $$invalidate(4, bottom = $$props.bottom);
    		if ('top' in $$props) $$invalidate(5, top = $$props.top);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*toast*/ 1) {
    			$$invalidate(5, top = (toast.position?.includes("top")) ? 0 : null);
    		}

    		if ($$self.$$.dirty & /*toast*/ 1) {
    			$$invalidate(4, bottom = (toast.position?.includes("bottom")) ? 0 : null);
    		}

    		if ($$self.$$.dirty & /*toast*/ 1) {
    			$$invalidate(3, factor = (toast.position?.includes("top")) ? 1 : -1);
    		}

    		if ($$self.$$.dirty & /*toast*/ 1) {
    			$$invalidate(2, justifyContent = toast.position?.includes("center") && "center" || toast.position?.includes("right") && "flex-end" || null);
    		}
    	};

    	return [
    		toast,
    		wrapperEl,
    		justifyContent,
    		factor,
    		bottom,
    		top,
    		setHeight,
    		$$scope,
    		slots,
    		div_binding
    	];
    }

    class ToastWrapper extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { toast: 0, setHeight: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ToastWrapper",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get toast() {
    		throw new Error("<ToastWrapper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toast(value) {
    		throw new Error("<ToastWrapper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setHeight() {
    		throw new Error("<ToastWrapper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set setHeight(value) {
    		throw new Error("<ToastWrapper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-french-toast\dist\components\Toaster.svelte generated by Svelte v3.58.0 */
    const file$2 = "node_modules\\svelte-french-toast\\dist\\components\\Toaster.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (29:1) {#each _toasts as toast (toast.id)}
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let toastwrapper;
    	let current;

    	function func(...args) {
    		return /*func*/ ctx[10](/*toast*/ ctx[11], ...args);
    	}

    	toastwrapper = new ToastWrapper({
    			props: {
    				toast: /*toast*/ ctx[11],
    				setHeight: func
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(toastwrapper.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(toastwrapper, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const toastwrapper_changes = {};
    			if (dirty & /*_toasts*/ 4) toastwrapper_changes.toast = /*toast*/ ctx[11];
    			if (dirty & /*_toasts*/ 4) toastwrapper_changes.setHeight = func;
    			toastwrapper.$set(toastwrapper_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toastwrapper.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toastwrapper.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(toastwrapper, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(29:1) {#each _toasts as toast (toast.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let div_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*_toasts*/ ctx[2];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*toast*/ ctx[11].id;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", div_class_value = "toaster " + (/*containerClassName*/ ctx[1] || '') + " svelte-1phplh9");
    			attr_dev(div, "style", /*containerStyle*/ ctx[0]);
    			add_location(div, file$2, 22, 0, 617);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "mouseenter", /*handlers*/ ctx[4].startPause, false, false, false, false),
    					listen_dev(div, "mouseleave", /*handlers*/ ctx[4].endPause, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*_toasts, handlers*/ 20) {
    				each_value = /*_toasts*/ ctx[2];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
    				check_outros();
    			}

    			if (!current || dirty & /*containerClassName*/ 2 && div_class_value !== (div_class_value = "toaster " + (/*containerClassName*/ ctx[1] || '') + " svelte-1phplh9")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (!current || dirty & /*containerStyle*/ 1) {
    				attr_dev(div, "style", /*containerStyle*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $toasts;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Toaster', slots, []);
    	let { reverseOrder = false } = $$props;
    	let { position = "top-center" } = $$props;
    	let { toastOptions = void 0 } = $$props;
    	let { gutter = 8 } = $$props;
    	let { containerStyle = void 0 } = $$props;
    	let { containerClassName = void 0 } = $$props;
    	const { toasts, handlers } = useToaster(toastOptions);
    	validate_store(toasts, 'toasts');
    	component_subscribe($$self, toasts, value => $$invalidate(9, $toasts = value));
    	let _toasts;

    	const writable_props = [
    		'reverseOrder',
    		'position',
    		'toastOptions',
    		'gutter',
    		'containerStyle',
    		'containerClassName'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Toaster> was created with unknown prop '${key}'`);
    	});

    	const func = (toast, height) => handlers.updateHeight(toast.id, height);

    	$$self.$$set = $$props => {
    		if ('reverseOrder' in $$props) $$invalidate(5, reverseOrder = $$props.reverseOrder);
    		if ('position' in $$props) $$invalidate(6, position = $$props.position);
    		if ('toastOptions' in $$props) $$invalidate(7, toastOptions = $$props.toastOptions);
    		if ('gutter' in $$props) $$invalidate(8, gutter = $$props.gutter);
    		if ('containerStyle' in $$props) $$invalidate(0, containerStyle = $$props.containerStyle);
    		if ('containerClassName' in $$props) $$invalidate(1, containerClassName = $$props.containerClassName);
    	};

    	$$self.$capture_state = () => ({
    		useToaster,
    		ToastWrapper,
    		reverseOrder,
    		position,
    		toastOptions,
    		gutter,
    		containerStyle,
    		containerClassName,
    		toasts,
    		handlers,
    		_toasts,
    		$toasts
    	});

    	$$self.$inject_state = $$props => {
    		if ('reverseOrder' in $$props) $$invalidate(5, reverseOrder = $$props.reverseOrder);
    		if ('position' in $$props) $$invalidate(6, position = $$props.position);
    		if ('toastOptions' in $$props) $$invalidate(7, toastOptions = $$props.toastOptions);
    		if ('gutter' in $$props) $$invalidate(8, gutter = $$props.gutter);
    		if ('containerStyle' in $$props) $$invalidate(0, containerStyle = $$props.containerStyle);
    		if ('containerClassName' in $$props) $$invalidate(1, containerClassName = $$props.containerClassName);
    		if ('_toasts' in $$props) $$invalidate(2, _toasts = $$props._toasts);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$toasts, position, reverseOrder, gutter*/ 864) {
    			$$invalidate(2, _toasts = $toasts.map(toast => ({
    				...toast,
    				position: toast.position || position,
    				offset: handlers.calculateOffset(toast, $toasts, {
    					reverseOrder,
    					gutter,
    					defaultPosition: position
    				})
    			})));
    		}
    	};

    	return [
    		containerStyle,
    		containerClassName,
    		_toasts,
    		toasts,
    		handlers,
    		reverseOrder,
    		position,
    		toastOptions,
    		gutter,
    		$toasts,
    		func
    	];
    }

    class Toaster extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			reverseOrder: 5,
    			position: 6,
    			toastOptions: 7,
    			gutter: 8,
    			containerStyle: 0,
    			containerClassName: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Toaster",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get reverseOrder() {
    		throw new Error("<Toaster>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set reverseOrder(value) {
    		throw new Error("<Toaster>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error("<Toaster>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<Toaster>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toastOptions() {
    		throw new Error("<Toaster>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toastOptions(value) {
    		throw new Error("<Toaster>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gutter() {
    		throw new Error("<Toaster>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gutter(value) {
    		throw new Error("<Toaster>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get containerStyle() {
    		throw new Error("<Toaster>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set containerStyle(value) {
    		throw new Error("<Toaster>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get containerClassName() {
    		throw new Error("<Toaster>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set containerClassName(value) {
    		throw new Error("<Toaster>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const Configuration = ( ()=>{
        const local = {
            API:"https://goeat.azurewebsites.net/api",
        };
        const dev = {
            API:"http://localhost:8086/api",
        };

        const prod = {
            API: "https://goeat.azurewebsites.net/api",
        };

        const configMap = new Map();
        configMap.set("local",local);
        configMap.set("prod",prod);
        configMap.set("dev",dev);

        const getEnv= ()=>{
            const host = window.location.toString();
            const env = /simba/.test(host)?"dev" : /localhost:8080/.test(host)?"local": "prod";
            return env;
        };
        const getConfiguration = ()=>{
            const env = getEnv();
            const config = configMap.get(env);
            return config;
        };

        return {getConfiguration,getEnv}
    }) ();

    const conf = Configuration.getConfiguration();

    let headers = { "Content-Type":"application/json;charset=utf-8"};
    const ServerConnection = ( ()=>{

         const serialize=(obj)=>{
            var str = [];
            for (var p in obj)
              if (obj.hasOwnProperty(p)) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
              }
            return str.join("&");
        };

        const httpPostPromise=(url, payload)=>{
            headers.Authorization='Bearer '+sessionStorage.getItem("token");
            return new Promise((result,reject)=>{
                fetch(url,{method:'POST',headers,body:JSON.stringify(payload)})
                .then(r=>r.json())
                .then(r=> result(r))
                .catch(e=> reject(e));
            })
        };
        const httpGetPromise=(url, payload)=>{
            headers.Authorization='Bearer '+sessionStorage.getItem("token");

            return new Promise((result,reject)=>{
                let params=serialize(payload);
                fetch(`${url}?${params}`,{method:'GET',headers})
                .then(r=>r.json())
                .then(r=> result(r))
                .catch(e=> reject(e));
            })
        };
        const getproductos = (params)=>{
           return httpGetPromise(`${conf.API}/businessobject/list`, params);
        };

        const saveUser=(payload)=>{
            return httpPostPromise(`${conf.API}/user/oauth2/save`, payload);
        };

        const singIn=(payload)=>{
            return httpPostPromise(`${conf.API}/user/login`, payload);
        };

        return {getproductos,saveUser,singIn}
    } ) ();

    var qrcodeExports = {};
    var qrcode = {
      get exports(){ return qrcodeExports; },
      set exports(v){ qrcodeExports = v; },
    };

    (function (module, exports) {
    	//---------------------------------------------------------------------
    	//
    	// QR Code Generator for JavaScript
    	//
    	// Copyright (c) 2009 Kazuhiko Arase
    	//
    	// URL: http://www.d-project.com/
    	//
    	// Licensed under the MIT license:
    	//  http://www.opensource.org/licenses/mit-license.php
    	//
    	// The word 'QR Code' is registered trademark of
    	// DENSO WAVE INCORPORATED
    	//  http://www.denso-wave.com/qrcode/faqpatent-e.html
    	//
    	//---------------------------------------------------------------------

    	var qrcode = function() {

    	  //---------------------------------------------------------------------
    	  // qrcode
    	  //---------------------------------------------------------------------

    	  /**
    	   * qrcode
    	   * @param typeNumber 1 to 40
    	   * @param errorCorrectionLevel 'L','M','Q','H'
    	   */
    	  var qrcode = function(typeNumber, errorCorrectionLevel) {

    	    var PAD0 = 0xEC;
    	    var PAD1 = 0x11;

    	    var _typeNumber = typeNumber;
    	    var _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel];
    	    var _modules = null;
    	    var _moduleCount = 0;
    	    var _dataCache = null;
    	    var _dataList = [];

    	    var _this = {};

    	    var makeImpl = function(test, maskPattern) {

    	      _moduleCount = _typeNumber * 4 + 17;
    	      _modules = function(moduleCount) {
    	        var modules = new Array(moduleCount);
    	        for (var row = 0; row < moduleCount; row += 1) {
    	          modules[row] = new Array(moduleCount);
    	          for (var col = 0; col < moduleCount; col += 1) {
    	            modules[row][col] = null;
    	          }
    	        }
    	        return modules;
    	      }(_moduleCount);

    	      setupPositionProbePattern(0, 0);
    	      setupPositionProbePattern(_moduleCount - 7, 0);
    	      setupPositionProbePattern(0, _moduleCount - 7);
    	      setupPositionAdjustPattern();
    	      setupTimingPattern();
    	      setupTypeInfo(test, maskPattern);

    	      if (_typeNumber >= 7) {
    	        setupTypeNumber(test);
    	      }

    	      if (_dataCache == null) {
    	        _dataCache = createData(_typeNumber, _errorCorrectionLevel, _dataList);
    	      }

    	      mapData(_dataCache, maskPattern);
    	    };

    	    var setupPositionProbePattern = function(row, col) {

    	      for (var r = -1; r <= 7; r += 1) {

    	        if (row + r <= -1 || _moduleCount <= row + r) continue;

    	        for (var c = -1; c <= 7; c += 1) {

    	          if (col + c <= -1 || _moduleCount <= col + c) continue;

    	          if ( (0 <= r && r <= 6 && (c == 0 || c == 6) )
    	              || (0 <= c && c <= 6 && (r == 0 || r == 6) )
    	              || (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
    	            _modules[row + r][col + c] = true;
    	          } else {
    	            _modules[row + r][col + c] = false;
    	          }
    	        }
    	      }
    	    };

    	    var getBestMaskPattern = function() {

    	      var minLostPoint = 0;
    	      var pattern = 0;

    	      for (var i = 0; i < 8; i += 1) {

    	        makeImpl(true, i);

    	        var lostPoint = QRUtil.getLostPoint(_this);

    	        if (i == 0 || minLostPoint > lostPoint) {
    	          minLostPoint = lostPoint;
    	          pattern = i;
    	        }
    	      }

    	      return pattern;
    	    };

    	    var setupTimingPattern = function() {

    	      for (var r = 8; r < _moduleCount - 8; r += 1) {
    	        if (_modules[r][6] != null) {
    	          continue;
    	        }
    	        _modules[r][6] = (r % 2 == 0);
    	      }

    	      for (var c = 8; c < _moduleCount - 8; c += 1) {
    	        if (_modules[6][c] != null) {
    	          continue;
    	        }
    	        _modules[6][c] = (c % 2 == 0);
    	      }
    	    };

    	    var setupPositionAdjustPattern = function() {

    	      var pos = QRUtil.getPatternPosition(_typeNumber);

    	      for (var i = 0; i < pos.length; i += 1) {

    	        for (var j = 0; j < pos.length; j += 1) {

    	          var row = pos[i];
    	          var col = pos[j];

    	          if (_modules[row][col] != null) {
    	            continue;
    	          }

    	          for (var r = -2; r <= 2; r += 1) {

    	            for (var c = -2; c <= 2; c += 1) {

    	              if (r == -2 || r == 2 || c == -2 || c == 2
    	                  || (r == 0 && c == 0) ) {
    	                _modules[row + r][col + c] = true;
    	              } else {
    	                _modules[row + r][col + c] = false;
    	              }
    	            }
    	          }
    	        }
    	      }
    	    };

    	    var setupTypeNumber = function(test) {

    	      var bits = QRUtil.getBCHTypeNumber(_typeNumber);

    	      for (var i = 0; i < 18; i += 1) {
    	        var mod = (!test && ( (bits >> i) & 1) == 1);
    	        _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
    	      }

    	      for (var i = 0; i < 18; i += 1) {
    	        var mod = (!test && ( (bits >> i) & 1) == 1);
    	        _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
    	      }
    	    };

    	    var setupTypeInfo = function(test, maskPattern) {

    	      var data = (_errorCorrectionLevel << 3) | maskPattern;
    	      var bits = QRUtil.getBCHTypeInfo(data);

    	      // vertical
    	      for (var i = 0; i < 15; i += 1) {

    	        var mod = (!test && ( (bits >> i) & 1) == 1);

    	        if (i < 6) {
    	          _modules[i][8] = mod;
    	        } else if (i < 8) {
    	          _modules[i + 1][8] = mod;
    	        } else {
    	          _modules[_moduleCount - 15 + i][8] = mod;
    	        }
    	      }

    	      // horizontal
    	      for (var i = 0; i < 15; i += 1) {

    	        var mod = (!test && ( (bits >> i) & 1) == 1);

    	        if (i < 8) {
    	          _modules[8][_moduleCount - i - 1] = mod;
    	        } else if (i < 9) {
    	          _modules[8][15 - i - 1 + 1] = mod;
    	        } else {
    	          _modules[8][15 - i - 1] = mod;
    	        }
    	      }

    	      // fixed module
    	      _modules[_moduleCount - 8][8] = (!test);
    	    };

    	    var mapData = function(data, maskPattern) {

    	      var inc = -1;
    	      var row = _moduleCount - 1;
    	      var bitIndex = 7;
    	      var byteIndex = 0;
    	      var maskFunc = QRUtil.getMaskFunction(maskPattern);

    	      for (var col = _moduleCount - 1; col > 0; col -= 2) {

    	        if (col == 6) col -= 1;

    	        while (true) {

    	          for (var c = 0; c < 2; c += 1) {

    	            if (_modules[row][col - c] == null) {

    	              var dark = false;

    	              if (byteIndex < data.length) {
    	                dark = ( ( (data[byteIndex] >>> bitIndex) & 1) == 1);
    	              }

    	              var mask = maskFunc(row, col - c);

    	              if (mask) {
    	                dark = !dark;
    	              }

    	              _modules[row][col - c] = dark;
    	              bitIndex -= 1;

    	              if (bitIndex == -1) {
    	                byteIndex += 1;
    	                bitIndex = 7;
    	              }
    	            }
    	          }

    	          row += inc;

    	          if (row < 0 || _moduleCount <= row) {
    	            row -= inc;
    	            inc = -inc;
    	            break;
    	          }
    	        }
    	      }
    	    };

    	    var createBytes = function(buffer, rsBlocks) {

    	      var offset = 0;

    	      var maxDcCount = 0;
    	      var maxEcCount = 0;

    	      var dcdata = new Array(rsBlocks.length);
    	      var ecdata = new Array(rsBlocks.length);

    	      for (var r = 0; r < rsBlocks.length; r += 1) {

    	        var dcCount = rsBlocks[r].dataCount;
    	        var ecCount = rsBlocks[r].totalCount - dcCount;

    	        maxDcCount = Math.max(maxDcCount, dcCount);
    	        maxEcCount = Math.max(maxEcCount, ecCount);

    	        dcdata[r] = new Array(dcCount);

    	        for (var i = 0; i < dcdata[r].length; i += 1) {
    	          dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
    	        }
    	        offset += dcCount;

    	        var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
    	        var rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);

    	        var modPoly = rawPoly.mod(rsPoly);
    	        ecdata[r] = new Array(rsPoly.getLength() - 1);
    	        for (var i = 0; i < ecdata[r].length; i += 1) {
    	          var modIndex = i + modPoly.getLength() - ecdata[r].length;
    	          ecdata[r][i] = (modIndex >= 0)? modPoly.getAt(modIndex) : 0;
    	        }
    	      }

    	      var totalCodeCount = 0;
    	      for (var i = 0; i < rsBlocks.length; i += 1) {
    	        totalCodeCount += rsBlocks[i].totalCount;
    	      }

    	      var data = new Array(totalCodeCount);
    	      var index = 0;

    	      for (var i = 0; i < maxDcCount; i += 1) {
    	        for (var r = 0; r < rsBlocks.length; r += 1) {
    	          if (i < dcdata[r].length) {
    	            data[index] = dcdata[r][i];
    	            index += 1;
    	          }
    	        }
    	      }

    	      for (var i = 0; i < maxEcCount; i += 1) {
    	        for (var r = 0; r < rsBlocks.length; r += 1) {
    	          if (i < ecdata[r].length) {
    	            data[index] = ecdata[r][i];
    	            index += 1;
    	          }
    	        }
    	      }

    	      return data;
    	    };

    	    var createData = function(typeNumber, errorCorrectionLevel, dataList) {

    	      var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel);

    	      var buffer = qrBitBuffer();

    	      for (var i = 0; i < dataList.length; i += 1) {
    	        var data = dataList[i];
    	        buffer.put(data.getMode(), 4);
    	        buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
    	        data.write(buffer);
    	      }

    	      // calc num max data.
    	      var totalDataCount = 0;
    	      for (var i = 0; i < rsBlocks.length; i += 1) {
    	        totalDataCount += rsBlocks[i].dataCount;
    	      }

    	      if (buffer.getLengthInBits() > totalDataCount * 8) {
    	        throw 'code length overflow. ('
    	          + buffer.getLengthInBits()
    	          + '>'
    	          + totalDataCount * 8
    	          + ')';
    	      }

    	      // end code
    	      if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
    	        buffer.put(0, 4);
    	      }

    	      // padding
    	      while (buffer.getLengthInBits() % 8 != 0) {
    	        buffer.putBit(false);
    	      }

    	      // padding
    	      while (true) {

    	        if (buffer.getLengthInBits() >= totalDataCount * 8) {
    	          break;
    	        }
    	        buffer.put(PAD0, 8);

    	        if (buffer.getLengthInBits() >= totalDataCount * 8) {
    	          break;
    	        }
    	        buffer.put(PAD1, 8);
    	      }

    	      return createBytes(buffer, rsBlocks);
    	    };

    	    _this.addData = function(data, mode) {

    	      mode = mode || 'Byte';

    	      var newData = null;

    	      switch(mode) {
    	      case 'Numeric' :
    	        newData = qrNumber(data);
    	        break;
    	      case 'Alphanumeric' :
    	        newData = qrAlphaNum(data);
    	        break;
    	      case 'Byte' :
    	        newData = qr8BitByte(data);
    	        break;
    	      case 'Kanji' :
    	        newData = qrKanji(data);
    	        break;
    	      default :
    	        throw 'mode:' + mode;
    	      }

    	      _dataList.push(newData);
    	      _dataCache = null;
    	    };

    	    _this.isDark = function(row, col) {
    	      if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
    	        throw row + ',' + col;
    	      }
    	      return _modules[row][col];
    	    };

    	    _this.getModuleCount = function() {
    	      return _moduleCount;
    	    };

    	    _this.make = function() {
    	      if (_typeNumber < 1) {
    	        var typeNumber = 1;

    	        for (; typeNumber < 40; typeNumber++) {
    	          var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, _errorCorrectionLevel);
    	          var buffer = qrBitBuffer();

    	          for (var i = 0; i < _dataList.length; i++) {
    	            var data = _dataList[i];
    	            buffer.put(data.getMode(), 4);
    	            buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
    	            data.write(buffer);
    	          }

    	          var totalDataCount = 0;
    	          for (var i = 0; i < rsBlocks.length; i++) {
    	            totalDataCount += rsBlocks[i].dataCount;
    	          }

    	          if (buffer.getLengthInBits() <= totalDataCount * 8) {
    	            break;
    	          }
    	        }

    	        _typeNumber = typeNumber;
    	      }

    	      makeImpl(false, getBestMaskPattern() );
    	    };

    	    _this.createTableTag = function(cellSize, margin) {

    	      cellSize = cellSize || 2;
    	      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

    	      var qrHtml = '';

    	      qrHtml += '<table style="';
    	      qrHtml += ' border-width: 0px; border-style: none;';
    	      qrHtml += ' border-collapse: collapse;';
    	      qrHtml += ' padding: 0px; margin: ' + margin + 'px;';
    	      qrHtml += '">';
    	      qrHtml += '<tbody>';

    	      for (var r = 0; r < _this.getModuleCount(); r += 1) {

    	        qrHtml += '<tr>';

    	        for (var c = 0; c < _this.getModuleCount(); c += 1) {
    	          qrHtml += '<td style="';
    	          qrHtml += ' border-width: 0px; border-style: none;';
    	          qrHtml += ' border-collapse: collapse;';
    	          qrHtml += ' padding: 0px; margin: 0px;';
    	          qrHtml += ' width: ' + cellSize + 'px;';
    	          qrHtml += ' height: ' + cellSize + 'px;';
    	          qrHtml += ' background-color: ';
    	          qrHtml += _this.isDark(r, c)? '#000000' : '#ffffff';
    	          qrHtml += ';';
    	          qrHtml += '"/>';
    	        }

    	        qrHtml += '</tr>';
    	      }

    	      qrHtml += '</tbody>';
    	      qrHtml += '</table>';

    	      return qrHtml;
    	    };

    	    _this.createSvgTag = function(cellSize, margin, alt, title) {

    	      var opts = {};
    	      if (typeof arguments[0] == 'object') {
    	        // Called by options.
    	        opts = arguments[0];
    	        // overwrite cellSize and margin.
    	        cellSize = opts.cellSize;
    	        margin = opts.margin;
    	        alt = opts.alt;
    	        title = opts.title;
    	      }

    	      cellSize = cellSize || 2;
    	      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

    	      // Compose alt property surrogate
    	      alt = (typeof alt === 'string') ? {text: alt} : alt || {};
    	      alt.text = alt.text || null;
    	      alt.id = (alt.text) ? alt.id || 'qrcode-description' : null;

    	      // Compose title property surrogate
    	      title = (typeof title === 'string') ? {text: title} : title || {};
    	      title.text = title.text || null;
    	      title.id = (title.text) ? title.id || 'qrcode-title' : null;

    	      var size = _this.getModuleCount() * cellSize + margin * 2;
    	      var c, mc, r, mr, qrSvg='', rect;

    	      rect = 'l' + cellSize + ',0 0,' + cellSize +
    	        ' -' + cellSize + ',0 0,-' + cellSize + 'z ';

    	      qrSvg += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"';
    	      qrSvg += !opts.scalable ? ' width="' + size + 'px" height="' + size + 'px"' : '';
    	      qrSvg += ' viewBox="0 0 ' + size + ' ' + size + '" ';
    	      qrSvg += ' preserveAspectRatio="xMinYMin meet"';
    	      qrSvg += (title.text || alt.text) ? ' role="img" aria-labelledby="' +
    	          escapeXml([title.id, alt.id].join(' ').trim() ) + '"' : '';
    	      qrSvg += '>';
    	      qrSvg += (title.text) ? '<title id="' + escapeXml(title.id) + '">' +
    	          escapeXml(title.text) + '</title>' : '';
    	      qrSvg += (alt.text) ? '<description id="' + escapeXml(alt.id) + '">' +
    	          escapeXml(alt.text) + '</description>' : '';
    	      qrSvg += '<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>';
    	      qrSvg += '<path d="';

    	      for (r = 0; r < _this.getModuleCount(); r += 1) {
    	        mr = r * cellSize + margin;
    	        for (c = 0; c < _this.getModuleCount(); c += 1) {
    	          if (_this.isDark(r, c) ) {
    	            mc = c*cellSize+margin;
    	            qrSvg += 'M' + mc + ',' + mr + rect;
    	          }
    	        }
    	      }

    	      qrSvg += '" stroke="transparent" fill="black"/>';
    	      qrSvg += '</svg>';

    	      return qrSvg;
    	    };

    	    _this.createDataURL = function(cellSize, margin) {

    	      cellSize = cellSize || 2;
    	      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

    	      var size = _this.getModuleCount() * cellSize + margin * 2;
    	      var min = margin;
    	      var max = size - margin;

    	      return createDataURL(size, size, function(x, y) {
    	        if (min <= x && x < max && min <= y && y < max) {
    	          var c = Math.floor( (x - min) / cellSize);
    	          var r = Math.floor( (y - min) / cellSize);
    	          return _this.isDark(r, c)? 0 : 1;
    	        } else {
    	          return 1;
    	        }
    	      } );
    	    };

    	    _this.createImgTag = function(cellSize, margin, alt) {

    	      cellSize = cellSize || 2;
    	      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

    	      var size = _this.getModuleCount() * cellSize + margin * 2;

    	      var img = '';
    	      img += '<img';
    	      img += '\u0020src="';
    	      img += _this.createDataURL(cellSize, margin);
    	      img += '"';
    	      img += '\u0020width="';
    	      img += size;
    	      img += '"';
    	      img += '\u0020height="';
    	      img += size;
    	      img += '"';
    	      if (alt) {
    	        img += '\u0020alt="';
    	        img += escapeXml(alt);
    	        img += '"';
    	      }
    	      img += '/>';

    	      return img;
    	    };

    	    var escapeXml = function(s) {
    	      var escaped = '';
    	      for (var i = 0; i < s.length; i += 1) {
    	        var c = s.charAt(i);
    	        switch(c) {
    	        case '<': escaped += '&lt;'; break;
    	        case '>': escaped += '&gt;'; break;
    	        case '&': escaped += '&amp;'; break;
    	        case '"': escaped += '&quot;'; break;
    	        default : escaped += c; break;
    	        }
    	      }
    	      return escaped;
    	    };

    	    var _createHalfASCII = function(margin) {
    	      var cellSize = 1;
    	      margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

    	      var size = _this.getModuleCount() * cellSize + margin * 2;
    	      var min = margin;
    	      var max = size - margin;

    	      var y, x, r1, r2, p;

    	      var blocks = {
    	        '██': '█',
    	        '█ ': '▀',
    	        ' █': '▄',
    	        '  ': ' '
    	      };

    	      var blocksLastLineNoMargin = {
    	        '██': '▀',
    	        '█ ': '▀',
    	        ' █': ' ',
    	        '  ': ' '
    	      };

    	      var ascii = '';
    	      for (y = 0; y < size; y += 2) {
    	        r1 = Math.floor((y - min) / cellSize);
    	        r2 = Math.floor((y + 1 - min) / cellSize);
    	        for (x = 0; x < size; x += 1) {
    	          p = '█';

    	          if (min <= x && x < max && min <= y && y < max && _this.isDark(r1, Math.floor((x - min) / cellSize))) {
    	            p = ' ';
    	          }

    	          if (min <= x && x < max && min <= y+1 && y+1 < max && _this.isDark(r2, Math.floor((x - min) / cellSize))) {
    	            p += ' ';
    	          }
    	          else {
    	            p += '█';
    	          }

    	          // Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
    	          ascii += (margin < 1 && y+1 >= max) ? blocksLastLineNoMargin[p] : blocks[p];
    	        }

    	        ascii += '\n';
    	      }

    	      if (size % 2 && margin > 0) {
    	        return ascii.substring(0, ascii.length - size - 1) + Array(size+1).join('▀');
    	      }

    	      return ascii.substring(0, ascii.length-1);
    	    };

    	    _this.createASCII = function(cellSize, margin) {
    	      cellSize = cellSize || 1;

    	      if (cellSize < 2) {
    	        return _createHalfASCII(margin);
    	      }

    	      cellSize -= 1;
    	      margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

    	      var size = _this.getModuleCount() * cellSize + margin * 2;
    	      var min = margin;
    	      var max = size - margin;

    	      var y, x, r, p;

    	      var white = Array(cellSize+1).join('██');
    	      var black = Array(cellSize+1).join('  ');

    	      var ascii = '';
    	      var line = '';
    	      for (y = 0; y < size; y += 1) {
    	        r = Math.floor( (y - min) / cellSize);
    	        line = '';
    	        for (x = 0; x < size; x += 1) {
    	          p = 1;

    	          if (min <= x && x < max && min <= y && y < max && _this.isDark(r, Math.floor((x - min) / cellSize))) {
    	            p = 0;
    	          }

    	          // Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
    	          line += p ? white : black;
    	        }

    	        for (r = 0; r < cellSize; r += 1) {
    	          ascii += line + '\n';
    	        }
    	      }

    	      return ascii.substring(0, ascii.length-1);
    	    };

    	    _this.renderTo2dContext = function(context, cellSize) {
    	      cellSize = cellSize || 2;
    	      var length = _this.getModuleCount();
    	      for (var row = 0; row < length; row++) {
    	        for (var col = 0; col < length; col++) {
    	          context.fillStyle = _this.isDark(row, col) ? 'black' : 'white';
    	          context.fillRect(row * cellSize, col * cellSize, cellSize, cellSize);
    	        }
    	      }
    	    };

    	    return _this;
    	  };

    	  //---------------------------------------------------------------------
    	  // qrcode.stringToBytes
    	  //---------------------------------------------------------------------

    	  qrcode.stringToBytesFuncs = {
    	    'default' : function(s) {
    	      var bytes = [];
    	      for (var i = 0; i < s.length; i += 1) {
    	        var c = s.charCodeAt(i);
    	        bytes.push(c & 0xff);
    	      }
    	      return bytes;
    	    }
    	  };

    	  qrcode.stringToBytes = qrcode.stringToBytesFuncs['default'];

    	  //---------------------------------------------------------------------
    	  // qrcode.createStringToBytes
    	  //---------------------------------------------------------------------

    	  /**
    	   * @param unicodeData base64 string of byte array.
    	   * [16bit Unicode],[16bit Bytes], ...
    	   * @param numChars
    	   */
    	  qrcode.createStringToBytes = function(unicodeData, numChars) {

    	    // create conversion map.

    	    var unicodeMap = function() {

    	      var bin = base64DecodeInputStream(unicodeData);
    	      var read = function() {
    	        var b = bin.read();
    	        if (b == -1) throw 'eof';
    	        return b;
    	      };

    	      var count = 0;
    	      var unicodeMap = {};
    	      while (true) {
    	        var b0 = bin.read();
    	        if (b0 == -1) break;
    	        var b1 = read();
    	        var b2 = read();
    	        var b3 = read();
    	        var k = String.fromCharCode( (b0 << 8) | b1);
    	        var v = (b2 << 8) | b3;
    	        unicodeMap[k] = v;
    	        count += 1;
    	      }
    	      if (count != numChars) {
    	        throw count + ' != ' + numChars;
    	      }

    	      return unicodeMap;
    	    }();

    	    var unknownChar = '?'.charCodeAt(0);

    	    return function(s) {
    	      var bytes = [];
    	      for (var i = 0; i < s.length; i += 1) {
    	        var c = s.charCodeAt(i);
    	        if (c < 128) {
    	          bytes.push(c);
    	        } else {
    	          var b = unicodeMap[s.charAt(i)];
    	          if (typeof b == 'number') {
    	            if ( (b & 0xff) == b) {
    	              // 1byte
    	              bytes.push(b);
    	            } else {
    	              // 2bytes
    	              bytes.push(b >>> 8);
    	              bytes.push(b & 0xff);
    	            }
    	          } else {
    	            bytes.push(unknownChar);
    	          }
    	        }
    	      }
    	      return bytes;
    	    };
    	  };

    	  //---------------------------------------------------------------------
    	  // QRMode
    	  //---------------------------------------------------------------------

    	  var QRMode = {
    	    MODE_NUMBER :    1 << 0,
    	    MODE_ALPHA_NUM : 1 << 1,
    	    MODE_8BIT_BYTE : 1 << 2,
    	    MODE_KANJI :     1 << 3
    	  };

    	  //---------------------------------------------------------------------
    	  // QRErrorCorrectionLevel
    	  //---------------------------------------------------------------------

    	  var QRErrorCorrectionLevel = {
    	    L : 1,
    	    M : 0,
    	    Q : 3,
    	    H : 2
    	  };

    	  //---------------------------------------------------------------------
    	  // QRMaskPattern
    	  //---------------------------------------------------------------------

    	  var QRMaskPattern = {
    	    PATTERN000 : 0,
    	    PATTERN001 : 1,
    	    PATTERN010 : 2,
    	    PATTERN011 : 3,
    	    PATTERN100 : 4,
    	    PATTERN101 : 5,
    	    PATTERN110 : 6,
    	    PATTERN111 : 7
    	  };

    	  //---------------------------------------------------------------------
    	  // QRUtil
    	  //---------------------------------------------------------------------

    	  var QRUtil = function() {

    	    var PATTERN_POSITION_TABLE = [
    	      [],
    	      [6, 18],
    	      [6, 22],
    	      [6, 26],
    	      [6, 30],
    	      [6, 34],
    	      [6, 22, 38],
    	      [6, 24, 42],
    	      [6, 26, 46],
    	      [6, 28, 50],
    	      [6, 30, 54],
    	      [6, 32, 58],
    	      [6, 34, 62],
    	      [6, 26, 46, 66],
    	      [6, 26, 48, 70],
    	      [6, 26, 50, 74],
    	      [6, 30, 54, 78],
    	      [6, 30, 56, 82],
    	      [6, 30, 58, 86],
    	      [6, 34, 62, 90],
    	      [6, 28, 50, 72, 94],
    	      [6, 26, 50, 74, 98],
    	      [6, 30, 54, 78, 102],
    	      [6, 28, 54, 80, 106],
    	      [6, 32, 58, 84, 110],
    	      [6, 30, 58, 86, 114],
    	      [6, 34, 62, 90, 118],
    	      [6, 26, 50, 74, 98, 122],
    	      [6, 30, 54, 78, 102, 126],
    	      [6, 26, 52, 78, 104, 130],
    	      [6, 30, 56, 82, 108, 134],
    	      [6, 34, 60, 86, 112, 138],
    	      [6, 30, 58, 86, 114, 142],
    	      [6, 34, 62, 90, 118, 146],
    	      [6, 30, 54, 78, 102, 126, 150],
    	      [6, 24, 50, 76, 102, 128, 154],
    	      [6, 28, 54, 80, 106, 132, 158],
    	      [6, 32, 58, 84, 110, 136, 162],
    	      [6, 26, 54, 82, 110, 138, 166],
    	      [6, 30, 58, 86, 114, 142, 170]
    	    ];
    	    var G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
    	    var G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
    	    var G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

    	    var _this = {};

    	    var getBCHDigit = function(data) {
    	      var digit = 0;
    	      while (data != 0) {
    	        digit += 1;
    	        data >>>= 1;
    	      }
    	      return digit;
    	    };

    	    _this.getBCHTypeInfo = function(data) {
    	      var d = data << 10;
    	      while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
    	        d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15) ) );
    	      }
    	      return ( (data << 10) | d) ^ G15_MASK;
    	    };

    	    _this.getBCHTypeNumber = function(data) {
    	      var d = data << 12;
    	      while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
    	        d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18) ) );
    	      }
    	      return (data << 12) | d;
    	    };

    	    _this.getPatternPosition = function(typeNumber) {
    	      return PATTERN_POSITION_TABLE[typeNumber - 1];
    	    };

    	    _this.getMaskFunction = function(maskPattern) {

    	      switch (maskPattern) {

    	      case QRMaskPattern.PATTERN000 :
    	        return function(i, j) { return (i + j) % 2 == 0; };
    	      case QRMaskPattern.PATTERN001 :
    	        return function(i, j) { return i % 2 == 0; };
    	      case QRMaskPattern.PATTERN010 :
    	        return function(i, j) { return j % 3 == 0; };
    	      case QRMaskPattern.PATTERN011 :
    	        return function(i, j) { return (i + j) % 3 == 0; };
    	      case QRMaskPattern.PATTERN100 :
    	        return function(i, j) { return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 == 0; };
    	      case QRMaskPattern.PATTERN101 :
    	        return function(i, j) { return (i * j) % 2 + (i * j) % 3 == 0; };
    	      case QRMaskPattern.PATTERN110 :
    	        return function(i, j) { return ( (i * j) % 2 + (i * j) % 3) % 2 == 0; };
    	      case QRMaskPattern.PATTERN111 :
    	        return function(i, j) { return ( (i * j) % 3 + (i + j) % 2) % 2 == 0; };

    	      default :
    	        throw 'bad maskPattern:' + maskPattern;
    	      }
    	    };

    	    _this.getErrorCorrectPolynomial = function(errorCorrectLength) {
    	      var a = qrPolynomial([1], 0);
    	      for (var i = 0; i < errorCorrectLength; i += 1) {
    	        a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0) );
    	      }
    	      return a;
    	    };

    	    _this.getLengthInBits = function(mode, type) {

    	      if (1 <= type && type < 10) {

    	        // 1 - 9

    	        switch(mode) {
    	        case QRMode.MODE_NUMBER    : return 10;
    	        case QRMode.MODE_ALPHA_NUM : return 9;
    	        case QRMode.MODE_8BIT_BYTE : return 8;
    	        case QRMode.MODE_KANJI     : return 8;
    	        default :
    	          throw 'mode:' + mode;
    	        }

    	      } else if (type < 27) {

    	        // 10 - 26

    	        switch(mode) {
    	        case QRMode.MODE_NUMBER    : return 12;
    	        case QRMode.MODE_ALPHA_NUM : return 11;
    	        case QRMode.MODE_8BIT_BYTE : return 16;
    	        case QRMode.MODE_KANJI     : return 10;
    	        default :
    	          throw 'mode:' + mode;
    	        }

    	      } else if (type < 41) {

    	        // 27 - 40

    	        switch(mode) {
    	        case QRMode.MODE_NUMBER    : return 14;
    	        case QRMode.MODE_ALPHA_NUM : return 13;
    	        case QRMode.MODE_8BIT_BYTE : return 16;
    	        case QRMode.MODE_KANJI     : return 12;
    	        default :
    	          throw 'mode:' + mode;
    	        }

    	      } else {
    	        throw 'type:' + type;
    	      }
    	    };

    	    _this.getLostPoint = function(qrcode) {

    	      var moduleCount = qrcode.getModuleCount();

    	      var lostPoint = 0;

    	      // LEVEL1

    	      for (var row = 0; row < moduleCount; row += 1) {
    	        for (var col = 0; col < moduleCount; col += 1) {

    	          var sameCount = 0;
    	          var dark = qrcode.isDark(row, col);

    	          for (var r = -1; r <= 1; r += 1) {

    	            if (row + r < 0 || moduleCount <= row + r) {
    	              continue;
    	            }

    	            for (var c = -1; c <= 1; c += 1) {

    	              if (col + c < 0 || moduleCount <= col + c) {
    	                continue;
    	              }

    	              if (r == 0 && c == 0) {
    	                continue;
    	              }

    	              if (dark == qrcode.isDark(row + r, col + c) ) {
    	                sameCount += 1;
    	              }
    	            }
    	          }

    	          if (sameCount > 5) {
    	            lostPoint += (3 + sameCount - 5);
    	          }
    	        }
    	      }
    	      // LEVEL2

    	      for (var row = 0; row < moduleCount - 1; row += 1) {
    	        for (var col = 0; col < moduleCount - 1; col += 1) {
    	          var count = 0;
    	          if (qrcode.isDark(row, col) ) count += 1;
    	          if (qrcode.isDark(row + 1, col) ) count += 1;
    	          if (qrcode.isDark(row, col + 1) ) count += 1;
    	          if (qrcode.isDark(row + 1, col + 1) ) count += 1;
    	          if (count == 0 || count == 4) {
    	            lostPoint += 3;
    	          }
    	        }
    	      }

    	      // LEVEL3

    	      for (var row = 0; row < moduleCount; row += 1) {
    	        for (var col = 0; col < moduleCount - 6; col += 1) {
    	          if (qrcode.isDark(row, col)
    	              && !qrcode.isDark(row, col + 1)
    	              &&  qrcode.isDark(row, col + 2)
    	              &&  qrcode.isDark(row, col + 3)
    	              &&  qrcode.isDark(row, col + 4)
    	              && !qrcode.isDark(row, col + 5)
    	              &&  qrcode.isDark(row, col + 6) ) {
    	            lostPoint += 40;
    	          }
    	        }
    	      }

    	      for (var col = 0; col < moduleCount; col += 1) {
    	        for (var row = 0; row < moduleCount - 6; row += 1) {
    	          if (qrcode.isDark(row, col)
    	              && !qrcode.isDark(row + 1, col)
    	              &&  qrcode.isDark(row + 2, col)
    	              &&  qrcode.isDark(row + 3, col)
    	              &&  qrcode.isDark(row + 4, col)
    	              && !qrcode.isDark(row + 5, col)
    	              &&  qrcode.isDark(row + 6, col) ) {
    	            lostPoint += 40;
    	          }
    	        }
    	      }

    	      // LEVEL4

    	      var darkCount = 0;

    	      for (var col = 0; col < moduleCount; col += 1) {
    	        for (var row = 0; row < moduleCount; row += 1) {
    	          if (qrcode.isDark(row, col) ) {
    	            darkCount += 1;
    	          }
    	        }
    	      }

    	      var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
    	      lostPoint += ratio * 10;

    	      return lostPoint;
    	    };

    	    return _this;
    	  }();

    	  //---------------------------------------------------------------------
    	  // QRMath
    	  //---------------------------------------------------------------------

    	  var QRMath = function() {

    	    var EXP_TABLE = new Array(256);
    	    var LOG_TABLE = new Array(256);

    	    // initialize tables
    	    for (var i = 0; i < 8; i += 1) {
    	      EXP_TABLE[i] = 1 << i;
    	    }
    	    for (var i = 8; i < 256; i += 1) {
    	      EXP_TABLE[i] = EXP_TABLE[i - 4]
    	        ^ EXP_TABLE[i - 5]
    	        ^ EXP_TABLE[i - 6]
    	        ^ EXP_TABLE[i - 8];
    	    }
    	    for (var i = 0; i < 255; i += 1) {
    	      LOG_TABLE[EXP_TABLE[i] ] = i;
    	    }

    	    var _this = {};

    	    _this.glog = function(n) {

    	      if (n < 1) {
    	        throw 'glog(' + n + ')';
    	      }

    	      return LOG_TABLE[n];
    	    };

    	    _this.gexp = function(n) {

    	      while (n < 0) {
    	        n += 255;
    	      }

    	      while (n >= 256) {
    	        n -= 255;
    	      }

    	      return EXP_TABLE[n];
    	    };

    	    return _this;
    	  }();

    	  //---------------------------------------------------------------------
    	  // qrPolynomial
    	  //---------------------------------------------------------------------

    	  function qrPolynomial(num, shift) {

    	    if (typeof num.length == 'undefined') {
    	      throw num.length + '/' + shift;
    	    }

    	    var _num = function() {
    	      var offset = 0;
    	      while (offset < num.length && num[offset] == 0) {
    	        offset += 1;
    	      }
    	      var _num = new Array(num.length - offset + shift);
    	      for (var i = 0; i < num.length - offset; i += 1) {
    	        _num[i] = num[i + offset];
    	      }
    	      return _num;
    	    }();

    	    var _this = {};

    	    _this.getAt = function(index) {
    	      return _num[index];
    	    };

    	    _this.getLength = function() {
    	      return _num.length;
    	    };

    	    _this.multiply = function(e) {

    	      var num = new Array(_this.getLength() + e.getLength() - 1);

    	      for (var i = 0; i < _this.getLength(); i += 1) {
    	        for (var j = 0; j < e.getLength(); j += 1) {
    	          num[i + j] ^= QRMath.gexp(QRMath.glog(_this.getAt(i) ) + QRMath.glog(e.getAt(j) ) );
    	        }
    	      }

    	      return qrPolynomial(num, 0);
    	    };

    	    _this.mod = function(e) {

    	      if (_this.getLength() - e.getLength() < 0) {
    	        return _this;
    	      }

    	      var ratio = QRMath.glog(_this.getAt(0) ) - QRMath.glog(e.getAt(0) );

    	      var num = new Array(_this.getLength() );
    	      for (var i = 0; i < _this.getLength(); i += 1) {
    	        num[i] = _this.getAt(i);
    	      }

    	      for (var i = 0; i < e.getLength(); i += 1) {
    	        num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i) ) + ratio);
    	      }

    	      // recursive call
    	      return qrPolynomial(num, 0).mod(e);
    	    };

    	    return _this;
    	  }
    	  //---------------------------------------------------------------------
    	  // QRRSBlock
    	  //---------------------------------------------------------------------

    	  var QRRSBlock = function() {

    	    var RS_BLOCK_TABLE = [

    	      // L
    	      // M
    	      // Q
    	      // H

    	      // 1
    	      [1, 26, 19],
    	      [1, 26, 16],
    	      [1, 26, 13],
    	      [1, 26, 9],

    	      // 2
    	      [1, 44, 34],
    	      [1, 44, 28],
    	      [1, 44, 22],
    	      [1, 44, 16],

    	      // 3
    	      [1, 70, 55],
    	      [1, 70, 44],
    	      [2, 35, 17],
    	      [2, 35, 13],

    	      // 4
    	      [1, 100, 80],
    	      [2, 50, 32],
    	      [2, 50, 24],
    	      [4, 25, 9],

    	      // 5
    	      [1, 134, 108],
    	      [2, 67, 43],
    	      [2, 33, 15, 2, 34, 16],
    	      [2, 33, 11, 2, 34, 12],

    	      // 6
    	      [2, 86, 68],
    	      [4, 43, 27],
    	      [4, 43, 19],
    	      [4, 43, 15],

    	      // 7
    	      [2, 98, 78],
    	      [4, 49, 31],
    	      [2, 32, 14, 4, 33, 15],
    	      [4, 39, 13, 1, 40, 14],

    	      // 8
    	      [2, 121, 97],
    	      [2, 60, 38, 2, 61, 39],
    	      [4, 40, 18, 2, 41, 19],
    	      [4, 40, 14, 2, 41, 15],

    	      // 9
    	      [2, 146, 116],
    	      [3, 58, 36, 2, 59, 37],
    	      [4, 36, 16, 4, 37, 17],
    	      [4, 36, 12, 4, 37, 13],

    	      // 10
    	      [2, 86, 68, 2, 87, 69],
    	      [4, 69, 43, 1, 70, 44],
    	      [6, 43, 19, 2, 44, 20],
    	      [6, 43, 15, 2, 44, 16],

    	      // 11
    	      [4, 101, 81],
    	      [1, 80, 50, 4, 81, 51],
    	      [4, 50, 22, 4, 51, 23],
    	      [3, 36, 12, 8, 37, 13],

    	      // 12
    	      [2, 116, 92, 2, 117, 93],
    	      [6, 58, 36, 2, 59, 37],
    	      [4, 46, 20, 6, 47, 21],
    	      [7, 42, 14, 4, 43, 15],

    	      // 13
    	      [4, 133, 107],
    	      [8, 59, 37, 1, 60, 38],
    	      [8, 44, 20, 4, 45, 21],
    	      [12, 33, 11, 4, 34, 12],

    	      // 14
    	      [3, 145, 115, 1, 146, 116],
    	      [4, 64, 40, 5, 65, 41],
    	      [11, 36, 16, 5, 37, 17],
    	      [11, 36, 12, 5, 37, 13],

    	      // 15
    	      [5, 109, 87, 1, 110, 88],
    	      [5, 65, 41, 5, 66, 42],
    	      [5, 54, 24, 7, 55, 25],
    	      [11, 36, 12, 7, 37, 13],

    	      // 16
    	      [5, 122, 98, 1, 123, 99],
    	      [7, 73, 45, 3, 74, 46],
    	      [15, 43, 19, 2, 44, 20],
    	      [3, 45, 15, 13, 46, 16],

    	      // 17
    	      [1, 135, 107, 5, 136, 108],
    	      [10, 74, 46, 1, 75, 47],
    	      [1, 50, 22, 15, 51, 23],
    	      [2, 42, 14, 17, 43, 15],

    	      // 18
    	      [5, 150, 120, 1, 151, 121],
    	      [9, 69, 43, 4, 70, 44],
    	      [17, 50, 22, 1, 51, 23],
    	      [2, 42, 14, 19, 43, 15],

    	      // 19
    	      [3, 141, 113, 4, 142, 114],
    	      [3, 70, 44, 11, 71, 45],
    	      [17, 47, 21, 4, 48, 22],
    	      [9, 39, 13, 16, 40, 14],

    	      // 20
    	      [3, 135, 107, 5, 136, 108],
    	      [3, 67, 41, 13, 68, 42],
    	      [15, 54, 24, 5, 55, 25],
    	      [15, 43, 15, 10, 44, 16],

    	      // 21
    	      [4, 144, 116, 4, 145, 117],
    	      [17, 68, 42],
    	      [17, 50, 22, 6, 51, 23],
    	      [19, 46, 16, 6, 47, 17],

    	      // 22
    	      [2, 139, 111, 7, 140, 112],
    	      [17, 74, 46],
    	      [7, 54, 24, 16, 55, 25],
    	      [34, 37, 13],

    	      // 23
    	      [4, 151, 121, 5, 152, 122],
    	      [4, 75, 47, 14, 76, 48],
    	      [11, 54, 24, 14, 55, 25],
    	      [16, 45, 15, 14, 46, 16],

    	      // 24
    	      [6, 147, 117, 4, 148, 118],
    	      [6, 73, 45, 14, 74, 46],
    	      [11, 54, 24, 16, 55, 25],
    	      [30, 46, 16, 2, 47, 17],

    	      // 25
    	      [8, 132, 106, 4, 133, 107],
    	      [8, 75, 47, 13, 76, 48],
    	      [7, 54, 24, 22, 55, 25],
    	      [22, 45, 15, 13, 46, 16],

    	      // 26
    	      [10, 142, 114, 2, 143, 115],
    	      [19, 74, 46, 4, 75, 47],
    	      [28, 50, 22, 6, 51, 23],
    	      [33, 46, 16, 4, 47, 17],

    	      // 27
    	      [8, 152, 122, 4, 153, 123],
    	      [22, 73, 45, 3, 74, 46],
    	      [8, 53, 23, 26, 54, 24],
    	      [12, 45, 15, 28, 46, 16],

    	      // 28
    	      [3, 147, 117, 10, 148, 118],
    	      [3, 73, 45, 23, 74, 46],
    	      [4, 54, 24, 31, 55, 25],
    	      [11, 45, 15, 31, 46, 16],

    	      // 29
    	      [7, 146, 116, 7, 147, 117],
    	      [21, 73, 45, 7, 74, 46],
    	      [1, 53, 23, 37, 54, 24],
    	      [19, 45, 15, 26, 46, 16],

    	      // 30
    	      [5, 145, 115, 10, 146, 116],
    	      [19, 75, 47, 10, 76, 48],
    	      [15, 54, 24, 25, 55, 25],
    	      [23, 45, 15, 25, 46, 16],

    	      // 31
    	      [13, 145, 115, 3, 146, 116],
    	      [2, 74, 46, 29, 75, 47],
    	      [42, 54, 24, 1, 55, 25],
    	      [23, 45, 15, 28, 46, 16],

    	      // 32
    	      [17, 145, 115],
    	      [10, 74, 46, 23, 75, 47],
    	      [10, 54, 24, 35, 55, 25],
    	      [19, 45, 15, 35, 46, 16],

    	      // 33
    	      [17, 145, 115, 1, 146, 116],
    	      [14, 74, 46, 21, 75, 47],
    	      [29, 54, 24, 19, 55, 25],
    	      [11, 45, 15, 46, 46, 16],

    	      // 34
    	      [13, 145, 115, 6, 146, 116],
    	      [14, 74, 46, 23, 75, 47],
    	      [44, 54, 24, 7, 55, 25],
    	      [59, 46, 16, 1, 47, 17],

    	      // 35
    	      [12, 151, 121, 7, 152, 122],
    	      [12, 75, 47, 26, 76, 48],
    	      [39, 54, 24, 14, 55, 25],
    	      [22, 45, 15, 41, 46, 16],

    	      // 36
    	      [6, 151, 121, 14, 152, 122],
    	      [6, 75, 47, 34, 76, 48],
    	      [46, 54, 24, 10, 55, 25],
    	      [2, 45, 15, 64, 46, 16],

    	      // 37
    	      [17, 152, 122, 4, 153, 123],
    	      [29, 74, 46, 14, 75, 47],
    	      [49, 54, 24, 10, 55, 25],
    	      [24, 45, 15, 46, 46, 16],

    	      // 38
    	      [4, 152, 122, 18, 153, 123],
    	      [13, 74, 46, 32, 75, 47],
    	      [48, 54, 24, 14, 55, 25],
    	      [42, 45, 15, 32, 46, 16],

    	      // 39
    	      [20, 147, 117, 4, 148, 118],
    	      [40, 75, 47, 7, 76, 48],
    	      [43, 54, 24, 22, 55, 25],
    	      [10, 45, 15, 67, 46, 16],

    	      // 40
    	      [19, 148, 118, 6, 149, 119],
    	      [18, 75, 47, 31, 76, 48],
    	      [34, 54, 24, 34, 55, 25],
    	      [20, 45, 15, 61, 46, 16]
    	    ];

    	    var qrRSBlock = function(totalCount, dataCount) {
    	      var _this = {};
    	      _this.totalCount = totalCount;
    	      _this.dataCount = dataCount;
    	      return _this;
    	    };

    	    var _this = {};

    	    var getRsBlockTable = function(typeNumber, errorCorrectionLevel) {

    	      switch(errorCorrectionLevel) {
    	      case QRErrorCorrectionLevel.L :
    	        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
    	      case QRErrorCorrectionLevel.M :
    	        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
    	      case QRErrorCorrectionLevel.Q :
    	        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
    	      case QRErrorCorrectionLevel.H :
    	        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
    	      default :
    	        return undefined;
    	      }
    	    };

    	    _this.getRSBlocks = function(typeNumber, errorCorrectionLevel) {

    	      var rsBlock = getRsBlockTable(typeNumber, errorCorrectionLevel);

    	      if (typeof rsBlock == 'undefined') {
    	        throw 'bad rs block @ typeNumber:' + typeNumber +
    	            '/errorCorrectionLevel:' + errorCorrectionLevel;
    	      }

    	      var length = rsBlock.length / 3;

    	      var list = [];

    	      for (var i = 0; i < length; i += 1) {

    	        var count = rsBlock[i * 3 + 0];
    	        var totalCount = rsBlock[i * 3 + 1];
    	        var dataCount = rsBlock[i * 3 + 2];

    	        for (var j = 0; j < count; j += 1) {
    	          list.push(qrRSBlock(totalCount, dataCount) );
    	        }
    	      }

    	      return list;
    	    };

    	    return _this;
    	  }();

    	  //---------------------------------------------------------------------
    	  // qrBitBuffer
    	  //---------------------------------------------------------------------

    	  var qrBitBuffer = function() {

    	    var _buffer = [];
    	    var _length = 0;

    	    var _this = {};

    	    _this.getBuffer = function() {
    	      return _buffer;
    	    };

    	    _this.getAt = function(index) {
    	      var bufIndex = Math.floor(index / 8);
    	      return ( (_buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
    	    };

    	    _this.put = function(num, length) {
    	      for (var i = 0; i < length; i += 1) {
    	        _this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
    	      }
    	    };

    	    _this.getLengthInBits = function() {
    	      return _length;
    	    };

    	    _this.putBit = function(bit) {

    	      var bufIndex = Math.floor(_length / 8);
    	      if (_buffer.length <= bufIndex) {
    	        _buffer.push(0);
    	      }

    	      if (bit) {
    	        _buffer[bufIndex] |= (0x80 >>> (_length % 8) );
    	      }

    	      _length += 1;
    	    };

    	    return _this;
    	  };

    	  //---------------------------------------------------------------------
    	  // qrNumber
    	  //---------------------------------------------------------------------

    	  var qrNumber = function(data) {

    	    var _mode = QRMode.MODE_NUMBER;
    	    var _data = data;

    	    var _this = {};

    	    _this.getMode = function() {
    	      return _mode;
    	    };

    	    _this.getLength = function(buffer) {
    	      return _data.length;
    	    };

    	    _this.write = function(buffer) {

    	      var data = _data;

    	      var i = 0;

    	      while (i + 2 < data.length) {
    	        buffer.put(strToNum(data.substring(i, i + 3) ), 10);
    	        i += 3;
    	      }

    	      if (i < data.length) {
    	        if (data.length - i == 1) {
    	          buffer.put(strToNum(data.substring(i, i + 1) ), 4);
    	        } else if (data.length - i == 2) {
    	          buffer.put(strToNum(data.substring(i, i + 2) ), 7);
    	        }
    	      }
    	    };

    	    var strToNum = function(s) {
    	      var num = 0;
    	      for (var i = 0; i < s.length; i += 1) {
    	        num = num * 10 + chatToNum(s.charAt(i) );
    	      }
    	      return num;
    	    };

    	    var chatToNum = function(c) {
    	      if ('0' <= c && c <= '9') {
    	        return c.charCodeAt(0) - '0'.charCodeAt(0);
    	      }
    	      throw 'illegal char :' + c;
    	    };

    	    return _this;
    	  };

    	  //---------------------------------------------------------------------
    	  // qrAlphaNum
    	  //---------------------------------------------------------------------

    	  var qrAlphaNum = function(data) {

    	    var _mode = QRMode.MODE_ALPHA_NUM;
    	    var _data = data;

    	    var _this = {};

    	    _this.getMode = function() {
    	      return _mode;
    	    };

    	    _this.getLength = function(buffer) {
    	      return _data.length;
    	    };

    	    _this.write = function(buffer) {

    	      var s = _data;

    	      var i = 0;

    	      while (i + 1 < s.length) {
    	        buffer.put(
    	          getCode(s.charAt(i) ) * 45 +
    	          getCode(s.charAt(i + 1) ), 11);
    	        i += 2;
    	      }

    	      if (i < s.length) {
    	        buffer.put(getCode(s.charAt(i) ), 6);
    	      }
    	    };

    	    var getCode = function(c) {

    	      if ('0' <= c && c <= '9') {
    	        return c.charCodeAt(0) - '0'.charCodeAt(0);
    	      } else if ('A' <= c && c <= 'Z') {
    	        return c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
    	      } else {
    	        switch (c) {
    	        case ' ' : return 36;
    	        case '$' : return 37;
    	        case '%' : return 38;
    	        case '*' : return 39;
    	        case '+' : return 40;
    	        case '-' : return 41;
    	        case '.' : return 42;
    	        case '/' : return 43;
    	        case ':' : return 44;
    	        default :
    	          throw 'illegal char :' + c;
    	        }
    	      }
    	    };

    	    return _this;
    	  };

    	  //---------------------------------------------------------------------
    	  // qr8BitByte
    	  //---------------------------------------------------------------------

    	  var qr8BitByte = function(data) {

    	    var _mode = QRMode.MODE_8BIT_BYTE;
    	    var _bytes = qrcode.stringToBytes(data);

    	    var _this = {};

    	    _this.getMode = function() {
    	      return _mode;
    	    };

    	    _this.getLength = function(buffer) {
    	      return _bytes.length;
    	    };

    	    _this.write = function(buffer) {
    	      for (var i = 0; i < _bytes.length; i += 1) {
    	        buffer.put(_bytes[i], 8);
    	      }
    	    };

    	    return _this;
    	  };

    	  //---------------------------------------------------------------------
    	  // qrKanji
    	  //---------------------------------------------------------------------

    	  var qrKanji = function(data) {

    	    var _mode = QRMode.MODE_KANJI;

    	    var stringToBytes = qrcode.stringToBytesFuncs['SJIS'];
    	    if (!stringToBytes) {
    	      throw 'sjis not supported.';
    	    }
    	    !function(c, code) {
    	      // self test for sjis support.
    	      var test = stringToBytes(c);
    	      if (test.length != 2 || ( (test[0] << 8) | test[1]) != code) {
    	        throw 'sjis not supported.';
    	      }
    	    }('\u53cb', 0x9746);

    	    var _bytes = stringToBytes(data);

    	    var _this = {};

    	    _this.getMode = function() {
    	      return _mode;
    	    };

    	    _this.getLength = function(buffer) {
    	      return ~~(_bytes.length / 2);
    	    };

    	    _this.write = function(buffer) {

    	      var data = _bytes;

    	      var i = 0;

    	      while (i + 1 < data.length) {

    	        var c = ( (0xff & data[i]) << 8) | (0xff & data[i + 1]);

    	        if (0x8140 <= c && c <= 0x9FFC) {
    	          c -= 0x8140;
    	        } else if (0xE040 <= c && c <= 0xEBBF) {
    	          c -= 0xC140;
    	        } else {
    	          throw 'illegal char at ' + (i + 1) + '/' + c;
    	        }

    	        c = ( (c >>> 8) & 0xff) * 0xC0 + (c & 0xff);

    	        buffer.put(c, 13);

    	        i += 2;
    	      }

    	      if (i < data.length) {
    	        throw 'illegal char at ' + (i + 1);
    	      }
    	    };

    	    return _this;
    	  };

    	  //=====================================================================
    	  // GIF Support etc.
    	  //

    	  //---------------------------------------------------------------------
    	  // byteArrayOutputStream
    	  //---------------------------------------------------------------------

    	  var byteArrayOutputStream = function() {

    	    var _bytes = [];

    	    var _this = {};

    	    _this.writeByte = function(b) {
    	      _bytes.push(b & 0xff);
    	    };

    	    _this.writeShort = function(i) {
    	      _this.writeByte(i);
    	      _this.writeByte(i >>> 8);
    	    };

    	    _this.writeBytes = function(b, off, len) {
    	      off = off || 0;
    	      len = len || b.length;
    	      for (var i = 0; i < len; i += 1) {
    	        _this.writeByte(b[i + off]);
    	      }
    	    };

    	    _this.writeString = function(s) {
    	      for (var i = 0; i < s.length; i += 1) {
    	        _this.writeByte(s.charCodeAt(i) );
    	      }
    	    };

    	    _this.toByteArray = function() {
    	      return _bytes;
    	    };

    	    _this.toString = function() {
    	      var s = '';
    	      s += '[';
    	      for (var i = 0; i < _bytes.length; i += 1) {
    	        if (i > 0) {
    	          s += ',';
    	        }
    	        s += _bytes[i];
    	      }
    	      s += ']';
    	      return s;
    	    };

    	    return _this;
    	  };

    	  //---------------------------------------------------------------------
    	  // base64EncodeOutputStream
    	  //---------------------------------------------------------------------

    	  var base64EncodeOutputStream = function() {

    	    var _buffer = 0;
    	    var _buflen = 0;
    	    var _length = 0;
    	    var _base64 = '';

    	    var _this = {};

    	    var writeEncoded = function(b) {
    	      _base64 += String.fromCharCode(encode(b & 0x3f) );
    	    };

    	    var encode = function(n) {
    	      if (n < 0) ; else if (n < 26) {
    	        return 0x41 + n;
    	      } else if (n < 52) {
    	        return 0x61 + (n - 26);
    	      } else if (n < 62) {
    	        return 0x30 + (n - 52);
    	      } else if (n == 62) {
    	        return 0x2b;
    	      } else if (n == 63) {
    	        return 0x2f;
    	      }
    	      throw 'n:' + n;
    	    };

    	    _this.writeByte = function(n) {

    	      _buffer = (_buffer << 8) | (n & 0xff);
    	      _buflen += 8;
    	      _length += 1;

    	      while (_buflen >= 6) {
    	        writeEncoded(_buffer >>> (_buflen - 6) );
    	        _buflen -= 6;
    	      }
    	    };

    	    _this.flush = function() {

    	      if (_buflen > 0) {
    	        writeEncoded(_buffer << (6 - _buflen) );
    	        _buffer = 0;
    	        _buflen = 0;
    	      }

    	      if (_length % 3 != 0) {
    	        // padding
    	        var padlen = 3 - _length % 3;
    	        for (var i = 0; i < padlen; i += 1) {
    	          _base64 += '=';
    	        }
    	      }
    	    };

    	    _this.toString = function() {
    	      return _base64;
    	    };

    	    return _this;
    	  };

    	  //---------------------------------------------------------------------
    	  // base64DecodeInputStream
    	  //---------------------------------------------------------------------

    	  var base64DecodeInputStream = function(str) {

    	    var _str = str;
    	    var _pos = 0;
    	    var _buffer = 0;
    	    var _buflen = 0;

    	    var _this = {};

    	    _this.read = function() {

    	      while (_buflen < 8) {

    	        if (_pos >= _str.length) {
    	          if (_buflen == 0) {
    	            return -1;
    	          }
    	          throw 'unexpected end of file./' + _buflen;
    	        }

    	        var c = _str.charAt(_pos);
    	        _pos += 1;

    	        if (c == '=') {
    	          _buflen = 0;
    	          return -1;
    	        } else if (c.match(/^\s$/) ) {
    	          // ignore if whitespace.
    	          continue;
    	        }

    	        _buffer = (_buffer << 6) | decode(c.charCodeAt(0) );
    	        _buflen += 6;
    	      }

    	      var n = (_buffer >>> (_buflen - 8) ) & 0xff;
    	      _buflen -= 8;
    	      return n;
    	    };

    	    var decode = function(c) {
    	      if (0x41 <= c && c <= 0x5a) {
    	        return c - 0x41;
    	      } else if (0x61 <= c && c <= 0x7a) {
    	        return c - 0x61 + 26;
    	      } else if (0x30 <= c && c <= 0x39) {
    	        return c - 0x30 + 52;
    	      } else if (c == 0x2b) {
    	        return 62;
    	      } else if (c == 0x2f) {
    	        return 63;
    	      } else {
    	        throw 'c:' + c;
    	      }
    	    };

    	    return _this;
    	  };

    	  //---------------------------------------------------------------------
    	  // gifImage (B/W)
    	  //---------------------------------------------------------------------

    	  var gifImage = function(width, height) {

    	    var _width = width;
    	    var _height = height;
    	    var _data = new Array(width * height);

    	    var _this = {};

    	    _this.setPixel = function(x, y, pixel) {
    	      _data[y * _width + x] = pixel;
    	    };

    	    _this.write = function(out) {

    	      //---------------------------------
    	      // GIF Signature

    	      out.writeString('GIF87a');

    	      //---------------------------------
    	      // Screen Descriptor

    	      out.writeShort(_width);
    	      out.writeShort(_height);

    	      out.writeByte(0x80); // 2bit
    	      out.writeByte(0);
    	      out.writeByte(0);

    	      //---------------------------------
    	      // Global Color Map

    	      // black
    	      out.writeByte(0x00);
    	      out.writeByte(0x00);
    	      out.writeByte(0x00);

    	      // white
    	      out.writeByte(0xff);
    	      out.writeByte(0xff);
    	      out.writeByte(0xff);

    	      //---------------------------------
    	      // Image Descriptor

    	      out.writeString(',');
    	      out.writeShort(0);
    	      out.writeShort(0);
    	      out.writeShort(_width);
    	      out.writeShort(_height);
    	      out.writeByte(0);

    	      //---------------------------------
    	      // Local Color Map

    	      //---------------------------------
    	      // Raster Data

    	      var lzwMinCodeSize = 2;
    	      var raster = getLZWRaster(lzwMinCodeSize);

    	      out.writeByte(lzwMinCodeSize);

    	      var offset = 0;

    	      while (raster.length - offset > 255) {
    	        out.writeByte(255);
    	        out.writeBytes(raster, offset, 255);
    	        offset += 255;
    	      }

    	      out.writeByte(raster.length - offset);
    	      out.writeBytes(raster, offset, raster.length - offset);
    	      out.writeByte(0x00);

    	      //---------------------------------
    	      // GIF Terminator
    	      out.writeString(';');
    	    };

    	    var bitOutputStream = function(out) {

    	      var _out = out;
    	      var _bitLength = 0;
    	      var _bitBuffer = 0;

    	      var _this = {};

    	      _this.write = function(data, length) {

    	        if ( (data >>> length) != 0) {
    	          throw 'length over';
    	        }

    	        while (_bitLength + length >= 8) {
    	          _out.writeByte(0xff & ( (data << _bitLength) | _bitBuffer) );
    	          length -= (8 - _bitLength);
    	          data >>>= (8 - _bitLength);
    	          _bitBuffer = 0;
    	          _bitLength = 0;
    	        }

    	        _bitBuffer = (data << _bitLength) | _bitBuffer;
    	        _bitLength = _bitLength + length;
    	      };

    	      _this.flush = function() {
    	        if (_bitLength > 0) {
    	          _out.writeByte(_bitBuffer);
    	        }
    	      };

    	      return _this;
    	    };

    	    var getLZWRaster = function(lzwMinCodeSize) {

    	      var clearCode = 1 << lzwMinCodeSize;
    	      var endCode = (1 << lzwMinCodeSize) + 1;
    	      var bitLength = lzwMinCodeSize + 1;

    	      // Setup LZWTable
    	      var table = lzwTable();

    	      for (var i = 0; i < clearCode; i += 1) {
    	        table.add(String.fromCharCode(i) );
    	      }
    	      table.add(String.fromCharCode(clearCode) );
    	      table.add(String.fromCharCode(endCode) );

    	      var byteOut = byteArrayOutputStream();
    	      var bitOut = bitOutputStream(byteOut);

    	      // clear code
    	      bitOut.write(clearCode, bitLength);

    	      var dataIndex = 0;

    	      var s = String.fromCharCode(_data[dataIndex]);
    	      dataIndex += 1;

    	      while (dataIndex < _data.length) {

    	        var c = String.fromCharCode(_data[dataIndex]);
    	        dataIndex += 1;

    	        if (table.contains(s + c) ) {

    	          s = s + c;

    	        } else {

    	          bitOut.write(table.indexOf(s), bitLength);

    	          if (table.size() < 0xfff) {

    	            if (table.size() == (1 << bitLength) ) {
    	              bitLength += 1;
    	            }

    	            table.add(s + c);
    	          }

    	          s = c;
    	        }
    	      }

    	      bitOut.write(table.indexOf(s), bitLength);

    	      // end code
    	      bitOut.write(endCode, bitLength);

    	      bitOut.flush();

    	      return byteOut.toByteArray();
    	    };

    	    var lzwTable = function() {

    	      var _map = {};
    	      var _size = 0;

    	      var _this = {};

    	      _this.add = function(key) {
    	        if (_this.contains(key) ) {
    	          throw 'dup key:' + key;
    	        }
    	        _map[key] = _size;
    	        _size += 1;
    	      };

    	      _this.size = function() {
    	        return _size;
    	      };

    	      _this.indexOf = function(key) {
    	        return _map[key];
    	      };

    	      _this.contains = function(key) {
    	        return typeof _map[key] != 'undefined';
    	      };

    	      return _this;
    	    };

    	    return _this;
    	  };

    	  var createDataURL = function(width, height, getPixel) {
    	    var gif = gifImage(width, height);
    	    for (var y = 0; y < height; y += 1) {
    	      for (var x = 0; x < width; x += 1) {
    	        gif.setPixel(x, y, getPixel(x, y) );
    	      }
    	    }

    	    var b = byteArrayOutputStream();
    	    gif.write(b);

    	    var base64 = base64EncodeOutputStream();
    	    var bytes = b.toByteArray();
    	    for (var i = 0; i < bytes.length; i += 1) {
    	      base64.writeByte(bytes[i]);
    	    }
    	    base64.flush();

    	    return 'data:image/gif;base64,' + base64;
    	  };

    	  //---------------------------------------------------------------------
    	  // returns qrcode function.

    	  return qrcode;
    	}();

    	// multibyte support
    	!function() {

    	  qrcode.stringToBytesFuncs['UTF-8'] = function(s) {
    	    // http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
    	    function toUTF8Array(str) {
    	      var utf8 = [];
    	      for (var i=0; i < str.length; i++) {
    	        var charcode = str.charCodeAt(i);
    	        if (charcode < 0x80) utf8.push(charcode);
    	        else if (charcode < 0x800) {
    	          utf8.push(0xc0 | (charcode >> 6),
    	              0x80 | (charcode & 0x3f));
    	        }
    	        else if (charcode < 0xd800 || charcode >= 0xe000) {
    	          utf8.push(0xe0 | (charcode >> 12),
    	              0x80 | ((charcode>>6) & 0x3f),
    	              0x80 | (charcode & 0x3f));
    	        }
    	        // surrogate pair
    	        else {
    	          i++;
    	          // UTF-16 encodes 0x10000-0x10FFFF by
    	          // subtracting 0x10000 and splitting the
    	          // 20 bits of 0x0-0xFFFFF into two halves
    	          charcode = 0x10000 + (((charcode & 0x3ff)<<10)
    	            | (str.charCodeAt(i) & 0x3ff));
    	          utf8.push(0xf0 | (charcode >>18),
    	              0x80 | ((charcode>>12) & 0x3f),
    	              0x80 | ((charcode>>6) & 0x3f),
    	              0x80 | (charcode & 0x3f));
    	        }
    	      }
    	      return utf8;
    	    }
    	    return toUTF8Array(s);
    	  };

    	}();

    	(function (factory) {
    	  {
    	      module.exports = factory();
    	  }
    	}(function () {
    	    return qrcode;
    	}));
    } (qrcode));

    var QRCode = qrcodeExports;

    /* src\components\home.svelte generated by Svelte v3.58.0 */

    const { console: console_1 } = globals;
    const file$1 = "src\\components\\home.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[43] = list[i];
    	child_ctx[45] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[43] = list[i];
    	child_ctx[45] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[43] = list[i];
    	child_ctx[45] = i;
    	return child_ctx;
    }

    // (212:20) {:else}
    function create_else_block_1(ctx) {
    	let button0;
    	let t1;
    	let button1;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "Login";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Registrar";
    			attr_dev(button0, "class", "btn btn-secondary");
    			attr_dev(button0, "data-toggle", "modal");
    			attr_dev(button0, "data-target", ".bd-example-modal-sigIn");
    			add_location(button0, file$1, 212, 24, 7118);
    			attr_dev(button1, "class", "btn btn-primary");
    			attr_dev(button1, "data-toggle", "modal");
    			attr_dev(button1, "data-target", ".bd-example-modal-register");
    			add_location(button1, file$1, 213, 24, 7250);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(212:20) {:else}",
    		ctx
    	});

    	return block;
    }

    // (210:20) {#if token}
    function create_if_block_5(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Salir";
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$1, 210, 24, 6998);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*singOut*/ ctx[11], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(210:20) {#if token}",
    		ctx
    	});

    	return block;
    }

    // (246:24) {#if token}
    function create_if_block_4(ctx) {
    	let h6;

    	const block = {
    		c: function create() {
    			h6 = element("h6");
    			h6.textContent = `Hola, ${sessionStorage.getItem("username")}`;
    			set_style(h6, "color", "white");
    			set_style(h6, "font-size", "10px");
    			add_location(h6, file$1, 246, 26, 9297);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h6, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(246:24) {#if token}",
    		ctx
    	});

    	return block;
    }

    // (252:32) {:else}
    function create_else_block(ctx) {
    	let button0;
    	let t1;
    	let button1;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "Login";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Registrar";
    			attr_dev(button0, "class", "btn btn-secondary");
    			attr_dev(button0, "data-toggle", "modal");
    			attr_dev(button0, "data-target", ".bd-example-modal-sigIn");
    			add_location(button0, file$1, 252, 32, 9862);
    			attr_dev(button1, "class", "btn btn-primary");
    			attr_dev(button1, "data-toggle", "modal");
    			attr_dev(button1, "data-target", ".bd-example-modal-register");
    			add_location(button1, file$1, 253, 32, 10002);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(252:32) {:else}",
    		ctx
    	});

    	return block;
    }

    // (250:28) {#if token}
    function create_if_block_3(ctx) {
    	let button;
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			span = element("span");
    			span.textContent = "Salir";
    			set_style(span, "padding-bottom", "9px");
    			set_style(span, "color", "white");
    			add_location(span, file$1, 250, 180, 9719);
    			attr_dev(button, "class", "btn btn-primary");
    			set_style(button, "width", "35px");
    			set_style(button, "height", "23px");
    			set_style(button, "font-size", "12px");
    			set_style(button, "margin-top", "-9px");
    			set_style(button, "padding", "5px");
    			set_style(button, "border-radius", "3px");
    			add_location(button, file$1, 250, 31, 9570);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*singOut*/ ctx[11], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(250:28) {#if token}",
    		ctx
    	});

    	return block;
    }

    // (352:20) {#each  products.list as value , key}
    function create_each_block_2(ctx) {
    	let div3;
    	let a;
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let h6;
    	let t1_value = /*value*/ ctx[43].name + "";
    	let t1;
    	let t2;
    	let small0;
    	let t4;
    	let small1;
    	let t5;
    	let t6_value = /*value*/ ctx[43].totalmoney + "";
    	let t6;
    	let t7;
    	let t8;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[19](/*value*/ ctx[43]);
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			a = element("a");
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			h6 = element("h6");
    			t1 = text(t1_value);
    			t2 = space();
    			small0 = element("small");
    			small0.textContent = "100 Products";
    			t4 = space();
    			small1 = element("small");
    			t5 = text("S/. ");
    			t6 = text(t6_value);
    			t7 = text(".00");
    			t8 = space();
    			attr_dev(img, "class", "img-fluid");
    			if (!src_url_equal(img.src, img_src_value = /*value*/ ctx[43].photo)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			set_style(img, "height", "119px");
    			add_location(img, file$1, 357, 40, 17406);
    			attr_dev(div0, "class", "overflow-hidden");
    			set_style(div0, "width", "120px");
    			set_style(div0, "height", "120px");
    			add_location(div0, file$1, 356, 36, 17298);
    			add_location(h6, file$1, 360, 40, 17631);
    			attr_dev(small0, "class", "text-body");
    			add_location(small0, file$1, 361, 40, 17694);
    			attr_dev(small1, "class", "text-price svelte-z8vot3");
    			add_location(small1, file$1, 362, 40, 17781);
    			attr_dev(div1, "class", "flex-fill pl-3");
    			add_location(div1, file$1, 359, 36, 17561);
    			attr_dev(div2, "class", "cat-item d-flex align-items-center mb-4");
    			add_location(div2, file$1, 355, 32, 17207);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "text-decoration-none");
    			add_location(a, file$1, 354, 28, 17132);
    			attr_dev(div3, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-z8vot3");
    			add_location(div3, file$1, 353, 24, 17007);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, a);
    			append_dev(a, div2);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, h6);
    			append_dev(h6, t1);
    			append_dev(div1, t2);
    			append_dev(div1, small0);
    			append_dev(div1, t4);
    			append_dev(div1, small1);
    			append_dev(small1, t5);
    			append_dev(small1, t6);
    			append_dev(small1, t7);
    			append_dev(div3, t8);

    			if (!mounted) {
    				dispose = listen_dev(div3, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*products*/ 8 && !src_url_equal(img.src, img_src_value = /*value*/ ctx[43].photo)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*products*/ 8 && t1_value !== (t1_value = /*value*/ ctx[43].name + "")) set_data_dev(t1, t1_value);
    			if (dirty[0] & /*products*/ 8 && t6_value !== (t6_value = /*value*/ ctx[43].totalmoney + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(352:20) {#each  products.list as value , key}",
    		ctx
    	});

    	return block;
    }

    // (456:32) {#each  product as value , key}
    function create_each_block_1(ctx) {
    	let div3;
    	let a;
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let h6;
    	let t1_value = /*value*/ ctx[43].name + "";
    	let t1;
    	let t2;
    	let small0;
    	let t4;
    	let small1;
    	let t5;
    	let t6_value = /*value*/ ctx[43].totalmoney + "";
    	let t6;
    	let t7;
    	let t8;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			a = element("a");
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			h6 = element("h6");
    			t1 = text(t1_value);
    			t2 = space();
    			small0 = element("small");
    			small0.textContent = "100 Products";
    			t4 = space();
    			small1 = element("small");
    			t5 = text("S/. ");
    			t6 = text(t6_value);
    			t7 = text(".00");
    			t8 = space();
    			attr_dev(img, "class", "img-fluid");
    			if (!src_url_equal(img.src, img_src_value = /*value*/ ctx[43].photo)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			set_style(img, "height", "119px");
    			add_location(img, file$1, 460, 52, 23503);
    			attr_dev(div0, "class", "overflow-hidden");
    			set_style(div0, "width", "120px");
    			set_style(div0, "height", "120px");
    			add_location(div0, file$1, 459, 48, 23383);
    			add_location(h6, file$1, 463, 52, 23764);
    			attr_dev(small0, "class", "text-body");
    			add_location(small0, file$1, 464, 52, 23839);
    			attr_dev(small1, "class", "text-price svelte-z8vot3");
    			add_location(small1, file$1, 465, 52, 23938);
    			attr_dev(div1, "class", "flex-fill pl-3");
    			add_location(div1, file$1, 462, 48, 23682);
    			attr_dev(div2, "class", "cat-item d-flex align-items-center mb-4");
    			add_location(div2, file$1, 458, 44, 23280);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "text-decoration-none");
    			add_location(a, file$1, 457, 40, 23193);
    			attr_dev(div3, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-z8vot3");
    			add_location(div3, file$1, 456, 36, 23091);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, a);
    			append_dev(a, div2);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, h6);
    			append_dev(h6, t1);
    			append_dev(div1, t2);
    			append_dev(div1, small0);
    			append_dev(div1, t4);
    			append_dev(div1, small1);
    			append_dev(small1, t5);
    			append_dev(small1, t6);
    			append_dev(small1, t7);
    			append_dev(div3, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*product*/ 128 && !src_url_equal(img.src, img_src_value = /*value*/ ctx[43].photo)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*product*/ 128 && t1_value !== (t1_value = /*value*/ ctx[43].name + "")) set_data_dev(t1, t1_value);
    			if (dirty[0] & /*product*/ 128 && t6_value !== (t6_value = /*value*/ ctx[43].totalmoney + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(456:32) {#each  product as value , key}",
    		ctx
    	});

    	return block;
    }

    // (505:33) {#each  productScanner.list as value , key}
    function create_each_block(ctx) {
    	let div3;
    	let a;
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let h6;
    	let t1_value = /*value*/ ctx[43].name + "";
    	let t1;
    	let t2;
    	let small0;
    	let t4;
    	let small1;
    	let t5;
    	let t6_value = /*value*/ ctx[43].totalmoney + "";
    	let t6;
    	let t7;
    	let t8;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[25](/*value*/ ctx[43]);
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			a = element("a");
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			h6 = element("h6");
    			t1 = text(t1_value);
    			t2 = space();
    			small0 = element("small");
    			small0.textContent = "100 Products";
    			t4 = space();
    			small1 = element("small");
    			t5 = text("S/. ");
    			t6 = text(t6_value);
    			t7 = text(".00");
    			t8 = space();
    			attr_dev(img, "class", "img-fluid");
    			if (!src_url_equal(img.src, img_src_value = /*value*/ ctx[43].photo)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			set_style(img, "height", "119px");
    			add_location(img, file$1, 509, 52, 26583);
    			attr_dev(div0, "class", "overflow-hidden");
    			set_style(div0, "width", "120px");
    			set_style(div0, "height", "120px");
    			add_location(div0, file$1, 508, 48, 26463);
    			add_location(h6, file$1, 512, 52, 26844);
    			attr_dev(small0, "class", "text-body");
    			add_location(small0, file$1, 513, 52, 26919);
    			attr_dev(small1, "class", "text-price svelte-z8vot3");
    			add_location(small1, file$1, 514, 52, 27018);
    			attr_dev(div1, "class", "flex-fill pl-3");
    			add_location(div1, file$1, 511, 48, 26762);
    			attr_dev(div2, "class", "cat-item d-flex align-items-center mb-4");
    			add_location(div2, file$1, 507, 44, 26360);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "text-decoration-none");
    			add_location(a, file$1, 506, 40, 26273);
    			attr_dev(div3, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-z8vot3");
    			add_location(div3, file$1, 505, 36, 26136);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, a);
    			append_dev(a, div2);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, h6);
    			append_dev(h6, t1);
    			append_dev(div1, t2);
    			append_dev(div1, small0);
    			append_dev(div1, t4);
    			append_dev(div1, small1);
    			append_dev(small1, t5);
    			append_dev(small1, t6);
    			append_dev(small1, t7);
    			append_dev(div3, t8);

    			if (!mounted) {
    				dispose = listen_dev(div3, "click", click_handler_1, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*productScanner*/ 16 && !src_url_equal(img.src, img_src_value = /*value*/ ctx[43].photo)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*productScanner*/ 16 && t1_value !== (t1_value = /*value*/ ctx[43].name + "")) set_data_dev(t1, t1_value);
    			if (dirty[0] & /*productScanner*/ 16 && t6_value !== (t6_value = /*value*/ ctx[43].totalmoney + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(505:33) {#each  productScanner.list as value , key}",
    		ctx
    	});

    	return block;
    }

    // (550:8) {#if gameActive}
    function create_if_block_2(ctx) {
    	let div2;
    	let input;
    	let t0;
    	let div0;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let a1;
    	let img1;
    	let img1_src_value;
    	let t2;
    	let div1;
    	let label;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			input = element("input");
    			t0 = space();
    			div0 = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t1 = space();
    			a1 = element("a");
    			img1 = element("img");
    			t2 = space();
    			div1 = element("div");
    			label = element("label");
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", "btn-mas");
    			attr_dev(input, "class", "svelte-z8vot3");
    			add_location(input, file$1, 551, 16, 28833);
    			attr_dev(img0, "class", "img-game svelte-z8vot3");
    			if (!src_url_equal(img0.src, img0_src_value = "img/casino.jpg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "width", "45px");
    			attr_dev(img0, "height", "45px");
    			attr_dev(img0, "alt", "");
    			add_location(img0, file$1, 553, 34, 28942);
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "class", "svelte-z8vot3");
    			add_location(a0, file$1, 553, 20, 28928);
    			attr_dev(img1, "class", "img-game svelte-z8vot3");
    			if (!src_url_equal(img1.src, img1_src_value = "img/ruleta.jpg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "width", "45px");
    			attr_dev(img1, "height", "45px");
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$1, 554, 34, 29091);
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "class", "svelte-z8vot3");
    			add_location(a1, file$1, 554, 20, 29077);
    			attr_dev(div0, "class", "redes svelte-z8vot3");
    			add_location(div0, file$1, 552, 16, 28887);
    			attr_dev(label, "for", "btn-mas");
    			attr_dev(label, "class", "fa fa-plus svelte-z8vot3");
    			add_location(label, file$1, 557, 20, 29295);
    			attr_dev(div1, "class", "btn-mas svelte-z8vot3");
    			add_location(div1, file$1, 556, 16, 29252);
    			attr_dev(div2, "class", "container svelte-z8vot3");
    			add_location(div2, file$1, 550, 12, 28792);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, input);
    			append_dev(div2, t0);
    			append_dev(div2, div0);
    			append_dev(div0, a0);
    			append_dev(a0, img0);
    			append_dev(div0, t1);
    			append_dev(div0, a1);
    			append_dev(a1, img1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, label);

    			if (!mounted) {
    				dispose = [
    					listen_dev(img0, "click", /*click_handler_3*/ ctx[27], false, false, false, false),
    					listen_dev(img1, "click", /*click_handler_4*/ ctx[28], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(550:8) {#if gameActive}",
    		ctx
    	});

    	return block;
    }

    // (564:8) {#if gameOpen==true}
    function create_if_block_1(ctx) {
    	let i;
    	let t;
    	let iframe;
    	let iframe_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			i = element("i");
    			t = space();
    			iframe = element("iframe");
    			attr_dev(i, "class", "fa fa-times back-to-times");
    			set_style(i, "color", "yellow");
    			set_style(i, "float", "right");
    			set_style(i, "margin", "15px");
    			set_style(i, "margin-right", "18px");
    			set_style(i, "cursor", "pointer");
    			add_location(i, file$1, 564, 12, 29458);
    			attr_dev(iframe, "class", "back-to-iframe");
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "100%");
    			if (!src_url_equal(iframe.src, iframe_src_value = "https://netent-static.casinomodule.com/games/frenchroulette3_mobile_html/game/frenchroulette3_mobile_html.xhtml?staticServer=https%3A%2F%2Fnetent-static.casinomodule.com%2F&targetElement=netentgame&flashParams.bgcolor=000000&gameId=frenchroulette3_not_mobile&mobileParams.lobbyURL=https%253A%252F%252Fgames.netent.com%252Ftable-games%252Ffrench-roulette-slot%252F&server=https%3A%2F%2Fnetent-game.casinomodule.com%2F&lang=es&sessId=DEMO-0037068596-EUR&operatorId=default")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			add_location(iframe, file$1, 565, 12, 29630);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, iframe, anchor);

    			if (!mounted) {
    				dispose = listen_dev(i, "click", /*click_handler_5*/ ctx[29], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(iframe);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(564:8) {#if gameOpen==true}",
    		ctx
    	});

    	return block;
    }

    // (569:8) {#if gameOpencasine==true}
    function create_if_block(ctx) {
    	let i;
    	let t;
    	let iframe;
    	let iframe_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			i = element("i");
    			t = space();
    			iframe = element("iframe");
    			attr_dev(i, "class", "fa fa-times back-to-times");
    			set_style(i, "color", "yellow");
    			set_style(i, "float", "right");
    			set_style(i, "margin", "15px");
    			set_style(i, "margin-right", "18px");
    			set_style(i, "cursor", "pointer");
    			add_location(i, file$1, 569, 12, 30258);
    			attr_dev(iframe, "class", "back-to-iframe");
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "100%");
    			if (!src_url_equal(iframe.src, iframe_src_value = "https://test-2.apiusoft.com/api/pascal/opengame?gameid=141426-PSG&mode=wb&m=wb&player_id=789&currency=USD&t=662ebb619b06f2453be52adfff7262d0ec2bd50475926f009a4ae6cccf57b7088f43c035add00fa8fd75e4d95c50857c622abc08d0ea8881198067f03a4e5cc1")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			add_location(iframe, file$1, 570, 12, 30436);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, iframe, anchor);

    			if (!mounted) {
    				dispose = listen_dev(i, "click", /*click_handler_6*/ ctx[30], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(iframe);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(569:8) {#if gameOpencasine==true}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let body;
    	let toaster;
    	let t0;
    	let div0;
    	let t1;
    	let div7;
    	let div6;
    	let div1;
    	let img0;
    	let img0_src_value;
    	let t2;
    	let a0;
    	let span0;
    	let t4;
    	let span1;
    	let t6;
    	let div4;
    	let div3;
    	let input0;
    	let t7;
    	let div2;
    	let span2;
    	let i0;
    	let t8;
    	let div5;
    	let t9;
    	let div19;
    	let div18;
    	let div10;
    	let a1;
    	let h6;
    	let i1;
    	let t10;
    	let t11;
    	let i2;
    	let t12;
    	let nav0;
    	let div9;
    	let div8;
    	let a2;
    	let t14;
    	let a3;
    	let t16;
    	let a4;
    	let t18;
    	let a5;
    	let t20;
    	let a6;
    	let t22;
    	let div17;
    	let nav1;
    	let button0;
    	let span3;
    	let t23;
    	let t24;
    	let div11;
    	let t25;
    	let div16;
    	let div14;
    	let a7;
    	let t27;
    	let a8;
    	let t29;
    	let a9;
    	let t31;
    	let div13;
    	let a10;
    	let t32;
    	let i3;
    	let t33;
    	let div12;
    	let a11;
    	let t35;
    	let a12;
    	let t37;
    	let a13;
    	let t39;
    	let div15;
    	let a14;
    	let i4;
    	let t40;
    	let span4;
    	let t42;
    	let a15;
    	let i5;
    	let t43;
    	let span5;
    	let t44_value = /*product*/ ctx[7].length + "";
    	let t44;
    	let t45;
    	let div39;
    	let div33;
    	let div32;
    	let div31;
    	let div30;
    	let ol;
    	let li0;
    	let t46;
    	let li1;
    	let t47;
    	let li2;
    	let t48;
    	let div29;
    	let div22;
    	let img1;
    	let img1_src_value;
    	let t49;
    	let div21;
    	let div20;
    	let h10;
    	let t51;
    	let p0;
    	let t53;
    	let div25;
    	let img2;
    	let img2_src_value;
    	let t54;
    	let div24;
    	let div23;
    	let h11;
    	let t56;
    	let p1;
    	let t58;
    	let div28;
    	let img3;
    	let img3_src_value;
    	let t59;
    	let div27;
    	let div26;
    	let h12;
    	let t61;
    	let p2;
    	let t63;
    	let div36;
    	let div35;
    	let input1;
    	let t64;
    	let div34;
    	let span6;
    	let i6;
    	let t65;
    	let div38;
    	let h2;
    	let span7;
    	let t67;
    	let div37;
    	let t68;
    	let div40;
    	let a16;
    	let span8;
    	let i7;
    	let t69_value = /*product*/ ctx[7].length + "";
    	let t69;
    	let t70;
    	let a17;
    	let img4;
    	let img4_src_value;
    	let t71;
    	let div48;
    	let div47;
    	let div46;
    	let div41;
    	let img5;
    	let img5_src_value;
    	let t72;
    	let div45;
    	let h50;
    	let t74;
    	let form0;
    	let div42;
    	let input2;
    	let t75;
    	let br;
    	let t76;
    	let div43;
    	let input3;
    	let t77;
    	let div44;
    	let button1;
    	let t78;
    	let i8;
    	let t79;
    	let div57;
    	let div56;
    	let div55;
    	let div49;
    	let img6;
    	let img6_src_value;
    	let t80;
    	let div54;
    	let h51;
    	let t82;
    	let form1;
    	let div50;
    	let input4;
    	let t83;
    	let div51;
    	let input5;
    	let t84;
    	let div52;
    	let input6;
    	let t85;
    	let div53;
    	let button2;
    	let t86;
    	let i9;
    	let t87;
    	let span9;
    	let t89;
    	let div64;
    	let div63;
    	let div62;
    	let div58;
    	let h52;
    	let img7;
    	let img7_src_value;
    	let t90;
    	let t91;
    	let button3;
    	let span10;
    	let t93;
    	let div60;
    	let div59;
    	let div59_style_value;
    	let t94;
    	let div61;
    	let tbody0;
    	let tr0;
    	let td0;
    	let span11;
    	let strong0;
    	let t96;
    	let td1;
    	let span12;
    	let strong1;
    	let t97;
    	let t98;
    	let t99;
    	let t100;
    	let button4;
    	let t102;
    	let div71;
    	let div70;
    	let div69;
    	let div65;
    	let h53;
    	let t104;
    	let button5;
    	let span13;
    	let t106;
    	let div67;
    	let div66;
    	let t107;
    	let div68;
    	let tbody1;
    	let tr1;
    	let td2;
    	let span14;
    	let strong2;
    	let t109;
    	let td3;
    	let span15;
    	let t111;
    	let tr2;
    	let td4;
    	let span16;
    	let strong3;
    	let t113;
    	let td5;
    	let span17;
    	let strong4;
    	let t115;
    	let button6;
    	let t117;
    	let t118;
    	let t119;
    	let current;
    	let mounted;
    	let dispose;
    	toaster = new Toaster({ $$inline: true });

    	function select_block_type(ctx, dirty) {
    		if (/*token*/ ctx[8]) return create_if_block_5;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*token*/ ctx[8] && create_if_block_4(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*token*/ ctx[8]) return create_if_block_3;
    		return create_else_block;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block2 = current_block_type_1(ctx);
    	let each_value_2 = /*products*/ ctx[3].list;
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*product*/ ctx[7];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*productScanner*/ ctx[4].list;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block3 = /*gameActive*/ ctx[1] && create_if_block_2(ctx);
    	let if_block4 = /*gameOpen*/ ctx[0] == true && create_if_block_1(ctx);
    	let if_block5 = /*gameOpencasine*/ ctx[2] == true && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			body = element("body");
    			create_component(toaster.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div1 = element("div");
    			img0 = element("img");
    			t2 = space();
    			a0 = element("a");
    			span0 = element("span");
    			span0.textContent = "Go";
    			t4 = space();
    			span1 = element("span");
    			span1.textContent = "Eat";
    			t6 = space();
    			div4 = element("div");
    			div3 = element("div");
    			input0 = element("input");
    			t7 = space();
    			div2 = element("div");
    			span2 = element("span");
    			i0 = element("i");
    			t8 = space();
    			div5 = element("div");
    			if_block0.c();
    			t9 = space();
    			div19 = element("div");
    			div18 = element("div");
    			div10 = element("div");
    			a1 = element("a");
    			h6 = element("h6");
    			i1 = element("i");
    			t10 = text("Categorias");
    			t11 = space();
    			i2 = element("i");
    			t12 = space();
    			nav0 = element("nav");
    			div9 = element("div");
    			div8 = element("div");
    			a2 = element("a");
    			a2.textContent = "Brosterias";
    			t14 = space();
    			a3 = element("a");
    			a3.textContent = "Pizzas";
    			t16 = space();
    			a4 = element("a");
    			a4.textContent = "Taquerias";
    			t18 = space();
    			a5 = element("a");
    			a5.textContent = "Juguerias";
    			t20 = space();
    			a6 = element("a");
    			a6.textContent = "Restobar";
    			t22 = space();
    			div17 = element("div");
    			nav1 = element("nav");
    			button0 = element("button");
    			span3 = element("span");
    			t23 = space();
    			if (if_block1) if_block1.c();
    			t24 = space();
    			div11 = element("div");
    			if_block2.c();
    			t25 = space();
    			div16 = element("div");
    			div14 = element("div");
    			a7 = element("a");
    			a7.textContent = "Home";
    			t27 = space();
    			a8 = element("a");
    			a8.textContent = "Shop";
    			t29 = space();
    			a9 = element("a");
    			a9.textContent = "Shop Detail";
    			t31 = space();
    			div13 = element("div");
    			a10 = element("a");
    			t32 = text("Pages ");
    			i3 = element("i");
    			t33 = space();
    			div12 = element("div");
    			a11 = element("a");
    			a11.textContent = "Shopping Cart";
    			t35 = space();
    			a12 = element("a");
    			a12.textContent = "Checkout";
    			t37 = space();
    			a13 = element("a");
    			a13.textContent = "Contact";
    			t39 = space();
    			div15 = element("div");
    			a14 = element("a");
    			i4 = element("i");
    			t40 = space();
    			span4 = element("span");
    			span4.textContent = "0";
    			t42 = space();
    			a15 = element("a");
    			i5 = element("i");
    			t43 = space();
    			span5 = element("span");
    			t44 = text(t44_value);
    			t45 = space();
    			div39 = element("div");
    			div33 = element("div");
    			div32 = element("div");
    			div31 = element("div");
    			div30 = element("div");
    			ol = element("ol");
    			li0 = element("li");
    			t46 = space();
    			li1 = element("li");
    			t47 = space();
    			li2 = element("li");
    			t48 = space();
    			div29 = element("div");
    			div22 = element("div");
    			img1 = element("img");
    			t49 = space();
    			div21 = element("div");
    			div20 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Warmin Coffe";
    			t51 = space();
    			p0 = element("p");
    			p0.textContent = "Warmi, el lugar adecuado si te encuentras en tingo maría";
    			t53 = space();
    			div25 = element("div");
    			img2 = element("img");
    			t54 = space();
    			div24 = element("div");
    			div23 = element("div");
    			h11 = element("h1");
    			h11.textContent = "Women Fashion";
    			t56 = space();
    			p1 = element("p");
    			p1.textContent = "Lugar adecuado si te encuentras en tingo maría";
    			t58 = space();
    			div28 = element("div");
    			img3 = element("img");
    			t59 = space();
    			div27 = element("div");
    			div26 = element("div");
    			h12 = element("h1");
    			h12.textContent = "Kids Fashion";
    			t61 = space();
    			p2 = element("p");
    			p2.textContent = "Lugar adecuado si te encuentras en tingo maría";
    			t63 = space();
    			div36 = element("div");
    			div35 = element("div");
    			input1 = element("input");
    			t64 = space();
    			div34 = element("div");
    			span6 = element("span");
    			i6 = element("i");
    			t65 = space();
    			div38 = element("div");
    			h2 = element("h2");
    			span7 = element("span");
    			span7.textContent = "COMIDAS";
    			t67 = space();
    			div37 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t68 = space();
    			div40 = element("div");
    			a16 = element("a");
    			span8 = element("span");
    			i7 = element("i");
    			t69 = text(t69_value);
    			t70 = space();
    			a17 = element("a");
    			img4 = element("img");
    			t71 = space();
    			div48 = element("div");
    			div47 = element("div");
    			div46 = element("div");
    			div41 = element("div");
    			img5 = element("img");
    			t72 = space();
    			div45 = element("div");
    			h50 = element("h5");
    			h50.textContent = "Inisiar Sesion";
    			t74 = space();
    			form0 = element("form");
    			div42 = element("div");
    			input2 = element("input");
    			t75 = space();
    			br = element("br");
    			t76 = space();
    			div43 = element("div");
    			input3 = element("input");
    			t77 = space();
    			div44 = element("div");
    			button1 = element("button");
    			t78 = text("LOGIN");
    			i8 = element("i");
    			t79 = space();
    			div57 = element("div");
    			div56 = element("div");
    			div55 = element("div");
    			div49 = element("div");
    			img6 = element("img");
    			t80 = space();
    			div54 = element("div");
    			h51 = element("h5");
    			h51.textContent = "Registro de Usuario";
    			t82 = space();
    			form1 = element("form");
    			div50 = element("div");
    			input4 = element("input");
    			t83 = space();
    			div51 = element("div");
    			input5 = element("input");
    			t84 = space();
    			div52 = element("div");
    			input6 = element("input");
    			t85 = space();
    			div53 = element("div");
    			button2 = element("button");
    			t86 = text("Registrar");
    			i9 = element("i");
    			t87 = space();
    			span9 = element("span");
    			span9.textContent = "Para obtener su usuario y contraseña ingrese a su correo ingresado.";
    			t89 = space();
    			div64 = element("div");
    			div63 = element("div");
    			div62 = element("div");
    			div58 = element("div");
    			h52 = element("h5");
    			img7 = element("img");
    			t90 = text("Carrito");
    			t91 = space();
    			button3 = element("button");
    			span10 = element("span");
    			span10.textContent = "×";
    			t93 = space();
    			div60 = element("div");
    			div59 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t94 = space();
    			div61 = element("div");
    			tbody0 = element("tbody");
    			tr0 = element("tr");
    			td0 = element("td");
    			span11 = element("span");
    			strong0 = element("strong");
    			strong0.textContent = "TOTAL:";
    			t96 = space();
    			td1 = element("td");
    			span12 = element("span");
    			strong1 = element("strong");
    			t97 = text("S/ ");
    			t98 = text(/*totalMoney*/ ctx[5]);
    			t99 = text(".00");
    			t100 = space();
    			button4 = element("button");
    			button4.textContent = "Proceder pago";
    			t102 = space();
    			div71 = element("div");
    			div70 = element("div");
    			div69 = element("div");
    			div65 = element("div");
    			h53 = element("h5");
    			h53.textContent = "El sazon del pato";
    			t104 = space();
    			button5 = element("button");
    			span13 = element("span");
    			span13.textContent = "×";
    			t106 = space();
    			div67 = element("div");
    			div66 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t107 = space();
    			div68 = element("div");
    			tbody1 = element("tbody");
    			tr1 = element("tr");
    			td2 = element("td");
    			span14 = element("span");
    			strong2 = element("strong");
    			strong2.textContent = "Mesa:";
    			t109 = space();
    			td3 = element("td");
    			span15 = element("span");
    			span15.textContent = "1";
    			t111 = space();
    			tr2 = element("tr");
    			td4 = element("td");
    			span16 = element("span");
    			strong3 = element("strong");
    			strong3.textContent = "TOTAL:";
    			t113 = space();
    			td5 = element("td");
    			span17 = element("span");
    			strong4 = element("strong");
    			strong4.textContent = "S/ 0.00";
    			t115 = space();
    			button6 = element("button");
    			button6.textContent = "Realizar pedido";
    			t117 = space();
    			if (if_block3) if_block3.c();
    			t118 = space();
    			if (if_block4) if_block4.c();
    			t119 = space();
    			if (if_block5) if_block5.c();
    			attr_dev(div0, "id", "qrcode");
    			add_location(div0, file$1, 186, 8, 5701);
    			if (!src_url_equal(img0.src, img0_src_value = "img/goeat.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "width", "80");
    			attr_dev(img0, "height", "80");
    			set_style(img0, "margin-top", "-26px");
    			add_location(img0, file$1, 191, 20, 5945);
    			attr_dev(span0, "class", "h1 text-uppercase text-primary");
    			add_location(span0, file$1, 193, 24, 6102);
    			attr_dev(span1, "class", "h1 text-uppercase text-dark");
    			add_location(span1, file$1, 194, 24, 6182);
    			attr_dev(a0, "class", "text-decoration-none");
    			add_location(a0, file$1, 192, 20, 6043);
    			attr_dev(div1, "class", "col-lg-4");
    			add_location(div1, file$1, 190, 16, 5901);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "placeholder", "Search for products");
    			add_location(input0, file$1, 199, 24, 6413);
    			attr_dev(i0, "class", "fa fa-search");
    			add_location(i0, file$1, 202, 32, 6731);
    			attr_dev(span2, "class", "input-group-text bg-transparent text-primary");
    			add_location(span2, file$1, 201, 28, 6638);
    			attr_dev(div2, "class", "input-group-append");
    			add_location(div2, file$1, 200, 24, 6576);
    			attr_dev(div3, "class", "input-group");
    			add_location(div3, file$1, 198, 20, 6362);
    			attr_dev(div4, "class", "col-lg-4 col-6 text-left");
    			add_location(div4, file$1, 197, 16, 6302);
    			attr_dev(div5, "class", "col-lg-4 col-6 text-right");
    			add_location(div5, file$1, 208, 16, 6900);
    			attr_dev(div6, "class", "row align-items-center bg-light py-3 px-xl-5 d-none d-lg-flex");
    			add_location(div6, file$1, 189, 12, 5808);
    			attr_dev(div7, "class", "container-fluid");
    			add_location(div7, file$1, 188, 8, 5765);
    			attr_dev(i1, "class", "fa fa-bars mr-2");
    			add_location(i1, file$1, 226, 50, 7904);
    			attr_dev(h6, "class", "text-dark m-0");
    			add_location(h6, file$1, 226, 24, 7878);
    			attr_dev(i2, "class", "fa fa-angle-down text-dark");
    			add_location(i2, file$1, 227, 24, 7976);
    			attr_dev(a1, "class", "btn d-flex align-items-center justify-content-between bg-primary w-100");
    			attr_dev(a1, "data-toggle", "collapse");
    			attr_dev(a1, "href", "#navbar-vertical");
    			set_style(a1, "height", "65px");
    			set_style(a1, "padding", "0 30px");
    			add_location(a1, file$1, 225, 20, 7684);
    			attr_dev(a2, "href", "");
    			attr_dev(a2, "class", "nav-item nav-link");
    			add_location(a2, file$1, 232, 28, 8399);
    			attr_dev(a3, "href", "");
    			attr_dev(a3, "class", "nav-item nav-link");
    			add_location(a3, file$1, 233, 28, 8480);
    			attr_dev(a4, "href", "");
    			attr_dev(a4, "class", "nav-item nav-link");
    			add_location(a4, file$1, 234, 28, 8557);
    			attr_dev(a5, "href", "");
    			attr_dev(a5, "class", "nav-item nav-link");
    			add_location(a5, file$1, 235, 28, 8637);
    			attr_dev(a6, "href", "");
    			attr_dev(a6, "class", "nav-item nav-link");
    			add_location(a6, file$1, 236, 28, 8717);
    			attr_dev(div8, "class", "nav-item dropdown dropright");
    			add_location(div8, file$1, 231, 28, 8328);
    			attr_dev(div9, "class", "navbar-nav w-100");
    			add_location(div9, file$1, 230, 24, 8268);
    			attr_dev(nav0, "class", "collapse position-absolute navbar navbar-vertical navbar-light align-items-start p-0 bg-light");
    			attr_dev(nav0, "id", "navbar-vertical");
    			set_style(nav0, "width", "calc(100% - 30px)");
    			set_style(nav0, "z-index", "999");
    			add_location(nav0, file$1, 229, 20, 8066);
    			attr_dev(div10, "class", "col-lg-3 d-none d-lg-block");
    			add_location(div10, file$1, 224, 16, 7622);
    			attr_dev(span3, "class", "navbar-toggler-icon");
    			add_location(span3, file$1, 243, 28, 9156);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "navbar-toggler");
    			attr_dev(button0, "data-toggle", "collapse");
    			attr_dev(button0, "data-target", "#navbarCollapse");
    			add_location(button0, file$1, 242, 24, 9028);
    			attr_dev(div11, "class", "text-decoration-none d-block d-lg-none");
    			add_location(div11, file$1, 248, 24, 9444);
    			attr_dev(a7, "href", "index.html");
    			attr_dev(a7, "class", "nav-item nav-link active");
    			add_location(a7, file$1, 260, 32, 10449);
    			attr_dev(a8, "href", "shop.html");
    			attr_dev(a8, "class", "nav-item nav-link");
    			add_location(a8, file$1, 261, 32, 10545);
    			attr_dev(a9, "href", "detail.html");
    			attr_dev(a9, "class", "nav-item nav-link");
    			add_location(a9, file$1, 262, 32, 10633);
    			attr_dev(i3, "class", "fa fa-angle-down mt-1");
    			add_location(i3, file$1, 264, 110, 10873);
    			attr_dev(a10, "href", "#");
    			attr_dev(a10, "class", "nav-link dropdown-toggle");
    			attr_dev(a10, "data-toggle", "dropdown");
    			add_location(a10, file$1, 264, 36, 10799);
    			attr_dev(a11, "href", "cart.html");
    			attr_dev(a11, "class", "dropdown-item");
    			add_location(a11, file$1, 266, 40, 11055);
    			attr_dev(a12, "href", "checkout.html");
    			attr_dev(a12, "class", "dropdown-item");
    			add_location(a12, file$1, 267, 40, 11156);
    			attr_dev(div12, "class", "dropdown-menu bg-primary rounded-0 border-0 m-0");
    			add_location(div12, file$1, 265, 36, 10952);
    			attr_dev(div13, "class", "nav-item dropdown");
    			add_location(div13, file$1, 263, 32, 10730);
    			attr_dev(a13, "href", "contact.html");
    			attr_dev(a13, "class", "nav-item nav-link");
    			add_location(a13, file$1, 270, 32, 11332);
    			attr_dev(div14, "class", "navbar-nav mr-auto py-0");
    			add_location(div14, file$1, 259, 28, 10378);
    			attr_dev(i4, "class", "fas fa-heart text-primary");
    			add_location(i4, file$1, 274, 36, 11614);
    			attr_dev(span4, "class", "badge text-secondary border border-secondary rounded-circle svelte-z8vot3");
    			set_style(span4, "padding-bottom", "2px");
    			add_location(span4, file$1, 275, 36, 11693);
    			attr_dev(a14, "href", "#");
    			attr_dev(a14, "class", "btn px-0");
    			add_location(a14, file$1, 273, 32, 11547);
    			attr_dev(i5, "class", "fas fa-shopping-cart text-primary");
    			add_location(i5, file$1, 278, 36, 12003);
    			attr_dev(span5, "class", "badge text-secondary border border-secondary rounded-circle svelte-z8vot3");
    			set_style(span5, "padding-bottom", "2px");
    			add_location(span5, file$1, 279, 36, 12090);
    			attr_dev(a15, "href", "#");
    			attr_dev(a15, "class", "btn px-0 ml-3");
    			attr_dev(a15, "data-toggle", "modal");
    			attr_dev(a15, "data-target", ".bd-example-modal-sm");
    			add_location(a15, file$1, 277, 32, 11876);
    			attr_dev(div15, "class", "navbar-nav ml-auto py-0 d-none d-lg-block");
    			add_location(div15, file$1, 272, 28, 11458);
    			attr_dev(div16, "class", "collapse navbar-collapse justify-content-between");
    			attr_dev(div16, "id", "navbarCollapse");
    			add_location(div16, file$1, 258, 24, 10266);
    			attr_dev(nav1, "class", "navbar-perfile navbar navbar-expand-lg bg-dark navbar-dark py-3 py-lg-0 px-0");
    			add_location(nav1, file$1, 241, 20, 8912);
    			attr_dev(div17, "class", "col-lg-9");
    			add_location(div17, file$1, 240, 16, 8868);
    			attr_dev(div18, "class", "row px-xl-5");
    			add_location(div18, file$1, 223, 12, 7579);
    			attr_dev(div19, "class", "container-fluid bg-dark mb-30");
    			add_location(div19, file$1, 222, 8, 7522);
    			attr_dev(li0, "data-target", "#header-carousel");
    			attr_dev(li0, "data-slide-to", "0");
    			attr_dev(li0, "class", "active");
    			add_location(li0, file$1, 296, 32, 12873);
    			attr_dev(li1, "data-target", "#header-carousel");
    			attr_dev(li1, "data-slide-to", "1");
    			add_location(li1, file$1, 297, 32, 12980);
    			attr_dev(li2, "data-target", "#header-carousel");
    			attr_dev(li2, "data-slide-to", "2");
    			add_location(li2, file$1, 298, 32, 13072);
    			attr_dev(ol, "class", "carousel-indicators");
    			add_location(ol, file$1, 295, 28, 12807);
    			attr_dev(img1, "class", "position-absolute w-100 h-100");
    			if (!src_url_equal(img1.src, img1_src_value = "img/carousel-1.jpg")) attr_dev(img1, "src", img1_src_value);
    			set_style(img1, "object-fit", "cover");
    			add_location(img1, file$1, 302, 36, 13370);
    			attr_dev(h10, "class", "display-4 text-white mb-3 animate__animated animate__fadeInDown");
    			add_location(h10, file$1, 305, 44, 13725);
    			attr_dev(p0, "class", "mx-md-5 px-5 animate__animated animate__bounceIn");
    			add_location(p0, file$1, 306, 44, 13864);
    			attr_dev(div20, "class", "p-3");
    			set_style(div20, "max-width", "700px");
    			add_location(div20, file$1, 304, 40, 13636);
    			attr_dev(div21, "class", "carousel-caption d-flex flex-column align-items-center justify-content-center");
    			add_location(div21, file$1, 303, 36, 13503);
    			attr_dev(div22, "class", "carousel-item position-relative active");
    			set_style(div22, "height", "220px");
    			add_location(div22, file$1, 301, 32, 13257);
    			attr_dev(img2, "class", "position-absolute w-100 h-100");
    			if (!src_url_equal(img2.src, img2_src_value = "img/carousel-2.jpg")) attr_dev(img2, "src", img2_src_value);
    			set_style(img2, "object-fit", "cover");
    			add_location(img2, file$1, 311, 36, 14257);
    			attr_dev(h11, "class", "display-4 text-white mb-3 animate__animated animate__fadeInDown");
    			add_location(h11, file$1, 314, 44, 14612);
    			attr_dev(p1, "class", "mx-md-5 px-5 animate__animated animate__bounceIn");
    			add_location(p1, file$1, 315, 44, 14752);
    			attr_dev(div23, "class", "p-3");
    			set_style(div23, "max-width", "700px");
    			add_location(div23, file$1, 313, 40, 14523);
    			attr_dev(div24, "class", "carousel-caption d-flex flex-column align-items-center justify-content-center");
    			add_location(div24, file$1, 312, 36, 14390);
    			attr_dev(div25, "class", "carousel-item position-relative");
    			set_style(div25, "height", "220px");
    			add_location(div25, file$1, 310, 32, 14151);
    			attr_dev(img3, "class", "position-absolute w-100 h-100");
    			if (!src_url_equal(img3.src, img3_src_value = "img/carousel-3.jpg")) attr_dev(img3, "src", img3_src_value);
    			set_style(img3, "object-fit", "cover");
    			add_location(img3, file$1, 320, 36, 15135);
    			attr_dev(h12, "class", "display-4 text-white mb-3 animate__animated animate__fadeInDown");
    			add_location(h12, file$1, 323, 44, 15490);
    			attr_dev(p2, "class", "mx-md-5 px-5 animate__animated animate__bounceIn");
    			add_location(p2, file$1, 324, 44, 15629);
    			attr_dev(div26, "class", "p-3");
    			set_style(div26, "max-width", "700px");
    			add_location(div26, file$1, 322, 40, 15401);
    			attr_dev(div27, "class", "carousel-caption d-flex flex-column align-items-center justify-content-center");
    			add_location(div27, file$1, 321, 36, 15268);
    			attr_dev(div28, "class", "carousel-item position-relative");
    			set_style(div28, "height", "220px");
    			add_location(div28, file$1, 319, 32, 15029);
    			attr_dev(div29, "class", "carousel-inner");
    			add_location(div29, file$1, 300, 28, 13195);
    			attr_dev(div30, "id", "header-carousel");
    			attr_dev(div30, "class", "carousel slide carousel-fade mb-30 mb-lg-0");
    			attr_dev(div30, "data-ride", "carousel");
    			add_location(div30, file$1, 294, 24, 12679);
    			attr_dev(div31, "class", "col-lg-12");
    			add_location(div31, file$1, 293, 20, 12630);
    			attr_dev(div32, "class", "row px-xl-4");
    			add_location(div32, file$1, 292, 16, 12583);
    			attr_dev(div33, "class", "container-fluid");
    			add_location(div33, file$1, 291, 12, 12536);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "placeholder", "Search for products");
    			add_location(input1, file$1, 338, 20, 16208);
    			attr_dev(i6, "class", "fa fa-search");
    			add_location(i6, file$1, 341, 28, 16535);
    			attr_dev(span6, "class", "input-group-text bg-transparent text-primary");
    			add_location(span6, file$1, 340, 24, 16446);
    			attr_dev(div34, "class", "input-group-append");
    			set_style(div34, "cursor", "pointer");
    			add_location(div34, file$1, 339, 20, 16340);
    			attr_dev(div35, "class", "input-group");
    			add_location(div35, file$1, 337, 16, 16161);
    			attr_dev(div36, "class", "col-lg-4 text-left buscadorMovil svelte-z8vot3");
    			add_location(div36, file$1, 336, 12, 16096);
    			attr_dev(span7, "class", "bg-secondary pr-3");
    			add_location(span7, file$1, 349, 88, 16821);
    			attr_dev(h2, "class", "section-title position-relative text-uppercase mx-xl-5 mb-4");
    			add_location(h2, file$1, 349, 16, 16749);
    			attr_dev(div37, "class", "row px-xl-5 pb-3");
    			add_location(div37, file$1, 350, 16, 16890);
    			attr_dev(div38, "class", "container-fluid");
    			add_location(div38, file$1, 347, 12, 16684);
    			attr_dev(div39, "class", "content-page svelte-z8vot3");
    			add_location(div39, file$1, 289, 8, 12455);
    			attr_dev(i7, "class", "fas fa-shopping-cart");
    			set_style(i7, "color", "red");
    			set_style(i7, "font-size", "15px");
    			add_location(i7, file$1, 377, 78, 18349);
    			set_style(span8, "padding-bottom", "2px");
    			set_style(span8, "color", "red");
    			set_style(span8, "font-size", "10px");
    			add_location(span8, file$1, 377, 16, 18287);
    			attr_dev(a16, "href", "#");
    			attr_dev(a16, "class", "btn px-0 ");
    			set_style(a16, "margin-left", "3px");
    			attr_dev(a16, "data-toggle", "modal");
    			attr_dev(a16, "data-target", ".bd-example-modal-sm");
    			add_location(a16, file$1, 376, 12, 18156);
    			if (!src_url_equal(img4.src, img4_src_value = "img/scanner.png")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "");
    			attr_dev(img4, "width", "25");
    			attr_dev(img4, "height", "25");
    			add_location(img4, file$1, 380, 16, 18577);
    			attr_dev(a17, "href", "#");
    			attr_dev(a17, "class", "btn px-0 ");
    			set_style(a17, "margin-left", "3px");
    			add_location(a17, file$1, 379, 12, 18476);
    			attr_dev(div40, "class", "card back-to-card bg-dark svelte-z8vot3");
    			add_location(div40, file$1, 375, 8, 18102);
    			attr_dev(img5, "class", "rounded-circle svelte-z8vot3");
    			if (!src_url_equal(img5.src, img5_src_value = "img/goeat.png")) attr_dev(img5, "src", img5_src_value);
    			add_location(img5, file$1, 390, 24, 19033);
    			attr_dev(div41, "class", "modal-header-singIn svelte-z8vot3");
    			add_location(div41, file$1, 389, 20, 18974);
    			attr_dev(h50, "class", "mt-1 mb-4 svelte-z8vot3");
    			set_style(h50, "text-align", "center");
    			add_location(h50, file$1, 394, 24, 19205);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control input-sign svelte-z8vot3");
    			attr_dev(input2, "id", "recipient-name");
    			attr_dev(input2, "placeholder", "Usuario");
    			add_location(input2, file$1, 397, 32, 19393);
    			attr_dev(div42, "class", "mb-4 mt-1");
    			add_location(div42, file$1, 396, 28, 19336);
    			add_location(br, file$1, 398, 36, 19551);
    			attr_dev(input3, "type", "password");
    			attr_dev(input3, "class", "form-control input-sign svelte-z8vot3");
    			attr_dev(input3, "id", "recipient-name");
    			attr_dev(input3, "placeholder", "Contraseña");
    			add_location(input3, file$1, 400, 30, 19640);
    			attr_dev(div43, "class", "mb-4 mt-1");
    			add_location(div43, file$1, 399, 28, 19585);
    			add_location(form0, file$1, 395, 24, 19300);
    			attr_dev(i8, "class", "fas fa-sign-in ml-1");
    			add_location(i8, file$1, 404, 120, 20048);
    			attr_dev(button1, "type", "submit");
    			attr_dev(button1, "class", "btn btn-cyan mt-1 svelte-z8vot3");
    			attr_dev(button1, "data-dismiss", "modal");
    			add_location(button1, file$1, 404, 28, 19956);
    			attr_dev(div44, "class", "text-center mt-4 mb-4 svelte-z8vot3");
    			set_style(div44, "margin-top", "9px");
    			add_location(div44, file$1, 403, 26, 19866);
    			attr_dev(div45, "class", "modal-body");
    			add_location(div45, file$1, 393, 20, 19155);
    			attr_dev(div46, "class", "modal-content-singIn svelte-z8vot3");
    			add_location(div46, file$1, 388, 16, 18918);
    			attr_dev(div47, "class", "modal-dialog modal-sm svelte-z8vot3");
    			add_location(div47, file$1, 387, 12, 18865);
    			attr_dev(div48, "class", "modal fade bd-example-modal-sigIn");
    			attr_dev(div48, "tabindex", "-1");
    			attr_dev(div48, "role", "dialog");
    			attr_dev(div48, "aria-labelledby", "mySmallModalLabel");
    			attr_dev(div48, "aria-hidden", "true");
    			set_style(div48, "padding-top", "80px");
    			add_location(div48, file$1, 386, 8, 18694);
    			attr_dev(img6, "class", "rounded-circle svelte-z8vot3");
    			if (!src_url_equal(img6.src, img6_src_value = "img/goeat.png")) attr_dev(img6, "src", img6_src_value);
    			add_location(img6, file$1, 416, 24, 20576);
    			attr_dev(div49, "class", "modal-header-singIn svelte-z8vot3");
    			add_location(div49, file$1, 415, 20, 20517);
    			attr_dev(h51, "class", "mt-1 mb-4 svelte-z8vot3");
    			set_style(h51, "text-align", "center");
    			add_location(h51, file$1, 420, 24, 20748);
    			attr_dev(input4, "type", "email");
    			attr_dev(input4, "class", "form-control input-sign svelte-z8vot3");
    			attr_dev(input4, "id", "recipient-name");
    			attr_dev(input4, "placeholder", "Nombre");
    			add_location(input4, file$1, 423, 32, 20941);
    			attr_dev(div50, "class", "mb-4 mt-1");
    			add_location(div50, file$1, 422, 28, 20884);
    			attr_dev(input5, "type", "email");
    			attr_dev(input5, "class", "form-control input-sign svelte-z8vot3");
    			attr_dev(input5, "id", "recipient-name");
    			attr_dev(input5, "placeholder", "Email");
    			add_location(input5, file$1, 426, 30, 21185);
    			attr_dev(div51, "class", "mb-4 mt-1");
    			add_location(div51, file$1, 425, 28, 21130);
    			attr_dev(input6, "type", "text");
    			attr_dev(input6, "class", "form-control input-sign svelte-z8vot3");
    			attr_dev(input6, "id", "recipient-name");
    			attr_dev(input6, "placeholder", "Phone");
    			add_location(input6, file$1, 429, 30, 21422);
    			attr_dev(div52, "class", "mb-4 mt-1");
    			add_location(div52, file$1, 428, 28, 21367);
    			add_location(form1, file$1, 421, 24, 20848);
    			attr_dev(i9, "class", "fas fa-sign-in ml-1");
    			add_location(i9, file$1, 433, 122, 21796);
    			attr_dev(button2, "type", "submit");
    			attr_dev(button2, "class", "btn btn-cyan mt-1 svelte-z8vot3");
    			attr_dev(button2, "data-dismiss", "modal");
    			add_location(button2, file$1, 433, 28, 21702);
    			attr_dev(span9, "class", "alert-register svelte-z8vot3");
    			add_location(span9, file$1, 434, 28, 21870);
    			attr_dev(div53, "class", "text-center mt-4 mb-4 svelte-z8vot3");
    			add_location(div53, file$1, 432, 26, 21637);
    			attr_dev(div54, "class", "modal-body");
    			add_location(div54, file$1, 419, 20, 20698);
    			attr_dev(div55, "class", "modal-content-singIn svelte-z8vot3");
    			add_location(div55, file$1, 414, 16, 20461);
    			attr_dev(div56, "class", "modal-dialog modal-sm svelte-z8vot3");
    			add_location(div56, file$1, 413, 12, 20408);
    			attr_dev(div57, "class", "modal fade bd-example-modal-register");
    			attr_dev(div57, "tabindex", "-1");
    			attr_dev(div57, "role", "dialog");
    			attr_dev(div57, "aria-labelledby", "mySmallModalLabel");
    			attr_dev(div57, "aria-hidden", "true");
    			set_style(div57, "padding-top", "80px");
    			add_location(div57, file$1, 412, 8, 20234);
    			if (!src_url_equal(img7.src, img7_src_value = "img/goeat.png")) attr_dev(img7, "src", img7_src_value);
    			attr_dev(img7, "width", "40");
    			attr_dev(img7, "height", "40");
    			add_location(img7, file$1, 447, 72, 22512);
    			attr_dev(h52, "class", "modal-title svelte-z8vot3");
    			attr_dev(h52, "id", "exampleModalLabel");
    			add_location(h52, file$1, 447, 24, 22464);
    			attr_dev(span10, "aria-hidden", "true");
    			add_location(span10, file$1, 449, 24, 22701);
    			attr_dev(button3, "type", "button");
    			attr_dev(button3, "class", "close");
    			attr_dev(button3, "data-dismiss", "modal");
    			attr_dev(button3, "aria-label", "Close");
    			add_location(button3, file$1, 448, 24, 22599);
    			attr_dev(div58, "class", "modal-header");
    			add_location(div58, file$1, 446, 20, 22412);
    			attr_dev(div59, "class", "row px-xl-5 pb-3");
    			attr_dev(div59, "style", div59_style_value = "overflow: auto; " + (/*product*/ ctx[7].length > 0 ? 'height: 250px;' : ''));
    			add_location(div59, file$1, 454, 28, 22895);
    			attr_dev(div60, "class", "modal-body");
    			add_location(div60, file$1, 452, 20, 22825);
    			add_location(strong0, file$1, 478, 63, 24570);
    			attr_dev(span11, "class", "span-primary svelte-z8vot3");
    			add_location(span11, file$1, 478, 36, 24543);
    			add_location(td0, file$1, 477, 32, 24501);
    			add_location(strong1, file$1, 481, 63, 24742);
    			attr_dev(span12, "class", "span-primary svelte-z8vot3");
    			add_location(span12, file$1, 481, 36, 24715);
    			add_location(td1, file$1, 480, 32, 24673);
    			add_location(tr0, file$1, 476, 28, 24463);
    			set_style(tbody0, "line-height", "normal");
    			add_location(tbody0, file$1, 475, 24, 24399);
    			attr_dev(button4, "type", "button");
    			attr_dev(button4, "class", "btn btn-primary btn-car svelte-z8vot3");
    			attr_dev(button4, "data-dismiss", "modal");
    			add_location(button4, file$1, 485, 24, 24962);
    			attr_dev(div61, "class", "modal-footer");
    			add_location(div61, file$1, 474, 20, 24347);
    			attr_dev(div62, "class", "modal-content");
    			add_location(div62, file$1, 445, 16, 22363);
    			attr_dev(div63, "class", "modal-dialog modal-xl");
    			add_location(div63, file$1, 444, 12, 22310);
    			attr_dev(div64, "class", "modal fade bd-example-modal-sm");
    			attr_dev(div64, "tabindex", "-1");
    			attr_dev(div64, "role", "dialog");
    			attr_dev(div64, "aria-labelledby", "mySmallModalLabel");
    			attr_dev(div64, "aria-hidden", "true");
    			add_location(div64, file$1, 443, 8, 22169);
    			attr_dev(h53, "class", "modal-title svelte-z8vot3");
    			attr_dev(h53, "id", "exampleModalLabel");
    			add_location(h53, file$1, 495, 24, 25470);
    			attr_dev(span13, "aria-hidden", "true");
    			add_location(span13, file$1, 497, 24, 25667);
    			attr_dev(button5, "type", "button");
    			attr_dev(button5, "class", "close");
    			attr_dev(button5, "data-dismiss", "modal");
    			attr_dev(button5, "aria-label", "Close");
    			add_location(button5, file$1, 496, 24, 25565);
    			attr_dev(div65, "class", "modal-header");
    			add_location(div65, file$1, 494, 20, 25418);
    			attr_dev(div66, "class", "row px-xl-5 pb-3");
    			set_style(div66, "overflow", "auto");
    			set_style(div66, "height", "290px");
    			add_location(div66, file$1, 502, 28, 25861);
    			attr_dev(div67, "class", "modal-body");
    			add_location(div67, file$1, 500, 20, 25791);
    			add_location(strong2, file$1, 527, 93, 27701);
    			attr_dev(span14, "class", "span-primary svelte-z8vot3");
    			set_style(span14, "padding", "0");
    			set_style(span14, "margin", "0");
    			add_location(span14, file$1, 527, 36, 27644);
    			add_location(td2, file$1, 526, 32, 27602);
    			attr_dev(span15, "class", "span-primary svelte-z8vot3");
    			set_style(span15, "padding", "0");
    			set_style(span15, "margin", "0");
    			add_location(span15, file$1, 530, 36, 27845);
    			add_location(td3, file$1, 529, 32, 27803);
    			set_style(tr1, "padding", "0");
    			set_style(tr1, "margin", "0");
    			add_location(tr1, file$1, 525, 28, 27534);
    			add_location(strong3, file$1, 537, 63, 28169);
    			attr_dev(span16, "class", "span-primary svelte-z8vot3");
    			add_location(span16, file$1, 537, 36, 28142);
    			add_location(td4, file$1, 536, 32, 28100);
    			add_location(strong4, file$1, 540, 63, 28341);
    			attr_dev(span17, "class", "span-primary svelte-z8vot3");
    			add_location(span17, file$1, 540, 36, 28314);
    			add_location(td5, file$1, 539, 32, 28272);
    			add_location(tr2, file$1, 535, 28, 28062);
    			set_style(tbody1, "line-height", "normal");
    			add_location(tbody1, file$1, 524, 24, 27470);
    			attr_dev(button6, "type", "button");
    			attr_dev(button6, "class", "btn btn-primary btn-car svelte-z8vot3");
    			add_location(button6, file$1, 544, 24, 28550);
    			attr_dev(div68, "class", "modal-footer");
    			add_location(div68, file$1, 523, 20, 27418);
    			attr_dev(div69, "class", "modal-content");
    			add_location(div69, file$1, 493, 16, 25369);
    			attr_dev(div70, "class", "modal-dialog modal-xl");
    			add_location(div70, file$1, 492, 12, 25316);
    			attr_dev(div71, "class", "modal fade bd-model");
    			attr_dev(div71, "tabindex", "-1");
    			attr_dev(div71, "role", "dialog");
    			attr_dev(div71, "aria-labelledby", "mySmallModalLabel");
    			attr_dev(div71, "aria-hidden", "true");
    			add_location(div71, file$1, 491, 8, 25186);
    			attr_dev(body, "class", "svelte-z8vot3");
    			add_location(body, file$1, 185, 4, 5674);
    			add_location(main, file$1, 183, 0, 5660);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, body);
    			mount_component(toaster, body, null);
    			append_dev(body, t0);
    			append_dev(body, div0);
    			append_dev(body, t1);
    			append_dev(body, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div1);
    			append_dev(div1, img0);
    			append_dev(div1, t2);
    			append_dev(div1, a0);
    			append_dev(a0, span0);
    			append_dev(a0, t4);
    			append_dev(a0, span1);
    			append_dev(div6, t6);
    			append_dev(div6, div4);
    			append_dev(div4, div3);
    			append_dev(div3, input0);
    			set_input_value(input0, /*products*/ ctx[3].filters.name);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, span2);
    			append_dev(span2, i0);
    			append_dev(div6, t8);
    			append_dev(div6, div5);
    			if_block0.m(div5, null);
    			append_dev(body, t9);
    			append_dev(body, div19);
    			append_dev(div19, div18);
    			append_dev(div18, div10);
    			append_dev(div10, a1);
    			append_dev(a1, h6);
    			append_dev(h6, i1);
    			append_dev(h6, t10);
    			append_dev(a1, t11);
    			append_dev(a1, i2);
    			append_dev(div10, t12);
    			append_dev(div10, nav0);
    			append_dev(nav0, div9);
    			append_dev(div9, div8);
    			append_dev(div8, a2);
    			append_dev(div8, t14);
    			append_dev(div8, a3);
    			append_dev(div8, t16);
    			append_dev(div8, a4);
    			append_dev(div8, t18);
    			append_dev(div8, a5);
    			append_dev(div8, t20);
    			append_dev(div8, a6);
    			append_dev(div18, t22);
    			append_dev(div18, div17);
    			append_dev(div17, nav1);
    			append_dev(nav1, button0);
    			append_dev(button0, span3);
    			append_dev(nav1, t23);
    			if (if_block1) if_block1.m(nav1, null);
    			append_dev(nav1, t24);
    			append_dev(nav1, div11);
    			if_block2.m(div11, null);
    			append_dev(nav1, t25);
    			append_dev(nav1, div16);
    			append_dev(div16, div14);
    			append_dev(div14, a7);
    			append_dev(div14, t27);
    			append_dev(div14, a8);
    			append_dev(div14, t29);
    			append_dev(div14, a9);
    			append_dev(div14, t31);
    			append_dev(div14, div13);
    			append_dev(div13, a10);
    			append_dev(a10, t32);
    			append_dev(a10, i3);
    			append_dev(div13, t33);
    			append_dev(div13, div12);
    			append_dev(div12, a11);
    			append_dev(div12, t35);
    			append_dev(div12, a12);
    			append_dev(div14, t37);
    			append_dev(div14, a13);
    			append_dev(div16, t39);
    			append_dev(div16, div15);
    			append_dev(div15, a14);
    			append_dev(a14, i4);
    			append_dev(a14, t40);
    			append_dev(a14, span4);
    			append_dev(div15, t42);
    			append_dev(div15, a15);
    			append_dev(a15, i5);
    			append_dev(a15, t43);
    			append_dev(a15, span5);
    			append_dev(span5, t44);
    			append_dev(body, t45);
    			append_dev(body, div39);
    			append_dev(div39, div33);
    			append_dev(div33, div32);
    			append_dev(div32, div31);
    			append_dev(div31, div30);
    			append_dev(div30, ol);
    			append_dev(ol, li0);
    			append_dev(ol, t46);
    			append_dev(ol, li1);
    			append_dev(ol, t47);
    			append_dev(ol, li2);
    			append_dev(div30, t48);
    			append_dev(div30, div29);
    			append_dev(div29, div22);
    			append_dev(div22, img1);
    			append_dev(div22, t49);
    			append_dev(div22, div21);
    			append_dev(div21, div20);
    			append_dev(div20, h10);
    			append_dev(div20, t51);
    			append_dev(div20, p0);
    			append_dev(div29, t53);
    			append_dev(div29, div25);
    			append_dev(div25, img2);
    			append_dev(div25, t54);
    			append_dev(div25, div24);
    			append_dev(div24, div23);
    			append_dev(div23, h11);
    			append_dev(div23, t56);
    			append_dev(div23, p1);
    			append_dev(div29, t58);
    			append_dev(div29, div28);
    			append_dev(div28, img3);
    			append_dev(div28, t59);
    			append_dev(div28, div27);
    			append_dev(div27, div26);
    			append_dev(div26, h12);
    			append_dev(div26, t61);
    			append_dev(div26, p2);
    			append_dev(div39, t63);
    			append_dev(div39, div36);
    			append_dev(div36, div35);
    			append_dev(div35, input1);
    			set_input_value(input1, /*products*/ ctx[3].filters.name);
    			append_dev(div35, t64);
    			append_dev(div35, div34);
    			append_dev(div34, span6);
    			append_dev(span6, i6);
    			append_dev(div39, t65);
    			append_dev(div39, div38);
    			append_dev(div38, h2);
    			append_dev(h2, span7);
    			append_dev(div38, t67);
    			append_dev(div38, div37);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				if (each_blocks_2[i]) {
    					each_blocks_2[i].m(div37, null);
    				}
    			}

    			append_dev(body, t68);
    			append_dev(body, div40);
    			append_dev(div40, a16);
    			append_dev(a16, span8);
    			append_dev(span8, i7);
    			append_dev(span8, t69);
    			append_dev(div40, t70);
    			append_dev(div40, a17);
    			append_dev(a17, img4);
    			append_dev(body, t71);
    			append_dev(body, div48);
    			append_dev(div48, div47);
    			append_dev(div47, div46);
    			append_dev(div46, div41);
    			append_dev(div41, img5);
    			append_dev(div46, t72);
    			append_dev(div46, div45);
    			append_dev(div45, h50);
    			append_dev(div45, t74);
    			append_dev(div45, form0);
    			append_dev(form0, div42);
    			append_dev(div42, input2);
    			set_input_value(input2, /*user*/ ctx[6].username);
    			append_dev(div42, t75);
    			append_dev(form0, br);
    			append_dev(form0, t76);
    			append_dev(form0, div43);
    			append_dev(div43, input3);
    			set_input_value(input3, /*user*/ ctx[6].password);
    			append_dev(div45, t77);
    			append_dev(div45, div44);
    			append_dev(div44, button1);
    			append_dev(button1, t78);
    			append_dev(button1, i8);
    			append_dev(body, t79);
    			append_dev(body, div57);
    			append_dev(div57, div56);
    			append_dev(div56, div55);
    			append_dev(div55, div49);
    			append_dev(div49, img6);
    			append_dev(div55, t80);
    			append_dev(div55, div54);
    			append_dev(div54, h51);
    			append_dev(div54, t82);
    			append_dev(div54, form1);
    			append_dev(form1, div50);
    			append_dev(div50, input4);
    			set_input_value(input4, /*user*/ ctx[6].firstname);
    			append_dev(form1, t83);
    			append_dev(form1, div51);
    			append_dev(div51, input5);
    			set_input_value(input5, /*user*/ ctx[6].email);
    			append_dev(form1, t84);
    			append_dev(form1, div52);
    			append_dev(div52, input6);
    			set_input_value(input6, /*user*/ ctx[6].phone);
    			append_dev(div54, t85);
    			append_dev(div54, div53);
    			append_dev(div53, button2);
    			append_dev(button2, t86);
    			append_dev(button2, i9);
    			append_dev(div53, t87);
    			append_dev(div53, span9);
    			append_dev(body, t89);
    			append_dev(body, div64);
    			append_dev(div64, div63);
    			append_dev(div63, div62);
    			append_dev(div62, div58);
    			append_dev(div58, h52);
    			append_dev(h52, img7);
    			append_dev(h52, t90);
    			append_dev(div58, t91);
    			append_dev(div58, button3);
    			append_dev(button3, span10);
    			append_dev(div62, t93);
    			append_dev(div62, div60);
    			append_dev(div60, div59);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(div59, null);
    				}
    			}

    			append_dev(div62, t94);
    			append_dev(div62, div61);
    			append_dev(div61, tbody0);
    			append_dev(tbody0, tr0);
    			append_dev(tr0, td0);
    			append_dev(td0, span11);
    			append_dev(span11, strong0);
    			append_dev(tr0, t96);
    			append_dev(tr0, td1);
    			append_dev(td1, span12);
    			append_dev(span12, strong1);
    			append_dev(strong1, t97);
    			append_dev(strong1, t98);
    			append_dev(strong1, t99);
    			append_dev(div61, t100);
    			append_dev(div61, button4);
    			append_dev(body, t102);
    			append_dev(body, div71);
    			append_dev(div71, div70);
    			append_dev(div70, div69);
    			append_dev(div69, div65);
    			append_dev(div65, h53);
    			append_dev(div65, t104);
    			append_dev(div65, button5);
    			append_dev(button5, span13);
    			append_dev(div69, t106);
    			append_dev(div69, div67);
    			append_dev(div67, div66);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div66, null);
    				}
    			}

    			append_dev(div69, t107);
    			append_dev(div69, div68);
    			append_dev(div68, tbody1);
    			append_dev(tbody1, tr1);
    			append_dev(tr1, td2);
    			append_dev(td2, span14);
    			append_dev(span14, strong2);
    			append_dev(tr1, t109);
    			append_dev(tr1, td3);
    			append_dev(td3, span15);
    			append_dev(tbody1, t111);
    			append_dev(tbody1, tr2);
    			append_dev(tr2, td4);
    			append_dev(td4, span16);
    			append_dev(span16, strong3);
    			append_dev(tr2, t113);
    			append_dev(tr2, td5);
    			append_dev(td5, span17);
    			append_dev(span17, strong4);
    			append_dev(div68, t115);
    			append_dev(div68, button6);
    			append_dev(body, t117);
    			if (if_block3) if_block3.m(body, null);
    			append_dev(body, t118);
    			if (if_block4) if_block4.m(body, null);
    			append_dev(body, t119);
    			if (if_block5) if_block5.m(body, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[17]),
    					listen_dev(input0, "keypress", /*prepareSearch*/ ctx[15], false, false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[18]),
    					listen_dev(div34, "click", /*getProducts*/ ctx[10], false, false, false, false),
    					listen_dev(a17, "click", /*scannerActive*/ ctx[9], false, false, false, false),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[20]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[21]),
    					listen_dev(button1, "click", /*singIn*/ ctx[13], false, false, false, false),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[22]),
    					listen_dev(input5, "input", /*input5_input_handler*/ ctx[23]),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[24]),
    					listen_dev(button2, "click", /*save*/ ctx[12], false, false, false, false),
    					listen_dev(button4, "click", /*paymentProceed*/ ctx[16], false, false, false, false),
    					listen_dev(button6, "click", /*click_handler_2*/ ctx[26], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*products*/ 8 && input0.value !== /*products*/ ctx[3].filters.name) {
    				set_input_value(input0, /*products*/ ctx[3].filters.name);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div5, null);
    				}
    			}

    			if (/*token*/ ctx[8]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					if_block1.m(nav1, t24);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type_1(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(div11, null);
    				}
    			}

    			if ((!current || dirty[0] & /*product*/ 128) && t44_value !== (t44_value = /*product*/ ctx[7].length + "")) set_data_dev(t44, t44_value);

    			if (dirty[0] & /*products*/ 8 && input1.value !== /*products*/ ctx[3].filters.name) {
    				set_input_value(input1, /*products*/ ctx[3].filters.name);
    			}

    			if (dirty[0] & /*addProduct, products*/ 16392) {
    				each_value_2 = /*products*/ ctx[3].list;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(div37, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if ((!current || dirty[0] & /*product*/ 128) && t69_value !== (t69_value = /*product*/ ctx[7].length + "")) set_data_dev(t69, t69_value);

    			if (dirty[0] & /*user*/ 64 && input2.value !== /*user*/ ctx[6].username) {
    				set_input_value(input2, /*user*/ ctx[6].username);
    			}

    			if (dirty[0] & /*user*/ 64 && input3.value !== /*user*/ ctx[6].password) {
    				set_input_value(input3, /*user*/ ctx[6].password);
    			}

    			if (dirty[0] & /*user*/ 64 && input4.value !== /*user*/ ctx[6].firstname) {
    				set_input_value(input4, /*user*/ ctx[6].firstname);
    			}

    			if (dirty[0] & /*user*/ 64 && input5.value !== /*user*/ ctx[6].email) {
    				set_input_value(input5, /*user*/ ctx[6].email);
    			}

    			if (dirty[0] & /*user*/ 64 && input6.value !== /*user*/ ctx[6].phone) {
    				set_input_value(input6, /*user*/ ctx[6].phone);
    			}

    			if (dirty[0] & /*product*/ 128) {
    				each_value_1 = /*product*/ ctx[7];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div59, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (!current || dirty[0] & /*product*/ 128 && div59_style_value !== (div59_style_value = "overflow: auto; " + (/*product*/ ctx[7].length > 0 ? 'height: 250px;' : ''))) {
    				attr_dev(div59, "style", div59_style_value);
    			}

    			if (!current || dirty[0] & /*totalMoney*/ 32) set_data_dev(t98, /*totalMoney*/ ctx[5]);

    			if (dirty[0] & /*addProduct, productScanner*/ 16400) {
    				each_value = /*productScanner*/ ctx[4].list;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div66, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*gameActive*/ ctx[1]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block_2(ctx);
    					if_block3.c();
    					if_block3.m(body, t118);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (/*gameOpen*/ ctx[0] == true) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);
    				} else {
    					if_block4 = create_if_block_1(ctx);
    					if_block4.c();
    					if_block4.m(body, t119);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (/*gameOpencasine*/ ctx[2] == true) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);
    				} else {
    					if_block5 = create_if_block(ctx);
    					if_block5.c();
    					if_block5.m(body, null);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toaster.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toaster.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(toaster);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			if_block2.d();
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);
    	let gameOpen = false;
    	let gameActive = false;
    	let gameOpencasine = false;

    	let products = {
    		list: [
    			{
    				name: 'Capuchino',
    				photo: 'img/cat-25.png',
    				totalmoney: 10
    			},
    			{
    				name: 'Cafe Warmin',
    				photo: 'img/cat-20.png',
    				totalmoney: 12
    			},
    			{
    				name: 'Juane de Gallina',
    				photo: 'img/cat-38.png',
    				totalmoney: 12
    			},
    			{
    				name: 'Corona',
    				photo: 'img/cat-42.png',
    				totalmoney: 12
    			},
    			{
    				name: 'Torta tres Leches',
    				photo: 'img/cat-39.png',
    				totalmoney: 12
    			},
    			{
    				name: 'Alistas a la Barbiquiu',
    				photo: 'img/cat-21.png',
    				totalmoney: 12
    			}
    		],
    		pages: [],
    		filters: {}
    	};

    	let productScanner = { list: [], pages: [], filters: {} };
    	let totalMoney = 0;

    	let categories = [
    		"ALITAS",
    		"SANDWICHES",
    		"POSTRES",
    		"LUNCH",
    		"BOCADILLOS",
    		"COMPLEMENTOS",
    		"BEBIDAS",
    		"HAMBURGUESA",
    		"GUARNICION"
    	];

    	let user = {};

    	//Dynamsoft.DBR.BarcodeReader.license = "DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ==";
    	let scanner = null;

    	let product = [];
    	let token;

    	let inforQR = {
    		organization: "Sazon del Pato",
    		tables: 1,
    		code: "CO-0001"
    	};

    	let qr = QRCode(0, 'L');
    	qr.addData(JSON.stringify(inforQR));
    	qr.make();

    	const scannerActive = async () => {
    		try {
    			await Dynamsoft.DBR.BarcodeScanner.loadWasm();
    			await initBarcodeScanner();
    		} catch(ex) {
    			alert(ex.message);
    			throw ex;
    		}
    	};

    	async function initBarcodeScanner() {
    		scanner = await Dynamsoft.DBR.BarcodeScanner.createInstance();

    		scanner.onFrameRead = results => {
    			console.log(results);

    			for (let result of results) {
    				resultscanner(result);
    			}
    		};

    		scanner.onUnduplicatedRead = (txt, result) => {
    			
    		};

    		await scanner.show();
    	}

    	const resultscanner = async result => {
    		console.log("result", result.barcodeText);
    		result.barcodeText;
    		let vulea = '{"organization":"Sazon del Pato","tables":1,"code":"CO-0001"}';
    		let parsedBody = JSON.parse(vulea);
    		$$invalidate(3, products.filters = { ...parsedBody }, products);
    		var data = await ServerConnection.getproductos(products.filters);
    		$$invalidate(4, productScanner.xpagina = data.xpagina, productScanner);
    		$$invalidate(4, productScanner.pagina = data.pagina, productScanner);
    		$$invalidate(4, productScanner.total = data.total, productScanner);
    		$$invalidate(4, productScanner.list = data.list, productScanner);
    		window.$(".bd-model").modal("show");
    	};

    	function showQRCode() {
    		let qrCodeElement = document.getElementById('qrcode');
    		qrCodeElement.innerHTML = qr.createImgTag(4);
    	}

    	onMount(async () => {
    		$$invalidate(8, token = sessionStorage.getItem("token"));
    		await getProducts();
    	}); //showQRCode();

    	const getProducts = async () => {
    		try {
    			var data = await ServerConnection.getproductos(products.filters);
    			$$invalidate(3, products.xpagina = data.xpagina, products);
    			$$invalidate(3, products.pagina = data.pagina, products);
    			$$invalidate(3, products.total = data.total, products);
    			$$invalidate(3, products.list = data.list, products);
    		} catch(e) {
    			toast('Hello Darkness!', {
    				icon: '👏',
    				style: 'border-radius: 200px; background: #333; color: #fff;'
    			});
    		}
    	};

    	const singOut = () => {
    		sessionStorage.clear("token");
    		sessionStorage.clear("username");
    		window.location.reload();
    	};

    	const save = async () => {
    		try {
    			var data = await ServerConnection.saveUser(user);
    			console.log("user", data);

    			if (data.user_id) {
    				toast.success("Registro Exitoso");
    			}
    		} catch(e) {
    			toast.error("Error al registrar" + e);
    		}
    	};

    	const singIn = async () => {
    		try {
    			var data = await ServerConnection.singIn(user);
    			sessionStorage.setItem("token", data.token);
    			sessionStorage.setItem("username", data.username);

    			if (data) {
    				window.location.reload();
    			}
    		} catch(e) {
    			toast.error("Error al Inisiar sesion" + e);
    		}
    	};

    	function addProduct(value) {
    		$$invalidate(7, product = [...product, value]);
    		console.log(product);
    		calculatePrice(product);
    	}

    	function calculatePrice(product) {
    		$$invalidate(5, totalMoney = 0);

    		product.forEach(element => {
    			$$invalidate(5, totalMoney += element.totalmoney);
    		});
    	}

    	const prepareSearch = e => {
    		if (e.charCode === 13) {
    			getProducts();
    		}
    	};

    	const paymentProceed = () => {
    		toast("GAME: Para ganar premios y ofertas. compite y acomula puntos jugando con nosotros", {
    			icon: '👏',
    			style: ' background: #333; color: #fff;background-image: url("img/anuncio.avif");width:100%;height:70px; background-repeat: no-repeat, repeat; background-position: center;'
    		});

    		$$invalidate(1, gameActive = true);
    	};

    	const onRegister = () => {
    		showRegister = true;
    	};

    	const register = async () => {
    		validateInputs();
    	};

    	const onRegisterCancel = () => {
    		showRegister = false;
    	};

    	const validateInputs = () => {
    		if (!email) return alert("Ingrese un correo válido");

    		if (!phone) return alert("Ingrese teléfono válido"); else {
    			alert("registro pendiente");
    			onRegisterCancel();
    			location.reload();
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		products.filters.name = this.value;
    		$$invalidate(3, products);
    	}

    	function input1_input_handler() {
    		products.filters.name = this.value;
    		$$invalidate(3, products);
    	}

    	const click_handler = value => {
    		addProduct(value);
    	};

    	function input2_input_handler() {
    		user.username = this.value;
    		$$invalidate(6, user);
    	}

    	function input3_input_handler() {
    		user.password = this.value;
    		$$invalidate(6, user);
    	}

    	function input4_input_handler() {
    		user.firstname = this.value;
    		$$invalidate(6, user);
    	}

    	function input5_input_handler() {
    		user.email = this.value;
    		$$invalidate(6, user);
    	}

    	function input6_input_handler() {
    		user.phone = this.value;
    		$$invalidate(6, user);
    	}

    	const click_handler_1 = value => {
    		addProduct(value);
    	};

    	const click_handler_2 = () => {
    		location.reload();
    	};

    	const click_handler_3 = () => {
    		$$invalidate(0, gameOpen = true);
    	};

    	const click_handler_4 = () => {
    		$$invalidate(2, gameOpencasine = true);
    	};

    	const click_handler_5 = () => {
    		$$invalidate(0, gameOpen = false);
    	};

    	const click_handler_6 = () => {
    		$$invalidate(2, gameOpencasine = false);
    	};

    	$$self.$capture_state = () => ({
    		toast,
    		Toaster,
    		onMount,
    		server: ServerConnection,
    		QRCode,
    		gameOpen,
    		gameActive,
    		gameOpencasine,
    		products,
    		productScanner,
    		totalMoney,
    		categories,
    		user,
    		scanner,
    		product,
    		token,
    		inforQR,
    		qr,
    		scannerActive,
    		initBarcodeScanner,
    		resultscanner,
    		showQRCode,
    		getProducts,
    		singOut,
    		save,
    		singIn,
    		addProduct,
    		calculatePrice,
    		prepareSearch,
    		paymentProceed,
    		onRegister,
    		register,
    		onRegisterCancel,
    		validateInputs
    	});

    	$$self.$inject_state = $$props => {
    		if ('gameOpen' in $$props) $$invalidate(0, gameOpen = $$props.gameOpen);
    		if ('gameActive' in $$props) $$invalidate(1, gameActive = $$props.gameActive);
    		if ('gameOpencasine' in $$props) $$invalidate(2, gameOpencasine = $$props.gameOpencasine);
    		if ('products' in $$props) $$invalidate(3, products = $$props.products);
    		if ('productScanner' in $$props) $$invalidate(4, productScanner = $$props.productScanner);
    		if ('totalMoney' in $$props) $$invalidate(5, totalMoney = $$props.totalMoney);
    		if ('categories' in $$props) categories = $$props.categories;
    		if ('user' in $$props) $$invalidate(6, user = $$props.user);
    		if ('scanner' in $$props) scanner = $$props.scanner;
    		if ('product' in $$props) $$invalidate(7, product = $$props.product);
    		if ('token' in $$props) $$invalidate(8, token = $$props.token);
    		if ('inforQR' in $$props) inforQR = $$props.inforQR;
    		if ('qr' in $$props) qr = $$props.qr;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		gameOpen,
    		gameActive,
    		gameOpencasine,
    		products,
    		productScanner,
    		totalMoney,
    		user,
    		product,
    		token,
    		scannerActive,
    		getProducts,
    		singOut,
    		save,
    		singIn,
    		addProduct,
    		prepareSearch,
    		paymentProceed,
    		input0_input_handler,
    		input1_input_handler,
    		click_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler,
    		input6_input_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6
    	];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.58.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let home;
    	let current;
    	home = new Home({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(home.$$.fragment);
    			attr_dev(main, "class", "svelte-1nd5vak");
    			add_location(main, file, 6, 0, 88);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(home, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(home.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(home.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(home);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Home });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });


    (function ($) {
        
        // Dropdown on mouse hover
        $(document).ready(function () {
            function toggleNavbarMethod() {
                if ($(window).width() > 992) {
                    $('.navbar .dropdown').on('mouseover', function () {
                        $('.dropdown-toggle', this).trigger('click');
                    }).on('mouseout', function () {
                        $('.dropdown-toggle', this).trigger('click').blur();
                    });
                } else {
                    $('.navbar .dropdown').off('mouseover').off('mouseout');
                }
            }
            toggleNavbarMethod();
            $(window).resize(toggleNavbarMethod);
        });
        
        
        // Back to top button
     


        // Vendor carousel
        $('.vendor-carousel').owlCarousel({
            loop: true,
            margin: 29,
            nav: false,
            autoplay: true,
            smartSpeed: 1000,
            responsive: {
                0:{
                    items:2
                },
                576:{
                    items:3
                },
                768:{
                    items:4
                },
                992:{
                    items:5
                },
                1200:{
                    items:6
                }
            }
        });


        // Related carousel
        $('.related-carousel').owlCarousel({
            loop: true,
            margin: 29,
            nav: false,
            autoplay: true,
            smartSpeed: 1000,
            responsive: {
                0:{
                    items:1
                },
                576:{
                    items:2
                },
                768:{
                    items:3
                },
                992:{
                    items:4
                }
            }
        });


        // Product Quantity
        $('.quantity button').on('click', function () {
            var button = $(this);
            var oldValue = button.parent().parent().find('input').val();
            if (button.hasClass('btn-plus')) {
                var newVal = parseFloat(oldValue) + 1;
            } else {
                if (oldValue > 0) {
                    var newVal = parseFloat(oldValue) - 1;
                } else {
                    newVal = 0;
                }
            }
            button.parent().parent().find('input').val(newVal);
        });

        $('.dce-btn-close').on('click', function () {
           alert();
        });
        
    })(jQuery);

    return app;

})();
//# sourceMappingURL=bundle.js.map
