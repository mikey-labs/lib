import { bindEventListener, unbindEventListener } from "../useEventListener/EventListener";
import { isSupportPostMessage } from "../utils";
import { EventBus } from "./EventBus";
import { EventOptions, MessageOptions } from "./Types";

export function useEventDispatch(eventName: string, data: any, options?: EventOptions) {
    const { target = window, origin = "*" } = options || {};
    const eventObj: MessageOptions = {
        _event: eventName,
        data,
    };
    if (!isSupportPostMessage) {
        target.postMessage(eventObj, origin);
    } else {
        const polyfillTarget = window as any;
        if (!polyfillTarget._PostMessagePolyfill) {
            polyfillTarget._PostMessagePolyfill = new EventBus();
        }
        polyfillTarget._PostMessagePolyfill.broadcastState(eventObj);
    }
}
export function useEventObserver(
    eventName: string,
    callback: (data: any, event?: MessageEvent) => void,
    options?: EventOptions
): {
    stop: Function;
} {
    const { target = window, origin } = options || {};
    if (!isSupportPostMessage) {
        function handler(event: MessageEvent) {
            const { data: eventData = {}, origin: eventOrigin } = event;
            const { _event, data } = eventData;
            if (eventName === _event && ((origin && origin === eventOrigin) || !origin)) {
                callback.call(target, data, event);
            }
        }
        bindEventListener(target, "message", handler);
        return {
            stop: function () {
                unbindEventListener(target, "message", handler);
            },
        };
    } else {
        const polyfillTarget = window as any;
        if (!polyfillTarget._PostMessagePolyfill) {
            polyfillTarget._PostMessagePolyfill = new EventBus();
        }
        const uuid = polyfillTarget._PostMessagePolyfill.bindEventListener(eventName, callback);
        return {
            stop: polyfillTarget._PostMessagePolyfill.stop.bind(polyfillTarget._PostMessagePolyfill, uuid),
        };
    }
}
