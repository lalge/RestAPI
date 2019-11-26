import React from "react";
import { Route } from "react-router-dom";
import SecuredRoute from './securedRoute';
import AnalyticsComponent from "../components/analyticsComponent/analyticsComponent";
import DataPointsContainer from "../redux/containers/datapointsContainer";

const AppRoutes = 
(
    <>
        
        <SecuredRoute 
            exact
            path="/datapoints"
            component={DataPointsContainer}
        />

        <SecuredRoute 
            exact
            path="/analytics"
            component={AnalyticsComponent}
        />
    </>
);

export default AppRoutes;