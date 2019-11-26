
//For Middleware
function getDatapointStart()
{
    const actionObj = 
    {
        type : "DATAPOINTS_GET_START",
        params : 
        {
        }
    }

    return actionObj;
}

// For Reducer
function getDatapointEnd(data)
{
    const actionObj = 
    {
        type : "DATAPOINTS_GET_END",
        params : 
        {
            datapoints : data
        }
    }

    return actionObj;
}

function saveDatapointStart(datapoint)
{
    const actionObj = 
    {
        type : "DATAPOINTS_ADD_START",
        params : 
        {
            datapoint : datapoint
        }
    }

    return actionObj;
}

function saveDatapointEnd(datapoint)
{
    const actionObj = 
    {
        type : "DATAPOINTS_ADD_END",
        params : 
        {
            datapoint : datapoint
        }
    }

    return actionObj;
}

export { getDatapointStart, getDatapointEnd, saveDatapointStart, saveDatapointEnd }