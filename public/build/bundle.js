
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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

    // (592:8) {#if car>0}
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
    			attr_dev(input, "class", "svelte-d9yz2r");
    			add_location(input, file$1, 593, 16, 37270);
    			attr_dev(img0, "class", "img-game svelte-d9yz2r");
    			if (!src_url_equal(img0.src, img0_src_value = "img/casino.jpg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "width", "45px");
    			attr_dev(img0, "height", "45px");
    			attr_dev(img0, "alt", "");
    			add_location(img0, file$1, 595, 34, 37379);
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "class", "svelte-d9yz2r");
    			add_location(a0, file$1, 595, 20, 37365);
    			attr_dev(img1, "class", "img-game svelte-d9yz2r");
    			if (!src_url_equal(img1.src, img1_src_value = "img/ruleta.jpg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "width", "45px");
    			attr_dev(img1, "height", "45px");
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$1, 596, 34, 37528);
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "class", "svelte-d9yz2r");
    			add_location(a1, file$1, 596, 20, 37514);
    			attr_dev(div0, "class", "redes svelte-d9yz2r");
    			add_location(div0, file$1, 594, 16, 37324);
    			attr_dev(label, "for", "btn-mas");
    			attr_dev(label, "class", "fa fa-plus svelte-d9yz2r");
    			add_location(label, file$1, 599, 20, 37732);
    			attr_dev(div1, "class", "btn-mas svelte-d9yz2r");
    			add_location(div1, file$1, 598, 16, 37689);
    			attr_dev(div2, "class", "container svelte-d9yz2r");
    			add_location(div2, file$1, 592, 12, 37229);
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
    					listen_dev(img0, "click", /*click_handler_20*/ ctx[24], false, false, false, false),
    					listen_dev(img1, "click", /*click_handler_21*/ ctx[25], false, false, false, false)
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
    		source: "(592:8) {#if car>0}",
    		ctx
    	});

    	return block;
    }

    // (606:8) {#if gameOpen==true}
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
    			add_location(i, file$1, 606, 12, 37895);
    			attr_dev(iframe, "class", "back-to-iframe");
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "100%");
    			if (!src_url_equal(iframe.src, iframe_src_value = "https://netent-static.casinomodule.com/games/frenchroulette3_mobile_html/game/frenchroulette3_mobile_html.xhtml?staticServer=https%3A%2F%2Fnetent-static.casinomodule.com%2F&targetElement=netentgame&flashParams.bgcolor=000000&gameId=frenchroulette3_not_mobile&mobileParams.lobbyURL=https%253A%252F%252Fgames.netent.com%252Ftable-games%252Ffrench-roulette-slot%252F&server=https%3A%2F%2Fnetent-game.casinomodule.com%2F&lang=es&sessId=DEMO-0037068596-EUR&operatorId=default")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			add_location(iframe, file$1, 607, 12, 38067);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, iframe, anchor);

    			if (!mounted) {
    				dispose = listen_dev(i, "click", /*click_handler_22*/ ctx[26], false, false, false, false);
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
    		source: "(606:8) {#if gameOpen==true}",
    		ctx
    	});

    	return block;
    }

    // (611:8) {#if gameOpencasine==true}
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
    			add_location(i, file$1, 611, 12, 38695);
    			attr_dev(iframe, "class", "back-to-iframe");
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "100%");
    			if (!src_url_equal(iframe.src, iframe_src_value = "https://test-2.apiusoft.com/api/pascal/opengame?gameid=63-PSG&mode=wb&m=wb&player_id=789&currency=USD&t=9f571ee526b3fbead15270b40ad58e28478b15a5b7d9ae01df37a082032a128cc3bf36f06744d216fe1a0221a2740e290cb61dd21a89381b96daefb7791dc4f6")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			add_location(iframe, file$1, 612, 12, 38873);
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(611:8) {#if gameOpencasine==true}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let body;
    	let div0;
    	let t0;
    	let div7;
    	let div6;
    	let div1;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let a0;
    	let span0;
    	let t3;
    	let span1;
    	let t5;
    	let div4;
    	let form0;
    	let div3;
    	let input;
    	let t6;
    	let div2;
    	let span2;
    	let i0;
    	let t7;
    	let div5;
    	let p0;
    	let t9;
    	let h50;
    	let t11;
    	let div18;
    	let div17;
    	let div10;
    	let a1;
    	let h60;
    	let i1;
    	let t12;
    	let t13;
    	let i2;
    	let t14;
    	let nav0;
    	let div9;
    	let div8;
    	let a2;
    	let t16;
    	let a3;
    	let t18;
    	let a4;
    	let t20;
    	let a5;
    	let t22;
    	let a6;
    	let t24;
    	let div16;
    	let nav1;
    	let button0;
    	let span3;
    	let t25;
    	let a7;
    	let span4;
    	let t27;
    	let span5;
    	let t29;
    	let div15;
    	let div13;
    	let a8;
    	let t31;
    	let a9;
    	let t33;
    	let a10;
    	let t35;
    	let div12;
    	let a11;
    	let t36;
    	let i3;
    	let t37;
    	let div11;
    	let a12;
    	let t39;
    	let a13;
    	let t41;
    	let a14;
    	let t43;
    	let div14;
    	let a15;
    	let i4;
    	let t44;
    	let span6;
    	let t46;
    	let a16;
    	let i5;
    	let t47;
    	let span7;
    	let t48;
    	let t49;
    	let div81;
    	let div32;
    	let div31;
    	let div30;
    	let div29;
    	let ol;
    	let li0;
    	let t50;
    	let li1;
    	let t51;
    	let li2;
    	let t52;
    	let div28;
    	let div21;
    	let img1;
    	let img1_src_value;
    	let t53;
    	let div20;
    	let div19;
    	let h10;
    	let t55;
    	let p1;
    	let t57;
    	let div24;
    	let img2;
    	let img2_src_value;
    	let t58;
    	let div23;
    	let div22;
    	let h11;
    	let t60;
    	let p2;
    	let t62;
    	let div27;
    	let img3;
    	let img3_src_value;
    	let t63;
    	let div26;
    	let div25;
    	let h12;
    	let t65;
    	let p3;
    	let t67;
    	let div66;
    	let h20;
    	let span8;
    	let t69;
    	let div65;
    	let div36;
    	let a17;
    	let div35;
    	let div33;
    	let img4;
    	let img4_src_value;
    	let t70;
    	let div34;
    	let h61;
    	let t72;
    	let small0;
    	let t74;
    	let small1;
    	let t76;
    	let div40;
    	let a18;
    	let div39;
    	let div37;
    	let img5;
    	let img5_src_value;
    	let t77;
    	let div38;
    	let h62;
    	let t79;
    	let small2;
    	let t81;
    	let small3;
    	let t83;
    	let div44;
    	let a19;
    	let div43;
    	let div41;
    	let img6;
    	let img6_src_value;
    	let t84;
    	let div42;
    	let h63;
    	let t86;
    	let small4;
    	let t88;
    	let small5;
    	let t90;
    	let div48;
    	let a20;
    	let div47;
    	let div45;
    	let img7;
    	let img7_src_value;
    	let t91;
    	let div46;
    	let h64;
    	let t93;
    	let small6;
    	let t95;
    	let small7;
    	let t97;
    	let div52;
    	let a21;
    	let div51;
    	let div49;
    	let img8;
    	let img8_src_value;
    	let t98;
    	let div50;
    	let h65;
    	let t100;
    	let small8;
    	let t102;
    	let small9;
    	let t104;
    	let div56;
    	let a22;
    	let div55;
    	let div53;
    	let img9;
    	let img9_src_value;
    	let t105;
    	let div54;
    	let h66;
    	let t107;
    	let small10;
    	let t109;
    	let small11;
    	let t111;
    	let div60;
    	let a23;
    	let div59;
    	let div57;
    	let img10;
    	let img10_src_value;
    	let t112;
    	let div58;
    	let h67;
    	let t114;
    	let small12;
    	let t116;
    	let small13;
    	let t118;
    	let div64;
    	let a24;
    	let div63;
    	let div61;
    	let img11;
    	let img11_src_value;
    	let t119;
    	let div62;
    	let h68;
    	let t121;
    	let small14;
    	let t123;
    	let small15;
    	let t125;
    	let div80;
    	let h21;
    	let span9;
    	let t127;
    	let div79;
    	let div70;
    	let a25;
    	let div69;
    	let div67;
    	let img12;
    	let img12_src_value;
    	let t128;
    	let div68;
    	let h69;
    	let t130;
    	let small16;
    	let t132;
    	let small17;
    	let t134;
    	let div74;
    	let a26;
    	let div73;
    	let div71;
    	let img13;
    	let img13_src_value;
    	let t135;
    	let div72;
    	let h610;
    	let t137;
    	let small18;
    	let t139;
    	let small19;
    	let t141;
    	let div78;
    	let a27;
    	let div77;
    	let div75;
    	let img14;
    	let img14_src_value;
    	let t142;
    	let div76;
    	let h611;
    	let t144;
    	let small20;
    	let t146;
    	let small21;
    	let t148;
    	let div82;
    	let a28;
    	let span10;
    	let i6;
    	let t149;
    	let t150;
    	let a29;
    	let img15;
    	let img15_src_value;
    	let t151;
    	let div109;
    	let div108;
    	let div107;
    	let div83;
    	let h51;
    	let img16;
    	let img16_src_value;
    	let t152;
    	let t153;
    	let button1;
    	let span11;
    	let t155;
    	let div105;
    	let form1;
    	let div104;
    	let div87;
    	let a30;
    	let div86;
    	let div84;
    	let img17;
    	let img17_src_value;
    	let t156;
    	let div85;
    	let h612;
    	let t158;
    	let small22;
    	let t160;
    	let small23;
    	let t162;
    	let div91;
    	let a31;
    	let div90;
    	let div88;
    	let img18;
    	let img18_src_value;
    	let t163;
    	let div89;
    	let h613;
    	let t165;
    	let small24;
    	let t167;
    	let small25;
    	let t169;
    	let div95;
    	let a32;
    	let div94;
    	let div92;
    	let img19;
    	let img19_src_value;
    	let t170;
    	let div93;
    	let h614;
    	let t172;
    	let small26;
    	let t174;
    	let small27;
    	let t176;
    	let div99;
    	let a33;
    	let div98;
    	let div96;
    	let img20;
    	let img20_src_value;
    	let t177;
    	let div97;
    	let h615;
    	let t179;
    	let small28;
    	let t181;
    	let small29;
    	let t183;
    	let div103;
    	let a34;
    	let div102;
    	let div100;
    	let img21;
    	let img21_src_value;
    	let t184;
    	let div101;
    	let h616;
    	let t186;
    	let small30;
    	let t188;
    	let small31;
    	let t190;
    	let div106;
    	let tbody0;
    	let tr0;
    	let td0;
    	let span12;
    	let strong0;
    	let t192;
    	let td1;
    	let span13;
    	let t194;
    	let tr1;
    	let td2;
    	let span14;
    	let strong1;
    	let t196;
    	let td3;
    	let span15;
    	let t198;
    	let tr2;
    	let td4;
    	let span16;
    	let strong2;
    	let t200;
    	let td5;
    	let span17;
    	let strong3;
    	let t202;
    	let button2;
    	let t204;
    	let div128;
    	let div127;
    	let div126;
    	let div110;
    	let h52;
    	let t206;
    	let button3;
    	let span18;
    	let t208;
    	let div124;
    	let form2;
    	let div123;
    	let div114;
    	let a35;
    	let div113;
    	let div111;
    	let img22;
    	let img22_src_value;
    	let t209;
    	let div112;
    	let h617;
    	let t211;
    	let small32;
    	let t213;
    	let small33;
    	let t215;
    	let div118;
    	let a36;
    	let div117;
    	let div115;
    	let img23;
    	let img23_src_value;
    	let t216;
    	let div116;
    	let h618;
    	let t218;
    	let small34;
    	let t220;
    	let small35;
    	let t222;
    	let div122;
    	let a37;
    	let div121;
    	let div119;
    	let img24;
    	let img24_src_value;
    	let t223;
    	let div120;
    	let h619;
    	let t225;
    	let small36;
    	let t227;
    	let small37;
    	let t229;
    	let div125;
    	let tbody1;
    	let tr3;
    	let td6;
    	let span19;
    	let strong4;
    	let t231;
    	let td7;
    	let span20;
    	let t233;
    	let tr4;
    	let td8;
    	let span21;
    	let strong5;
    	let t235;
    	let td9;
    	let span22;
    	let strong6;
    	let t237;
    	let button4;
    	let t239;
    	let t240;
    	let t241;
    	let mounted;
    	let dispose;
    	let if_block0 = /*car*/ ctx[1] > 0 && create_if_block_2(ctx);
    	let if_block1 = /*gameOpen*/ ctx[0] == true && create_if_block_1(ctx);
    	let if_block2 = /*gameOpencasine*/ ctx[2] == true && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			body = element("body");
    			div0 = element("div");
    			t0 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div1 = element("div");
    			img0 = element("img");
    			t1 = space();
    			a0 = element("a");
    			span0 = element("span");
    			span0.textContent = "Go";
    			t3 = space();
    			span1 = element("span");
    			span1.textContent = "Eat";
    			t5 = space();
    			div4 = element("div");
    			form0 = element("form");
    			div3 = element("div");
    			input = element("input");
    			t6 = space();
    			div2 = element("div");
    			span2 = element("span");
    			i0 = element("i");
    			t7 = space();
    			div5 = element("div");
    			p0 = element("p");
    			p0.textContent = "Servicio al Cliente";
    			t9 = space();
    			h50 = element("h5");
    			h50.textContent = "+ 951 970 113";
    			t11 = space();
    			div18 = element("div");
    			div17 = element("div");
    			div10 = element("div");
    			a1 = element("a");
    			h60 = element("h6");
    			i1 = element("i");
    			t12 = text("Categorias");
    			t13 = space();
    			i2 = element("i");
    			t14 = space();
    			nav0 = element("nav");
    			div9 = element("div");
    			div8 = element("div");
    			a2 = element("a");
    			a2.textContent = "Brosterias";
    			t16 = space();
    			a3 = element("a");
    			a3.textContent = "Pizzas";
    			t18 = space();
    			a4 = element("a");
    			a4.textContent = "Taquerias";
    			t20 = space();
    			a5 = element("a");
    			a5.textContent = "Juguerias";
    			t22 = space();
    			a6 = element("a");
    			a6.textContent = "Restobar";
    			t24 = space();
    			div16 = element("div");
    			nav1 = element("nav");
    			button0 = element("button");
    			span3 = element("span");
    			t25 = space();
    			a7 = element("a");
    			span4 = element("span");
    			span4.textContent = "GO";
    			t27 = space();
    			span5 = element("span");
    			span5.textContent = "Eat";
    			t29 = space();
    			div15 = element("div");
    			div13 = element("div");
    			a8 = element("a");
    			a8.textContent = "Home";
    			t31 = space();
    			a9 = element("a");
    			a9.textContent = "Shop";
    			t33 = space();
    			a10 = element("a");
    			a10.textContent = "Shop Detail";
    			t35 = space();
    			div12 = element("div");
    			a11 = element("a");
    			t36 = text("Pages ");
    			i3 = element("i");
    			t37 = space();
    			div11 = element("div");
    			a12 = element("a");
    			a12.textContent = "Shopping Cart";
    			t39 = space();
    			a13 = element("a");
    			a13.textContent = "Checkout";
    			t41 = space();
    			a14 = element("a");
    			a14.textContent = "Contact";
    			t43 = space();
    			div14 = element("div");
    			a15 = element("a");
    			i4 = element("i");
    			t44 = space();
    			span6 = element("span");
    			span6.textContent = "0";
    			t46 = space();
    			a16 = element("a");
    			i5 = element("i");
    			t47 = space();
    			span7 = element("span");
    			t48 = text(/*car*/ ctx[1]);
    			t49 = space();
    			div81 = element("div");
    			div32 = element("div");
    			div31 = element("div");
    			div30 = element("div");
    			div29 = element("div");
    			ol = element("ol");
    			li0 = element("li");
    			t50 = space();
    			li1 = element("li");
    			t51 = space();
    			li2 = element("li");
    			t52 = space();
    			div28 = element("div");
    			div21 = element("div");
    			img1 = element("img");
    			t53 = space();
    			div20 = element("div");
    			div19 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Warmin Coffe";
    			t55 = space();
    			p1 = element("p");
    			p1.textContent = "Warmi, el lugar adecuado si te encuentras en tingo maría";
    			t57 = space();
    			div24 = element("div");
    			img2 = element("img");
    			t58 = space();
    			div23 = element("div");
    			div22 = element("div");
    			h11 = element("h1");
    			h11.textContent = "Women Fashion";
    			t60 = space();
    			p2 = element("p");
    			p2.textContent = "Lugar adecuado si te encuentras en tingo maría";
    			t62 = space();
    			div27 = element("div");
    			img3 = element("img");
    			t63 = space();
    			div26 = element("div");
    			div25 = element("div");
    			h12 = element("h1");
    			h12.textContent = "Kids Fashion";
    			t65 = space();
    			p3 = element("p");
    			p3.textContent = "Lugar adecuado si te encuentras en tingo maría";
    			t67 = space();
    			div66 = element("div");
    			h20 = element("h2");
    			span8 = element("span");
    			span8.textContent = "COMIDAS";
    			t69 = space();
    			div65 = element("div");
    			div36 = element("div");
    			a17 = element("a");
    			div35 = element("div");
    			div33 = element("div");
    			img4 = element("img");
    			t70 = space();
    			div34 = element("div");
    			h61 = element("h6");
    			h61.textContent = "Fideos a la Italiana";
    			t72 = space();
    			small0 = element("small");
    			small0.textContent = "100 Products";
    			t74 = space();
    			small1 = element("small");
    			small1.textContent = "S/. 15.00";
    			t76 = space();
    			div40 = element("div");
    			a18 = element("a");
    			div39 = element("div");
    			div37 = element("div");
    			img5 = element("img");
    			t77 = space();
    			div38 = element("div");
    			h62 = element("h6");
    			h62.textContent = "Sandwich";
    			t79 = space();
    			small2 = element("small");
    			small2.textContent = "100 Products";
    			t81 = space();
    			small3 = element("small");
    			small3.textContent = "S/. 25.00";
    			t83 = space();
    			div44 = element("div");
    			a19 = element("a");
    			div43 = element("div");
    			div41 = element("div");
    			img6 = element("img");
    			t84 = space();
    			div42 = element("div");
    			h63 = element("h6");
    			h63.textContent = "Arroz Chaufa Amazonico";
    			t86 = space();
    			small4 = element("small");
    			small4.textContent = "100 Products";
    			t88 = space();
    			small5 = element("small");
    			small5.textContent = "S/. 10.00";
    			t90 = space();
    			div48 = element("div");
    			a20 = element("a");
    			div47 = element("div");
    			div45 = element("div");
    			img7 = element("img");
    			t91 = space();
    			div46 = element("div");
    			h64 = element("h6");
    			h64.textContent = "Arroz con pato";
    			t93 = space();
    			small6 = element("small");
    			small6.textContent = "100 Products";
    			t95 = space();
    			small7 = element("small");
    			small7.textContent = "S/. 8.00";
    			t97 = space();
    			div52 = element("div");
    			a21 = element("a");
    			div51 = element("div");
    			div49 = element("div");
    			img8 = element("img");
    			t98 = space();
    			div50 = element("div");
    			h65 = element("h6");
    			h65.textContent = "Mondonguito Italiano";
    			t100 = space();
    			small8 = element("small");
    			small8.textContent = "100 Products";
    			t102 = space();
    			small9 = element("small");
    			small9.textContent = "S/. 13.00";
    			t104 = space();
    			div56 = element("div");
    			a22 = element("a");
    			div55 = element("div");
    			div53 = element("div");
    			img9 = element("img");
    			t105 = space();
    			div54 = element("div");
    			h66 = element("h6");
    			h66.textContent = "Saltado de Res";
    			t107 = space();
    			small10 = element("small");
    			small10.textContent = "100 Products";
    			t109 = space();
    			small11 = element("small");
    			small11.textContent = "S/. 11.00";
    			t111 = space();
    			div60 = element("div");
    			a23 = element("a");
    			div59 = element("div");
    			div57 = element("div");
    			img10 = element("img");
    			t112 = space();
    			div58 = element("div");
    			h67 = element("h6");
    			h67.textContent = "Pollo a la brasa";
    			t114 = space();
    			small12 = element("small");
    			small12.textContent = "100 Products";
    			t116 = space();
    			small13 = element("small");
    			small13.textContent = "S/. 11.00";
    			t118 = space();
    			div64 = element("div");
    			a24 = element("a");
    			div63 = element("div");
    			div61 = element("div");
    			img11 = element("img");
    			t119 = space();
    			div62 = element("div");
    			h68 = element("h6");
    			h68.textContent = "Chancho ala Caja China";
    			t121 = space();
    			small14 = element("small");
    			small14.textContent = "100 Products";
    			t123 = space();
    			small15 = element("small");
    			small15.textContent = "S/. 15.00";
    			t125 = space();
    			div80 = element("div");
    			h21 = element("h2");
    			span9 = element("span");
    			span9.textContent = "BEBIDAS";
    			t127 = space();
    			div79 = element("div");
    			div70 = element("div");
    			a25 = element("a");
    			div69 = element("div");
    			div67 = element("div");
    			img12 = element("img");
    			t128 = space();
    			div68 = element("div");
    			h69 = element("h6");
    			h69.textContent = "Coca Cola";
    			t130 = space();
    			small16 = element("small");
    			small16.textContent = "50 Unidades";
    			t132 = space();
    			small17 = element("small");
    			small17.textContent = "S/. 3.00";
    			t134 = space();
    			div74 = element("div");
    			a26 = element("a");
    			div73 = element("div");
    			div71 = element("div");
    			img13 = element("img");
    			t135 = space();
    			div72 = element("div");
    			h610 = element("h6");
    			h610.textContent = "Inka Cola";
    			t137 = space();
    			small18 = element("small");
    			small18.textContent = "100 Products";
    			t139 = space();
    			small19 = element("small");
    			small19.textContent = "S/. 3.00";
    			t141 = space();
    			div78 = element("div");
    			a27 = element("a");
    			div77 = element("div");
    			div75 = element("div");
    			img14 = element("img");
    			t142 = space();
    			div76 = element("div");
    			h611 = element("h6");
    			h611.textContent = "Pepsi Cola";
    			t144 = space();
    			small20 = element("small");
    			small20.textContent = "100 Products";
    			t146 = space();
    			small21 = element("small");
    			small21.textContent = "S/. 2.00";
    			t148 = space();
    			div82 = element("div");
    			a28 = element("a");
    			span10 = element("span");
    			i6 = element("i");
    			t149 = text(/*car*/ ctx[1]);
    			t150 = space();
    			a29 = element("a");
    			img15 = element("img");
    			t151 = space();
    			div109 = element("div");
    			div108 = element("div");
    			div107 = element("div");
    			div83 = element("div");
    			h51 = element("h5");
    			img16 = element("img");
    			t152 = text("Carrito");
    			t153 = space();
    			button1 = element("button");
    			span11 = element("span");
    			span11.textContent = "×";
    			t155 = space();
    			div105 = element("div");
    			form1 = element("form");
    			div104 = element("div");
    			div87 = element("div");
    			a30 = element("a");
    			div86 = element("div");
    			div84 = element("div");
    			img17 = element("img");
    			t156 = space();
    			div85 = element("div");
    			h612 = element("h6");
    			h612.textContent = "Coca Cola";
    			t158 = space();
    			small22 = element("small");
    			small22.textContent = "50 Unidades";
    			t160 = space();
    			small23 = element("small");
    			small23.textContent = "S/. 3.00";
    			t162 = space();
    			div91 = element("div");
    			a31 = element("a");
    			div90 = element("div");
    			div88 = element("div");
    			img18 = element("img");
    			t163 = space();
    			div89 = element("div");
    			h613 = element("h6");
    			h613.textContent = "Inka Cola";
    			t165 = space();
    			small24 = element("small");
    			small24.textContent = "100 Products";
    			t167 = space();
    			small25 = element("small");
    			small25.textContent = "S/. 3.00";
    			t169 = space();
    			div95 = element("div");
    			a32 = element("a");
    			div94 = element("div");
    			div92 = element("div");
    			img19 = element("img");
    			t170 = space();
    			div93 = element("div");
    			h614 = element("h6");
    			h614.textContent = "Pepsi Cola";
    			t172 = space();
    			small26 = element("small");
    			small26.textContent = "100 Products";
    			t174 = space();
    			small27 = element("small");
    			small27.textContent = "S/. 2.00";
    			t176 = space();
    			div99 = element("div");
    			a33 = element("a");
    			div98 = element("div");
    			div96 = element("div");
    			img20 = element("img");
    			t177 = space();
    			div97 = element("div");
    			h615 = element("h6");
    			h615.textContent = "Pepsi Cola";
    			t179 = space();
    			small28 = element("small");
    			small28.textContent = "100 Products";
    			t181 = space();
    			small29 = element("small");
    			small29.textContent = "S/. 2.00";
    			t183 = space();
    			div103 = element("div");
    			a34 = element("a");
    			div102 = element("div");
    			div100 = element("div");
    			img21 = element("img");
    			t184 = space();
    			div101 = element("div");
    			h616 = element("h6");
    			h616.textContent = "Pepsi Cola";
    			t186 = space();
    			small30 = element("small");
    			small30.textContent = "100 Products";
    			t188 = space();
    			small31 = element("small");
    			small31.textContent = "S/. 2.00";
    			t190 = space();
    			div106 = element("div");
    			tbody0 = element("tbody");
    			tr0 = element("tr");
    			td0 = element("td");
    			span12 = element("span");
    			strong0 = element("strong");
    			strong0.textContent = "Sub total:";
    			t192 = space();
    			td1 = element("td");
    			span13 = element("span");
    			span13.textContent = "S/ 8.00";
    			t194 = space();
    			tr1 = element("tr");
    			td2 = element("td");
    			span14 = element("span");
    			strong1 = element("strong");
    			strong1.textContent = "Entrega:";
    			t196 = space();
    			td3 = element("td");
    			span15 = element("span");
    			span15.textContent = "Por calcular:";
    			t198 = space();
    			tr2 = element("tr");
    			td4 = element("td");
    			span16 = element("span");
    			strong2 = element("strong");
    			strong2.textContent = "TOTAL:";
    			t200 = space();
    			td5 = element("td");
    			span17 = element("span");
    			strong3 = element("strong");
    			strong3.textContent = "S/ 8.00";
    			t202 = space();
    			button2 = element("button");
    			button2.textContent = "Proceder pago";
    			t204 = space();
    			div128 = element("div");
    			div127 = element("div");
    			div126 = element("div");
    			div110 = element("div");
    			h52 = element("h5");
    			h52.textContent = "El sazon del pato";
    			t206 = space();
    			button3 = element("button");
    			span18 = element("span");
    			span18.textContent = "×";
    			t208 = space();
    			div124 = element("div");
    			form2 = element("form");
    			div123 = element("div");
    			div114 = element("div");
    			a35 = element("a");
    			div113 = element("div");
    			div111 = element("div");
    			img22 = element("img");
    			t209 = space();
    			div112 = element("div");
    			h617 = element("h6");
    			h617.textContent = "Arroz Chaufa Amazonico";
    			t211 = space();
    			small32 = element("small");
    			small32.textContent = "50 Unidades";
    			t213 = space();
    			small33 = element("small");
    			small33.textContent = "S/. 10.00";
    			t215 = space();
    			div118 = element("div");
    			a36 = element("a");
    			div117 = element("div");
    			div115 = element("div");
    			img23 = element("img");
    			t216 = space();
    			div116 = element("div");
    			h618 = element("h6");
    			h618.textContent = "Fideos a la Italiana";
    			t218 = space();
    			small34 = element("small");
    			small34.textContent = "100 Products";
    			t220 = space();
    			small35 = element("small");
    			small35.textContent = "S/. 13.00";
    			t222 = space();
    			div122 = element("div");
    			a37 = element("a");
    			div121 = element("div");
    			div119 = element("div");
    			img24 = element("img");
    			t223 = space();
    			div120 = element("div");
    			h619 = element("h6");
    			h619.textContent = "Arroz con pato";
    			t225 = space();
    			small36 = element("small");
    			small36.textContent = "100 Products";
    			t227 = space();
    			small37 = element("small");
    			small37.textContent = "S/. 15.00";
    			t229 = space();
    			div125 = element("div");
    			tbody1 = element("tbody");
    			tr3 = element("tr");
    			td6 = element("td");
    			span19 = element("span");
    			strong4 = element("strong");
    			strong4.textContent = "Mesa:";
    			t231 = space();
    			td7 = element("td");
    			span20 = element("span");
    			span20.textContent = "1";
    			t233 = space();
    			tr4 = element("tr");
    			td8 = element("td");
    			span21 = element("span");
    			strong5 = element("strong");
    			strong5.textContent = "TOTAL:";
    			t235 = space();
    			td9 = element("td");
    			span22 = element("span");
    			strong6 = element("strong");
    			strong6.textContent = "S/ 0.00";
    			t237 = space();
    			button4 = element("button");
    			button4.textContent = "Realizar pedido";
    			t239 = space();
    			if (if_block0) if_block0.c();
    			t240 = space();
    			if (if_block1) if_block1.c();
    			t241 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(div0, "id", "qrcode");
    			add_location(div0, file$1, 59, 8, 1610);
    			if (!src_url_equal(img0.src, img0_src_value = "img/goeat.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "width", "80");
    			attr_dev(img0, "height", "80");
    			set_style(img0, "margin-top", "-26px");
    			add_location(img0, file$1, 64, 20, 1854);
    			attr_dev(span0, "class", "h1 text-uppercase text-primary");
    			add_location(span0, file$1, 66, 24, 2011);
    			attr_dev(span1, "class", "h1 text-uppercase text-dark");
    			add_location(span1, file$1, 67, 24, 2091);
    			attr_dev(a0, "class", "text-decoration-none");
    			add_location(a0, file$1, 65, 20, 1952);
    			attr_dev(div1, "class", "col-lg-4");
    			add_location(div1, file$1, 63, 16, 1810);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", "Search for products");
    			add_location(input, file$1, 73, 28, 2368);
    			attr_dev(i0, "class", "fa fa-search");
    			add_location(i0, file$1, 76, 36, 2635);
    			attr_dev(span2, "class", "input-group-text bg-transparent text-primary");
    			add_location(span2, file$1, 75, 32, 2538);
    			attr_dev(div2, "class", "input-group-append");
    			add_location(div2, file$1, 74, 28, 2472);
    			attr_dev(div3, "class", "input-group");
    			add_location(div3, file$1, 72, 24, 2313);
    			attr_dev(form0, "action", "");
    			add_location(form0, file$1, 71, 20, 2271);
    			attr_dev(div4, "class", "col-lg-4 col-6 text-left");
    			add_location(div4, file$1, 70, 16, 2211);
    			attr_dev(p0, "class", "m-0");
    			add_location(p0, file$1, 83, 20, 2904);
    			attr_dev(h50, "class", "m-0");
    			add_location(h50, file$1, 84, 20, 2964);
    			attr_dev(div5, "class", "col-lg-4 col-6 text-right");
    			add_location(div5, file$1, 82, 16, 2843);
    			attr_dev(div6, "class", "row align-items-center bg-light py-3 px-xl-5 d-none d-lg-flex");
    			add_location(div6, file$1, 62, 12, 1717);
    			attr_dev(div7, "class", "container-fluid");
    			add_location(div7, file$1, 61, 8, 1674);
    			attr_dev(i1, "class", "fa fa-bars mr-2");
    			add_location(i1, file$1, 96, 50, 3522);
    			attr_dev(h60, "class", "text-dark m-0");
    			add_location(h60, file$1, 96, 24, 3496);
    			attr_dev(i2, "class", "fa fa-angle-down text-dark");
    			add_location(i2, file$1, 97, 24, 3594);
    			attr_dev(a1, "class", "btn d-flex align-items-center justify-content-between bg-primary w-100");
    			attr_dev(a1, "data-toggle", "collapse");
    			attr_dev(a1, "href", "#navbar-vertical");
    			set_style(a1, "height", "65px");
    			set_style(a1, "padding", "0 30px");
    			add_location(a1, file$1, 95, 20, 3302);
    			attr_dev(a2, "href", "");
    			attr_dev(a2, "class", "nav-item nav-link");
    			add_location(a2, file$1, 102, 28, 4017);
    			attr_dev(a3, "href", "");
    			attr_dev(a3, "class", "nav-item nav-link");
    			add_location(a3, file$1, 103, 28, 4098);
    			attr_dev(a4, "href", "");
    			attr_dev(a4, "class", "nav-item nav-link");
    			add_location(a4, file$1, 104, 28, 4175);
    			attr_dev(a5, "href", "");
    			attr_dev(a5, "class", "nav-item nav-link");
    			add_location(a5, file$1, 105, 28, 4255);
    			attr_dev(a6, "href", "");
    			attr_dev(a6, "class", "nav-item nav-link");
    			add_location(a6, file$1, 106, 28, 4335);
    			attr_dev(div8, "class", "nav-item dropdown dropright");
    			add_location(div8, file$1, 101, 28, 3946);
    			attr_dev(div9, "class", "navbar-nav w-100");
    			add_location(div9, file$1, 100, 24, 3886);
    			attr_dev(nav0, "class", "collapse position-absolute navbar navbar-vertical navbar-light align-items-start p-0 bg-light");
    			attr_dev(nav0, "id", "navbar-vertical");
    			set_style(nav0, "width", "calc(100% - 30px)");
    			set_style(nav0, "z-index", "999");
    			add_location(nav0, file$1, 99, 20, 3684);
    			attr_dev(div10, "class", "col-lg-3 d-none d-lg-block");
    			add_location(div10, file$1, 94, 16, 3240);
    			attr_dev(span3, "class", "navbar-toggler-icon");
    			add_location(span3, file$1, 113, 28, 4774);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "navbar-toggler");
    			attr_dev(button0, "data-toggle", "collapse");
    			attr_dev(button0, "data-target", "#navbarCollapse");
    			add_location(button0, file$1, 112, 24, 4646);
    			attr_dev(span4, "class", "h1 text-uppercase text-dark bg-light px-2");
    			add_location(span4, file$1, 116, 28, 4964);
    			attr_dev(span5, "class", "h1 text-uppercase text-light bg-primary px-2 ml-n1");
    			add_location(span5, file$1, 117, 28, 5059);
    			attr_dev(a7, "href", "");
    			attr_dev(a7, "class", "text-decoration-none d-block d-lg-none");
    			add_location(a7, file$1, 115, 24, 4876);
    			attr_dev(a8, "href", "index.html");
    			attr_dev(a8, "class", "nav-item nav-link active");
    			add_location(a8, file$1, 121, 32, 5373);
    			attr_dev(a9, "href", "shop.html");
    			attr_dev(a9, "class", "nav-item nav-link");
    			add_location(a9, file$1, 122, 32, 5469);
    			attr_dev(a10, "href", "detail.html");
    			attr_dev(a10, "class", "nav-item nav-link");
    			add_location(a10, file$1, 123, 32, 5557);
    			attr_dev(i3, "class", "fa fa-angle-down mt-1");
    			add_location(i3, file$1, 125, 110, 5797);
    			attr_dev(a11, "href", "#");
    			attr_dev(a11, "class", "nav-link dropdown-toggle");
    			attr_dev(a11, "data-toggle", "dropdown");
    			add_location(a11, file$1, 125, 36, 5723);
    			attr_dev(a12, "href", "cart.html");
    			attr_dev(a12, "class", "dropdown-item");
    			add_location(a12, file$1, 127, 40, 5979);
    			attr_dev(a13, "href", "checkout.html");
    			attr_dev(a13, "class", "dropdown-item");
    			add_location(a13, file$1, 128, 40, 6080);
    			attr_dev(div11, "class", "dropdown-menu bg-primary rounded-0 border-0 m-0");
    			add_location(div11, file$1, 126, 36, 5876);
    			attr_dev(div12, "class", "nav-item dropdown");
    			add_location(div12, file$1, 124, 32, 5654);
    			attr_dev(a14, "href", "contact.html");
    			attr_dev(a14, "class", "nav-item nav-link");
    			add_location(a14, file$1, 131, 32, 6256);
    			attr_dev(div13, "class", "navbar-nav mr-auto py-0");
    			add_location(div13, file$1, 120, 28, 5302);
    			attr_dev(i4, "class", "fas fa-heart text-primary");
    			add_location(i4, file$1, 135, 36, 6538);
    			attr_dev(span6, "class", "badge text-secondary border border-secondary rounded-circle");
    			set_style(span6, "padding-bottom", "2px");
    			add_location(span6, file$1, 136, 36, 6617);
    			attr_dev(a15, "href", "#");
    			attr_dev(a15, "class", "btn px-0");
    			add_location(a15, file$1, 134, 32, 6471);
    			attr_dev(i5, "class", "fas fa-shopping-cart text-primary");
    			add_location(i5, file$1, 139, 36, 6927);
    			attr_dev(span7, "class", "badge text-secondary border border-secondary rounded-circle");
    			set_style(span7, "padding-bottom", "2px");
    			add_location(span7, file$1, 140, 36, 7014);
    			attr_dev(a16, "href", "#");
    			attr_dev(a16, "class", "btn px-0 ml-3");
    			attr_dev(a16, "data-toggle", "modal");
    			attr_dev(a16, "data-target", ".bd-example-modal-sm");
    			add_location(a16, file$1, 138, 32, 6800);
    			attr_dev(div14, "class", "navbar-nav ml-auto py-0 d-none d-lg-block");
    			add_location(div14, file$1, 133, 28, 6382);
    			attr_dev(div15, "class", "collapse navbar-collapse justify-content-between");
    			attr_dev(div15, "id", "navbarCollapse");
    			add_location(div15, file$1, 119, 24, 5190);
    			attr_dev(nav1, "class", "navbar-perfile navbar navbar-expand-lg bg-dark navbar-dark py-3 py-lg-0 px-0");
    			add_location(nav1, file$1, 111, 20, 4530);
    			attr_dev(div16, "class", "col-lg-9");
    			add_location(div16, file$1, 110, 16, 4486);
    			attr_dev(div17, "class", "row px-xl-5");
    			add_location(div17, file$1, 93, 12, 3197);
    			attr_dev(div18, "class", "container-fluid bg-dark mb-30");
    			add_location(div18, file$1, 92, 8, 3140);
    			attr_dev(li0, "data-target", "#header-carousel");
    			attr_dev(li0, "data-slide-to", "0");
    			attr_dev(li0, "class", "active");
    			add_location(li0, file$1, 157, 32, 7786);
    			attr_dev(li1, "data-target", "#header-carousel");
    			attr_dev(li1, "data-slide-to", "1");
    			add_location(li1, file$1, 158, 32, 7893);
    			attr_dev(li2, "data-target", "#header-carousel");
    			attr_dev(li2, "data-slide-to", "2");
    			add_location(li2, file$1, 159, 32, 7985);
    			attr_dev(ol, "class", "carousel-indicators");
    			add_location(ol, file$1, 156, 28, 7720);
    			attr_dev(img1, "class", "position-absolute w-100 h-100");
    			if (!src_url_equal(img1.src, img1_src_value = "img/carousel-1.jpg")) attr_dev(img1, "src", img1_src_value);
    			set_style(img1, "object-fit", "cover");
    			add_location(img1, file$1, 163, 36, 8283);
    			attr_dev(h10, "class", "display-4 text-white mb-3 animate__animated animate__fadeInDown");
    			add_location(h10, file$1, 166, 44, 8638);
    			attr_dev(p1, "class", "mx-md-5 px-5 animate__animated animate__bounceIn");
    			add_location(p1, file$1, 167, 44, 8777);
    			attr_dev(div19, "class", "p-3");
    			set_style(div19, "max-width", "700px");
    			add_location(div19, file$1, 165, 40, 8549);
    			attr_dev(div20, "class", "carousel-caption d-flex flex-column align-items-center justify-content-center");
    			add_location(div20, file$1, 164, 36, 8416);
    			attr_dev(div21, "class", "carousel-item position-relative active");
    			set_style(div21, "height", "220px");
    			add_location(div21, file$1, 162, 32, 8170);
    			attr_dev(img2, "class", "position-absolute w-100 h-100");
    			if (!src_url_equal(img2.src, img2_src_value = "img/carousel-2.jpg")) attr_dev(img2, "src", img2_src_value);
    			set_style(img2, "object-fit", "cover");
    			add_location(img2, file$1, 172, 36, 9170);
    			attr_dev(h11, "class", "display-4 text-white mb-3 animate__animated animate__fadeInDown");
    			add_location(h11, file$1, 175, 44, 9525);
    			attr_dev(p2, "class", "mx-md-5 px-5 animate__animated animate__bounceIn");
    			add_location(p2, file$1, 176, 44, 9665);
    			attr_dev(div22, "class", "p-3");
    			set_style(div22, "max-width", "700px");
    			add_location(div22, file$1, 174, 40, 9436);
    			attr_dev(div23, "class", "carousel-caption d-flex flex-column align-items-center justify-content-center");
    			add_location(div23, file$1, 173, 36, 9303);
    			attr_dev(div24, "class", "carousel-item position-relative");
    			set_style(div24, "height", "220px");
    			add_location(div24, file$1, 171, 32, 9064);
    			attr_dev(img3, "class", "position-absolute w-100 h-100");
    			if (!src_url_equal(img3.src, img3_src_value = "img/carousel-3.jpg")) attr_dev(img3, "src", img3_src_value);
    			set_style(img3, "object-fit", "cover");
    			add_location(img3, file$1, 181, 36, 10048);
    			attr_dev(h12, "class", "display-4 text-white mb-3 animate__animated animate__fadeInDown");
    			add_location(h12, file$1, 184, 44, 10403);
    			attr_dev(p3, "class", "mx-md-5 px-5 animate__animated animate__bounceIn");
    			add_location(p3, file$1, 185, 44, 10542);
    			attr_dev(div25, "class", "p-3");
    			set_style(div25, "max-width", "700px");
    			add_location(div25, file$1, 183, 40, 10314);
    			attr_dev(div26, "class", "carousel-caption d-flex flex-column align-items-center justify-content-center");
    			add_location(div26, file$1, 182, 36, 10181);
    			attr_dev(div27, "class", "carousel-item position-relative");
    			set_style(div27, "height", "220px");
    			add_location(div27, file$1, 180, 32, 9942);
    			attr_dev(div28, "class", "carousel-inner");
    			add_location(div28, file$1, 161, 28, 8108);
    			attr_dev(div29, "id", "header-carousel");
    			attr_dev(div29, "class", "carousel slide carousel-fade mb-30 mb-lg-0");
    			attr_dev(div29, "data-ride", "carousel");
    			add_location(div29, file$1, 155, 24, 7592);
    			attr_dev(div30, "class", "col-lg-12");
    			add_location(div30, file$1, 154, 20, 7543);
    			attr_dev(div31, "class", "row px-xl-4");
    			add_location(div31, file$1, 153, 16, 7496);
    			attr_dev(div32, "class", "container-fluid");
    			add_location(div32, file$1, 152, 12, 7449);
    			attr_dev(span8, "class", "bg-secondary pr-3");
    			add_location(span8, file$1, 198, 88, 11120);
    			attr_dev(h20, "class", "section-title position-relative text-uppercase mx-xl-5 mb-4");
    			add_location(h20, file$1, 198, 16, 11048);
    			attr_dev(img4, "class", "img-fluid");
    			if (!src_url_equal(img4.src, img4_src_value = "img/cat-1.jpg")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "");
    			set_style(img4, "height", "119px");
    			add_location(img4, file$1, 204, 36, 11613);
    			attr_dev(div33, "class", "overflow-hidden");
    			set_style(div33, "width", "120px");
    			set_style(div33, "height", "120px");
    			add_location(div33, file$1, 203, 32, 11509);
    			add_location(h61, file$1, 207, 36, 11826);
    			attr_dev(small0, "class", "text-body");
    			add_location(small0, file$1, 208, 36, 11893);
    			attr_dev(small1, "class", "text-price svelte-d9yz2r");
    			add_location(small1, file$1, 209, 36, 11976);
    			attr_dev(div34, "class", "flex-fill pl-3");
    			add_location(div34, file$1, 206, 32, 11760);
    			attr_dev(div35, "class", "cat-item d-flex align-items-center mb-4");
    			add_location(div35, file$1, 202, 28, 11422);
    			attr_dev(a17, "href", "#");
    			attr_dev(a17, "class", "text-decoration-none");
    			add_location(a17, file$1, 201, 24, 11351);
    			attr_dev(div36, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div36, file$1, 200, 20, 11241);
    			attr_dev(img5, "class", "img-fluid");
    			if (!src_url_equal(img5.src, img5_src_value = "img/cat-2.avif")) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "alt", "");
    			set_style(img5, "height", "119px");
    			add_location(img5, file$1, 218, 36, 12558);
    			attr_dev(div37, "class", "overflow-hidden");
    			set_style(div37, "width", "120px");
    			set_style(div37, "height", "120px");
    			add_location(div37, file$1, 217, 32, 12454);
    			add_location(h62, file$1, 221, 36, 12772);
    			attr_dev(small2, "class", "text-body");
    			add_location(small2, file$1, 222, 36, 12827);
    			attr_dev(small3, "class", "text-price svelte-d9yz2r");
    			add_location(small3, file$1, 223, 36, 12910);
    			attr_dev(div38, "class", "flex-fill pl-3");
    			add_location(div38, file$1, 220, 32, 12706);
    			attr_dev(div39, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div39, file$1, 216, 28, 12358);
    			attr_dev(a18, "href", "#");
    			attr_dev(a18, "class", "text-decoration-none");
    			add_location(a18, file$1, 215, 24, 12286);
    			attr_dev(div40, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div40, file$1, 214, 20, 12175);
    			attr_dev(img6, "class", "img-fluid");
    			if (!src_url_equal(img6.src, img6_src_value = "img/cat-3.jpg")) attr_dev(img6, "src", img6_src_value);
    			attr_dev(img6, "alt", "");
    			set_style(img6, "height", "119px");
    			set_style(img6, "width", "120px");
    			add_location(img6, file$1, 232, 36, 13482);
    			attr_dev(div41, "class", "overflow-hidden");
    			set_style(div41, "width", "120px");
    			set_style(div41, "height", "120px");
    			add_location(div41, file$1, 231, 32, 13378);
    			add_location(h63, file$1, 235, 36, 13707);
    			attr_dev(small4, "class", "text-body");
    			add_location(small4, file$1, 236, 36, 13776);
    			attr_dev(small5, "class", "text-price svelte-d9yz2r");
    			add_location(small5, file$1, 237, 36, 13859);
    			attr_dev(div42, "class", "flex-fill pl-3");
    			add_location(div42, file$1, 234, 32, 13641);
    			attr_dev(div43, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div43, file$1, 230, 28, 13282);
    			attr_dev(a19, "class", "text-decoration-none");
    			add_location(a19, file$1, 229, 24, 13220);
    			attr_dev(div44, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div44, file$1, 228, 20, 13109);
    			attr_dev(img7, "class", "img-fluid");
    			if (!src_url_equal(img7.src, img7_src_value = "img/cat-4.jpg")) attr_dev(img7, "src", img7_src_value);
    			attr_dev(img7, "alt", "");
    			set_style(img7, "height", "119px");
    			add_location(img7, file$1, 247, 36, 14509);
    			attr_dev(div45, "class", "overflow-hidden");
    			set_style(div45, "width", "120px");
    			set_style(div45, "height", "120px");
    			add_location(div45, file$1, 246, 32, 14405);
    			add_location(h64, file$1, 250, 36, 14722);
    			attr_dev(small6, "class", "text-body");
    			add_location(small6, file$1, 251, 36, 14783);
    			attr_dev(small7, "class", "text-price svelte-d9yz2r");
    			add_location(small7, file$1, 252, 36, 14866);
    			attr_dev(div46, "class", "flex-fill pl-3");
    			add_location(div46, file$1, 249, 32, 14656);
    			attr_dev(div47, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div47, file$1, 245, 28, 14309);
    			attr_dev(a20, "class", "text-decoration-none");
    			add_location(a20, file$1, 244, 24, 14247);
    			attr_dev(div48, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div48, file$1, 243, 20, 14136);
    			attr_dev(img8, "class", "img-fluid");
    			if (!src_url_equal(img8.src, img8_src_value = "img/cat-5.jpg")) attr_dev(img8, "src", img8_src_value);
    			attr_dev(img8, "alt", "");
    			set_style(img8, "height", "119px");
    			add_location(img8, file$1, 261, 36, 15437);
    			attr_dev(div49, "class", "overflow-hidden");
    			set_style(div49, "width", "120px");
    			set_style(div49, "height", "120px");
    			add_location(div49, file$1, 260, 32, 15333);
    			add_location(h65, file$1, 264, 36, 15650);
    			attr_dev(small8, "class", "text-body");
    			add_location(small8, file$1, 265, 36, 15717);
    			attr_dev(small9, "class", "text-price svelte-d9yz2r");
    			add_location(small9, file$1, 266, 36, 15800);
    			attr_dev(div50, "class", "flex-fill pl-3");
    			add_location(div50, file$1, 263, 32, 15584);
    			attr_dev(div51, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div51, file$1, 259, 28, 15237);
    			attr_dev(a21, "class", "text-decoration-none");
    			add_location(a21, file$1, 258, 24, 15175);
    			attr_dev(div52, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div52, file$1, 257, 20, 15064);
    			attr_dev(img9, "class", "img-fluid");
    			if (!src_url_equal(img9.src, img9_src_value = "img/cat-6.jpg")) attr_dev(img9, "src", img9_src_value);
    			attr_dev(img9, "alt", "");
    			set_style(img9, "height", "119px");
    			add_location(img9, file$1, 275, 36, 16373);
    			attr_dev(div53, "class", "overflow-hidden");
    			set_style(div53, "width", "120px");
    			set_style(div53, "height", "120px");
    			add_location(div53, file$1, 274, 32, 16269);
    			add_location(h66, file$1, 278, 36, 16586);
    			attr_dev(small10, "class", "text-body");
    			add_location(small10, file$1, 279, 36, 16647);
    			attr_dev(small11, "class", "text-price svelte-d9yz2r");
    			add_location(small11, file$1, 280, 36, 16730);
    			attr_dev(div54, "class", "flex-fill pl-3");
    			add_location(div54, file$1, 277, 32, 16520);
    			attr_dev(div55, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div55, file$1, 273, 28, 16173);
    			attr_dev(a22, "class", "text-decoration-none");
    			add_location(a22, file$1, 272, 24, 16110);
    			attr_dev(div56, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div56, file$1, 271, 20, 15999);
    			attr_dev(img10, "class", "img-fluid");
    			if (!src_url_equal(img10.src, img10_src_value = "img/cat-7.avif")) attr_dev(img10, "src", img10_src_value);
    			attr_dev(img10, "alt", "");
    			set_style(img10, "height", "119px");
    			add_location(img10, file$1, 289, 36, 17302);
    			attr_dev(div57, "class", "overflow-hidden");
    			set_style(div57, "width", "120px");
    			set_style(div57, "height", "120px");
    			add_location(div57, file$1, 288, 32, 17198);
    			add_location(h67, file$1, 292, 36, 17516);
    			attr_dev(small12, "class", "text-body");
    			add_location(small12, file$1, 293, 36, 17579);
    			attr_dev(small13, "class", "text-price svelte-d9yz2r");
    			add_location(small13, file$1, 294, 36, 17662);
    			attr_dev(div58, "class", "flex-fill pl-3");
    			add_location(div58, file$1, 291, 32, 17450);
    			attr_dev(div59, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div59, file$1, 287, 28, 17102);
    			attr_dev(a23, "class", "text-decoration-none");
    			add_location(a23, file$1, 286, 24, 17040);
    			attr_dev(div60, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div60, file$1, 285, 20, 16929);
    			attr_dev(img11, "class", "img-fluid");
    			if (!src_url_equal(img11.src, img11_src_value = "img/cat-8.jpg")) attr_dev(img11, "src", img11_src_value);
    			attr_dev(img11, "alt", "");
    			set_style(img11, "height", "119px");
    			add_location(img11, file$1, 303, 36, 18234);
    			attr_dev(div61, "class", "overflow-hidden");
    			set_style(div61, "width", "120px");
    			set_style(div61, "height", "120px");
    			add_location(div61, file$1, 302, 32, 18130);
    			add_location(h68, file$1, 306, 36, 18447);
    			attr_dev(small14, "class", "text-body");
    			add_location(small14, file$1, 307, 36, 18516);
    			attr_dev(small15, "class", "text-price svelte-d9yz2r");
    			add_location(small15, file$1, 308, 36, 18599);
    			attr_dev(div62, "class", "flex-fill pl-3");
    			add_location(div62, file$1, 305, 32, 18381);
    			attr_dev(div63, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div63, file$1, 301, 28, 18034);
    			attr_dev(a24, "class", "text-decoration-none");
    			add_location(a24, file$1, 300, 24, 17972);
    			attr_dev(div64, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div64, file$1, 299, 20, 17861);
    			attr_dev(div65, "class", "row px-xl-5 pb-3");
    			add_location(div65, file$1, 199, 16, 11189);
    			attr_dev(div66, "class", "container-fluid");
    			add_location(div66, file$1, 197, 12, 11001);
    			attr_dev(span9, "class", "bg-secondary pr-3");
    			add_location(span9, file$1, 317, 88, 18972);
    			attr_dev(h21, "class", "section-title position-relative text-uppercase mx-xl-5 mb-4");
    			add_location(h21, file$1, 317, 16, 18900);
    			attr_dev(img12, "class", "img-fluid");
    			if (!src_url_equal(img12.src, img12_src_value = "img/cat-9.webp")) attr_dev(img12, "src", img12_src_value);
    			attr_dev(img12, "alt", "");
    			set_style(img12, "height", "119px");
    			add_location(img12, file$1, 323, 36, 19457);
    			attr_dev(div67, "class", "overflow-hidden");
    			set_style(div67, "width", "120px");
    			set_style(div67, "height", "120px");
    			add_location(div67, file$1, 322, 32, 19353);
    			add_location(h69, file$1, 326, 36, 19671);
    			attr_dev(small16, "class", "text-body");
    			add_location(small16, file$1, 327, 36, 19727);
    			attr_dev(small17, "class", "text-price svelte-d9yz2r");
    			add_location(small17, file$1, 328, 36, 19809);
    			attr_dev(div68, "class", "flex-fill pl-3");
    			add_location(div68, file$1, 325, 32, 19605);
    			attr_dev(div69, "class", "cat-item d-flex align-items-center mb-4");
    			add_location(div69, file$1, 321, 28, 19266);
    			attr_dev(a25, "class", "text-decoration-none");
    			add_location(a25, file$1, 320, 24, 19204);
    			attr_dev(div70, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div70, file$1, 319, 20, 19093);
    			attr_dev(img13, "class", "img-fluid");
    			if (!src_url_equal(img13.src, img13_src_value = "img/cat-10.png")) attr_dev(img13, "src", img13_src_value);
    			attr_dev(img13, "alt", "");
    			set_style(img13, "height", "119px");
    			add_location(img13, file$1, 337, 36, 20380);
    			attr_dev(div71, "class", "overflow-hidden");
    			set_style(div71, "width", "120px");
    			set_style(div71, "height", "120px");
    			add_location(div71, file$1, 336, 32, 20276);
    			add_location(h610, file$1, 340, 36, 20594);
    			attr_dev(small18, "class", "text-body");
    			add_location(small18, file$1, 341, 36, 20650);
    			attr_dev(small19, "class", "text-price svelte-d9yz2r");
    			add_location(small19, file$1, 342, 36, 20733);
    			attr_dev(div72, "class", "flex-fill pl-3");
    			add_location(div72, file$1, 339, 32, 20528);
    			attr_dev(div73, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div73, file$1, 335, 28, 20180);
    			attr_dev(a26, "class", "text-decoration-none");
    			add_location(a26, file$1, 334, 24, 20118);
    			attr_dev(div74, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div74, file$1, 333, 20, 20007);
    			attr_dev(img14, "class", "img-fluid");
    			if (!src_url_equal(img14.src, img14_src_value = "img/cat-11.webp")) attr_dev(img14, "src", img14_src_value);
    			attr_dev(img14, "alt", "");
    			set_style(img14, "height", "119px");
    			set_style(img14, "width", "120px");
    			add_location(img14, file$1, 351, 36, 21304);
    			attr_dev(div75, "class", "overflow-hidden");
    			set_style(div75, "width", "120px");
    			set_style(div75, "height", "120px");
    			add_location(div75, file$1, 350, 32, 21200);
    			add_location(h611, file$1, 354, 36, 21531);
    			attr_dev(small20, "class", "text-body");
    			add_location(small20, file$1, 355, 36, 21588);
    			attr_dev(small21, "class", "text-price svelte-d9yz2r");
    			add_location(small21, file$1, 356, 36, 21671);
    			attr_dev(div76, "class", "flex-fill pl-3");
    			add_location(div76, file$1, 353, 32, 21465);
    			attr_dev(div77, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div77, file$1, 349, 28, 21104);
    			attr_dev(a27, "class", "text-decoration-none");
    			add_location(a27, file$1, 348, 24, 21042);
    			attr_dev(div78, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div78, file$1, 347, 20, 20931);
    			attr_dev(div79, "class", "row px-xl-5 pb-3");
    			add_location(div79, file$1, 318, 16, 19041);
    			attr_dev(div80, "class", "container-fluid pt-5");
    			add_location(div80, file$1, 316, 12, 18848);
    			attr_dev(div81, "class", "content-page svelte-d9yz2r");
    			add_location(div81, file$1, 150, 8, 7368);
    			attr_dev(i6, "class", "fas fa-shopping-cart");
    			set_style(i6, "color", "red");
    			set_style(i6, "font-size", "15px");
    			add_location(i6, file$1, 369, 78, 22175);
    			set_style(span10, "padding-bottom", "2px");
    			set_style(span10, "color", "red");
    			set_style(span10, "font-size", "10px");
    			add_location(span10, file$1, 369, 16, 22113);
    			attr_dev(a28, "href", "#");
    			attr_dev(a28, "class", "btn px-0 ");
    			set_style(a28, "margin-left", "3px");
    			attr_dev(a28, "data-toggle", "modal");
    			attr_dev(a28, "data-target", ".bd-example-modal-sm");
    			add_location(a28, file$1, 368, 12, 21982);
    			if (!src_url_equal(img15.src, img15_src_value = "img/scanner.png")) attr_dev(img15, "src", img15_src_value);
    			attr_dev(img15, "alt", "");
    			attr_dev(img15, "width", "25");
    			attr_dev(img15, "height", "25");
    			add_location(img15, file$1, 372, 16, 22392);
    			attr_dev(a29, "href", "#");
    			attr_dev(a29, "class", "btn px-0 ");
    			set_style(a29, "margin-left", "3px");
    			add_location(a29, file$1, 371, 12, 22291);
    			attr_dev(div82, "class", "card back-to-card bg-dark svelte-d9yz2r");
    			add_location(div82, file$1, 367, 8, 21928);
    			if (!src_url_equal(img16.src, img16_src_value = "img/goeat.png")) attr_dev(img16, "src", img16_src_value);
    			attr_dev(img16, "width", "40");
    			attr_dev(img16, "height", "40");
    			add_location(img16, file$1, 381, 72, 22841);
    			attr_dev(h51, "class", "modal-title");
    			attr_dev(h51, "id", "exampleModalLabel");
    			add_location(h51, file$1, 381, 24, 22793);
    			attr_dev(span11, "aria-hidden", "true");
    			add_location(span11, file$1, 383, 24, 23030);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "close");
    			attr_dev(button1, "data-dismiss", "modal");
    			attr_dev(button1, "aria-label", "Close");
    			add_location(button1, file$1, 382, 24, 22928);
    			attr_dev(div83, "class", "modal-header");
    			add_location(div83, file$1, 380, 20, 22741);
    			attr_dev(img17, "class", "img-fluid");
    			if (!src_url_equal(img17.src, img17_src_value = "img/cat-9.webp")) attr_dev(img17, "src", img17_src_value);
    			attr_dev(img17, "alt", "");
    			set_style(img17, "height", "70px");
    			add_location(img17, file$1, 394, 48, 23854);
    			attr_dev(div84, "class", "overflow-hidden");
    			set_style(div84, "width", "100px");
    			set_style(div84, "height", "70px");
    			add_location(div84, file$1, 393, 44, 23739);
    			add_location(h612, file$1, 397, 48, 24103);
    			attr_dev(small22, "class", "text-body");
    			add_location(small22, file$1, 398, 48, 24171);
    			attr_dev(small23, "class", "text-price svelte-d9yz2r");
    			add_location(small23, file$1, 399, 48, 24265);
    			attr_dev(div85, "class", "flex-fill pl-3");
    			add_location(div85, file$1, 396, 44, 24025);
    			attr_dev(div86, "class", "cat-item d-flex align-items-center mb-4");
    			add_location(div86, file$1, 392, 40, 23640);
    			attr_dev(a30, "href", "#");
    			attr_dev(a30, "class", "text-decoration-none");
    			add_location(a30, file$1, 391, 36, 23556);
    			attr_dev(div87, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div87, file$1, 390, 32, 23433);
    			attr_dev(img18, "class", "img-fluid");
    			if (!src_url_equal(img18.src, img18_src_value = "img/cat-10.png")) attr_dev(img18, "src", img18_src_value);
    			attr_dev(img18, "alt", "");
    			set_style(img18, "height", "70px");
    			add_location(img18, file$1, 409, 48, 25045);
    			attr_dev(div88, "class", "overflow-hidden");
    			set_style(div88, "width", "100px");
    			set_style(div88, "height", "70px");
    			add_location(div88, file$1, 408, 44, 24930);
    			add_location(h613, file$1, 412, 48, 25294);
    			attr_dev(small24, "class", "text-body");
    			add_location(small24, file$1, 413, 48, 25362);
    			attr_dev(small25, "class", "text-price svelte-d9yz2r");
    			add_location(small25, file$1, 414, 48, 25457);
    			attr_dev(div89, "class", "flex-fill pl-3");
    			add_location(div89, file$1, 411, 44, 25216);
    			attr_dev(div90, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div90, file$1, 407, 40, 24822);
    			attr_dev(a31, "href", "#");
    			attr_dev(a31, "class", "text-decoration-none");
    			add_location(a31, file$1, 406, 36, 24738);
    			attr_dev(div91, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div91, file$1, 405, 32, 24615);
    			attr_dev(img19, "class", "img-fluid");
    			if (!src_url_equal(img19.src, img19_src_value = "img/cat-11.webp")) attr_dev(img19, "src", img19_src_value);
    			attr_dev(img19, "alt", "");
    			set_style(img19, "height", "70px");
    			add_location(img19, file$1, 424, 48, 26237);
    			attr_dev(div92, "class", "overflow-hidden");
    			set_style(div92, "width", "100px");
    			set_style(div92, "height", "70px");
    			add_location(div92, file$1, 423, 44, 26122);
    			add_location(h614, file$1, 427, 48, 26487);
    			attr_dev(small26, "class", "text-body");
    			add_location(small26, file$1, 428, 48, 26556);
    			attr_dev(small27, "class", "text-price svelte-d9yz2r");
    			add_location(small27, file$1, 429, 48, 26651);
    			attr_dev(div93, "class", "flex-fill pl-3");
    			add_location(div93, file$1, 426, 44, 26409);
    			attr_dev(div94, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div94, file$1, 422, 40, 26014);
    			attr_dev(a32, "href", "#");
    			attr_dev(a32, "class", "text-decoration-none");
    			add_location(a32, file$1, 421, 36, 25930);
    			attr_dev(div95, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div95, file$1, 420, 32, 25807);
    			attr_dev(img20, "class", "img-fluid");
    			if (!src_url_equal(img20.src, img20_src_value = "img/cat-11.webp")) attr_dev(img20, "src", img20_src_value);
    			attr_dev(img20, "alt", "");
    			set_style(img20, "height", "70px");
    			add_location(img20, file$1, 440, 48, 27504);
    			attr_dev(div96, "class", "overflow-hidden");
    			set_style(div96, "width", "100px");
    			set_style(div96, "height", "70px");
    			add_location(div96, file$1, 439, 44, 27389);
    			add_location(h615, file$1, 443, 48, 27754);
    			attr_dev(small28, "class", "text-body");
    			add_location(small28, file$1, 444, 48, 27823);
    			attr_dev(small29, "class", "text-price svelte-d9yz2r");
    			add_location(small29, file$1, 445, 48, 27918);
    			attr_dev(div97, "class", "flex-fill pl-3");
    			add_location(div97, file$1, 442, 44, 27676);
    			attr_dev(div98, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div98, file$1, 438, 40, 27281);
    			attr_dev(a33, "class", "text-decoration-none");
    			add_location(a33, file$1, 437, 36, 27207);
    			attr_dev(div99, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div99, file$1, 435, 32, 27001);
    			attr_dev(img21, "class", "img-fluid");
    			if (!src_url_equal(img21.src, img21_src_value = "img/cat-11.webp")) attr_dev(img21, "src", img21_src_value);
    			attr_dev(img21, "alt", "");
    			set_style(img21, "height", "70px");
    			add_location(img21, file$1, 456, 48, 28771);
    			attr_dev(div100, "class", "overflow-hidden");
    			set_style(div100, "width", "100px");
    			set_style(div100, "height", "70px");
    			add_location(div100, file$1, 455, 44, 28656);
    			add_location(h616, file$1, 459, 48, 29021);
    			attr_dev(small30, "class", "text-body");
    			add_location(small30, file$1, 460, 48, 29090);
    			attr_dev(small31, "class", "text-price svelte-d9yz2r");
    			add_location(small31, file$1, 461, 48, 29185);
    			attr_dev(div101, "class", "flex-fill pl-3");
    			add_location(div101, file$1, 458, 44, 28943);
    			attr_dev(div102, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div102, file$1, 454, 40, 28548);
    			attr_dev(a34, "class", "text-decoration-none");
    			add_location(a34, file$1, 453, 36, 28474);
    			attr_dev(div103, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div103, file$1, 451, 32, 28268);
    			attr_dev(div104, "class", "row px-xl-5 pb-3");
    			set_style(div104, "overflow", "auto");
    			set_style(div104, "height", "250px");
    			add_location(div104, file$1, 388, 28, 23240);
    			add_location(form1, file$1, 387, 24, 23204);
    			attr_dev(div105, "class", "modal-body");
    			add_location(div105, file$1, 386, 20, 23154);
    			add_location(strong0, file$1, 473, 95, 29813);
    			attr_dev(span12, "class", "span-secundary svelte-d9yz2r");
    			set_style(span12, "padding", "0");
    			set_style(span12, "margin", "0");
    			add_location(span12, file$1, 473, 36, 29754);
    			add_location(td0, file$1, 472, 32, 29712);
    			attr_dev(span13, "class", "span-secundary svelte-d9yz2r");
    			set_style(span13, "padding", "0");
    			set_style(span13, "margin", "0");
    			add_location(span13, file$1, 476, 36, 29962);
    			add_location(td1, file$1, 475, 32, 29920);
    			set_style(tr0, "padding", "0");
    			set_style(tr0, "margin", "0");
    			add_location(tr0, file$1, 471, 28, 29644);
    			add_location(strong1, file$1, 482, 66, 30283);
    			attr_dev(span14, "class", "span-secundary svelte-d9yz2r");
    			add_location(span14, file$1, 482, 36, 30253);
    			add_location(td2, file$1, 481, 32, 30211);
    			attr_dev(span15, "class", "span-secundary svelte-d9yz2r");
    			add_location(span15, file$1, 485, 36, 30431);
    			add_location(td3, file$1, 484, 32, 30389);
    			add_location(tr1, file$1, 480, 28, 30173);
    			add_location(strong2, file$1, 490, 63, 30692);
    			attr_dev(span16, "class", "span-primary svelte-d9yz2r");
    			add_location(span16, file$1, 490, 36, 30665);
    			add_location(td4, file$1, 489, 32, 30623);
    			add_location(strong3, file$1, 493, 63, 30864);
    			attr_dev(span17, "class", "span-primary svelte-d9yz2r");
    			add_location(span17, file$1, 493, 36, 30837);
    			add_location(td5, file$1, 492, 32, 30795);
    			add_location(tr2, file$1, 488, 28, 30585);
    			set_style(tbody0, "line-height", "normal");
    			add_location(tbody0, file$1, 470, 24, 29580);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "btn btn-primary btn-car svelte-d9yz2r");
    			add_location(button2, file$1, 497, 24, 31073);
    			attr_dev(div106, "class", "modal-footer");
    			add_location(div106, file$1, 469, 20, 29528);
    			attr_dev(div107, "class", "modal-content");
    			add_location(div107, file$1, 379, 16, 22692);
    			attr_dev(div108, "class", "modal-dialog modal-xl");
    			add_location(div108, file$1, 378, 12, 22639);
    			attr_dev(div109, "class", "modal fade bd-example-modal-sm");
    			attr_dev(div109, "tabindex", "-1");
    			attr_dev(div109, "role", "dialog");
    			attr_dev(div109, "aria-labelledby", "mySmallModalLabel");
    			attr_dev(div109, "aria-hidden", "true");
    			add_location(div109, file$1, 377, 8, 22498);
    			attr_dev(h52, "class", "modal-title");
    			attr_dev(h52, "id", "exampleModalLabel");
    			add_location(h52, file$1, 506, 24, 31531);
    			attr_dev(span18, "aria-hidden", "true");
    			add_location(span18, file$1, 508, 24, 31728);
    			attr_dev(button3, "type", "button");
    			attr_dev(button3, "class", "close");
    			attr_dev(button3, "data-dismiss", "modal");
    			attr_dev(button3, "aria-label", "Close");
    			add_location(button3, file$1, 507, 24, 31626);
    			attr_dev(div110, "class", "modal-header");
    			add_location(div110, file$1, 505, 20, 31479);
    			attr_dev(img22, "class", "img-fluid");
    			if (!src_url_equal(img22.src, img22_src_value = "img/cat-3.jpg")) attr_dev(img22, "src", img22_src_value);
    			attr_dev(img22, "alt", "");
    			set_style(img22, "height", "70px");
    			set_style(img22, "width", "100%");
    			add_location(img22, file$1, 519, 48, 32552);
    			attr_dev(div111, "class", "overflow-hidden");
    			set_style(div111, "width", "100px");
    			set_style(div111, "height", "70px");
    			add_location(div111, file$1, 518, 44, 32437);
    			add_location(h617, file$1, 522, 48, 32813);
    			attr_dev(small32, "class", "text-body");
    			add_location(small32, file$1, 523, 48, 32894);
    			attr_dev(small33, "class", "text-price svelte-d9yz2r");
    			add_location(small33, file$1, 524, 48, 32988);
    			attr_dev(div112, "class", "flex-fill pl-3");
    			add_location(div112, file$1, 521, 44, 32735);
    			attr_dev(div113, "class", "cat-item d-flex align-items-center mb-4");
    			add_location(div113, file$1, 517, 40, 32338);
    			attr_dev(a35, "href", "#");
    			attr_dev(a35, "class", "text-decoration-none");
    			add_location(a35, file$1, 516, 36, 32254);
    			attr_dev(div114, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div114, file$1, 515, 32, 32131);
    			attr_dev(img23, "class", "img-fluid");
    			if (!src_url_equal(img23.src, img23_src_value = "img/cat-1.jpg")) attr_dev(img23, "src", img23_src_value);
    			attr_dev(img23, "alt", "");
    			set_style(img23, "height", "70px");
    			add_location(img23, file$1, 534, 48, 33769);
    			attr_dev(div115, "class", "overflow-hidden");
    			set_style(div115, "width", "100px");
    			set_style(div115, "height", "70px");
    			add_location(div115, file$1, 533, 44, 33654);
    			add_location(h618, file$1, 537, 48, 34017);
    			attr_dev(small34, "class", "text-body");
    			add_location(small34, file$1, 538, 48, 34096);
    			attr_dev(small35, "class", "text-price svelte-d9yz2r");
    			add_location(small35, file$1, 539, 48, 34191);
    			attr_dev(div116, "class", "flex-fill pl-3");
    			add_location(div116, file$1, 536, 44, 33939);
    			attr_dev(div117, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div117, file$1, 532, 40, 33546);
    			attr_dev(a36, "href", "#");
    			attr_dev(a36, "class", "text-decoration-none");
    			add_location(a36, file$1, 531, 36, 33462);
    			attr_dev(div118, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div118, file$1, 530, 32, 33339);
    			attr_dev(img24, "class", "img-fluid");
    			if (!src_url_equal(img24.src, img24_src_value = "img/cat-4.jpg")) attr_dev(img24, "src", img24_src_value);
    			attr_dev(img24, "alt", "");
    			set_style(img24, "height", "70px");
    			add_location(img24, file$1, 549, 48, 34972);
    			attr_dev(div119, "class", "overflow-hidden");
    			set_style(div119, "width", "100px");
    			set_style(div119, "height", "70px");
    			add_location(div119, file$1, 548, 44, 34857);
    			add_location(h619, file$1, 552, 48, 35220);
    			attr_dev(small36, "class", "text-body");
    			add_location(small36, file$1, 553, 48, 35293);
    			attr_dev(small37, "class", "text-price svelte-d9yz2r");
    			add_location(small37, file$1, 554, 48, 35388);
    			attr_dev(div120, "class", "flex-fill pl-3");
    			add_location(div120, file$1, 551, 44, 35142);
    			attr_dev(div121, "class", "cat-item img-zoom d-flex align-items-center mb-4");
    			add_location(div121, file$1, 547, 40, 34749);
    			attr_dev(a37, "href", "#");
    			attr_dev(a37, "class", "text-decoration-none");
    			add_location(a37, file$1, 546, 36, 34665);
    			attr_dev(div122, "class", "col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product svelte-d9yz2r");
    			add_location(div122, file$1, 545, 32, 34542);
    			attr_dev(div123, "class", "row px-xl-5 pb-3");
    			set_style(div123, "overflow", "auto");
    			set_style(div123, "height", "250px");
    			add_location(div123, file$1, 513, 28, 31938);
    			add_location(form2, file$1, 512, 24, 31902);
    			attr_dev(div124, "class", "modal-body");
    			add_location(div124, file$1, 511, 20, 31852);
    			add_location(strong4, file$1, 569, 93, 36143);
    			attr_dev(span19, "class", "span-primary svelte-d9yz2r");
    			set_style(span19, "padding", "0");
    			set_style(span19, "margin", "0");
    			add_location(span19, file$1, 569, 36, 36086);
    			add_location(td6, file$1, 568, 32, 36044);
    			attr_dev(span20, "class", "span-primary svelte-d9yz2r");
    			set_style(span20, "padding", "0");
    			set_style(span20, "margin", "0");
    			add_location(span20, file$1, 572, 36, 36287);
    			add_location(td7, file$1, 571, 32, 36245);
    			set_style(tr3, "padding", "0");
    			set_style(tr3, "margin", "0");
    			add_location(tr3, file$1, 567, 28, 35976);
    			add_location(strong5, file$1, 579, 63, 36611);
    			attr_dev(span21, "class", "span-primary svelte-d9yz2r");
    			add_location(span21, file$1, 579, 36, 36584);
    			add_location(td8, file$1, 578, 32, 36542);
    			add_location(strong6, file$1, 582, 63, 36783);
    			attr_dev(span22, "class", "span-primary svelte-d9yz2r");
    			add_location(span22, file$1, 582, 36, 36756);
    			add_location(td9, file$1, 581, 32, 36714);
    			add_location(tr4, file$1, 577, 28, 36504);
    			set_style(tbody1, "line-height", "normal");
    			add_location(tbody1, file$1, 566, 24, 35912);
    			attr_dev(button4, "type", "button");
    			attr_dev(button4, "class", "btn btn-primary btn-car svelte-d9yz2r");
    			add_location(button4, file$1, 586, 24, 36992);
    			attr_dev(div125, "class", "modal-footer");
    			add_location(div125, file$1, 565, 20, 35860);
    			attr_dev(div126, "class", "modal-content");
    			add_location(div126, file$1, 504, 16, 31430);
    			attr_dev(div127, "class", "modal-dialog modal-xl");
    			add_location(div127, file$1, 503, 12, 31377);
    			attr_dev(div128, "class", "modal fade bd-model");
    			attr_dev(div128, "tabindex", "-1");
    			attr_dev(div128, "role", "dialog");
    			attr_dev(div128, "aria-labelledby", "mySmallModalLabel");
    			attr_dev(div128, "aria-hidden", "true");
    			add_location(div128, file$1, 502, 8, 31247);
    			attr_dev(body, "class", "svelte-d9yz2r");
    			add_location(body, file$1, 58, 4, 1594);
    			add_location(main, file$1, 56, 0, 1580);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, body);
    			append_dev(body, div0);
    			append_dev(body, t0);
    			append_dev(body, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div1);
    			append_dev(div1, img0);
    			append_dev(div1, t1);
    			append_dev(div1, a0);
    			append_dev(a0, span0);
    			append_dev(a0, t3);
    			append_dev(a0, span1);
    			append_dev(div6, t5);
    			append_dev(div6, div4);
    			append_dev(div4, form0);
    			append_dev(form0, div3);
    			append_dev(div3, input);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div2, span2);
    			append_dev(span2, i0);
    			append_dev(div6, t7);
    			append_dev(div6, div5);
    			append_dev(div5, p0);
    			append_dev(div5, t9);
    			append_dev(div5, h50);
    			append_dev(body, t11);
    			append_dev(body, div18);
    			append_dev(div18, div17);
    			append_dev(div17, div10);
    			append_dev(div10, a1);
    			append_dev(a1, h60);
    			append_dev(h60, i1);
    			append_dev(h60, t12);
    			append_dev(a1, t13);
    			append_dev(a1, i2);
    			append_dev(div10, t14);
    			append_dev(div10, nav0);
    			append_dev(nav0, div9);
    			append_dev(div9, div8);
    			append_dev(div8, a2);
    			append_dev(div8, t16);
    			append_dev(div8, a3);
    			append_dev(div8, t18);
    			append_dev(div8, a4);
    			append_dev(div8, t20);
    			append_dev(div8, a5);
    			append_dev(div8, t22);
    			append_dev(div8, a6);
    			append_dev(div17, t24);
    			append_dev(div17, div16);
    			append_dev(div16, nav1);
    			append_dev(nav1, button0);
    			append_dev(button0, span3);
    			append_dev(nav1, t25);
    			append_dev(nav1, a7);
    			append_dev(a7, span4);
    			append_dev(a7, t27);
    			append_dev(a7, span5);
    			append_dev(nav1, t29);
    			append_dev(nav1, div15);
    			append_dev(div15, div13);
    			append_dev(div13, a8);
    			append_dev(div13, t31);
    			append_dev(div13, a9);
    			append_dev(div13, t33);
    			append_dev(div13, a10);
    			append_dev(div13, t35);
    			append_dev(div13, div12);
    			append_dev(div12, a11);
    			append_dev(a11, t36);
    			append_dev(a11, i3);
    			append_dev(div12, t37);
    			append_dev(div12, div11);
    			append_dev(div11, a12);
    			append_dev(div11, t39);
    			append_dev(div11, a13);
    			append_dev(div13, t41);
    			append_dev(div13, a14);
    			append_dev(div15, t43);
    			append_dev(div15, div14);
    			append_dev(div14, a15);
    			append_dev(a15, i4);
    			append_dev(a15, t44);
    			append_dev(a15, span6);
    			append_dev(div14, t46);
    			append_dev(div14, a16);
    			append_dev(a16, i5);
    			append_dev(a16, t47);
    			append_dev(a16, span7);
    			append_dev(span7, t48);
    			append_dev(body, t49);
    			append_dev(body, div81);
    			append_dev(div81, div32);
    			append_dev(div32, div31);
    			append_dev(div31, div30);
    			append_dev(div30, div29);
    			append_dev(div29, ol);
    			append_dev(ol, li0);
    			append_dev(ol, t50);
    			append_dev(ol, li1);
    			append_dev(ol, t51);
    			append_dev(ol, li2);
    			append_dev(div29, t52);
    			append_dev(div29, div28);
    			append_dev(div28, div21);
    			append_dev(div21, img1);
    			append_dev(div21, t53);
    			append_dev(div21, div20);
    			append_dev(div20, div19);
    			append_dev(div19, h10);
    			append_dev(div19, t55);
    			append_dev(div19, p1);
    			append_dev(div28, t57);
    			append_dev(div28, div24);
    			append_dev(div24, img2);
    			append_dev(div24, t58);
    			append_dev(div24, div23);
    			append_dev(div23, div22);
    			append_dev(div22, h11);
    			append_dev(div22, t60);
    			append_dev(div22, p2);
    			append_dev(div28, t62);
    			append_dev(div28, div27);
    			append_dev(div27, img3);
    			append_dev(div27, t63);
    			append_dev(div27, div26);
    			append_dev(div26, div25);
    			append_dev(div25, h12);
    			append_dev(div25, t65);
    			append_dev(div25, p3);
    			append_dev(div81, t67);
    			append_dev(div81, div66);
    			append_dev(div66, h20);
    			append_dev(h20, span8);
    			append_dev(div66, t69);
    			append_dev(div66, div65);
    			append_dev(div65, div36);
    			append_dev(div36, a17);
    			append_dev(a17, div35);
    			append_dev(div35, div33);
    			append_dev(div33, img4);
    			append_dev(div35, t70);
    			append_dev(div35, div34);
    			append_dev(div34, h61);
    			append_dev(div34, t72);
    			append_dev(div34, small0);
    			append_dev(div34, t74);
    			append_dev(div34, small1);
    			append_dev(div65, t76);
    			append_dev(div65, div40);
    			append_dev(div40, a18);
    			append_dev(a18, div39);
    			append_dev(div39, div37);
    			append_dev(div37, img5);
    			append_dev(div39, t77);
    			append_dev(div39, div38);
    			append_dev(div38, h62);
    			append_dev(div38, t79);
    			append_dev(div38, small2);
    			append_dev(div38, t81);
    			append_dev(div38, small3);
    			append_dev(div65, t83);
    			append_dev(div65, div44);
    			append_dev(div44, a19);
    			append_dev(a19, div43);
    			append_dev(div43, div41);
    			append_dev(div41, img6);
    			append_dev(div43, t84);
    			append_dev(div43, div42);
    			append_dev(div42, h63);
    			append_dev(div42, t86);
    			append_dev(div42, small4);
    			append_dev(div42, t88);
    			append_dev(div42, small5);
    			append_dev(div65, t90);
    			append_dev(div65, div48);
    			append_dev(div48, a20);
    			append_dev(a20, div47);
    			append_dev(div47, div45);
    			append_dev(div45, img7);
    			append_dev(div47, t91);
    			append_dev(div47, div46);
    			append_dev(div46, h64);
    			append_dev(div46, t93);
    			append_dev(div46, small6);
    			append_dev(div46, t95);
    			append_dev(div46, small7);
    			append_dev(div65, t97);
    			append_dev(div65, div52);
    			append_dev(div52, a21);
    			append_dev(a21, div51);
    			append_dev(div51, div49);
    			append_dev(div49, img8);
    			append_dev(div51, t98);
    			append_dev(div51, div50);
    			append_dev(div50, h65);
    			append_dev(div50, t100);
    			append_dev(div50, small8);
    			append_dev(div50, t102);
    			append_dev(div50, small9);
    			append_dev(div65, t104);
    			append_dev(div65, div56);
    			append_dev(div56, a22);
    			append_dev(a22, div55);
    			append_dev(div55, div53);
    			append_dev(div53, img9);
    			append_dev(div55, t105);
    			append_dev(div55, div54);
    			append_dev(div54, h66);
    			append_dev(div54, t107);
    			append_dev(div54, small10);
    			append_dev(div54, t109);
    			append_dev(div54, small11);
    			append_dev(div65, t111);
    			append_dev(div65, div60);
    			append_dev(div60, a23);
    			append_dev(a23, div59);
    			append_dev(div59, div57);
    			append_dev(div57, img10);
    			append_dev(div59, t112);
    			append_dev(div59, div58);
    			append_dev(div58, h67);
    			append_dev(div58, t114);
    			append_dev(div58, small12);
    			append_dev(div58, t116);
    			append_dev(div58, small13);
    			append_dev(div65, t118);
    			append_dev(div65, div64);
    			append_dev(div64, a24);
    			append_dev(a24, div63);
    			append_dev(div63, div61);
    			append_dev(div61, img11);
    			append_dev(div63, t119);
    			append_dev(div63, div62);
    			append_dev(div62, h68);
    			append_dev(div62, t121);
    			append_dev(div62, small14);
    			append_dev(div62, t123);
    			append_dev(div62, small15);
    			append_dev(div81, t125);
    			append_dev(div81, div80);
    			append_dev(div80, h21);
    			append_dev(h21, span9);
    			append_dev(div80, t127);
    			append_dev(div80, div79);
    			append_dev(div79, div70);
    			append_dev(div70, a25);
    			append_dev(a25, div69);
    			append_dev(div69, div67);
    			append_dev(div67, img12);
    			append_dev(div69, t128);
    			append_dev(div69, div68);
    			append_dev(div68, h69);
    			append_dev(div68, t130);
    			append_dev(div68, small16);
    			append_dev(div68, t132);
    			append_dev(div68, small17);
    			append_dev(div79, t134);
    			append_dev(div79, div74);
    			append_dev(div74, a26);
    			append_dev(a26, div73);
    			append_dev(div73, div71);
    			append_dev(div71, img13);
    			append_dev(div73, t135);
    			append_dev(div73, div72);
    			append_dev(div72, h610);
    			append_dev(div72, t137);
    			append_dev(div72, small18);
    			append_dev(div72, t139);
    			append_dev(div72, small19);
    			append_dev(div79, t141);
    			append_dev(div79, div78);
    			append_dev(div78, a27);
    			append_dev(a27, div77);
    			append_dev(div77, div75);
    			append_dev(div75, img14);
    			append_dev(div77, t142);
    			append_dev(div77, div76);
    			append_dev(div76, h611);
    			append_dev(div76, t144);
    			append_dev(div76, small20);
    			append_dev(div76, t146);
    			append_dev(div76, small21);
    			append_dev(body, t148);
    			append_dev(body, div82);
    			append_dev(div82, a28);
    			append_dev(a28, span10);
    			append_dev(span10, i6);
    			append_dev(span10, t149);
    			append_dev(div82, t150);
    			append_dev(div82, a29);
    			append_dev(a29, img15);
    			append_dev(body, t151);
    			append_dev(body, div109);
    			append_dev(div109, div108);
    			append_dev(div108, div107);
    			append_dev(div107, div83);
    			append_dev(div83, h51);
    			append_dev(h51, img16);
    			append_dev(h51, t152);
    			append_dev(div83, t153);
    			append_dev(div83, button1);
    			append_dev(button1, span11);
    			append_dev(div107, t155);
    			append_dev(div107, div105);
    			append_dev(div105, form1);
    			append_dev(form1, div104);
    			append_dev(div104, div87);
    			append_dev(div87, a30);
    			append_dev(a30, div86);
    			append_dev(div86, div84);
    			append_dev(div84, img17);
    			append_dev(div86, t156);
    			append_dev(div86, div85);
    			append_dev(div85, h612);
    			append_dev(div85, t158);
    			append_dev(div85, small22);
    			append_dev(div85, t160);
    			append_dev(div85, small23);
    			append_dev(div104, t162);
    			append_dev(div104, div91);
    			append_dev(div91, a31);
    			append_dev(a31, div90);
    			append_dev(div90, div88);
    			append_dev(div88, img18);
    			append_dev(div90, t163);
    			append_dev(div90, div89);
    			append_dev(div89, h613);
    			append_dev(div89, t165);
    			append_dev(div89, small24);
    			append_dev(div89, t167);
    			append_dev(div89, small25);
    			append_dev(div104, t169);
    			append_dev(div104, div95);
    			append_dev(div95, a32);
    			append_dev(a32, div94);
    			append_dev(div94, div92);
    			append_dev(div92, img19);
    			append_dev(div94, t170);
    			append_dev(div94, div93);
    			append_dev(div93, h614);
    			append_dev(div93, t172);
    			append_dev(div93, small26);
    			append_dev(div93, t174);
    			append_dev(div93, small27);
    			append_dev(div104, t176);
    			append_dev(div104, div99);
    			append_dev(div99, a33);
    			append_dev(a33, div98);
    			append_dev(div98, div96);
    			append_dev(div96, img20);
    			append_dev(div98, t177);
    			append_dev(div98, div97);
    			append_dev(div97, h615);
    			append_dev(div97, t179);
    			append_dev(div97, small28);
    			append_dev(div97, t181);
    			append_dev(div97, small29);
    			append_dev(div104, t183);
    			append_dev(div104, div103);
    			append_dev(div103, a34);
    			append_dev(a34, div102);
    			append_dev(div102, div100);
    			append_dev(div100, img21);
    			append_dev(div102, t184);
    			append_dev(div102, div101);
    			append_dev(div101, h616);
    			append_dev(div101, t186);
    			append_dev(div101, small30);
    			append_dev(div101, t188);
    			append_dev(div101, small31);
    			append_dev(div107, t190);
    			append_dev(div107, div106);
    			append_dev(div106, tbody0);
    			append_dev(tbody0, tr0);
    			append_dev(tr0, td0);
    			append_dev(td0, span12);
    			append_dev(span12, strong0);
    			append_dev(tr0, t192);
    			append_dev(tr0, td1);
    			append_dev(td1, span13);
    			append_dev(tbody0, t194);
    			append_dev(tbody0, tr1);
    			append_dev(tr1, td2);
    			append_dev(td2, span14);
    			append_dev(span14, strong1);
    			append_dev(tr1, t196);
    			append_dev(tr1, td3);
    			append_dev(td3, span15);
    			append_dev(tbody0, t198);
    			append_dev(tbody0, tr2);
    			append_dev(tr2, td4);
    			append_dev(td4, span16);
    			append_dev(span16, strong2);
    			append_dev(tr2, t200);
    			append_dev(tr2, td5);
    			append_dev(td5, span17);
    			append_dev(span17, strong3);
    			append_dev(div106, t202);
    			append_dev(div106, button2);
    			append_dev(body, t204);
    			append_dev(body, div128);
    			append_dev(div128, div127);
    			append_dev(div127, div126);
    			append_dev(div126, div110);
    			append_dev(div110, h52);
    			append_dev(div110, t206);
    			append_dev(div110, button3);
    			append_dev(button3, span18);
    			append_dev(div126, t208);
    			append_dev(div126, div124);
    			append_dev(div124, form2);
    			append_dev(form2, div123);
    			append_dev(div123, div114);
    			append_dev(div114, a35);
    			append_dev(a35, div113);
    			append_dev(div113, div111);
    			append_dev(div111, img22);
    			append_dev(div113, t209);
    			append_dev(div113, div112);
    			append_dev(div112, h617);
    			append_dev(div112, t211);
    			append_dev(div112, small32);
    			append_dev(div112, t213);
    			append_dev(div112, small33);
    			append_dev(div123, t215);
    			append_dev(div123, div118);
    			append_dev(div118, a36);
    			append_dev(a36, div117);
    			append_dev(div117, div115);
    			append_dev(div115, img23);
    			append_dev(div117, t216);
    			append_dev(div117, div116);
    			append_dev(div116, h618);
    			append_dev(div116, t218);
    			append_dev(div116, small34);
    			append_dev(div116, t220);
    			append_dev(div116, small35);
    			append_dev(div123, t222);
    			append_dev(div123, div122);
    			append_dev(div122, a37);
    			append_dev(a37, div121);
    			append_dev(div121, div119);
    			append_dev(div119, img24);
    			append_dev(div121, t223);
    			append_dev(div121, div120);
    			append_dev(div120, h619);
    			append_dev(div120, t225);
    			append_dev(div120, small36);
    			append_dev(div120, t227);
    			append_dev(div120, small37);
    			append_dev(div126, t229);
    			append_dev(div126, div125);
    			append_dev(div125, tbody1);
    			append_dev(tbody1, tr3);
    			append_dev(tr3, td6);
    			append_dev(td6, span19);
    			append_dev(span19, strong4);
    			append_dev(tr3, t231);
    			append_dev(tr3, td7);
    			append_dev(td7, span20);
    			append_dev(tbody1, t233);
    			append_dev(tbody1, tr4);
    			append_dev(tr4, td8);
    			append_dev(td8, span21);
    			append_dev(span21, strong5);
    			append_dev(tr4, t235);
    			append_dev(tr4, td9);
    			append_dev(td9, span22);
    			append_dev(span22, strong6);
    			append_dev(div125, t237);
    			append_dev(div125, button4);
    			append_dev(body, t239);
    			if (if_block0) if_block0.m(body, null);
    			append_dev(body, t240);
    			if (if_block1) if_block1.m(body, null);
    			append_dev(body, t241);
    			if (if_block2) if_block2.m(body, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div36, "click", /*click_handler*/ ctx[4], false, false, false, false),
    					listen_dev(div40, "click", /*click_handler_1*/ ctx[5], false, false, false, false),
    					listen_dev(div44, "click", /*click_handler_2*/ ctx[6], false, false, false, false),
    					listen_dev(div48, "click", /*click_handler_3*/ ctx[7], false, false, false, false),
    					listen_dev(div52, "click", /*click_handler_4*/ ctx[8], false, false, false, false),
    					listen_dev(div56, "click", /*click_handler_5*/ ctx[9], false, false, false, false),
    					listen_dev(div60, "click", /*click_handler_6*/ ctx[10], false, false, false, false),
    					listen_dev(div64, "click", /*click_handler_7*/ ctx[11], false, false, false, false),
    					listen_dev(div70, "click", /*click_handler_8*/ ctx[12], false, false, false, false),
    					listen_dev(div74, "click", /*click_handler_9*/ ctx[13], false, false, false, false),
    					listen_dev(div78, "click", /*click_handler_10*/ ctx[14], false, false, false, false),
    					listen_dev(a29, "click", /*scannerActive*/ ctx[3], false, false, false, false),
    					listen_dev(div87, "click", /*click_handler_11*/ ctx[15], false, false, false, false),
    					listen_dev(div91, "click", /*click_handler_12*/ ctx[16], false, false, false, false),
    					listen_dev(div95, "click", /*click_handler_13*/ ctx[17], false, false, false, false),
    					listen_dev(div99, "click", /*click_handler_14*/ ctx[18], false, false, false, false),
    					listen_dev(div103, "click", /*click_handler_15*/ ctx[19], false, false, false, false),
    					listen_dev(div114, "click", /*click_handler_16*/ ctx[20], false, false, false, false),
    					listen_dev(div118, "click", /*click_handler_17*/ ctx[21], false, false, false, false),
    					listen_dev(div122, "click", /*click_handler_18*/ ctx[22], false, false, false, false),
    					listen_dev(button4, "click", /*click_handler_19*/ ctx[23], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*car*/ 2) set_data_dev(t48, /*car*/ ctx[1]);
    			if (dirty[0] & /*car*/ 2) set_data_dev(t149, /*car*/ ctx[1]);

    			if (/*car*/ ctx[1] > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(body, t240);
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
    					if_block1.m(body, t241);
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

    	const resultscanner = result => {
    		console.log("result", result);
    		gamescanner = true;
    		window.$(".bd-model").modal("show");
    	};

    	function showQRCode() {
    		let qrCodeElement = document.getElementById('qrcode');
    		qrCodeElement.innerHTML = qr.createImgTag(4);
    	}

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
    		$$invalidate(0, gameOpen = false);
    	};

    	const click_handler_23 = () => {
    		$$invalidate(2, gameOpencasine = false);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		QRCode,
    		gameOpen,
    		car,
    		gamescanner,
    		gameOpencasine,
    		scanner,
    		inforQR,
    		qr,
    		scannerActive,
    		initBarcodeScanner,
    		resultscanner,
    		showQRCode
    	});

    	$$self.$inject_state = $$props => {
    		if ('gameOpen' in $$props) $$invalidate(0, gameOpen = $$props.gameOpen);
    		if ('car' in $$props) $$invalidate(1, car = $$props.car);
    		if ('gamescanner' in $$props) gamescanner = $$props.gamescanner;
    		if ('gameOpencasine' in $$props) $$invalidate(2, gameOpencasine = $$props.gameOpencasine);
    		if ('scanner' in $$props) scanner = $$props.scanner;
    		if ('inforQR' in $$props) inforQR = $$props.inforQR;
    		if ('qr' in $$props) qr = $$props.qr;
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
    		click_handler_23
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
