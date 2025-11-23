/**
 * @interface IObservableCallback
 * Represents the callback options for observable events.
 *
 * This type defines a function that can be used as a callback for observable events.
 * It accepts a variable number of arguments of any type and returns a value of any type.
 *
 * Callbacks of this type can be utilized in various event-driven scenarios, allowing
 * flexibility in the number and types of parameters passed to the callback.
 *
 * @example
 * ```typescript
 * const callback: IObservableCallback = (arg1: string, arg2: number) => {
 *   console.log(arg1, arg2); // Outputs the string and number passed to the callback
 * };
 *
 * // Invoking the callback with different types of arguments
 * callback("Event triggered", 42); // Outputs: Event triggered 42
 * callback("Another event", 100);   // Outputs: Another event 100
 * ```
 */
export type IObservableCallback = (...args: any[]) => any;

/**
 * Represents a collection of observable callbacks mapped to their respective event types,
 * allowing for optional event handling.
 *
 * This type defines a record structure where each key corresponds to a specific event type,
 * and the value is an array of callback functions associated with that event. The use of
 * `Partial` allows for flexibility, meaning that not all event types need to have registered
 * callbacks, making it suitable for scenarios where some events may not be utilized.
 *
 * @template EventType - A generic type parameter that extends from `string`, representing
 *                      the event types. By default, it is set to `string`, allowing for
 *                      any string-based event name.
 *
 * @example
 * // Defining specific event types
 * type MyEvent = 'click' | 'hover' | 'scroll';
 *
 * // Creating a record of callbacks for the defined events
 * const callbacks: IObservableCallbacks<MyEvent> = {
 *   click: [
 *     (event) => console.log('Click event handler 1', event),
 *     (event) => console.log('Click event handler 2', event),
 *   ],
 *   hover: [
 *     (event) => console.log('Hover event handler', event),
 *   ],
 *   // 'scroll' event has no callbacks registered
 * };
 *
 * // Accessing the callbacks for a specific event
 * const clickHandlers = callbacks.click;
 * if (clickHandlers) {
 *   clickHandlers.forEach(handler => handler('click')); // Logs: Click event handler 1 click
 *   // Logs: Click event handler 2 click
 * }
 *
 * @remarks
 * This type is particularly useful in event-driven architectures where multiple callbacks
 * need to be associated with different events. The use of `Partial` allows for a more
 * flexible design, enabling developers to define only the events they are interested in
 * without requiring all possible events to be present.
 */
export type IObservableCallbacks<EventType extends string = string> = Partial<Record<EventType | IObservableAllEventType, IObservableCallback[]>>;

/**
 * Represents a wildcard event type for observable systems.
 *
 * This type is used to signify that a callback should be triggered for all events within
 * an observable system. It acts as a catch-all for any event, allowing developers to
 * register handlers that respond to every event emitted by the observable.
 *
 * @example
 * // Using the wildcard event type to listen for all events
 * observable.on('*', (event, ...args) => {
 *   console.log(`An event occurred: ${event}`, 'Arguments:', args);
 * });
 *
 * @remarks
 * The use of a wildcard event type can be useful for logging, debugging, or handling
 * global events that are not specific to a single event type. However, it should be used
 * judiciously, as it may lead to performance concerns if many events are emitted frequently.
 */
export type IObservableAllEventType = "*";

export type IObservable<EventType extends string = string, Context = unknown> = {
  _____isObservable?: boolean;
  on: (event: EventType, fn: IObservableCallback) => { remove: () => any };
  finally: (event: EventType, fn: IObservableCallback) => IObservable<EventType>;
  off: (event: EventType, fn: IObservableCallback) => IObservable<EventType>;
  trigger: (event: EventType | IObservableAllEventType, ...args: any[]) => IObservable<EventType>;
  offAll: () => IObservable<EventType>;
  once: (event: EventType, fn: IObservableCallback) => { remove: () => any };
  getEventCallBacks: () => IObservableCallbacks<EventType>;
} & Context;

