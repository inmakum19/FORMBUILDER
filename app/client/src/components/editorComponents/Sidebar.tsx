import React, {
  memo,
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import classNames from "classnames";
import history from "utils/history";
import * as Sentry from "@sentry/react";
import { PanelStack } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";

import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { AppState } from "reducers";
import {
  getFirstTimeUserOnboardingComplete,
  getIsFirstTimeUserOnboardingEnabled,
} from "selectors/onboardingSelectors";
import Explorer from "pages/Editor/Explorer";
import Switcher from "components/ads/Switcher";
import { trimQueryString } from "utils/helpers";
import { BUILDER_PAGE_URL } from "constants/routes";
import AppComments from "comments/AppComments/AppComments";
import {
  setExplorerActiveAction,
  setExplorerPinnedAction,
} from "actions/explorerActions";
import {
  getExplorerActive,
  getExplorerPinned,
} from "selectors/explorerSelector";
import { tailwindLayers } from "constants/Layers";
import TooltipComponent from "components/ads/Tooltip";
import { previewModeSelector } from "selectors/editorSelectors";
import useHorizontalResize from "utils/hooks/useHorizontalResize";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import { ReactComponent as PinIcon } from "assets/icons/ads/double-arrow-left.svg";
import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";
import OnboardingStatusbar from "pages/Editor/FirstTimeUserOnboarding/Statusbar";
import { createMessage, ENTITY_EXPLORER_TITLE } from "constants/messages";

type Props = {
  width: number;
  onWidthChange?: (width: number) => void;
  onDragEnd?: () => void;
};

export const EntityExplorerSidebar = memo((props: Props) => {
  let tooltipTimeout: number;
  const dispatch = useDispatch();
  const active = useSelector(getExplorerActive);
  const pageId = useSelector(getCurrentPageId);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pinned = useSelector(getExplorerPinned);
  const isPreviewMode = useSelector(previewModeSelector);
  const applicationId = useSelector(getCurrentApplicationId);
  const enableFirstTimeUserOnboarding = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const resizer = useHorizontalResize(
    sidebarRef,
    props.onWidthChange,
    props.onDragEnd,
  );
  const switches = [
    {
      id: "explorer",
      text: "Explorer",
      action: () => dispatch(forceOpenWidgetPanel(false)),
    },
    {
      id: "widgets",
      text: "Widgets",
      action: () => {
        !(
          trimQueryString(
            BUILDER_PAGE_URL({
              applicationId,
              pageId,
            }),
          ) === window.location.pathname
        ) &&
          history.push(
            BUILDER_PAGE_URL({
              applicationId,
              pageId,
            }),
          );
        setTimeout(() => dispatch(forceOpenWidgetPanel(true)), 0);
        if (isFirstTimeUserOnboardingEnabled) {
          dispatch(toggleInOnboardingWidgetSelection(true));
        }
      },
    },
  ];
  const [activeSwitch, setActiveSwitch] = useState(switches[0]);
  const [tooltipIsOpen, setTooltipIsOpen] = useState(false);
  const isForceOpenWidgetPanel = useSelector(
    (state: AppState) => state.ui.onBoarding.forceOpenWidgetPanel,
  );
  const isFirstTimeUserOnboardingComplete = useSelector(
    getFirstTimeUserOnboardingComplete,
  );
  PerformanceTracker.startTracking(PerformanceTransactionName.SIDE_BAR_MOUNT);
  useEffect(() => {
    PerformanceTracker.stopTracking();
  });

  useEffect(() => {
    if (isForceOpenWidgetPanel) {
      setActiveSwitch(switches[1]);
    } else {
      setActiveSwitch(switches[0]);
    }
  }, [isForceOpenWidgetPanel]);

  // registering event listeners
  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [active, pinned, resizer.resizing]);

  /**
   * passing the event to touch move on mouse move
   *
   * @param event
   */
  const onMouseMove = (event: MouseEvent) => {
    const eventWithTouches = Object.assign({}, event, {
      touches: [{ clientX: event.clientX, clientY: event.clientY }],
    });
    onTouchMove(eventWithTouches);
  };

  /**
   * calculate the new width based on the pixel moved
   *
   * @param event
   */
  const onTouchMove = (
    event:
      | TouchEvent
      | (MouseEvent & { touches: { clientX: number; clientY: number }[] }),
  ) => {
    const currentX = event.touches[0].clientX;

    // only calculate the following in unpin mode
    if (!pinned) {
      if (active) {
        // if user cursor is out of the entity explorer width ( with some extra window = 20px ), make the
        // entity explorer inactive. Also, 20px here is to increase the window in which a user can drag the resizer
        if (currentX >= props.width + 20 && !resizer.resizing) {
          dispatch(setExplorerActiveAction(false));
        }
      } else {
        // check if user cursor is at extreme left when the explorer is inactive, if yes, make the explorer active
        if (currentX <= 5) {
          dispatch(setExplorerActiveAction(true));
        }
      }
    }
  };

  /**
   * toggles the pinned state of sidebar
   */
  const onPin = useCallback(() => {
    dispatch(setExplorerPinnedAction(!pinned));
  }, [pinned, dispatch, setExplorerPinnedAction]);

  /**
   * on hover of resizer, show tooltip
   */
  const onHoverResizer = useCallback(() => {
    tooltipTimeout = setTimeout(() => {
      setTooltipIsOpen(true);
    }, 250);
  }, [setTooltipIsOpen]);

  /**
   * on hover end of resizer, hide tooltip
   */
  const onHoverEndResizer = useCallback(() => {
    clearTimeout(tooltipTimeout);
    setTooltipIsOpen(false);
  }, [setTooltipIsOpen]);

  /**
   * resizer left position
   */
  const resizerLeft = useMemo(() => {
    return !pinned && !active ? 0 : props.width;
  }, [pinned, active, props.width]);

  return (
    <div
      className={classNames({
        [`js-entity-explorer t--entity-explorer transform transition-all flex h-full  duration-400 border-r border-gray-200 ${tailwindLayers.entityExplorer}`]: true,
        "relative ": pinned && !isPreviewMode,
        "-translate-x-full": (!pinned && !active) || isPreviewMode,
        "shadow-xl": !pinned,
        fixed: !pinned || isPreviewMode,
      })}
    >
      {/* SIDEBAR */}
      <div
        className="flex flex-col p-0 overflow-y-auto bg-white t--sidebar min-w-48 max-w-96 group"
        ref={sidebarRef}
        style={{ width: props.width }}
      >
        {(enableFirstTimeUserOnboarding ||
          isFirstTimeUserOnboardingComplete) && <OnboardingStatusbar />}
        {/* ENTITY EXPLORE HEADER */}
        <div className="sticky top-0 flex items-center justify-between px-3 py-3 z-1">
          <h3 className="flex items-center text-sm font-medium text-gray-800 uppercase min-h-7">
            {createMessage(ENTITY_EXPLORER_TITLE)}
          </h3>
          <div
            className={classNames({
              "items-center transition-all duration-300 transform ": true,
              "opacity-0 pointer-events-none scale-50": pinned === false,
              "opacity-0 scale-100 group-hover:opacity-100": pinned,
            })}
          >
            <TooltipComponent
              content={
                <div className="flex items-center justify-between">
                  <span>Close sidebar</span>
                  <span className="ml-4 text-xs text-gray-300">Ctrl + /</span>
                </div>
              }
            >
              <button
                className="p-2 hover:bg-warmGray-100 group t--unpin-entity-explorer"
                onClick={onPin}
                type="button"
              >
                <PinIcon className="w-3 h-3 text-trueGray-500" />
              </button>
            </TooltipComponent>
          </div>
        </div>
        {/* SWITCHER */}
        <div className="px-3 mt-1 mb-3">
          <Switcher activeObj={activeSwitch} switches={switches} />
        </div>
        <PanelStack
          className="flex-grow"
          initialPanel={{
            component: Explorer,
          }}
          showPanelHeader={false}
        />
        <AppComments />
      </div>
      {/* RESIZER */}
      <div
        className={`absolute w-2 h-full -mr-1 ${tailwindLayers.resizer} group cursor-ew-resize`}
        onMouseDown={resizer.onMouseDown}
        onMouseEnter={onHoverResizer}
        onMouseLeave={onHoverEndResizer}
        onTouchEnd={resizer.onMouseUp}
        onTouchStart={resizer.onTouchStart}
        style={{
          left: resizerLeft,
          display: isPreviewMode ? "none" : "initial",
        }}
      >
        <div
          className={classNames({
            "w-1 h-full bg-transparent group-hover:bg-gray-300 transform transition flex items-center": true,
            "bg-blue-500": resizer.resizing,
          })}
        >
          <TooltipComponent
            content={
              <div className="flex items-center justify-between">
                <span>Drag to resize</span>
              </div>
            }
            hoverOpenDelay={200}
            isOpen={tooltipIsOpen && !resizer.resizing}
            position="right"
          >
            <div />
          </TooltipComponent>
        </div>
      </div>
    </div>
  );
});

EntityExplorerSidebar.displayName = "EntityExplorerSidebar";

export default Sentry.withProfiler(EntityExplorerSidebar);
