import React from "react";
import { connect } from "react-redux";

function mapStateToProps(state)// Complete Store
{
    return{
        notifcationText : state.notification
    };
}

function mapDispatchToProps(dispatch)
{
    return {

    };
}

var connectFn = connect(mapStateToProps,mapDispatchToProps);

const ReduxNotification = connectFn(
    (props) => 
    {
        return(
            <div className="app-notification">
                <b>
                    {
                        props.notifcationText
                    }
                </b>
            </div>
        );
    }
)
export default ReduxNotification;