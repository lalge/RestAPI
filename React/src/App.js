import React from 'react';
import DataPoints from "./components/datapoints/datapoints";
import Notification from "./components/notification/notification";

//Redux
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import appReducer from "./redux/reducers/appReducer";
import { getNotificationAction } from "./redux/actions/notificationActions";
import ReduxNotification from "./redux/containers/reduxNotification";

import AppRoutes from "./routes/appRoutes";

//Middlewares
import createSagaMiddleware from 'redux-saga';
import httpMiddleware from "./redux/middlewares/httpMiddleware";
import { getDatapointStart } from './redux/actions/datapointsActions';
import DatapointsContainer from './redux/containers/datapointsContainer';

// Redux Dev Tools
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly';

import { BrowserRouter } from "react-router-dom";
import LoginContainer from './redux/containers/loginContainer';
import { Route } from "react-router-dom";
import HomeComponent from './components/homeComponent/homeComponent';
import authMiddleware from './redux/middlewares/authMiddleware';
import SecuredRoute from './routes/securedRoute';

const composeEnhancers = composeWithDevTools(
  {
    //  options like actionSanitizer, stateSanitizer
  }
);

const appMiddleware = createSagaMiddleware();
const enhancers = applyMiddleware(appMiddleware);
const reduxEnhancers = composeEnhancers(enhancers)

var appStore = createStore(
  appReducer, // reducers
  //enhancers// middlewares
  reduxEnhancers
);

appMiddleware.run(httpMiddleware);
appMiddleware.run(authMiddleware);

appStore.dispatch(getNotificationAction("Application Started"));
// appStore.dispatch(getDatapointStart());

function App() {
  var timeStamp = new Date().toLocaleTimeString();

  return (
    <Provider store={appStore}>

      <BrowserRouter>
        <h1>
          React App
        </h1>
        <time>
          {
            timeStamp
          }
        </time>
        <ReduxNotification />
        <Notification />
        <SecuredRoute
          exact
          path="/"
          component={HomeComponent}
        />
        
        <Route 
            exact
            path="/login"
            component={LoginContainer}
        />
        {AppRoutes}
      </BrowserRouter>
        
    </Provider>
  );
}

export default App;
