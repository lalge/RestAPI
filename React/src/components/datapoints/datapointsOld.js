import React from "react";
import { DataPointsList } from "../datapointsList/datapointsLists"
import DataService from "../../services/dataService"
import DataPointsEntry from "../datapointsEntry/datapointsEntry";
import DataPointsEntryUntrolled from "../datapointsEntry/datapointsEntryUncontrolled";

// functional components , stateless
function DataPointsOld(props) {

    console.dir(props.children);
    const header = props.children;


    function handelAdd(dataPoint)
    {
        DataService.saveDataPoints(dataPoint);

    }
    return (
        <>
            {header.props.children[0]}
            <DataPointsList datapoints={DataService.getDataPoints()} />
            <DataPointsEntryUntrolled onAdd={handelAdd}/>
        </>
    );
}

export default DataPointsOld; //default export