
function getNotificationAction(message)
{
    const actionObj = 
    {
        type : "NOTIFICATION_RAISE",
        params : 
        {
            notificationMessage : message
        }
    }

    return actionObj;
}

export{getNotificationAction}