/**
 * Returns an instance of the IObservable interface.
 * The `observableFactory` function creates a new observable object with methods to manage
 * event listeners and trigger events. The returned observable object allows for adding,
 * removing, and triggering event callbacks, as well as managing final callbacks that execute
 * after all other callbacks for an event.
 *
 * @returns {IObservable<EventType>} A new instance of the observable object.
 *
 * @example
 * ```typescript
 * const observable = observableFactory();
 * observable.on("event", (arg1, arg2) => {
 *   console.log(arg1, arg2);
 * });
 * observable.trigger("event", "Hello", "World"); // Outputs: Hello World
 * observable.on("event",function(){
 *  console.log("event triggered");
 * })
 * ```
 * @see {@link IObservable} for more information on the observable interface.
 * @see {@link IObservableCallbacks} for more information on the observable callbacks interface.
 * @see {@link IObservableAllEventType} for more information on the observable all event type.
 * @see {@link isObservable} for more information on the observable check function.
 */
export const observableFactory = function <EventType extends string = string, Context = unknown>(context?: Context): IObservable<EventType, Context> {
  /**
   * Private variables
   */
  let callbacks: IObservableCallbacks<EventType> = {},
    finallyCallback: { [key: string]: IObservableCallback[] } = {},
    slice = Array.prototype.slice;

  return {
    ...Object.assign({}, context),
    /**
     * Listen to the given `event` and execute the `callback` each time an event is triggered.
     *
     * @param {EventType} event - The event to listen to.
     * @param {IObservableCallback} fn - The callback function to execute.
     * @returns {{ remove: () => any }} An object with a `remove` method to remove the callback.
     */
    on: function (event: EventType, fn: IObservableCallback): { remove: () => any } {
      if (fn && event) {
        (callbacks[event] = callbacks[event] || []).push(fn);
      }
      return {
        remove: () => {
          this.off(event, fn);
        },
      };
    },
    /**
     * Add a finally callback function to an event that will be triggered. this callback is called  after all other callbacks have been called.
     *
     * @param {EventType} event - The event to listen to.
     * @param {IObservableCallback} fn - The callback function to execute.
     * @returns {IObservable<EventType>} The observable object.
     */
    finally: function (event: EventType, fn: IObservableCallback): IObservable<EventType> {
      if (fn && event) {
        (finallyCallback[event] = finallyCallback[event] || []).push(fn);
        return this;
      }
      return this;
    },
    /**
     * Removes the given `event` listener.
     *
     * If `fn` is provided, removes the specific callback function from the event.
     * If `fn` is not provided, removes all callback functions from the event.
     *
     * @param {EventType} event - The event to remove the listener from.
     * @param {IObservableCallback} [fn] - The callback function to remove.
     * @returns {IObservable<EventType>} The observable object.
     */
    off: function (event: EventType, fn: IObservableCallback): IObservable<EventType> {
      if (!event) return this;
      if (event == "*" && !fn) callbacks = {};
      else {
        if (fn) {
          var arr = callbacks[event];
          for (var i = 0, cb; (cb = arr && arr[i]); ++i) {
            if (cb == fn) {
              arr.splice(i--, 1);
            }
          }
        } else {
        }
      }
      return this;
    },

    /**
     * Listen to the given `event` and execute the `callback` at most once.
     *
     * @param {EventType} event - The event to listen to.
     * @param {IObservableCallback} fn - The callback function to execute.
     * @returns {{ remove: () => any }} An object with a `remove` method to remove the callback.
     */
    once: function (event: EventType, fn: IObservableCallback) {
      const on = (...args: any[]) => {
        this.off(event, on);
        fn.apply(this, args);
      };
      return this.on(event, on);
    },
    /**
     * Execute all callback functions that listen to
     * the given `event`. if the last argument is function then il will be considered as the
     * final callback function to be execute after alls callbacks'execution (
     * \nExample :
     * ```ts
     *  obj.trigger(even,arg1,arg2,...argN,function(){});
     *  // The execution callback takes the result of the execution of all triggers as a parameter
     * and all arguments passed as parameters to all triggers.
     * If this parameter has no arguments, then no trigger has been found in the observable.
     * ```
     * \nExample:
     * ```typescript
     * const observable = observableFactory();
     * observable.on("event", (arg1, arg2) => {
     *   console.log(arg1, arg2);
     * });
     * observable.trigger("event", "arg1", "arg2", (results, args) => {
     *   console.log(results, args);
     * });
     * ```
     * \nExample with multiple callbacks:
     * ```typescript
     * const observable = observableFactory();
     * observable.on("event", (arg1, arg2) => {
     *   console.log("Callback 1:", arg1, arg2);
     * });
     * observable.on("event", (arg1, arg2) => {
     *   console.log("Callback 2:", arg1, arg2);
     * });
     * observable.trigger("event", "arg1", "arg2", (results, args) => {
     *   console.log("Final callback:", results, args);
     * });
     * ```
     * \nExample with wildcard event:
     * ```typescript
     * const observable = observableFactory();
     * observable.on("*", (arg1, arg2) => {
     *   console.log("Wildcard callback:", arg1, arg2);
     * });
     * observable.trigger("event", "arg1", "arg2");
     * ```
     * @param {EventType} event - The event to trigger.
     * @param {...any[]} args - The arguments to pass to the callback functions.
     * @returns {IObservable<EventType>} The observable object.
     */
    trigger: function (event: EventType | IObservableAllEventType, ...args: any[]): IObservable<EventType> {
      if (!event) return this;
      // getting the arguments
      let fns, fn, i;
      let finaly = null;
      if (typeof args[args.length - 1] == "function") {
        finaly = args.pop();
      }
      fns = slice.call(callbacks[event] || [], 0);
      let fnsReturns = [];
      for (i = 0; (fn = fns[i]); ++i) {
        if (typeof fn === "function") {
          fnsReturns.push(fn.apply(this, args));
        }
      }
      if (typeof callbacks["*"] == "function" && event != "*") {
        this.trigger(event, ...args);
        this.trigger("*", ...args);
      }
      //finaly events callback
      var finalCals = slice.call(finallyCallback[event] || [], 0);
      // le premier paramètres, représente un tableau des différents résultats retournés par les écouteurs de l'évènemet
      // Le deuxième paramètre est le tableau contenant toute la liste de tous les arguments qui ont été passés à la fonction trigger
      for (i = 0; (fn = finalCals[i]); ++i) {
        fn.call(this, fnsReturns, args);
      }
      //le callback de fin d'exécution de l'évènement trigger, prend en paramètres:
      // le premier paramètres, représente un tableau des différents résultats retournés par les écouteurs de l'évènemet
      // Le deuxième paramètre est le tableau contenant toute la liste de tous les arguments qui ont été passés à la fonction trigger
      if (finaly) {
        finaly.call(this, fnsReturns, args);
      }
      return this;
    },
    /**
     * Remove all event bindings.
     *
     * This method removes all callback functions from all events.
     *
     * @returns {IObservable<EventType>} The observable object.
     *
     * Example:
     * ```typescript
     * const observable = observableFactory();
     * observable.on("event", () => {
     *   console.log("Callback");
     * });
     * observable.offAll();
     * observable.trigger("event"); // No callback will be executed
     * ```
     */
    offAll: function (): IObservable<EventType> {
      callbacks = {};
      finallyCallback = {};
      return this;
    },

    /**
     * Get all event callbacks.
     *
     * This method returns an object containing all callback functions for all events.
     *
     * @returns {IObservableCallbacks<EventType>} An object with event names as keys and arrays of callback functions as values.
     *
     * Example:
     * ```typescript
     * const observable = observableFactory();
     * observable.on("event", () => {
     *   console.log("Callback");
     * });
     * const callbacks = observable.getEventCallBacks();
     * console.log(callbacks); // { event: [ [Function] ] }
     * ```
     */
    getEventCallBacks: function (): IObservableCallbacks<EventType> {
      return callbacks;
    },
  };
};

