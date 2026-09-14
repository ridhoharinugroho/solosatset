// @vitest-environment jsdom
import React, { act } from "react";
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReactContainer } from "../../src/components/common/ReactContainer";
import { StatusBadge } from "../../src/components/common/StatusBadge";
import { mountReactElement, unmountReactElement } from "../../src/ui/mountReact";

describe("React + TypeScript Foundation", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("harus me-render ReactContainer dengan children & className yang tepat", () => {
    render(
      <ReactContainer className="custom-class" id="test-container">
        <span>React Content</span>
      </ReactContainer>
    );

    expect(screen.getByText("React Content")).not.toBeNull();
    const containerEl = document.querySelector(".sopaloka-react-container");
    expect(containerEl?.classList.contains("custom-class")).toBe(true);
  });

  it("harus me-render StatusBadge dengan varian warna dan label", () => {
    render(<StatusBadge label="Aktif" variant="success" />);

    const badge = screen.getByText("Aktif");
    expect(badge).not.toBeNull();
    expect(badge.className).toContain("bg-emerald-100");
  });

  it("harus mount dan unmount React element secara aman lewat mountReactElement", async () => {
    document.body.innerHTML = '<div id="unmount-root"></div>';
    const container = document.getElementById("unmount-root")!;

    await act(async () => {
      mountReactElement(container, <StatusBadge label="TestMount" />);
    });
    expect(container.textContent).toContain("TestMount");

    await act(async () => {
      const unmounted = unmountReactElement(container);
      expect(unmounted).toBe(true);
    });
    expect(container.textContent).toBe("");
  });
});
