
//store.notification

function handleNotificationRaise(state,action)
{
    // Change in State
    console.dir(arguments);
    state = action.params.notificationMessage;
    return state;
}


function notification(state="",action)
{
    switch(action.type)
    {
        case "NOTIFICATION_RAISE": return handleNotificationRaise(state,action) 
        default : return state;
    }
}

export {notification}