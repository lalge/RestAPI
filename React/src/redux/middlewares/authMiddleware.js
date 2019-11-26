
import { call, put, takeEvery } from 'redux-saga/effects'
import dataService from "../../services/dataService";
import { getNotificationAction } from '../actions/notificationActions';
import { getLoginAction } from "../actions/authActions";
import authService from "../../services/authService";

function* AuthenticationUser(action)
{
    try 
    {
        yield put( getNotificationAction("Logging In") ); 
  
        //Calling REST API using the Data Service
        const loggedInUser = yield call(
            authService.login,
            action.params.user
        )

        console.dir(loggedInUser);

        // var action = getDatapointEnd(existingDatapoints);
        // yield put(action); // TO REDUCER

        // Reset notification Message
        yield put( getNotificationAction("Authentication Successfull") ); 

        //TODO: Redirection from "/login" to "/"
        window.location.pathname = "/";
    }
    catch (ex) 
    {
        console.log(ex);
        yield put( getNotificationAction("Authentication Failed") );
    }
}

export default function* authMiddleware() {

    yield takeEvery(
        "AUTHENTICATION_LOGIN",
        AuthenticationUser
    );
}