/**
 * Creates an observable object based on the provided element.
 *
 * The `observable` function checks if the given element is already observable. If it is,
 * the function returns the existing observable instance. If not, it creates a new observable
 * instance and extends the provided element with observable methods. This allows the element
 * to listen for events, trigger callbacks, and manage event listeners.
 *
 * @template EventType - The type of the event. This can be any string or a custom type.
 * @param {any} element - The element to make observable. This can be any object or value.
 * @returns {IObservable<EventType>} The observable object, which includes methods for event handling.
 *
 * @example
 * ```typescript
 * const context = observable({});
 * const testCb = (e) => console.log("test");
 * context.on("test", testCb);
 * context.trigger("test");
 * context.off("test", testCb);
 * context.offAll();
 * ```
 * @see {@link IObservable} for more information on the observable interface.
 * @see {@link IObservableCallbacks} for more information on the observable callbacks interface.
 * @see {@link IObservableAllEventType} for more information on the observable all event type.
 * @see {@link isObservable} for more information on the observable check function.
 */
export const observable = function <EventType extends string = string>(element: any): IObservable<EventType> {
  /**
   * Check if the element is already observable.
   *
   * If the element is already observable, return it immediately.
   */
  if (isObservable(element)) return element; ///avoid redefine observable

  /**
   * Create a new observable object.
   */
  const context = element || {};

  /**
   * Create a new observable instance using the observableFactory function.
   */
  const obj = observableFactory<EventType>();

  /**
   * Extend the context object with the observable methods.
   */
  Object.defineProperties(context, {
    /**
     * Flag indicating whether the object is observable.
     */
    _____isObservable: { value: true },

    /**
     * Listen to the given `event` and execute the `callback` each time an event is triggered.
     *
     * @param {EventType} event - The event to listen to.
     * @param {IObservableCallback} fn - The callback function to execute.
     * @returns {{ remove: () => any }} An object with a `remove` method to remove the callback.
     */
    on: {
      value: obj.on.bind(context),
    },

    /**
     * Add a callback function to an event that will be triggered once.
     *
     * @param {EventType} event - The event to listen to.
     * @param {IObservableCallback} fn - The callback function to execute.
     * @returns {IObservable<EventType>} The observable object.
     */
    finally: {
      value: obj.finally.bind(context),
    },

    /**
     * Removes the given `event` listener.
     *
     * If `fn` is provided, removes the specific callback function from the event.
     * If `fn` is not provided, removes all callback functions from the event.
     *
     * @param {EventType} event - The event to remove the listener from.
     * @param {IObservableCallback} [fn] - The callback function to remove.
     * @returns {IObservable<EventType>} The observable object.
     */
    off: {
      value: obj.off.bind(context),
    },

    /**
     * Remove all event bindings.
     *
     * @returns {IObservable<EventType>} The observable object.
     */
    offAll: {
      value: obj.offAll.bind(context),
    },

    /**
     * Listen to the given `event` and execute the `callback` at most once.
     *
     * @param {string} event - The event to listen to.
     * @param {IObservableCallback} fn - The callback function to execute.
     * @returns {{ remove: () => any }} An object with a `remove` method to remove the callback.
     */
    once: {
      value: obj.once.bind(context),
    },

    /**
     * Get all event callbacks.
     *
     * @returns {{ [key: string]: IObservableCallback[] }} An object with event names as keys and arrays of callback functions as values.
     */
    getEventCallBacks: {
      value: obj.getEventCallBacks.bind(context),
    },

    /**
     * Execute all callback functions that listen to the given `event`.
     *
     * If the last argument is a function, it will be considered as the final callback function to be executed after all callbacks' execution.
     *
     * @param {EventType} event - The event to trigger.
     * @param {...any[]} args - The arguments to pass to the callback functions.
     * @returns {IObservable<EventType>} The observable object.
     */
    trigger: {
      value: obj.trigger.bind(context),
    },
  });
  return context;
};

