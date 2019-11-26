
function getLoginAction(userModel)
{
    const actionObj = 
    {
        type : "AUTHENTICATION_LOGIN",
        params : 
        {
            user : userModel
        }
    }

    return actionObj;
}

export { getLoginAction }