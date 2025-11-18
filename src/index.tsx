import { createRoot } from "react-dom/client";
import { useMemo } from "react";
import { GlobalStyles } from "@contentful/f36-components";
import { SDKProvider, useSDK } from "@contentful/react-apps-toolkit";

import { locations, init } from '@contentful/app-sdk';
import LocalhostWarning from "./components/LocalhostWarning";
import ConfigScreen from "./locations/ConfigScreen";
import Sidebar from "./locations/Sidebar";
import Page from "./locations/Page";

const container = document.getElementById("root");
const root = createRoot(container!);

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_ENTRY_SIDEBAR]: Sidebar,
  [locations.LOCATION_PAGE]: Page,
};

const App = () => {
  const sdk = useSDK();

  const Component = useMemo(() => {
    for (const [location, component] of Object.entries(ComponentLocationSettings)) {
      if (sdk.location.is(location)) {
        return component;
      }
    }
  }, [sdk.location]);

  return Component ? <Component /> : null;
};

if (process.env.NODE_ENV === "development" && window.self === window.top) {
  root.render(<LocalhostWarning />);
} else {
  root.render(
    <SDKProvider>
      <GlobalStyles />
      <App />
    </SDKProvider>
  );
}