/**
 * Exports the ObservableClass that implements the IObservable interface.
 *
 * This class provides a way to create observable objects that can emit events and have
 * listeners attached to them. It encapsulates the observable functionality, allowing
 * users to manage events and their corresponding callbacks in a structured manner.
 *
 * The ObservableClass is particularly useful in scenarios where you need to implement
 * an event-driven architecture, enabling decoupled communication between different parts
 * of an application.
 * @template EventType - The type of the event. This can be any string or a custom type.
 */
export class ObservableClass<EventType extends string = string> implements IObservable<EventType> {
  /**
   * Flag indicating whether the object is observable.
   *
   * This property is used internally to identify instances of observable objects.
   * It is set to true for all instances of this class.
   */
  readonly _____isObservable?: boolean | undefined = true;

  /**
   * The internal observable object that provides the observable functionality.
   *
   * This object is created using the observableFactory function and contains
   * the core methods for managing event listeners and triggering events.
   */
  readonly _observable = observableFactory<EventType>();

  /**
   * Listen to the given `event` and execute the `callback` each time an event is triggered.
   *
   * @param {EventType} event - The event to listen to.
   * @param {IObservableCallback} fn - The callback function to execute.
   * @returns {{ remove: () => any }} An object with a `remove` method to remove the callback.
   *
   * @example
   * ```typescript
   * const observable = new ObservableClass();
   * const subscription = observable.on("dataReceived", (data) => {
   *   console.log("Data received:", data);
   * });
   * ```
   */
  on(event: EventType, fn: IObservableCallback): { remove: () => any } {
    return this._observable.on.call(this, event, fn);
  }

