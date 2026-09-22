import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Without this, DOM from one test's render() lingers into the next in the
// same file, and a query that matches an element repeated across renders
// (like a shared button label) starts throwing "multiple elements found".
afterEach(() => {
  cleanup();
});
