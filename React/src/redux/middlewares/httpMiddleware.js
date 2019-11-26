
import { call, put, takeEvery } from 'redux-saga/effects'
import dataService from "../../services/dataService";
import { getNotificationAction } from '../actions/notificationActions';
import { getDatapointEnd, saveDatapointEnd} from "../actions/datapointsActions";


function* GetDataPointsFromServer(action)
{
    try 
    {
        yield put( getNotificationAction("Fetching Datapoint...") ); 
        // store.DISPATCH(action)

        //Calling REST API using the Data Service
        const existingDatapoints = yield call(
            dataService.getDataPoints, //    dataService.getDataPoints.call() 
            {} // Params
        )

        console.dir(existingDatapoints);

        var action = getDatapointEnd(existingDatapoints);
        yield put(action); // TO REDUCER

        // Reset notification Message
        yield put( getNotificationAction("") ); 
    }
    catch (ex) 
    {
        console.log(ex);
        yield put( getNotificationAction("Error occured while fetching customers!") );
    }
}

function* AddDataPointToServer(action)
{
    try 
    {
        yield put( getNotificationAction("Saving Datapoint...") ); 
        
        const addedDatapoint = yield call(
            dataService.saveDataPoint, //    dataService.getDataPoints.call() 
            action.params.datapoint
        )

        yield put( saveDatapointEnd(addedDatapoint) ); // TO REDUCER

        yield put( getNotificationAction("") ); 
    }
    catch (ex) 
    {
        console.log(ex);
        yield put( getNotificationAction("Error occured while fetching customers!") );
    }
}



export default function* httpMiddleware() {

    yield takeEvery(
        "DATAPOINTS_GET_START",
        GetDataPointsFromServer
    );

    yield takeEvery(
        "DATAPOINTS_ADD_START",
        AddDataPointToServer
    );
}
