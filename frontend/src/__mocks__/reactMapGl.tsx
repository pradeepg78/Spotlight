/**
 * Test stub for react-map-gl.
 *
 * The real package ships ESM-only with subpath exports that CRA's Jest
 * transform cannot parse. Rendering tests only need the children to appear,
 * so every export renders a plain div.
 */
import React from 'react';

type StubProps = { children?: React.ReactNode };

const Stub = ({ children }: StubProps) => <div>{children}</div>;

export default Stub;
export const Marker = Stub;
export const Popup = Stub;
export const NavigationControl = Stub;
export const Layer = Stub;
export const Source = Stub;
