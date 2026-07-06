// jsdom doesn't provide TextEncoder/TextDecoder (needed by react-router)
import { TextEncoder, TextDecoder } from 'util';

if (typeof globalThis.TextEncoder === 'undefined') {
    globalThis.TextEncoder = TextEncoder;
    globalThis.TextDecoder = TextDecoder;
}