  /**
   * Add a callback function to an event that will be triggered once.
   *
   * This method ensures that the callback is executed only the first time the event is triggered.
   *
   * @param {EventType} event - The event to listen to.
   * @param {IObservableCallback} fn - The callback function to execute.
   * @returns {IObservable<EventType>} The observable object.
   *
   * @example
   * ```typescript
   * observable.finally("dataProcessed", () => {
   *   console.log("Data has been processed.");
   * });
   * ```
   */
  finally(event: EventType, fn: IObservableCallback): IObservable<EventType> {
    return this._observable.finally.call(this, event, fn);
  }

  /**
   * Removes the given `event` listener.
   *
   * If `fn` is provided, this method removes the specific callback function from the event.
   * If `fn` is not provided, it removes all callback functions associated with the event.
   *
   * @param {EventType} event - The event to remove the listener from.
   * @param {IObservableCallback} [fn] - The callback function to remove.
   * @returns {IObservable<EventType>} The observable object.
   *
   * @example
   * ```typescript
   * observable.off("dataReceived", subscription.remove);
   * ```
   */
  off(event: EventType, fn: IObservableCallback): IObservable<EventType> {
    return this._observable.off.call(this, event, fn);
  }

  /**
   * Execute all callback functions that listen to the given `event`.
   *
   * If the last argument is a function, it will be treated as the final callback function
   * to be executed after all other callbacks.
   *
   * @param {EventType} event - The event to trigger.
   * @param {...any[]} args - The arguments to pass to the callback functions.
   * @returns {IObservable<EventType>} The observable object.
   *
   * @example
   * ```typescript
   * observable.trigger("dataReceived", { id: 1, value: "Hello" });
   * ```
   */
  trigger(event: EventType | IObservableAllEventType, ...args: any[]): IObservable<EventType> {
    return this._observable.trigger.call(this, event, ...args);
  }

  /**
   * Remove all event bindings.
   *
   * This method clears all event listeners for the observable object.
   *
   * @returns {IObservable<EventType>} The observable object.
   *
   * @example
   * ```typescript
   * observable.offAll();
   * ```
   */
  offAll(): IObservable<EventType> {
    return this._observable.offAll.call(this);
  }

  /**
   * Listen to the given `event` and execute the `callback` at most once.
   *
   * This method ensures that the callback is executed only once, even if the event is triggered multiple times.
   *
   * @param {EventType} event - The event to listen to.
   * @param {IObservableCallback} fn - The callback function to execute.
   * @returns {{ remove: () => any }} An object with a `remove` method to remove the callback.
   *
   * @example
   * ```typescript
   * const subscription = observable.once("dataLoaded", () => {
   *   console.log("Data has been loaded.");
   * });
   * ```
   */
  once(event: EventType, fn: IObservableCallback): { remove: () => any } {
    return this._observable.once.call(this, event, fn);
  }

  /**
   * Get all event callbacks.
   *
   * This method returns an object with event names as keys and arrays of callback functions as values.
   *
   * @returns {IObservableCallbacks<EventType>} An object with event names as keys and arrays of callback functions as values.
   *
   * @example
   * ```typescript
   * const callbacks = observable.getEventCallBacks();
   * console.log(callbacks);
   * ```
   */
  getEventCallBacks(): IObservableCallbacks<EventType> {
    return this._observable.getEventCallBacks.call(this);
  }
}

/**
 * Checks if the given object is an observable element.
 *
 * An object is considered observable if it implements the IObservable interface and has
 * the following properties and methods:
 * - `_____isObservable` set to `true`
 * - `on` method
 * - `trigger` method
 * - `off` method
 *
 * @param {any} obj - The object to check.
 * @returns {boolean} `true` if the object is observable, `false` otherwise.
 *
 * @example
 * ```typescript
 * const observable = new ObservableClass();
 * console.log(isObservable(observable)); // true
 *
 * const nonObservable = {};
 * console.log(isObservable(nonObservable)); // false
 * ```
 */
export function isObservable(obj: any): boolean {
  /**
   * Check if the object is null or undefined, or if it's a primitive type (string, boolean, number).
   * If so, return false immediately.
   */
  if (!obj || ["string", "boolean", "number"].includes(typeof obj)) return false;
  try {
    /**
     * Check if the object has the required properties and methods.
     * If any of these checks fail, the object is not observable.
     */
    return obj?._____isObservable === true && typeof obj?.on === "function" && typeof obj?.trigger === "function" && typeof obj?.off === "function";
  } catch (e) {
    /**
     * If an error occurs during the checks, return false.
     */
  }
  return false;
}
