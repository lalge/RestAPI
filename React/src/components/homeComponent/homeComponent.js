import React from "react";
import NavigationComponent from "../navigationComponent/navigationComponent";
import { BrowserRouter } from "react-router-dom";

function HomeComponent()
{
    return(
        <>
         <h2>
             Future Bridge
         </h2>
         <NavigationComponent/>
         
         </>
    );
}

export default HomeComponent;