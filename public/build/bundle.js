
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
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
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
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
                    update(component.$$);
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
    function update($$) {
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
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
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

    /* src\components\home.svelte generated by Svelte v3.58.0 */

    const { console: console_1 } = globals;
    const file$1 = "src\\components\\home.svelte";

    // (579:8) {#if car>0}
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
    	let a2;
    	let img2;
    	let img2_src_value;
    	let t3;
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
    			a2 = element("a");
    			img2 = element("img");
    			t3 = space();
    			div1 = element("div");
    			label = element("label");
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", "btn-mas");
    			attr_dev(input, "class", "svelte-d9yz2r");
    			add_location(input, file$1, 580, 16, 36792);
    			attr_dev(img0, "class", "img-game svelte-d9yz2r");
    			if (!src_url_equal(img0.src, img0_src_value = "img/casino.jpg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "width", "45px");
    			attr_dev(img0, "height", "45px");
    			attr_dev(img0, "alt", "");
    			add_location(img0, file$1, 582, 34, 36901);
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "class", "svelte-d9yz2r");
    			add_location(a0, file$1, 582, 20, 36887);
    			attr_dev(img1, "class", "img-game svelte-d9yz2r");
    			if (!src_url_equal(img1.src, img1_src_value = "img/ruleta.jpg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "width", "45px");
    			attr_dev(img1, "height", "45px");
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$1, 583, 34, 37050);
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "class", "svelte-d9yz2r");
    			add_location(a1, file$1, 583, 20, 37036);
    			attr_dev(img2, "class", "img-game svelte-d9yz2r");
    			if (!src_url_equal(img2.src, img2_src_value = "img/ruleta.jpg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "width", "45px");
    			attr_dev(img2, "height", "45px");
    			attr_dev(img2, "alt", "");
    			add_location(img2, file$1, 584, 34, 37205);
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "class", "svelte-d9yz2r");
    			add_location(a2, file$1, 584, 20, 37191);
    			attr_dev(div0, "class", "redes svelte-d9yz2r");
    			add_location(div0, file$1, 581, 16, 36846);
    			attr_dev(label, "for", "btn-mas");
    			attr_dev(label, "class", "fa fa-plus svelte-d9yz2r");
    			add_location(label, file$1, 587, 20, 37409);
    			attr_dev(div1, "class", "btn-mas svelte-d9yz2r");
    			add_location(div1, file$1, 586, 16, 37366);
    			attr_dev(div2, "class", "container svelte-d9yz2r");
    			add_location(div2, file$1, 579, 12, 36751);
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
    			append_dev(div0, t2);
    			append_dev(div0, a2);
    			append_dev(a2, img2);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, label);

    			if (!mounted) {
    				dispose = [
    					listen_dev(img0, "click", /*click_handler_20*/ ctx[24], false, false, false, false),
    					listen_dev(img1, "click", /*click_handler_21*/ ctx[25], false, false, false, false),
    					listen_dev(img2, "click", /*click_handler_22*/ ctx[26], false, false, false, false)
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
    		source: "(579:8) {#if car>0}",
    		ctx
    	});

    	return block;
    }

    // (594:8) {#if gameOpen==true}
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
    			add_location(i, file$1, 594, 12, 37572);
    			attr_dev(iframe, "class", "back-to-iframe");
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "100%");
    			if (!src_url_equal(iframe.src, iframe_src_value = "https://netent-static.casinomodule.com/games/frenchroulette3_mobile_html/game/frenchroulette3_mobile_html.xhtml?staticServer=https%3A%2F%2Fnetent-static.casinomodule.com%2F&targetElement=netentgame&flashParams.bgcolor=000000&gameId=frenchroulette3_not_mobile&mobileParams.lobbyURL=https%253A%252F%252Fgames.netent.com%252Ftable-games%252Ffrench-roulette-slot%252F&server=https%3A%2F%2Fnetent-game.casinomodule.com%2F&lang=es&sessId=DEMO-0037068596-EUR&operatorId=default")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			add_location(iframe, file$1, 595, 12, 37744);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, iframe, anchor);

    			if (!mounted) {
    				dispose = listen_dev(i, "click", /*click_handler_23*/ ctx[27], false, false, false, false);
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
    		source: "(594:8) {#if gameOpen==true}",
    		ctx
    	});

    	return block;
    }

    // (599:8) {#if gameOpencasine==true}
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
    			add_location(i, file$1, 599, 12, 38372);
    			attr_dev(iframe, "class", "back-to-iframe");
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "100%");
    			if (!src_url_equal(iframe.src, iframe_src_value = "https://test-2.apiusoft.com/api/pascal/opengame?gameid=63-PSG&mode=wb&m=wb&player_id=789&currency=USD&t=9f571ee526b3fbead15270b40ad58e28478b15a5b7d9ae01df37a082032a128cc3bf36f06744d216fe1a0221a2740e290cb61dd21a89381b96daefb7791dc4f6")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			add_location(iframe, file$1, 600, 12, 38550);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, iframe, anchor);

    			if (!mounted) {
    				dispose = listen_dev(i, "click", /*click_handler_24*/ ctx[28], false, false, false, false);
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
    		source: "(599:8) {#if gameOpencasine==true}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let body;
    	let div6;
    	let div5;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let a0;
    	let span0;
    	let t2;
    	let span1;
    	let t4;
    	let div3;
    	let form0;
    	let div2;
    	let input;
    	let t5;
    	let div1;
    	let span2;
    	let i0;
    	let t6;
    	let div4;
    	let p0;
    	let t8;
    	let h50;
    	let t10;
    	let div17;
    	let div16;
    	let div9;
    	let a1;
    	let h60;
    	let i1;
    	let t11;
    	let t12;
    	let i2;
    	let t13;
    	let nav0;
    	let div8;
    	let div7;
    	let a2;
    	let t15;
    	let a3;
    	let t17;
    	let a4;
    	let t19;
    	let a5;
    	let t21;
    	let a6;
    	let t23;
    	let div15;
    	let nav1;
    	let button0;
    	let span3;
    	let t24;
    	let a7;
    	let span4;
    	let t26;
    	let span5;
    	let t28;
    	let div14;
    	let div12;
    	let a8;
    	let t30;
    	let a9;
    	let t32;
    	let a10;
    	let t34;
    	let div11;
    	let a11;
    	let t35;
    	let i3;
    	let t36;
    	let div10;
    	let a12;
    	let t38;
    	let a13;
    	let t40;
    	let a14;
    	let t42;
    	let div13;
    	let a15;
    	let i4;
    	let t43;
    	let span6;
    	let t45;
    	let a16;
    	let i5;
    	let t46;
    	let span7;
    	let t47;
    	let t48;
    	let div80;
    	let div31;
    	let div30;
    	let div29;
    	let div28;
    	let ol;
    	let li0;
    	let t49;
    	let li1;
    	let t50;
    	let li2;
    	let t51;
    	let div27;
    	let div20;
    	let img1;
    	let img1_src_value;
    	let t52;
    	let div19;
    	let div18;
    	let h10;
    	let t54;
    	let p1;
    	let t56;
    	let div23;
    	let img2;
    	let img2_src_value;
    	let t57;
    	let div22;
    	let div21;
    	let h11;
    	let t59;
    	let p2;
    	let t61;
    	let div26;
    	let img3;
    	let img3_src_value;
    	let t62;
    	let div25;
    	let div24;
    	let h12;
    	let t64;
    	let p3;
    	let t66;
    	let div65;
    	let h20;
    	let span8;
    	let t68;
    	let div64;
    	let div35;
    	let a17;
    	let div34;
    	let div32;
    	let img4;
    	let img4_src_value;
    	let t69;
    	let div33;
    	let h61;
    	let t71;
    	let small0;
    	let t73;
    	let small1;
    	let t75;
    	let div39;
    	let a18;
    	let div38;
    	let div36;
    	let img5;
    	let img5_src_value;
    	let t76;
    	let div37;
    	let h62;
    	let t78;
    	let small2;
    	let t80;
    	let small3;
    	let t82;
    	let div43;
    	let a19;
    	let div42;
    	let div40;
    	let img6;
    	let img6_src_value;
    	let t83;
    	let div41;
    	let h63;
    	let t85;
    	let small4;
    	let t87;
    	let small5;
    	let t89;
    	let div47;
    	let a20;
    	let div46;
    	let div44;
    	let img7;
    	let img7_src_value;
    	let t90;
    	let div45;
    	let h64;
    	let t92;
    	let small6;
    	let t94;
    	let small7;
    	let t96;
    	let div51;
    	let a21;
    	let div50;
    	let div48;
    	let img8;
    	let img8_src_value;
    	let t97;
    	let div49;
    	let h65;
    	let t99;
    	let small8;
    	let t101;
    	let small9;
    	let t103;
    	let div55;
    	let a22;
    	let div54;
    	let div52;
    	let img9;
    	let img9_src_value;
    	let t104;
    	let div53;
    	let h66;
    	let t106;
    	let small10;
    	let t108;
    	let small11;
    	let t110;
    	let div59;
    	let a23;
    	let div58;
    	let div56;
    	let img10;
    	let img10_src_value;
    	let t111;
    	let div57;
    	let h67;
    	let t113;
    	let small12;
    	let t115;
    	let small13;
    	let t117;
    	let div63;
    	let a24;
    	let div62;
    	let div60;
    	let img11;
    	let img11_src_value;
    	let t118;
    	let div61;
    	let h68;
    	let t120;
    	let small14;
    	let t122;
    	let small15;
    	let t124;
    	let div79;
    	let h21;
    	let span9;
    	let t126;
    	let div78;
    	let div69;
    	let a25;
    	let div68;
    	let div66;
    	let img12;
    	let img12_src_value;
    	let t127;
    	let div67;
    	let h69;
    	let t129;
    	let small16;
    	let t131;
    	let small17;
    	let t133;
    	let div73;
    	let a26;
    	let div72;
    	let div70;
    	let img13;
    	let img13_src_value;
    	let t134;
    	let div71;
    	let h610;
    	let t136;
    	let small18;
    	let t138;
    	let small19;
    	let t140;
    	let div77;
    	let a27;
    	let div76;
    	let div74;
    	let img14;
    	let img14_src_value;
    	let t141;
    	let div75;
    	let h611;
    	let t143;
    	let small20;
    	let t145;
    	let small21;
    	let t147;
    	let div81;
    	let a28;
    	let span10;
    	let i6;
    	let t148;
    	let t149;
    	let a29;
    	let img15;
    	let img15_src_value;
    	let t150;
    	let div108;
    	let div107;
    	let div106;
    	let div82;
    	let h51;
    	let img16;
    	let img16_src_value;
    	let t151;
    	let t152;
    	let button1;
    	let span11;
    	let t154;
    	let div104;
    	let form1;
    	let div103;
    	let div86;
    	let a30;
    	let div85;
    	let div83;
    	let img17;
    	let img17_src_value;
    	let t155;
    	let div84;
    	let h612;
    	let t157;
    	let small22;
    	let t159;
    	let small23;
    	let t161;
    	let div90;
    	let a31;
    	let div89;
    	let div87;
    	let img18;
    	let img18_src_value;
    	let t162;
    	let div88;
    	let h613;
    	let t164;
    	let small24;
    	let t166;
    	let small25;
    	let t168;
    	let div94;
    	let a32;
    	let div93;
    	let div91;
    	let img19;
    	let img19_src_value;
    	let t169;
    	let div92;
    	let h614;
    	let t171;
    	let small26;
    	let t173;
    	let small27;
    	let t175;
    	let div98;
    	let a33;
    	let div97;
    	let div95;
    	let img20;
    	let img20_src_value;
    	let t176;
    	let div96;
    	let h615;
    	let t178;
    	let small28;
    	let t180;
    	let small29;
    	let t182;
    	let div102;
    	let a34;
    	let div101;
    	let div99;
    	let img21;
    	let img21_src_value;
    	let t183;
    	let div100;
    	let h616;
    	let t185;
    	let small30;
    	let t187;
    	let small31;
    	let t189;
    	let div105;
    	let tbody0;
    	let tr0;
    	let td0;
    	let span12;
    	let strong0;
    	let t191;
    	let td1;
    	let span13;
    	let t193;
    	let tr1;
    	let td2;
    	let span14;
    	let strong1;
    	let t195;
    	let td3;
    	let span15;
    	let t197;
    	let tr2;
    	let td4;
    	let span16;
    	let strong2;
    	let t199;
    	let td5;
    	let span17;
    	let strong3;
    	let t201;
    	let button2;
    	let t203;
    	let div127;
    	let div126;
    	let div125;
    	let div109;
    	let h52;
    	let t205;
    	let button3;
    	let span18;
    	let t207;
    	let div123;
    	let form2;
    	let div122;
    	let div113;
    	let a35;
    	let div112;
    	let div110;
    	let img22;
    	let img22_src_value;
    	let t208;
    	let div111;
    	let h617;
    	let t210;
    	let small32;
    	let t212;
    	let small33;
    	let t214;
    	let div117;
    	let a36;
    	let div116;
    	let div114;
    	let img23;
    	let img23_src_value;
    	let t215;
    	let div115;
    	let h618;
    	let t217;
    	let small34;
    	let t219;
    	let small35;
    	let t221;
    	let div121;
    	let a37;
    	let div120;
    	let div118;
    	let img24;
    	let img24_src_value;
    	let t222;
    	let div119;
    	let h619;
    	let t224;
    	let small36;
    	let t226;
    	let small37;
    	let t228;
    	let div124;
    	let tbody1;
    	let tr3;
    	let td6;
    	let span19;
    	let strong4;
    	let t230;
    	let td7;
    	let span20;
    	let t232;
    	let tr4;
    	let td8;
    	let span21;
    	let strong5;
    	let t234;
    	let td9;
    	let span22;
    	let strong6;
    	let t236;
    	let button4;
    	let t238;
    	let t239;
    	let t240;
    	let mounted;
    	let dispose;
    	let if_block0 = /*car*/ ctx[1] > 0 && create_if_block_2(ctx);
    	let if_block1 = /*gameOpen*/ ctx[0] == true && create_if_block_1(ctx);
    	let if_block2 = /*gameOpencasine*/ ctx[2] == true && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			body = element("body");
    			div6 = element("div");
    			div5 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t0 = space();
    			a0 = element("a");
    			span0 = element("span");
    			span0.textContent = "Go";
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "Eat";
    			t4 = space();
    			div3 = element("div");
    			form0 = element("form");
    			div2 = element("div");
    			input = element("input");
    			t5 = space();
    			div1 = element("div");
    			span2 = element("span");
    			i0 = element("i");
    			t6 = space();
    			div4 = element("div");
    			p0 = element("p");
    			p0.textContent = "Servicio al Cliente";
    			t8 = space();
    			h50 = element("h5");
    			h50.textContent = "+ 951 970 113";
    			t10 = space();
    			div17 = element("div");
    			div16 = element("div");
    			div9 = element("div");
    			a1 = element("a");
    			h60 = element("h6");
    			i1 = element("i");
    			t11 = text("Categorias");
    			t12 = space();
    			i2 = element("i");
    			t13 = space();
    			nav0 = element("nav");
    			div8 = element("div");
    			div7 = element("div");
    			a2 = element("a");
    			a2.textContent = "Brosterias";
    			t15 = space();
    			a3 = element("a");
    			a3.textContent = "Pizzas";
    			t17 = space();
    			a4 = element("a");
    			a4.textContent = "Taquerias";
    			t19 = space();
    			a5 = element("a");
    			a5.textContent = "Juguerias";
    			t21 = space();
    			a6 = element("a");
    			a6.textContent = "Restobar";
    			t23 = space();
    			div15 = element("div");
    			nav1 = element("nav");
    			button0 = element("button");
    			span3 = element("span");
    			t24 = space();
    			a7 = element("a");
    			span4 = element("span");
    			span4.textContent = "GO";
    			t26 = space();
    			span5 = element("span");
    			span5.textContent = "Eat";
    			t28 = space();
    			div14 = element("div");
    			div12 = element("div");
    			a8 = element("a");
    			a8.textContent = "Home";
    			t30 = space();
    			a9 = element("a");
    			a9.textContent = "Shop";
    			t32 = space();
    			a10 = element("a");
    			a10.textContent = "Shop Detail";
    			t34 = space();
    			div11 = element("div");
    			a11 = element("a");
    			t35 = text("Pages ");
    			i3 = element("i");
    			t36 = space();
    			div10 = element("div");
    			a12 = element("a");
    			a12.textContent = "Shopping Cart";
    			t38 = space();
    			a13 = element("a");
    			a13.textContent = "Checkout";
    			t40 = space();
    			a14 = element("a");
    			a14.textContent = "Contact";
    			t42 = space();
    			div13 = element("div");
    			a15 = element("a");
    			i4 = element("i");
    			t43 = space();
    			span6 = element("span");
    			span6.textContent = "0";
    			t45 = space();
    			a16 = element("a");
    			i5 = element("i");
    			t46 = space();
    			span7 = element("span");
    			t47 = text(/*car*/ ctx[1]);
    			t48 = space();
    			div80 = element("div");
    			div31 = element("div");
    			div30 = element("div");
    			div29 = element("div");
    			div28 = element("div");
    			ol = element("ol");
    			li0 = element("li");
    			t49 = space();
    			li1 = element("li");
    			t50 = space();
    			li2 = element("li");
    			t51 = space();
    			div27 = element("div");
    			div20 = element("div");
    			img1 = element("img");
    			t52 = space();
    			div19 = element("div");
    			div18 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Warmin Coffe";
    			t54 = space();
    			p1 = element("p");
    			p1.textContent = "Warmi, el lugar adecuado si te encuentras en tingo maría";
    			t56 = space();
    			div23 = element("div");
    			img2 = element("img");
    			t57 = space();
    			div22 = element("div");
    			div21 = element("div");
    			h11 = element("h1");
    			h11.textContent = "Women Fashion";
    			t59 = space();
    			p2 = element("p");
    			p2.textContent = "Lugar adecuado si te encuentras en tingo maría";
    			t61 = space();
    			div26 = element("div");
    			img3 = element("img");
    			t62 = space();
    			div25 = element("div");
    			div24 = element("div");
    			h12 = element("h1");
    			h12.textContent = "Kids Fashion";
    			t64 = space();
    			p3 = element("p");
    			p3.textContent = "Lugar adecuado si te encuentras en tingo maría";
    			t66 = space();
    			div65 = element("div");
    			h20 = element("h2");
    			span8 = element("span");
    			span8.textContent = "COMIDAS";
    			t68 = space();
    			div64 = element("div");
    			div35 = element("div");
    			a17 = element("a");
    			div34 = element("div");
    			div32 = element("div");
    			img4 = element("img");
    			t69 = space();
    			div33 = element("div");
    			h61 = element("h6");
    			h61.textContent = "Fideos a la Italiana";
    			t71 = space();
    			small0 = element("small");
    			small0.textContent = "100 Products";
    			t73 = space();
    			small1 = element("small");
    			small1.textContent = "S/. 15.00";
    			t75 = space();
    			div39 = element("div");
    			a18 = element("a");
    			div38 = element("div");
    			div36 = element("div");
    			img5 = element("img");
    			t76 = space();
    			div37 = element("div");
    			h62 = element("h6");
    			h62.textContent = "Sandwich";
    			t78 = space();
    			small2 = element("small");
    			small2.textContent = "100 Products";
    			t80 = space();
    			small3 = element("small");
    			small3.textContent = "S/. 25.00";
    			t82 = space();
    			div43 = element("div");
    			a19 = element("a");
    			div42 = element("div");
    			div40 = element("div");
    			img6 = element("img");
    			t83 = space();
    			div41 = element("div");
    			h63 = element("h6");
    			h63.textContent = "Arroz Chaufa Amazonico";
    			t85 = space();
    			small4 = element("small");
    			small4.textContent = "100 Products";
    			t87 = space();
    			small5 = element("small");
    			small5.textContent = "S/. 10.00";
    			t89 = space();
    			div47 = element("div");
    			a20 = element("a");
    			div46 = element("div");
    			div44 = element("div");
    			img7 = element("img");
    			t90 = space();
    			div45 = element("div");
    			h64 = element("h6");
    			h64.textContent = "Arroz con pato";
    			t92 = space();
    			small6 = element("small");
    			small6.textContent = "100 Products";
    			t94 = space();
    			small7 = element("small");
    			small7.textContent = "S/. 8.00";
    			t96 = space();
    			div51 = element("div");
    			a21 = element("a");
    			div50 = element("div");
    			div48 = element("div");
    			img8 = element("img");
    			t97 = space();
    			div49 = element("div");
    			h65 = element("h6");
    			h65.textContent = "Mondonguito Italiano";
    			t99 = space();
    			small8 = element("small");
    			small8.textContent = "100 Products";
    			t101 = space();
    			small9 = element("small");
    			small9.textContent = "S/. 13.00";
    			t103 = space();
    			div55 = element("div");
    			a22 = element("a");
    			div54 = element("div");
    			div52 = element("div");
    			img9 = element("img");
    			t104 = space();
    			div53 = element("div");
    			h66 = element("h6");
    			h66.textContent = "Saltado de Res";
    			t106 = space();
    			small10 = element("small");
    			small10.textContent = "100 Products";
    			t108 = space();
    			small11 = element("small");
    			small11.textContent = "S/. 11.00";
    			t110 = space();
    			div59 = element("div");
    			a23 = element("a");
    			div58 = element("div");
    			div56 = element("div");
    			img10 = element("img");
    			t111 = space();
    			div57 = element("div");
    			h67 = element("h6");
    			h67.textContent = "Pollo a la brasa";
    			t113 = space();
    			small12 = element("small");
    			small12.textContent = "100 Products";
    			t115 = space();
    			small13 = element("small");
    			small13.textContent = "S/. 11.00";
    			t117 = space();
    			div63 = element("div");
    			a24 = element("a");
    			div62 = element("div");
    			div60 = element("div");
    			img11 = element("img");
    			t118 = space();
    			div61 = element("div");
    			h68 = element("h6");
    			h68.textContent = "Chancho ala Caja China";
    			t120 = space();
    			small14 = element("small");
    			small14.textContent = "100 Products";
    			t122 = space();
    			small15 = element("small");
    			small15.textContent = "S/. 15.00";
    			t124 = space();
    			div79 = element("div");
    			h21 = element("h2");
    			span9 = element("span");
    			span9.textContent = "BEBIDAS";
    			t126 = space();
    			div78 = element("div");
    			div69 = element("div");
    			a25 = element("a");
    			div68 = element("div");
    			div66 = element("div");
    			img12 = element("img");
    			t127 = space();
    			div67 = element("div");
    			h69 = element("h6");
    			h69.textContent = "Coca Cola";
    			t129 = space();
    			small16 = element("small");
    			small16.textContent = "50 Unidades";
    			t131 = space();
    			small17 = element("small");
    			small17.textContent = "S/. 3.00";
    			t133 = space();
    			div73 = element("div");
    			a26 = element("a");
    			div72 = element("div");
    			div70 = element("div");
    			img13 = element("img");
    			t134 = space();
    			div71 = element("div");
    			h610 = element("h6");
    			h610.textContent = "Inka Cola";
    			t136 = space();
    			small18 = element("small");
    			small18.textContent = "100 Products";
    			t138 = space();
    			small19 = element("small");
    			small19.textContent = "S/. 3.00";
    			t140 = space();
    			div77 = element("div");
    			a27 = element("a");
    			div76 = element("div");
    			div74 = element("div");
    			img14 = element("img");
    			t141 = space();
    			div75 = element("div");
    			h611 = element("h6");
    			h611.textContent = "Pepsi Cola";
    			t143 = space();
    			small20 = element("small");
    			small20.textContent = "100 Products";
    			t145 = space();
    			small21 = element("small");
    			small21.textContent = "S/. 2.00";
    			t147 = space();
    			div81 = element("div");
    			a28 = element("a");
    			span10 = element("span");
    			i6 = element("i");
    			t148 = text(/*car*/ ctx[1]);
    			t149 = space();
    			a29 = element("a");
    			img15 = element("img");
    			t150 = space();
    			div108 = element("div");
    			div107 = element("div");
    			div106 = element("div");
    			div82 = element("div");
    			h51 = element("h5");
    			img16 = element("img");
    			t151 = text("Carrito");
    			t152 = space();
    			button1 = element("button");
    			span11 = element("span");
    			span11.textContent = "×";
    			t154 = space();
    			div104 = element("div");
    			form1 = element("form");
    			div103 = element("div");
    			div86 = element("div");
    			a30 = element("a");
    			div85 = element("div");
    			div83 = element("div");
    			img17 = element("img");
    			t155 = space();
    			div84 = element("div");
    			h612 = element("h6");
    			h612.textContent = "Coca Cola";
    			t157 = space();
    			small22 = element("small");
    			small22.textContent = "50 Unidades";
    			t159 = space();
    			small23 = element("small");
    			small23.textContent = "S/. 3.00";
    			t161 = space();
    			div90 = element("div");
    			a31 = element("a");
    			div89 = element("div");
    			div87 = element("div");
    			img18 = element("img");
    			t162 = space();
    			div88 = element("div");
    			h613 = element("h6");
    			h613.textContent = "Inka Cola";
    			t164 = space();
    			small24 = element("small");
    			small24.textContent = "100 Products";
    			t166 = space();
    			small25 = element("small");
    			small25.textContent = "S/. 3.00";
    			t168 = space();
    			div94 = element("div");
    			a32 = element("a");
    			div93 = element("div");
    			div91 = element("div");
    			img19 = element("img");
    			t169 = space();
    			div92 = element("div");
    			h614 = element("h6");
    			h614.textContent = "Pepsi Cola";
    			t171 = space();
    			small26 = element("small");
    			small26.textContent = "100 Products";
    			t173 = space();
    			small27 = element("small");
    			small27.textContent = "S/. 2.00";
    			t175 = space();
    			div98 = element("div");
    			a33 = element("a");
    			div97 = element("div");
    			div95 = element("div");
    			img20 = element("img");
    			t176 = space();
    			div96 = element("div");
    			h615 = element("h6");
    			h615.textContent = "Pepsi Cola";
    			t178 = space();
    			small28 = element("small");
    			small28.textContent = "100 Products";
    			t180 = space();
    			small29 = element("small");
    			small29.textContent = "S/. 2.00";
    			t182 = space();
    			div102 = element("div");
    			a34 = element("a");
    			div101 = element("div");
    			div99 = element("div");
    			img21 = element("img");
    			t183 = space();
    			div100 = element("div");
    			h616 = element("h6");
    			h616.textContent = "Pepsi Cola";
    			t185 = space();
    			small30 = element("small");
    			small30.textContent = "100 Products";
    			t187 = space();
    			small31 = element("small");
    			small31.textContent = "S/. 2.00";
    			t189 = space();
    			div105 = element("div");
    			tbody0 = element("tbody");
    			tr0 = element("tr");
    			td0 = element("td");
    			span12 = element("span");
    			strong0 = element("strong");
    			strong0.textContent = "Sub total:";
    			t191 = space();
    			td1 = element("td");
    			span13 = element("span");
    			span13.textContent = "S/ 8.00";
    			t193 = space();
    			tr1 = element("tr");
    			td2 = element("td");
    			span14 = element("span");
    			strong1 = element("strong");
    			strong1.textContent = "Entrega:";
    			t195 = space();
    			td3 = element("td");
    			span15 = element("span");
    			span15.textContent = "Por calcular:";
    			t197 = space();
    			tr2 = element("tr");
    			td4 = element("td");
    			span16 = element("span");
    			strong2 = element("strong");
    			strong2.textContent = "TOTAL:";
    			t199 = space();
    			td5 = element("td");
    			span17 = element("span");
    			strong3 = element("strong");
    			strong3.textContent = "S/ 8.00";
    			t201 = space();
    			button2 = element("button");
    			button2.textContent = "Proceder pago";
    			t203 = space();
    			div127 = element("div");
    			div126 = element("div");
    			div125 = element("div");
    			div109 = element("div");
    			h52 = element("h5");
    			h52.textContent = "El sazon del pato";
    			t205 = space();
    			button3 = element("button");
    			span18 = element("span");
    			span18.textContent = "×";
    			t207 = space();
    			div123 = element("div");
    			form2 = element("form");
    			div122 = element("div");
    			div113 = element("div");
    			a35 = element("a");
    			div112 = element("div");
    			div110 = element("div");
    			img22 = element("img");
    			t208 = space();
    			div111 = element("div");
    			h617 = element("h6");
    			h617.textContent = "Arroz Chaufa Amazonico";
    			t210 = space();
    			small32 = element("small");
    			small32.textContent = "50 Unidades";
    			t212 = space();
    			small33 = element("small");
    			small33.textContent = "S/. 10.00";
    			t214 = space();
    			div117 = element("div");
    			a36 = element("a");
    			div116 = element("div");
    			div114 = element("div");
    			img23 = element("img");
    			t215 = space();
    			div115 = element("div");
    			h618 = element("h6");
    			h618.textContent = "Fideos a la Italiana";
    			t217 = space();
    			small34 = element("small");
    			small34.textContent = "100 Products";
    			t219 = space();
    			small35 = element("small");
    			small35.textContent = "S/. 13.00";
    			t221 = space();
    			div121 = element("div");
    			a37 = element("a");
    			div120 = element("div");
    			div118 = element("div");
    			img24 = element("img");
    			t222 = space();
    			div119 = element("div");
    			h619 = element("h6");
    			h619.textContent = "Arroz con pato";
    			t224 = space();
    			small36 = element("small");
    			small36.textContent = "100 Products";
    			t226 = space();
    			small37 = element("small");
    			small37.textContent = "S/. 15.00";
    			t228 = space();
    			div124 = element("div");
    			tbody1 = element("tbody");
    			tr3 = element("tr");
    			td6 = element("td");
    			span19 = element("span");
    			strong4 = element("strong");
    			strong4.textContent = "Mesa:";
    			t230 = space();
    			td7 = element("td");
    			span20 = element("span");
    			span20.textContent = "1";
    			t232 = space();
    			tr4 = element("tr");
    			td8 = element("td");
    			span21 = element("span");
    			strong5 = element("strong");
    			strong5.textContent = "TOTAL:";
    			t234 = space();
    			td9 = element("td");
    			span22 = element("span");
    			strong6 = element("strong");
    			strong6.textContent = "S/ 0.00";
    			t236 = space();
    			button4 = element("button");
    			button4.textContent = "Realizar pedido";
    			t238 = space();
    			if (if_block0) if_block0.c();
    			t239 = space();
    			if (if_block1) if_block1.c();
    			t240 = space();
    			if (if_block2) if_block2.c();
    			if (!src_url_equal(img0.src, img0_src_value = "img/goeat.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "width", "80");
    			attr_dev(img0, "height", "80");
    			set_style(img0, "margin-top", "-26px");
    			add_location(img0, file$1, 50, 20, 1374);
    			attr_dev(span0, "class", "h1 text-uppercase text-primary");
    			add_location(span0, file$1, 52, 24, 1531);
    			attr_dev(span1, "class", "h1 text-uppercase text-dark");
    			add_location(span1, file$1, 53, 24, 1611);
    			attr_dev(a0, "class", "text-decoration-none");
    			add_location(a0, file$1, 51, 20, 1472);
    			attr_dev(div0, "class", "col-lg-4");
    			add_location(div0, file$1, 49, 16, 1330);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", "Search for products");
    			add_location(input, file$1, 59, 28, 1888);
    			attr_dev(i0, "class", "fa fa-search");
    			add_location(i0, file$1, 62, 36, 2155);
    			attr_dev(span2, "class", "input-group-text bg-transparent text-primary");
    			add_location(span2, file$1, 61, 32, 2058);
    			attr_dev(div1, "class", "input-group-append");
    			add_location(div1, file$1, 60, 28, 1992);
    			attr_dev(div2, "class", "input-group");
    			add_location(div2, file$1, 58, 24, 1833);
    			attr_dev(form0, "action", "");
    			add_location(form0, file$1, 57, 20, 1791);
    			attr_dev(div3, "class", "col-lg-4 col-6 text-left");
    			add_location(div3, file$1, 56, 16, 1731);
    			attr_dev(p0, "class", "m-0");
    			add_location(p0, file$1, 69, 20, 2424);
    			attr_dev(h50, "class", "m-0");
    			add_location(h50, file$1, 70, 20, 2484);
    			attr_dev(div4, "class", "col-lg-4 col-6 text-right");
    			add_location(div4, file$1, 68, 16, 2363);
    			attr_dev(div5, "class", "row align-items-center bg-light py-3 px-xl-5 d-none d-lg-flex");
    			add_location(div5, file$1, 48, 12, 1237);
    			attr_dev(div6, "class", "container-fluid");
    			add_location(div6, file$1, 47, 8, 1194);
    			attr_dev(i1, "class", "fa fa-bars mr-2");
    			add_location(i1, file$1, 82, 50, 3042);
    			attr_dev(h60, "class", "text-dark m-0");
    			add_location(h60, file$1, 82, 24, 3016);
    			attr_dev(i2, "class", "fa fa-angle-down text-dark");
    			add_location(i2, file$1, 83, 24, 3114);
    			attr_dev(a1, "class", "btn d-flex align-items-center justify-content-between bg-primary w-100");
    			attr_dev(a1, "data-toggle", "collapse");
    			attr_dev(a1, "href", "#navbar-vertical");
    			set_style(a1, "height", "65px");
    			set_style(a1, "padding", "0 30px");
    			add_location(a1, file$1, 81, 20, 2822);
    			attr_dev(a2, "href", "");
    			attr_dev(a2, "class", "nav-item nav-link");
    			add_location(a2, file$1, 88, 28, 3537);
    			attr_dev(a3, "href", "");
    			attr_dev(a3, "class", "nav-item nav-link");
    			add_location(a3, file$1, 89, 28, 3618);
    			attr_dev(a4, "href", "");
    			attr_dev(a4, "class", "nav-item nav-link");
    			add_location(a4, file$1, 90, 28, 3695);
    			attr_dev(a5, "href", "");
    			attr_dev(a5, "class", "nav-item nav-link");
    			add_location(a5, file$1, 91, 28, 3775);
    			attr_dev(a6, "href", "");
    			attr_dev(a6, "class", "nav-item nav-link");
    			add_location(a6, file$1, 92, 28, 3855);
    			attr_dev(div7, "class", "nav-item dropdown dropright");
    			add_location(div7, file$1, 87, 28, 3466);
    			attr_dev(div8, "class", "navbar-nav w-100");
    			add_location(div8, file$1, 86, 24, 3406);
    			attr_dev(nav0, "class", "collapse position-absolute navbar navbar-vertical navbar-light align-items-start p-0 bg-light");
    			attr_dev(nav0, "id", "navbar-vertical");
    			set_style(nav0, "width", "calc(100% - 30px)");
    			set_style(nav0, "z-index", "999");
    			add_location(nav0, file$1, 85, 20, 3204);
    			attr_dev(div9, "class", "col-lg-3 d-none d-lg-block");
    			add_location(div9, file$1, 80, 16, 2760);
    			attr_dev(span3, "class", "navbar-toggler-icon");
    			add_location(span3, file$1, 99, 28, 4294);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "navbar-toggler");
    			attr_dev(button0, "data-toggle", "collapse");
    			attr_dev(button0, "data-target", "#navbarCollapse");
    			add_location(button0, file$1, 98, 24, 4166);
    			attr_dev(span4, "class", "h1 text-uppercase text-dark bg-light px-2");
    			add_location(span4, file$1, 102, 28, 4484);
    			attr_dev(span5, "class", "h1 text-uppercase text-light bg-primary px-2 ml-n1");
    			add_location(span5, file$1, 103, 28, 4579);
    			attr_dev(a7, "href", "");
    			attr_dev(a7, "class", "text-decoration-none d-block d-lg-none");
    			add_location(a7, file$1, 101, 24, 4396);
    			attr_dev(a8, "href", "index.html");
    			attr_dev(a8, "class", "nav-item nav-link active");
    			add_location(a8, file$1, 107, 32, 4893);
    			attr_dev(a9, "href", "shop.html");
    			attr_dev(a9, "class", "nav-item nav-link");
    			add_location(a9, file$1, 108, 32, 4989);
    			attr_dev(a10, "href", "detail.html");
    			attr_dev(a10, "class", "nav-item nav-link");
    			add_location(a10, file$1, 109, 32, 5077);
    			attr_dev(i3, "class", "fa fa-angle-down mt-1");
    			add_location(i3, file$1, 111, 110, 5317);
    			attr_dev(a11, "href", "#");
    			attr_dev(a11, "class", "nav-link dropdown-toggle");
    			attr_dev(a11, "data-toggle", "dropdown");
    			add_location(a11, file$1, 111, 36, 5243);
    			attr_dev(a12, "href", "cart.html");
    			attr_dev(a12, "class", "dropdown-item");
    			add_location(a12, file$1, 113, 40, 5499);
    			attr_dev(a13, "href", "checkout.html");
    			attr_dev(a13, "class", "dropdown-item");
    			add_location(a13, file$1, 114, 40, 5600);
    			attr_dev(div10, "class", "dropdown-menu bg-primary rounded-0 border-0 m-0");
    			add_location(div10, file$1, 112, 36, 5396);
    			attr_dev(div11, "class", "nav-item dropdown");
    			add_location(div11, file$1, 110, 32, 5174);
    			attr_dev(a14, "href", "contact.html");
    			attr_dev(a14, "class", "nav-item nav-link");
    			add_location(a14, file$1, 117, 32, 5776);
    			attr_dev(div12, "class", "navbar-nav mr-auto py-0");
    			add_location(div12, file$1, 106, 28, 4822);
    			attr_dev(i4, "class", "fas fa-heart text-primary");
    			add_location(i4, file$1, 121, 36, 6058);
    			attr_dev(span6, "class", "badge text-secondary border border-secondary rounded-circle");
    			set_style(span6, "padding-bottom", "2px");
    			add_location(span6, file$1, 122, 36, 6137);
    			attr_dev(a15, "href", "#");
    			attr_dev(a15, "class", "btn px-0");
    			add_location(a15, file$1, 120, 32, 5991);
    			attr_dev(i5, "class", "fas fa-shopping-cart text-primary");
    			add_location(i5, file$1, 125, 36, 6447);
    			attr_dev(span7, "class", "badge text-secondary border border-secondary rounded-circle");
    			set_style(span7, "padding-bottom", "2px");
    			add_location(span7, file$1, 126, 36, 6534);
    			attr_dev(a16, "href", "#");
    			attr_dev(a16, "class", "btn px-0 ml-3");
    			attr_dev(a16, "data-toggle", "modal");
    			attr_dev(a16, "data-target", ".bd-example-modal-sm");
    			add_location(a16, file$1, 124, 32, 6320);
    			attr_dev(div13, "class", "navbar-nav ml-auto py-0 d-none d-lg-block");
    			add_location(div13, file$1, 119, 28, 5902);
    			attr_dev(div14, "class", "collapse navbar-collapse justify-content-between");
    			attr_dev(div14, "id", "navbarCollapse");
    			add_location(div14, file$1, 105, 24, 4710);
    			attr_dev(nav1, "class", "navbar-perfile navbar navbar-expand-lg bg-dark navbar-dark py-3 py-lg-0 px-0");
    			add_location(nav1, file$1, 97, 20, 4050);
    			attr_dev(div15, "class", "col-lg-9");
    			add_location(div15, file$1, 96, 16, 4006);
    			attr_dev(div16, "class", "row px-xl-5");
    			add_location(div16, file$1, 79, 12, 2717);
    			attr_dev(div17, "class", "container-fluid bg-dark mb-30");
    			add_location(div17, file$1, 78, 8, 2660);
    			attr_dev(li0, "data-target", "#header-carousel");
    			attr_dev(li0, "data-slide-to", "0");
    			attr_dev(li0, "class", "active");
    			add_location(li0, file$1, 143, 32, 7306);
    			attr_dev(li1, "data-target", "#header-carousel");
    			attr_dev(li1, "data-slide-to", "1");
    			add_location(li1, file$1, 144, 32, 7413);
    			attr_dev(li2, "data-target", "#header-carousel");
    			attr_dev(li2, "data-slide-to", "2");
    			add_location(li2, file$1, 145, 32, 7505);
    			attr_dev(ol, "class", "carousel-indicators");
    			add_location(ol, file$1, 142, 28, 7240);
    			attr_dev(img1, "class", "position-absolute w-100 h-100");
    			if (!src_url_equal(img1.src, img1_src_value = "img/carousel-1.jpg")) attr_dev(img1, "src", img1_src_value);
    			set_style(img1, "object-fit", "cover");
    			add_location(img1, file$1, 149, 36, 7803);
    			attr_dev(h10, "class", "display-4 text-white mb-3 animate__animated animate__fadeInDown");
    			add_location(h10, file$1, 152, 44, 8158);
    			attr_dev(p1, "class", "mx-md-5 px-5 animate__animated animate__bounceIn");
    			add_location(p1, file$1, 153, 44, 8297);
    			attr_dev(div18, "class", "p-3");
    			set_style(div18, "max-width", "700px");
    			add_location(div18, file$1, 151, 40, 8069);
    			attr_dev(div19, "class", "carousel-caption d-flex flex-column align-items-center justify-content-center");
    			add_location(div19, file$1, 150, 36, 7936);
    			attr_dev(div20, "class", "carousel-item position-relative active");
    			set_style(div20, "height", "220px");
    			add_location(div20, file$1, 148, 32, 7690);
    			attr_dev(img2, "class", "position-absolute w-100 h-100");
    			if (!src_url_equal(img2.src, img2_src_value = "img/carousel-2.jpg")) attr_dev(img2, "src", img2_src_value);
    			set_style(img2, "object-fit", "cover");
    			add_location(img2, file$1, 158, 36, 8690);
    			attr_dev(h11, "class", "display-4 text-white mb-3 animate__animated animate__fadeInDown");
    			add_location(h11, file$1, 161, 44, 9045);
    			attr_dev(p2, "class", "mx-md-5 px-5 animate__animated animate__bounceIn");
    			add_location(p2, file$1, 162, 44, 9185);
    			attr_dev(div21, "class", "p-3");
    			set_style(div21, "max-width", "700px");
    			add_location(div21, file$1, 160, 40, 8956);
    			attr_dev(div22, "class", "carousel-caption d-flex flex-column align-items-center justify-content-center");
    			add_location(div22, file$1, 159, 36, 8823);
    			attr_dev(div23, "class", "carousel-item position-relative");
    			set_style(div23, "height", "220px");
    			add_location(div23, file$1, 157, 32, 8584);
    			attr_dev(img3, "class", "position-absolute w-100 h-100");
    			if (!src_url_equal(img3.src, img3_src_value = "img/carousel-3.jpg")) attr_dev(img3, "src", img3_src_value);
    			set_style(img3, "object-fit", "cover");
    			add_location(img3, file$1, 167, 36, 9568);
    			attr_dev(h12, "class", "display-4 text-white mb-3 animate__animated animate__fadeInDown");
    			add_location(h12, file$1, 170, 44, 9923);
    			attr_dev(p3, "class", "mx-md-5 px-5 animate__animated animate__bounceIn");
    			add_location(p3, file$1, 171, 44, 10062);
    			attr_dev(div24, "class", "p-3");
    			set_style(div24, "max-width", "700px");
    			add_location(div24, file$1, 169, 40, 9834);
    			attr_dev(div25, "class", "carousel-caption d-flex flex-column align-items-center justify-content-center");
    			add_location(div25, file$1, 168, 36, 9701);
    			attr_dev(div26, "class", "carousel-item position-relative");
    			set_style(div26, "height", "220px");
    			add_location(div26, file$1, 166, 32, 9462);
    			attr_dev(div27, "class", "carousel-inner");
    			add_location(div27, file$1, 147, 28, 7628);
    			attr_dev(div28, "id", "header-carousel");
    			attr_dev(div28, "class", "carousel slide carousel-fade mb-30 mb-lg-0");
    			attr_dev(div28, "data-ride", "carousel");
    			add_location(div28, file$1, 141, 24, 7112);
    			attr_dev(div29, "class", "col-lg-12");
    			add_location(div29, file$1, 140, 20, 7063);
    			attr_dev(div30, "class", "row px-xl-4");
    			add_location(div30, file$1, 139, 16, 7016);
    			attr_dev(div31, "class", "container-fluid");
    			add_location(div31, file$1, 138, 12, 6969);
    			attr_dev(span8, "class", "bg-secondary pr-3");
    			add_location(span8, file$1, 184, 88, 10640);
    			attr_dev(h20, "class", "section-title position-relative text-uppercase mx-xl-5 mb-4");
    			add_location(h20, file$1, 184, 16, 10568);
    			attr_dev(img4, "class", "img-fluid");
    			if (!src_url_equal(img4.src, img4_src_value = "img/cat-1.jpg")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "");
    			set_style(img4, "height", "119px");
    			add_location(img4, file$1, 190, 36, 11133);
    			attr_dev(div32, "class", "overflow-hidden");
    			set_style(div32, "width", "120px");
    			set_style(div32, "height", "120px");
    			add_location(div32, file$1, 189, 32, 11029);
    			add_location(h61, file$1, 193, 36, 11346);
    			attr_dev(small0, "class", "text-body");
    			add_location(small0, file$1, 194, 36, 11413);
    			attr_dev(small1, "class", "text-price svelte-d9yz2r");
    			add_location(small1, file$1, 195, 36, 11496);
    			attr_dev(div33, "class", "flex-fill pl-3");
    			add_location(div33, file$1, 192, 32, 11280);
    			attr_dev(div34, "class", "cat-item d-flex align-items-center mb-4");
    			add_location(div34, file$1, 188, 28, 10942);
    			attr_dev(a17, "href", "#");
    			attr_dev(a17, "class", "text-decoration-none");
    			add_location(a17, file$1, 187, 24, 10871);
    			attr_dev(div35, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div35, file$1, 186, 20, 10761);
    			attr_dev(img5, "class", "img-fluid");
    			if (!src_url_equal(img5.src, img5_src_value = "img/cat-2.avif")) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "alt", "");
    			set_style(img5, "height", "119px");
    			add_location(img5, file$1, 204, 36, 12078);
    			attr_dev(div36, "class", "overflow-hidden");
    			set_style(div36, "width", "120px");
    			set_style(div36, "height", "120px");
    			add_location(div36, file$1, 203, 32, 11974);
    			add_location(h62, file$1, 207, 36, 12292);
    			attr_dev(small2, "class", "text-body");
    			add_location(small2, file$1, 208, 36, 12347);
    			attr_dev(small3, "class", "text-price svelte-d9yz2r");
    			add_location(small3, file$1, 209, 36, 12430);
    			attr_dev(div37, "class", "flex-fill pl-3");
    			add_location(div37, file$1, 206, 32, 12226);
    			attr_dev(div38, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div38, file$1, 202, 28, 11878);
    			attr_dev(a18, "href", "#");
    			attr_dev(a18, "class", "text-decoration-none");
    			add_location(a18, file$1, 201, 24, 11806);
    			attr_dev(div39, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div39, file$1, 200, 20, 11695);
    			attr_dev(img6, "class", "img-fluid");
    			if (!src_url_equal(img6.src, img6_src_value = "img/cat-3.jpg")) attr_dev(img6, "src", img6_src_value);
    			attr_dev(img6, "alt", "");
    			set_style(img6, "height", "119px");
    			set_style(img6, "width", "120px");
    			add_location(img6, file$1, 218, 36, 13002);
    			attr_dev(div40, "class", "overflow-hidden");
    			set_style(div40, "width", "120px");
    			set_style(div40, "height", "120px");
    			add_location(div40, file$1, 217, 32, 12898);
    			add_location(h63, file$1, 221, 36, 13227);
    			attr_dev(small4, "class", "text-body");
    			add_location(small4, file$1, 222, 36, 13296);
    			attr_dev(small5, "class", "text-price svelte-d9yz2r");
    			add_location(small5, file$1, 223, 36, 13379);
    			attr_dev(div41, "class", "flex-fill pl-3");
    			add_location(div41, file$1, 220, 32, 13161);
    			attr_dev(div42, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div42, file$1, 216, 28, 12802);
    			attr_dev(a19, "class", "text-decoration-none");
    			add_location(a19, file$1, 215, 24, 12740);
    			attr_dev(div43, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div43, file$1, 214, 20, 12629);
    			attr_dev(img7, "class", "img-fluid");
    			if (!src_url_equal(img7.src, img7_src_value = "img/cat-4.jpg")) attr_dev(img7, "src", img7_src_value);
    			attr_dev(img7, "alt", "");
    			set_style(img7, "height", "119px");
    			add_location(img7, file$1, 233, 36, 14029);
    			attr_dev(div44, "class", "overflow-hidden");
    			set_style(div44, "width", "120px");
    			set_style(div44, "height", "120px");
    			add_location(div44, file$1, 232, 32, 13925);
    			add_location(h64, file$1, 236, 36, 14242);
    			attr_dev(small6, "class", "text-body");
    			add_location(small6, file$1, 237, 36, 14303);
    			attr_dev(small7, "class", "text-price svelte-d9yz2r");
    			add_location(small7, file$1, 238, 36, 14386);
    			attr_dev(div45, "class", "flex-fill pl-3");
    			add_location(div45, file$1, 235, 32, 14176);
    			attr_dev(div46, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div46, file$1, 231, 28, 13829);
    			attr_dev(a20, "class", "text-decoration-none");
    			add_location(a20, file$1, 230, 24, 13767);
    			attr_dev(div47, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div47, file$1, 229, 20, 13656);
    			attr_dev(img8, "class", "img-fluid");
    			if (!src_url_equal(img8.src, img8_src_value = "img/cat-5.jpg")) attr_dev(img8, "src", img8_src_value);
    			attr_dev(img8, "alt", "");
    			set_style(img8, "height", "119px");
    			add_location(img8, file$1, 247, 36, 14957);
    			attr_dev(div48, "class", "overflow-hidden");
    			set_style(div48, "width", "120px");
    			set_style(div48, "height", "120px");
    			add_location(div48, file$1, 246, 32, 14853);
    			add_location(h65, file$1, 250, 36, 15170);
    			attr_dev(small8, "class", "text-body");
    			add_location(small8, file$1, 251, 36, 15237);
    			attr_dev(small9, "class", "text-price svelte-d9yz2r");
    			add_location(small9, file$1, 252, 36, 15320);
    			attr_dev(div49, "class", "flex-fill pl-3");
    			add_location(div49, file$1, 249, 32, 15104);
    			attr_dev(div50, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div50, file$1, 245, 28, 14757);
    			attr_dev(a21, "class", "text-decoration-none");
    			add_location(a21, file$1, 244, 24, 14695);
    			attr_dev(div51, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div51, file$1, 243, 20, 14584);
    			attr_dev(img9, "class", "img-fluid");
    			if (!src_url_equal(img9.src, img9_src_value = "img/cat-6.jpg")) attr_dev(img9, "src", img9_src_value);
    			attr_dev(img9, "alt", "");
    			set_style(img9, "height", "119px");
    			add_location(img9, file$1, 261, 36, 15893);
    			attr_dev(div52, "class", "overflow-hidden");
    			set_style(div52, "width", "120px");
    			set_style(div52, "height", "120px");
    			add_location(div52, file$1, 260, 32, 15789);
    			add_location(h66, file$1, 264, 36, 16106);
    			attr_dev(small10, "class", "text-body");
    			add_location(small10, file$1, 265, 36, 16167);
    			attr_dev(small11, "class", "text-price svelte-d9yz2r");
    			add_location(small11, file$1, 266, 36, 16250);
    			attr_dev(div53, "class", "flex-fill pl-3");
    			add_location(div53, file$1, 263, 32, 16040);
    			attr_dev(div54, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div54, file$1, 259, 28, 15693);
    			attr_dev(a22, "class", "text-decoration-none");
    			add_location(a22, file$1, 258, 24, 15630);
    			attr_dev(div55, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div55, file$1, 257, 20, 15519);
    			attr_dev(img10, "class", "img-fluid");
    			if (!src_url_equal(img10.src, img10_src_value = "img/cat-7.avif")) attr_dev(img10, "src", img10_src_value);
    			attr_dev(img10, "alt", "");
    			set_style(img10, "height", "119px");
    			add_location(img10, file$1, 275, 36, 16822);
    			attr_dev(div56, "class", "overflow-hidden");
    			set_style(div56, "width", "120px");
    			set_style(div56, "height", "120px");
    			add_location(div56, file$1, 274, 32, 16718);
    			add_location(h67, file$1, 278, 36, 17036);
    			attr_dev(small12, "class", "text-body");
    			add_location(small12, file$1, 279, 36, 17099);
    			attr_dev(small13, "class", "text-price svelte-d9yz2r");
    			add_location(small13, file$1, 280, 36, 17182);
    			attr_dev(div57, "class", "flex-fill pl-3");
    			add_location(div57, file$1, 277, 32, 16970);
    			attr_dev(div58, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div58, file$1, 273, 28, 16622);
    			attr_dev(a23, "class", "text-decoration-none");
    			add_location(a23, file$1, 272, 24, 16560);
    			attr_dev(div59, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div59, file$1, 271, 20, 16449);
    			attr_dev(img11, "class", "img-fluid");
    			if (!src_url_equal(img11.src, img11_src_value = "img/cat-8.jpg")) attr_dev(img11, "src", img11_src_value);
    			attr_dev(img11, "alt", "");
    			set_style(img11, "height", "119px");
    			add_location(img11, file$1, 289, 36, 17754);
    			attr_dev(div60, "class", "overflow-hidden");
    			set_style(div60, "width", "120px");
    			set_style(div60, "height", "120px");
    			add_location(div60, file$1, 288, 32, 17650);
    			add_location(h68, file$1, 292, 36, 17967);
    			attr_dev(small14, "class", "text-body");
    			add_location(small14, file$1, 293, 36, 18036);
    			attr_dev(small15, "class", "text-price svelte-d9yz2r");
    			add_location(small15, file$1, 294, 36, 18119);
    			attr_dev(div61, "class", "flex-fill pl-3");
    			add_location(div61, file$1, 291, 32, 17901);
    			attr_dev(div62, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div62, file$1, 287, 28, 17554);
    			attr_dev(a24, "class", "text-decoration-none");
    			add_location(a24, file$1, 286, 24, 17492);
    			attr_dev(div63, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div63, file$1, 285, 20, 17381);
    			attr_dev(div64, "class", "row px-xl-5 pb-3");
    			add_location(div64, file$1, 185, 16, 10709);
    			attr_dev(div65, "class", "container-fluid");
    			add_location(div65, file$1, 183, 12, 10521);
    			attr_dev(span9, "class", "bg-secondary pr-3");
    			add_location(span9, file$1, 303, 88, 18492);
    			attr_dev(h21, "class", "section-title position-relative text-uppercase mx-xl-5 mb-4");
    			add_location(h21, file$1, 303, 16, 18420);
    			attr_dev(img12, "class", "img-fluid");
    			if (!src_url_equal(img12.src, img12_src_value = "img/cat-9.webp")) attr_dev(img12, "src", img12_src_value);
    			attr_dev(img12, "alt", "");
    			set_style(img12, "height", "119px");
    			add_location(img12, file$1, 309, 36, 18977);
    			attr_dev(div66, "class", "overflow-hidden");
    			set_style(div66, "width", "120px");
    			set_style(div66, "height", "120px");
    			add_location(div66, file$1, 308, 32, 18873);
    			add_location(h69, file$1, 312, 36, 19191);
    			attr_dev(small16, "class", "text-body");
    			add_location(small16, file$1, 313, 36, 19247);
    			attr_dev(small17, "class", "text-price svelte-d9yz2r");
    			add_location(small17, file$1, 314, 36, 19329);
    			attr_dev(div67, "class", "flex-fill pl-3");
    			add_location(div67, file$1, 311, 32, 19125);
    			attr_dev(div68, "class", "cat-item d-flex align-items-center mb-4");
    			add_location(div68, file$1, 307, 28, 18786);
    			attr_dev(a25, "class", "text-decoration-none");
    			add_location(a25, file$1, 306, 24, 18724);
    			attr_dev(div69, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div69, file$1, 305, 20, 18613);
    			attr_dev(img13, "class", "img-fluid");
    			if (!src_url_equal(img13.src, img13_src_value = "img/cat-10.png")) attr_dev(img13, "src", img13_src_value);
    			attr_dev(img13, "alt", "");
    			set_style(img13, "height", "119px");
    			add_location(img13, file$1, 323, 36, 19900);
    			attr_dev(div70, "class", "overflow-hidden");
    			set_style(div70, "width", "120px");
    			set_style(div70, "height", "120px");
    			add_location(div70, file$1, 322, 32, 19796);
    			add_location(h610, file$1, 326, 36, 20114);
    			attr_dev(small18, "class", "text-body");
    			add_location(small18, file$1, 327, 36, 20170);
    			attr_dev(small19, "class", "text-price svelte-d9yz2r");
    			add_location(small19, file$1, 328, 36, 20253);
    			attr_dev(div71, "class", "flex-fill pl-3");
    			add_location(div71, file$1, 325, 32, 20048);
    			attr_dev(div72, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div72, file$1, 321, 28, 19700);
    			attr_dev(a26, "class", "text-decoration-none");
    			add_location(a26, file$1, 320, 24, 19638);
    			attr_dev(div73, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div73, file$1, 319, 20, 19527);
    			attr_dev(img14, "class", "img-fluid");
    			if (!src_url_equal(img14.src, img14_src_value = "img/cat-11.webp")) attr_dev(img14, "src", img14_src_value);
    			attr_dev(img14, "alt", "");
    			set_style(img14, "height", "119px");
    			set_style(img14, "width", "120px");
    			add_location(img14, file$1, 337, 36, 20824);
    			attr_dev(div74, "class", "overflow-hidden");
    			set_style(div74, "width", "120px");
    			set_style(div74, "height", "120px");
    			add_location(div74, file$1, 336, 32, 20720);
    			add_location(h611, file$1, 340, 36, 21051);
    			attr_dev(small20, "class", "text-body");
    			add_location(small20, file$1, 341, 36, 21108);
    			attr_dev(small21, "class", "text-price svelte-d9yz2r");
    			add_location(small21, file$1, 342, 36, 21191);
    			attr_dev(div75, "class", "flex-fill pl-3");
    			add_location(div75, file$1, 339, 32, 20985);
    			attr_dev(div76, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div76, file$1, 335, 28, 20624);
    			attr_dev(a27, "class", "text-decoration-none");
    			add_location(a27, file$1, 334, 24, 20562);
    			attr_dev(div77, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div77, file$1, 333, 20, 20451);
    			attr_dev(div78, "class", "row px-xl-5 pb-3");
    			add_location(div78, file$1, 304, 16, 18561);
    			attr_dev(div79, "class", "container-fluid pt-5");
    			add_location(div79, file$1, 302, 12, 18368);
    			attr_dev(div80, "class", "content-page svelte-d9yz2r");
    			add_location(div80, file$1, 136, 8, 6888);
    			attr_dev(i6, "class", "fas fa-shopping-cart");
    			set_style(i6, "color", "red");
    			set_style(i6, "font-size", "15px");
    			add_location(i6, file$1, 355, 78, 21695);
    			set_style(span10, "padding-bottom", "2px");
    			set_style(span10, "color", "red");
    			set_style(span10, "font-size", "10px");
    			add_location(span10, file$1, 355, 16, 21633);
    			attr_dev(a28, "href", "#");
    			attr_dev(a28, "class", "btn px-0 ");
    			set_style(a28, "margin-left", "3px");
    			attr_dev(a28, "data-toggle", "modal");
    			attr_dev(a28, "data-target", ".bd-example-modal-sm");
    			add_location(a28, file$1, 354, 12, 21502);
    			if (!src_url_equal(img15.src, img15_src_value = "img/scanner.png")) attr_dev(img15, "src", img15_src_value);
    			attr_dev(img15, "alt", "");
    			attr_dev(img15, "width", "25");
    			attr_dev(img15, "height", "25");
    			add_location(img15, file$1, 358, 16, 21912);
    			attr_dev(a29, "href", "#");
    			attr_dev(a29, "class", "btn px-0 ");
    			set_style(a29, "margin-left", "3px");
    			add_location(a29, file$1, 357, 12, 21811);
    			attr_dev(div81, "class", "card back-to-card bg-dark svelte-d9yz2r");
    			add_location(div81, file$1, 353, 8, 21448);
    			if (!src_url_equal(img16.src, img16_src_value = "img/goeat.png")) attr_dev(img16, "src", img16_src_value);
    			attr_dev(img16, "width", "40");
    			attr_dev(img16, "height", "40");
    			add_location(img16, file$1, 367, 72, 22361);
    			attr_dev(h51, "class", "modal-title");
    			attr_dev(h51, "id", "exampleModalLabel");
    			add_location(h51, file$1, 367, 24, 22313);
    			attr_dev(span11, "aria-hidden", "true");
    			add_location(span11, file$1, 369, 24, 22550);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "close");
    			attr_dev(button1, "data-dismiss", "modal");
    			attr_dev(button1, "aria-label", "Close");
    			add_location(button1, file$1, 368, 24, 22448);
    			attr_dev(div82, "class", "modal-header");
    			add_location(div82, file$1, 366, 20, 22261);
    			attr_dev(img17, "class", "img-fluid");
    			if (!src_url_equal(img17.src, img17_src_value = "img/cat-9.webp")) attr_dev(img17, "src", img17_src_value);
    			attr_dev(img17, "alt", "");
    			set_style(img17, "height", "70px");
    			add_location(img17, file$1, 380, 48, 23374);
    			attr_dev(div83, "class", "overflow-hidden");
    			set_style(div83, "width", "100px");
    			set_style(div83, "height", "70px");
    			add_location(div83, file$1, 379, 44, 23259);
    			add_location(h612, file$1, 383, 48, 23623);
    			attr_dev(small22, "class", "text-body");
    			add_location(small22, file$1, 384, 48, 23691);
    			attr_dev(small23, "class", "text-price svelte-d9yz2r");
    			add_location(small23, file$1, 385, 48, 23785);
    			attr_dev(div84, "class", "flex-fill pl-3");
    			add_location(div84, file$1, 382, 44, 23545);
    			attr_dev(div85, "class", "cat-item d-flex align-items-center mb-4");
    			add_location(div85, file$1, 378, 40, 23160);
    			attr_dev(a30, "href", "#");
    			attr_dev(a30, "class", "text-decoration-none");
    			add_location(a30, file$1, 377, 36, 23076);
    			attr_dev(div86, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div86, file$1, 376, 32, 22953);
    			attr_dev(img18, "class", "img-fluid");
    			if (!src_url_equal(img18.src, img18_src_value = "img/cat-10.png")) attr_dev(img18, "src", img18_src_value);
    			attr_dev(img18, "alt", "");
    			set_style(img18, "height", "70px");
    			add_location(img18, file$1, 395, 48, 24565);
    			attr_dev(div87, "class", "overflow-hidden");
    			set_style(div87, "width", "100px");
    			set_style(div87, "height", "70px");
    			add_location(div87, file$1, 394, 44, 24450);
    			add_location(h613, file$1, 398, 48, 24814);
    			attr_dev(small24, "class", "text-body");
    			add_location(small24, file$1, 399, 48, 24882);
    			attr_dev(small25, "class", "text-price svelte-d9yz2r");
    			add_location(small25, file$1, 400, 48, 24977);
    			attr_dev(div88, "class", "flex-fill pl-3");
    			add_location(div88, file$1, 397, 44, 24736);
    			attr_dev(div89, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div89, file$1, 393, 40, 24342);
    			attr_dev(a31, "href", "#");
    			attr_dev(a31, "class", "text-decoration-none");
    			add_location(a31, file$1, 392, 36, 24258);
    			attr_dev(div90, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div90, file$1, 391, 32, 24135);
    			attr_dev(img19, "class", "img-fluid");
    			if (!src_url_equal(img19.src, img19_src_value = "img/cat-11.webp")) attr_dev(img19, "src", img19_src_value);
    			attr_dev(img19, "alt", "");
    			set_style(img19, "height", "70px");
    			add_location(img19, file$1, 410, 48, 25757);
    			attr_dev(div91, "class", "overflow-hidden");
    			set_style(div91, "width", "100px");
    			set_style(div91, "height", "70px");
    			add_location(div91, file$1, 409, 44, 25642);
    			add_location(h614, file$1, 413, 48, 26007);
    			attr_dev(small26, "class", "text-body");
    			add_location(small26, file$1, 414, 48, 26076);
    			attr_dev(small27, "class", "text-price svelte-d9yz2r");
    			add_location(small27, file$1, 415, 48, 26171);
    			attr_dev(div92, "class", "flex-fill pl-3");
    			add_location(div92, file$1, 412, 44, 25929);
    			attr_dev(div93, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div93, file$1, 408, 40, 25534);
    			attr_dev(a32, "href", "#");
    			attr_dev(a32, "class", "text-decoration-none");
    			add_location(a32, file$1, 407, 36, 25450);
    			attr_dev(div94, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div94, file$1, 406, 32, 25327);
    			attr_dev(img20, "class", "img-fluid");
    			if (!src_url_equal(img20.src, img20_src_value = "img/cat-11.webp")) attr_dev(img20, "src", img20_src_value);
    			attr_dev(img20, "alt", "");
    			set_style(img20, "height", "70px");
    			add_location(img20, file$1, 426, 48, 27024);
    			attr_dev(div95, "class", "overflow-hidden");
    			set_style(div95, "width", "100px");
    			set_style(div95, "height", "70px");
    			add_location(div95, file$1, 425, 44, 26909);
    			add_location(h615, file$1, 429, 48, 27274);
    			attr_dev(small28, "class", "text-body");
    			add_location(small28, file$1, 430, 48, 27343);
    			attr_dev(small29, "class", "text-price svelte-d9yz2r");
    			add_location(small29, file$1, 431, 48, 27438);
    			attr_dev(div96, "class", "flex-fill pl-3");
    			add_location(div96, file$1, 428, 44, 27196);
    			attr_dev(div97, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div97, file$1, 424, 40, 26801);
    			attr_dev(a33, "class", "text-decoration-none");
    			add_location(a33, file$1, 423, 36, 26727);
    			attr_dev(div98, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div98, file$1, 421, 32, 26521);
    			attr_dev(img21, "class", "img-fluid");
    			if (!src_url_equal(img21.src, img21_src_value = "img/cat-11.webp")) attr_dev(img21, "src", img21_src_value);
    			attr_dev(img21, "alt", "");
    			set_style(img21, "height", "70px");
    			add_location(img21, file$1, 442, 48, 28291);
    			attr_dev(div99, "class", "overflow-hidden");
    			set_style(div99, "width", "100px");
    			set_style(div99, "height", "70px");
    			add_location(div99, file$1, 441, 44, 28176);
    			add_location(h616, file$1, 445, 48, 28541);
    			attr_dev(small30, "class", "text-body");
    			add_location(small30, file$1, 446, 48, 28610);
    			attr_dev(small31, "class", "text-price svelte-d9yz2r");
    			add_location(small31, file$1, 447, 48, 28705);
    			attr_dev(div100, "class", "flex-fill pl-3");
    			add_location(div100, file$1, 444, 44, 28463);
    			attr_dev(div101, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div101, file$1, 440, 40, 28068);
    			attr_dev(a34, "class", "text-decoration-none");
    			add_location(a34, file$1, 439, 36, 27994);
    			attr_dev(div102, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div102, file$1, 437, 32, 27788);
    			attr_dev(div103, "class", "row px-xl-5 pb-3");
    			set_style(div103, "overflow", "auto");
    			set_style(div103, "height", "250px");
    			add_location(div103, file$1, 374, 28, 22760);
    			add_location(form1, file$1, 373, 24, 22724);
    			attr_dev(div104, "class", "modal-body");
    			add_location(div104, file$1, 372, 20, 22674);
    			add_location(strong0, file$1, 459, 95, 29333);
    			attr_dev(span12, "class", "span-secundary svelte-d9yz2r");
    			set_style(span12, "padding", "0");
    			set_style(span12, "margin", "0");
    			add_location(span12, file$1, 459, 36, 29274);
    			add_location(td0, file$1, 458, 32, 29232);
    			attr_dev(span13, "class", "span-secundary svelte-d9yz2r");
    			set_style(span13, "padding", "0");
    			set_style(span13, "margin", "0");
    			add_location(span13, file$1, 462, 36, 29482);
    			add_location(td1, file$1, 461, 32, 29440);
    			set_style(tr0, "padding", "0");
    			set_style(tr0, "margin", "0");
    			add_location(tr0, file$1, 457, 28, 29164);
    			add_location(strong1, file$1, 468, 66, 29803);
    			attr_dev(span14, "class", "span-secundary svelte-d9yz2r");
    			add_location(span14, file$1, 468, 36, 29773);
    			add_location(td2, file$1, 467, 32, 29731);
    			attr_dev(span15, "class", "span-secundary svelte-d9yz2r");
    			add_location(span15, file$1, 471, 36, 29951);
    			add_location(td3, file$1, 470, 32, 29909);
    			add_location(tr1, file$1, 466, 28, 29693);
    			add_location(strong2, file$1, 476, 63, 30212);
    			attr_dev(span16, "class", "span-primary svelte-d9yz2r");
    			add_location(span16, file$1, 476, 36, 30185);
    			add_location(td4, file$1, 475, 32, 30143);
    			add_location(strong3, file$1, 479, 63, 30384);
    			attr_dev(span17, "class", "span-primary svelte-d9yz2r");
    			add_location(span17, file$1, 479, 36, 30357);
    			add_location(td5, file$1, 478, 32, 30315);
    			add_location(tr2, file$1, 474, 28, 30105);
    			set_style(tbody0, "line-height", "normal");
    			add_location(tbody0, file$1, 456, 24, 29100);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "btn btn-primary btn-car svelte-d9yz2r");
    			add_location(button2, file$1, 483, 24, 30593);
    			attr_dev(div105, "class", "modal-footer");
    			add_location(div105, file$1, 455, 20, 29048);
    			attr_dev(div106, "class", "modal-content");
    			add_location(div106, file$1, 365, 16, 22212);
    			attr_dev(div107, "class", "modal-dialog modal-xl");
    			add_location(div107, file$1, 364, 12, 22159);
    			attr_dev(div108, "class", "modal fade bd-example-modal-sm");
    			attr_dev(div108, "tabindex", "-1");
    			attr_dev(div108, "role", "dialog");
    			attr_dev(div108, "aria-labelledby", "mySmallModalLabel");
    			attr_dev(div108, "aria-hidden", "true");
    			add_location(div108, file$1, 363, 8, 22018);
    			attr_dev(h52, "class", "modal-title");
    			attr_dev(h52, "id", "exampleModalLabel");
    			add_location(h52, file$1, 492, 24, 31051);
    			attr_dev(span18, "aria-hidden", "true");
    			add_location(span18, file$1, 494, 24, 31248);
    			attr_dev(button3, "type", "button");
    			attr_dev(button3, "class", "close");
    			attr_dev(button3, "data-dismiss", "modal");
    			attr_dev(button3, "aria-label", "Close");
    			add_location(button3, file$1, 493, 24, 31146);
    			attr_dev(div109, "class", "modal-header");
    			add_location(div109, file$1, 491, 20, 30999);
    			attr_dev(img22, "class", "img-fluid");
    			if (!src_url_equal(img22.src, img22_src_value = "img/cat-3.jpg")) attr_dev(img22, "src", img22_src_value);
    			attr_dev(img22, "alt", "");
    			set_style(img22, "height", "70px");
    			set_style(img22, "width", "100%");
    			add_location(img22, file$1, 505, 48, 32072);
    			attr_dev(div110, "class", "overflow-hidden");
    			set_style(div110, "width", "100px");
    			set_style(div110, "height", "70px");
    			add_location(div110, file$1, 504, 44, 31957);
    			add_location(h617, file$1, 508, 48, 32333);
    			attr_dev(small32, "class", "text-body");
    			add_location(small32, file$1, 509, 48, 32414);
    			attr_dev(small33, "class", "text-price svelte-d9yz2r");
    			add_location(small33, file$1, 510, 48, 32508);
    			attr_dev(div111, "class", "flex-fill pl-3");
    			add_location(div111, file$1, 507, 44, 32255);
    			attr_dev(div112, "class", "cat-item d-flex align-items-center mb-4");
    			add_location(div112, file$1, 503, 40, 31858);
    			attr_dev(a35, "href", "#");
    			attr_dev(a35, "class", "text-decoration-none");
    			add_location(a35, file$1, 502, 36, 31774);
    			attr_dev(div113, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div113, file$1, 501, 32, 31651);
    			attr_dev(img23, "class", "img-fluid");
    			if (!src_url_equal(img23.src, img23_src_value = "img/cat-1.jpg")) attr_dev(img23, "src", img23_src_value);
    			attr_dev(img23, "alt", "");
    			set_style(img23, "height", "70px");
    			add_location(img23, file$1, 520, 48, 33289);
    			attr_dev(div114, "class", "overflow-hidden");
    			set_style(div114, "width", "100px");
    			set_style(div114, "height", "70px");
    			add_location(div114, file$1, 519, 44, 33174);
    			add_location(h618, file$1, 523, 48, 33537);
    			attr_dev(small34, "class", "text-body");
    			add_location(small34, file$1, 524, 48, 33616);
    			attr_dev(small35, "class", "text-price svelte-d9yz2r");
    			add_location(small35, file$1, 525, 48, 33711);
    			attr_dev(div115, "class", "flex-fill pl-3");
    			add_location(div115, file$1, 522, 44, 33459);
    			attr_dev(div116, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div116, file$1, 518, 40, 33066);
    			attr_dev(a36, "href", "#");
    			attr_dev(a36, "class", "text-decoration-none");
    			add_location(a36, file$1, 517, 36, 32982);
    			attr_dev(div117, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div117, file$1, 516, 32, 32859);
    			attr_dev(img24, "class", "img-fluid");
    			if (!src_url_equal(img24.src, img24_src_value = "img/cat-4.jpg")) attr_dev(img24, "src", img24_src_value);
    			attr_dev(img24, "alt", "");
    			set_style(img24, "height", "70px");
    			add_location(img24, file$1, 535, 48, 34492);
    			attr_dev(div118, "class", "overflow-hidden");
    			set_style(div118, "width", "100px");
    			set_style(div118, "height", "70px");
    			add_location(div118, file$1, 534, 44, 34377);
    			add_location(h619, file$1, 538, 48, 34740);
    			attr_dev(small36, "class", "text-body");
    			add_location(small36, file$1, 539, 48, 34813);
    			attr_dev(small37, "class", "text-price svelte-d9yz2r");
    			add_location(small37, file$1, 540, 48, 34908);
    			attr_dev(div119, "class", "flex-fill pl-3");
    			add_location(div119, file$1, 537, 44, 34662);
    			attr_dev(div120, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div120, file$1, 533, 40, 34269);
    			attr_dev(a37, "href", "#");
    			attr_dev(a37, "class", "text-decoration-none");
    			add_location(a37, file$1, 532, 36, 34185);
    			attr_dev(div121, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div121, file$1, 531, 32, 34062);
    			attr_dev(div122, "class", "row px-xl-5 pb-3");
    			set_style(div122, "overflow", "auto");
    			set_style(div122, "height", "250px");
    			add_location(div122, file$1, 499, 28, 31458);
    			add_location(form2, file$1, 498, 24, 31422);
    			attr_dev(div123, "class", "modal-body");
    			add_location(div123, file$1, 497, 20, 31372);
    			add_location(strong4, file$1, 555, 93, 35663);
    			attr_dev(span19, "class", "span-primary svelte-d9yz2r");
    			set_style(span19, "padding", "0");
    			set_style(span19, "margin", "0");
    			add_location(span19, file$1, 555, 36, 35606);
    			add_location(td6, file$1, 554, 32, 35564);
    			attr_dev(span20, "class", "span-primary svelte-d9yz2r");
    			set_style(span20, "padding", "0");
    			set_style(span20, "margin", "0");
    			add_location(span20, file$1, 558, 36, 35807);
    			add_location(td7, file$1, 557, 32, 35765);
    			set_style(tr3, "padding", "0");
    			set_style(tr3, "margin", "0");
    			add_location(tr3, file$1, 553, 28, 35496);
    			add_location(strong5, file$1, 565, 63, 36131);
    			attr_dev(span21, "class", "span-primary svelte-d9yz2r");
    			add_location(span21, file$1, 565, 36, 36104);
    			add_location(td8, file$1, 564, 32, 36062);
    			add_location(strong6, file$1, 568, 63, 36303);
    			attr_dev(span22, "class", "span-primary svelte-d9yz2r");
    			add_location(span22, file$1, 568, 36, 36276);
    			add_location(td9, file$1, 567, 32, 36234);
    			add_location(tr4, file$1, 563, 28, 36024);
    			set_style(tbody1, "line-height", "normal");
    			add_location(tbody1, file$1, 552, 24, 35432);
    			attr_dev(button4, "type", "button");
    			attr_dev(button4, "class", "btn btn-primary btn-car svelte-d9yz2r");
    			add_location(button4, file$1, 572, 24, 36512);
    			attr_dev(div124, "class", "modal-footer");
    			add_location(div124, file$1, 551, 20, 35380);
    			attr_dev(div125, "class", "modal-content");
    			add_location(div125, file$1, 490, 16, 30950);
    			attr_dev(div126, "class", "modal-dialog modal-xl");
    			add_location(div126, file$1, 489, 12, 30897);
    			attr_dev(div127, "class", "modal fade bd-model");
    			attr_dev(div127, "tabindex", "-1");
    			attr_dev(div127, "role", "dialog");
    			attr_dev(div127, "aria-labelledby", "mySmallModalLabel");
    			attr_dev(div127, "aria-hidden", "true");
    			add_location(div127, file$1, 488, 8, 30767);
    			attr_dev(body, "class", "svelte-d9yz2r");
    			add_location(body, file$1, 45, 4, 1147);
    			add_location(main, file$1, 43, 0, 1133);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, body);
    			append_dev(body, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div0);
    			append_dev(div0, img0);
    			append_dev(div0, t0);
    			append_dev(div0, a0);
    			append_dev(a0, span0);
    			append_dev(a0, t2);
    			append_dev(a0, span1);
    			append_dev(div5, t4);
    			append_dev(div5, div3);
    			append_dev(div3, form0);
    			append_dev(form0, div2);
    			append_dev(div2, input);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, span2);
    			append_dev(span2, i0);
    			append_dev(div5, t6);
    			append_dev(div5, div4);
    			append_dev(div4, p0);
    			append_dev(div4, t8);
    			append_dev(div4, h50);
    			append_dev(body, t10);
    			append_dev(body, div17);
    			append_dev(div17, div16);
    			append_dev(div16, div9);
    			append_dev(div9, a1);
    			append_dev(a1, h60);
    			append_dev(h60, i1);
    			append_dev(h60, t11);
    			append_dev(a1, t12);
    			append_dev(a1, i2);
    			append_dev(div9, t13);
    			append_dev(div9, nav0);
    			append_dev(nav0, div8);
    			append_dev(div8, div7);
    			append_dev(div7, a2);
    			append_dev(div7, t15);
    			append_dev(div7, a3);
    			append_dev(div7, t17);
    			append_dev(div7, a4);
    			append_dev(div7, t19);
    			append_dev(div7, a5);
    			append_dev(div7, t21);
    			append_dev(div7, a6);
    			append_dev(div16, t23);
    			append_dev(div16, div15);
    			append_dev(div15, nav1);
    			append_dev(nav1, button0);
    			append_dev(button0, span3);
    			append_dev(nav1, t24);
    			append_dev(nav1, a7);
    			append_dev(a7, span4);
    			append_dev(a7, t26);
    			append_dev(a7, span5);
    			append_dev(nav1, t28);
    			append_dev(nav1, div14);
    			append_dev(div14, div12);
    			append_dev(div12, a8);
    			append_dev(div12, t30);
    			append_dev(div12, a9);
    			append_dev(div12, t32);
    			append_dev(div12, a10);
    			append_dev(div12, t34);
    			append_dev(div12, div11);
    			append_dev(div11, a11);
    			append_dev(a11, t35);
    			append_dev(a11, i3);
    			append_dev(div11, t36);
    			append_dev(div11, div10);
    			append_dev(div10, a12);
    			append_dev(div10, t38);
    			append_dev(div10, a13);
    			append_dev(div12, t40);
    			append_dev(div12, a14);
    			append_dev(div14, t42);
    			append_dev(div14, div13);
    			append_dev(div13, a15);
    			append_dev(a15, i4);
    			append_dev(a15, t43);
    			append_dev(a15, span6);
    			append_dev(div13, t45);
    			append_dev(div13, a16);
    			append_dev(a16, i5);
    			append_dev(a16, t46);
    			append_dev(a16, span7);
    			append_dev(span7, t47);
    			append_dev(body, t48);
    			append_dev(body, div80);
    			append_dev(div80, div31);
    			append_dev(div31, div30);
    			append_dev(div30, div29);
    			append_dev(div29, div28);
    			append_dev(div28, ol);
    			append_dev(ol, li0);
    			append_dev(ol, t49);
    			append_dev(ol, li1);
    			append_dev(ol, t50);
    			append_dev(ol, li2);
    			append_dev(div28, t51);
    			append_dev(div28, div27);
    			append_dev(div27, div20);
    			append_dev(div20, img1);
    			append_dev(div20, t52);
    			append_dev(div20, div19);
    			append_dev(div19, div18);
    			append_dev(div18, h10);
    			append_dev(div18, t54);
    			append_dev(div18, p1);
    			append_dev(div27, t56);
    			append_dev(div27, div23);
    			append_dev(div23, img2);
    			append_dev(div23, t57);
    			append_dev(div23, div22);
    			append_dev(div22, div21);
    			append_dev(div21, h11);
    			append_dev(div21, t59);
    			append_dev(div21, p2);
    			append_dev(div27, t61);
    			append_dev(div27, div26);
    			append_dev(div26, img3);
    			append_dev(div26, t62);
    			append_dev(div26, div25);
    			append_dev(div25, div24);
    			append_dev(div24, h12);
    			append_dev(div24, t64);
    			append_dev(div24, p3);
    			append_dev(div80, t66);
    			append_dev(div80, div65);
    			append_dev(div65, h20);
    			append_dev(h20, span8);
    			append_dev(div65, t68);
    			append_dev(div65, div64);
    			append_dev(div64, div35);
    			append_dev(div35, a17);
    			append_dev(a17, div34);
    			append_dev(div34, div32);
    			append_dev(div32, img4);
    			append_dev(div34, t69);
    			append_dev(div34, div33);
    			append_dev(div33, h61);
    			append_dev(div33, t71);
    			append_dev(div33, small0);
    			append_dev(div33, t73);
    			append_dev(div33, small1);
    			append_dev(div64, t75);
    			append_dev(div64, div39);
    			append_dev(div39, a18);
    			append_dev(a18, div38);
    			append_dev(div38, div36);
    			append_dev(div36, img5);
    			append_dev(div38, t76);
    			append_dev(div38, div37);
    			append_dev(div37, h62);
    			append_dev(div37, t78);
    			append_dev(div37, small2);
    			append_dev(div37, t80);
    			append_dev(div37, small3);
    			append_dev(div64, t82);
    			append_dev(div64, div43);
    			append_dev(div43, a19);
    			append_dev(a19, div42);
    			append_dev(div42, div40);
    			append_dev(div40, img6);
    			append_dev(div42, t83);
    			append_dev(div42, div41);
    			append_dev(div41, h63);
    			append_dev(div41, t85);
    			append_dev(div41, small4);
    			append_dev(div41, t87);
    			append_dev(div41, small5);
    			append_dev(div64, t89);
    			append_dev(div64, div47);
    			append_dev(div47, a20);
    			append_dev(a20, div46);
    			append_dev(div46, div44);
    			append_dev(div44, img7);
    			append_dev(div46, t90);
    			append_dev(div46, div45);
    			append_dev(div45, h64);
    			append_dev(div45, t92);
    			append_dev(div45, small6);
    			append_dev(div45, t94);
    			append_dev(div45, small7);
    			append_dev(div64, t96);
    			append_dev(div64, div51);
    			append_dev(div51, a21);
    			append_dev(a21, div50);
    			append_dev(div50, div48);
    			append_dev(div48, img8);
    			append_dev(div50, t97);
    			append_dev(div50, div49);
    			append_dev(div49, h65);
    			append_dev(div49, t99);
    			append_dev(div49, small8);
    			append_dev(div49, t101);
    			append_dev(div49, small9);
    			append_dev(div64, t103);
    			append_dev(div64, div55);
    			append_dev(div55, a22);
    			append_dev(a22, div54);
    			append_dev(div54, div52);
    			append_dev(div52, img9);
    			append_dev(div54, t104);
    			append_dev(div54, div53);
    			append_dev(div53, h66);
    			append_dev(div53, t106);
    			append_dev(div53, small10);
    			append_dev(div53, t108);
    			append_dev(div53, small11);
    			append_dev(div64, t110);
    			append_dev(div64, div59);
    			append_dev(div59, a23);
    			append_dev(a23, div58);
    			append_dev(div58, div56);
    			append_dev(div56, img10);
    			append_dev(div58, t111);
    			append_dev(div58, div57);
    			append_dev(div57, h67);
    			append_dev(div57, t113);
    			append_dev(div57, small12);
    			append_dev(div57, t115);
    			append_dev(div57, small13);
    			append_dev(div64, t117);
    			append_dev(div64, div63);
    			append_dev(div63, a24);
    			append_dev(a24, div62);
    			append_dev(div62, div60);
    			append_dev(div60, img11);
    			append_dev(div62, t118);
    			append_dev(div62, div61);
    			append_dev(div61, h68);
    			append_dev(div61, t120);
    			append_dev(div61, small14);
    			append_dev(div61, t122);
    			append_dev(div61, small15);
    			append_dev(div80, t124);
    			append_dev(div80, div79);
    			append_dev(div79, h21);
    			append_dev(h21, span9);
    			append_dev(div79, t126);
    			append_dev(div79, div78);
    			append_dev(div78, div69);
    			append_dev(div69, a25);
    			append_dev(a25, div68);
    			append_dev(div68, div66);
    			append_dev(div66, img12);
    			append_dev(div68, t127);
    			append_dev(div68, div67);
    			append_dev(div67, h69);
    			append_dev(div67, t129);
    			append_dev(div67, small16);
    			append_dev(div67, t131);
    			append_dev(div67, small17);
    			append_dev(div78, t133);
    			append_dev(div78, div73);
    			append_dev(div73, a26);
    			append_dev(a26, div72);
    			append_dev(div72, div70);
    			append_dev(div70, img13);
    			append_dev(div72, t134);
    			append_dev(div72, div71);
    			append_dev(div71, h610);
    			append_dev(div71, t136);
    			append_dev(div71, small18);
    			append_dev(div71, t138);
    			append_dev(div71, small19);
    			append_dev(div78, t140);
    			append_dev(div78, div77);
    			append_dev(div77, a27);
    			append_dev(a27, div76);
    			append_dev(div76, div74);
    			append_dev(div74, img14);
    			append_dev(div76, t141);
    			append_dev(div76, div75);
    			append_dev(div75, h611);
    			append_dev(div75, t143);
    			append_dev(div75, small20);
    			append_dev(div75, t145);
    			append_dev(div75, small21);
    			append_dev(body, t147);
    			append_dev(body, div81);
    			append_dev(div81, a28);
    			append_dev(a28, span10);
    			append_dev(span10, i6);
    			append_dev(span10, t148);
    			append_dev(div81, t149);
    			append_dev(div81, a29);
    			append_dev(a29, img15);
    			append_dev(body, t150);
    			append_dev(body, div108);
    			append_dev(div108, div107);
    			append_dev(div107, div106);
    			append_dev(div106, div82);
    			append_dev(div82, h51);
    			append_dev(h51, img16);
    			append_dev(h51, t151);
    			append_dev(div82, t152);
    			append_dev(div82, button1);
    			append_dev(button1, span11);
    			append_dev(div106, t154);
    			append_dev(div106, div104);
    			append_dev(div104, form1);
    			append_dev(form1, div103);
    			append_dev(div103, div86);
    			append_dev(div86, a30);
    			append_dev(a30, div85);
    			append_dev(div85, div83);
    			append_dev(div83, img17);
    			append_dev(div85, t155);
    			append_dev(div85, div84);
    			append_dev(div84, h612);
    			append_dev(div84, t157);
    			append_dev(div84, small22);
    			append_dev(div84, t159);
    			append_dev(div84, small23);
    			append_dev(div103, t161);
    			append_dev(div103, div90);
    			append_dev(div90, a31);
    			append_dev(a31, div89);
    			append_dev(div89, div87);
    			append_dev(div87, img18);
    			append_dev(div89, t162);
    			append_dev(div89, div88);
    			append_dev(div88, h613);
    			append_dev(div88, t164);
    			append_dev(div88, small24);
    			append_dev(div88, t166);
    			append_dev(div88, small25);
    			append_dev(div103, t168);
    			append_dev(div103, div94);
    			append_dev(div94, a32);
    			append_dev(a32, div93);
    			append_dev(div93, div91);
    			append_dev(div91, img19);
    			append_dev(div93, t169);
    			append_dev(div93, div92);
    			append_dev(div92, h614);
    			append_dev(div92, t171);
    			append_dev(div92, small26);
    			append_dev(div92, t173);
    			append_dev(div92, small27);
    			append_dev(div103, t175);
    			append_dev(div103, div98);
    			append_dev(div98, a33);
    			append_dev(a33, div97);
    			append_dev(div97, div95);
    			append_dev(div95, img20);
    			append_dev(div97, t176);
    			append_dev(div97, div96);
    			append_dev(div96, h615);
    			append_dev(div96, t178);
    			append_dev(div96, small28);
    			append_dev(div96, t180);
    			append_dev(div96, small29);
    			append_dev(div103, t182);
    			append_dev(div103, div102);
    			append_dev(div102, a34);
    			append_dev(a34, div101);
    			append_dev(div101, div99);
    			append_dev(div99, img21);
    			append_dev(div101, t183);
    			append_dev(div101, div100);
    			append_dev(div100, h616);
    			append_dev(div100, t185);
    			append_dev(div100, small30);
    			append_dev(div100, t187);
    			append_dev(div100, small31);
    			append_dev(div106, t189);
    			append_dev(div106, div105);
    			append_dev(div105, tbody0);
    			append_dev(tbody0, tr0);
    			append_dev(tr0, td0);
    			append_dev(td0, span12);
    			append_dev(span12, strong0);
    			append_dev(tr0, t191);
    			append_dev(tr0, td1);
    			append_dev(td1, span13);
    			append_dev(tbody0, t193);
    			append_dev(tbody0, tr1);
    			append_dev(tr1, td2);
    			append_dev(td2, span14);
    			append_dev(span14, strong1);
    			append_dev(tr1, t195);
    			append_dev(tr1, td3);
    			append_dev(td3, span15);
    			append_dev(tbody0, t197);
    			append_dev(tbody0, tr2);
    			append_dev(tr2, td4);
    			append_dev(td4, span16);
    			append_dev(span16, strong2);
    			append_dev(tr2, t199);
    			append_dev(tr2, td5);
    			append_dev(td5, span17);
    			append_dev(span17, strong3);
    			append_dev(div105, t201);
    			append_dev(div105, button2);
    			append_dev(body, t203);
    			append_dev(body, div127);
    			append_dev(div127, div126);
    			append_dev(div126, div125);
    			append_dev(div125, div109);
    			append_dev(div109, h52);
    			append_dev(div109, t205);
    			append_dev(div109, button3);
    			append_dev(button3, span18);
    			append_dev(div125, t207);
    			append_dev(div125, div123);
    			append_dev(div123, form2);
    			append_dev(form2, div122);
    			append_dev(div122, div113);
    			append_dev(div113, a35);
    			append_dev(a35, div112);
    			append_dev(div112, div110);
    			append_dev(div110, img22);
    			append_dev(div112, t208);
    			append_dev(div112, div111);
    			append_dev(div111, h617);
    			append_dev(div111, t210);
    			append_dev(div111, small32);
    			append_dev(div111, t212);
    			append_dev(div111, small33);
    			append_dev(div122, t214);
    			append_dev(div122, div117);
    			append_dev(div117, a36);
    			append_dev(a36, div116);
    			append_dev(div116, div114);
    			append_dev(div114, img23);
    			append_dev(div116, t215);
    			append_dev(div116, div115);
    			append_dev(div115, h618);
    			append_dev(div115, t217);
    			append_dev(div115, small34);
    			append_dev(div115, t219);
    			append_dev(div115, small35);
    			append_dev(div122, t221);
    			append_dev(div122, div121);
    			append_dev(div121, a37);
    			append_dev(a37, div120);
    			append_dev(div120, div118);
    			append_dev(div118, img24);
    			append_dev(div120, t222);
    			append_dev(div120, div119);
    			append_dev(div119, h619);
    			append_dev(div119, t224);
    			append_dev(div119, small36);
    			append_dev(div119, t226);
    			append_dev(div119, small37);
    			append_dev(div125, t228);
    			append_dev(div125, div124);
    			append_dev(div124, tbody1);
    			append_dev(tbody1, tr3);
    			append_dev(tr3, td6);
    			append_dev(td6, span19);
    			append_dev(span19, strong4);
    			append_dev(tr3, t230);
    			append_dev(tr3, td7);
    			append_dev(td7, span20);
    			append_dev(tbody1, t232);
    			append_dev(tbody1, tr4);
    			append_dev(tr4, td8);
    			append_dev(td8, span21);
    			append_dev(span21, strong5);
    			append_dev(tr4, t234);
    			append_dev(tr4, td9);
    			append_dev(td9, span22);
    			append_dev(span22, strong6);
    			append_dev(div124, t236);
    			append_dev(div124, button4);
    			append_dev(body, t238);
    			if (if_block0) if_block0.m(body, null);
    			append_dev(body, t239);
    			if (if_block1) if_block1.m(body, null);
    			append_dev(body, t240);
    			if (if_block2) if_block2.m(body, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div35, "click", /*click_handler*/ ctx[4], false, false, false, false),
    					listen_dev(div39, "click", /*click_handler_1*/ ctx[5], false, false, false, false),
    					listen_dev(div43, "click", /*click_handler_2*/ ctx[6], false, false, false, false),
    					listen_dev(div47, "click", /*click_handler_3*/ ctx[7], false, false, false, false),
    					listen_dev(div51, "click", /*click_handler_4*/ ctx[8], false, false, false, false),
    					listen_dev(div55, "click", /*click_handler_5*/ ctx[9], false, false, false, false),
    					listen_dev(div59, "click", /*click_handler_6*/ ctx[10], false, false, false, false),
    					listen_dev(div63, "click", /*click_handler_7*/ ctx[11], false, false, false, false),
    					listen_dev(div69, "click", /*click_handler_8*/ ctx[12], false, false, false, false),
    					listen_dev(div73, "click", /*click_handler_9*/ ctx[13], false, false, false, false),
    					listen_dev(div77, "click", /*click_handler_10*/ ctx[14], false, false, false, false),
    					listen_dev(a29, "click", /*scannerActive*/ ctx[3], false, false, false, false),
    					listen_dev(div86, "click", /*click_handler_11*/ ctx[15], false, false, false, false),
    					listen_dev(div90, "click", /*click_handler_12*/ ctx[16], false, false, false, false),
    					listen_dev(div94, "click", /*click_handler_13*/ ctx[17], false, false, false, false),
    					listen_dev(div98, "click", /*click_handler_14*/ ctx[18], false, false, false, false),
    					listen_dev(div102, "click", /*click_handler_15*/ ctx[19], false, false, false, false),
    					listen_dev(div113, "click", /*click_handler_16*/ ctx[20], false, false, false, false),
    					listen_dev(div117, "click", /*click_handler_17*/ ctx[21], false, false, false, false),
    					listen_dev(div121, "click", /*click_handler_18*/ ctx[22], false, false, false, false),
    					listen_dev(button4, "click", /*click_handler_19*/ ctx[23], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*car*/ 2) set_data_dev(t47, /*car*/ ctx[1]);
    			if (dirty[0] & /*car*/ 2) set_data_dev(t148, /*car*/ ctx[1]);

    			if (/*car*/ ctx[1] > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(body, t239);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*gameOpen*/ ctx[0] == true) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(body, t240);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*gameOpencasine*/ ctx[2] == true) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(body, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
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
    	let car = 0;
    	let gamescanner = false;
    	let gameOpencasine = false;

    	//Dynamsoft.DBR.BarcodeReader.license = "DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ==";
    	let scanner = null;

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
    				resultscanner();
    			}
    		};

    		scanner.onUnduplicatedRead = (txt, result) => {
    			
    		};

    		await scanner.show();
    	}

    	const resultscanner = result => {
    		gamescanner = true;
    		window.$(".bd-model").modal("show");
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(1, car++, car);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(1, car++, car);
    	};

    	const click_handler_2 = () => {
    		$$invalidate(1, car++, car);
    	};

    	const click_handler_3 = () => {
    		$$invalidate(1, car++, car);
    	};

    	const click_handler_4 = () => {
    		$$invalidate(1, car++, car);
    	};

    	const click_handler_5 = () => {
    		$$invalidate(1, car++, car);
    	};

    	const click_handler_6 = () => {
    		$$invalidate(1, car++, car);
    	};

    	const click_handler_7 = () => {
    		$$invalidate(1, car++, car);
    	};

    	const click_handler_8 = () => {
    		$$invalidate(1, car++, car);
    	};

    	const click_handler_9 = () => {
    		$$invalidate(1, car++, car);
    	};

    	const click_handler_10 = () => {
    		$$invalidate(1, car++, car);
    	};

    	const click_handler_11 = () => {
    		$$invalidate(1, car++, car);
    	};

    	const click_handler_12 = () => {
    		$$invalidate(1, car++, car);
    	};

    	const click_handler_13 = () => {
    		$$invalidate(1, car++, car);
    	};

    	const click_handler_14 = () => {
    		$$invalidate(1, car++, car);
    	};

    	const click_handler_15 = () => {
    		$$invalidate(1, car++, car);
    	};

    	const click_handler_16 = () => {
    		$$invalidate(1, car++, car);
    	};

    	const click_handler_17 = () => {
    		$$invalidate(1, car++, car);
    	};

    	const click_handler_18 = () => {
    		$$invalidate(1, car++, car);
    	};

    	const click_handler_19 = () => {
    		location.reload();
    	};

    	const click_handler_20 = () => {
    		$$invalidate(0, gameOpen = true);
    	};

    	const click_handler_21 = () => {
    		$$invalidate(2, gameOpencasine = true);
    	};

    	const click_handler_22 = () => {
    		$$invalidate(2, gameOpencasine = true);
    	};

    	const click_handler_23 = () => {
    		$$invalidate(0, gameOpen = false);
    	};

    	const click_handler_24 = () => {
    		$$invalidate(2, gameOpencasine = false);
    	};

    	$$self.$capture_state = () => ({
    		gameOpen,
    		car,
    		gamescanner,
    		gameOpencasine,
    		scanner,
    		scannerActive,
    		initBarcodeScanner,
    		resultscanner
    	});

    	$$self.$inject_state = $$props => {
    		if ('gameOpen' in $$props) $$invalidate(0, gameOpen = $$props.gameOpen);
    		if ('car' in $$props) $$invalidate(1, car = $$props.car);
    		if ('gamescanner' in $$props) gamescanner = $$props.gamescanner;
    		if ('gameOpencasine' in $$props) $$invalidate(2, gameOpencasine = $$props.gameOpencasine);
    		if ('scanner' in $$props) scanner = $$props.scanner;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		gameOpen,
    		car,
    		gameOpencasine,
    		scannerActive,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9,
    		click_handler_10,
    		click_handler_11,
    		click_handler_12,
    		click_handler_13,
    		click_handler_14,
    		click_handler_15,
    		click_handler_16,
    		click_handler_17,
    		click_handler_18,
    		click_handler_19,
    		click_handler_20,
    		click_handler_21,
    		click_handler_22,
    		click_handler_23,
    		click_handler_24
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
    			add_location(main, file, 5, 0, 89);
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
    	let { name } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (name === undefined && !('name' in $$props || $$self.$$.bound[$$self.$$.props['name']])) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	});

    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ name, Home });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
