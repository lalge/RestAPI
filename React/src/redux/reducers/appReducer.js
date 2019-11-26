import { combineReducers } from "redux";
import { notification } from "./notificaionReducer";
import {datapoints} from "./datapointsReducer";

const appReducers = combineReducers(
    {
        notification, 
        datapoints
    }
)

export default appReducers;