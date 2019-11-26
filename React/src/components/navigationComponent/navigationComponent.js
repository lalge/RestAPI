import React from "react";
import {Link} from "react-router-dom";


function NavigationComponent()
{
    return(
        <>
        <nav>
            <ul>
                <li>
                    <Link to="/">Home</Link>
                </li>
                <li>
                    <Link to="/datapoints">Datapoints</Link>
                </li>
                <li>
                    <Link to="/analytics">Analytics</Link>
                </li>
            </ul>
        </nav>
        </>
    );
}

export default NavigationComponent;