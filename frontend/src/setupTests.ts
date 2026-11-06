// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder } from 'util';

// jsdom (Jest 27 de react-scripts) no define TextEncoder/TextDecoder y la cadena
// jspdf -> fast-png -> iobuffer los necesita al importarse. Sin este polyfill,
// cualquier test que monte <App /> (que arrastra ReportsDashboard) falla con
// "ReferenceError: TextEncoder is not defined".
type EncoderGlobals = {
  TextEncoder?: typeof NodeTextEncoder;
  TextDecoder?: typeof NodeTextDecoder;
};

const encoderGlobals = globalThis as unknown as EncoderGlobals;

if (!encoderGlobals.TextEncoder) {
  encoderGlobals.TextEncoder = NodeTextEncoder;
}

if (!encoderGlobals.TextDecoder) {
  encoderGlobals.TextDecoder = NodeTextDecoder;
}
