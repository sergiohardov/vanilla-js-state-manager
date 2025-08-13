class State extends EventTarget {
    #value;

    constructor(initialValue) {
        super();
        this.#value = initialValue;
    }

    get value() {
        return this.#value;
    }

    update(newValue) {
        this.#value = newValue;
        this.dispatchEvent(new CustomEvent('change', {detail: this.#value}));
    }

    subscribe(cb, opt) {
        const handler = (event) => cb(event.detail);
        this.addEventListener('change', handler, opt);
        return () => this.removeEventListener('change', handler, opt);
    }
}

// Exporting & extends class
class AbstractReactiveState {
    constructor() {
        this.State = {};
        this.state = {};
        this._effects = [];
    }

    useState(initialObj) {
        Object.entries(initialObj).forEach(([key, value]) => {
            const [stateObj, setter] = useState(value);
            this.State[key] = stateObj;
            this.state[key] = value;

            stateObj.subscribe((newVal) => {
                this.state[key] = newVal;
            });

            this[`set${capitalize(key)}`] = (val) => {
                if (typeof val === 'function') {
                    stateObj.update(val(this.State[key].value));
                } else {
                    stateObj.update(val);
                }
            };
        });
    }

    useEffect(cb, deps, firstRenderCall = true) {
        const unsub = useEffect(cb, deps, firstRenderCall);
        this._effects.push(unsub);
        return unsub;
    }

    setState(updater) {
        if (typeof updater === 'function') {
            updater = updater({...this.state});
        }
        if (typeof updater === 'object' && updater !== null) {
            Object.entries(updater).forEach(([key, val]) => {
                if (this.State[key]) {
                    this.State[key].update(val);
                }
            });
        }
    }

    destroy() {
        this._effects.forEach(unsub => unsub());
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Exporting function
function useState(initialValue) {
    const state = new State(initialValue);
    const setter = (updater) => {
        if (typeof updater === 'function') {
            state.update(updater(state.value));
        } else {
            state.update(updater);
        }
    };
    return [state, setter];
}

// Exporting function
function useEffect(cb, dependencies = [], firstRenderCall = true) {
    const unsubs = dependencies.map(dep => {
        if (dep && typeof dep.subscribe === 'function') {
            return dep.subscribe(cb);
        } else {
            console.error('Dependency is not a State object:', dep);
            return () => {
            };
        }
    });
    if (firstRenderCall) cb(); // Этот коллбек тут для того что бы работать как в реакте, когда мы вызваем useEffect то содержимое выполняется первый раз при рендере
    return () => unsubs.forEach(unsub => unsub());
}



