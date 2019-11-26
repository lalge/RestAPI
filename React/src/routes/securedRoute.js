import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import authService from "../services/authService";

const SecuredRoute = (
    { 
        component: Component, 
        ...rest 
    }
) => 
{
    return(   
        <Route 
            {...rest} 
            render={
                (props) => 
                {
                    return(
                        authService.isUserAuthentication() === true
                        ? <Component {...props} />
                        : <Redirect to='/login' />
                    )
                }
            } 
        />
    )    
}


export default SecuredRoute;
