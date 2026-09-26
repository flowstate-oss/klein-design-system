import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  useViewState,
  resolveInitialViewState,
  type ViewState,
} from "../packages/table/src/view-state";
import { SharedFiltersProvider } from "../packages/table/src/shared-filters";
import type { ReactNode } from "react";
const config = {
  viewId: "test",
  defaultSortBy: "name",
  defaultGroupBy: "none",
  defaultVisibleProperties: ["team", "cost"],
};
describe("table state application boundary", () => {
  it("restores supplied preferences and persists presentation changes through a callback", () => {
    const onPersist = vi.fn();
    const { result } = renderHook(() =>
      useViewState({
        ...config,
        initialState: {
          visibleProperties: ["team"],
          knownProperties: ["team", "cost"],
        },
        onPersist,
      }),
    );
    expect(result.current.state.visibleProperties).toEqual(["team"]);
    expect(onPersist).not.toHaveBeenCalled();
    act(() => result.current.setVisibleProperties(["cost"]));
    expect(onPersist).toHaveBeenLastCalledWith(
      "test",
      expect.objectContaining({
        visibleProperties: ["cost"],
        knownProperties: ["cost", "team"],
      }),
    );
  });
  it("keeps column sizing out of the query snapshot", () => {
    const onStateChange = vi.fn();
    const { result } = renderHook(() =>
      useViewState({ ...config, onStateChange }),
    );
    const previous = result.current.externalState;
    act(() => result.current.setColumnSizing({ team: 240 }));
    expect(result.current.externalState).toBe(previous);
    expect(result.current.externalState).not.toHaveProperty("columnSizing");
  });
  it("applies locks over stored, cleared and saved-view values", () => {
    const { result } = renderHook(() =>
      useViewState({
        ...config,
        lockedFilters: { team: ["allowed"] },
        initialState: { filters: { team: ["old"] } },
      }),
    );
    act(() => result.current.setFilter("team", ["other"]));
    expect(result.current.state.filters.team).toEqual(["allowed"]);
    act(() => result.current.applySavedView({ filters: { team: ["other"] } }));
    expect(result.current.state.filters.team).toEqual(["allowed"]);
    act(() => result.current.clearFilters());
    expect(result.current.state.filters.team).toEqual(["allowed"]);
  });
  it("shares owned filters and leaves per-view filters local", () => {
    const setFilter = vi.fn();
    const value = {
      scope: "workspace",
      keys: ["team"],
      filters: { team: ["platform"] },
      setFilter,
      clear: vi.fn(),
    };
    const { result } = renderHook(() => useViewState(config), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <SharedFiltersProvider value={value}>{children}</SharedFiltersProvider>
      ),
    });
    expect(result.current.externalState.filters.team).toEqual(["platform"]);
    act(() => result.current.setFilter("team", ["design"]));
    expect(setFilter).toHaveBeenCalledWith("team", ["design"]);
    act(() => result.current.setFilter("status", ["open"]));
    expect(result.current.externalState.filters.status).toEqual(["open"]);
  });
  it("surfaces newly configured default columns without unhiding deliberately hidden ones", () => {
    const defaults = {
      sortBy: "name",
      sortDir: "asc",
      groupBy: "none",
      filters: {},
      visibleProperties: ["team", "cost", "forecast"],
      displayMode: "list",
      expandedGroups: {},
      page: 1,
      pageSize: 50,
      groupPages: {},
      timelineDateField: "",
    } satisfies ViewState;
    expect(
      resolveInitialViewState({
        defaults,
        persisted: {
          visibleProperties: ["team"],
          knownProperties: ["team", "cost"],
        },
        defaultVisibleProperties: defaults.visibleProperties,
      }).visibleProperties,
    ).toEqual(["team", "forecast"]);
  });
});
