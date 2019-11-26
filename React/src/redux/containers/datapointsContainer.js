import React from "react";
import { connect } from "react-redux";
import { DataPointsList } from '../../components/datapointsList/datapointsList';
import DataPointsEntry from '../../components/datapointsEntry/datapointsEntry';
import { saveDatapointStart, getDatapointStart } from "../actions/datapointsActions";

function mapStateToProps(state) // STORE
{
    return {
        datapoints : state.datapoints
    };
}

function mapDispatchToProps(dispatch)
{
    dispatch(getDatapointStart());
   
    return {
        onDatapointAdd : function(param)
        {
            //TODO
            console.dir(param);
            dispatch( saveDatapointStart(param.data) )
        }
    };
}

const connectFn = connect(mapStateToProps,mapDispatchToProps);

const DatapointsContainer = connectFn(
    function onConnect(props)
    { 
        return(
            <>
                <DataPointsList datapoints={ props.datapoints }/>
                <DataPointsEntry onAdd={props.onDatapointAdd}/>
            </>
        );
    }
);

export default DatapointsContainer;

