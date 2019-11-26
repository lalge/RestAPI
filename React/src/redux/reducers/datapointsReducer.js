
//store.notification

function handleDatapointsGetEnd(state=[],action)
{
    // state.push(action);

    // Concept of Immutables
    state = 
    [
        /* ...state, */
        ...action.params.datapoints
    ];

    return state;
}

function handleDatapointsAddEnd(state=[],action)
{
    // Concept of Immutables
    state = 
    [
        ...state,
        action.params.datapoint // Newly Added Datapoint Object
    ];

    return state;
}

function datapoints(state=[],action)
{
    switch(action.type)
    {
        case "DATAPOINTS_GET_END": 
            return handleDatapointsGetEnd(state,action);
        case "DATAPOINTS_ADD_END": 
            return handleDatapointsAddEnd(state,action);
        default : return state;
    }
}

export { datapoints }